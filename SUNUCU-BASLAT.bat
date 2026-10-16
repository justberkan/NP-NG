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
echo.
echo  Farkli aglardan oynanabilsin diye gecici internet linki olusturulsun mu?
echo  (5 saniye icinde secmezsen: EVET. Link sunucu kapaninca gecersiz olur.)
choice /c EH /t 5 /d E /n /m "  [E] Evet, link olustur   [H] Hayir, sadece yerel ag: "
if errorlevel 2 goto yerel
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0sunucu-link.ps1"
exit /b
:yerel
node server.js
echo.
pause
