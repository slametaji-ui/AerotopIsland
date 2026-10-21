const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  setIgnoreMouseEvents: (ignore, options) => {
    ipcRenderer.send('set-ignore-mouse-events', ignore, options);
  },
  getSystemMetrics: () => ipcRenderer.invoke('get-system-metrics'),
  controlSystemMedia: (action, value) => ipcRenderer.invoke('control-system-media', action, value),
  onSystemMediaUpdate: (callback) => {
    ipcRenderer.on('system-media-update', (_event, data) => callback(data));
  },
  // Windows Master Volume
  getSystemVolume: () => ipcRenderer.invoke('get-system-volume'),
  setSystemVolume: (vol) => ipcRenderer.invoke('set-system-volume', vol),
  toggleSystemMute: () => ipcRenderer.invoke('toggle-system-mute'),
  // Notification System
  onIncomingNotification: (callback) => {
    ipcRenderer.on('incoming-notification', (_event, data) => callback(data));
  },
  triggerTestNotification: (appType) => {
    ipcRenderer.send('trigger-test-notification', appType);
  },
  // Clipboard APIs
  getClipboardHistory: () => ipcRenderer.invoke('get-clipboard-history'),
  copyClipboardItem: (item) => ipcRenderer.invoke('copy-clipboard-item', item),
  togglePinClipboardItem: (id) => ipcRenderer.invoke('toggle-pin-clipboard-item', id),
  deleteClipboardItem: (id) => ipcRenderer.invoke('delete-clipboard-item', id),
  clearUnpinnedClipboard: () => ipcRenderer.invoke('clear-unpinned-clipboard'),
  onClipboardUpdate: (callback) => {
    ipcRenderer.on('clipboard-update', (_event, history) => callback(history));
  },
  quitApp: () => ipcRenderer.send('quit-app'),
  hideApp: () => ipcRenderer.send('hide-app'),
  setWindowPosition: (offsetY) => ipcRenderer.send('set-window-position', offsetY),
  onToggleExpand: (callback) => {
    ipcRenderer.on('toggle-expand-island', (_event, value) => callback(value));
  }
});
