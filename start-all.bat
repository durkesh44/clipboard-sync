@echo off
title Clipboard Sync - Auto Start
cd /d "%~dp0"

:: Start server in a new window
start "Clipboard Server" cmd /k "cd /d "%~dp0server" && (if not exist node_modules npm install) && npm start"

:: Start Windows client in a new window
start "Clipboard Client" cmd /k "cd /d "%~dp0windows-client" && (if not exist node_modules npm install) && node client.js"

echo.
echo Clipboard Sync is starting in the background...
echo Both server and client windows will open.
echo You can minimize them - keep them running.
