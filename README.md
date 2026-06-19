# DiffEye | 重明 | 图像比对工具 V0.4

<p align="center">
  <img src="public/assets/chongming-logo.png" alt="DiffEye 重明 Logo" width="180">
</p>

**CHONGMING | DiffEye**  
Author: **SGWinking / 上官文卿**

DiffEye 是一个本地图像结构比对工具，用于检查两张图片之间的线条、轮廓、纹样、结构和像素差异。它最初服务于山西大云禅院壁画修复工作，用来辅助比对 AI 生成图像与原始图像之间的差别，减少人工逐张审查的工作量。

DiffEye is a local image comparison tool for reviewing linework, contours, patterns, structure, and pixel-level differences between two images.

## Origin / 缘起

This small tool was created for the mural recreation and restoration workflow of Dayun Chanyuan. The project requires repeated comparison between original mural scans and AI-generated or manually restored images. Reviewing every image pair by eye is slow and easy to miss subtle structural changes, so DiffEye helps highlight differences in linework, contours, patterns, and visual structure before human review.

这个小工具的制作缘起，是因为我们正在推进大云禅院壁画修复与重现工作。项目中需要反复比对原始壁画扫描图与 AI 生成图、人工修复图之间的差异。如果完全依靠人工逐张查看，不仅耗时，也容易漏掉细微的结构变化。DiffEye 用于提前标出线条、轮廓、纹样和图像结构中的差异，帮助审核人员更快进入重点复核。

## Why "ChongMing" / 名称含义

Chongming, or 重明, refers to the Chongming bird from ancient Chinese mythology. It is associated with clear sight and the ability to discern subtle differences. The name fits this tool because DiffEye is not meant to replace expert judgment; it acts like an extra pair of careful eyes, bringing hidden visual differences into focus so reviewers can make better decisions.

“重明”取自中国古代神话中的重明鸟意象。重明有明察、辨微、看见细微差异之意。这个名字适合 DiffEye，因为它并不是替代专家判断的工具，而是像一双辅助的眼睛，把图像中不容易发现的差异提前照出来，让审核人员能够更快、更稳地做出判断。

## 功能 / Features

- 结构比对：适合壁画、纹样、图纸、线条和轮廓审查。
- 像素比对：适合截图、渲染图和严格像素一致性检查。
- 自动对齐：通过 homography 对齐两张图片。
- 三色差异图：红色新增、蓝色缺失、黄色偏移。
- 聚焦区域：自动列出差异集中的区域。
- 三栏局部审查：原图局部 / 后图局部 / 差异局部。
- 人工标记：通过 / 复核 / 问题 / 忽略。
- 可选 DexiNed 精细线条模式。
- 本地运行，图片默认保存在本机。

## 技术路线 / Technical Approach

DiffEye 的结构比对流程可以简要理解为：

```text
两张图像
→ 自动缩放与 homography 对齐
→ 灰度归一化
→ 提取线条/边缘
→ 比较两张边缘图
→ 标出新增、缺失、偏移
→ 聚合差异点
→ 生成聚焦区域
→ 提供局部三栏审查
```

具体来说：

- **对齐**：先把第二张图主动对齐到第一张图，减少拍摄角度、裁切、轻微透视差带来的误报。
- **线条提取**：默认使用 Canny/OpenCV 提取线条；也可以启用 DexiNed 精细线条模式，用 AI 边缘检测增强复杂纹样识别。
- **三色差异**：红色表示后图新增线条，蓝色表示后图缺失线条，黄色表示两边都有但位置略有偏移。
- **画框逻辑**：系统不会对每一个点单独画框，而是把相邻的差异点聚成一组，再给这一组生成一个外接矩形，形成“聚焦区域”。
- **辅助审图**：审核人不需要从整张大图里盲找差异，可以按聚焦区域逐个复核，并通过三栏弹窗查看“原图局部 / 后图局部 / 差异局部”。

DiffEye 不替代专家判断，它的作用是把可能有结构变化的位置提前整理出来，减少人工搜索成本，让审核人把精力集中在真正需要判断的局部。

## 小白快速使用 / Quick Start

### 1. 安装必需软件 / Install prerequisites

请先安装：

- [Node.js LTS](https://nodejs.org/)
- [Python 3.10+](https://www.python.org/downloads/)

安装 Python 时建议勾选：

```text
Add python.exe to PATH
```

### 2. 下载 DiffEye / Download

可以在 GitHub 页面点击：

```text
Code -> Download ZIP
```

也可以使用 Git：

```powershell
git clone https://github.com/SGWinking/DiffEye.git
cd DiffEye
```

### 3. 一键安装 / Install

双击运行：

```text
install.bat
```

或手动执行：

```powershell
npm install
python -m pip install opencv-python pillow numpy
```

### 4. 启动 / Start

双击运行：

```text
start-tool.bat
```

或手动执行：

```powershell
npm start
```

然后打开：

```text
http://localhost:5055
```

## DexiNed 精细线条模式 / Optional DexiNed Mode

默认的 **快速 Canny** 模式不需要额外模型。  
如果需要更精细的 AI 边缘检测，可以启用 DexiNed：

1. 运行：

```text
setup-dexined.bat
```

2. 下载官方模型：

```text
https://drive.google.com/file/d/1V56vGTsu7GYiQouCIKvTWl5UKCZ6yCNu/view?usp=sharing
```

3. 放到：

```text
third_party/DexiNed/checkpoints/BIPED/10/10_model.pth
```

模型大小约：

```text
134.53 MB
```

## 文档 / Documentation

- [详细使用教程 / Usage Guide](docs/USAGE.md)
- [第三方依赖声明 / Third-Party Notices](THIRD_PARTY_NOTICES.md)
- [版权信息 / Copyright](COPYRIGHT)

## 推荐默认参数 / Recommended Defaults

```text
灵敏度：5
最小区域：2048
检测数量：120
容错px：10
最大区域%：60
线条模式：快速 Canny 或 精细 DexiNed
```

## 许可证 / License

DiffEye 使用 **GNU Affero General Public License v3.0** 开源。  
如果公开提供基于 DiffEye 的网络服务，请遵守 AGPL-3.0，并向用户提供对应源代码。

See [LICENSE](LICENSE).

## 作者 / Author

**SGWinking / 上官文卿**
