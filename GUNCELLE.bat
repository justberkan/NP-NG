@echo off
chcp 65001 >nul
title N.P.N.G - Guncelle
cd /d "%~dp0"
echo.
echo  Sunucu en son surume guncelleniyor...
echo.
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0guncelle.ps1"
if errorlevel 3 goto yeniden
if errorlevel 1 exit /b
echo.
echo  Sunucu dosyalari degismedi: yeniden baslatmaya gerek yok, link ayni kaldi.
echo  Oyuncular sayfayi Ctrl+F5 ile yenilesin.
echo.
pause
exit /b
:yeniden
call "%~dp0DURDUR.bat"
call "%~dp0SUNUCU-INTERNET.bat"
