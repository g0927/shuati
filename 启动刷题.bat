@echo off
cd /d "%~dp0"
echo 📚 期末刷题平台启动中...
echo 网址: http://localhost:3000
echo 按 Ctrl+C 可以关闭服务器
echo.
start http://localhost:3000
npx serve . -p 3000 -s --no-clipboard
pause
