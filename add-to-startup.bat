@echo off
title Add Clipboard Sync to Windows Startup
cd /d "%~dp0"

set "STARTUP_DIR=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup"
set "SHORTCUT=%STARTUP_DIR%\Clipboard Sync.lnk"

if not exist "%STARTUP_DIR%\" mkdir "%STARTUP_DIR%"

powershell -Command "$WshShell = New-Object -comObject WScript.Shell; $Shortcut = $WshShell.CreateShortcut('%SHORTCUT%'); $Shortcut.TargetPath = '%~dp0start-all.bat'; $Shortcut.WorkingDirectory = '%~dp0'; $Shortcut.Description = 'Clipboard Sync - Auto Start on Boot'; $Shortcut.Save()"

echo.
echo ============================================
echo Clipboard Sync added to Windows Startup!
echo ============================================
echo.
echo It will now start automatically when you log in.
echo Both the server and client will launch in separate windows.
echo.
pause
