# DiffEye

**重明 | DiffEye**  
**CHONGMING | DiffEye**

DiffEye is a local visual review center for comparing image structure, linework, patterns, and pixel differences. It is designed for restoration review, drawings, design drafts, scanned images, and other visual inspection workflows.

## Features

- Structure comparison mode for linework and pattern differences.
- Pixel comparison mode for strict image difference checks.
- Drag-and-drop image input.
- Image history picker for previously uploaded images.
- Before/after split view and opacity overlay view.
- Fit-to-window viewing with zoom and maximize controls.
- Numbered change regions with local detail previews.
- Adjustable sensitivity, minimum region size, and detection count.

## Requirements

- Windows 10/11
- Node.js LTS with npm
- Python 3.10 or newer

## One-Click Install

On Windows, double-click:

```text
install.bat
```

The installer checks for Node.js, npm, and Python, then installs:

- Node dependencies from `package.json`
- Python packages: `opencv-python`, `pillow`, `numpy`

## Start

Install dependencies:

```powershell
npm install
```

Start the local server:

```powershell
npm start
```

Open:

```text
http://localhost:5055
```

## Python Dependency

The structure comparison mode uses OpenCV through Python.

You can override that path with:

```powershell
$env:PYTHON310="C:\Path\To\python.exe"
npm start
```

Required Python packages:

```powershell
pip install opencv-python pillow numpy
```

## License

MIT License. See [LICENSE](LICENSE).

## Third-Party Dependencies

DiffEye uses third-party open-source packages through package managers. Their
source code is not copied into this repository.

- `odiff-bin`, MIT License, installed by npm for pixel comparison.
- `express`, MIT License, installed by npm for the local web server.
- `multer`, MIT License, installed by npm for local image upload handling.
- `opencv-python`, Apache-2.0 License, installed by pip for alignment and edge processing.
- `pillow`, HPND License, installed by pip as an image-processing dependency.
- `numpy`, BSD-3-Clause License, installed by pip for image array processing.

## Author

Created by **SGWinking / 上官文卿**.
