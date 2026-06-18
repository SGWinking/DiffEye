const form = document.querySelector("#compareForm");
const statusEl = document.querySelector("#status");
const button = document.querySelector("#compareButton");

const baseInput = document.querySelector("#baseInput");
const compareInput = document.querySelector("#compareInput");
const baseName = document.querySelector("#baseName");
const compareName = document.querySelector("#compareName");
const baseDropzone = document.querySelector('[data-dropzone="base"]');
const compareDropzone = document.querySelector('[data-dropzone="compare"]');
const baseHistorySelect = document.querySelector("#baseHistorySelect");
const compareHistorySelect = document.querySelector("#compareHistorySelect");
const baseHistoryPath = document.querySelector("#baseHistoryPath");
const compareHistoryPath = document.querySelector("#compareHistoryPath");
const refreshHistoryButton = document.querySelector("#refreshHistoryButton");
const modebar = document.querySelector(".modebar");
const historyRow = document.querySelector(".history-row");
const metricsPanel = document.querySelector(".metrics");

const beforeImage = document.querySelector("#beforeImage");
const afterImage = document.querySelector("#afterImage");
const afterClip = document.querySelector("#afterClip");
const sliderHandle = document.querySelector("#sliderHandle");
const resultDiff = document.querySelector("#resultDiff");
const boxLayer = document.querySelector("#boxLayer");

const compareStage = document.querySelector("#compareStage");
const diffStage = document.querySelector("#diffStage");
const compareLayer = document.querySelector("#compareLayer");
const diffLayer = document.querySelector("#diffLayer");
const compareZoom = document.querySelector("#compareZoom");
const diffZoom = document.querySelector("#diffZoom");
const compareZoomText = document.querySelector("#compareZoomText");
const diffZoomText = document.querySelector("#diffZoomText");
const compareMaxButton = document.querySelector("#compareMaxButton");
const diffMaxButton = document.querySelector("#diffMaxButton");
const viewModeInputs = document.querySelectorAll('input[name="viewMode"]');
const opacitySlider = document.querySelector("#opacitySlider");
const opacityControl = document.querySelector("#opacityControl");

const matchText = document.querySelector("#matchText");
const diffCount = document.querySelector("#diffCount");
const diffPercent = document.querySelector("#diffPercent");
const alignText = document.querySelector("#alignText");
const countLabel = document.querySelector("#countLabel");
const regionCount = document.querySelector("#regionCount");
const regionList = document.querySelector("#regionList");
const regionPanelTitle = document.querySelector(".change-list h2");
const sensitivity = document.querySelector("#sensitivity");
const sensitivityValue = document.querySelector("#sensitivityValue");
const modal = document.querySelector("#regionModal");
const modalImage = document.querySelector("#modalImage");
const modalClose = document.querySelector("#modalClose");

let currentRegions = [];
let selectedRegionId = null;
let splitValue = 50;
let draggingSplit = false;
let modalScale = 3;
let diffLayerImages = {};
let activeRegionId = null;
const reviewLabels = {
  pass: "通过",
  review: "复核",
  issue: "问题",
  ignore: "忽略"
};

function ensureEdgeMethodControl() {
  if (!modebar || document.querySelector('[name="edgeMethod"]')) return;

  const maxAreaLabel = document.createElement("label");
  maxAreaLabel.className = "number-field";
  maxAreaLabel.innerHTML = `
    最大区域%
    <input name="maxAreaPercent" type="number" min="1" max="95" value="60" title="超过整张图这个比例的差异聚集区会被过滤">
  `;

  const toleranceLabel = document.createElement("label");
  toleranceLabel.className = "number-field";
  toleranceLabel.innerHTML = `
    容错px
    <input name="tolerancePixels" type="number" min="1" max="30" value="10" title="数值越大，越会忽略轻微错位和笔墨边缘变化">
  `;

  const label = document.createElement("label");
  label.className = "number-field";
  label.innerHTML = `
    线条模式
    <select name="edgeMethod" title="DexiNed 需要先运行 setup-dexined.bat 并放入模型权重">
      <option value="canny" selected>快速 Canny</option>
      <option value="dexined">精细 DexiNed</option>
    </select>
  `;

  const maxRegionsInput = modebar.querySelector('input[name="maxRegions"]');
  const maxRegionsLabel = maxRegionsInput?.closest("label");
  if (maxRegionsLabel) {
    maxRegionsLabel.insertAdjacentElement("afterend", toleranceLabel);
    toleranceLabel.insertAdjacentElement("afterend", maxAreaLabel);
    maxAreaLabel.insertAdjacentElement("afterend", label);
  } else {
    modebar.appendChild(toleranceLabel);
    modebar.appendChild(maxAreaLabel);
    modebar.appendChild(label);
  }
}

function compactHistoryAndMetrics() {
  if (historyRow && metricsPanel && metricsPanel.parentElement !== historyRow) {
    historyRow.appendChild(metricsPanel);
  }
}

function applyDefaultParameters() {
  const minAreaInput = form.querySelector('input[name="minArea"]');
  if (minAreaInput && minAreaInput.value === "280") minAreaInput.value = "2048";
}

function ensureDiffLegend() {
  if (document.querySelector(".diff-legend")) return;
  const diffHeader = diffMaxButton?.closest("header");
  const tools = diffHeader?.querySelector(".viewer-tools");
  if (!tools) return;

  const legend = document.createElement("div");
  legend.className = "diff-legend";
  legend.innerHTML = `
    <span><i class="legend-red"></i>新增</span>
    <span><i class="legend-blue"></i>缺失</span>
    <span><i class="legend-yellow"></i>偏移</span>
  `;
  tools.insertAdjacentElement("afterbegin", legend);
}

function ensureDiffLegend() {
  if (document.querySelector(".diff-legend")) return;
  const diffHeader = diffMaxButton?.closest("header");
  const tools = diffHeader?.querySelector(".viewer-tools");
  if (!tools) return;

  const legend = document.createElement("div");
  legend.className = "diff-legend";
  legend.innerHTML = `
    <label><input type="checkbox" data-diff-layer="new" checked><i class="legend-red"></i>新增</label>
    <label><input type="checkbox" data-diff-layer="missing" checked><i class="legend-blue"></i>缺失</label>
    <label><input type="checkbox" data-diff-layer="shifted" checked><i class="legend-yellow"></i>偏移</label>
  `;
  tools.insertAdjacentElement("afterbegin", legend);
  legend.addEventListener("change", updateDiffLayerVisibility);
}

function ensureRegionPanelTitle() {
  if (regionPanelTitle) regionPanelTitle.textContent = "聚焦区域";
}

function reviewStorageKey(id) {
  const base = baseHistoryPath.value || baseInput.files?.[0]?.name || baseName.textContent || "base";
  const compare = compareHistoryPath.value || compareInput.files?.[0]?.name || compareName.textContent || "compare";
  return `diffeeye-review:${base}:${compare}:${id}`;
}

function getRegionReview(id) {
  return localStorage.getItem(reviewStorageKey(id)) || "";
}

function setRegionReview(id, value) {
  if (!id) return;
  localStorage.setItem(reviewStorageKey(id), value);
  renderReviewActions(id);
  updateRegionReviewBadges();
}

function ensureReviewActions() {
  let actions = document.querySelector("#modalReviewActions");
  if (actions) return actions;

  actions = document.createElement("div");
  actions.id = "modalReviewActions";
  actions.className = "modal-review-actions";
  actions.innerHTML = Object.entries(reviewLabels)
    .map(([value, label]) => `<button type="button" data-review="${value}">${label}</button>`)
    .join("");
  actions.addEventListener("click", (event) => {
    const button = event.target.closest("[data-review]");
    if (button) setRegionReview(activeRegionId, button.dataset.review);
  });
  modal.insertBefore(actions, modalImage);
  return actions;
}

function renderReviewActions(id) {
  const actions = ensureReviewActions();
  const current = getRegionReview(id);
  actions.querySelectorAll("[data-review]").forEach((button) => {
    button.classList.toggle("active", button.dataset.review === current);
  });
}

function updateRegionReviewBadges() {
  document.querySelectorAll(".region-card").forEach((card) => {
    const current = getRegionReview(card.dataset.id);
    let badge = card.querySelector(".review-badge");
    if (!current) {
      badge?.remove();
      return;
    }
    if (!badge) {
      badge = document.createElement("span");
      badge.className = "review-badge";
      card.querySelector("div")?.appendChild(badge);
    }
    badge.textContent = reviewLabels[current] || current;
  });
}

function setInputFile(input, file) {
  const files = new DataTransfer();
  files.items.add(file);
  input.files = files.files;
}

function setFileName(input, target) {
  const file = input.files?.[0];
  target.textContent = file ? file.name : "拖入或点击选择";
}

function clearHistoryForInput(input) {
  if (input === baseInput) {
    baseHistorySelect.value = "";
    baseHistoryPath.value = "";
  } else {
    compareHistorySelect.value = "";
    compareHistoryPath.value = "";
  }
}

function bindDropzone(zone, input, nameTarget) {
  zone.addEventListener("dragenter", (event) => {
    event.preventDefault();
    zone.classList.add("dragover");
  });

  zone.addEventListener("dragover", (event) => event.preventDefault());

  zone.addEventListener("dragleave", (event) => {
    if (!zone.contains(event.relatedTarget)) zone.classList.remove("dragover");
  });

  zone.addEventListener("drop", (event) => {
    event.preventDefault();
    zone.classList.remove("dragover");

    const file = [...event.dataTransfer.files].find((item) => item.type.startsWith("image/"));
    if (!file) {
      statusEl.textContent = "请拖入图片文件";
      statusEl.classList.add("error");
      return;
    }

    setInputFile(input, file);
    clearHistoryForInput(input);
    setFileName(input, nameTarget);
    statusEl.textContent = "图片已放入";
    statusEl.classList.remove("error");
  });
}

async function loadHistory() {
  const response = await fetch("/history");
  const { items } = await response.json();
  const options = ['<option value="">选择历史图片</option>']
    .concat(items.map((item) => `<option value="${item.path}">${item.name} | ${item.storedName}</option>`))
    .join("");
  const previousBase = baseHistorySelect.value;
  const previousCompare = compareHistorySelect.value;
  baseHistorySelect.innerHTML = options;
  compareHistorySelect.innerHTML = options;
  baseHistorySelect.value = previousBase;
  compareHistorySelect.value = previousCompare;
}

function useHistory(select, hidden, input, label) {
  hidden.value = select.value;
  input.value = "";
  const optionText = select.selectedOptions[0]?.textContent || "";
  label.textContent = select.value ? optionText.split(" | ")[0] : "拖入或点击选择";
}

function setImage(image, url) {
  image.removeAttribute("src");
  if (url) image.src = `${url}?t=${Date.now()}`;
}

function clearDiffLayers() {
  for (const image of Object.values(diffLayerImages)) image.remove();
  diffLayerImages = {};
}

function setDiffLayers(layers) {
  clearDiffLayers();
  if (!layers) return;

  for (const [name, url] of Object.entries(layers)) {
    const image = document.createElement("img");
    image.className = "diff-overlay-img";
    image.dataset.diffLayerImage = name;
    image.alt = name;
    image.src = `${url}?t=${Date.now()}`;
    diffLayer.insertBefore(image, boxLayer);
    diffLayerImages[name] = image;
  }
  updateDiffLayerVisibility();
}

function updateDiffLayerVisibility() {
  document.querySelectorAll("[data-diff-layer]").forEach((input) => {
    const image = diffLayerImages[input.dataset.diffLayer];
    if (image) image.hidden = !input.checked;
  });
}

function updateSplit() {
  afterClip.style.clipPath = `inset(0 0 0 ${splitValue}%)`;
  sliderHandle.style.left = `${splitValue}%`;
}

function getViewMode() {
  return [...viewModeInputs].find((item) => item.checked)?.value || "split";
}

function updateViewMode() {
  const mode = getViewMode();
  compareLayer.classList.toggle("opacity-mode", mode === "opacity");
  compareLayer.classList.toggle("split-mode", mode === "split");
  opacityControl.hidden = mode !== "opacity";
  afterClip.style.opacity = mode === "opacity" ? String(Number(opacitySlider.value) / 100) : "1";
  updateSplit();
}

function setSplitFromPointer(event) {
  const rect = compareLayer.getBoundingClientRect();
  const x = Math.max(0, Math.min(rect.width, event.clientX - rect.left));
  splitValue = Math.round((x / Math.max(1, rect.width)) * 100);
  updateSplit();
}

function sizeLayerFromImage(stage, layer, image, zoomValue, textTarget) {
  const zoom = Number(zoomValue.value) / 100;
  textTarget.textContent = `${zoomValue.value}%`;
  if (!image.naturalWidth || !image.naturalHeight) return;
  const availableWidth = Math.max(1, stage.clientWidth - 2);
  const availableHeight = Math.max(1, stage.clientHeight - 2);
  const fit = Math.min(availableWidth / image.naturalWidth, availableHeight / image.naturalHeight);
  const scale = fit * zoom;
  layer.style.width = `${Math.max(1, Math.round(image.naturalWidth * scale))}px`;
  layer.style.height = `${Math.max(1, Math.round(image.naturalHeight * scale))}px`;
}

function syncLayerSizes() {
  sizeLayerFromImage(compareStage, compareLayer, beforeImage, compareZoom, compareZoomText);
  sizeLayerFromImage(diffStage, diffLayer, resultDiff, diffZoom, diffZoomText);
  renderBoxes(currentRegions);
}

function toggleMaximized(card) {
  document.querySelectorAll(".viewer-card.maximized").forEach((item) => {
    if (item !== card) item.classList.remove("maximized");
  });
  card.classList.toggle("maximized");
  document.body.classList.toggle("has-maximized-viewer", Boolean(document.querySelector(".viewer-card.maximized")));
  setTimeout(syncLayerSizes, 60);
}

function renderBoxes(regions) {
  boxLayer.textContent = "";
  if (!resultDiff.naturalWidth || !resultDiff.naturalHeight) return;

  for (const region of regions) {
    const box = document.createElement("button");
    box.type = "button";
    box.className = `region-box${region.id === selectedRegionId ? " selected" : ""}`;
    box.dataset.id = String(region.id);
    box.style.left = `${(region.x / resultDiff.naturalWidth) * 100}%`;
    box.style.top = `${(region.y / resultDiff.naturalHeight) * 100}%`;
    box.style.width = `${(region.w / resultDiff.naturalWidth) * 100}%`;
    box.style.height = `${(region.h / resultDiff.naturalHeight) * 100}%`;
    box.addEventListener("click", () => selectRegion(region.id, true));
    box.addEventListener("dblclick", (event) => {
      event.preventDefault();
      selectRegion(region.id, true, true);
      openRegion(region.id);
    });
    boxLayer.appendChild(box);
  }
}

function renderRegions(regions) {
  regionList.textContent = "";
  regionCount.textContent = String(regions.length);
  currentRegions = regions;
  selectedRegionId = null;
  renderBoxes(regions);

  if (!regions.length) {
    const empty = document.createElement("p");
    empty.className = "empty";
    empty.textContent = "没有检测到明显的线条或纹样结构变化。";
    regionList.appendChild(empty);
    return;
  }

  for (const region of regions) {
    const item = document.createElement("button");
    item.type = "button";
    item.className = "region-card";
    item.dataset.id = String(region.id);
    item.innerHTML = `
      <img src="${region.cropUrl}?t=${Date.now()}" alt="区域 ${region.id}">
      <div>
        <strong>#${region.id}</strong>
        <span>尺寸 ${region.w}x${region.h}px</span>
        <span>新增 ${region.newPixels ?? 0} / 缺失 ${region.missingPixels ?? 0}</span>
        <span>偏移 ${region.shiftedPixels ?? 0} / 密度 ${region.density ?? 0}%</span>
      </div>
    `;
    item.addEventListener("click", () => selectRegion(region.id, true));
    item.addEventListener("dblclick", (event) => {
      event.preventDefault();
      item.blur();
      openRegion(region.id);
    });
    regionList.appendChild(item);
  }
  updateRegionReviewBadges();
}

function selectRegion(id, focusDiff, focusList = false) {
  selectedRegionId = id;
  const region = currentRegions.find((item) => item.id === id);
  document.querySelectorAll(".region-card, .region-box").forEach((node) => {
    node.classList.toggle("selected", node.dataset.id === String(id));
  });

  if (focusList) {
    const card = regionList.querySelector(`.region-card[data-id="${id}"]`);
    if (card) card.scrollIntoView({ block: "center", behavior: "smooth" });
  }

  if (!region || !focusDiff || !resultDiff.naturalWidth || !resultDiff.naturalHeight) return;

  const scaleX = diffLayer.clientWidth / resultDiff.naturalWidth;
  const scaleY = diffLayer.clientHeight / resultDiff.naturalHeight;
  diffStage.scrollTo({
    left: Math.max(0, region.x * scaleX - diffStage.clientWidth / 2 + region.w * scaleX / 2),
    top: Math.max(0, region.y * scaleY - diffStage.clientHeight / 2 + region.h * scaleY / 2),
    behavior: "smooth"
  });
}

function openRegion(id) {
  const region = currentRegions.find((item) => item.id === id);
  if (!region) return;
  activeRegionId = id;
  modalScale = 3;
  modalImage.style.width = "";
  modalImage.src = `${region.cropUrl}?t=${Date.now()}`;
  renderReviewActions(id);
  modal.hidden = false;
}

function updateModalZoom() {
  if (!modalImage.naturalWidth) return;
  modalImage.style.width = `${Math.max(1, Math.round(modalImage.naturalWidth * modalScale))}px`;
}

function closeModal() {
  modal.hidden = true;
}

baseInput.addEventListener("change", () => {
  clearHistoryForInput(baseInput);
  setFileName(baseInput, baseName);
});
compareInput.addEventListener("change", () => {
  clearHistoryForInput(compareInput);
  setFileName(compareInput, compareName);
});
baseHistorySelect.addEventListener("change", () => useHistory(baseHistorySelect, baseHistoryPath, baseInput, baseName));
compareHistorySelect.addEventListener("change", () => useHistory(compareHistorySelect, compareHistoryPath, compareInput, compareName));
refreshHistoryButton.addEventListener("click", loadHistory);
sensitivity.addEventListener("input", () => {
  sensitivityValue.textContent = sensitivity.value;
});
compareZoom.addEventListener("input", syncLayerSizes);
diffZoom.addEventListener("input", syncLayerSizes);
beforeImage.addEventListener("load", syncLayerSizes);
resultDiff.addEventListener("load", syncLayerSizes);
window.addEventListener("resize", syncLayerSizes);
compareMaxButton.addEventListener("click", () => toggleMaximized(compareMaxButton.closest(".viewer-card")));
diffMaxButton.addEventListener("click", () => toggleMaximized(diffMaxButton.closest(".viewer-card")));
modalImage.addEventListener("load", updateModalZoom);
modalClose.addEventListener("click", closeModal);
modal.addEventListener("click", (event) => {
  if (event.target === modal) closeModal();
});
modal.addEventListener("wheel", (event) => {
  if (modal.hidden) return;
  event.preventDefault();
  const direction = event.deltaY < 0 ? 1 : -1;
  modalScale = Math.max(0.5, Math.min(8, modalScale + direction * 0.25));
  updateModalZoom();
}, { passive: false });
window.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !modal.hidden) closeModal();
});

for (const input of viewModeInputs) input.addEventListener("change", updateViewMode);
opacitySlider.addEventListener("input", updateViewMode);
sliderHandle.addEventListener("pointerdown", (event) => {
  draggingSplit = true;
  sliderHandle.setPointerCapture(event.pointerId);
  setSplitFromPointer(event);
});
sliderHandle.addEventListener("pointermove", (event) => {
  if (draggingSplit) setSplitFromPointer(event);
});
sliderHandle.addEventListener("pointerup", () => {
  draggingSplit = false;
});
compareStage.addEventListener("pointerdown", (event) => {
  if (getViewMode() !== "split") return;
  if (!compareLayer.contains(event.target)) return;
  draggingSplit = true;
  setSplitFromPointer(event);
});
compareStage.addEventListener("pointermove", (event) => {
  if (draggingSplit && getViewMode() === "split") setSplitFromPointer(event);
});
window.addEventListener("pointerup", () => {
  draggingSplit = false;
});

bindDropzone(baseDropzone, baseInput, baseName);
bindDropzone(compareDropzone, compareInput, compareName);
compactHistoryAndMetrics();
applyDefaultParameters();
ensureEdgeMethodControl();
ensureDiffLegend();
ensureRegionPanelTitle();
updateViewMode();
loadHistory().catch(() => {});

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const data = new FormData(form);

  if (!baseInput.files.length && !baseHistoryPath.value) {
    statusEl.textContent = "请选择第一张图或历史图片";
    statusEl.classList.add("error");
    return;
  }
  if (!compareInput.files.length && !compareHistoryPath.value) {
    statusEl.textContent = "请选择第二张图或历史图片";
    statusEl.classList.add("error");
    return;
  }

  button.disabled = true;
  statusEl.textContent = "比较中";
  statusEl.classList.remove("error");
  renderRegions([]);

  try {
    const response = await fetch("/compare", { method: "POST", body: data });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "比较失败。");

    const isMural = result.mode === "mural";
    setImage(beforeImage, result.processedBaseUrl || result.baseUrl);
    setImage(afterImage, isMural ? result.alignedCompareUrl : result.compareUrl);
    setImage(resultDiff, result.diffBaseUrl || result.diffUrl);
    setDiffLayers(result.diffLayers);

    countLabel.textContent = isMural ? "边缘差异像素" : "差异像素";
    matchText.textContent = result.match ? "未发现明显差异" : "发现差异";
    diffCount.textContent = result.diffCount?.toLocaleString() ?? "-";
    diffPercent.textContent =
      typeof result.diffPercentage === "number" ? `${result.diffPercentage.toFixed(4)}%` : "-";
    alignText.textContent = result.alignment
      ? `${result.alignment.method}${result.alignment.aligned ? " 已对齐" : " 粗对齐"}`
      : "-";

    renderRegions(result.regions || []);
    statusEl.textContent = result.match ? "完成：未发现明显差异" : "完成：发现差异";
    updateViewMode();
    loadHistory().catch(() => {});
  } catch (error) {
    statusEl.textContent = error.message;
    statusEl.classList.add("error");
  } finally {
    button.disabled = false;
  }
});
