@echo off
:: Adds Clipboard Sync to Windows Startup so it runs automatically on boot
set "SCRIPT_PATH=%~dp0start.bat"
set "STARTUP_DIR=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup"
set "SHORTCUT=%STARTUP%\Clipboard Sync.lnk"

if not exist "%STARTUP_DIR%\" mkdir "%STARTUP_DIR%"

powershell -Command "$WshShell = New-Object -comObject WScript.Shell; $Shortcut = $WshShell.CreateShortcut('%SHORTCUT%'); $Shortcut.TargetPath = '%SCRIPT_PATH%'; $Shortcut.WorkingDirectory = '%~dp0'; $Shortcut.Description = 'Clipboard Sync Windows Client'; $Shortcut.Save()"

echo Clipboard Sync has been added to Windows Startup.
echo It will now start automatically when you log in.
pause
