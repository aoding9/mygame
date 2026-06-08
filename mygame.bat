@echo off
cd /d "%~dp0"
if "%~1"=="run" goto launch
start "MyGame" cmd /k "%~f0" run
exit /b 0

:launch
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\start-mygame.ps1"
