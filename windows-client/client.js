const io = require('socket.io-client');
const clipboard = require('clipboardy');
const os = require('os');

const SERVER_URL = 'http://localhost:3000';
const POLL_INTERVAL_MS = 1500;

let DEVICE_ID = `windows-${os.hostname().replace(/[^a-z0-9]/gi, '-').toLowerCase()}`;
const DEVICE_NAME = `Windows PC (${os.hostname()})`;

let socket = null;
let lastSharedText = '';
let lastLocalText = '';
let isWriting = false;

function connect() {
  socket = io(SERVER_URL, {
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 2000,
    reconnectionDelayMax: 5000,
    timeout: 20000,
  });

  socket.on('connect', () => {
    console.log('[client] Connected to clipboard server');
    socket.emit('join', {
      deviceId: DEVICE_ID,
      platform: 'windows',
      name: DEVICE_NAME,
    });
  });

  socket.on('synced', (payload) => {
    const { text } = payload || {};
    if (text === undefined) return;
    if (text !== lastSharedText) {
      lastSharedText = text;
      writeToClipboard(text);
    }
  });

  socket.on('clipboard:synced', (payload) => {
    const { text, from, fromPlatform } = payload || {};
    if (text === undefined) return;
    if (text !== lastSharedText) {
      lastSharedText = text;
      console.log(`[clipboard] Received from ${from} (${fromPlatform})`);
      writeToClipboard(text);
    }
  });

  socket.on('device:joined', (payload) => {
    console.log(`[room] Device joined: ${payload.name} (${payload.platform})`);
  });

  socket.on('disconnect', () => {
    console.log('[client] Disconnected. Reconnecting…');
  });

  socket.on('connect_error', (err) => {
    console.error(`[client] Connection error: ${err.message}. Is the server running?`);
  });

  socket.on('error', (err) => {
    console.error(`[client] Socket error: ${err.message || err}`);
  });
}

function writeToClipboard(text) {
  isWriting = true;
  try {
    clipboard.writeSync(text);
    lastLocalText = text;
  } catch (err) {
    console.error('[error] Failed to write to clipboard:', err.message);
  } finally {
    setTimeout(() => { isWriting = false; }, 800);
  }
}

function readClipboardSafe() {
  try {
    return clipboard.readSync();
  } catch (err) {
    return undefined;
  }
}

function startPolling() {
  setInterval(() => {
    if (isWriting) return;
    const text = readClipboardSafe();
    if (text === undefined || text === null) return;
    const normalized = String(text);

    if (normalized !== lastLocalText && normalized !== lastSharedText) {
      lastLocalText = normalized;
      lastSharedText = normalized;
      socket.emit('clipboard:update', {
        deviceId: DEVICE_ID,
        text: normalized,
      });
    }
  }, POLL_INTERVAL_MS);
}

function main() {
  connect();
  startPolling();

  console.log('[client] Windows clipboard sync running in background.');
  console.log(`[client] Device ID: ${DEVICE_ID}`);

  process.on('SIGINT', () => {
    if (socket) socket.disconnect();
    process.exit(0);
  });
}

main();
