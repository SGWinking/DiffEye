# DiffEye | 重明 | 图像比对工具

**CHONGMING | DiffEye**  
Created by **SGWinking / 上官文卿**

DiffEye 是一个本地图像审图与比对工具，用于检查两张图片之间的线条、轮廓、纹样、结构与像素差异。它适合修复前后图、图纸、设计稿、扫描图、纹样图、效果图等视觉审校场景。

DiffEye is a local visual review and comparison tool for checking linework, contours, patterns, structure, and pixel-level differences between two images. It is useful for restoration review, drawings, design drafts, scanned images, pattern images, and visual QA workflows.

## 缘起 / Origin

DiffEye 起源于山西大云禅院的壁画修复工作。项目中有大量任务需要比对 AI 生成图像与原始图像之间的差别，如果完全依赖人力逐张审看，会非常耗时。因此我们制作了这个小工具，用于辅助比对线条、轮廓、纹样、结构与像素差异，减轻人工审校负担，也为后续修复工作提供更稳定的工具支持。

DiffEye originated from the mural restoration work at Dayun Chanyuan in Shanxi, China. The project involved many tasks that required comparing AI-generated images with original images. Reviewing every image pair manually would have been extremely time-consuming, so this tool was created to assist with comparing linework, contours, patterns, structure, and pixel-level differences. It reduces the burden of manual review and provides practical support for subsequent restoration work.

## 重明之意 / Why ChongMing

“重明”取自重明鸟的意象。重明鸟双目明察，有辨微察异之意。DiffEye 借这个名字表达一种工具定位：不是替人做最终判断，而是把细微的差异照出来，让审图者更快、更稳地复核。

“ChongMing” refers to the mythical Chongming bird, associated with clear sight and careful discernment. DiffEye does not replace human judgment; it highlights subtle visual differences so reviewers can inspect them faster and more reliably.

## 功能 / Features

- 结构比对：关注线条、轮廓、纹样和结构差异。
- 像素比对：用于严格的像素级图片差异检查。
- 自动对齐：通过 homography 对齐修复前后或版本前后的图片。
- 前后滑块：直接拖动图中滑块查看两图差别。
- 透明度叠加：调整后图透明度，叠加观察变化。
- 结构差异图：显示红色差异点和编号变化区域。
- 区域列表：点击定位，双击放大局部差异。
- 可调参数：灵敏度、最小区域、检测数量。
- 历史记录：可从最近上传过的图片中重新选择。
- 本地运行：图片留在本机，不需要上传云端。

- Structure comparison for linework, contours, patterns, and visual structure.
- Pixel comparison for strict image difference checks.
- Automatic homography alignment.
- Before/after split view.
- Opacity overlay comparison.
- Structure-difference map with numbered regions.
- Clickable and zoomable change-region list.
- Adjustable sensitivity, minimum region size, and detection count.
- Local image history picker.
- Runs locally; images stay on your machine.

## 小白快速使用 / Quick Start for Beginners

### 1. 安装必需软件 / Install prerequisites

请先安装：

Please install:

- [Node.js LTS](https://nodejs.org/)
- [Python 3.10+](https://www.python.org/downloads/)

安装 Python 时建议勾选：

When installing Python, enable:

```text
Add python.exe to PATH
```

### 2. 一键安装依赖 / One-click dependency install

下载 DiffEye 后，双击：

After downloading DiffEye, double-click:

```text
install.bat
```

它会安装：

It installs:

- npm dependencies from `package.json`
- Python packages: `opencv-python`, `pillow`, `numpy`

### 3. 启动工具 / Start DiffEye

双击：

Double-click:

```text
start-tool.bat
```

浏览器会打开：

The browser opens:

```text
http://localhost:5055
```

如果浏览器没有自动打开，请手动访问这个地址。

If the browser does not open automatically, visit the URL manually.

## 手动命令 / Manual Commands

```powershell
npm install
python -m pip install opencv-python pillow numpy
npm start
```

Then open:

```text
http://localhost:5055
```

## 使用建议 / Usage Tips

- 如果误报太多，先把“最小区域”调大，比如 `600`、`1000`。
- 如果漏检细线，把“灵敏度”调高，比如 `6-8`。
- 如果需要更多候选区域，把“检测数量”调高，范围是 `20-300`。
- “结构比对”适合线条/纹样/轮廓检查。
- “像素差异”适合截图、渲染图、完全一致性检查。

- Increase “minimum region size” if there are too many false positives.
- Increase “sensitivity” if thin lines are missed.
- Increase “detection count” for more candidate regions. Range: `20-300`.
- Use structure comparison for linework, patterns, and contours.
- Use pixel comparison for screenshots, renders, and strict equality checks.

## 目录说明 / Project Layout

```text
public/                  Frontend files
server.js                Local Node.js server
mural_compare.py         OpenCV structure-comparison pipeline
install.bat              One-click dependency installer
start-tool.bat           One-click launcher
LICENSE                  MIT License
THIRD_PARTY_NOTICES.md   Third-party dependency notices
```

## 开源协议 / License

MIT License. See [LICENSE](LICENSE).

## 第三方依赖 / Third-Party Dependencies

DiffEye uses third-party open-source packages installed through package managers. Their source code is not copied into this repository.

DiffEye 使用通过包管理器安装的第三方开源依赖，本仓库不复制这些依赖源码。

- `odiff-bin`, MIT License, installed by npm for pixel comparison.
- `express`, MIT License, installed by npm for the local web server.
- `multer`, MIT License, installed by npm for local image upload handling.
- `opencv-python`, Apache-2.0 License, installed by pip for alignment and edge processing.
- `pillow`, HPND License, installed by pip as an image-processing dependency.
- `numpy`, BSD-3-Clause License, installed by pip for image array processing.

See [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).

## 作者 / Author

**SGWinking / 上官文卿**
