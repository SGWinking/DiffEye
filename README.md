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
LICENSE                  AGPL-3.0 License
THIRD_PARTY_NOTICES.md   Third-party dependency notices
```

## License

GNU Affero General Public License v3.0. See [LICENSE](LICENSE).

DiffEye is released under AGPL-3.0 so that public network-service versions also
share their corresponding source code.

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

## 详细部署教程 / Detailed Setup Guide

### Windows 本地部署 / Windows Local Setup

1. 安装 Node.js LTS  
   下载地址：[https://nodejs.org/](https://nodejs.org/)

2. 安装 Python 3.10 或更高版本  
   下载地址：[https://www.python.org/downloads/](https://www.python.org/downloads/)  
   安装时建议勾选：

```text
Add python.exe to PATH
```

3. 下载 DiffEye 源码  
   可以在 GitHub 页面点击 `Code -> Download ZIP`，也可以使用：

```powershell
git clone https://github.com/SGWinking/DiffEye.git
cd DiffEye
```

4. 安装基础依赖  
   双击运行：

```text
install.bat
```

   或手动执行：

```powershell
npm install
python -m pip install opencv-python pillow numpy
```

5. 启动 DiffEye  
   双击运行：

```text
start-tool.bat
```

   或手动执行：

```powershell
npm start
```

6. 打开浏览器访问：

```text
http://localhost:5055
```

### DexiNed 精细线条模式部署 / DexiNed Fine Line Setup

DexiNed 是可选功能。不开启 DexiNed 时，DiffEye 仍然可以使用快速 Canny 线条模式。

1. 双击运行：

```text
setup-dexined.bat
```

2. 脚本会自动克隆 DexiNed 官方仓库到：

```text
third_party/DexiNed
```

3. 脚本会安装：

```text
torch
torchvision
opencv-python
pillow
numpy
matplotlib
kornia
h5py
```

4. 手动下载 DexiNed 官方模型：

```text
https://drive.google.com/file/d/1V56vGTsu7GYiQouCIKvTWl5UKCZ6yCNu/view?usp=sharing
```

5. 将模型文件重命名或确认命名为：

```text
10_model.pth
```

6. 放入：

```text
third_party/DexiNed/checkpoints/BIPED/10/10_model.pth
```

7. 重启 DiffEye 后，在页面中选择：

```text
线条模式：精细 DexiNed
```

已测试模型大小约为：

```text
134.53 MB
```

### 常见启动问题 / Troubleshooting

- 页面打不开：确认 `npm start` 或 `start-tool.bat` 已经运行。
- 点击比较没有反应：确认 Python 已安装，并且 `opencv-python pillow numpy` 已安装。
- DexiNed 报错：确认 `10_model.pth` 已放到正确目录。
- 端口冲突：可以设置环境变量 `PORT`，例如：

```powershell
$env:PORT=5060
npm start
```

## 详细使用教程 / Detailed Usage Guide

### 1. 选择图片

页面顶部有两张图片输入：

```text
第一张图：通常放原图、修复前图、基准图
第二张图：通常放生成图、修复后图、待检查图
```

可以拖入图片，也可以点击选择文件。上传过的图片会进入历史记录，方便重复选择。

### 2. 选择比对方式

DiffEye 当前主要有两种比对：

```text
结构比对：适合壁画、纹样、图纸、线条、轮廓审查
像素差异：适合截图、渲染图、严格像素一致性检查
```

### 3. 参数说明

```text
灵敏度
控制线条提取敏感程度。越高越容易抓到细线，也越容易误报。

最小区域
单位是像素面积。小于这个面积的差异聚集区不会生成聚焦区域。
当前推荐默认值：2048。

检测数量
最多显示多少个聚焦区域。数量越大，显示越多。

容错px
允许两张图的线条有多少像素以内的轻微偏移。
数值越大，越会忽略修复笔墨造成的小错位。
当前推荐默认值：10。

最大区域%
超过整张图该比例的超大差异聚集区会被过滤。
当前推荐默认值：60。

线条模式
快速 Canny：速度快，适合常规结构审查。
精细 DexiNed：AI 边缘检测，适合复杂线条，但需要额外模型。
```

推荐起步参数：

```text
灵敏度：5
最小区域：2048
检测数量：120
容错px：10
最大区域%：60
线条模式：快速 Canny 或 精细 DexiNed
```

### 4. 查看完整结构差异图

完整结构差异图使用三色标记：

```text
红色：后图新增的线条
蓝色：原图有但后图缺失的线条
黄色：两边都有但位置略有偏移
```

顶部图例可以勾选或取消：

```text
新增
缺失
偏移
```

如果黄色信息太多，可以先关闭“偏移”，只看新增和缺失。

### 5. 查看聚焦区域

右侧“聚焦区域”是系统认为差异比较集中的位置。每个卡片会显示：

```text
尺寸
新增数量
缺失数量
偏移数量
密度
```

密度表示该框内差异点占区域面积的比例。密度越高，说明该区域差异越集中。

### 6. 双击放大审查

可以双击右侧聚焦区域，也可以双击完整结构差异图中的编号框。

弹窗中会显示三栏：

```text
原图局部
后图局部
差异局部
```

鼠标滚轮可以放大或缩小弹窗图像。

### 7. 人工标记

弹窗顶部提供人工标记：

```text
通过
复核
问题
忽略
```

这些标记当前保存在浏览器本地，用于辅助人工审图流程。

### 8. 参数调节建议

如果误报太多：

```text
提高容错px，例如 12 或 15
提高最小区域，例如 3000 或 5000
关闭偏移图层
降低灵敏度
```

如果漏检太多：

```text
降低最小区域
提高检测数量
降低容错px
尝试精细 DexiNed 模式
```

如果框太少但图上颜色很多：

```text
提高最大区域%
提高检测数量
降低最小区域
```

## 网站部署说明 / Notes for Web Deployment

DiffEye 当前主要面向本地部署。如果要做公开网站或付费服务，需要额外增加：

```text
用户系统
支付系统
任务队列
对象存储
数据隔离
上传大小限制
自动清理机制
隐私政策
AGPL-3.0 对应源码提供入口
```

如果公开提供网络服务，请遵守 AGPL-3.0，并向用户提供对应源代码。
