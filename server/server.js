const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');
const os = require('os');

const app = express();
app.use(cors());
app.use(express.json());

// Serve the iPhone web app (PWA)
app.use(express.static(path.join(__dirname, '..', 'iphone-web')));

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
  pingTimeout: 60000,
  pingInterval: 25000,
});

// Single shared clipboard per server instance (no rooms, no codes)
// { socketId: { platform, name, deviceId } }
const devices = new Map();
let sharedText = '';
let updatedAt = 0;

function getLocalIps() {
  const ifaces = os.networkInterfaces();
  const ips = [];
  for (const name of Object.keys(ifaces)) {
    for (const iface of ifaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        ips.push(iface.address);
      }
    }
  }
  return ips;
}

io.on('connection', (socket) => {
  console.log(`[socket] connected: ${socket.id}`);

  socket.on('join', (data) => {
    const { deviceId, platform, name } = data || {};
    if (!deviceId || !platform) {
      socket.emit('error', { message: 'deviceId and platform are required' });
      return;
    }

    devices.set(socket.id, {
      platform,
      deviceId,
      name: name || deviceId,
    });
    socket.data.deviceId = deviceId;
    socket.data.platform = platform;

    // Send current clipboard to the joining device
    socket.emit('synced', {
      text: sharedText,
      updatedAt,
      deviceCount: devices.size,
    });

    // Notify everyone else
    socket.to('').emit('device:joined', {
      deviceId,
      platform,
      name: name || deviceId,
      at: Date.now(),
    });

    console.log(`[join] ${platform} (${deviceId}) joined. Total devices: ${devices.size}`);
  });

  // A device pushed new clipboard text
  socket.on('clipboard:update', (data) => {
    const { deviceId, text } = data || {};
    if (!deviceId || text === undefined) return;

    const device = devices.get(socket.id);
    if (!device || device.deviceId !== deviceId) return;

    if (text === sharedText) return;

    sharedText = text;
    updatedAt = Date.now();

    // Broadcast to ALL other devices (not the sender)
    socket.broadcast.emit('clipboard:synced', {
      text,
      updatedAt,
      from: device.name || deviceId,
      fromPlatform: device.platform,
      deviceId,
    });

    console.log(`[sync] ${device.platform} -> ${text.substring(0, 40)}...`);
  });

  // A device requests the current clipboard
  socket.on('clipboard:get', () => {
    socket.emit('synced', {
      text: sharedText,
      updatedAt,
      deviceCount: devices.size,
    });
  });

  socket.on('disconnect', () => {
    const { deviceId, platform } = socket.data;
    if (deviceId) {
      devices.delete(socket.id);
      socket.broadcast.emit('device:left', {
        deviceId,
        platform,
        at: Date.now(),
      });
      console.log(`[leave] ${platform} (${deviceId}) left. Total: ${devices.size}`);
    }
    console.log(`[socket] disconnected: ${socket.id}`);
  });
});

// Discovery endpoint: iPhone app can GET this to find the server's IP
app.get('/api/discover', (req, res) => {
  res.json({
    ip: getLocalIps(),
    port: server.address().port,
    name: 'Clipboard Sync PC',
    deviceCount: devices.size,
  });
});

app.get('/api/status', (req, res) => {
  res.json({
    ok: true,
    text: sharedText,
    updatedAt,
    deviceCount: devices.size,
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
  const ips = getLocalIps();
  console.log('===========================================');
  console.log(' Clipboard Sync Server is running');
  console.log(` Local:  http://localhost:${PORT}`);
  ips.forEach((ip) => console.log(` Network: http://${ip}:${PORT}`));
  console.log('===========================================');
  console.log(' Windows client: runs automatically in background');
  console.log(' iPhone:         open http://<pc-ip>:3000 in Safari');
  console.log('===========================================');
});
