@echo off
setlocal
cd /d "%~dp0"
title Math Adventure 3D - install
where node >nul 2>nul
if errorlevel 1 (
  echo [ERROR] Node.js was not found. Install Node.js 20 or newer from https://nodejs.org ^(needs internet once^).
  pause
  exit /b 1
)
echo Installing dependencies ^(needs internet^)...
call npm install
if errorlevel 1 (
  echo [ERROR] npm install failed. Check the internet connection and try again.
  pause
  exit /b 1
)
echo.
echo Done. Next run build.bat
pause
