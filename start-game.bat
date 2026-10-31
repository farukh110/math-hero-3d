@echo off
setlocal
cd /d "%~dp0"
title Math Adventure 3D - server
set "NODE_EXE=node"
if exist "%~dp0node\node.exe" set "NODE_EXE=%~dp0node\node.exe"
"%NODE_EXE%" --version >nul 2>nul
if errorlevel 1 (
  echo [ERROR] Node.js was not found. Install Node.js 20.9 or newer, or put node.exe in a folder named node next to this file.
  echo         See README-OFFLINE.md, section Copying to the school laptop.
  pause
  exit /b 1
)
if not exist out\index.html if not exist game\index.html (
  echo [ERROR] The game is not built yet. Run build.bat first.
  pause
  exit /b 1
)
"%NODE_EXE%" scripts\serve.mjs --open
if errorlevel 1 pause
