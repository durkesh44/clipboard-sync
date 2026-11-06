' Clipboard Sync - Hidden Background Launcher
' Runs both server and client invisibly with no visible windows

Set WshShell = CreateObject("WScript.Shell")

' Get the folder where this script is located
scriptFolder = CreateObject("Scripting.FileSystemObject").GetParentFolderName(WScript.ScriptFullName)

' Start server silently
WshShell.Run "cmd /c cd /d """ & scriptFolder & "\server"" && (if not exist node_modules npm install) && npm start", 0, False

' Wait a moment for server to start
WScript.Sleep 3000

' Start Windows client silently
WshShell.Run "cmd /c cd /d """ & scriptFolder & "\windows-client"" && (if not exist node_modules npm install) && node client.js", 0, False

' Script exits silently - both apps keep running in background
