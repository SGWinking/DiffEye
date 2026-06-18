# DiffEye | 重明 | 图像比对工具 V0.4

**CHONGMING | DiffEye**  
Author: **SGWinking / 上官文卿**

DiffEye 是一个本地图像结构比对工具，用于检查两张图片之间的线条、轮廓、纹样、结构和像素差异。它最初服务于山西大云禅院壁画修复工作，用来辅助比对 AI 生成图像与原始图像之间的差别，减少人工逐张审查的工作量。

DiffEye is a local image comparison tool for reviewing linework, contours, patterns, structure, and pixel-level differences between two images.

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
