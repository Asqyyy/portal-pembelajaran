@echo off
echo ======================================
echo   Oce MCP Server - Setup Antigravity
echo ======================================
echo.

echo [1/2] Installing Python dependencies...
pip install -r requirements.txt

echo.
echo [2/2] Setup complete!
echo.
echo Buka Antigravity, lalu tambahkan MCP config ini:
echo.
type mcp-config.json
echo.
echo NOTE: Ganti "YOUR_USERNAME" di path dengan username Windows kamu!
echo.
pause
