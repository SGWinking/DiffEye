# Third-Party Notices

DiffEye depends on third-party open-source software installed through npm and
pip. These packages are not copied into this repository.

## npm

- `odiff-bin`  
  License: MIT  
  Repository: https://github.com/dmtrKovalenko/odiff  
  Used for strict pixel comparison mode.

- `express`  
  Installed from npm for the local web server.

- `multer`  
  Installed from npm for local image upload handling.

## pip

- `opencv-python`  
  Used for image alignment, edge extraction, and structure comparison.

- `pillow`  
  Used as an image-processing dependency.

- `numpy`  
  Used for image array processing.

For the complete dependency tree and exact versions, see `package-lock.json`
and the user's Python environment.
