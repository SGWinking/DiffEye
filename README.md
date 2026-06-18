# DiffEye | 重明 | 图像比对工具

**CHONGMING | DiffEye**  
Created by **SGWinking / 上官文卿**

DiffEye 是一个本地图像审图与比对工具，用于检查两张图片之间的线条、轮廓、纹样、结构与像素差异。它适合修复前后图、图纸、设计稿、扫描图、纹样图、效果图等视觉审查场景。  
DiffEye is a local visual review and comparison tool for checking linework, contours, patterns, structure, and pixel-level differences between two images.

## 缘起 / Origin

DiffEye 起源于山西大云禅院的壁画修复工作，其中有大量需要比对 AI 生成图像和原始图像区别的任务。如果纯用人力会非常耗时，所以我们制作了这个小工具进行比对，大大减轻了人类的工作负担，也为接下来的修复工作提供了很好的工具支持。

DiffEye originated from mural restoration work at Dayun Chanyuan in Shanxi, China. The project required many comparisons between AI-generated images and original images. Manual review would have been extremely time-consuming, so this tool was created to reduce the review burden and support subsequent restoration work.

## 重明之意 / Why ChongMing

“重明”取自重明鸟的意象。重明鸟双目明察，有辨微察异之意。DiffEye 借这个名字表达一种工具定位：不是替人做最终判断，而是把细微差异照出来，让审图者更快、更稳地复核。

“ChongMing” refers to the mythical Chongming bird, associated with clear sight and careful discernment. DiffEye does not replace human judgment; it highlights subtle visual differences so reviewers can inspect them faster and more reliably.

## 功能 / Features

- 结构比对：关注线条、轮廓、纹样和结构差异。
- 像素比对：用于严格的像素级图片差异检查。
- 自动对齐：通过 homography 对齐修复前后或版本前后的图片。
- 前后滑块：直接拖动图中滑块查看两图差别。
- 透明度叠加：调整后图透明度，叠加观察变化。
- 结构差异图：显示差异点和编号变化区域。
- 区域列表：点击定位，双击放大局部差异。
- 可调参数：灵敏度、最小区域、检测数量。
- 历史记录：可从最近上传过的图片中重新选择。
- 本地运行：图片留在本机，不需要上传云端。

## 小白快速使用 / Quick Start

### 1. 安装必需软件 / Install prerequisites

请先安装：

- [Node.js LTS](https://nodejs.org/)
- [Python 3.10+](https://www.python.org/downloads/)

安装 Python 时建议勾选：

```text
Add python.exe to PATH
```

### 2. 一键安装基础依赖 / Install dependencies

下载 DiffEye 后，双击：

```text
install.bat
```

它会安装：

- npm dependencies from `package.json`
- Python packages: `opencv-python`, `pillow`, `numpy`

### 3. 启动工具 / Start DiffEye

双击：

```text
start-tool.bat
```

浏览器会打开：

```text
http://localhost:5055
```

如果浏览器没有自动打开，请手动访问这个地址。

## DexiNed 精细线条模式 / Optional DexiNed Fine Line Mode

默认模式是 **快速 Canny**，不需要额外模型，安装后即可使用。如果你想用 AI 边缘检测增强细线识别，可以启用 **精细 DexiNed** 模式。

The default mode is **Fast Canny** and does not require any model files. For AI-assisted fine edge detection, enable the optional **DexiNed** mode.

### 一键配置 / One-click setup

双击运行：

```text
setup-dexined.bat
```

它会自动：

- clone the official DexiNed repository into `third_party/DexiNed`
- install Python packages: `torch`, `torchvision`, `opencv-python`, `pillow`, `numpy`, `matplotlib`, `kornia`, `h5py`
- create the checkpoint folder:

```text
third_party/DexiNed/checkpoints/BIPED/10/
```

### 需要下载的模型 / Model to download

DexiNed 官方 README 提供的测试权重是 **Checkpoint Pytorch**。请从官方仓库 README 的 Google Drive 链接下载，也可以直接打开：

```text
https://drive.google.com/file/d/1V56vGTsu7GYiQouCIKvTWl5UKCZ6yCNu/view?usp=sharing
```

下载后放到：

```text
D:\DIFF\third_party\DexiNed\checkpoints\BIPED\10\10_model.pth
```

官方 README 没有标注精确文件大小。它是边缘检测 checkpoint，通常不是数 GB 级模型；下载完成后可用下面命令查看实际大小：

```powershell
Get-Item D:\DIFF\third_party\DexiNed\checkpoints\BIPED\10\10_model.pth |
  Select-Object Name,@{Name='SizeMB';Expression={[math]::Round($_.Length/1MB,2)}}
```

### 使用方式 / How to use

启动 DiffEye 后，在“线条模式”里选择：

```text
精细 DexiNed
```

如果没有放入 `10_model.pth`，网页会提示需要先配置 DexiNed 权重。

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
- “结构比对”适合线条、纹样、轮廓检查。
- “像素差异”适合截图、渲染图、完全一致性检查。
- “精细 DexiNed”适合更重视细线、轮廓和弱边缘的图像，但需要额外模型权重。

## 目录说明 / Project Layout

```text
public/                  Frontend files
server.js                Local Node.js server
mural_compare.py         OpenCV structure-comparison pipeline
dexined_edges.py         Optional DexiNed edge runner
install.bat              One-click basic dependency installer
setup-dexined.bat        Optional DexiNed setup helper
start-tool.bat           One-click launcher
LICENSE                  MIT License
THIRD_PARTY_NOTICES.md   Third-party dependency notices
```

## License

MIT License. See [LICENSE](LICENSE).

## Third-Party Dependencies

DiffEye uses third-party open-source packages installed through package managers. Their source code is not copied into this repository.

- `odiff-bin`, MIT License, installed by npm for pixel comparison.
- `express`, MIT License, installed by npm for the local web server.
- `multer`, MIT License, installed by npm for local image upload handling.
- `opencv-python`, Apache-2.0 License, installed by pip for alignment and edge processing.
- `pillow`, HPND License, installed by pip as an image-processing dependency.
- `numpy`, BSD-3-Clause License, installed by pip for image array processing.
- Optional `DexiNed`, MIT License, cloned by `setup-dexined.bat` when the user enables fine line mode.

See [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).

## 作者 / Author

**SGWinking / 上官文卿**
