@echo off
title Shraddha Garden - Stop Website
echo.
echo   Stopping the website...
taskkill /F /IM cloudflared.exe >nul 2>&1
taskkill /F /IM node.exe >nul 2>&1
echo   Done. The website is now offline.
echo.
echo   You can close this window.
pause
