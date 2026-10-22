// ==========================================
// DYNAMIC ISLAND WINDOWS - RENDERER CONTROLLER
// ==========================================

document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements
  const dynamicIsland = document.getElementById('dynamic-island');
  const compactView = document.getElementById('compact-view');
  const expandedView = document.getElementById('expanded-view');
  const btnCollapse = document.getElementById('btn-collapse');
  const btnPin = document.getElementById('btn-pin');
  const compactTime = document.getElementById('compact-time');
  const compactBatteryText = document.getElementById('compact-battery-text');
  const compactBatteryFill = document.getElementById('compact-battery-fill');
  const compactChargingIcon = document.getElementById('compact-charging-icon');
  const compactMediaIndicator = document.getElementById('compact-media-indicator');
  const compactTimerBadge = document.getElementById('compact-timer-badge');
  const compactTimerVal = document.getElementById('compact-timer-val');

  // Nav tabs
  const navTabs = document.querySelectorAll('.nav-tab');
  const tabPanes = document.querySelectorAll('.tab-pane');

  // Music Player Elements
  const btnPlay = document.getElementById('btn-play');
  const iconPlay = document.getElementById('icon-play');
  const iconPause = document.getElementById('icon-pause');
  const btnPrev = document.getElementById('btn-prev');
  const btnNext = document.getElementById('btn-next');
  const trackTitle = document.getElementById('track-title');
  const trackArtist = document.getElementById('track-artist');
  const musicWave = document.getElementById('music-wave');
  const albumArt = document.getElementById('album-art');
  const trackScrubber = document.getElementById('track-scrubber');
  const timeCurrent = document.getElementById('time-current');
  const timeTotal = document.getElementById('time-total');
  const volSlider = document.getElementById('vol-slider');
  const btnMute = document.getElementById('btn-mute');

  // Timer Elements
  const timerDisplay = document.getElementById('timer-display');
  const timerRing = document.getElementById('timer-progress-ring');
  const presetPills = document.querySelectorAll('.preset-pill');
  const btnTimerStart = document.getElementById('btn-timer-start');
  const btnTimerReset = document.getElementById('btn-timer-reset');

  // System Metrics Elements
  const sysBatteryVal = document.getElementById('sys-battery-val');
  const sysBatteryBar = document.getElementById('sys-battery-bar');
  const sysChargingTag = document.getElementById('sys-charging-tag');
  const sysCpuVal = document.getElementById('sys-cpu-val');
  const sysCpuBar = document.getElementById('sys-cpu-bar');
  const sysRamVal = document.getElementById('sys-ram-val');
  const sysRamBar = document.getElementById('sys-ram-bar');
  const sysRamSub = document.getElementById('sys-ram-sub');

  // Quick Tools Elements
  const scratchpad = document.getElementById('scratchpad-input');
  const btnClearNote = document.getElementById('btn-clear-note');
  const scCalc = document.getElementById('sc-calc');
  const scTaskmgr = document.getElementById('sc-taskmgr');
  const scNotepad = document.getElementById('sc-notepad');

  // Settings Elements
  const colorDots = document.querySelectorAll('.color-dot');
  const settingHoverExpand = document.getElementById('setting-hover-expand');
  const btnQuitApp = document.getElementById('btn-quit-app');

  const dotView = document.getElementById('dot-view');
  const notificationView = document.getElementById('notification-view');
  const notifAppIcon = document.getElementById('notif-app-icon');
  const notifTitle = document.getElementById('notif-title');
  const notifBody = document.getElementById('notif-body');
  const dotStatusAura = document.getElementById('dot-status-aura');
  const btnTestWa = document.getElementById('btn-test-wa');
  const btnTestEmail = document.getElementById('btn-test-email');
  const btnTestUsb = document.getElementById('btn-test-usb');
  const btnTestAmbient = document.getElementById('btn-test-ambient');

  // Ambient & Drive Elements
  const driveView = document.getElementById('drive-view');
  const driveBannerTitle = document.getElementById('drive-banner-title');
  const driveBannerSub = document.getElementById('drive-banner-sub');
  const btnQuickEject = document.getElementById('btn-quick-eject');
  const ambientView = document.getElementById('ambient-view');
  const ambientClockDigits = document.getElementById('ambient-clock-digits');
  const ambientDateLabel = document.getElementById('ambient-date-label');
  const ambientTimeSec = document.getElementById('ambient-time-sec');
  const ambientBatteryText = document.getElementById('ambient-battery-text');
  const settingAmbientMode = document.getElementById('setting-ambient-mode');
  const drivesList = document.getElementById('drives-list');
  const sysStorageSub = document.getElementById('sys-storage-sub');

  // Calc Elements
  const calcInput = document.getElementById('calc-input');
  const calcResult = document.getElementById('calc-result');
  const calcButtons = document.querySelectorAll('.calc-btn');
  const convPresetBtns = document.querySelectorAll('.conv-preset-btn');
  const btnCopyCalcRes = document.getElementById('btn-copy-calc-res');

  // State
  let isExpanded = false;
  let isPinned = false;
  let isAmbientActive = false;
  let autoExpandOnHover = localStorage.getItem('auto_expand_hover') !== 'false';
  let ambientModeEnabled = localStorage.getItem('ambient_mode_enabled') !== 'false';
  let collapseTimer = null;
  let notifTimeout = null;
  let driveBannerTimeout = null;
  let lastActiveDrive = null;
  let lastUserActivity = Date.now();

  if (settingHoverExpand) {
    settingHoverExpand.checked = autoExpandOnHover;
  }
  if (settingAmbientMode) {
    settingAmbientMode.checked = ambientModeEnabled;
  }

  // ================= 1. HOVER EXPAND, SMOOTH MORPH & DOT STATE =================
  function expandIsland(tabName = null) {
    if (collapseTimer) {
      clearTimeout(collapseTimer);
      collapseTimer = null;
    }
    if (notifTimeout) {
      clearTimeout(notifTimeout);
      notifTimeout = null;
    }
    if (driveBannerTimeout) {
      clearTimeout(driveBannerTimeout);
      driveBannerTimeout = null;
    }
    isAmbientActive = false;
    lastUserActivity = Date.now();

    isExpanded = true;
    dynamicIsland.className = 'dynamic-island state-expanded';

    if (window.electronAPI) {
      window.electronAPI.setIgnoreMouseEvents(false);
    }
    if (tabName) {
      switchTab(tabName);
    }
  }

  function collapseIsland() {
    if (collapseTimer) {
      clearTimeout(collapseTimer);
      collapseTimer = null;
    }
    if (notifTimeout) {
      clearTimeout(notifTimeout);
      notifTimeout = null;
    }
    if (driveBannerTimeout) {
      clearTimeout(driveBannerTimeout);
      driveBannerTimeout = null;
    }
    isAmbientActive = false;
    lastUserActivity = Date.now();

    isExpanded = false;
    // Morph smoothly back into the minimal DOT
    dynamicIsland.className = 'dynamic-island state-dot';

    setTimeout(() => {
      if (!isExpanded && !isAmbientActive && window.electronAPI) {
        window.electronAPI.setIgnoreMouseEvents(true, { forward: true });
      }
    }, 350);
  }

  // Drive Banner & Ambient State Triggers
  function showDriveBanner(drive) {
    if (!drive || isExpanded) return;
    lastActiveDrive = drive;
    isAmbientActive = false;
    playDriveChime();

    const freeGb = (drive.freeBytes / (1024 ** 3)).toFixed(1);
    const totalGb = (drive.sizeBytes / (1024 ** 3)).toFixed(1);
    const driveName = drive.name || 'Removable Disk';
    driveBannerTitle.textContent = `${driveName} (${drive.deviceId})`;
    driveBannerSub.textContent = `${freeGb} GB Free of ${totalGb} GB`;

    dynamicIsland.className = 'dynamic-island state-drive';

    if (window.electronAPI) {
      window.electronAPI.setIgnoreMouseEvents(false);
    }

    if (driveBannerTimeout) clearTimeout(driveBannerTimeout);
    driveBannerTimeout = setTimeout(() => {
      if (!isExpanded && dynamicIsland.classList.contains('state-drive')) {
        collapseIsland();
      }
    }, 5500);
  }

  function enterAmbientMode() {
    if (isExpanded || isAmbientActive) return;
    isAmbientActive = true;
    lastUserActivity = Date.now();

    if (window.electronAPI && window.electronAPI.openAmbientFullscreen) {
      window.electronAPI.openAmbientFullscreen();
    } else {
      dynamicIsland.className = 'dynamic-island state-ambient';
      updateAmbientClock();
      if (window.electronAPI) {
        window.electronAPI.setIgnoreMouseEvents(false);
      }
    }
  }

  function playDriveChime() {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.55);
    } catch (e) {}
  }

  // Notification Neon Chime Sound
  function playNotifChime() {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime);
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.1);

      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.2, ctx.currentTime + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.65);
    } catch (e) {}
  }

  // Show Incoming Notification with Neon Glow Aura
  function showIncomingNotification(notif) {
    if (!notif) return;
    if (isExpanded) return; // Keep user work uninterrupted if expanded

    playNotifChime();

    const appName = (notif.app || '').toLowerCase();
    const title = Array.isArray(notif.title) ? notif.title.join(' • ') : (notif.title || notif.app || 'Notifikasi');
    const body = Array.isArray(notif.body) ? notif.body.join(' ') : (notif.body || '');

    notifTitle.textContent = title;
    notifBody.textContent = body || 'Pesan baru diterima';

    let neonClass = 'neon-alert';
    if (appName.includes('whatsapp')) {
      notifAppIcon.textContent = '🟢';
      neonClass = 'neon-whatsapp';
    } else if (appName.includes('mail') || appName.includes('outlook') || appName.includes('email')) {
      notifAppIcon.textContent = '✉️';
      neonClass = 'neon-email';
    } else {
      notifAppIcon.textContent = '🔔';
      neonClass = 'neon-alert';
    }

    dynamicIsland.className = `dynamic-island state-notification ${neonClass}`;

    if (window.electronAPI) {
      window.electronAPI.setIgnoreMouseEvents(false);
    }

    if (notifTimeout) clearTimeout(notifTimeout);
    notifTimeout = setTimeout(() => {
      if (!isExpanded) {
        collapseIsland();
      }
    }, 4500);
  }

  // Listen for Live Incoming Windows Notifications
  if (window.electronAPI && window.electronAPI.onIncomingNotification) {
    window.electronAPI.onIncomingNotification((notif) => {
      showIncomingNotification(notif);
    });
  }

  // Click on Dot or Notification opens island
  if (dotView) {
    dotView.addEventListener('click', (e) => {
      e.stopPropagation();
      expandIsland();
    });
  }

  if (notificationView) {
    notificationView.addEventListener('click', (e) => {
      e.stopPropagation();
      expandIsland();
    });
  }

  if (driveView) {
    driveView.addEventListener('click', (e) => {
      e.stopPropagation();
      expandIsland('system');
    });
  }

  if (ambientView) {
    ambientView.addEventListener('click', (e) => {
      e.stopPropagation();
      expandIsland();
    });
  }

  if (btnQuickEject) {
    btnQuickEject.addEventListener('click', async (e) => {
      e.stopPropagation();
      if (lastActiveDrive && window.electronAPI && window.electronAPI.ejectDrive) {
        btnQuickEject.textContent = '⏳ Ejecting...';
        const res = await window.electronAPI.ejectDrive(lastActiveDrive.deviceId);
        if (res.success) {
          driveBannerTitle.textContent = 'Safe to Remove';
          driveBannerSub.textContent = `${lastActiveDrive.deviceId} has been safely ejected`;
          btnQuickEject.textContent = '✅ Ejected';
          setTimeout(() => collapseIsland(), 2500);
        } else {
          btnQuickEject.textContent = '⚠️ Failed';
          setTimeout(() => { btnQuickEject.textContent = '⏏️ Eject'; }, 2000);
        }
      }
    });
  }

  // Live Drive Pluggable events
  if (window.electronAPI && window.electronAPI.onDrivePlugged) {
    window.electronAPI.onDrivePlugged((drive) => {
      showDriveBanner(drive);
      loadSystemDrives();
    });
  }

  if (window.electronAPI && window.electronAPI.onDriveUnplugged) {
    window.electronAPI.onDriveUnplugged(() => {
      loadSystemDrives();
    });
  }

  // Test Buttons in Settings
  if (btnTestWa) {
    btnTestWa.addEventListener('click', () => {
      if (window.electronAPI && window.electronAPI.triggerTestNotification) {
        window.electronAPI.triggerTestNotification('wa');
      }
    });
  }

  if (btnTestEmail) {
    btnTestEmail.addEventListener('click', () => {
      if (window.electronAPI && window.electronAPI.triggerTestNotification) {
        window.electronAPI.triggerTestNotification('email');
      }
    });
  }

  if (btnTestUsb) {
    btnTestUsb.addEventListener('click', () => {
      showDriveBanner({
        deviceId: 'F:',
        name: 'Sandisk Ultra USB',
        driveType: 2,
        sizeBytes: 32000000000,
        freeBytes: 24500000000,
        isRemovable: true
      });
    });
  }

  if (btnTestAmbient) {
    btnTestAmbient.addEventListener('click', () => {
      enterAmbientMode();
    });
  }

  // Mousemove listener across transparent window
  window.addEventListener('mousemove', (e) => {
    const rect = dynamicIsland.getBoundingClientRect();
    const buffer = 6;
    const isInside = (
      e.clientX >= rect.left - buffer &&
      e.clientX <= rect.right + buffer &&
      e.clientY >= rect.top - buffer &&
      e.clientY <= rect.bottom + buffer
    );

    if (isInside) {
      if (collapseTimer) {
        clearTimeout(collapseTimer);
        collapseTimer = null;
      }
      if (autoExpandOnHover && !isExpanded) {
        expandIsland();
      } else if (window.electronAPI) {
        window.electronAPI.setIgnoreMouseEvents(false);
      }
    } else {
      if (isExpanded && !isPinned && autoExpandOnHover) {
        if (!collapseTimer) {
          collapseTimer = setTimeout(() => {
            collapseIsland();
            collapseTimer = null;
          }, 380);
        }
      }
    }
  });

  // Direct element enter/leave listeners
  dynamicIsland.addEventListener('mouseenter', () => {
    if (collapseTimer) {
      clearTimeout(collapseTimer);
      collapseTimer = null;
    }
    if (window.electronAPI) {
      window.electronAPI.setIgnoreMouseEvents(false);
    }
    if (autoExpandOnHover && !isExpanded) {
      expandIsland();
    }
  });

  dynamicIsland.addEventListener('mouseleave', () => {
    if (isExpanded && !isPinned && autoExpandOnHover) {
      if (!collapseTimer) {
        collapseTimer = setTimeout(() => {
          collapseIsland();
          collapseTimer = null;
        }, 380);
      }
    }
  });

  // Pin Button Toggle
  if (btnPin) {
    btnPin.addEventListener('click', (e) => {
      e.stopPropagation();
      isPinned = !isPinned;
      btnPin.classList.toggle('active', isPinned);
      btnPin.title = isPinned ? 'Pinned (Always Open)' : 'Unpinned (Auto-collapse on mouse leave)';
    });
  }

  // Clicking compact pill expands it
  compactView.addEventListener('click', (e) => {
    e.stopPropagation();
    expandIsland();
  });

  // Collapse button
  btnCollapse.addEventListener('click', (e) => {
    e.stopPropagation();
    isPinned = false;
    if (btnPin) btnPin.classList.remove('active');
    collapseIsland();
  });

  // Global shortcut / Tray toggle
  if (window.electronAPI && window.electronAPI.onToggleExpand) {
    window.electronAPI.onToggleExpand(() => {
      if (isExpanded) {
        collapseIsland();
      } else {
        expandIsland();
      }
    });
  }

  // ================= 2. NAVIGATION TABS =================
  function switchTab(targetTab) {
    navTabs.forEach(tab => {
      if (tab.dataset.tab === targetTab) {
        tab.classList.add('active');
      } else {
        tab.classList.remove('active');
      }
    });

    tabPanes.forEach(pane => {
      if (pane.id === `tab-${targetTab}`) {
        pane.classList.add('active');
      } else {
        pane.classList.remove('active');
      }
    });
  }

  navTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      switchTab(tab.dataset.tab);
    });
  });

  // ================= 3. CLOCK & IDLE TRACKER =================
  function updateClock() {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    compactTime.textContent = `${hours}:${minutes}`;

    // Update Ambient Standby Clock
    if (ambientClockDigits) {
      ambientClockDigits.textContent = `${hours}:${minutes}`;
    }
    if (ambientTimeSec) {
      const seconds = String(now.getSeconds()).padStart(2, '0');
      ambientTimeSec.textContent = `:${seconds}`;
    }
    if (ambientDateLabel) {
      const days = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
      ambientDateLabel.textContent = `${days[now.getDay()]}, ${now.getDate()} ${months[now.getMonth()]}`;
    }

    // Check Idle Condition for Ambient Standby Mode (60 seconds inactivity)
    if (ambientModeEnabled && !isExpanded && !isAmbientActive) {
      const idleTime = Date.now() - lastUserActivity;
      if (idleTime >= 60000) {
        enterAmbientMode();
      }
    }
  }

  function updateAmbientClock() {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    if (ambientClockDigits) ambientClockDigits.textContent = `${hours}:${minutes}`;
  }

  updateClock();
  setInterval(updateClock, 1000);

  // Reset idle timer on user activity
  ['mousemove', 'mousedown', 'keydown', 'touchstart'].forEach(evt => {
    window.addEventListener(evt, () => {
      lastUserActivity = Date.now();
      if (isAmbientActive && !isExpanded) {
        collapseIsland();
      }
    }, { passive: true });
  });

  // ================= 4. BATTERY API =================
  async function initBattery() {
    if ('getBattery' in navigator) {
      try {
        const battery = await navigator.getBattery();

        function updateBatteryUI() {
          const level = Math.round(battery.level * 100);
          compactBatteryText.textContent = `${level}%`;
          compactBatteryFill.style.width = `${level}%`;
          sysBatteryVal.textContent = `${level}%`;
          sysBatteryBar.style.width = `${level}%`;

          // Battery color
          if (level <= 20) {
            compactBatteryFill.style.background = 'var(--danger-color)';
            sysBatteryBar.style.background = 'var(--danger-color)';
          } else {
            compactBatteryFill.style.background = 'var(--success-color)';
            sysBatteryBar.style.background = 'var(--success-color)';
          }

          if (battery.charging) {
            compactChargingIcon.classList.remove('hidden');
            sysChargingTag.textContent = '⚡ Charging (AC)';
            sysChargingTag.style.color = '#ffd60a';
            if (ambientBatteryText) ambientBatteryText.textContent = `⚡ ${level}%`;
          } else {
            compactChargingIcon.classList.add('hidden');
            sysChargingTag.textContent = 'On Battery';
            sysChargingTag.style.color = 'var(--text-muted)';
            if (ambientBatteryText) ambientBatteryText.textContent = `🔋 ${level}%`;
          }
        }

        updateBatteryUI();
        battery.addEventListener('levelchange', updateBatteryUI);
        battery.addEventListener('chargingchange', updateBatteryUI);
      } catch (err) {
        console.warn('Battery API not available or error:', err);
      }
    } else {
      compactBatteryText.textContent = '100%';
      compactBatteryFill.style.width = '100%';
      sysBatteryVal.textContent = '100%';
    }
  }
  initBattery();

  // ================= 5. LIVE SYSTEM METRICS & DRIVES =================
  async function loadSystemDrives() {
    if (!window.electronAPI || !window.electronAPI.getSystemDrives || !drivesList) return;
    try {
      const drives = await window.electronAPI.getSystemDrives();
      if (!drives || drives.length === 0) {
        drivesList.innerHTML = '<div class="drive-item-loading">No drives detected</div>';
        if (sysStorageSub) sysStorageSub.textContent = '0 Drives';
        return;
      }

      if (sysStorageSub) sysStorageSub.textContent = `${drives.length} Drives Connected`;
      drivesList.innerHTML = '';

      drives.forEach(d => {
        const item = document.createElement('div');
        item.className = 'drive-item';

        const totalGb = (d.sizeBytes / (1024 ** 3)).toFixed(1);
        const freeGb = (d.freeBytes / (1024 ** 3)).toFixed(1);
        const usedGb = Math.max(0, (d.sizeBytes - d.freeBytes) / (1024 ** 3)).toFixed(1);
        const percentUsed = d.sizeBytes > 0 ? Math.round(((d.sizeBytes - d.freeBytes) / d.sizeBytes) * 100) : 0;
        const icon = d.isRemovable ? '💾' : '💽';
        const tagClass = d.isRemovable ? 'removable' : 'fixed';
        const tagText = d.isRemovable ? 'USB' : 'Internal';

        item.innerHTML = `
          <div class="drive-item-left">
            <span class="drive-icon-badge">${icon}</span>
            <div class="drive-details">
              <div class="drive-name-row">
                <span class="drive-name">${d.deviceId} ${d.name || ''}</span>
                <span class="drive-tag ${tagClass}">${tagText}</span>
              </div>
              <span class="drive-sub-stats">${freeGb} GB free of ${totalGb} GB (${percentUsed}% used)</span>
              <div class="drive-bar-mini">
                <div class="drive-fill-mini" style="width: ${percentUsed}%;"></div>
              </div>
            </div>
          </div>
          ${d.isRemovable ? `<button class="btn-eject-mini" data-dev="${d.deviceId}" title="Eject ${d.deviceId}">⏏️ Eject</button>` : ''}
        `;

        if (d.isRemovable) {
          const ejectBtn = item.querySelector('.btn-eject-mini');
          if (ejectBtn) {
            ejectBtn.addEventListener('click', async (e) => {
              e.stopPropagation();
              ejectBtn.textContent = '⏳';
              const res = await window.electronAPI.ejectDrive(d.deviceId);
              if (res.success) {
                ejectBtn.textContent = '✅ Ejected';
                setTimeout(() => loadSystemDrives(), 1200);
              } else {
                ejectBtn.textContent = '⚠️ Fail';
                setTimeout(() => { ejectBtn.textContent = '⏏️ Eject'; }, 2000);
              }
            });
          }
        }

        drivesList.appendChild(item);
      });
    } catch (e) {
      console.warn('Failed to load system drives:', e);
    }
  }

  async function updateSystemMetrics() {
    if (window.electronAPI && window.electronAPI.getSystemMetrics) {
      try {
        const metrics = await window.electronAPI.getSystemMetrics();
        sysCpuVal.textContent = `${metrics.cpuPercent}%`;
        sysCpuBar.style.width = `${metrics.cpuPercent}%`;

        sysRamVal.textContent = `${metrics.memPercent}%`;
        sysRamBar.style.width = `${metrics.memPercent}%`;
        sysRamSub.textContent = `${metrics.usedMemGb} / ${metrics.totalMemGb} GB`;
      } catch (err) {
        console.warn('Failed to fetch system metrics:', err);
      }
    }
  }

  updateSystemMetrics();
  loadSystemDrives();
  setInterval(updateSystemMetrics, 2000);
  setInterval(loadSystemDrives, 5000);

  // ================= 6. INTERACTIVE AUDIO & MUSIC PLAYER =================
  const playlist = [
    {
      title: 'Midnight Waves (Lofi Chill)',
      artist: 'Ambient City Radio',
      duration: 185,
      baseFreq: 220
    },
    {
      title: 'Neon Horizon',
      artist: 'Cyber Synthwave Lab',
      duration: 210,
      baseFreq: 293.66
    },
    {
      title: 'Cosmic Rain & Focus',
      artist: 'Deep Space Reverie',
      duration: 240,
      baseFreq: 174.61
    }
  ];

  let currentTrackIdx = 0;
  let isPlaying = false;
  let trackElapsed = 42;
  let musicInterval = null;

  // Web Audio Synth for realistic sound generation
  let audioCtx = null;
  let oscGain = null;
  let synthInterval = null;

  function initAudio() {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      oscGain = audioCtx.createGain();
      oscGain.gain.value = (volSlider.value / 100) * 0.15;
      oscGain.connect(audioCtx.destination);
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
  }

  function playSoftChord(baseFreq) {
    if (!audioCtx || !isPlaying) return;
    try {
      const freqs = [baseFreq, baseFreq * 1.25, baseFreq * 1.5]; // Major chord triad
      freqs.forEach((f, i) => {
        const osc = audioCtx.createOscillator();
        const noteGain = audioCtx.createGain();
        osc.type = i === 0 ? 'sine' : 'triangle';
        osc.frequency.setValueAtTime(f, audioCtx.currentTime);

        noteGain.gain.setValueAtTime(0, audioCtx.currentTime);
        noteGain.gain.linearRampToValueAtTime(0.08, audioCtx.currentTime + 0.3);
        noteGain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 2.5);

        osc.connect(noteGain);
        noteGain.connect(oscGain);
        osc.start();
        osc.stop(audioCtx.currentTime + 2.6);
      });
    } catch (e) {
      // Audio fallback
    }
  }

  function formatTime(seconds) {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }

  function loadTrack(idx) {
    const track = playlist[idx];
    trackTitle.textContent = track.title;
    trackArtist.textContent = track.artist;
    timeTotal.textContent = formatTime(track.duration);
    trackScrubber.max = track.duration;
    trackScrubber.value = trackElapsed;
    timeCurrent.textContent = formatTime(trackElapsed);
  }
  loadTrack(currentTrackIdx);

  function togglePlay() {
    initAudio();
    isPlaying = !isPlaying;

    if (isPlaying) {
      iconPlay.classList.add('hidden');
      iconPause.classList.remove('hidden');
      musicWave.classList.add('active');
      albumArt.classList.add('playing');
      compactMediaIndicator.classList.remove('hidden');

      playSoftChord(playlist[currentTrackIdx].baseFreq);
      synthInterval = setInterval(() => {
        playSoftChord(playlist[currentTrackIdx].baseFreq);
      }, 2600);

      musicInterval = setInterval(() => {
        trackElapsed++;
        if (trackElapsed > playlist[currentTrackIdx].duration) {
          nextTrack();
          return;
        }
        trackScrubber.value = trackElapsed;
        timeCurrent.textContent = formatTime(trackElapsed);
      }, 1000);
    } else {
      pauseMusic();
    }
  }

  function pauseMusic() {
    isPlaying = false;
    iconPlay.classList.remove('hidden');
    iconPause.classList.add('hidden');
    musicWave.classList.remove('active');
    albumArt.classList.remove('playing');
    compactMediaIndicator.classList.add('hidden');
    if (musicInterval) clearInterval(musicInterval);
    if (synthInterval) clearInterval(synthInterval);
  }

  function nextTrack() {
    pauseMusic();
    trackElapsed = 0;
    currentTrackIdx = (currentTrackIdx + 1) % playlist.length;
    loadTrack(currentTrackIdx);
    togglePlay();
  }

  function prevTrack() {
    pauseMusic();
    trackElapsed = 0;
    currentTrackIdx = (currentTrackIdx - 1 + playlist.length) % playlist.length;
    loadTrack(currentTrackIdx);
    togglePlay();
  }

  const mediaSourceTag = document.getElementById('media-source-tag');
  const musicEmoji = document.getElementById('music-emoji');
  let isSystemMediaActive = false;
  let lastSystemMediaTitle = '';
  let isUserScrubbing = false;
  let timelineTicker = null;

  function startTimelineTicker() {
    if (timelineTicker) clearInterval(timelineTicker);
    timelineTicker = setInterval(() => {
      if (isPlaying && !isUserScrubbing) {
        trackElapsed++;
        const maxVal = parseInt(trackScrubber.max, 10) || 100;
        if (trackElapsed > maxVal) {
          trackElapsed = maxVal;
        }
        trackScrubber.value = trackElapsed;
        timeCurrent.textContent = formatTime(trackElapsed);
      }
    }, 1000);
  }

  function stopTimelineTicker() {
    if (timelineTicker) {
      clearInterval(timelineTicker);
      timelineTicker = null;
    }
  }

  // System Media Live Listener (YouTube, Spotify, etc.)
  if (window.electronAPI && window.electronAPI.onSystemMediaUpdate) {
    window.electronAPI.onSystemMediaUpdate((media) => {
      if (media && media.status && media.status !== 'none' && media.title) {
        isSystemMediaActive = true;
        if (mediaSourceTag) {
          mediaSourceTag.classList.remove('hidden');
          const lowerApp = (media.app || '').toLowerCase();
          if (lowerApp.includes('spotify')) {
            mediaSourceTag.textContent = 'Spotify';
            mediaSourceTag.className = 'media-source-badge spotify';
          } else {
            mediaSourceTag.textContent = 'YouTube / Web';
            mediaSourceTag.className = 'media-source-badge';
          }
        }

        if (media.title !== lastSystemMediaTitle) {
          lastSystemMediaTitle = media.title;
          trackTitle.textContent = media.title;
          trackArtist.textContent = media.artist || 'Windows Media';
        }

        // 1. Sync Timeline / Position and Duration
        if (media.duration > 0) {
          trackScrubber.max = media.duration;
          timeTotal.textContent = formatTime(media.duration);
          if (!isUserScrubbing) {
            if (Math.abs(trackElapsed - media.position) >= 2 || trackElapsed === 0) {
              trackElapsed = media.position || 0;
              trackScrubber.value = trackElapsed;
              timeCurrent.textContent = formatTime(trackElapsed);
            }
          }
        }

        // 2. Sync Thumbnail / Cover Art
        if (media.thumbnail) {
          albumArt.style.backgroundImage = `url("${media.thumbnail}")`;
          albumArt.style.backgroundSize = 'cover';
          albumArt.style.backgroundPosition = 'center';
          if (musicEmoji) musicEmoji.classList.add('hidden');
        } else {
          albumArt.style.backgroundImage = '';
          if (musicEmoji) musicEmoji.classList.remove('hidden');
        }

        if (media.status === 'Playing') {
          isPlaying = true;
          startTimelineTicker();
          iconPlay.classList.add('hidden');
          iconPause.classList.remove('hidden');
          musicWave.classList.add('active');
          albumArt.classList.add('playing');
          compactMediaIndicator.classList.remove('hidden');
        } else if (media.status === 'Paused') {
          isPlaying = false;
          stopTimelineTicker();
          iconPlay.classList.remove('hidden');
          iconPause.classList.add('hidden');
          musicWave.classList.remove('active');
          albumArt.classList.remove('playing');
          compactMediaIndicator.classList.add('hidden');
        }
      } else {
        if (isSystemMediaActive) {
          isSystemMediaActive = false;
          lastSystemMediaTitle = '';
          if (mediaSourceTag) mediaSourceTag.classList.add('hidden');
          albumArt.style.backgroundImage = '';
          if (musicEmoji) musicEmoji.classList.remove('hidden');
          loadTrack(currentTrackIdx);
          pauseMusic();
        }
      }
    });
  }

  function handlePlayToggle() {
    if (isSystemMediaActive && window.electronAPI && window.electronAPI.controlSystemMedia) {
      window.electronAPI.controlSystemMedia('toggle');
      return;
    }
    togglePlay();
  }

  function handleNextTrack() {
    if (isSystemMediaActive && window.electronAPI && window.electronAPI.controlSystemMedia) {
      window.electronAPI.controlSystemMedia('next');
      return;
    }
    nextTrack();
  }

  function handlePrevTrack() {
    if (isSystemMediaActive && window.electronAPI && window.electronAPI.controlSystemMedia) {
      window.electronAPI.controlSystemMedia('prev');
      return;
    }
    prevTrack();
  }

  btnPlay.addEventListener('click', handlePlayToggle);
  btnNext.addEventListener('click', handleNextTrack);
  btnPrev.addEventListener('click', handlePrevTrack);

  trackScrubber.addEventListener('mousedown', () => { isUserScrubbing = true; });
  trackScrubber.addEventListener('touchstart', () => { isUserScrubbing = true; });
  trackScrubber.addEventListener('mouseup', () => { isUserScrubbing = false; });
  trackScrubber.addEventListener('touchend', () => { isUserScrubbing = false; });

  trackScrubber.addEventListener('input', (e) => {
    trackElapsed = parseInt(e.target.value, 10);
    timeCurrent.textContent = formatTime(trackElapsed);
  });

  trackScrubber.addEventListener('change', (e) => {
    isUserScrubbing = false;
    const val = parseInt(e.target.value, 10);
    if (isSystemMediaActive && window.electronAPI && window.electronAPI.controlSystemMedia) {
      window.electronAPI.controlSystemMedia('seek', val);
    }
  });

  // Windows Master Volume Integration
  function updateVolumeIcon(val, isMuted) {
    if (isMuted || val === 0) {
      btnMute.textContent = '🔇';
    } else if (val < 40) {
      btnMute.textContent = '🔉';
    } else {
      btnMute.textContent = '🔊';
    }
  }

  if (window.electronAPI && window.electronAPI.getSystemVolume) {
    window.electronAPI.getSystemVolume().then(res => {
      if (res && typeof res.volume === 'number') {
        volSlider.value = res.volume;
        updateVolumeIcon(res.volume, res.muted);
      }
    });
  }

  let volDebounce = null;
  volSlider.addEventListener('input', (e) => {
    const val = parseInt(e.target.value, 10);
    if (oscGain && audioCtx) {
      oscGain.gain.value = (val / 100) * 0.15;
    }
    updateVolumeIcon(val, false);
    if (window.electronAPI && window.electronAPI.setSystemVolume) {
      if (volDebounce) clearTimeout(volDebounce);
      volDebounce = setTimeout(() => {
        window.electronAPI.setSystemVolume(val);
      }, 35);
    }
  });

  btnMute.addEventListener('click', async () => {
    if (window.electronAPI && window.electronAPI.toggleSystemMute) {
      const res = await window.electronAPI.toggleSystemMute();
      if (res) {
        if (res.muted) {
          volSlider.dataset.prevVal = volSlider.value;
          volSlider.value = 0;
          updateVolumeIcon(0, true);
        } else {
          const restore = res.volume || 50;
          volSlider.value = restore;
          updateVolumeIcon(restore, false);
        }
      }
    }
  });

  // ================= 7. TIMER & STOPWATCH =================
  let timerDuration = 60;
  let timerRemaining = 60;
  let isTimerRunning = false;
  let timerInterval = null;
  const totalDash = 283;

  function updateTimerUI() {
    timerDisplay.textContent = formatTime(timerRemaining);
    const progress = timerRemaining / timerDuration;
    const offset = totalDash * (1 - progress);
    timerRing.style.strokeDashoffset = offset;

    if (isTimerRunning) {
      compactTimerBadge.classList.remove('hidden');
      compactTimerVal.textContent = formatTime(timerRemaining);
    } else {
      compactTimerBadge.classList.add('hidden');
    }
  }

  function playChime() {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1760, ctx.currentTime + 0.4);

      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.9);
    } catch (e) {}
  }

  function startTimer() {
    if (isTimerRunning) {
      isTimerRunning = false;
      clearInterval(timerInterval);
      btnTimerStart.textContent = 'Resume';
      btnTimerStart.classList.remove('secondary');
      btnTimerStart.classList.add('primary');
      updateTimerUI();
    } else {
      isTimerRunning = true;
      btnTimerStart.textContent = 'Pause';
      btnTimerStart.classList.add('secondary');
      btnTimerStart.classList.remove('primary');

      timerInterval = setInterval(() => {
        timerRemaining--;
        if (timerRemaining <= 0) {
          timerRemaining = 0;
          clearInterval(timerInterval);
          isTimerRunning = false;
          btnTimerStart.textContent = 'Start';
          btnTimerStart.classList.add('primary');
          btnTimerStart.classList.remove('secondary');
          playChime();
        }
        updateTimerUI();
      }, 1000);
      updateTimerUI();
    }
  }

  function resetTimer() {
    clearInterval(timerInterval);
    isTimerRunning = false;
    timerRemaining = timerDuration;
    btnTimerStart.textContent = 'Start';
    btnTimerStart.classList.add('primary');
    btnTimerStart.classList.remove('secondary');
    updateTimerUI();
  }

  btnTimerStart.addEventListener('click', startTimer);
  btnTimerReset.addEventListener('click', resetTimer);

  presetPills.forEach(pill => {
    pill.addEventListener('click', () => {
      presetPills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      const mins = parseInt(pill.dataset.mins, 10);
      timerDuration = mins * 60;
      resetTimer();
    });
  });

  // ================= 8. QUICK TOOLS =================
  const savedNote = localStorage.getItem('dynamic_island_note') || '';
  scratchpad.value = savedNote;

  scratchpad.addEventListener('input', () => {
    localStorage.setItem('dynamic_island_note', scratchpad.value);
  });

  btnClearNote.addEventListener('click', () => {
    scratchpad.value = '';
    localStorage.removeItem('dynamic_island_note');
  });

  scCalc.addEventListener('click', () => {
    switchTab('calc');
    if (calcInput) calcInput.focus();
  });
  scTaskmgr.addEventListener('click', () => {
    window.open('ms-settings:appsfeatures');
  });
  scNotepad.addEventListener('click', () => {
    scratchpad.focus();
  });

  // ================= 8B. MINI FLOATING CALCULATOR & CONVERTER =================
  let calcExpression = '';

  function evaluateCalc(expr) {
    if (!expr || !expr.trim()) return '0';
    try {
      // Clean and sanitize mathematical expression
      const sanitized = expr
        .replace(/×/g, '*')
        .replace(/÷/g, '/')
        .replace(/−/g, '-')
        .replace(/%/g, '/100')
        .replace(/[^0-9+\-*/.()]/g, '');

      if (!sanitized) return '0';
      // Safe eval of arithmetic math
      const res = Function(`'use strict'; return (${sanitized})`)();
      if (typeof res === 'number' && !isNaN(res)) {
        return Number.isInteger(res) ? String(res) : parseFloat(res.toFixed(4)).toString();
      }
      return 'Error';
    } catch (e) {
      return '...';
    }
  }

  function updateCalcScreen() {
    if (calcInput) calcInput.value = calcExpression;
    if (calcResult) {
      const evalRes = evaluateCalc(calcExpression);
      calcResult.textContent = `= ${evalRes}`;
    }
  }

  calcButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const val = btn.dataset.calc;
      if (val === 'clear') {
        calcExpression = '';
      } else if (val === 'del') {
        calcExpression = calcExpression.slice(0, -1);
      } else if (val === '=') {
        const res = evaluateCalc(calcExpression);
        if (res !== 'Error' && res !== '...') {
          calcExpression = res;
        }
      } else {
        calcExpression += val;
      }
      updateCalcScreen();
    });
  });

  if (calcInput) {
    calcInput.addEventListener('input', (e) => {
      calcExpression = e.target.value;
      if (calcResult) {
        const evalRes = evaluateCalc(calcExpression);
        calcResult.textContent = `= ${evalRes}`;
      }
    });

    calcInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const res = evaluateCalc(calcExpression);
        if (res !== 'Error' && res !== '...') {
          calcExpression = res;
          updateCalcScreen();
        }
      }
    });
  }

  // Quick unit converter presets
  convPresetBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const conv = btn.dataset.conv;
      if (conv === 'usd-idr') {
        calcExpression = '1 * 16250';
      } else if (conv === 'gb-mb') {
        calcExpression = '1 * 1024';
      } else if (conv === 'c-f') {
        calcExpression = '(30 * 9/5) + 32';
      } else if (conv === 'km-mi') {
        calcExpression = '10 * 0.621371';
      }
      updateCalcScreen();
    });
  });

  if (btnCopyCalcRes) {
    btnCopyCalcRes.addEventListener('click', () => {
      const evalRes = evaluateCalc(calcExpression);
      if (navigator.clipboard) {
        navigator.clipboard.writeText(evalRes);
      }
      showClipboardToast(`Hasil ${evalRes} disalin! 🧮`);
    });
  }

  // ================= 9. SETTINGS & THEMES =================
  const savedTheme = localStorage.getItem('island_theme') || 'theme-obsidian';
  document.body.className = savedTheme;

  colorDots.forEach(dot => {
    if (dot.dataset.theme === savedTheme) {
      dot.classList.add('active');
    } else {
      dot.classList.remove('active');
    }

    dot.addEventListener('click', () => {
      colorDots.forEach(d => d.classList.remove('active'));
      dot.classList.add('active');
      const newTheme = dot.dataset.theme;
      document.body.className = newTheme;
      localStorage.setItem('island_theme', newTheme);
    });
  });

  settingHoverExpand.addEventListener('change', (e) => {
    autoExpandOnHover = e.target.checked;
    localStorage.setItem('auto_expand_hover', autoExpandOnHover);
  });

  if (settingAmbientMode) {
    settingAmbientMode.addEventListener('change', (e) => {
      ambientModeEnabled = e.target.checked;
      localStorage.setItem('ambient_mode_enabled', ambientModeEnabled);
      if (!ambientModeEnabled && isAmbientActive) {
        collapseIsland();
      }
    });
  }

  btnQuitApp.addEventListener('click', () => {
    if (window.electronAPI) {
      window.electronAPI.quitApp();
    }
  });

  // ================= 10. CLIPBOARD MANAGER =================
  const clipboardList = document.getElementById('clipboard-list');
  const clipFilterBtns = document.querySelectorAll('.clip-filter-btn');
  const clipCountBadge = document.getElementById('clip-count-badge');
  const btnClearClip = document.getElementById('btn-clear-clip');
  const clipboardToast = document.getElementById('clipboard-toast');

  let currentClipFilter = 'all';
  let cachedClipHistory = [];
  let toastTimeout = null;

  function showClipboardToast(msg) {
    if (!clipboardToast) return;
    clipboardToast.textContent = msg;
    clipboardToast.classList.remove('hidden');
    if (toastTimeout) clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => {
      clipboardToast.classList.add('hidden');
    }, 1800);
  }

  function formatClipTime(timestamp) {
    const diff = Math.floor((Date.now() - timestamp) / 1000);
    if (diff < 60) return 'Baru saja';
    if (diff < 3600) return `${Math.floor(diff / 60)}m lalu`;
    return `${Math.floor(diff / 3600)}j lalu`;
  }

  function escapeHtml(str) {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function renderClipboardList(history = []) {
    cachedClipHistory = history;
    if (clipCountBadge) {
      clipCountBadge.textContent = `${history.length} items`;
    }

    if (!clipboardList) return;
    clipboardList.innerHTML = '';

    const filtered = history.filter(item => {
      if (currentClipFilter === 'pinned') return item.pinned;
      if (currentClipFilter === 'text') return item.type === 'text';
      if (currentClipFilter === 'image') return item.type === 'image';
      return true;
    });

    if (filtered.length === 0) {
      const emptyDiv = document.createElement('div');
      emptyDiv.className = 'clipboard-empty';
      emptyDiv.innerHTML = `<span>📋 ${currentClipFilter === 'pinned' ? 'Belum ada item yang di-pin' : 'Belum ada teks/gambar yang di-copy'}</span>`;
      clipboardList.appendChild(emptyDiv);
      return;
    }

    filtered.forEach(item => {
      const card = document.createElement('div');
      card.className = `clip-card ${item.pinned ? 'pinned' : ''}`;

      let contentHtml = '';
      if (item.type === 'text') {
        const preview = item.content.length > 120 ? item.content.substring(0, 120) + '...' : item.content;
        contentHtml = `
          <div class="clip-content">
            <div class="clip-text-snippet" title="${escapeHtml(item.content)}">${escapeHtml(preview)}</div>
            <div class="clip-meta">
              <span>📝 Teks</span>
              <span>•</span>
              <span>${formatClipTime(item.timestamp)}</span>
            </div>
          </div>
        `;
      } else if (item.type === 'image') {
        contentHtml = `
          <div class="clip-content">
            <div class="clip-img-snippet">
              <img class="clip-img-thumb" src="${item.content}" alt="Copied image">
              <div class="clip-meta">
                <span>🖼️ Gambar</span>
                <span>•</span>
                <span>${item.dimensions || 'Image'}</span>
                <span>•</span>
                <span>${formatClipTime(item.timestamp)}</span>
              </div>
            </div>
          </div>
        `;
      }

      card.innerHTML = `
        ${contentHtml}
        <div class="clip-actions">
          <button class="clip-btn pin-btn ${item.pinned ? 'pinned' : ''}" title="${item.pinned ? 'Unpin' : 'Pin item'}">
            ${item.pinned ? '📌' : '📍'}
          </button>
          <button class="clip-btn del-btn" title="Hapus item">✕</button>
        </div>
      `;

      card.addEventListener('click', async (e) => {
        if (e.target.closest('.clip-btn')) return;
        if (window.electronAPI && window.electronAPI.copyClipboardItem) {
          await window.electronAPI.copyClipboardItem(item);
          showClipboardToast(item.type === 'image' ? 'Gambar tersalin! 🖼️' : 'Teks tersalin! 📋');
        }
      });

      const pinBtn = card.querySelector('.pin-btn');
      pinBtn.addEventListener('click', async (e) => {
        e.stopPropagation();
        if (window.electronAPI && window.electronAPI.togglePinClipboardItem) {
          const updated = await window.electronAPI.togglePinClipboardItem(item.id);
          renderClipboardList(updated);
        }
      });

      const delBtn = card.querySelector('.del-btn');
      delBtn.addEventListener('click', async (e) => {
        e.stopPropagation();
        if (window.electronAPI && window.electronAPI.deleteClipboardItem) {
          const updated = await window.electronAPI.deleteClipboardItem(item.id);
          renderClipboardList(updated);
        }
      });

      clipboardList.appendChild(card);
    });
  }

  clipFilterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      clipFilterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentClipFilter = btn.dataset.filter;
      renderClipboardList(cachedClipHistory);
    });
  });

  if (btnClearClip) {
    btnClearClip.addEventListener('click', async () => {
      if (window.electronAPI && window.electronAPI.clearUnpinnedClipboard) {
        const updated = await window.electronAPI.clearUnpinnedClipboard();
        renderClipboardList(updated);
        showClipboardToast('Item unpinned telah dibersihkan! 🧹');
      }
    });
  }

  if (window.electronAPI && window.electronAPI.onClipboardUpdate) {
    window.electronAPI.onClipboardUpdate((history) => {
      renderClipboardList(history);
    });
  }

  if (window.electronAPI && window.electronAPI.getClipboardHistory) {
    window.electronAPI.getClipboardHistory().then(history => {
      renderClipboardList(history);
    });
  }

  // Initial render
  updateTimerUI();
});
