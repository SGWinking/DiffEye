import json
import math
import os
import subprocess
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


def dexined_edges(image, out_dir, name, sensitivity):
    input_path = os.path.join(out_dir, f"{name}-dexined-input.png")
    output_path = os.path.join(out_dir, f"{name}-dexined-edge.png")
    imwrite_unicode(input_path, image)

    runner = os.path.join(os.path.dirname(os.path.abspath(__file__)), "dexined_edges.py")
    completed = subprocess.run(
        [sys.executable, runner, input_path, output_path],
        cwd=os.path.dirname(os.path.abspath(__file__)),
        capture_output=True,
        text=True,
        timeout=300,
    )
    if completed.returncode != 0:
        raise RuntimeError(completed.stderr or completed.stdout or "DexiNed edge extraction failed.")

    edge = imread_unicode(output_path)
    edge = cv2.cvtColor(edge, cv2.COLOR_BGR2GRAY)
    if edge.shape[:2] != image.shape[:2]:
        edge = cv2.resize(edge, (image.shape[1], image.shape[0]), interpolation=cv2.INTER_AREA)

    keep_percent = max(3.0, min(16.0, 3.5 + float(sensitivity) * 1.15))
    threshold = np.percentile(edge, 100.0 - keep_percent)
    binary = np.where(edge >= threshold, 255, 0).astype(np.uint8)
    kernel = np.ones((2, 2), np.uint8)
    return cv2.morphologyEx(binary, cv2.MORPH_OPEN, kernel, iterations=1)


def extract_edges(image, gray, sensitivity, edge_method, out_dir, name):
    if edge_method == "dexined":
        return dexined_edges(image, out_dir, name, sensitivity)
    return adaptive_edges(gray, sensitivity)


def build_region_crop(base, compare, diff_view, x, y, w, h, pad=16):
    height, width = base.shape[:2]
    x1 = max(0, x - pad)
    y1 = max(0, y - pad)
    x2 = min(width, x + w + pad)
    y2 = min(height, y + h + pad)
    left = base[y1:y2, x1:x2]
    right = compare[y1:y2, x1:x2]
    diff = diff_view[y1:y2, x1:x2]
    spacer = np.full((left.shape[0], 10, 3), 245, dtype=np.uint8)
    return np.hstack([left, spacer, right, spacer, diff])


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


def compare_mural(
    base_path,
    compare_path,
    out_dir,
    sensitivity=5,
    min_area=280,
    max_regions=80,
    edge_method="canny",
    max_area_percent=45,
    tolerance_pixels=6,
):
    os.makedirs(out_dir, exist_ok=True)

    base = imread_unicode(base_path)
    compare = imread_unicode(compare_path)
    base, scale = fit_to_max(base)
    compare, _ = fit_to_max(compare)
    aligned_compare, align_info = align_to_base(base, compare)

    base_gray = normalize_gray(base)
    compare_gray = normalize_gray(aligned_compare)

    edge_method = edge_method if edge_method in {"canny", "dexined"} else "canny"
    base_edges = extract_edges(base, base_gray, sensitivity, edge_method, out_dir, "base")
    compare_edges = extract_edges(aligned_compare, compare_gray, sensitivity, edge_method, out_dir, "compare")

    tolerance = max(1, min(30, int(round(float(tolerance_pixels)))))
    tol_kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (tolerance * 2 + 1, tolerance * 2 + 1))
    base_near = cv2.dilate(base_edges, tol_kernel, iterations=1)
    compare_near = cv2.dilate(compare_edges, tol_kernel, iterations=1)

    missing_after = cv2.bitwise_and(base_edges, cv2.bitwise_not(compare_near))
    new_after = cv2.bitwise_and(compare_edges, cv2.bitwise_not(base_near))
    exact_overlap = cv2.bitwise_and(base_edges, compare_edges)

    shift_min = max(2, int(round(tolerance * 0.45)))
    compare_distance = cv2.distanceTransform(cv2.bitwise_not(compare_edges), cv2.DIST_L2, 3)
    base_distance = cv2.distanceTransform(cv2.bitwise_not(base_edges), cv2.DIST_L2, 3)
    base_shift_candidate = cv2.bitwise_and(cv2.bitwise_and(base_edges, compare_near), cv2.bitwise_not(exact_overlap))
    compare_shift_candidate = cv2.bitwise_and(cv2.bitwise_and(compare_edges, base_near), cv2.bitwise_not(exact_overlap))
    base_shifted = np.where((base_shift_candidate > 0) & (compare_distance >= shift_min), 255, 0).astype(np.uint8)
    compare_shifted = np.where((compare_shift_candidate > 0) & (base_distance >= shift_min), 255, 0).astype(np.uint8)
    shifted = cv2.bitwise_or(base_shifted, compare_shifted)

    clean_kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (3, 3))
    missing_after = cv2.morphologyEx(missing_after, cv2.MORPH_OPEN, clean_kernel, iterations=1)
    new_after = cv2.morphologyEx(new_after, cv2.MORPH_OPEN, clean_kernel, iterations=1)
    shifted = cv2.morphologyEx(shifted, cv2.MORPH_OPEN, clean_kernel, iterations=1)
    diff = cv2.bitwise_or(cv2.bitwise_or(missing_after, new_after), shifted)
    diff = cv2.morphologyEx(diff, cv2.MORPH_OPEN, clean_kernel, iterations=1)
    if edge_method == "dexined":
        group_kernel_size = max(5, int(6 + sensitivity))
    else:
        group_kernel_size = max(9, int(12 + sensitivity * 2))
    group_kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (group_kernel_size, group_kernel_size))
    grouped = cv2.dilate(diff, group_kernel, iterations=1)

    count, labels, stats, _ = cv2.connectedComponentsWithStats(grouped, connectivity=8)
    image_area = base.shape[0] * base.shape[1]
    max_area_percent = max(1, min(95, float(max_area_percent)))
    max_area = image_area * (max_area_percent / 100.0)
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

    overlay_base = cv2.addWeighted(base, 0.56, aligned_compare, 0.44, 0)
    overlay = overlay_base.copy()

    def paint_mask(image, mask, color, alpha=0.62):
        color_layer = np.zeros_like(image)
        color_layer[:, :] = color
        visible_mask = cv2.dilate(mask, np.ones((3, 3), np.uint8), iterations=1)
        painted = cv2.addWeighted(image, 1 - alpha, color_layer, alpha, 0)
        return np.where(visible_mask[:, :, None] > 0, painted, image)

    def transparent_layer(mask, color, alpha=180):
        layer = np.zeros((mask.shape[0], mask.shape[1], 4), dtype=np.uint8)
        visible_mask = cv2.dilate(mask, np.ones((3, 3), np.uint8), iterations=1)
        layer[visible_mask > 0, 0] = color[0]
        layer[visible_mask > 0, 1] = color[1]
        layer[visible_mask > 0, 2] = color[2]
        layer[visible_mask > 0, 3] = alpha
        return layer

    overlay = paint_mask(overlay, shifted, (0, 220, 255), 0.52)
    overlay = paint_mask(overlay, missing_after, (255, 80, 0), 0.62)
    overlay = paint_mask(overlay, new_after, (0, 0, 255), 0.62)
    region_diff_view = overlay.copy()

    regions = []
    for index, (x, y, w, h, area, mask_area) in enumerate(candidates, start=1):
        cv2.rectangle(overlay, (x, y), (x + w, y + h), (0, 190, 255), 2)
        label = str(index)
        cv2.rectangle(overlay, (x, max(0, y - 22)), (x + 34, y), (0, 190, 255), -1)
        cv2.putText(overlay, label, (x + 5, max(15, y - 6)), cv2.FONT_HERSHEY_SIMPLEX, 0.52, (20, 20, 20), 2)

        crop_name = f"region-{index:03d}.png"
        crop = build_region_crop(base, aligned_compare, region_diff_view, x, y, w, h)
        imwrite_unicode(os.path.join(out_dir, crop_name), crop)
        new_pixels = int(np.count_nonzero(new_after[y : y + h, x : x + w]))
        missing_pixels = int(np.count_nonzero(missing_after[y : y + h, x : x + w]))
        shifted_pixels = int(np.count_nonzero(shifted[y : y + h, x : x + w]))
        density = round(mask_area * 100.0 / max(1, w * h), 2)
        regions.append(
            {
                "id": index,
                "x": int(x),
                "y": int(y),
                "w": int(w),
                "h": int(h),
                "area": int(area),
                "edgePixels": int(mask_area),
                "newPixels": new_pixels,
                "missingPixels": missing_pixels,
                "shiftedPixels": shifted_pixels,
                "density": density,
                "cropUrl": crop_name,
            }
        )

    edge_preview = np.hstack([
        cv2.cvtColor(base_edges, cv2.COLOR_GRAY2BGR),
        np.full((base_edges.shape[0], 8, 3), 245, dtype=np.uint8),
        cv2.cvtColor(compare_edges, cv2.COLOR_GRAY2BGR),
    ])

    imwrite_unicode(os.path.join(out_dir, "mural-overlay.png"), overlay)
    imwrite_unicode(os.path.join(out_dir, "mural-overlay-base.png"), overlay_base)
    imwrite_unicode(os.path.join(out_dir, "mural-layer-new.png"), transparent_layer(new_after, (0, 0, 255), 178))
    imwrite_unicode(os.path.join(out_dir, "mural-layer-missing.png"), transparent_layer(missing_after, (255, 80, 0), 178))
    imwrite_unicode(os.path.join(out_dir, "mural-layer-shifted.png"), transparent_layer(shifted, (0, 220, 255), 150))
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
        "edgeMethod": edge_method,
        "maxAreaPercent": max_area_percent,
        "tolerancePixels": tolerance,
        "outputs": {
            "base": "mural-base.png",
            "overlay": "mural-overlay.png",
            "overlayBase": "mural-overlay-base.png",
            "layerNew": "mural-layer-new.png",
            "layerMissing": "mural-layer-missing.png",
            "layerShifted": "mural-layer-shifted.png",
            "mask": "mural-diff-mask.png",
            "edges": "mural-edges.png",
            "alignedCompare": "mural-aligned-compare.png",
        },
    }


def main():
    if len(sys.argv) < 4:
        raise SystemExit("Usage: mural_compare.py <base> <compare> <out_dir> [sensitivity] [min_area] [max_regions] [edge_method] [max_area_percent] [tolerance_pixels]")

    base_path = sys.argv[1]
    compare_path = sys.argv[2]
    out_dir = sys.argv[3]
    sensitivity = int(sys.argv[4]) if len(sys.argv) > 4 else 5
    min_area = int(sys.argv[5]) if len(sys.argv) > 5 else 280
    max_regions = int(sys.argv[6]) if len(sys.argv) > 6 else 120
    edge_method = sys.argv[7] if len(sys.argv) > 7 else "canny"
    max_area_percent = float(sys.argv[8]) if len(sys.argv) > 8 else 45
    tolerance_pixels = float(sys.argv[9]) if len(sys.argv) > 9 else 6

    result = compare_mural(
        base_path,
        compare_path,
        out_dir,
        sensitivity=sensitivity,
        min_area=min_area,
        max_regions=max_regions,
        edge_method=edge_method,
        max_area_percent=max_area_percent,
        tolerance_pixels=tolerance_pixels,
    )
    print(json.dumps(result, ensure_ascii=False))


if __name__ == "__main__":
    main()
