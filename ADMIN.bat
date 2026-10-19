@echo off
chcp 65001 >nul
title N.P.N.G - Admin
cd /d "%~dp0"
set "NODE=%~dp0node\node.exe"
if not exist "%NODE%" set "NODE=node"
rem Kullanim: ADMIN.bat ver kullanici  /  ADMIN.bat al kullanici  /  ADMIN.bat liste   (ya da cift tikla, soru sorar)
if not "%~1"=="" (
  "%NODE%" admin.cjs %*
  exit /b
)
echo.
"%NODE%" admin.cjs liste
echo.
set /p "ISLEM=  [V] Admin ver   [A] Adminlik al   [Enter] Cik : "
if /i "%ISLEM%"=="V" goto ver
if /i "%ISLEM%"=="A" goto al
exit /b
:ver
set /p "KAD=  Kullanici adi: "
"%NODE%" admin.cjs ver "%KAD%"
pause
exit /b
:al
set /p "KAD=  Kullanici adi: "
"%NODE%" admin.cjs al "%KAD%"
pause
