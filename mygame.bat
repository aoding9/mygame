@echo off
chcp 65001 >nul
cd /d "%~dp0"
title MyGame

where node >nul 2>&1
if errorlevel 1 (
  echo 未检测到 Node.js，请先安装：https://nodejs.org/
  pause
  exit /b 1
)

if not exist "node_modules" (
  echo 首次运行，正在安装依赖...
  call npm install
  if errorlevel 1 (
    echo 依赖安装失败。
    pause
    exit /b 1
  )
)

echo 正在关闭占用 3000 端口的旧服务（如有）...
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\kill-port.ps1" 3000 2>nul
timeout /t 2 /nobreak >nul

echo 正在启动 MyGame...
start /b cmd /c "timeout /t 2 /nobreak >nul && start "" http://localhost:3000"
node src\server.js

echo.
if errorlevel 1 (
  echo 启动失败，请查看上方错误信息。
  echo 常见原因：端口 3000 仍被其他程序占用。
  echo 可尝试：关闭其他 MyGame 窗口，或在任务管理器结束 node.exe 后重试。
) else (
  echo MyGame 服务已结束。
)
pause
