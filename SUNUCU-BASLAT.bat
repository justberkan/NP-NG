@echo off
chcp 65001 >nul
title N.P.N.G - Sunucu
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo.
  echo Node.js kurulu degil. Acilan sayfadan "LTS" surumunu indirip kur,
  echo sonra bu dosyayi tekrar calistir.
  start https://nodejs.org
  pause
  exit /b
)
node server.js
echo.
pause
