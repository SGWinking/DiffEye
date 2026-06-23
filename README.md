# DiffEye | 重明 | 图像比对工具 V0.5.0

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

"重明"取自中国古代神话中的重明鸟意象。重明有明察、辨微、看见细微差异之意。这个名字适合 DiffEye，因为它并不是替代专家判断的工具，而是像一双辅助的眼睛，把图像中不容易发现的差异提前照出来，让审核人员能够更快、更稳地做出判断。

## 功能 / Features

- 结构比对：适合壁画、纹样、图纸、线条和轮廓审查。
- 像素比对：适合截图、渲染图和严格像素一致性检查。
- 自动对齐：通过 homography 对齐两张图片，可开关。
- 比例检查：两张图宽高比例不一致时拒绝比对，避免扭曲。
- 三色差异图：红色新增、蓝色缺失、黄色偏移，可单独显示/隐藏。
- 聚焦区域：自动列出差异集中的区域。
- 三栏局部审查：原图局部 / 后图局部 / 差异局部。
- 人工标记：通过 / 复核 / 问题 / 忽略。
- 键盘导航：左右键切换聚焦区域，Enter 打开弹窗。
- 暗色模式：一键切换，记忆偏好。
- 批量比对：多组图排队依次比对。
- 报告导出：JSON / Markdown，含参数和审核标签。
- 自动清理：启动时清理 7 天以上的比对缓存。
- 本地运行，图片默认保存在本机。

## 两种安装方式 / Two Ways to Install

### 方式一：零安装版（推荐给非技术用户）

从 GitHub Releases 下载安装包：

```text
https://github.com/SGWinking/DiffEye/releases
```

下载 `DiffEye-Setup.exe`（约 564 MB），双击即可：

1. 选择安装路径（默认 `C:\DiffEye`）
2. 解压完成后自动启动并打开浏览器
3. 开始使用，无需安装任何依赖

安装包内置完整运行环境：

| 组件 | 版本 | 说明 |
|------|------|------|
| Node.js | 24.15.0 | 便携版，无需系统安装 |
| Python | 3.10.11 | Embedded 版，无需系统安装 |
| OpenCV | 4.13.0 | 图像处理 |
| PyTorch | 2.12.1+cpu | DexiNed 推理引擎 |
| DexiNed | - | 模型权重已内置 (134 MB) |

启动方式：双击安装目录下的 `启动DiffEye.bat`，按任意键停止服务。

### 方式二：源码版（推荐给开发者）

#### 1. 安装必需软件

- [Node.js LTS](https://nodejs.org/)
- [Python 3.10+](https://www.python.org/downloads/)

安装 Python 时建议勾选：

```text
Add python.exe to PATH
```

#### 2. 下载源码

```powershell
git clone https://github.com/SGWinking/DiffEye.git
cd DiffEye
```

#### 3. 安装依赖

双击运行：

```text
install.bat
```

或手动执行：

```powershell
npm install
python -m pip install opencv-python pillow numpy
```

#### 4. 启动

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

## DexiNed 精细线条模式 / DexiNed Mode

V0.5.0 起默认使用 **精细 DexiNed** 模式，AI 边缘检测增强复杂纹样识别。

- **零安装版**：DexiNed 和模型权重已内置，直接可用。
- **源码版**：需要额外配置：

1. 运行：

```text
setup-dexined.bat
```

2. 下载官方模型（约 134 MB）：

```text
https://drive.google.com/file/d/1V56vGTsu7GYiQouCIKvTWl5UKCZ6yCNu/view?usp=sharing
```

3. 放到：

```text
third_party/DexiNed/checkpoints/BIPED/10/10_model.pth
```

也可以切换回 **快速 Canny** 模式，不需要额外模型，速度更快。

## 技术路线 / Technical Approach

DiffEye 的结构比对流程：

```text
两张图像
→ 检查宽高比例是否一致（不一致则拒绝）
→ 统一长边到 2048 像素
→ 自动对齐（homography，可关闭）
→ 灰度归一化
→ 提取线条/边缘（Canny 或 DexiNed）
→ 比较两张边缘图
→ 标出新增、缺失、偏移
→ 聚合差异点
→ 生成聚焦区域
→ 提供局部三栏审查
```

具体说明：

- **比例检查**：两张图宽高比例差异超过 3% 时拒绝比对，提示用户先裁切成相同比例。
- **尺寸统一**：两张图长边统一缩放到 2048 像素，减少计算量。
- **对齐**：先缩放到相同尺寸，再用 homography 微调纠正轻微透视/裁切差。匹配质量差时自动回退到纯缩放，避免扭曲。可在界面关闭。
- **线条提取**：默认使用 DexiNed AI 边缘检测；也可切换为 Canny 快速模式。DexiNed 批量处理两张图，输入缩到 1024 像素加速推理。
- **三色差异**：红色表示后图新增线条，蓝色表示后图缺失线条，黄色表示两边都有但位置略有偏移。可单独显示/隐藏。
- **画框逻辑**：把相邻的差异点聚成一组，生成外接矩形，形成"聚焦区域"。
- **辅助审图**：按聚焦区域逐个复核，双击打开三栏弹窗查看局部，弹窗适应屏幕大小。

DiffEye 不替代专家判断，它的作用是把可能有结构变化的位置提前整理出来，减少人工搜索成本。

## 目录结构 / Directory Structure

```text
DiffEye/
├── server.js              # Node.js 后端服务
├── mural_compare.py        # Python 图像比对核心
├── dexined_edges.py        # DexiNed 边缘检测脚本
├── 启动DiffEye.bat          # 零安装版启动器
├── start-tool.bat          # 源码版启动器
├── install.bat             # 源码版依赖安装
├── setup-dexined.bat       # DexiNed 配置脚本（源码版）
├── package.json
├── public/                 # 前端界面
│   ├── index.html
│   ├── app.js
│   ├── styles.css
│   └── assets/
├── runtime/                # 零安装版运行环境（仅零安装版）
│   ├── node/               # 便携 Node.js
│   └── python/             # 便携 Python + 依赖
├── third_party/
│   └── DexiNed/            # DexiNed 仓库 + 模型权重
├── runs/                   # 比对结果缓存（自动生成）
└── docs/
    └── USAGE.md
```

## API 端点 / API Endpoints

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/health` | 服务状态、Python 路径、DexiNed 可用性 |
| GET | `/history` | 历史图片列表 |
| DELETE | `/history` | 清空历史和缓存 |
| POST | `/compare` | 执行比对（mural 或 pixel 模式） |

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
线条模式：精细 DexiNed（默认）或 快速 Canny
自动对齐：开（比例一致时建议开启）
```

## 版本历史 / Changelog

### V0.5.0

- 零安装版：内置 Node.js + Python + PyTorch + DexiNed 模型，双击即用
- DexiNed 设为默认边缘模式
- 比例检查：宽高比例不一致时拒绝比对
- 尺寸统一：长边缩放到 2048 像素
- 暗色模式、批量比对、报告导出、键盘导航、清空历史
- Homography 质量检查，不稳定时回退纯缩放
- 弹窗适应屏幕、自动清理缓存
- 修复多个 bug（大图内存、扩展名大小写、浏览器抢先等）

### V0.4

- 初始版本，Canny + 可选 DexiNed

## 许可证 / License

DiffEye 使用 **GNU Affero General Public License v3.0** 开源。  
如果公开提供基于 DiffEye 的网络服务，请遵守 AGPL-3.0，并向用户提供对应源代码。

See [LICENSE](LICENSE).

## 作者 / Author

**SGWinking / 上官文卿**
