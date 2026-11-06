@echo off
title Add Clipboard Sync to Windows Startup
cd /d "%~dp0"

set "STARTUP_DIR=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup"
set "SHORTCUT=%STARTUP_DIR%\Clipboard Sync.lnk"

if not exist "%STARTUP_DIR%\" mkdir "%STARTUP_DIR%"

powershell -Command "$WshShell = New-Object -comObject WScript.Shell; $Shortcut = $WshShell.CreateShortcut('%SHORTCUT%'); $Shortcut.TargetPath = '%~dp0start-hidden.vbs'; $Shortcut.WorkingDirectory = '%~dp0'; $Shortcut.Description = 'Clipboard Sync - Hidden Background Sync'; $Shortcut.Save()"

echo.
echo ============================================
echo Clipboard Sync added to Windows Startup!
echo ============================================
echo.
echo It will now start automatically in the background
echo when you log in - no visible windows.
echo.
echo Both server and client will run silently.
echo.
pause
