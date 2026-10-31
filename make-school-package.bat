@echo off
setlocal
cd /d "%~dp0"
title Math Adventure 3D - make school package
if not exist out\index.html (
  echo [ERROR] Run build.bat first.
  pause
  exit /b 1
)
set DEST=school-package
if exist %DEST% rmdir /s /q %DEST%
mkdir %DEST%\game
mkdir %DEST%\scripts
mkdir %DEST%\node
xcopy /e /i /q /y out %DEST%\game >nul
copy /y scripts\serve.mjs %DEST%\scripts\ >nul
copy /y start-game.bat %DEST%\ >nul
copy /y stop-game.bat %DEST%\ >nul
copy /y README-OFFLINE.md %DEST%\ >nul
for /f "delims=" %%N in ('where node') do (
  copy /y "%%N" %DEST%\node\node.exe >nul
  goto :copied
)
:copied
echo.
echo Created folder %DEST% ^(includes node.exe, so the laptop needs NO install and NO internet^).
echo Copy the whole %DEST% folder to the school laptop ^(USB drive^), then run start-game.bat.
pause
