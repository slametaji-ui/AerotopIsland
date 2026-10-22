const { app, BrowserWindow, ipcMain, screen, Tray, Menu, nativeImage, globalShortcut, clipboard } = require('electron');
const path = require('path');
const os = require('os');
const fs = require('fs');
const { execFile } = require('child_process');
const loudness = require('loudness');

// Disable GPU disk cache to avoid Windows lock/access denied errors
app.commandLine.appendSwitch('disable-gpu-shader-disk-cache');
app.commandLine.appendSwitch('disable-http-cache');

// Ensure only a single instance of Dynamic Island runs
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  let mainWindow = null;
  let ambientWindow = null;
  let tray = null;
  let prevCpuTimes = null;
  let mediaPollInterval = null;
  let clipboardPollInterval = null;
  let notifPollInterval = null;
  let drivePollInterval = null;
  let isMediaActionRunning = false;
  let isNotifCheckRunning = false;
  let isDriveCheckRunning = false;
  let knownDrives = new Map();
  let isInitialDriveCheck = true;
  let lastNotificationId = 0;
  let isInitialNotifCheck = true;

  // Clipboard Manager Storage
  let clipboardHistory = [];
  let lastText = '';
  let lastImageHash = '';

  app.on('second-instance', () => {
    if (mainWindow) {
      if (!mainWindow.isVisible()) {
        mainWindow.show();
      }
      mainWindow.focus();
    }
  });

  // Calculate CPU Usage percentage
  function getCpuUsage() {
    const cpus = os.cpus();
    let idle = 0;
    let total = 0;

    for (const cpu of cpus) {
      for (const type in cpu.times) {
        total += cpu.times[type];
      }
      idle += cpu.times.idle;
    }

    if (!prevCpuTimes) {
      prevCpuTimes = { idle, total };
      return 15;
    }

    const idleDiff = idle - prevCpuTimes.idle;
    const totalDiff = total - prevCpuTimes.total;
    prevCpuTimes = { idle, total };

    if (totalDiff <= 0) return 10;
    const usage = Math.round(100 - (100 * idleDiff / totalDiff));
    return Math.max(0, Math.min(100, usage));
  }

  // Resolve script path for both development and packaged binary
  function getScriptPath(scriptName) {
    if (app.isPackaged) {
      return path.join(process.resourcesPath, scriptName);
    }
    return path.join(__dirname, scriptName);
  }

  // Windows Media GSMTC Controller via PowerShell
  function querySystemMedia(action = 'get', value = 0) {
    return new Promise((resolve) => {
      if (isMediaActionRunning && action === 'get') {
        return resolve({ status: 'none' });
      }
      isMediaActionRunning = true;

      const scriptPath = getScriptPath('media-controller.ps1');
      const args = ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', scriptPath, '-Action', action, '-Value', String(value)];

      execFile('powershell', args, { timeout: 3500 }, (error, stdout) => {
        isMediaActionRunning = false;
        if (error || !stdout) {
          return resolve({ status: 'none' });
        }
        try {
          const trimmed = stdout.trim();
          const jsonStart = trimmed.indexOf('{');
          const jsonEnd = trimmed.lastIndexOf('}');
          if (jsonStart !== -1 && jsonEnd !== -1) {
            const parsed = JSON.parse(trimmed.slice(jsonStart, jsonEnd + 1));
            return resolve(parsed);
          }
        } catch (e) {
          // ignore parse error
        }
        resolve({ status: 'none' });
      });
    });
  }

  // Windows Notification Listener via PowerShell
  function checkWindowsNotifications() {
    if (isNotifCheckRunning) return;
    isNotifCheckRunning = true;

    const scriptPath = getScriptPath('notification-listener.ps1');
    const args = ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', scriptPath, '-LastKnownId', String(lastNotificationId)];

    execFile('powershell', args, { timeout: 3000 }, (error, stdout) => {
      isNotifCheckRunning = false;
      if (error || !stdout) return;
      try {
        const trimmed = stdout.trim();
        const jsonStart = trimmed.indexOf('{');
        const jsonEnd = trimmed.lastIndexOf('}');
        if (jsonStart !== -1 && jsonEnd !== -1) {
          const parsed = JSON.parse(trimmed.slice(jsonStart, jsonEnd + 1));
          if (parsed.lastId) {
            lastNotificationId = parsed.lastId;
          }
          if (parsed.hasNew && parsed.id) {
            lastNotificationId = parsed.id;
            // Skip sending on initial check to avoid spamming historical notifications
            if (!isInitialNotifCheck && mainWindow && !mainWindow.isDestroyed()) {
              mainWindow.webContents.send('incoming-notification', parsed);
            }
          }
          isInitialNotifCheck = false;
        }
      } catch (e) {}
    });
  }

  // Windows Storage & USB Drives Listener via PowerShell CIM
  function checkSystemDrives() {
    if (isDriveCheckRunning) return;
    isDriveCheckRunning = true;

    const psCommand = `Get-CimInstance Win32_LogicalDisk | Select-Object DeviceId, DriveType, VolumeName, Size, FreeSpace | ConvertTo-Json -Compress`;
    const args = ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-Command', psCommand];

    execFile('powershell', args, { timeout: 3500 }, (error, stdout) => {
      isDriveCheckRunning = false;
      if (error || !stdout) return;
      try {
        let drives = JSON.parse(stdout.trim());
        if (!Array.isArray(drives)) {
          drives = [drives];
        }

        const currentMap = new Map();
        for (const d of drives) {
          if (!d.DeviceId) continue;
          currentMap.set(d.DeviceId, {
            deviceId: d.DeviceId,
            driveType: d.DriveType, // 2: Removable, 3: Fixed, 4: Network, 5: CD-ROM
            name: d.VolumeName || (d.DriveType === 2 ? 'USB Drive' : 'Local Disk'),
            sizeBytes: d.Size || 0,
            freeBytes: d.FreeSpace || 0,
            isRemovable: d.DriveType === 2
          });
        }

        if (!isInitialDriveCheck && mainWindow && !mainWindow.isDestroyed()) {
          // Detect newly plugged drives
          for (const [id, info] of currentMap.entries()) {
            if (!knownDrives.has(id)) {
              mainWindow.webContents.send('drive-plugged', info);
            }
          }
          // Detect unplugged drives
          for (const [id, info] of knownDrives.entries()) {
            if (!currentMap.has(id)) {
              mainWindow.webContents.send('drive-unplugged', info);
            }
          }
        }

        knownDrives = currentMap;
        isInitialDriveCheck = false;
      } catch (e) {}
    });
  }

  function ejectSystemDrive(deviceId) {
    return new Promise((resolve) => {
      if (!deviceId) return resolve({ success: false, message: 'Invalid drive' });
      const cleanId = deviceId.replace(/[^a-zA-Z:]/g, '').toUpperCase();
      const psCommand = `(New-Object -ComObject Shell.Application).Namespace(17).ParseName('${cleanId}').InvokeVerb('Eject')`;
      execFile('powershell', ['-NoProfile', '-Command', psCommand], { timeout: 4000 }, (err) => {
        if (err) {
          return resolve({ success: false, message: err.message });
        }
        knownDrives.delete(cleanId);
        resolve({ success: true, deviceId: cleanId });
      });
    });
  }

  // Clipboard Management Helpers
  function trimClipboardHistory() {
    const pinned = clipboardHistory.filter(i => i.pinned);
    const unpinned = clipboardHistory.filter(i => !i.pinned).slice(0, 35);
    clipboardHistory = [...pinned, ...unpinned];
  }

  function broadcastClipboardUpdate() {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('clipboard-update', clipboardHistory);
    }
  }

  function monitorClipboard() {
    try {
      const text = clipboard.readText();
      if (text && text.trim() && text !== lastText) {
        lastText = text;
        const existingIdx = clipboardHistory.findIndex(i => i.type === 'text' && i.content === text);
        if (existingIdx !== -1) {
          const item = clipboardHistory.splice(existingIdx, 1)[0];
          clipboardHistory.unshift({ ...item, timestamp: Date.now() });
        } else {
          clipboardHistory.unshift({
            id: 'clip_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
            type: 'text',
            content: text,
            pinned: false,
            timestamp: Date.now()
          });
        }
        trimClipboardHistory();
        broadcastClipboardUpdate();
        return;
      }

      const image = clipboard.readImage();
      if (!image.isEmpty()) {
        const size = image.getSize();
        const hash = `${size.width}x${size.height}_${image.toBitmap().length}`;
        if (hash !== lastImageHash) {
          lastImageHash = hash;
          const dataUrl = image.toDataURL();
          clipboardHistory.unshift({
            id: 'clip_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
            type: 'image',
            content: dataUrl,
            pinned: false,
            timestamp: Date.now(),
            dimensions: `${size.width} × ${size.height}`
          });
          trimClipboardHistory();
          broadcastClipboardUpdate();
        }
      }
    } catch (e) {}
  }

  // Create a minimalist Tray Icon (Dynamic Island pill shaped icon)
  function createTrayIcon() {
    const width = 16;
    const height = 16;
    const buffer = Buffer.alloc(width * height * 4);

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4;
        if (x >= 2 && x <= 13 && y >= 5 && y <= 10) {
          buffer[idx] = 255;
          buffer[idx + 1] = 255;
          buffer[idx + 2] = 255;
          buffer[idx + 3] = 240;
        } else {
          buffer[idx + 3] = 0;
        }
      }
    }

    return nativeImage.createFromBuffer(buffer, { width, height });
  }

  function createWindow() {
    const primaryDisplay = screen.getPrimaryDisplay();
    const { width: screenWidth } = primaryDisplay.workAreaSize;

    const windowWidth = 680;
    const windowHeight = 380;
    const initialX = Math.round((screenWidth - windowWidth) / 2);
    const initialY = 6;

    mainWindow = new BrowserWindow({
      width: windowWidth,
      height: windowHeight,
      x: initialX,
      y: initialY,
      frame: false,
      transparent: true,
      alwaysOnTop: true,
      skipTaskbar: true,
      resizable: false,
      hasShadow: false,
      icon: path.join(__dirname, 'icon.png'),
      webPreferences: {
        preload: path.join(__dirname, 'preload.js'),
        contextIsolation: true,
        nodeIntegration: false
      }
    });

    mainWindow.setAlwaysOnTop(true, 'screen-saver');
    mainWindow.loadFile('index.html');

    mainWindow.setIgnoreMouseEvents(true, { forward: true });

    screen.on('display-metrics-changed', () => {
      if (!mainWindow) return;
      const currentScreen = screen.getPrimaryDisplay();
      const newX = Math.round((currentScreen.workAreaSize.width - windowWidth) / 2);
      mainWindow.setPosition(newX, initialY);
    });

    mainWindow.on('closed', () => {
      mainWindow = null;
      if (mediaPollInterval) clearInterval(mediaPollInterval);
      if (clipboardPollInterval) clearInterval(clipboardPollInterval);
      if (notifPollInterval) clearInterval(notifPollInterval);
      if (drivePollInterval) clearInterval(drivePollInterval);
    });

    // Start background media polling (YouTube, Spotify, etc.)
    mediaPollInterval = setInterval(async () => {
      if (mainWindow && !mainWindow.isDestroyed()) {
        const media = await querySystemMedia('get');
        mainWindow.webContents.send('system-media-update', media);
      }
    }, 2000);

    // Start background clipboard polling
    clipboardPollInterval = setInterval(monitorClipboard, 750);

    // Start background notification listener
    checkWindowsNotifications();
    notifPollInterval = setInterval(checkWindowsNotifications, 2500);

    // Start background drive listener (USB & Storage)
    checkSystemDrives();
    drivePollInterval = setInterval(checkSystemDrives, 3500);
  }

  function createAmbientWindow() {
    if (ambientWindow && !ambientWindow.isDestroyed()) {
      ambientWindow.show();
      ambientWindow.focus();
      return;
    }

    const primaryDisplay = screen.getPrimaryDisplay();
    const { width, height } = primaryDisplay.bounds;

    ambientWindow = new BrowserWindow({
      width,
      height,
      x: 0,
      y: 0,
      frame: false,
      fullscreen: true,
      transparent: false,
      backgroundColor: '#0a0a14',
      alwaysOnTop: true,
      skipTaskbar: true,
      show: false,
      webPreferences: {
        preload: path.join(__dirname, 'preload.js'),
        contextIsolation: true,
        nodeIntegration: false
      }
    });

    ambientWindow.setAlwaysOnTop(true, 'screen-saver');
    ambientWindow.loadFile('ambient.html');

    ambientWindow.once('ready-to-show', () => {
      ambientWindow.show();
      ambientWindow.focus();
    });

    ambientWindow.on('closed', () => {
      ambientWindow = null;
    });
  }

  function closeAmbientWindow() {
    if (ambientWindow && !ambientWindow.isDestroyed()) {
      ambientWindow.close();
      ambientWindow = null;
    }
  }

  function setupTray() {
    const iconPath = path.join(__dirname, 'favicon.png');
    let icon;
    try {
      icon = nativeImage.createFromPath(iconPath).resize({ width: 16, height: 16 });
    } catch (e) {
      icon = createTrayIcon();
    }
    tray = new Tray(icon);
    tray.setToolTip('Aerotop Island for Windows');

    const contextMenu = Menu.buildFromTemplate([
      {
        label: 'Aerotop Island',
        enabled: false
      },
      { type: 'separator' },
      {
        label: 'Toggle Expand / Collapse',
        accelerator: 'Ctrl+Shift+D',
        click: () => {
          if (mainWindow) {
            mainWindow.webContents.send('toggle-expand-island');
          }
        }
      },
      {
        label: 'Reset Position (Top Center)',
        click: () => {
          if (mainWindow) {
            const { width: screenWidth } = screen.getPrimaryDisplay().workAreaSize;
            mainWindow.setPosition(Math.round((screenWidth - 680) / 2), 6);
          }
        }
      },
      {
        label: 'Toggle Visibility',
        click: () => {
          if (mainWindow) {
            if (mainWindow.isVisible()) {
              mainWindow.hide();
            } else {
              mainWindow.show();
            }
          }
        }
      },
      {
        label: 'Run on Startup (Auto-run)',
        type: 'checkbox',
        checked: app.getLoginItemSettings().openAtLogin,
        click: (menuItem) => {
          app.setLoginItemSettings({
            openAtLogin: menuItem.checked,
            path: app.getPath('exe')
          });
        }
      },
      { type: 'separator' },
      {
        label: 'Quit',
        click: () => {
          app.quit();
        }
      }
    ]);

    tray.setContextMenu(contextMenu);
    tray.on('click', () => {
      if (mainWindow) {
        if (mainWindow.isVisible()) {
          mainWindow.webContents.send('toggle-expand-island');
        } else {
          mainWindow.show();
        }
      }
    });
  }

  // IPC Handlers
  ipcMain.on('set-ignore-mouse-events', (event, ignore, options) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (win && !win.isDestroyed()) {
      win.setIgnoreMouseEvents(ignore, options);
    }
  });

  ipcMain.handle('get-system-metrics', async () => {
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;
    const memPercent = Math.round((usedMem / totalMem) * 100);
    const cpuPercent = getCpuUsage();

    return {
      cpuPercent,
      memPercent,
      usedMemGb: (usedMem / (1024 ** 3)).toFixed(1),
      totalMemGb: (totalMem / (1024 ** 3)).toFixed(1),
      uptimeHours: (os.uptime() / 3600).toFixed(1)
    };
  });

  ipcMain.handle('control-system-media', async (_event, action, value = 0) => {
    return querySystemMedia(action, value);
  });

  // Windows Master Volume IPC Handlers
  ipcMain.handle('get-system-volume', async () => {
    try {
      const vol = await loudness.getVolume();
      const muted = await loudness.getMuted();
      return { volume: vol, muted };
    } catch (e) {
      return { volume: 50, muted: false };
    }
  });

  ipcMain.handle('set-system-volume', async (_event, vol) => {
    try {
      const targetVol = Math.max(0, Math.min(100, Math.round(vol)));
      await loudness.setVolume(targetVol);
      if (targetVol > 0) {
        await loudness.setMuted(false);
      }
      return true;
    } catch (e) {
      return false;
    }
  });

  ipcMain.handle('toggle-system-mute', async () => {
    try {
      const muted = await loudness.getMuted();
      await loudness.setMuted(!muted);
      const vol = await loudness.getVolume();
      return { muted: !muted, volume: vol };
    } catch (e) {
      return { muted: false, volume: 50 };
    }
  });

  // Test Notification Trigger
  ipcMain.on('trigger-test-notification', (_event, appType) => {
    if (!mainWindow) return;
    let mock = {};
    if (appType === 'wa') {
      mock = {
        hasNew: true,
        id: Date.now(),
        app: 'WhatsApp',
        title: 'WhatsApp Web • Budi Santoso',
        body: 'Halo bro! Besok jadi meeting jam 10 pagi?'
      };
    } else {
      mock = {
        hasNew: true,
        id: Date.now(),
        app: 'Mail',
        title: 'Email • Google Cloud Alerts',
        body: 'Your monthly statement is ready for review.'
      };
    }
    mainWindow.webContents.send('incoming-notification', mock);
  });

  // Clipboard IPC Handlers
  ipcMain.handle('get-clipboard-history', () => {
    return clipboardHistory;
  });

  ipcMain.handle('copy-clipboard-item', async (_event, item) => {
    if (!item) return false;
    if (item.type === 'text') {
      lastText = item.content;
      clipboard.writeText(item.content);
    } else if (item.type === 'image') {
      const img = nativeImage.createFromDataURL(item.content);
      const size = img.getSize();
      lastImageHash = `${size.width}x${size.height}_${img.toBitmap().length}`;
      clipboard.writeImage(img);
    }
    return true;
  });

  ipcMain.handle('toggle-pin-clipboard-item', (_event, id) => {
    const item = clipboardHistory.find(i => i.id === id);
    if (item) {
      item.pinned = !item.pinned;
      trimClipboardHistory();
      broadcastClipboardUpdate();
    }
    return clipboardHistory;
  });

  ipcMain.handle('delete-clipboard-item', (_event, id) => {
    clipboardHistory = clipboardHistory.filter(i => i.id !== id);
    broadcastClipboardUpdate();
    return clipboardHistory;
  });

  ipcMain.handle('clear-unpinned-clipboard', () => {
    clipboardHistory = clipboardHistory.filter(i => i.pinned);
    broadcastClipboardUpdate();
    return clipboardHistory;
  });

  // Storage & Drive IPC Handlers
  ipcMain.handle('get-system-drives', () => {
    return Array.from(knownDrives.values());
  });

  ipcMain.handle('eject-drive', async (_event, deviceId) => {
    return ejectSystemDrive(deviceId);
  });

  ipcMain.on('quit-app', () => {
    app.quit();
  });

  ipcMain.on('hide-app', () => {
    if (mainWindow) {
      mainWindow.hide();
    }
  });

  ipcMain.on('set-window-position', (_event, offsetY) => {
    if (mainWindow) {
      const { width: screenWidth } = screen.getPrimaryDisplay().workAreaSize;
      const newY = Math.max(0, Math.min(200, offsetY));
      mainWindow.setPosition(Math.round((screenWidth - 680) / 2), newY);
    }
  });

  // Ambient Fullscreen IPC
  ipcMain.on('open-ambient-fullscreen', () => {
    createAmbientWindow();
  });

  ipcMain.on('close-ambient-fullscreen', () => {
    closeAmbientWindow();
  });

  ipcMain.handle('get-user-profile', () => {
    const username = os.userInfo().username || process.env.USERNAME || 'Windows User';
    let avatarDataUrl = null;

    try {
      const publicAcc = path.join(process.env.PUBLIC || 'C:\\Users\\Public', 'AccountPictures');
      if (fs.existsSync(publicAcc)) {
        const subdirs = fs.readdirSync(publicAcc).filter(f => f.startsWith('S-1-5-'));
        for (const dir of subdirs) {
          const fullDir = path.join(publicAcc, dir);
          const images = fs.readdirSync(fullDir).filter(f => f.endsWith('.jpg') || f.endsWith('.png'));
          const preferred = images.find(f => f.includes('Image192')) || images.find(f => f.includes('Image208')) || images.find(f => f.includes('Image240')) || images[0];
          if (preferred) {
            const imgPath = path.join(fullDir, preferred);
            const buf = fs.readFileSync(imgPath);
            avatarDataUrl = 'data:image/jpeg;base64,' + buf.toString('base64');
            break;
          }
        }
      }
    } catch (e) {}

    return { username, avatarDataUrl };
  });

  app.whenReady().then(() => {
    createWindow();
    setupTray();

    globalShortcut.register('Ctrl+Shift+D', () => {
      if (mainWindow) {
        mainWindow.webContents.send('toggle-expand-island');
      }
    });

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
      }
    });
  });

  app.on('will-quit', () => {
    globalShortcut.unregisterAll();
  });

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      app.quit();
    }
  });
}
