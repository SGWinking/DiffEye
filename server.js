const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const { execFile } = require("node:child_process");

const express = require("express");
const multer = require("multer");
const { compare } = require("odiff-bin");

const app = express();
const port = Number(process.env.PORT || 5055);
const rootDir = __dirname;
const runsDir = path.join(rootDir, "runs");
const historyPath = path.join(rootDir, "image-history.json");
const pythonPath = process.env.PYTHON310 || process.env.PYTHON || "python";

fs.mkdirSync(runsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const runId = req.runId || crypto.randomUUID();
    req.runId = runId;
    const dir = path.join(runsDir, runId);
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const safeName = file.originalname.replace(/[^\w.\-()\u4e00-\u9fa5]/g, "_");
    const prefix = file.fieldname === "base" ? "base" : "compare";
    cb(null, `${prefix}-${safeName}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 120 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      cb(new Error("只能上传图片文件。"));
      return;
    }
    cb(null, true);
  }
});

function readHistory() {
  try {
    return JSON.parse(fs.readFileSync(historyPath, "utf8"));
  } catch {
    return [];
  }
}

function writeHistory(items) {
  fs.writeFileSync(historyPath, JSON.stringify(items.slice(0, 160), null, 2), "utf8");
}

function isInsideRuns(filePath) {
  const relative = path.relative(runsDir, filePath);
  return relative && !relative.startsWith("..") && !path.isAbsolute(relative);
}

function urlForStoredPath(filePath) {
  const relative = path.relative(runsDir, filePath).split(path.sep).join("/");
  return `/runs/${relative}`;
}

function addToHistory(files) {
  const existing = readHistory();
  const now = new Date().toISOString();
  const next = [];

  for (const file of files) {
    if (!file?.path || !fs.existsSync(file.path) || !isInsideRuns(file.path)) continue;
    next.push({
      id: crypto.randomUUID(),
      name: file.originalname || path.basename(file.path),
      storedName: path.basename(file.path),
      path: file.path,
      url: urlForStoredPath(file.path),
      addedAt: now
    });
  }

  const seen = new Set(next.map((item) => item.path));
  for (const item of existing) {
    if (!item.path || seen.has(item.path) || !fs.existsSync(item.path) || !isInsideRuns(item.path)) continue;
    seen.add(item.path);
    next.push(item);
  }

  writeHistory(next);
}

function resolveHistoryPath(value) {
  if (!value) return null;
  const fullPath = path.resolve(value);
  if (!isInsideRuns(fullPath) || !fs.existsSync(fullPath)) return null;
  return fullPath;
}

function detectImageExtension(filePath) {
  const header = fs.readFileSync(filePath, { encoding: null, flag: "r" }).subarray(0, 12);
  if (header[0] === 0x89 && header[1] === 0x50 && header[2] === 0x4e && header[3] === 0x47) return ".png";
  if (header[0] === 0xff && header[1] === 0xd8 && header[2] === 0xff) return ".jpg";
  if (header.toString("ascii", 0, 4) === "RIFF" && header.toString("ascii", 8, 12) === "WEBP") return ".webp";
  if (
    (header[0] === 0x49 && header[1] === 0x49 && header[2] === 0x2a && header[3] === 0x00) ||
    (header[0] === 0x4d && header[1] === 0x4d && header[2] === 0x00 && header[3] === 0x2a)
  ) {
    return ".tiff";
  }
  return path.extname(filePath).toLowerCase();
}

function normalizeImageExtension(file) {
  const actualExt = detectImageExtension(file.path);
  const currentExt = path.extname(file.path).toLowerCase();
  if (!actualExt || actualExt === currentExt) return file;

  const nextPath = path.join(path.dirname(file.path), `${path.basename(file.path, currentExt)}${actualExt}`);
  fs.renameSync(file.path, nextPath);
  file.path = nextPath;
  file.filename = path.basename(nextPath);
  return file;
}

function runMuralCompare(basePath, comparePath, outDir, sensitivity, minArea, maxRegions) {
  return new Promise((resolve, reject) => {
    const scriptPath = path.join(rootDir, "mural_compare.py");
    execFile(
      pythonPath,
      [scriptPath, basePath, comparePath, outDir, String(sensitivity), String(minArea), String(maxRegions)],
      { cwd: rootDir, timeout: 180000, windowsHide: true, maxBuffer: 1024 * 1024 * 10 },
      (error, stdout, stderr) => {
        if (error) {
          reject(new Error(stderr || stdout || error.message));
          return;
        }
        try {
          resolve(JSON.parse(stdout));
        } catch {
          reject(new Error(`纹样比对结果解析失败：${stdout || stderr}`));
        }
      }
    );
  });
}

app.use(express.static(path.join(rootDir, "public")));
app.use("/runs", express.static(runsDir));

app.get("/history", (req, res) => {
  const items = readHistory().filter((item) => item.path && fs.existsSync(item.path) && isInsideRuns(item.path));
  if (items.length !== readHistory().length) writeHistory(items);
  res.json({ items });
});

app.post(
  "/compare",
  upload.fields([
    { name: "base", maxCount: 1 },
    { name: "compare", maxCount: 1 }
  ]),
  async (req, res, next) => {
    try {
      const uploadedBase = req.files?.base?.[0];
      const uploadedTarget = req.files?.compare?.[0];
      const baseHistoryPath = resolveHistoryPath(req.body.baseHistoryPath);
      const compareHistoryPath = resolveHistoryPath(req.body.compareHistoryPath);

      const base = uploadedBase || (baseHistoryPath ? { path: baseHistoryPath, originalname: path.basename(baseHistoryPath) } : null);
      const target = uploadedTarget || (compareHistoryPath ? { path: compareHistoryPath, originalname: path.basename(compareHistoryPath) } : null);

      if (!base || !target) {
        res.status(400).json({ error: "请同时选择两张图片，或者从历史记录里选择。" });
        return;
      }

      if (uploadedBase) normalizeImageExtension(base);
      if (uploadedTarget) normalizeImageExtension(target);
      addToHistory([base, target]);

      const runId = req.runId || crypto.randomUUID();
      const runDir = path.join(runsDir, runId);
      fs.mkdirSync(runDir, { recursive: true });

      const mode = req.body.mode === "pixel" ? "pixel" : "mural";
      const baseUrl = urlForStoredPath(base.path);
      const compareUrl = urlForStoredPath(target.path);

      if (mode === "mural") {
        const sensitivity = Math.max(1, Math.min(10, Number(req.body.sensitivity || 5)));
        const minArea = Math.max(40, Math.min(5000, Number(req.body.minArea || 280)));
        const maxRegions = Math.max(20, Math.min(300, Number(req.body.maxRegions || 120)));
        const result = await runMuralCompare(base.path, target.path, runDir, sensitivity, minArea, maxRegions);

        res.json({
          mode,
          ...result,
          baseUrl,
          processedBaseUrl: `/runs/${runId}/${result.outputs.base}`,
          compareUrl,
          diffUrl: `/runs/${runId}/${result.outputs.overlay}`,
          maskUrl: `/runs/${runId}/${result.outputs.mask}`,
          edgesUrl: `/runs/${runId}/${result.outputs.edges}`,
          alignedCompareUrl: `/runs/${runId}/${result.outputs.alignedCompare}`,
          regions: result.regions.map((region) => ({
            ...region,
            cropUrl: `/runs/${runId}/${region.cropUrl}`
          }))
        });
        return;
      }

      const diffPath = path.join(runDir, "diff.png");
      const result = await compare(base.path, target.path, diffPath, {
        antialiasing: true,
        diffOverlay: true
      });

      res.json({
        mode,
        ...result,
        baseUrl,
        processedBaseUrl: baseUrl,
        compareUrl,
        alignedCompareUrl: compareUrl,
        diffUrl: fs.existsSync(diffPath) ? `/runs/${runId}/diff.png` : null,
        regions: []
      });
    } catch (error) {
      next(error);
    }
  }
);

app.use((error, req, res, next) => {
  console.error(error);
  res.status(500).json({ error: error.message || "比较失败。" });
});

app.listen(port, () => {
  console.log(`Image comparison tool is running at http://localhost:${port}`);
});
