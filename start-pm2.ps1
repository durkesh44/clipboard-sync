# Wait for network to be ready
Start-Sleep -Seconds 15

# Restore PM2 apps (server + client)
pm2 resurrect
