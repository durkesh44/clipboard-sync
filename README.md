# Clipboard Sync — iPhone <-> Windows PC

Copy & paste text seamlessly between your iPhone and Windows PC.

## How it works (fully automatic after first setup)

| Direction | What happens |
|-----------|--------------|
| **Windows → iPhone** | Copy text on Windows → it appears instantly in the iPhone app → tap "Copy to iPhone" |
| **iPhone → Windows** | Type text in the iPhone app and tap "Send" → it lands on your Windows clipboard |

No sync codes. No typing IPs every time. The iPhone remembers your PC after the first connection.

---

## What you need

- **Windows PC** with Node.js installed (`node --version` should work)
- **iPhone** on the same Wi-Fi as the PC

---

## Step 1: Start the server on your PC

Open a terminal (PowerShell or Command Prompt):

```bash
cd "C:\Users\durke\Documents\Default Project\clipboard-sync\server"
npm install   # first time only
npm start
```

You'll see output like:

```
 Network: http://192.168.1.10:3000
```

Keep this terminal window open (or minimize it). The server must be running for sync to work.

---

## Step 2: Run the Windows client (background)

Open a **second** terminal on the same PC:

```bash
cd "C:\Users\durke\Documents\Default Project\clipboard-sync\windows-client"
npm install   # first time only
node client.js
```

Or just double-click `start.bat`.

The client now watches your Windows clipboard silently. Text you copy on Windows will appear on the iPhone automatically.

### Make it start automatically with Windows (optional but recommended)

Run `setup-startup.bat` once (as a normal user). It adds a shortcut to your Windows Startup folder so the client launches every time you log in:

```bash
cd "C:\Users\durke\Documents\Default Project\clipboard-sync\windows-client"
setup-startup.bat
```

---

## Step 3: Connect your iPhone (one-time only)

1. On your iPhone, open **Safari**.
2. Go to: `http://<your-pc-ip>:3000`  
   (e.g. `http://192.168.1.10:3000`)
3. Tap **Connect**. If you're not sure of the IP, tap **Find my PC** to scan your Wi-Fi.
4. That's it — the iPhone saves your PC address and won't ask again.

---

## Step 4: Install as a home-screen app (optional, recommended)

In Safari, tap the **Share** button → **Add to Home Screen**.  
Now "Clipboard Sync" opens like a real app with one tap.

---

## Daily use (no manual steps)

1. Make sure the PC server + client are running.
2. Open the Clipboard Sync app on your iPhone.
3. Copy text on either device — it shows up on the other automatically.
4. On iPhone, tap **Copy to iPhone** to grab PC text.  
   On iPhone, type and tap **Send** to push text to Windows.

---

## Finding your PC's IP

- Press `Win + R`, type `cmd`, enter `ipconfig`
- Look for **IPv4 Address** under your Wi-Fi adapter (e.g. `192.168.1.10`)

---

## Important iOS limitation

Apple does **not** allow apps (including web apps) to read the iPhone's system clipboard in the background. This means:

- **Windows → iPhone:** Fully automatic. PC text appears on iPhone instantly.
- **iPhone → Windows:** You must open the iPhone app, type/paste text, and tap **Send**.

For a fully silent native iPhone app (background clipboard access), you would need a Mac, Xcode, and a $99/year Apple Developer account. The PWA approach above is the closest no-Apple-account solution.

---

## Troubleshooting

- **iPhone can't connect:** Make sure both devices are on the same Wi-Fi, and use the PC's **Network** IP (not `localhost`). Windows Firewall may ask to allow Node.js on port 3000 — say yes.
- **Text not appearing on Windows:** Ensure `node client.js` is running on the PC.
- **Port 3000 already in use:** Close any other instance of the server, or change `PORT` in `server/server.js`.
- **Copy button doesn't work on iPhone:** It must be tapped directly (Safari requirement for clipboard access).
