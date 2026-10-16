@echo off
chcp 65001 >nul
title N.P.N.G - Sinirsiz FPS
rem Tarayici FPSi monitor yenileme hizina kilitler. Bu dosya Chrome ya da Edgei ayri bir profille,
rem kare siniri ve dikey esitleme (vsync) KAPALI olarak acar. Sunucu (SUNUCU-BASLAT.bat) acik olmali.
rem Not: ekran yirtilmasi (tearing) gorulebilir; oyun ici Ayarlar > FPS siniri ile istedigin degere sabitleyebilirsin.
set "URL=http://localhost:3000/"
set "PROF=%LOCALAPPDATA%\NPNG-sinirsiz-fps"
set "FLAGS=--disable-frame-rate-limit --disable-gpu-vsync --enable-gpu-rasterization --ignore-gpu-blocklist --force_high_performance_gpu --disable-background-timer-throttling --disable-renderer-backgrounding --no-first-run --user-data-dir="%PROF%" --app=%URL%"
set "B="
if exist "%ProgramFiles%\Google\Chrome\Application\chrome.exe" set "B=%ProgramFiles%\Google\Chrome\Application\chrome.exe"
if not defined B if exist "%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe" set "B=%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe"
if not defined B if exist "%LOCALAPPDATA%\Google\Chrome\Application\chrome.exe" set "B=%LOCALAPPDATA%\Google\Chrome\Application\chrome.exe"
if not defined B if exist "%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe" set "B=%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe"
if not defined B if exist "%ProgramFiles%\Microsoft\Edge\Application\msedge.exe" set "B=%ProgramFiles%\Microsoft\Edge\Application\msedge.exe"
if not defined B (
  echo Chrome ya da Edge bulunamadi.
  pause
  exit /b
)
start "" "%B%" %FLAGS%
