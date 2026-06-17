@echo off
setlocal
cd /d "%~dp0"

echo.
echo DiffEye installer
echo =================
echo.

where node >nul 2>nul
if errorlevel 1 (
  echo Node.js is required.
  echo Please install Node.js LTS from https://nodejs.org/
  pause
  exit /b 1
)

where npm.cmd >nul 2>nul
if errorlevel 1 (
  echo npm was not found. Please reinstall Node.js with npm enabled.
  pause
  exit /b 1
)

where python >nul 2>nul
if errorlevel 1 (
  echo Python 3.10 or newer is required.
  echo Please install Python from https://www.python.org/downloads/
  pause
  exit /b 1
)

echo Installing Node.js dependencies...
call npm.cmd install
if errorlevel 1 (
  echo npm install failed.
  pause
  exit /b 1
)

echo.
echo Installing Python image-processing dependencies...
python -m pip install opencv-python pillow numpy
if errorlevel 1 (
  echo Python dependency installation failed.
  pause
  exit /b 1
)

echo.
echo DiffEye is ready.
echo Run start-tool.bat, then open http://localhost:5055
pause
