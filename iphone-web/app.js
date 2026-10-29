(() => {
  const SERVER_PORT = 3000;
  const STORAGE_KEY = 'clipboard-sync-server-url';

  // --- UI elements ---
  const setupScreen = document.getElementById('setupScreen');
  const mainScreen = document.getElementById('mainScreen');
  const pcIpInput = document.getElementById('pcIpInput');
  const connectBtn = document.getElementById('connectBtn');
  const setupStatus = document.getElementById('setupStatus');
  const findPcBtn = document.getElementById('findPcBtn');

  const clipboardDisplay = document.getElementById('clipboardDisplay');
  const copyBtn = document.getElementById('copyBtn');
  const refreshBtn = document.getElementById('refreshBtn');
  const sendInput = document.getElementById('sendInput');
  const sendBtn = document.getElementById('sendBtn');
  const status = document.getElementById('status');
  const devicesEl = document.getElementById('devices');
  const pcAddressEl = document.getElementById('pcAddress');
  const changePcBtn = document.getElementById('changePcBtn');
  const toast = document.getElementById('toast');

  let socket = null;
  let serverUrl = localStorage.getItem(STORAGE_KEY) || '';
  let deviceId = `iphone-${Date.now()}`;
  let lastSharedText = '';
  let isConnected = false;

  // --- helpers ---
  function setStatus(msg, kind = '') {
    status.textContent = msg;
    status.className = 'status' + (kind ? ' ' + kind : '');
  }

  function setSetupStatus(msg, kind = '') {
    setupStatus.textContent = msg;
    setupStatus.className = 'status' + (kind ? ' ' + kind : '');
  }

  function showToast(msg) {
    toast.textContent = msg;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 1800);
  }

  function renderDevices(list) {
    if (!list || list.length === 0) {
      devicesEl.textContent = 'Devices: none';
      return;
    }
    devicesEl.textContent = 'Devices: ' + list.map((d) => `${d.name} (${d.platform})`).join(', ');
  }

  function applySharedText(text) {
    if (text === undefined) return;
    if (document.activeElement === clipboardDisplay) return;
    if (text !== lastSharedText) {
      lastSharedText = text;
      clipboardDisplay.value = text;
    }
  }

  function normalizeIp(ip) {
    ip = ip.trim();
    if (!ip) return '';
    if (!ip.includes('://')) ip = 'http://' + ip;
    if (!ip.includes(':')) ip = ip + ':3000';
    return ip.replace(/\/$/, '');
  }

  // --- socket.io connection ---
  function connect(url) {
    if (socket) {
      socket.disconnect();
      socket = null;
    }

    setStatus('Connecting…', '');
    isConnected = false;

    socket = io(url, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 2000,
      reconnectionDelayMax: 5000,
      timeout: 15000,
    });

    socket.on('connect', () => {
      isConnected = true;
      console.log('[iphone] connected');
      socket.emit('join', {
        deviceId,
        platform: 'iphone',
        name: 'iPhone',
      });
      setStatus('Connected — syncing', 'ok');
      showToast('Connected to PC');
      socket.emit('clipboard:get');
    });

    socket.on('disconnect', () => {
      isConnected = false;
      setStatus('Disconnected. Reconnecting…', 'err');
    });

    socket.on('connect_error', (err) => {
      isConnected = false;
      setStatus('Cannot reach PC. Check IP and Wi-Fi.', 'err');
      console.error('[iphone] connect_error', err);
    });

    socket.on('synced', (payload) => {
      const { text, updatedAt, deviceCount } = payload || {};
      applySharedText(text);
      if (deviceCount !== undefined) renderDevicesCount(deviceCount);
      if (isConnected) setStatus('Synced from PC', 'ok');
    });

    socket.on('clipboard:synced', (payload) => {
      const { text, from, fromPlatform } = payload || {};
      applySharedText(text);
      if (isConnected) setStatus(`Updated from ${from}`, 'ok');
      showToast(`Received: ${(text || '').substring(0, 30)}…`);
    });

    socket.on('device:joined', (payload) => {
      console.log('[iphone] device joined', payload);
    });

    socket.on('device:left', (payload) => {
      console.log('[iphone] device left', payload);
    });

    socket.on('error', (err) => {
      setStatus('Error: ' + (err.message || err), 'err');
    });
  }

  function renderDevicesCount(count) {
    devicesEl.textContent = count === 1 ? 'Device: Windows PC' : `Devices: ${count}`;
  }

  // --- copy to iPhone clipboard ---
  async function copyToClipboard(text) {
    if (!text) {
      showToast('Nothing to copy');
      return;
    }
    try {
      await navigator.clipboard.writeText(text);
      showToast('Copied to iPhone');
    } catch (err) {
      clipboardDisplay.select();
      try {
        document.execCommand('copy');
        showToast('Copied to iPhone');
      } catch (e) {
        showToast('Copy failed — select manually');
      }
    }
  }

  // --- setup screen ---
  function showSetup() {
    setupScreen.classList.remove('hidden');
    mainScreen.classList.add('hidden');
    if (serverUrl) pcIpInput.value = serverUrl.replace('http://', '').replace(':3000', '');
  }

  function showMain() {
    setupScreen.classList.add('hidden');
    mainScreen.classList.remove('hidden');
    pcAddressEl.textContent = 'PC: ' + serverUrl;
  }

  connectBtn.addEventListener('click', () => {
    const raw = pcIpInput.value.trim();
    if (!raw) {
      setSetupStatus('Please enter your PC IP address', 'err');
      return;
    }
    const url = normalizeIp(raw);
    connectBtn.disabled = true;
    connectBtn.textContent = 'Connecting…';
    setSetupStatus('Connecting…', '');

    // Quick check that the server is reachable
    fetch(`${url}/api/status`, { method: 'GET', mode: 'cors', timeout: 5000 })
      .then(() => {
        serverUrl = url;
        localStorage.setItem(STORAGE_KEY, serverUrl);
        showMain();
        connect(serverUrl);
      })
      .catch(() => {
        setSetupStatus('Cannot reach PC. Verify IP and that the server is running.', 'err');
        connectBtn.disabled = false;
        connectBtn.textContent = 'Connect';
      });
  });

  findPcBtn.addEventListener('click', () => {
    setSetupStatus('Looking for PC on your Wi-Fi…', '');
    // Try common private IP ranges quickly
    const prefixes = ['192.168.1.', '192.168.0.', '10.0.0.'];
    let tried = 0;
    let found = false;

    for (const prefix of prefixes) {
      for (let i = 1; i <= 254 && !found; i++) {
        const ip = prefix + i;
        tried++;
        fetch(`http://${ip}:3000/api/discover`, {
          method: 'GET',
          mode: 'cors',
          signal: AbortSignal.timeout(800),
        })
          .then((r) => r.json())
          .then((data) => {
            if (data && data.name && !found) {
              found = true;
              pcIpInput.value = ip;
              setSetupStatus(`Found PC at ${ip}`, 'ok');
            }
          })
          .catch(() => { /* ignore */ });
      }
    }

    setTimeout(() => {
      if (!found) setSetupStatus('PC not found. Enter the IP manually.', 'err');
    }, 6000);
  });

  changePcBtn.addEventListener('click', () => {
    serverUrl = '';
    localStorage.removeItem(STORAGE_KEY);
    if (socket) socket.disconnect();
    showSetup();
  });

  // --- main screen actions ---
  copyBtn.addEventListener('click', () => copyToClipboard(clipboardDisplay.value));

  refreshBtn.addEventListener('click', () => {
    if (socket) socket.emit('clipboard:get');
    setStatus('Refreshing…', '');
  });

  sendBtn.addEventListener('click', () => {
    const text = sendInput.value;
    if (!text) {
      showToast('Type something first');
      return;
    }
    if (!socket || !isConnected) {
      showToast('Not connected to PC');
      return;
    }
    socket.emit('clipboard:update', {
      deviceId,
      text,
    });
    lastSharedText = text;
    clipboardDisplay.value = text;
    sendInput.value = '';
    setStatus('Sent to Windows', 'ok');
    showToast('Sent to PC');
  });

  sendInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendBtn.click();
  });

  // --- boot ---
  if (serverUrl) {
    showMain();
    connect(serverUrl);
  } else {
    showSetup();
  }

})();
