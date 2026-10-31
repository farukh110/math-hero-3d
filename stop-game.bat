@echo off
setlocal
cd /d "%~dp0"
if not exist .server.pid (
  echo The game server does not seem to be running.
  pause
  exit /b 0
)
set /p PID=<.server.pid
taskkill /PID %PID% /F >nul 2>nul
del .server.pid >nul 2>nul
echo Game server stopped.
pause
