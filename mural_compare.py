import json
import math
import os
import sys

import cv2
import numpy as np


def imread_unicode(path):
    data = np.fromfile(path, dtype=np.uint8)
    image = cv2.imdecode(data, cv2.IMREAD_COLOR)
    if image is None:
        raise RuntimeError(f"Could not load image: {path}")
    return image


def imwrite_unicode(path, image):
    ext = os.path.splitext(path)[1] or ".png"
    ok, buffer = cv2.imencode(ext, image)
    if not ok:
        raise RuntimeError(f"Could not write image: {path}")
    buffer.tofile(path)


def fit_to_max(image, max_dim=1800):
    height, width = image.shape[:2]
    scale = min(1.0, max_dim / max(height, width))
    if scale == 1.0:
        return image, 1.0
    size = (max(1, int(width * scale)), max(1, int(height * scale)))
    return cv2.resize(image, size, interpolation=cv2.INTER_AREA), scale


def normalize_gray(image):
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    gray = cv2.GaussianBlur(gray, (3, 3), 0)
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
    return clahe.apply(gray)


def align_to_base(base, compare):
    base_gray = normalize_gray(base)
    compare_gray = normalize_gray(compare)

    orb = cv2.ORB_create(nfeatures=6000, scaleFactor=1.2, nlevels=8)
    kp1, des1 = orb.detectAndCompute(base_gray, None)
    kp2, des2 = orb.detectAndCompute(compare_gray, None)

    if des1 is None or des2 is None or len(kp1) < 12 or len(kp2) < 12:
        resized = cv2.resize(compare, (base.shape[1], base.shape[0]), interpolation=cv2.INTER_AREA)
        return resized, {"aligned": False, "method": "resize", "matches": 0}

    matcher = cv2.BFMatcher(cv2.NORM_HAMMING, crossCheck=True)
    matches = matcher.match(des1, des2)
    matches = sorted(matches, key=lambda item: item.distance)
    matches = matches[: min(500, len(matches))]

    if len(matches) < 12:
        resized = cv2.resize(compare, (base.shape[1], base.shape[0]), interpolation=cv2.INTER_AREA)
        return resized, {"aligned": False, "method": "resize", "matches": len(matches)}

    src = np.float32([kp2[m.trainIdx].pt for m in matches]).reshape(-1, 1, 2)
    dst = np.float32([kp1[m.queryIdx].pt for m in matches]).reshape(-1, 1, 2)
    matrix, inliers = cv2.findHomography(src, dst, cv2.RANSAC, 4.0)

    if matrix is None:
        resized = cv2.resize(compare, (base.shape[1], base.shape[0]), interpolation=cv2.INTER_AREA)
        return resized, {"aligned": False, "method": "resize", "matches": len(matches)}

    aligned = cv2.warpPerspective(
        compare,
        matrix,
        (base.shape[1], base.shape[0]),
        flags=cv2.INTER_LINEAR,
        borderMode=cv2.BORDER_REPLICATE,
    )
    inlier_count = int(inliers.sum()) if inliers is not None else 0
    return aligned, {"aligned": True, "method": "homography", "matches": len(matches), "inliers": inlier_count}


def adaptive_edges(gray, sensitivity):
    median = float(np.median(gray))
    sigma = max(0.12, min(0.45, 0.34 - sensitivity * 0.012))
    low = int(max(0, (1.0 - sigma) * median))
    high = int(min(255, (1.0 + sigma) * median))
    if high <= low:
        low, high = 40, 120

    edges = cv2.Canny(gray, low, high, L2gradient=True)
    kernel = np.ones((2, 2), np.uint8)
    return cv2.morphologyEx(edges, cv2.MORPH_CLOSE, kernel, iterations=1)


def build_region_crop(base, compare, x, y, w, h, pad=16):
    height, width = base.shape[:2]
    x1 = max(0, x - pad)
    y1 = max(0, y - pad)
    x2 = min(width, x + w + pad)
    y2 = min(height, y + h + pad)
    left = base[y1:y2, x1:x2]
    right = compare[y1:y2, x1:x2]
    spacer = np.full((left.shape[0], 10, 3), 245, dtype=np.uint8)
    return np.hstack([left, spacer, right])


def overlap_ratio(inner, outer):
    ix, iy, iw, ih = inner[:4]
    ox, oy, ow, oh = outer[:4]
    x1 = max(ix, ox)
    y1 = max(iy, oy)
    x2 = min(ix + iw, ox + ow)
    y2 = min(iy + ih, oy + oh)
    if x2 <= x1 or y2 <= y1:
        return 0.0
    intersection = (x2 - x1) * (y2 - y1)
    inner_area = max(1, iw * ih)
    return intersection / inner_area


def remove_nested_regions(candidates):
    if not candidates:
        return []

    candidates = sorted(candidates, key=lambda item: item[4])
    keep = []

    for candidate in candidates:
        cx, cy, cw, ch, carea, cmask = candidate
        candidate_is_parent = False

        for kept in keep:
            kx, ky, kw, kh, karea, kmask = kept
            if carea <= karea:
                continue
            contains_kept = overlap_ratio(kept, candidate) > 0.82
            much_larger = carea > karea * 2.2 or (cw * ch) > (kw * kh) * 2.2
            if contains_kept and much_larger:
                candidate_is_parent = True
                break

        if candidate_is_parent:
            continue

        keep = [
            kept
            for kept in keep
            if not (
                overlap_ratio(kept, candidate) > 0.92
                and kept[4] < candidate[4] * 0.35
                and kept[5] < candidate[5] * 0.35
            )
        ]
        keep.append(candidate)

    return sorted(keep, key=lambda item: item[5], reverse=True)


def compare_mural(base_path, compare_path, out_dir, sensitivity=5, min_area=280, max_regions=80):
    os.makedirs(out_dir, exist_ok=True)

    base = imread_unicode(base_path)
    compare = imread_unicode(compare_path)
    base, scale = fit_to_max(base)
    compare, _ = fit_to_max(compare)
    aligned_compare, align_info = align_to_base(base, compare)

    base_gray = normalize_gray(base)
    compare_gray = normalize_gray(aligned_compare)

    base_edges = adaptive_edges(base_gray, sensitivity)
    compare_edges = adaptive_edges(compare_gray, sensitivity)

    tolerance = max(1, int(2 + sensitivity * 0.35))
    tol_kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (tolerance * 2 + 1, tolerance * 2 + 1))
    base_near = cv2.dilate(base_edges, tol_kernel, iterations=1)
    compare_near = cv2.dilate(compare_edges, tol_kernel, iterations=1)

    missing_after = cv2.bitwise_and(base_edges, cv2.bitwise_not(compare_near))
    new_after = cv2.bitwise_and(compare_edges, cv2.bitwise_not(base_near))
    diff = cv2.bitwise_or(missing_after, new_after)

    clean_kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (3, 3))
    diff = cv2.morphologyEx(diff, cv2.MORPH_OPEN, clean_kernel, iterations=1)
    group_kernel_size = max(9, int(12 + sensitivity * 2))
    group_kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (group_kernel_size, group_kernel_size))
    grouped = cv2.dilate(diff, group_kernel, iterations=1)

    count, labels, stats, _ = cv2.connectedComponentsWithStats(grouped, connectivity=8)
    image_area = base.shape[0] * base.shape[1]
    max_area = image_area * 0.20
    candidates = []

    for label in range(1, count):
        x, y, w, h, area = stats[label]
        if area < min_area or area > max_area:
            continue
        mask_area = int(np.count_nonzero(diff[y : y + h, x : x + w]))
        if mask_area < max(20, min_area * 0.08):
            continue
        candidates.append((x, y, w, h, int(area), mask_area))

    candidates = remove_nested_regions(candidates)
    candidates = candidates[:max_regions]

    overlay = cv2.addWeighted(base, 0.56, aligned_compare, 0.44, 0)
    red = np.zeros_like(overlay)
    red[:, :, 2] = 255
    diff_dilated = cv2.dilate(diff, np.ones((3, 3), np.uint8), iterations=1)
    overlay = np.where(diff_dilated[:, :, None] > 0, cv2.addWeighted(overlay, 0.45, red, 0.55, 0), overlay)

    regions = []
    for index, (x, y, w, h, area, mask_area) in enumerate(candidates, start=1):
        cv2.rectangle(overlay, (x, y), (x + w, y + h), (0, 190, 255), 2)
        label = str(index)
        cv2.rectangle(overlay, (x, max(0, y - 22)), (x + 34, y), (0, 190, 255), -1)
        cv2.putText(overlay, label, (x + 5, max(15, y - 6)), cv2.FONT_HERSHEY_SIMPLEX, 0.52, (20, 20, 20), 2)

        crop_name = f"region-{index:03d}.png"
        crop = build_region_crop(base, aligned_compare, x, y, w, h)
        imwrite_unicode(os.path.join(out_dir, crop_name), crop)
        regions.append(
            {
                "id": index,
                "x": int(x),
                "y": int(y),
                "w": int(w),
                "h": int(h),
                "area": int(area),
                "edgePixels": int(mask_area),
                "cropUrl": crop_name,
            }
        )

    edge_preview = np.hstack([
        cv2.cvtColor(base_edges, cv2.COLOR_GRAY2BGR),
        np.full((base_edges.shape[0], 8, 3), 245, dtype=np.uint8),
        cv2.cvtColor(compare_edges, cv2.COLOR_GRAY2BGR),
    ])

    imwrite_unicode(os.path.join(out_dir, "mural-overlay.png"), overlay)
    imwrite_unicode(os.path.join(out_dir, "mural-base.png"), base)
    imwrite_unicode(os.path.join(out_dir, "mural-diff-mask.png"), diff)
    imwrite_unicode(os.path.join(out_dir, "mural-edges.png"), edge_preview)
    imwrite_unicode(os.path.join(out_dir, "mural-aligned-compare.png"), aligned_compare)

    diff_pixels = int(np.count_nonzero(diff))
    return {
        "match": len(regions) == 0,
        "reason": "pattern-diff" if regions else "pattern-match",
        "diffCount": diff_pixels,
        "diffPercentage": round(diff_pixels * 100.0 / image_area, 4),
        "regions": regions,
        "regionCount": len(regions),
        "scale": scale,
        "alignment": align_info,
        "outputs": {
            "base": "mural-base.png",
            "overlay": "mural-overlay.png",
            "mask": "mural-diff-mask.png",
            "edges": "mural-edges.png",
            "alignedCompare": "mural-aligned-compare.png",
        },
    }


def main():
    if len(sys.argv) < 4:
        raise SystemExit("Usage: mural_compare.py <base> <compare> <out_dir> [sensitivity] [min_area] [max_regions]")

    base_path = sys.argv[1]
    compare_path = sys.argv[2]
    out_dir = sys.argv[3]
    sensitivity = int(sys.argv[4]) if len(sys.argv) > 4 else 5
    min_area = int(sys.argv[5]) if len(sys.argv) > 5 else 280
    max_regions = int(sys.argv[6]) if len(sys.argv) > 6 else 120

    result = compare_mural(
        base_path,
        compare_path,
        out_dir,
        sensitivity=sensitivity,
        min_area=min_area,
        max_regions=max_regions,
    )
    print(json.dumps(result, ensure_ascii=False))


if __name__ == "__main__":
    main()
