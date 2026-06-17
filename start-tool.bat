@echo off
cd /d "%~dp0"
echo Starting DiffEye...
echo Open http://localhost:5055 in your browser.
start "" "http://localhost:5055"
npm.cmd start
