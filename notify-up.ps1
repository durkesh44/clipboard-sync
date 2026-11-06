# Clipboard Sync - Startup Notification
# Shows a Windows toast notification when both apps are running

Add-Type -AssemblyName System.Windows.Forms

$scriptFolder = Split-Path -Parent $MyInvocation.MyCommand.Definition

# Check if server is responding
$serverRunning = $false
try {
    $response = Invoke-RestMethod -Uri "http://localhost:3000/api/status" -TimeoutSec 5
    if ($response.ok -eq $true) {
        $serverRunning = $true
    }
} catch {
    # Server not responding yet
}

if ($serverRunning) {
    $deviceCount = $response.deviceCount
    $message = "Clipboard Sync is running in the background`nServer + Windows Client are active`nDevices connected: $deviceCount"
    
    # Show Windows Forms notification (non-blocking popup)
    $notify = New-Object System.Windows.Forms.NotifyIcon
    $notify.Icon = [System.Drawing.SystemIcons]::Information
    $notify.BalloonTipTitle = "Clipboard Sync"
    $notify.BalloonTipText = "Running in the background ($deviceCount device(s) connected)"
    $notify.Visible = $true
    $notify.ShowBalloonTip(5000)
    $notify.Dispose()
} else {
    # Server not up yet - show warning
    $notify = New-Object System.Windows.Forms.NotifyIcon
    $notify.Icon = [System.Drawing.SystemIcons]::Warning
    $notify.BalloonTipTitle = "Clipboard Sync"
    $notify.BalloonTipText = "Server not responding. Check if apps started correctly."
    $notify.Visible = $true
    $notify.ShowBalloonTip(5000)
    $notify.Dispose()
}
