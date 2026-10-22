@echo off
title Aerotop Island
cd /d "%~dp0"
taskkill /F /IM electron.exe >nul 2>&1
npm start
