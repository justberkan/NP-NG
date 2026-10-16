@echo off
taskkill /f /im cloudflared.exe >nul 2>nul
taskkill /f /im node.exe >nul 2>nul
echo Sunucu durduruldu.
timeout /t 2 >nul
