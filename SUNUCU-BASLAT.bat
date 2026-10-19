@echo off
chcp 65001 >nul
title N.P.N.G - Sunucu
cd /d "%~dp0"
rem Tam sunucu paketinde node\node.exe hazir gelir; yoksa bilgisayarda kurulu Node.js kullanilir.
set "NODE=%~dp0node\node.exe"
if exist "%NODE%" goto nodevar
where node >nul 2>nul
if errorlevel 1 (
  echo.
  echo  Node.js bulunamadi: bu klasorde node\node.exe yok, bilgisayarda da Node.js kurulu degil.
  echo  Tam sunucu paketini kullan ya da acilan sayfadan "LTS" surumunu kur.
  start https://nodejs.org
  pause
  exit /b
)
set "NODE=node"
:nodevar
if not exist "%~dp0server.js" (
  echo.
  echo  server.js bulunamadi. Zip'i once bir klasore CIKAR, sonra bu dosyayi o klasorden calistir.
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
"%NODE%" server.js
echo.
pause
