@echo off
chcp 65001 >nul
title N.P.N.G - Internet Sunucusu
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0sunucu-link.ps1"
