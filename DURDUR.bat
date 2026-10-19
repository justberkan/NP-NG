@echo off
chcp 65001 >nul
taskkill /f /im cloudflared.exe >nul 2>nul
rem Yalniz 3000 portunu dinleyen oyun sunucusunu kapat; bilgisayardaki diger node programlarina dokunma.
rem Once kibarca (hesaplar diske yazilsin), 3 sn sonra hala aciksa zorla.
set "FOUND="
for /f "tokens=5" %%p in ('netstat -ano ^| findstr /r /c:":3000 .*LISTENING"') do (
  set "FOUND=1"
  taskkill /pid %%p >nul 2>nul
)
if defined FOUND timeout /t 3 >nul
for /f "tokens=5" %%p in ('netstat -ano ^| findstr /r /c:":3000 .*LISTENING"') do taskkill /f /pid %%p >nul 2>nul
echo Sunucu durduruldu.
timeout /t 2 >nul
