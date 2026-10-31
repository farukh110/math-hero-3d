@echo off
setlocal
cd /d "%~dp0"
title Math Adventure 3D - build
where node >nul 2>nul
if errorlevel 1 (
  echo [ERROR] Node.js was not found. Install Node.js 20 or newer from https://nodejs.org
  pause
  exit /b 1
)
if not exist node_modules (
  echo Dependencies are missing - running install.bat first...
  call install.bat
  if errorlevel 1 exit /b 1
)
echo Building the production game ^(works offline once dependencies are installed^)...
call npm run build
if errorlevel 1 (
  echo [ERROR] Build failed. Read the messages above.
  pause
  exit /b 1
)
echo.
echo Build finished. The game is in the out folder. Run start-game.bat to play.
pause
