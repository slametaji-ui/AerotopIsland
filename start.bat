@echo off
title Dynamic Island Windows
cd /d "%~dp0"
taskkill /F /IM electron.exe >nul 2>&1
npm start
