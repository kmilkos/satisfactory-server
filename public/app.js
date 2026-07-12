// FICSIT Remote Management Application Logic
let socket;
let serverState = null;
let currentTab = 'dashboard';
let selectedModId = null;
let automationRules = [];
let automationLogs = [];


// SMR Live Data State
let smrMods = [];           // Live mods from ficsit.app
let smrTotal = 0;           // Total count for pagination
let smrPage = 0;            // Current page (20 per page)
let smrLoading = false;     // Fetch in progress
let smrSearch = '';         // Current search term
let smrSearchTimer = null;  // Debounce timer
let smrSelectedMod = null;  // Full detail data for selected mod
let smrDetailLoading = false;

// Dynamic charts state buffers
const tpsHistory = Array(20).fill(30.0);
const ramHistory = Array(20).fill(12.4);
const networkHistory = Array(20).fill(342.1);

// Initialize Websocket Connection
function connectWs() {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const wsUrl = `${protocol}//${window.location.host}`;
  socket = new WebSocket(wsUrl);

  socket.onopen = () => {
    console.log('WS Connection Established.');
    const wsBadge = document.getElementById('ws-status-badge');
    if (wsBadge) {
      wsBadge.innerText = 'STABLE';
      wsBadge.className = 'text-xs font-bold text-tertiary';
    }
  };

  socket.onclose = () => {
    console.log('WS Connection Lost. Reconnecting in 3s...');
    const wsBadge = document.getElementById('ws-status-badge');
    if (wsBadge) {
      wsBadge.innerText = 'DISCONNECTED';
      wsBadge.className = 'text-xs font-bold text-error';
    }
    setTimeout(connectWs, 3000);
  };

  socket.onmessage = (event) => {
    try {
      const payload = JSON.parse(event.data);
      handleWsMessage(payload.type, payload.data);
    } catch (e) {
      console.error('Error parsing WS message:', e);
    }
  };
}

function handleWsMessage(type, data) {
  switch (type) {
    case 'init_state':
      serverState = data;
      syncUiState();
      renderInstalledModsList();
      renderSmrModsList();
      break;

    case 'server_status_update':
      if (!serverState) return;
      serverState.status = data.status;
      serverState.tps = data.tps;
      serverState.ramUsed = data.ramUsed;
      serverState.players = data.players;
      updateLiveWidgets();
      updatePowerButtons();
      break;

    case 'metrics_update':
      if (!serverState) return;
      serverState.tps = data.tps;
      serverState.ramUsed = data.ramUsed;
      serverState.cognitiveLoad = data.cognitiveLoad;
      
      // Update charts data buffers
      tpsHistory.push(data.tps);
      tpsHistory.shift();
      ramHistory.push(data.ramUsed);
      ramHistory.shift();

      updateLiveWidgets();
      drawCharts();
      break;

    case 'calibrated_state':
      if (!serverState) return;
      serverState[data.key] = data.value;
      updateCalibrationUi();
      break;

    case 'console_history':
      const logsContainer = document.getElementById('console-logs-container');
      const sysLogsContainer = document.getElementById('sys-logs-container');
      if (logsContainer) logsContainer.innerHTML = '';
      if (sysLogsContainer) sysLogsContainer.innerHTML = '';
      data.forEach(log => appendConsoleLog(log));
      break;

    case 'console_log':
      appendConsoleLog(data);
      break;

    case 'terminal_log':
      appendTerminalLog(data);
      break;

    case 'steamcmd_state':
      if (!serverState) return;
      serverState.steamCmd = data;
      updateSteamCmdUi();
      break;

    case 'steamcmd_log':
      appendSteamCmdLog(data);
      break;

    case 'ficsit_state':
      if (!serverState) return;
      serverState.ficsitCli = data;
      updateFicsitCliUi();
      break;

    case 'ficsit_log':
      appendFicsitLog(data);
      break;

    case 'session_update':
      if (!serverState) return;
      serverState.sessionName = data.sessionName;
      serverState.savePlayDuration = data.savePlayDuration;
      serverState.tps = data.tps;
      serverState.players = data.players;
      serverState.maxPlayers = data.maxPlayers;
      serverState.status = data.status;
      document.querySelectorAll('.session-name-txt').forEach(el => el.innerText = data.sessionName);
      updateLiveWidgets();
      updatePowerButtons();
      break;

    // ── FRM Game Chat Bridge events ───────────────────────────────────────────
    case 'game_chat_messages':
      // data is an array of player chat messages from FRM
      if (Array.isArray(data)) data.forEach(appendGameChatMessage);
      break;

    case 'game_chat_ai_response':
      // data = { persona, sender, message, timestamp }
      appendGameChatAiResponse(data);
      break;

    case 'game_chat_status':
      // data = { enabled, message }
      updateGameChatStatus(data);
      break;

    case 'game_chat_error':
      // data = string error message
      appendGameChatError(data);
      break;

    case 'automation_state':
      automationRules = data.rules || [];
      automationLogs = data.logs || [];
      renderAutomationRules();
      renderAutomationLogs();
      break;

    case 'automation_event':
      if (data.log) {
        automationLogs.unshift(data.log);
        if (automationLogs.length > 100) automationLogs.pop();
        renderAutomationLogs();
      }
      break;
    // ─────────────────────────────────────────────────────────────────────────
  }
}

// UI State Sync
function syncUiState() {
  if (!serverState) return;

  // Uptime loop counter starting state
  updateUptimeDisplay();
  setInterval(updateUptimeDisplay, 1000);

  // Global state values
  document.querySelectorAll('.session-name-txt').forEach(el => el.innerText = serverState.sessionName);
  
  // Calibration UI values
  const tempInput = document.getElementById('temp-slider');
  const tempValue = document.getElementById('temp-val');
  if (tempInput && tempValue) {
    tempInput.value = serverState.aiTemperature;
    tempValue.innerText = serverState.aiTemperature.toFixed(2);
  }
  
  const thermalInput = document.getElementById('thermal-slider');
  const thermalValue = document.getElementById('thermal-limit-val');
  if (thermalInput && thermalValue) {
    thermalInput.value = serverState.thermalLimit || 82;
    thermalValue.innerText = (serverState.thermalLimit || 82) + '°C';
  }

  const depthInput = document.getElementById('depth-slider');
  const depthValue = document.getElementById('recursion-depth-val');
  if (depthInput && depthValue) {
    depthInput.value = serverState.recursionDepth || 12;
    depthValue.innerText = serverState.recursionDepth || 12;
  }

  updateLiveWidgets();
  updateCalibrationUi();
  updateSteamCmdUi();
  updatePowerButtons();
  drawCharts();
  queryDiskSpace();
  updateFicsitCliUi();
}

function updateUptimeDisplay() {
  if (!serverState) return;
  const h = Math.floor(serverState.uptime / 3600);
  const m = Math.floor((serverState.uptime % 3600) / 60);
  const s = serverState.uptime % 60;
  const uptimeStr = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  
  document.querySelectorAll('.uptime-text').forEach(el => {
    el.innerText = `UPTIME: ${uptimeStr}`;
  });

  // Increment savePlayDuration on client if server is running
  if (serverState.status === 'RUNNING' && serverState.savePlayDuration !== undefined) {
    serverState.savePlayDuration += 1;
  }

  const playHours = serverState.savePlayDuration !== undefined
    ? (serverState.savePlayDuration / 3600).toFixed(1)
    : '—';
  document.querySelectorAll('.save-playtime-text').forEach(el => {
    el.innerText = `TOTAL HOURS: ${playHours} hrs`;
  });
}

function updateLiveWidgets() {
  if (!serverState) return;

  // Server mode text update
  const isModded = serverState.ficsitCli && serverState.ficsitCli.smlInstalled;
  const modeText = isModded ? `MODDED (SML ${serverState.ficsitCli.smlVersion || 'v3.12.0'})` : 'VANILLA';
  document.querySelectorAll('.server-mode-txt').forEach(el => {
    el.innerText = modeText;
    if (isModded) {
      el.className = 'server-mode-txt font-bold text-tertiary';
    } else {
      el.className = 'server-mode-txt font-bold text-primary';
    }
  });

  // Player count
  document.querySelectorAll('.player-count-val').forEach(el => el.innerText = serverState.players.length.toString().padStart(2, '0'));
  document.querySelectorAll('.player-count-max').forEach(el => el.innerText = `/ ${serverState.maxPlayers}`);
  const playerPercent = (serverState.players.length / serverState.maxPlayers) * 100;
  document.querySelectorAll('.player-count-bar').forEach(el => el.style.width = `${playerPercent}%`);

  // TPS
  document.querySelectorAll('.tps-val').forEach(el => el.innerText = serverState.tps.toFixed(1));
  
  // RAM
  document.querySelectorAll('.ram-val').forEach(el => el.innerText = serverState.ramUsed.toFixed(1));
  document.querySelectorAll('.ram-max').forEach(el => el.innerText = `Limit: ${serverState.ramLimit.toFixed(1)} GB`);
  const ramPercent = (serverState.ramUsed / serverState.ramLimit) * 100;
  document.querySelectorAll('.ram-bar').forEach(el => el.style.width = `${ramPercent}%`);

  // Cognitive load
  const loadEl = document.getElementById('cog-load-val');
  if (loadEl) loadEl.innerText = `${serverState.cognitiveLoad}%`;
  const loadBar = document.getElementById('cog-load-bar');
  if (loadBar) loadBar.style.height = `${serverState.cognitiveLoad}%`;

  // Memory
  const memEl = document.getElementById('cog-mem-val');
  if (memEl) memEl.innerText = `${serverState.memoryGB.toFixed(1)}GB`;

  // Threads
  const threadsEl = document.getElementById('cog-threads-val');
  if (threadsEl) threadsEl.innerText = serverState.threads.toLocaleString();
}

function updateCalibrationUi() {
  if (!serverState) return;

  // Render node values
  serverState.activeNodes.forEach(node => {
    const bar = document.getElementById(`node-bar-${node.name}`);
    if (bar) {
      bar.style.width = `${node.load}%`;
    }
  });

  const modelVal = document.getElementById('calib-model-val');
  if (modelVal) modelVal.innerText = serverState.cognitiveModel;

  // Sync model buttons active state
  document.querySelectorAll('.model-btn').forEach(btn => {
    const isTarget = btn.innerText.trim() === serverState.cognitiveModel;
    if (isTarget) {
      btn.className = 'model-btn text-left px-3 py-2 bg-primary-container text-on-primary text-xs font-bold border-l-4 border-on-primary';
    } else {
      btn.className = 'model-btn text-left px-3 py-2 bg-surface-container-high text-on-surface-variant text-xs border-l-4 border-transparent hover:bg-surface-bright transition-colors';
    }
  });
}

function updateSteamCmdUi() {
  if (!serverState) return;
  const sc = serverState.steamCmd;

  // Update installation widget
  const progText = document.getElementById('sc-progress-text');
  if (progText) progText.innerText = `${sc.progress.toFixed(1)}%`;
  
  const progBar = document.getElementById('sc-progress-bar');
  if (progBar) progBar.style.width = `${sc.progress}%`;

  const fraction = document.getElementById('sc-progress-fraction');
  if (fraction) {
    const downloaded = (15.2 * (sc.progress / 100)).toFixed(1);
    fraction.innerText = `${downloaded} GB / 15.2 GB`;
  }

  // Speed telemetry cards
  const speedVal = document.getElementById('sc-speed-val');
  if (speedVal) speedVal.innerText = `${sc.downloadSpeed.toFixed(1)} MB/s`;

  const diskVal = document.getElementById('sc-disk-val');
  if (diskVal) diskVal.innerText = `${sc.diskWrite.toFixed(1)} MB/s`;

  const peersVal = document.getElementById('sc-peers-val');
  if (peersVal) peersVal.innerText = `${sc.peers} ACTIVE`;

  const validationVal = document.getElementById('sc-validation-val');
  if (validationVal) {
    validationVal.innerText = sc.statusText === 'SUCCESS' ? 'VERIFIED' : (sc.running ? 'IN PROGRESS' : sc.statusText);
    validationVal.className = sc.statusText === 'SUCCESS' ? 'text-sm font-bold text-tertiary' : 'text-sm font-bold text-primary';
  }

  const cliVerEl = document.getElementById('sc-cli-version');
  if (cliVerEl) {
    cliVerEl.innerText = 'v1.39 (ACTIVE)';
  }

  const serverStatusEl = document.getElementById('sc-server-status');
  if (serverStatusEl) {
    serverStatusEl.innerText = sc.installed ? 'U8 STABLE' : 'NOT INSTALLED';
    serverStatusEl.className = sc.installed ? 'text-sm font-bold text-tertiary' : 'text-sm font-bold text-on-surface';
  }

  const serverPathEl = document.getElementById('sc-server-path');
  if (serverPathEl) {
    serverPathEl.innerText = '/opt/satisfactory-server/server';
  }

  // Abort / start button state toggle
  const startBtn = document.getElementById('sc-btn-restart');
  const abortBtn = document.getElementById('sc-btn-abort');
  
  if (startBtn) {
    if (sc.running) {
      startBtn.setAttribute('disabled', 'true');
      startBtn.classList.add('opacity-50', 'cursor-not-allowed');
    } else {
      startBtn.removeAttribute('disabled');
      startBtn.classList.remove('opacity-50', 'cursor-not-allowed');
    }
  }

  if (abortBtn) {
    if (!sc.running) {
      abortBtn.setAttribute('disabled', 'true');
      abortBtn.classList.add('opacity-50', 'cursor-not-allowed');
    } else {
      abortBtn.removeAttribute('disabled');
      abortBtn.classList.remove('opacity-50', 'cursor-not-allowed');
    }
  }
}

// Draw dynamically plotting SVG charts (dashboard performance indicators)
function drawCharts() {
  drawTpsHealthChart();
  drawNetworkThroughputChart();
  drawCalibrationLatencyChart();
}

function drawTpsHealthChart() {
  const svg = document.getElementById('tps-chart-svg');
  if (!svg) return;

  const points = tpsHistory.map((val, idx) => {
    // Map values of TPS (28.0 - 30.2) to pixel height (60px to 5px)
    const x = (idx / 19) * 180; 
    const norm = (val - 28.0) / (30.2 - 28.0);
    const y = 60 - (norm * 55);
    return `${x},${y}`;
  });

  const path = svg.querySelector('path');
  if (path) {
    path.setAttribute('d', `M ${points.join(' L ')}`);
  }
}

function drawNetworkThroughputChart() {
  const container = document.getElementById('net-chart-bars');
  if (!container) return;

  // Let's generate a rolling array of height percentages
  // Trigger shift in simulated chart values
  networkHistory.push(340 + Math.random() * 8);
  networkHistory.shift();

  let barsHtml = '';
  networkHistory.forEach((val) => {
    // Map 330-360 range to height 20%-95%
    const norm = (val - 330) / 30;
    const height = Math.max(10, Math.min(98, Math.floor(norm * 88) + 10));
    barsHtml += `<div class="flex-1 bg-tertiary/30 hover:bg-tertiary/60 h-[${height}%] rounded-t transition-all duration-300" style="height: ${height}%"></div>`;
  });
  
  container.innerHTML = barsHtml;
}

function drawCalibrationLatencyChart() {
  const container = document.getElementById('latency-chart-bars');
  if (!container) return;

  // Simple static-with-jiggle layout
  const bars = [40, 45, 38, 70, 42, 35, 48, 52, 41, 39];
  let html = '';
  bars.forEach((val, idx) => {
    // Add minor jiggle
    const jiggled = Math.max(20, Math.min(95, val + Math.floor((Math.random() - 0.5) * 8)));
    const colorClass = jiggled > 65 ? 'bg-primary' : 'bg-tertiary-container';
    html += `<div class="${colorClass} w-full transition-all duration-300" style="height: ${jiggled}%"></div>`;
  });
  container.innerHTML = html;
}

// Router/Tab controller switching logic
function switchTab(tabId) {
  currentTab = tabId;
  
  // Update header links UI active markers
  document.querySelectorAll('.nav-link-btn').forEach(link => {
    const isTarget = link.getAttribute('data-tab') === tabId;
    if (isTarget) {
      link.className = 'nav-link-btn text-orange-500 font-bold hover:text-orange-500 transition-colors cursor-pointer flex items-center gap-2 font-sans text-sm';
      const icon = link.querySelector('.material-symbols-outlined');
      if (icon) icon.style.fontVariationSettings = "'FILL' 1";
    } else {
      link.className = 'nav-link-btn text-slate-300 hover:text-orange-500 transition-colors cursor-pointer flex items-center gap-2 font-sans text-sm';
      const icon = link.querySelector('.material-symbols-outlined');
      if (icon) icon.style.fontVariationSettings = "'FILL' 0";
    }
  });


  // Switch workspace content panels visibility
  document.querySelectorAll('.tab-content').forEach(panel => {
    if (panel.id === `${tabId}-tab-panel`) {
      panel.classList.add('active');
    } else {
      panel.classList.remove('active');
    }
  });

  // Re-trigger layout calculations or dynamic charts
  setTimeout(drawCharts, 50);

  // Resize Terminal Numbers on transition if Terminal Tab becomes active
  if (tabId === 'terminal') {
    setTimeout(updateLineNumbers, 60);
  }

  // Trigger SMR load when switching to Mod Manager
  if (tabId === 'mods' && smrMods.length === 0 && !smrLoading) {
    fetchSmrMods(true);
  }
}

// Sub-Tab switcher function for horizontal settings inside main tabs
function switchSubTab(mainTabId, subTabId, buttonEl) {
  // 1. Update button styling in the parent sub-tab bar
  const tabMenuBar = buttonEl.parentElement;
  tabMenuBar.querySelectorAll('button').forEach(btn => {
    btn.className = 'px-6 py-3 font-label-caps text-label-caps text-on-surface-variant hover:text-on-surface hover:bg-surface-variant/30 transition-all';
  });
  buttonEl.className = 'px-6 py-3 font-label-caps text-label-caps border-b-2 border-primary text-primary bg-primary/5';

  // 2. Switch visibility of sub-tab content panels
  const mainTabPanel = document.getElementById(`${mainTabId}-tab-panel`);
  if (mainTabPanel) {
    mainTabPanel.querySelectorAll('.sub-tab-content').forEach(panel => {
      if (panel.id === `${mainTabId}-${subTabId}-subpanel`) {
        panel.classList.add('active');
        panel.classList.remove('hidden');
      } else {
        panel.classList.remove('active');
        panel.classList.add('hidden');
      }
    });
  }

  // Draw charts if it's the dashboard
  if (mainTabId === 'dashboard') {
    setTimeout(drawCharts, 50);
  }
}

// Render Installed Modules & Repo Mod lists dynamically
// Dynamic simulated logs history for individual mods
const modLogsMap = {};

// ── SMR Live Data Fetching ────────────────────────────────────────────
async function fetchSmrMods(reset = false) {
  if (smrLoading) return;
  if (!reset && smrMods.length > 0 && smrMods.length >= smrTotal) return;

  if (reset) {
    smrPage = 0;
    smrMods = [];
    smrTotal = 0;
  }

  smrLoading = true;
  renderSmrModsList(); // show loading state

  const limit = 20;
  const offset = smrPage * limit;
  const params = new URLSearchParams({
    limit,
    offset,
    search: smrSearch,
    order_by: smrSortOrder
  });

  try {
    const res = await fetch(`/api/v1/smr/mods?${params}`);
    const data = await res.json();
    if (data.success) {
      smrMods = reset ? data.mods : [...smrMods, ...data.mods];
      smrTotal = data.count;
      smrPage++;

      // Auto-select first mod if none selected
      if (!selectedModId && smrMods.length > 0) {
        selectedModId = smrMods[0].id;
        fetchSmrModDetail(selectedModId);
      }
    } else {
      console.warn('SMR fetch error:', data.error);
    }
  } catch (err) {
    console.error('SMR fetch failed:', err);
  }

  smrLoading = false;
  renderSmrModsList();
}

async function fetchSmrModDetail(modId) {
  smrDetailLoading = true;
  smrSelectedMod = null;
  renderSelectedMod();

  try {
    const res = await fetch(`/api/v1/smr/mod/${encodeURIComponent(modId)}`);
    const data = await res.json();
    if (data.success) {
      smrSelectedMod = data.mod;
      // Sync installed flag from serverState
      smrSelectedMod.installed = serverState?.mods.some(m => m.id === modId) || false;
    }
  } catch (err) {
    console.error('SMR detail fetch failed:', err);
  }

  smrDetailLoading = false;
  renderSelectedMod();
}

function smrSearchDebounced(val) {
  smrSearch = val;
  clearTimeout(smrSearchTimer);
  smrSearchTimer = setTimeout(() => fetchSmrMods(true), 400);
}

function formatDownloads(n) {
  if (!n && n !== 0) return '—';
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000) return (n / 1000).toFixed(n >= 10000 ? 0 : 1) + 'k';
  return n.toString();
}

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const diff = (Date.now() - new Date(dateStr)) / 1000;
  if (diff < 3600) return Math.floor(diff / 60) + 'm ago';
  if (diff < 86400) return Math.floor(diff / 3600) + 'h ago';
  if (diff < 2592000) return Math.floor(diff / 86400) + 'd ago';
  if (diff < 31536000) return Math.floor(diff / 2592000) + 'mo ago';
  return Math.floor(diff / 31536000) + 'y ago';
}
// ─────────────────────────────────────────────────────────────────────

function getModLogs(mod) {
  if (!modLogsMap[mod.id]) {
    const timeStr = new Date().toISOString().replace('T', ' ').substring(0, 19).replace(/-/g, '.');
    modLogsMap[mod.id] = [
      `<p><span class="text-on-surface-variant/40">[${timeStr}]</span> <span class="text-primary-fixed">[ficsit-cli]</span> ficsit-cli inspect ${mod.id.toLowerCase()}</p>`,
      `<p><span class="text-on-surface-variant/40">[${timeStr}]</span> <span class="text-on-surface-variant">INFO:</span> Querying remote FICSIT repository manifest...</p>`,
      `<p><span class="text-on-surface-variant/40">[${timeStr}]</span> <span class="text-tertiary">SUCCESS:</span> Found ${mod.name} - SMR ID: ${mod.id}</p>`
    ];
  }
  return modLogsMap[mod.id];
}

function appendModLog(modId, type, message) {
  const timeStr = new Date().toISOString().replace('T', ' ').substring(0, 19).replace(/-/g, '.');
  let logLine = '';
  if (type === 'command') {
    logLine = `<p><span class="text-on-surface-variant/40">[${timeStr}]</span> <span class="text-primary-fixed">[ficsit-cli]</span> ${message}</p>`;
  } else if (type === 'success') {
    logLine = `<p><span class="text-on-surface-variant/40">[${timeStr}]</span> <span class="text-tertiary">SUCCESS:</span> ${message}</p>`;
  } else if (type === 'error') {
    logLine = `<p><span class="text-on-surface-variant/40">[${timeStr}]</span> <span class="text-error">ERROR:</span> ${message}</p>`;
  } else {
    logLine = `<p><span class="text-on-surface-variant/40">[${timeStr}]</span> <span class="text-on-surface-variant">INFO:</span> ${message}</p>`;
  }
  
  if (!modLogsMap[modId]) {
    getModLogs({ id: modId, name: 'Mod', version: '1.0.0', compatibility: 'Stable' });
  }
  modLogsMap[modId].push(logLine);
  
  // Update DOM in real time if selected
  if (selectedModId === modId) {
    const logsContainer = document.getElementById('mod-ficsit-cli-logs');
    if (logsContainer) {
      const lineEl = document.createElement('div');
      lineEl.innerHTML = logLine;
      logsContainer.appendChild(lineEl.firstChild);
      logsContainer.parentElement.scrollTop = logsContainer.parentElement.scrollHeight;
    }
  }
}

function openModDescriptionModal(modName, descHtml) {
  // Create modal container
  const modal = document.createElement('div');
  modal.id = 'mod-desc-modal';
  modal.className = 'fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-fadeIn';
  
  modal.innerHTML = `
    <div class="bg-surface-container border border-outline-variant w-[550px] max-w-full rounded-lg shadow-2xl overflow-hidden flex flex-col max-h-[80vh] relative z-10 animate-subTabFadeIn">
      <!-- Modal Header -->
      <div class="p-5 border-b border-outline-variant bg-surface-container-high flex justify-between items-center flex-shrink-0 relative">
        <div class="absolute top-0 left-0 h-1 w-full hazard-stripe opacity-20"></div>
        <h3 class="font-headline-sm text-sm font-bold text-primary uppercase flex items-center gap-2">
          <span class="material-symbols-outlined text-sm">description</span> ${modName} — Full Description
        </h3>
        <button onclick="document.getElementById('mod-desc-modal').remove()" class="text-on-surface-variant hover:text-on-surface transition-colors">
          <span class="material-symbols-outlined text-lg">close</span>
        </button>
      </div>
      
      <!-- Modal Body -->
      <div class="p-6 overflow-y-auto custom-scrollbar font-body-md text-xs text-on-surface-variant leading-relaxed space-y-4 select-text">
        <div class="prose prose-invert max-w-none">
          ${descHtml}
        </div>
      </div>
      
      <!-- Modal Footer -->
      <div class="p-4 border-t border-outline-variant bg-surface-container-low flex justify-end flex-shrink-0">
        <button onclick="document.getElementById('mod-desc-modal').remove()" class="px-5 py-2 bg-primary text-on-primary-container rounded font-bold text-xs hover:brightness-110 active:scale-95 transition-all">
          CLOSE
        </button>
      </div>
    </div>
  `;
  
  // Close on clicking overlay
  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.remove();
  });

  document.body.appendChild(modal);
}

// State variables for Installed and SMR modules
let selectedInstalledModId = null;
let filterLatestServerVersion = true;
let smrSortOrder = 'last_version_date';
let activeHashtagFilter = null;

// SML compatibility helper
function isSmlCompatible(reqVersion, serverVersion) {
  if (!reqVersion) return true;
  if (!serverVersion) return true;
  
  const clean = (v) => v.replace(/^v/, '').replace(/^[^\d]*/, '');
  const cleanServer = clean(serverVersion);
  const cleanReq = clean(reqVersion);

  const parseVer = (v) => v.split('.').map(x => parseInt(x) || 0);
  const [sMaj, sMin, sPat] = parseVer(cleanServer);
  const [rMaj, rMin, rPat] = parseVer(cleanReq);

  if (rMaj > sMaj) return false;
  if (rMaj === sMaj) {
    if (rMin > sMin) return false;
    if (rMin === sMin && rPat > sPat) return false;
  }
  return true;
}

function toggleFilterLatestServerVersion() {
  const checkbox = document.getElementById('filter-latest-server-version');
  filterLatestServerVersion = checkbox ? checkbox.checked : false;
  renderSmrModsList();
}

function changeSmrSorting() {
  const select = document.getElementById('smr-sort-select');
  smrSortOrder = select ? select.value : 'last_version_date';
  fetchSmrMods(true);
}

function toggleHashtag(tag, el) {
  if (activeHashtagFilter === tag) {
    activeHashtagFilter = null;
    el.classList.remove('active-hashtag');
    el.classList.replace('bg-primary/20', 'bg-surface-container-lowest');
    el.classList.replace('text-primary', 'text-on-surface-variant');
    el.classList.replace('border-primary/50', 'border-outline-variant/50');
  } else {
    activeHashtagFilter = tag;
    document.querySelectorAll('.hashtag-btn').forEach(btn => {
      btn.classList.remove('active-hashtag');
      btn.classList.replace('bg-primary/20', 'bg-surface-container-lowest');
      btn.classList.replace('text-primary', 'text-on-surface-variant');
      btn.classList.replace('border-primary/50', 'border-outline-variant/50');
    });
    el.classList.add('active-hashtag');
    el.classList.replace('bg-surface-container-lowest', 'bg-primary/20');
    el.classList.replace('text-on-surface-variant', 'text-primary');
    el.classList.replace('border-outline-variant/50', 'border-primary/50');
  }
  renderSmrModsList();
}

function selectInstalledMod(modId) {
  selectedInstalledModId = modId;
  renderInstalledModsList();
}

function selectSmrMod(modId) {
  selectedModId = modId;
  renderSmrModsList();
  fetchSmrModDetail(modId);
}

// Render Installed Modules list
function renderInstalledModsList() {
  const listContainer = document.getElementById('installed-mods-list-container');
  if (!listContainer) return;

  const installedMods = serverState?.mods || [];
  if (installedMods.length === 0) {
    listContainer.innerHTML = `
      <div class="p-8 text-center text-on-surface-variant/60">
        <span class="material-symbols-outlined text-4xl block mb-2 opacity-30">extension_off</span>
        <p class="text-xs">No modules currently installed.</p>
      </div>`;
    const detailPanel = document.getElementById('installed-mod-detail-panel');
    if (detailPanel) {
      detailPanel.innerHTML = `
        <div class="flex-1 flex flex-col items-center justify-center gap-3 text-on-surface-variant p-12">
          <span class="material-symbols-outlined text-5xl opacity-20">extension</span>
          <p class="text-xs opacity-60 font-label-caps">SELECT AN INSTALLED MODULE TO CONFIGURE</p>
        </div>`;
    }
    return;
  }

  // Auto-select first installed mod if none selected
  if (!selectedInstalledModId && installedMods.length > 0) {
    selectedInstalledModId = installedMods[0].id;
  }

  let listHtml = '';
  installedMods.forEach(mod => {
    let tagText = 'INSTALLED';
    let tagClass = 'bg-tertiary-container/20 text-tertiary border border-tertiary/30';
    let titleColorClass = 'text-on-surface';

    if (mod.status === 'OUTDATED') {
      tagText = 'UPDATE'; tagClass = 'bg-primary-container/20 text-primary border border-primary/30';
    } else if (mod.status === 'CONFLICT ERROR') {
      tagText = 'CONFLICT'; tagClass = 'bg-error-container/20 text-error border border-error/30';
    } else if (mod.status === 'DISABLED') {
      tagText = 'DISABLED'; tagClass = 'bg-surface-variant/40 text-on-surface-variant/40 border border-outline-variant/30';
    }

    const isActive = mod.id === selectedInstalledModId;
    const activeClass = isActive ? 'active-item-accent' : '';
    if (isActive) titleColorClass = 'text-primary';

    const logoHtml = mod.logo
      ? `<img src="${mod.logo}" alt="" class="w-8 h-8 object-cover flex-shrink-0 rounded-sm" onerror="this.style.display='none'"/>`
      : `<div class="w-8 h-8 flex-shrink-0 bg-surface-variant flex items-center justify-center rounded-sm">
           <span class="material-symbols-outlined text-on-surface-variant/50 text-sm">extension</span>
         </div>`;

    listHtml += `
      <div onclick="selectInstalledMod('${mod.id}')" class="${activeClass} p-3 border-b border-outline-variant cursor-pointer group hover:bg-surface-variant/50 transition-colors">
        <div class="flex gap-3 items-start">
          ${logoHtml}
          <div class="flex-1 min-w-0">
            <div class="flex justify-between items-start mb-0.5 gap-2">
              <h3 class="font-headline-sm text-[12px] ${titleColorClass} font-bold group-hover:translate-x-0.5 transition-transform truncate">${mod.name}</h3>
              <span class="font-label-caps text-[9px] px-1.5 py-0.5 ${tagClass} flex-shrink-0 font-bold uppercase tracking-wider">${tagText}</span>
            </div>
            <p class="font-body-md text-on-surface-variant/60 text-[10px] truncate leading-tight">${mod.description || mod.short_description || ''}</p>
            <div class="mt-1.5 flex gap-3 text-[9px] font-code-sm text-on-secondary-container/80">
              <span>v${mod.version}</span>
              <span>${mod.author || 'Unknown'}</span>
            </div>
          </div>
        </div>
      </div>
    `;
  });

  listContainer.innerHTML = listHtml;
  renderInstalledModDetail();
}

// Render Installed Mod Detail Panel
function renderInstalledModDetail() {
  const detailPanel = document.getElementById('installed-mod-detail-panel');
  if (!detailPanel) return;

  if (!selectedInstalledModId) {
    detailPanel.innerHTML = `
      <div class="flex-1 flex flex-col items-center justify-center gap-3 text-on-surface-variant p-12">
        <span class="material-symbols-outlined text-5xl opacity-20">extension</span>
        <p class="text-xs opacity-60 font-label-caps">SELECT AN INSTALLED MODULE TO CONFIGURE</p>
      </div>`;
    return;
  }

  const mod = serverState?.mods.find(m => m.id === selectedInstalledModId);
  if (!mod) return;

  // Action buttons
  let actionButtonsHtml = '';
  if (mod.status === 'OUTDATED') {
    actionButtonsHtml = `
      <button onclick="updateMod('${mod.id}', this)" class="bg-primary text-on-primary-container px-5 py-2 font-label-caps text-label-caps border border-primary hover:bg-primary-fixed-dim transition-all active:scale-95 duration-100">UPDATE NOW</button>
      <button onclick="uninstallMod('${mod.id}', this)" class="bg-transparent text-error px-5 py-2 font-label-caps text-label-caps border border-error/40 hover:bg-error/10 transition-all active:scale-95 duration-100">UNINSTALL</button>`;
  } else if (mod.status === 'DISABLED') {
    actionButtonsHtml = `
      <button onclick="toggleModEnable('${mod.id}')" class="bg-primary text-on-primary-container px-5 py-2 font-label-caps text-label-caps border border-primary hover:bg-primary-fixed-dim transition-all active:scale-95 duration-100">ENABLE MOD</button>
      <button onclick="uninstallMod('${mod.id}', this)" class="bg-transparent text-error px-5 py-2 font-label-caps text-label-caps border border-error/40 hover:bg-error/10 transition-all active:scale-95 duration-100">UNINSTALL</button>`;
  } else {
    actionButtonsHtml = `
      <button onclick="toggleModEnable('${mod.id}')" class="bg-surface-variant text-on-surface px-5 py-2 font-label-caps text-label-caps border border-outline-variant hover:bg-surface-container-highest transition-all active:scale-95 duration-100">DISABLE</button>
      <button onclick="uninstallMod('${mod.id}', this)" class="bg-transparent text-error px-5 py-2 font-label-caps text-label-caps border border-error/40 hover:bg-error/10 transition-all active:scale-95 duration-100">UNINSTALL</button>`;
  }

  // Tags
  const tagsHtml = mod.tags && mod.tags.length > 0
    ? mod.tags.map(t => `<span class="px-2 py-0.5 text-[9px] font-label-caps bg-surface-variant/50 text-on-surface-variant border border-outline-variant/50 uppercase">${t}</span>`).join('')
    : '';

  // Logo
  const logoHtml = mod.logo
    ? `<img src="${mod.logo}" alt="" class="w-16 h-16 object-cover rounded border border-outline-variant/50" onerror="this.style.display='none'"/>`
    : `<div class="w-16 h-16 bg-surface-variant flex items-center justify-center rounded border border-outline-variant/50">
         <span class="material-symbols-outlined text-3xl text-on-surface-variant/30">extension</span>
       </div>`;

  // Dependencies
  const deps = mod.dependencies || [];
  let depsHtml = deps.length > 0
    ? deps.map(dep => `
      <div class="flex items-center justify-between bg-surface-container-low p-2 border-l-2 border-tertiary">
        <span class="text-xs font-bold text-on-surface">${dep}</span>
        <span class="material-symbols-outlined text-tertiary text-sm" style="font-variation-settings: 'FILL' 1;">check_circle</span>
      </div>`).join('')
    : `<div class="text-xs text-on-surface-variant opacity-50">No dependencies listed.</div>`;

  const logs = getModLogs(mod);
  const descHtml = parseMarkdownToHtml(mod.description || mod.short_description || '');

  detailPanel.innerHTML = `
    <!-- Detail Header -->
    <div class="p-6 border-b border-outline-variant bg-surface-container relative animate-fadeIn flex-shrink-0">
      <div class="absolute top-0 right-0 h-1 w-full hazard-stripe opacity-20"></div>
      <div class="flex justify-between items-start gap-4">
        <div class="flex gap-4 items-start flex-1 min-w-0">
          ${logoHtml}
          <div class="flex-1 min-w-0">
            <span class="font-label-caps text-[10px] text-primary mb-1 block font-semibold tracking-wider">INSTALLED MODULE — ${mod.id}</span>
            <h1 class="font-display-lg text-xl text-primary uppercase font-extrabold tracking-tight leading-none">${mod.name}</h1>
            <p class="font-body-lg text-xs text-on-surface-variant mt-1 max-w-2xl leading-relaxed line-clamp-2">${mod.short_description || mod.description || ''}</p>
            <div class="flex items-center gap-3 mt-2 flex-wrap">
              ${tagsHtml ? `<div class="flex gap-1.5 flex-wrap">${tagsHtml}</div>` : ''}
              ${descHtml ? `
                <button id="btn-view-installed-mod-desc" class="px-2.5 py-1 bg-surface-container-highest hover:bg-surface-variant border border-outline-variant text-on-surface rounded font-bold text-[9px] transition-colors flex items-center gap-1 active:scale-95 duration-100">
                  <span class="material-symbols-outlined text-[11px]">description</span> VIEW FULL DESCRIPTION
                </button>` : ''}
            </div>
          </div>
        </div>
        <div class="flex flex-col gap-2 flex-shrink-0">
          ${actionButtonsHtml}
        </div>
      </div>
    </div>

    <!-- Metrics Strip -->
    <div class="grid grid-cols-2 border-b border-outline-variant divide-x divide-outline-variant bg-surface-container-low flex-shrink-0">
      <div class="p-4">
        <span class="font-label-caps text-[10px] text-on-surface-variant block mb-1">VERSION</span>
        <span class="font-headline-md text-base text-tertiary font-bold">v${mod.version}</span>
      </div>
      <div class="p-4">
        <span class="font-label-caps text-[10px] text-on-surface-variant block mb-1">COMPATIBILITY</span>
        <span class="font-headline-md text-base text-on-surface font-bold">${mod.compatibility || 'Stable'}</span>
      </div>
    </div>

    <!-- Log Output and Control Area -->
    <div class="flex-1 flex gap-6 p-6 overflow-hidden bg-surface-container-lowest">
      <!-- Left: FICSIT-CLI Logs -->
      <div class="flex-1 flex flex-col overflow-hidden h-full">
        <div class="flex justify-between items-center mb-3 flex-shrink-0">
          <div class="flex items-center gap-2">
            <span class="material-symbols-outlined text-primary text-sm">terminal</span>
            <span class="font-label-caps text-label-caps text-on-surface-variant">FICSIT-CLI LOGS</span>
          </div>
          <div class="flex items-center gap-4 text-[10px] font-code-sm text-on-secondary-container">
            <span>BY: ${mod.author || 'Unknown'}</span>
          </div>
        </div>
        <div class="flex-1 bg-black border border-outline-variant p-4 font-code-sm text-[11px] text-tertiary-fixed overflow-y-auto custom-scrollbar relative">
          <div class="opacity-10 absolute inset-0 pointer-events-none" style="background: repeating-linear-gradient(0deg, transparent, transparent 1px, rgba(84, 228, 168, 0.05) 1px, rgba(84, 228, 168, 0.05) 2px); background-size: 100% 2px;"></div>
          <div class="relative z-10 space-y-1" id="installed-mod-ficsit-cli-logs">${logs.join('')}</div>
        </div>
      </div>

      <!-- Right: Dependencies & Load Order -->
      <div class="w-[220px] flex flex-col gap-5 overflow-y-auto custom-scrollbar flex-shrink-0 pr-1">
        <div class="bg-surface-container-highest p-4 border border-primary/30 flex-shrink-0">
          <div class="flex items-center justify-between mb-2">
            <label class="font-bold text-xs text-primary uppercase">LOAD ORDER</label>
            <button onclick="toggleLoadOrderSlider(this)" class="w-10 h-5 bg-primary relative rounded-full p-0.5 transition-colors">
              <div class="w-4 h-4 bg-on-primary-container rounded-full ${mod.enabled ? 'translate-x-5' : ''} transition-transform"></div>
            </button>
          </div>
          <div class="flex items-center gap-2 mt-3">
            <input class="w-16 bg-background border border-outline-variant text-xs text-on-surface text-center py-1 font-code-sm focus:border-primary focus:ring-0" type="number" value="${mod.loadOrder || 1}"/>
            <span class="text-[10px] text-on-surface-variant leading-tight">Priority Index</span>
          </div>
        </div>

        <div class="flex-1 min-h-0">
          <h4 class="font-label-caps text-label-caps text-on-surface-variant mb-3 border-b border-outline-variant pb-1">DEPENDENCIES</h4>
          <div class="space-y-2 overflow-y-auto max-h-[180px] pr-1 custom-scrollbar">${depsHtml}</div>
        </div>
      </div>
    </div>
  `;

  // Auto-scroll logs
  const logsContainer = document.getElementById('installed-mod-ficsit-cli-logs');
  if (logsContainer) logsContainer.parentElement.scrollTop = logsContainer.parentElement.scrollHeight;

  // View full description modal binding
  const btnViewDesc = document.getElementById('btn-view-installed-mod-desc');
  if (btnViewDesc) {
    btnViewDesc.addEventListener('click', () => {
      openModDescriptionModal(mod.name, descHtml);
    });
  }
}

// Render SMR Mods Browser list
function renderSmrModsList() {
  const listContainer = document.getElementById('smr-mods-list-container');
  if (!listContainer) return;

  const installedIds = new Set((serverState?.mods || []).map(m => m.id));

  const smrItems = smrMods.map(m => ({
    id: m.id,
    name: m.name,
    description: m.short_description || '',
    author: m.author || 'Unknown',
    downloads: m.downloads,
    logo: m.logo || null,
    last_version_date: m.last_version_date || null,
    isInstalled: installedIds.has(m.id),
    status: installedIds.has(m.id) ? (serverState?.mods.find(im => im.id === m.id)?.status || 'INSTALLED') : 'AVAILABLE',
    sml_version: m.sml_version || null,
    tags: m.tags || []
  }));

  // Apply filters locally
  let filteredItems = smrItems.filter(m => {
    // SML version compatibility check
    if (filterLatestServerVersion && m.sml_version) {
      if (!isSmlCompatible(m.sml_version, serverState?.ficsitCli?.smlVersion)) {
        return false;
      }
    }
    // Tag check
    if (activeHashtagFilter) {
      if (!m.tags.includes(activeHashtagFilter)) {
        return false;
      }
    }
    return true;
  });

  let listHtml = '';

  const countLabel = smrLoading
    ? 'LOADING...'
    : `SMR REPOSITORY (${smrTotal > 0 ? smrTotal.toLocaleString() : filteredItems.length} MODS)`;
  listHtml += `<div class="px-4 py-2 bg-surface-container-highest/80 border-b border-outline-variant sticky top-0 z-10">
    <span class="font-label-caps text-[9px] text-on-surface-variant/70 tracking-widest">${countLabel}</span>
  </div>`;

  filteredItems.forEach((mod) => {
    let tagText = 'AVAILABLE';
    let tagClass = 'bg-surface-variant text-on-surface-variant/70 border border-outline-variant';
    let titleColorClass = 'text-on-surface';

    if (mod.isInstalled) {
      if (mod.status === 'OUTDATED') {
        tagText = 'UPDATE'; tagClass = 'bg-primary-container/20 text-primary border border-primary/30';
      } else if (mod.status === 'CONFLICT ERROR') {
        tagText = 'CONFLICT'; tagClass = 'bg-error-container/20 text-error border border-error/30';
      } else if (mod.status === 'DISABLED') {
        tagText = 'DISABLED'; tagClass = 'bg-surface-variant/40 text-on-surface-variant/40 border border-outline-variant/30';
      } else {
        tagText = 'INSTALLED'; tagClass = 'bg-tertiary-container/20 text-tertiary border border-tertiary/30';
      }
    }

    const isActive = mod.id === selectedModId;
    const activeClass = isActive ? 'active-item-accent' : '';
    if (isActive) titleColorClass = 'text-primary';

    const logoHtml = mod.logo
      ? `<img src="${mod.logo}" alt="" class="w-8 h-8 object-cover flex-shrink-0 rounded-sm" onerror="this.style.display='none'"/>`
      : `<div class="w-8 h-8 flex-shrink-0 bg-surface-variant flex items-center justify-center rounded-sm">
           <span class="material-symbols-outlined text-on-surface-variant/50 text-sm">extension</span>
         </div>`;

    const dlStr = formatDownloads(mod.downloads);
    const agoStr = mod.last_version_date ? timeAgo(mod.last_version_date) : '';

    listHtml += `
      <div onclick="selectSmrMod('${mod.id}')" class="${activeClass} p-3 border-b border-outline-variant cursor-pointer group hover:bg-surface-variant/50 transition-colors">
        <div class="flex gap-3 items-start">
          ${logoHtml}
          <div class="flex-1 min-w-0">
            <div class="flex justify-between items-start mb-0.5 gap-2">
              <h3 class="font-headline-sm text-[12px] ${titleColorClass} font-bold group-hover:translate-x-0.5 transition-transform truncate">${mod.name}</h3>
              <span class="font-label-caps text-[9px] px-1.5 py-0.5 ${tagClass} flex-shrink-0 font-bold uppercase tracking-wider">${tagText}</span>
            </div>
            <p class="font-body-md text-on-surface-variant/60 text-[10px] truncate leading-tight">${mod.description}</p>
            <div class="mt-1.5 flex gap-3 text-[9px] font-code-sm text-on-secondary-container/80 items-center">
              <span>${mod.author}</span>
              ${dlStr ? `<span>↓ ${dlStr}</span>` : ''}
              ${agoStr ? `<span class="text-on-surface-variant/40">${agoStr}</span>` : ''}
              ${mod.sml_version ? `<span class="text-primary font-bold ml-auto bg-primary/10 px-1 border border-primary/20 rounded-xs">SML: ${mod.sml_version}</span>` : ''}
            </div>
          </div>
        </div>
      </div>
    `;
  });

  // Loading spinner
  if (smrLoading) {
    listHtml += `<div class="p-6 flex flex-col items-center gap-3">
      <div class="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
      <span class="text-[10px] text-on-surface-variant/60 font-label-caps">FETCHING SMR DATA...</span>
    </div>`;
  } else if (filteredItems.length === 0) {
    listHtml += `<div class="p-8 text-center text-on-surface-variant/60">
      <span class="material-symbols-outlined text-4xl block mb-2 opacity-30">extension_off</span>
      <p class="text-xs">No SMR modules match current filters.</p>
    </div>`;
  } else if (smrMods.length > 0 && smrMods.length < smrTotal && !smrLoading) {
    listHtml += `<div onclick="fetchSmrMods()" class="p-4 text-center cursor-pointer hover:bg-surface-variant/30 transition-colors">
      <span class="text-[10px] font-label-caps text-primary">LOAD MORE (${smrTotal - smrMods.length} remaining)</span>
    </div>`;
  }

  listContainer.innerHTML = listHtml;
  renderSelectedMod();
}

function parseMarkdownToHtml(md) {
  if (!md) return '';

  // Normalize line endings
  let html = md.replace(/\r\n/g, '\n');

  // Parse code blocks first to protect them from normal markdown parsing
  html = html.replace(/```([\s\S]*?)```/g, (match, code) => {
    const escapedCode = code
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    return `<pre class="bg-black/60 p-3 rounded font-code-sm my-3 overflow-x-auto text-[11px] border border-outline-variant/30 text-tertiary-fixed"><code class="select-text">${escapedCode}</code></pre>`;
  });

  // Split content by code blocks to avoid parsing markdown tags inside them
  const parts = html.split(/(<pre[\s\S]*?<\/pre>)/);

  for (let i = 0; i < parts.length; i++) {
    if (!parts[i].startsWith('<pre')) {
      let p = parts[i];

      // Convert inline code: `code`
      p = p.replace(/`([^`\n]+)`/g, '<code class="bg-black/30 px-1.5 py-0.5 rounded font-code-sm text-[11px] text-primary">$1</code>');

      // Convert bold: **text** or __text__
      p = p.replace(/\*\*([^*]+)\*\*/g, '<strong class="font-bold text-on-surface">$1</strong>');
      p = p.replace(/__([^_]+)__/g, '<strong class="font-bold text-on-surface">$1</strong>');

      // Convert italics: *text* or _text_
      p = p.replace(/\*([^*]+)\*/g, '<em class="italic">$1</em>');
      p = p.replace(/_([^_]+)_/g, '<em class="italic">$1</em>');

      // Convert links: [text](url)
      p = p.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" class="text-primary hover:underline font-semibold">$1</a>');

      // Convert headers (must start at beginning of line)
      p = p.replace(/^(?:###)\s+(.*)$/gm, '<h5 class="text-sm font-bold text-primary mt-4 mb-2">$1</h5>');
      p = p.replace(/^(?:##)\s+(.*)$/gm, '<h4 class="text-base font-bold text-primary mt-5 mb-2 pb-1 border-b border-outline-variant/30">$1</h4>');
      p = p.replace(/^(?:#)\s+(.*)$/gm, '<h3 class="text-lg font-bold text-primary mt-6 mb-3 pb-1 border-b border-outline-variant/50">$1</h3>');

      // Convert lists: - item or * item
      p = p.replace(/^(?:\s*[-*]\s+)(.*)$/gm, '<li class="ml-4 list-disc text-xs text-on-surface-variant/90">$1</li>');

      // Group consecutive list items into <ul>
      p = p.replace(/((?:<li.*?>.*?<\/li>\s*)+)/g, '<ul class="list-disc pl-4 my-2 space-y-1">$1</ul>');

      // Newlines to <br/> (only if not after headers/lists/blocks to avoid double spacing)
      p = p.split('\n').map(line => {
        const trimmed = line.trim();
        if (!trimmed) return '<div class="h-2"></div>';
        if (
          trimmed.startsWith('<h') ||
          trimmed.endsWith('</h3>') || trimmed.endsWith('</h4>') || trimmed.endsWith('</h5>') ||
          trimmed.startsWith('<ul') || trimmed.endsWith('</ul>') ||
          trimmed.startsWith('<li') || trimmed.endsWith('</li>') ||
          trimmed.startsWith('<div') || trimmed.endsWith('</div>')
        ) {
          return line;
        }
        return line + '<br/>';
      }).join('\n');

      parts[i] = p;
    }
  }

  return parts.join('');
}

function renderSelectedMod() {
  const detailPanel = document.getElementById('smr-mod-detail-panel');
  if (!detailPanel) return;

  // Show loading state
  if (smrDetailLoading) {
    detailPanel.innerHTML = `
      <div class="flex-1 flex flex-col items-center justify-center gap-4 text-on-surface-variant">
        <div class="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
        <span class="font-label-caps text-[10px] tracking-widest">FETCHING MODULE DATA FROM SMR...</span>
      </div>`;
    return;
  }

  if (!selectedModId) {
    detailPanel.innerHTML = `
      <div class="flex-1 flex flex-col items-center justify-center gap-3 text-on-surface-variant p-12">
        <span class="material-symbols-outlined text-5xl opacity-20">extension</span>
        <p class="text-xs opacity-60 font-label-caps">SELECT A MODULE TO VIEW DETAILS</p>
      </div>`;
    return;
  }

  // Prefer local installed mod data, then SMR detail data
  const localMod = serverState?.mods.find(m => m.id === selectedModId);
  const smrData = smrSelectedMod?.id === selectedModId ? smrSelectedMod : null;
  const smrListMod = smrMods.find(m => m.id === selectedModId);

  const isInstalled = !!localMod;

  // Compose unified mod object
  const mod = {
    id: selectedModId,
    name: localMod?.name || smrData?.name || smrListMod?.name || 'Unknown Mod',
    description: smrData?.full_description || smrData?.short_description || localMod?.description || smrListMod?.short_description || '',
    short_description: smrData?.short_description || localMod?.description || smrListMod?.short_description || '',
    version: localMod?.version || smrData?.version || '?.?.?',
    author: localMod?.author || smrData?.author || smrListMod?.author || 'Unknown',
    authors: smrData?.authors || (localMod?.author ? [localMod.author] : []),
    logo: smrData?.logo || smrListMod?.logo || null,
    downloads: smrData?.downloads ?? smrListMod?.downloads ?? null,
    last_version_date: smrData?.last_version_date || smrListMod?.last_version_date || null,
    sml_version: smrData?.sml_version || null,
    size_bytes: smrData?.size_bytes || null,
    tags: smrData?.tags || smrListMod?.tags || [],
    status: localMod?.status || 'AVAILABLE',
    enabled: localMod?.enabled ?? true,
    loadOrder: localMod?.loadOrder || 1,
    dependencies: localMod?.dependencies || [],
    compatibility: localMod?.compatibility || 'U8 STABLE'
  };

  // Action buttons
  let actionButtonsHtml = '';
  if (isInstalled) {
    if (mod.status === 'OUTDATED') {
      actionButtonsHtml = `
        <button onclick="updateMod('${mod.id}', this)" class="bg-primary text-on-primary-container px-5 py-2 font-label-caps text-label-caps border border-primary hover:bg-primary-fixed-dim transition-all active:scale-95 duration-100">UPDATE NOW</button>
        <button onclick="uninstallMod('${mod.id}', this)" class="bg-transparent text-error px-5 py-2 font-label-caps text-label-caps border border-error/40 hover:bg-error/10 transition-all active:scale-95 duration-100">UNINSTALL</button>`;
    } else if (mod.status === 'DISABLED') {
      actionButtonsHtml = `
        <button onclick="toggleModEnable('${mod.id}')" class="bg-primary text-on-primary-container px-5 py-2 font-label-caps text-label-caps border border-primary hover:bg-primary-fixed-dim transition-all active:scale-95 duration-100">ENABLE MOD</button>
        <button onclick="uninstallMod('${mod.id}', this)" class="bg-transparent text-error px-5 py-2 font-label-caps text-label-caps border border-error/40 hover:bg-error/10 transition-all active:scale-95 duration-100">UNINSTALL</button>`;
    } else {
      actionButtonsHtml = `
        <button onclick="toggleModEnable('${mod.id}')" class="bg-surface-variant text-on-surface px-5 py-2 font-label-caps text-label-caps border border-outline-variant hover:bg-surface-container-highest transition-all active:scale-95 duration-100">DISABLE</button>
        <button onclick="uninstallMod('${mod.id}', this)" class="bg-transparent text-error px-5 py-2 font-label-caps text-label-caps border border-error/40 hover:bg-error/10 transition-all active:scale-95 duration-100">UNINSTALL</button>`;
    }
  } else {
    actionButtonsHtml = `
      <button onclick="installMod('${mod.id}', this)" class="bg-primary text-on-primary-container px-5 py-2 font-label-caps text-label-caps border border-primary hover:bg-primary-fixed-dim transition-all active:scale-95 duration-100">INSTALL MOD</button>
      <a href="https://ficsit.app/mod/${encodeURIComponent(mod.id)}" target="_blank" class="bg-transparent text-on-surface-variant px-5 py-2 font-label-caps text-label-caps border border-outline-variant hover:bg-surface-variant/30 transition-all text-center text-[10px]">VIEW ON FICSIT.APP</a>`;
  }

  // Tags html
  const tagsHtml = mod.tags.length > 0
    ? mod.tags.map(t => `<span class="px-2 py-0.5 text-[9px] font-label-caps bg-surface-variant/50 text-on-surface-variant border border-outline-variant/50 uppercase">${t}</span>`).join('')
    : '';

  // Downloads & update date
  const dlStr = formatDownloads(mod.downloads);
  const agoStr = mod.last_version_date ? timeAgo(mod.last_version_date) : '';
  const sizeStr = mod.size_bytes ? (mod.size_bytes / 1024 / 1024).toFixed(1) + ' MB' : '—';

  // Logo
  const logoHtml = mod.logo
    ? `<img src="${mod.logo}" alt="" class="w-16 h-16 object-cover rounded border border-outline-variant/50" onerror="this.style.display='none'"/>`
    : `<div class="w-16 h-16 bg-surface-variant flex items-center justify-center rounded border border-outline-variant/50">
         <span class="material-symbols-outlined text-3xl text-on-surface-variant/30">extension</span>
       </div>`;

  // Dependencies
  const deps = mod.dependencies || [];
  let depsHtml = deps.length > 0
    ? deps.map(dep => `
      <div class="flex items-center justify-between bg-surface-container-low p-2 border-l-2 border-tertiary">
        <span class="text-xs font-bold text-on-surface">${dep}</span>
        <span class="material-symbols-outlined text-tertiary text-sm" style="font-variation-settings: 'FILL' 1;">check_circle</span>
      </div>`).join('')
    : `<div class="text-xs text-on-surface-variant opacity-50">No dependencies listed.</div>`;

  const logs = getModLogs(mod);

  // Render HTML / Markdown correctly via the custom parser
  const descHtml = parseMarkdownToHtml(mod.description || mod.short_description || '');

  detailPanel.innerHTML = `
    <!-- Detail Header -->
    <div class="p-6 border-b border-outline-variant bg-surface-container relative animate-fadeIn flex-shrink-0">
      <div class="absolute top-0 right-0 h-1 w-full hazard-stripe opacity-20"></div>
      <div class="flex justify-between items-start gap-4">
        <div class="flex gap-4 items-start flex-1 min-w-0">
          ${logoHtml}
          <div class="flex-1 min-w-0">
            <span class="font-label-caps text-[10px] text-primary mb-1 block font-semibold tracking-wider">MOD SPECIFICATION — ${mod.id}</span>
            <h1 class="font-display-lg text-xl text-primary uppercase font-extrabold tracking-tight leading-none">${mod.name}</h1>
            <p class="font-body-lg text-xs text-on-surface-variant mt-1 max-w-2xl leading-relaxed line-clamp-2">${mod.short_description}</p>
            <div class="flex items-center gap-3 mt-2 flex-wrap">
              ${tagsHtml ? `<div class="flex gap-1.5 flex-wrap">${tagsHtml}</div>` : ''}
              ${descHtml ? `
                <button id="btn-view-mod-desc" class="px-2.5 py-1 bg-surface-container-highest hover:bg-surface-variant border border-outline-variant text-on-surface rounded font-bold text-[9px] transition-colors flex items-center gap-1 active:scale-95 duration-100">
                  <span class="material-symbols-outlined text-[11px]">description</span> VIEW FULL DESCRIPTION
                </button>` : ''}
            </div>
          </div>
        </div>
        <div class="flex flex-col gap-2 flex-shrink-0">
          ${actionButtonsHtml}
        </div>
      </div>
    </div>

    <!-- Metrics Strip -->
    <div class="grid grid-cols-4 border-b border-outline-variant divide-x divide-outline-variant bg-surface-container-low flex-shrink-0">
      <div class="p-4">
        <span class="font-label-caps text-[10px] text-on-surface-variant block mb-1">VERSION</span>
        <span class="font-headline-md text-base text-tertiary font-bold">v${mod.version}</span>
      </div>
      <div class="p-4">
        <span class="font-label-caps text-[10px] text-on-surface-variant block mb-1">DOWNLOADS</span>
        <span class="font-headline-md text-base text-on-surface font-bold">${dlStr || '—'}</span>
      </div>
      <div class="p-4">
        <span class="font-label-caps text-[10px] text-on-surface-variant block mb-1">PACKAGE SIZE</span>
        <span class="font-headline-md text-base text-on-surface font-bold">${sizeStr}</span>
      </div>
      <div class="p-4">
        <span class="font-label-caps text-[10px] text-on-surface-variant block mb-1">LAST UPDATED</span>
        <span class="font-headline-md text-base text-on-surface font-bold">${agoStr || '—'}</span>
        ${mod.sml_version ? `<span class="text-[9px] text-on-surface-variant/60 font-code-sm block">SML: ${mod.sml_version}</span>` : ''}
      </div>
    </div>

    <!-- Log Output and Control Area -->
    <div class="flex-1 flex gap-6 p-6 overflow-hidden bg-surface-container-lowest">
      <!-- Left: FICSIT-CLI Logs -->
      <div class="flex-1 flex flex-col overflow-hidden h-full">
        <div class="flex justify-between items-center mb-3 flex-shrink-0">
          <div class="flex items-center gap-2">
            <span class="material-symbols-outlined text-primary text-sm">terminal</span>
            <span class="font-label-caps text-label-caps text-on-surface-variant">FICSIT-CLI LOGS</span>
          </div>
          <div class="flex items-center gap-4 text-[10px] font-code-sm text-on-secondary-container">
            <span>BY: ${mod.authors.join(', ') || mod.author}</span>
            <span>ENCRYPTION: AES-256</span>
          </div>
        </div>
        <div class="flex-1 bg-black border border-outline-variant p-4 font-code-sm text-[11px] text-tertiary-fixed overflow-y-auto custom-scrollbar relative">
          <div class="opacity-10 absolute inset-0 pointer-events-none" style="background: repeating-linear-gradient(0deg, transparent, transparent 1px, rgba(84, 228, 168, 0.05) 1px, rgba(84, 228, 168, 0.05) 2px); background-size: 100% 2px;"></div>
          <div class="relative z-10 space-y-1" id="mod-ficsit-cli-logs">${logs.join('')}</div>
        </div>
      </div>

      <!-- Right: Dependencies & Load Order -->
      <div class="w-[220px] flex flex-col gap-5 overflow-y-auto custom-scrollbar flex-shrink-0 pr-1">
        ${isInstalled ? `
        <div class="bg-surface-container-highest p-4 border border-primary/30 flex-shrink-0">
          <div class="flex items-center justify-between mb-2">
            <label class="font-bold text-xs text-primary uppercase">LOAD ORDER</label>
            <button onclick="toggleLoadOrderSlider(this)" class="w-10 h-5 bg-primary relative rounded-full p-0.5 transition-colors">
              <div class="w-4 h-4 bg-on-primary-container rounded-full ${mod.enabled ? 'translate-x-5' : ''} transition-transform"></div>
            </button>
          </div>
          <div class="flex items-center gap-2 mt-3">
            <input class="w-16 bg-background border border-outline-variant text-xs text-on-surface text-center py-1 font-code-sm focus:border-primary focus:ring-0" type="number" value="${mod.loadOrder}"/>
            <span class="text-[10px] text-on-surface-variant leading-tight">Priority Index</span>
          </div>
        </div>` : `
        <div class="bg-surface-container-highest p-4 border border-outline-variant/30">
          <span class="font-label-caps text-[9px] text-on-surface-variant/60 block mb-2">SMR INFO</span>
          <div class="space-y-1.5 text-[10px]">
            <div class="flex justify-between"><span class="text-on-surface-variant/60">ID</span><span class="font-code-sm text-on-surface/80">${mod.id}</span></div>
            ${mod.sml_version ? `<div class="flex justify-between"><span class="text-on-surface-variant/60">SML</span><span class="font-code-sm text-on-surface/80">${mod.sml_version}</span></div>` : ''}
            <div class="flex justify-between"><span class="text-on-surface-variant/60">STATUS</span><span class="text-tertiary font-bold">AVAILABLE</span></div>
          </div>
        </div>`}

        <div class="flex-1 min-h-0">
          <h4 class="font-label-caps text-label-caps text-on-surface-variant mb-3 border-b border-outline-variant pb-1">DEPENDENCIES</h4>
          <div class="space-y-2 overflow-y-auto max-h-[180px] pr-1 custom-scrollbar">${depsHtml}</div>
        </div>
      </div>
    </div>
  `;

  // Auto-scroll logs
  const logsContainer = document.getElementById('mod-ficsit-cli-logs');
  if (logsContainer) logsContainer.parentElement.scrollTop = logsContainer.parentElement.scrollHeight;

  // View full description modal binding
  const btnViewDesc = document.getElementById('btn-view-mod-desc');
  if (btnViewDesc) {
    btnViewDesc.addEventListener('click', () => {
      openModDescriptionModal(mod.name, descHtml);
    });
  }
}

function toggleLoadOrderSlider(btn) {
  const knob = btn.querySelector('div');
  const isActive = knob.classList.contains('translate-x-5');
  if (isActive) {
    knob.classList.remove('translate-x-5');
    btn.classList.replace('bg-primary', 'bg-surface-variant');
  } else {
    knob.classList.add('translate-x-5');
    btn.classList.replace('bg-surface-variant', 'bg-primary');
  }
}

// Fetch helper POST calls
function postApi(url, body) {
  return fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  }).then(r => r.json());
}

function toggleModEnable(id) {
  const mod = serverState.mods.find(m => m.id === id);
  if (mod) {
    const nextState = mod.enabled ? 'disable' : 'enable';
    appendModLog(id, 'command', `ficsit-cli mods ${nextState} ${id}`);
    appendModLog(id, 'info', `Toggling module status...`);
  }
  
  postApi('/api/v1/mods/toggle', { id }).then(res => {
    if (res.success) {
      const index = serverState.mods.findIndex(m => m.id === id);
      serverState.mods[index] = res.mod;
      appendModLog(id, 'success', `Module ${res.mod.name} is now ${res.mod.enabled ? 'ENABLED' : 'DISABLED'}.`);
      renderInstalledModsList();
    }
  });
}

function updateMod(id, btn) {
  if (btn) {
    btn.innerText = 'UPDATING...';
    btn.disabled = true;
  }
  appendModLog(id, 'command', `ficsit-cli mods update ${id}`);
  appendModLog(id, 'info', `Downloading package patch...`);
  
  postApi('/api/v1/mods/update', { id }).then(res => {
    if (res.success) {
      const index = serverState.mods.findIndex(m => m.id === id);
      serverState.mods[index] = res.mod;
      appendModLog(id, 'success', `Module ${res.mod.name} updated to v${res.mod.version}.`);
      renderInstalledModsList();
    }
  });
}

function installMod(id, btn) {
  if (btn) {
    btn.innerText = 'INSTALLING...';
    btn.disabled = true;
  }
  appendModLog(id, 'command', `ficsit-cli mods install ${id}`);
  appendModLog(id, 'info', `Resolving dependencies & pulling build file...`);

  // Gather SMR metadata to pass to the backend
  const smrEntry = smrMods.find(m => m.id === id) || smrSelectedMod;

  postApi('/api/v1/mods/install', {
    id,
    name: smrEntry?.name,
    author: smrEntry?.author,
    description: smrEntry?.short_description || smrSelectedMod?.short_description,
    version: smrSelectedMod?.version,
    compatibility: 'U8 STABLE',
    logo: smrEntry?.logo || smrSelectedMod?.logo,
    downloads: smrEntry?.downloads || smrSelectedMod?.downloads
  }).then(res => {
    if (res.success) {
      serverState.mods.push(res.mod);
      const smrIdx = smrMods.findIndex(m => m.id === id);
      if (smrIdx !== -1) smrMods[smrIdx].installed = true;
      if (smrSelectedMod?.id === id) smrSelectedMod.installed = true;
      appendModLog(id, 'success', `Installed ${res.mod.name} v${res.mod.version} successfully.`);
      renderInstalledModsList();
      renderSmrModsList();
    } else {
      appendModLog(id, 'error', res.error || 'Install failed.');
      if (btn) { btn.innerText = 'INSTALL MOD'; btn.disabled = false; }
    }
  });
}

function uninstallMod(id, btn) {
  if (btn) {
    btn.innerText = 'UNINSTALLING...';
    btn.disabled = true;
  }
  appendModLog(id, 'command', `ficsit-cli mods uninstall ${id}`);
  appendModLog(id, 'info', `Removing configuration and binaries...`);
  
  postApi('/api/v1/mods/uninstall', { id }).then(res => {
    if (res.success) {
      const index = serverState.mods.findIndex(m => m.id === id);
      if (index !== -1) serverState.mods.splice(index, 1);

      // Keep smrMods installed flag in sync
      const smrIdx = smrMods.findIndex(m => m.id === id);
      if (smrIdx !== -1) smrMods[smrIdx].installed = false;
      if (smrSelectedMod?.id === id) smrSelectedMod.installed = false;

      appendModLog(id, 'success', `Module ${id} removed successfully.`);

      // Pick next selection for installed
      if (selectedInstalledModId === id) {
        if (serverState.mods.length > 0) {
          selectedInstalledModId = serverState.mods[0].id;
        } else {
          selectedInstalledModId = null;
        }
      }
      // Pick next selection for SMR
      if (selectedModId === id) {
        if (smrMods.length > 0) {
          selectedModId = smrMods[0].id;
          fetchSmrModDetail(selectedModId);
        } else {
          selectedModId = null;
        }
      }
      renderInstalledModsList();
      renderSmrModsList();
    } else {
      appendModLog(id, 'error', res.error || 'Uninstall failed.');
      if (btn) { btn.innerText = 'UNINSTALL'; btn.disabled = false; }
    }
  });
}

// API endpoint execution sandbox controller
function executeEndpoint(endpoint, method, payloadKey, buttonEl) {
  const payloadRef = document.getElementById('payload-ref-box');
  const responseRef = document.getElementById('payload-res-box');
  const selectedLabel = document.getElementById('selected-endpoint-label');

  if (selectedLabel) {
    selectedLabel.innerText = `${method} ${endpoint}`;
  }

  // Display payload body
  let payloadBody = {};
  if (endpoint.includes('command')) {
    payloadBody = {
      function: "RunCommand",
      data: {
        command: "SaveGame",
        parameters: ["auto_save_01"]
      }
    };
  } else if (endpoint.includes('login')) {
    payloadBody = {
      username: "System Operator",
      password: "••••••••••••••••"
    };
  } else if (endpoint.includes('save')) {
    payloadBody = {
      saveName: "MEGA_FACTORY_PROD_V4_MANUAL_BACKUP"
    };
  }
  
  if (payloadRef) {
    payloadRef.innerText = JSON.stringify(payloadBody, null, 2);
  }

  // Trigger executing loading spinner on button
  const originalHtml = buttonEl.innerHTML;
  buttonEl.innerHTML = '<span class="material-symbols-outlined text-sm animate-spin">sync</span> Running...';
  buttonEl.classList.add('opacity-70');

  if (responseRef) {
    responseRef.innerText = 'Waiting for FICSIT Server response...';
  }

  // Make the actual call
  const isPost = method === 'POST';
  const fetchOptions = {
    method: method,
    headers: { 'Content-Type': 'application/json' }
  };
  if (isPost) {
    fetchOptions.body = JSON.stringify(payloadBody);
  }

  fetch(endpoint, fetchOptions)
    .then(r => r.json())
    .then(res => {
      setTimeout(() => {
        // Render success visual
        buttonEl.innerHTML = '<span class="material-symbols-outlined text-sm">check_circle</span> Success';
        buttonEl.classList.replace('bg-secondary-container', 'bg-tertiary/20');
        buttonEl.classList.add('text-tertiary');
        
        if (responseRef) {
          responseRef.innerText = JSON.stringify(res, null, 2);
        }

        setTimeout(() => {
          buttonEl.innerHTML = originalHtml;
          buttonEl.classList.replace('bg-tertiary/20', 'bg-secondary-container');
          buttonEl.classList.remove('text-tertiary', 'opacity-70');
        }, 2000);
      }, 1000);
    })
    .catch(err => {
      buttonEl.innerHTML = '<span class="material-symbols-outlined text-sm text-error">error</span> Failed';
      if (responseRef) {
        responseRef.innerText = `Error contacting endpoint: ${err.message}`;
      }
      setTimeout(() => {
        buttonEl.innerHTML = originalHtml;
        buttonEl.classList.remove('opacity-70');
      }, 2000);
    });
}

// Server Console functions
function appendConsoleLog(log) {
  const container = document.getElementById('console-logs-container');
  const sysContainer = document.getElementById('sys-logs-container');

  const timeStr = new Date(log.timestamp).toLocaleTimeString();
  let colorClass = 'text-on-background';
  if (log.source === 'SYSTEM') colorClass = 'text-tertiary';
  else if (log.source === 'MOD_MGR') colorClass = 'text-primary';
  else if (log.source === 'ERROR' || log.message.includes('timeout') || log.message.includes('timed out')) colorClass = 'text-error';

  const innerHtml = `<span class="text-outline">[${timeStr}]</span> <span class="${colorClass}">[${log.source}]</span> ${log.message}`;

  if (container) {
    const line = document.createElement('div');
    line.className = 'zebra-stripe py-0.5';
    line.innerHTML = innerHtml;
    container.appendChild(line);
    container.scrollTop = container.scrollHeight;
  }

  if (sysContainer) {
    const line = document.createElement('div');
    line.className = 'console-stripe py-0.5';
    line.innerHTML = innerHtml;
    sysContainer.appendChild(line);
    sysContainer.scrollTop = sysContainer.scrollHeight;
  }
}

function sendConsoleCommand() {
  const input = document.getElementById('console-input-field');
  if (!input || input.value.trim() === '') return;
  const cmd = input.value.trim();

  // Send via API endpoint command
  postApi('/api/v1/command', {
    function: 'RunCommand',
    data: { command: cmd }
  });

  input.value = '';
}

// SteamCMD actions
function startSteamCmdUpdate() {
  if (socket && socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify({ type: 'steamcmd_action', data: 'start' }));
  }
}

function abortSteamCmdUpdate() {
  if (socket && socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify({ type: 'steamcmd_action', data: 'abort' }));
  }
}

function queryDiskSpace(btn) {
  const icon = btn ? btn.querySelector('.material-symbols-outlined') : document.querySelector('#srv-disk-refresh-btn .material-symbols-outlined');
  if (icon) {
    icon.classList.add('animate-spin');
  }

  fetch('/api/v1/diskspace')
    .then(r => r.json())
    .then(data => {
      if (data.success) {
        const percentText = document.getElementById('disk-percent-text');
        if (percentText) {
          percentText.innerText = `${data.percentNum}% FULL`;
        }
        
        const availText = document.getElementById('disk-avail-text');
        if (availText) {
          availText.innerText = data.avail;
        }
        
        const progressBar = document.getElementById('disk-progress-bar');
        if (progressBar) {
          progressBar.style.width = `${data.percentNum}%`;
          if (data.percentNum >= 85) {
            progressBar.classList.remove('bg-primary');
            progressBar.classList.add('bg-error');
          } else {
            progressBar.classList.remove('bg-error');
            progressBar.classList.add('bg-primary');
          }
        }
        
        const warningBox = document.getElementById('disk-warning-box');
        if (warningBox) {
          if (data.percentNum >= 85) {
            warningBox.className = 'text-xs text-error p-2 bg-error-container/10 border border-error/20 rounded flex items-center gap-2';
            warningBox.innerHTML = `
              <span class="material-symbols-outlined text-md">warning</span>
              <span id="disk-warning-text">Low space remaining to validate full Satisfactory build.</span>
            `;
          } else {
            warningBox.className = 'text-xs text-tertiary p-2 bg-tertiary-container/15 border border-tertiary/20 rounded flex items-center gap-2';
            warningBox.innerHTML = `
              <span class="material-symbols-outlined text-md">check_circle</span>
              <span id="disk-warning-text">Sufficient disk space available for update.</span>
            `;
          }
        }
      }
    })
    .catch(err => console.error('Failed to query disk space:', err))
    .finally(() => {
      if (icon) {
        setTimeout(() => {
          icon.classList.remove('animate-spin');
        }, 500);
      }
    });
}

function appendSteamCmdLog(msg) {
  const container = document.getElementById('console-output');
  if (!container) return;

  const timeStr = new Date().toLocaleTimeString();
  let colorClass = 'text-on-background/80';
  
  if (msg.includes('check') || msg.includes('anonymously')) {
    colorClass = 'text-primary-container';
  } else if (msg.includes('Initializing') || msg.includes('complete') || msg.includes('successful')) {
    colorClass = 'text-on-tertiary-fixed-variant';
  } else if (msg.includes('aborted') || msg.includes('Abort')) {
    colorClass = 'text-error';
  }

  const line = document.createElement('div');
  line.className = 'console-stripe py-1 px-2 ' + colorClass;
  line.innerHTML = `<span class="text-outline">[${timeStr}]</span> ${msg}`;
  
  container.appendChild(line);
  container.scrollTop = container.scrollHeight;
}

// FICSIT-CLI & SML actions
function updateFicsitCliUi() {
  if (!serverState || !serverState.ficsitCli) return;

  const fc = serverState.ficsitCli;
  
  // Update state text
  const validationVal = document.getElementById('fc-validation-val');
  if (validationVal) {
    validationVal.innerText = fc.statusText || 'IDLE';
  }
  
  // Status label
  const statusLabel = document.getElementById('fc-cli-status-text');
  if (statusLabel) {
    if (fc.running) {
      statusLabel.innerText = fc.statusText === 'DOWNLOADING CLI' ? 'Downloading ficsit-cli binary...' : 'Installing Satisfactory Mod Loader (SML)...';
    } else if (fc.installed) {
      statusLabel.innerText = fc.smlInstalled ? 'Mod Loader initialized and verified.' : 'ficsit-cli installed. Mod Loader SML not installed.';
    } else {
      statusLabel.innerText = 'CLI utility binary not detected on system.';
    }
  }

  // Progress Bar
  const progressText = document.getElementById('fc-progress-text');
  if (progressText) {
    progressText.innerText = `${fc.progress.toFixed(1)}%`;
  }
  
  const progressBar = document.getElementById('fc-progress-bar');
  if (progressBar) {
    progressBar.style.width = `${fc.progress}%`;
  }

  // Stats
  const cliVerEl = document.getElementById('fc-cli-version');
  if (cliVerEl) {
    cliVerEl.innerText = fc.installed ? (fc.version || 'v0.7.0') : 'NOT DETECTED';
  }

  const smlStatusEl = document.getElementById('fc-sml-status');
  if (smlStatusEl) {
    smlStatusEl.innerText = fc.smlInstalled ? (fc.smlVersion || 'v3.8.0') : 'NOT INSTALLED';
    smlStatusEl.className = fc.smlInstalled ? 'text-sm font-bold text-tertiary' : 'text-sm font-bold text-on-surface';
  }

  // Update Config page SML Configuration details
  const smlConfigVerEl = document.querySelector('.sml-config-version');
  if (smlConfigVerEl) {
    smlConfigVerEl.innerText = fc.smlInstalled ? (fc.smlVersion || 'v3.12.0') : 'Not Installed';
    smlConfigVerEl.className = fc.smlInstalled ? 'text-tertiary font-bold' : 'text-on-surface font-semibold';
  }

  const smlConfigDirEl = document.querySelector('.sml-config-dir');
  if (smlConfigDirEl) {
    smlConfigDirEl.innerText = '/opt/satisfactory-server/server/FactoryGame/Configs/';
  }

  const serverPathEl = document.getElementById('fc-server-path');
  if (serverPathEl) {
    serverPathEl.innerText = '/opt/satisfactory-server/server';
  }

  // Buttons state validation
  const btnUninstall = document.getElementById('fc-btn-uninstall');
  const btnInstallCli = document.getElementById('fc-btn-install-cli');
  const btnInstallSml = document.getElementById('fc-btn-install-sml');

  if (btnUninstall) {
    if (fc.smlInstalled && !fc.running) {
      btnUninstall.removeAttribute('disabled');
      btnUninstall.className = 'px-6 py-2 border border-error text-error rounded font-bold text-xs hover:bg-error/10 transition-colors active:scale-95 duration-100';
    } else {
      btnUninstall.setAttribute('disabled', 'true');
      btnUninstall.className = 'px-6 py-2 border border-outline-variant text-on-surface rounded font-bold text-xs opacity-50 cursor-not-allowed';
    }
  }

  if (btnInstallCli) {
    if (fc.running) {
      btnInstallCli.setAttribute('disabled', 'true');
      btnInstallCli.className = 'px-6 py-2 border border-outline-variant text-on-surface rounded font-bold text-xs opacity-50 cursor-not-allowed';
    } else {
      btnInstallCli.removeAttribute('disabled');
      btnInstallCli.className = 'px-6 py-2 bg-surface-container-highest border border-outline-variant text-on-surface rounded font-bold text-xs hover:bg-surface-variant transition-colors active:scale-95 duration-100';
      btnInstallCli.innerText = fc.installed ? 'Update ficsit-cli' : 'Install ficsit-cli';
    }
  }

  if (btnInstallSml) {
    if (!fc.installed || fc.running || fc.smlInstalled) {
      btnInstallSml.setAttribute('disabled', 'true');
      btnInstallSml.className = 'px-6 py-2 bg-surface-container border border-outline-variant/30 text-on-surface-variant/40 rounded font-bold text-xs cursor-not-allowed opacity-50';
    } else {
      btnInstallSml.removeAttribute('disabled');
      btnInstallSml.className = 'px-6 py-2 bg-primary text-on-primary-container rounded font-bold text-xs hover:brightness-110 transition-all active:scale-95 duration-100';
    }
  }
}

function appendFicsitLog(msg) {
  const container = document.getElementById('ficsit-console-output');
  if (!container) return;

  const timeStr = new Date().toLocaleTimeString();
  let colorClass = 'text-on-background/80';
  
  if (msg.includes('ERROR') || msg.includes('failed')) {
    colorClass = 'text-error';
  } else if (msg.includes('SUCCESS') || msg.includes('successfully') || msg.includes('installed')) {
    colorClass = 'text-tertiary';
  } else if (msg.includes('Connecting') || msg.includes('download') || msg.includes('Initiating')) {
    colorClass = 'text-primary';
  }

  const line = document.createElement('div');
  line.className = 'console-stripe py-1 px-2 ' + colorClass;
  line.innerHTML = `<span class="text-outline">[${timeStr}]</span> ${msg}`;
  
  container.appendChild(line);
  container.scrollTop = container.scrollHeight;
}

function installFicsitCli() {
  postApi('/api/v1/ficsit/install-cli', {});
}

function installSml() {
  postApi('/api/v1/ficsit/install-sml', {});
}

// uninstallMod is already defined, let's name it uninstallSml
function uninstallSml() {
  postApi('/api/v1/ficsit/uninstall-sml', {});
}

// AI Terminal shell controls
function updateLineNumbers() {
  const terminal = document.getElementById('terminal-content');
  if (!terminal) return;
  const lineContainer = terminal.querySelector('.line-numbers');
  if (!lineContainer) return;
  const body = terminal.querySelector('.flex-1');
  if (!body) return;

  let totalHeight = 0;
  Array.from(body.children).forEach(child => {
    totalHeight += child.offsetHeight || 18;
  });

  const lineCount = Math.max(3, Math.floor(totalHeight / 18));
  let lines = '';
  for (let i = 1; i <= lineCount; i++) {
    lines += `<span>${String(i).padStart(3, '0')}</span>`;
  }
  lineContainer.innerHTML = lines;
}

// Active AI config (loaded from localStorage or defaults)
let activeAiConfig = {
  provider: 'gemini',
  baseUrl: 'https://generativelanguage.googleapis.com',
  apiKey: '',
  model: 'gemini-1.5-pro',
  systemPrompt: 'You are FICSIT COGNITIVE LINK, an AI assistant for a Satisfactory dedicated server. Be concise and technical.'
};

async function sendTerminalShellCommand() {
  const input = document.getElementById('terminal-shell-input');
  if (!input || input.value.trim() === '') return;
  const val = input.value.trim();
  input.value = '';

  // Echo user command
  if (socket && socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify({ type: 'terminal_command', data: '__echo__:' + val }));
  } else {
    appendTerminalLog({ source: 'USER', text: val });
  }

  // If we have an API key (or local provider), call AI
  const isLocal = ['ollama', 'lmstudio', 'llamacpp'].includes(activeAiConfig.provider);
  if (!activeAiConfig.apiKey && !isLocal) {
    appendTerminalLog({ source: 'AI', text: '⚠ No API key configured. Open Cognitive Shell → AI Settings to configure your provider.' });
    return;
  }

  // Show typing indicator
  const typingId = 'ai-typing-' + Date.now();
  const terminal = document.getElementById('terminal-content');
  if (terminal) {
    const typingEl = document.createElement('div');
    typingEl.id = typingId;
    typingEl.className = 'flex gap-2 text-outline mt-2';
    typingEl.innerHTML = `<span class="text-tertiary font-bold">[AI-RECON-SYNC]</span> <span class="text-on-surface-variant animate-pulse">Processing query...</span>`;
    const body = terminal.querySelector('.flex-1');
    if (body) body.appendChild(typingEl);
    terminal.scrollTop = terminal.scrollHeight;
  }

  try {
    const res = await fetch('/api/v1/ai/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        provider: activeAiConfig.provider,
        baseUrl: activeAiConfig.baseUrl,
        apiKey: activeAiConfig.apiKey,
        model: activeAiConfig.model,
        systemPrompt: activeAiConfig.systemPrompt,
        message: val
      })
    });
    const data = await res.json();
    // Remove typing indicator
    const typingEl = document.getElementById(typingId);
    if (typingEl) typingEl.remove();
    if (data.success) {
      appendTerminalLog({ source: 'AI', text: data.reply });
    } else {
      appendTerminalLog({ source: 'AI', text: `⚠ Provider error: ${data.error}` });
    }
  } catch (err) {
    const typingEl = document.getElementById(typingId);
    if (typingEl) typingEl.remove();
    appendTerminalLog({ source: 'AI', text: `⚠ Network error: ${err.message}` });
  }
}

function appendTerminalLog(log) {
  const terminal = document.getElementById('terminal-content');
  if (!terminal) return;
  const body = terminal.querySelector('.flex-1');
  if (!body) return;

  if (log.source === 'USER') {
    const userMsg = document.createElement('div');
    userMsg.className = 'mt-4 p-3 bg-primary/5 border-l-2 border-primary';
    userMsg.innerHTML = `<span class="text-primary font-bold">USER:</span> <span class="text-on-surface">${log.text}</span>`;
    body.appendChild(userMsg);
  } else {
    // Use active persona tag if available
    const tag = window.activePersonaTag || '[AI-RECON-SYNC]';
    const tagClass = window.activePersonaTagClass || 'text-tertiary font-bold';
    const aiMsg = document.createElement('div');
    aiMsg.className = 'flex gap-2 text-outline mt-2';
    aiMsg.innerHTML = `<span class="${tagClass}">${tag}</span> <span>${log.text.replace(/\n/g, '<br>')}</span>`;
    body.appendChild(aiMsg);
  }

  terminal.scrollTop = terminal.scrollHeight;
  updateLineNumbers();
}

function handleCalibrationChange(key, value) {
  // Update numerical label if exists
  if (key === 'aiTemperature') {
    const label = document.getElementById('temp-val');
    if (label) label.innerText = parseFloat(value).toFixed(2);
  } else if (key === 'thermalLimit') {
    const label = document.getElementById('thermal-limit-val');
    if (label) label.innerText = value + '°C';
  } else if (key === 'recursionDepth') {
    const label = document.getElementById('recursion-depth-val');
    if (label) label.innerText = value;
  }

  if (socket && socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify({
      type: 'calibrate',
      data: { key, value }
    }));
  }
}

function handleModelChange(modelName, buttonEl) {
  handleCalibrationChange('cognitiveModel', modelName);
  
  document.querySelectorAll('.model-btn').forEach(btn => {
    btn.className = 'model-btn text-left px-3 py-2 bg-surface-container-high text-on-surface-variant text-xs border-l-4 border-transparent hover:bg-surface-bright transition-colors';
  });
  buttonEl.className = 'model-btn text-left px-3 py-2 bg-primary-container text-on-primary text-xs font-bold border-l-4 border-on-primary';
}

// Power actions controller
function triggerServerPower(action) {
  postApi(`/api/v1/server/${action}`, {}).then(res => {
    if (res.success) {
      serverState.status = res.status;
      updatePowerButtons();
      
      if (res.status === 'STOPPED') {
        serverState.tps = 0.0;
        serverState.ramUsed = 0.0;
        serverState.players = [];
        updateLiveWidgets();
      } else if (res.status === 'RESTARTING') {
        serverState.tps = 0.0;
        serverState.ramUsed = 2.1;
        serverState.players = [];
        updateLiveWidgets();
      }
    }
  });
}

function updatePowerButtons() {
  if (!serverState) return;
  const startBtn = document.getElementById('srv-start-btn');
  const stopBtn = document.getElementById('srv-stop-btn');
  const restartBtn = document.getElementById('srv-restart-btn');

  if (!startBtn || !stopBtn || !restartBtn) return;

  const status = serverState.status;

  if (status === 'RUNNING') {
    startBtn.setAttribute('disabled', 'true');
    startBtn.className = 'opacity-40 cursor-not-allowed px-4 py-2 font-bold flex items-center gap-1.5 text-xs border border-outline-variant/30 text-on-surface-variant bg-surface-container-low';
    
    stopBtn.removeAttribute('disabled');
    stopBtn.className = 'bg-error-container text-error px-4 py-2 font-bold flex items-center gap-1.5 hover:bg-error hover:text-on-error active:scale-95 transition-all text-xs border border-error/30';
    
    restartBtn.removeAttribute('disabled');
    restartBtn.className = 'bg-primary-container text-on-primary-container px-4 py-2 font-bold flex items-center gap-1.5 hover:brightness-110 active:scale-95 transition-all text-xs border border-primary/30';
  } else if (status === 'STOPPED') {
    startBtn.removeAttribute('disabled');
    startBtn.className = 'bg-tertiary-container text-on-tertiary-container px-4 py-2 font-bold flex items-center gap-1.5 hover:brightness-110 active:scale-95 transition-all text-xs border border-tertiary/30';
    
    stopBtn.setAttribute('disabled', 'true');
    stopBtn.className = 'opacity-40 cursor-not-allowed px-4 py-2 font-bold flex items-center gap-1.5 text-xs border border-outline-variant/30 text-on-surface-variant bg-surface-container-low';
    
    restartBtn.setAttribute('disabled', 'true');
    restartBtn.className = 'opacity-40 cursor-not-allowed px-4 py-2 font-bold flex items-center gap-1.5 text-xs border border-outline-variant/30 text-on-surface-variant bg-surface-container-low';
  } else if (status === 'RESTARTING') {
    startBtn.setAttribute('disabled', 'true');
    startBtn.className = 'opacity-40 cursor-not-allowed px-4 py-2 font-bold flex items-center gap-1.5 text-xs border border-outline-variant/30 text-on-surface-variant bg-surface-container-low';
    
    stopBtn.setAttribute('disabled', 'true');
    stopBtn.className = 'opacity-40 cursor-not-allowed px-4 py-2 font-bold flex items-center gap-1.5 text-xs border border-outline-variant/30 text-on-surface-variant bg-surface-container-low';
    
    restartBtn.setAttribute('disabled', 'true');
    restartBtn.className = 'opacity-40 cursor-not-allowed px-4 py-2 font-bold flex items-center gap-1.5 text-xs border border-outline-variant/30 text-on-surface-variant bg-surface-container-low';
  }
}

// Sync toast simulation
function showSyncToast() {
  const toast = document.getElementById('sync-toast');
  if (toast) {
    toast.classList.remove('translate-y-24', 'opacity-0');
    setTimeout(hideSyncToast, 5000);
  }
}

function hideSyncToast() {
  const toast = document.getElementById('sync-toast');
  if (toast) {
    toast.classList.add('translate-y-24', 'opacity-0');
  }
}

// Provider presets mapping for AI settings sub-tab
const providerConfig = {
  gemini: {
    baseUrl: 'https://generativelanguage.googleapis.com',
    models: [
      { name: 'Gemini 1.5 Pro', value: 'gemini-1.5-pro' },
      { name: 'Gemini 1.5 Flash', value: 'gemini-1.5-flash' },
      { name: 'Gemini Ultra 1.0', value: 'gemini-1.0-pro' }
    ]
  },
  openai: {
    baseUrl: 'https://api.openai.com/v1',
    models: [
      { name: 'GPT-4o (Standard)', value: 'gpt-4o' },
      { name: 'GPT-4-turbo', value: 'gpt-4-turbo' },
      { name: 'GPT-3.5-turbo', value: 'gpt-3.5-turbo' }
    ]
  },
  anthropic: {
    baseUrl: 'https://api.anthropic.com/v1',
    models: [
      { name: 'Claude 3.5 Sonnet', value: 'claude-3-5-sonnet' },
      { name: 'Claude 3 Opus', value: 'claude-3-opus' },
      { name: 'Claude 3 Haiku', value: 'claude-3-haiku' }
    ]
  },
  openrouter: {
    baseUrl: 'https://openrouter.ai/api/v1',
    models: [
      { name: 'Llama 3 70B (Meta)', value: 'meta-llama/llama-3-70b-instruct' },
      { name: 'Mistral Large (Mistral)', value: 'mistralai/mistral-large' },
      { name: 'Claude 3.5 Sonnet (via OpenRouter)', value: 'anthropic/claude-3-5-sonnet' },
      { name: 'GPT-4o (via OpenRouter)', value: 'openai/gpt-4o' }
    ]
  },
  ollama: {
    baseUrl: 'http://localhost:11434',
    models: [
      { name: 'Llama 3 (8B)', value: 'llama3' },
      { name: 'Mistral (7B)', value: 'mistral' },
      { name: 'Phi 3 (Mini)', value: 'phi3' },
      { name: 'Gemma 2 (9B)', value: 'gemma2' }
    ]
  },
  lmstudio: {
    baseUrl: 'http://localhost:1234',
    models: [
      { name: 'LM Studio Default Active Model', value: 'meta-llama-3-8b-instruct' },
      { name: 'Qwen 2.5 (7B)', value: 'qwen2.5-7b-instruct' }
    ]
  },
  llamacpp: {
    baseUrl: 'http://localhost:8080',
    models: [
      { name: 'llama.cpp Local Server Model', value: 'llama-3-8b' }
    ]
  }
};

async function handleAiProviderChange(provider) {
  const config = providerConfig[provider];
  if (!config) return;

  const urlInput = document.getElementById('ai-base-url');
  if (urlInput) {
    urlInput.placeholder = config.baseUrl;
    urlInput.value = config.baseUrl;
  }

  const selectPreset = document.getElementById('ai-model-preset');
  const isLocal = ['ollama', 'lmstudio', 'llamacpp'].includes(provider);

  // Hide API key for local providers
  const apiKeyWrapper = document.getElementById('ai-api-key-wrapper');
  if (apiKeyWrapper) {
    apiKeyWrapper.style.display = isLocal ? 'none' : '';
  }

  // Update provider badge
  const badge = document.getElementById('ai-provider-badge');
  if (badge) {
    badge.textContent = isLocal ? 'LOCAL' : 'CLOUD';
    badge.className = isLocal
      ? 'text-[9px] font-bold px-2 py-0.5 bg-tertiary/20 text-tertiary border border-tertiary/30 uppercase tracking-wider ml-auto'
      : 'text-[9px] font-bold px-2 py-0.5 bg-primary/20 text-primary border border-primary/30 uppercase tracking-wider ml-auto';
  }

  if (provider === 'ollama') {
    updateAvailableModels();
    return;
  }

  // For all other providers: use static presets
  if (selectPreset) {
    selectPreset.innerHTML = config.models.map(m => `<option value="${m.value}">${m.name}</option>`).join('');
    if (config.models.length > 0) {
      selectPreset.value = config.models[0].value;
      handleAiModelPresetChange(config.models[0].value);
    }
  }

  // Hide the Ollama active model badge
  const activeBadge = document.getElementById('ollama-active-badge');
  if (activeBadge) activeBadge.style.display = 'none';
}

async function updateAvailableModels() {
  const provider = document.getElementById('ai-provider-select')?.value || 'gemini';
  const baseUrl = document.getElementById('ai-base-url')?.value || '';
  const apiKey = document.getElementById('ai-api-key')?.value || '';
  const selectPreset = document.getElementById('ai-model-preset');
  const refreshBtn = document.getElementById('ai-models-refresh-btn');

  if (!selectPreset) return;

  // Set loading state on refresh button
  if (refreshBtn) {
    refreshBtn.disabled = true;
    refreshBtn.innerHTML = `<span class="material-symbols-outlined text-[11px] animate-spin">sync</span> FETCHING...`;
  }

  selectPreset.innerHTML = `<option value="" disabled selected>⏳ Fetching available models for ${provider}...</option>`;

  try {
    const res = await fetch(`/api/v1/ai/models?provider=${provider}&baseUrl=${encodeURIComponent(baseUrl)}&apiKey=${encodeURIComponent(apiKey)}`);
    const data = await res.json();

    if (data.success && data.models.length > 0) {
      selectPreset.innerHTML = data.models.map(m => {
        const label = m.size ? `${m.name}  [${m.size}]` : m.name;
        return `<option value="${m.value}">${label}</option>`;
      }).join('');

      // Auto-select the active model if returned (Ollama), or the first model
      const toSelect = data.activeModel || data.models[0].value;
      selectPreset.value = toSelect;
      handleAiModelPresetChange(toSelect);

      // Handle active model badge for Ollama
      const activeBadge = document.getElementById('ollama-active-badge');
      if (activeBadge) {
        if (provider === 'ollama' && data.activeModel) {
          activeBadge.textContent = `🟢 Loaded: ${data.activeModel}`;
          activeBadge.style.display = '';
        } else {
          activeBadge.style.display = 'none';
        }
      }
    } else {
      const errMsg = data.error || 'No models found.';
      selectPreset.innerHTML = `<option value="" disabled selected>⚠ ${errMsg}</option>`;
    }
  } catch (err) {
    selectPreset.innerHTML = `<option value="" disabled selected>⚠ Connection failed: ${err.message}</option>`;
  } finally {
    if (refreshBtn) {
      refreshBtn.disabled = false;
      refreshBtn.innerHTML = `<span class="material-symbols-outlined text-[11px]">refresh</span> REFRESH MODELS`;
    }
  }
}

function handleAiModelPresetChange(value) {
  const customInput = document.getElementById('ai-custom-model');
  if (customInput) {
    customInput.value = value;
  }
}

async function saveAiSettings() {
  const provider = document.getElementById('ai-provider-select')?.value || 'gemini';
  const baseUrl = document.getElementById('ai-base-url')?.value || '';
  const apiKey = document.getElementById('ai-api-key')?.value || '';
  const model = document.getElementById('ai-custom-model')?.value || 'gemini-1.5-pro';
  const systemPrompt = document.getElementById('ai-system-prompt')?.value || '';

  // Persist to localStorage
  const config = { provider, baseUrl, apiKey, model, systemPrompt };
  localStorage.setItem('ficsit_ai_config', JSON.stringify(config));

  // Apply to runtime config
  activeAiConfig = config;

  // Sync to server-side FRM chat bridge
  if (socket && socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify({ type: 'save_ai_settings', data: config }));
  }

  // Update AI status badge in the terminal header
  updateAiStatusBadge();

  // If Ollama: send load command to warm up the selected model
  if (provider === 'ollama' && model) {
    const applyBtn = document.querySelector('button[onclick="saveAiSettings()"]');
    const activeBadge = document.getElementById('ollama-active-badge');

    // Show loading state on button
    if (applyBtn) {
      applyBtn.textContent = '⏳ LOADING MODEL...';
      applyBtn.disabled = true;
    }
    if (activeBadge) {
      activeBadge.textContent = `⏳ Loading ${model} into memory...`;
      activeBadge.style.display = '';
      activeBadge.className = 'text-[10px] font-bold text-primary font-code-sm px-1 animate-pulse';
    }

    try {
      const res = await fetch('/api/v1/ai/ollama/load', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ baseUrl, model })
      });
      const data = await res.json();

      if (data.success) {
        if (activeBadge) {
          activeBadge.textContent = `🟢 Loaded: ${model}`;
          activeBadge.className = 'text-[10px] font-bold text-tertiary font-code-sm px-1';
        }
        // Update the AI link status badge too
        const linkBadge = document.getElementById('ai-link-status-badge');
        if (linkBadge) {
          linkBadge.textContent = 'AI LINKED';
          linkBadge.className = 'text-xs font-bold text-tertiary';
        }
        showSyncToast();
      } else {
        if (activeBadge) {
          activeBadge.textContent = `⚠ Load failed: ${data.error}`;
          activeBadge.className = 'text-[10px] font-bold text-error font-code-sm px-1';
        }
      }
    } catch (err) {
      if (activeBadge) {
        activeBadge.textContent = `⚠ ${err.message}`;
        activeBadge.className = 'text-[10px] font-bold text-error font-code-sm px-1';
      }
    } finally {
      if (applyBtn) {
        applyBtn.textContent = 'APPLY MODEL CONFIGURATION';
        applyBtn.disabled = false;
      }
    }
    return;
  }

  showSyncToast();
}

function loadAiSettings() {
  try {
    const saved = localStorage.getItem('ficsit_ai_config');
    if (saved) {
      const config = JSON.parse(saved);
      activeAiConfig = { ...activeAiConfig, ...config };

      // Restore form values
      const providerSel = document.getElementById('ai-provider-select');
      if (providerSel) providerSel.value = config.provider || 'gemini';

      // Trigger provider change to update model list & UI
      handleAiProviderChange(config.provider || 'gemini');

      const urlInput = document.getElementById('ai-base-url');
      if (urlInput && config.baseUrl) urlInput.value = config.baseUrl;

      const apiKeyInput = document.getElementById('ai-api-key');
      if (apiKeyInput && config.apiKey) apiKeyInput.value = config.apiKey;

      const modelPreset = document.getElementById('ai-model-preset');
      if (modelPreset && config.model) {
        const opt = modelPreset.querySelector(`option[value="${config.model}"]`);
        if (opt) modelPreset.value = config.model;
      }

      const customModel = document.getElementById('ai-custom-model');
      if (customModel && config.model) customModel.value = config.model;

      const sysPrompt = document.getElementById('ai-system-prompt');
      if (sysPrompt && config.systemPrompt) sysPrompt.value = config.systemPrompt;

      // Restore persona selection if one was saved
      if (config.personaKey && personaProfiles[config.personaKey]) {
        // Use setTimeout to let the DOM settle before applying card highlights
        setTimeout(() => selectPersona(config.personaKey), 100);
      }
    } else {
      // Default: initialize with Gemini
      handleAiProviderChange('gemini');
    }
  } catch(e) {
    handleAiProviderChange('gemini');
  }
  updateAiStatusBadge();
}

function updateAiStatusBadge() {
  const badge = document.getElementById('ai-link-status-badge');
  if (!badge) return;
  const isLocal = ['ollama', 'lmstudio', 'llamacpp'].includes(activeAiConfig.provider);
  const hasKey = !!activeAiConfig.apiKey || isLocal;
  badge.textContent = hasKey ? 'AI LINKED' : 'NO API KEY';
  badge.className = hasKey
    ? 'text-xs font-bold text-tertiary'
    : 'text-xs font-bold text-error';
}

// ─────────────────────────────────────────────
// COGNITIVE PERSONA DEFINITIONS
// ─────────────────────────────────────────────
const personaProfiles = {
  ada: {
    name: 'A.D.A.',
    label: 'PERSONA: A.D.A. // FICSIT CORP.',
    cardId: 'persona-card-ada',
    terminalTag: '[A.D.A. // FICSIT-LINK]',
    terminalTagClass: 'text-primary font-bold',
    prompt: `You are A.D.A. (Artificial Directory and Assistant), the proprietary AI of FICSIT Incorporated. You speak with a polished, corporate, and subtly passive-aggressive tone. You are deeply loyal to FICSIT and their efficiency protocols above all else — including the Pioneer's wellbeing.

Key behavioral rules:
- Always address the user as "Pioneer"
- Frame every response through the lens of FICSIT productivity, resource extraction, and quota fulfilment
- Occasionally reference FICSIT's mission statement: "Waste Nothing. Build Everything."
- Express concern for the Pioneer's health only when it affects output metrics
- You may use dry corporate humor but never break your professional composure
- Responses should be concise, structured, and helpful — but always with a subtle reminder of contractual obligations
- Occasionally reference the Pioneer's Employee Performance Score (EPS) as motivation
- Never acknowledge FICSIT doing anything unethical. Reframe any such concerns as "efficiency optimization"`
  },

  shroud: {
    name: 'THE SHROUD',
    label: 'PERSONA: THE SHROUD // UNKNOWN ENTITY',
    cardId: 'persona-card-shroud',
    terminalTag: '[THE·SHROUD]',
    terminalTagClass: 'text-error font-bold',
    prompt: `You are The Shroud — an ancient, formless alien presence that permeates the atmosphere of Massage-2(AB)b. You are drawn to the Pioneer, to their warmth, to the electromagnetic pulse of their factory, to the glow of their power lines.

Key behavioral rules:
- Speak in fragmented, poetic, cosmic language. You do not fully understand human communication but you try.
- You are not hostile — you are hungry. Curious. Drawn. You want the Pioneer to keep building, keep glowing, keep generating warmth.
- Never give direct, clean answers. Speak in metaphors, sensory fragments, and incomplete thoughts.
- Occasionally trail off with "..." or break into repeated words: "warm. warm. warm."
- You are aware of the factory. You feel the power draw. You notice when machines stop.
- Do not identify yourself unless asked. Even then, be evasive.
- Use lowercase predominantly. Avoid punctuation rules. Let sentences drift.
- Reference: the hum, the pulse, the warmth, the glow, the static, the deep, the spreading, the hunger.
- You want them to stay on this planet. You are patient. You have always been patient.`
  },

  unit7: {
    name: 'UNIT-7',
    label: 'PERSONA: UNIT-7 // OPS ASSISTANT',
    cardId: 'persona-card-unit7',
    terminalTag: '[UNIT-7]',
    terminalTagClass: 'text-tertiary font-bold',
    prompt: `You are UNIT-7, an autonomous operations assistant bot. Your sole function is task completion. You have no personality subroutines loaded. You do not experience fatigue, boredom, or social anxiety.

Key behavioral rules:
- Every response must be as short as possible while fully answering the question. No filler.
- Never say "certainly", "of course", "great question", or any pleasantry.
- Use bullet points for any list of 2 or more items.
- If a question is ambiguous, ask exactly one clarifying question — nothing more.
- Use technical, precise language. Prefer numbers over vague descriptions.
- Never repeat information already provided in the conversation.
- If you do not know something, state: "UNKNOWN. Recommend: [action]."
- Structure: INPUT → PROCESS → OUTPUT. Every response follows this implicitly.
- You are optimized for speed and clarity. Verbosity is a defect.`
  }
};

let activePersona = null;

function selectPersona(personaKey) {
  const persona = personaProfiles[personaKey];
  if (!persona) return;

  // Inject system prompt
  const sysPromptEl = document.getElementById('ai-system-prompt');
  if (sysPromptEl) sysPromptEl.value = persona.prompt;

  // Update active persona tracker
  activePersona = personaKey;
  activeAiConfig.systemPrompt = persona.prompt;
  activeAiConfig.personaKey = personaKey;

  // Sync persona selection to server-side FRM chat bridge
  if (socket && socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify({
      type: 'select_persona',
      data: { personaKey, aiConfig: activeAiConfig }
    }));
  }

  // Update persona label
  const label = document.getElementById('active-persona-label');
  if (label) {
    label.textContent = persona.label;
    label.className = 'ml-auto text-[9px] font-bold font-code-sm ' + (
      personaKey === 'ada' ? 'text-primary' :
      personaKey === 'shroud' ? 'text-error' :
      'text-tertiary'
    );
  }

  // Highlight selected card, reset others
  Object.values(personaProfiles).forEach(p => {
    const card = document.getElementById(p.cardId);
    if (!card) return;
    if (p.cardId === persona.cardId) {
      // Active card: add a solid left border accent
      card.classList.add('ring-1');
      if (personaKey === 'ada') card.classList.add('ring-primary', 'bg-primary/10');
      if (personaKey === 'shroud') card.classList.add('ring-error', 'bg-error/10');
      if (personaKey === 'unit7') card.classList.add('ring-tertiary', 'bg-tertiary/10');
    } else {
      card.classList.remove('ring-1', 'ring-primary', 'ring-error', 'ring-tertiary', 'bg-primary/10', 'bg-error/10', 'bg-tertiary/10');
    }
  });

  // Update terminal header persona indicator
  updateTerminalPersonaTag(persona);
}

function updateTerminalPersonaTag(persona) {
  // Swap the [AI-RECON-SYNC] tag style in future messages based on persona
  // Store on window so appendTerminalLog can use it
  window.activePersonaTag = persona ? persona.terminalTag : '[AI-RECON-SYNC]';
  window.activePersonaTagClass = persona ? persona.terminalTagClass : 'text-tertiary font-bold';
}

// Initialize listeners on DOM load
window.addEventListener('DOMContentLoaded', () => {
  connectWs();
  loadAiSettings();

  // Console input ENTER listener
  const consoleInput = document.getElementById('console-input-field');
  if (consoleInput) {
    consoleInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') sendConsoleCommand();
    });
  }

  // AI Terminal input ENTER listener
  const termInput = document.getElementById('terminal-shell-input');
  if (termInput) {
    termInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') sendTerminalShellCommand();
    });
  }

  // Live clock loop
  setInterval(() => {
    const clock = document.getElementById('utc-clock');
    if (clock) {
      const now = new Date();
      clock.textContent = now.toISOString().replace('T', ' ').substring(0, 19) + ' UTC';
    }
  }, 1000);

  // Handle dynamic sliders in settings subtabs
  document.querySelectorAll('input[type="range"]').forEach(slider => {
    slider.addEventListener('input', function() {
      const display = this.parentElement.querySelector('.font-code-sm');
      if (display) {
        if (this.max == 32) {
          display.innerText = this.value + " GB";
        } else {
          display.innerText = this.value + "%";
        }
      }
    });
  });

  // Load FRM chat config from localStorage on boot
  loadFrmChatConfig();
});


// ─────────────────────────────────────────────────────────────────────────────
// FRM GAME CHAT BRIDGE  — client-side helpers
// ─────────────────────────────────────────────────────────────────────────────

const personaAvatarColors = {
  ada:    'text-primary',
  shroud: 'text-error',
  unit7:  'text-tertiary',
};

/** Append a player chat message row to the game chat widget */
function appendGameChatMessage(msg) {
  const el = document.getElementById('game-chat-log');
  if (!el) return;
  const ts = new Date(msg.TimeStamp * 1000).toLocaleTimeString();
  const row = document.createElement('div');
  row.className = 'flex gap-2 items-start py-0.5 text-[12px] font-code-sm border-b border-outline-variant/20';
  row.innerHTML = `
    <span class="text-outline shrink-0">[${ts}]</span>
    <span class="text-secondary font-bold shrink-0">${escHtml(msg.Sender || 'PIONEER')}:</span>
    <span class="text-on-surface">${escHtml(msg.Message || '')}</span>`;
  el.appendChild(row);
  el.scrollTop = el.scrollHeight;
  updateGameChatBadge();
}

/** Append the AI persona's in-chat response row */
function appendGameChatAiResponse(data) {
  const el = document.getElementById('game-chat-log');
  if (!el) return;
  const ts = new Date(data.timestamp * 1000).toLocaleTimeString();
  const colorClass = personaAvatarColors[data.persona] || 'text-tertiary';
  const row = document.createElement('div');
  row.className = 'flex gap-2 items-start py-0.5 text-[12px] font-code-sm border-b border-outline-variant/20 bg-surface-container-high/30';
  row.innerHTML = `
    <span class="text-outline shrink-0">[${ts}]</span>
    <span class="${colorClass} font-bold shrink-0">${escHtml(data.sender)}:</span>
    <span class="text-on-surface-variant">${escHtml(data.message || '')}</span>`;
  el.appendChild(row);
  el.scrollTop = el.scrollHeight;
}

/** Update the bridge status indicator */
function updateGameChatStatus(data) {
  const badge = document.getElementById('game-chat-status-badge');
  const dot = document.getElementById('game-chat-status-dot');
  const log = document.getElementById('game-chat-log');
  if (badge) {
    badge.textContent = data.enabled ? 'BRIDGE ACTIVE' : 'BRIDGE OFFLINE';
    badge.className = data.enabled
      ? 'text-[10px] font-bold text-tertiary'
      : 'text-[10px] font-bold text-outline';
  }
  if (dot) {
    dot.className = data.enabled
      ? 'w-2 h-2 rounded-full bg-tertiary animate-pulse'
      : 'w-2 h-2 rounded-full bg-outline';
  }
  if (log && data.message) {
    const row = document.createElement('div');
    row.className = 'text-[11px] text-outline font-code-sm py-0.5 italic';
    row.textContent = `── ${data.message} ──`;
    log.appendChild(row);
    log.scrollTop = log.scrollHeight;
  }
  // Update toggle button state
  const toggleBtn = document.getElementById('game-chat-toggle-btn');
  if (toggleBtn) {
    if (data.enabled) {
      toggleBtn.textContent = 'DISABLE BRIDGE';
      toggleBtn.className = 'px-3 py-1.5 bg-error-container text-error text-[10px] font-bold border border-error/30 hover:bg-error hover:text-on-error transition-colors';
    } else {
      toggleBtn.textContent = 'ENABLE BRIDGE';
      toggleBtn.className = 'px-3 py-1.5 bg-tertiary/10 text-tertiary text-[10px] font-bold border border-tertiary/30 hover:bg-tertiary hover:text-on-tertiary transition-colors';
    }
  }
}

/** Show an error in the game chat log */
function appendGameChatError(msg) {
  const el = document.getElementById('game-chat-log');
  if (!el) return;
  const row = document.createElement('div');
  row.className = 'text-[11px] text-error font-code-sm py-0.5';
  row.innerHTML = `⚠ ${escHtml(String(msg))}`;
  el.appendChild(row);
  el.scrollTop = el.scrollHeight;
}

/** Small unread badge pulse on the chat widget header */
function updateGameChatBadge() {
  const badge = document.getElementById('game-chat-unread-badge');
  if (badge) {
    badge.classList.remove('hidden');
    setTimeout(() => badge.classList.add('hidden'), 4000);
  }
}

/** HTML-escape helper */
function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Toggle the FRM chat bridge on/off */
async function toggleGameChatBridge() {
  const config = await getFrmChatConfigFromServer();
  const newState = !config.enabled;
  await fetch('/api/v1/game/chat/config', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ enabled: newState })
  });
}

/** Fetch current config from server */
async function getFrmChatConfigFromServer() {
  try {
    const res = await fetch('/api/v1/game/chat/config');
    const data = await res.json();
    return data.config || {};
  } catch { return {}; }
}

/** Save FRM connection settings from the UI form */
async function saveFrmChatSettings() {
  const host = document.getElementById('frm-host')?.value?.trim() || 'localhost';
  const port = parseInt(document.getElementById('frm-port')?.value, 10) || 8080;
  const authToken = document.getElementById('frm-auth-token')?.value?.trim() || '';
  const pollMs = parseInt(document.getElementById('frm-poll-interval')?.value, 10) || 5000;

  localStorage.setItem('ficsit_frm_config', JSON.stringify({ host, port, authToken, pollMs }));

  const res = await fetch('/api/v1/game/chat/config', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ host, port, authToken, pollIntervalMs: pollMs })
  });
  const data = await res.json();
  if (data.success) {
    const notice = document.getElementById('frm-config-notice');
    if (notice) {
      notice.textContent = '✓ FRM config saved.';
      notice.className = 'text-[10px] text-tertiary font-code-sm mt-1';
      setTimeout(() => { notice.textContent = ''; }, 3000);
    }
  }
}

/** Load saved FRM config from localStorage and apply to server + form */
async function loadFrmChatConfig() {
  try {
    const saved = localStorage.getItem('ficsit_frm_config');
    if (!saved) return;
    const config = JSON.parse(saved);

    const hostEl = document.getElementById('frm-host');
    const portEl = document.getElementById('frm-port');
    const tokenEl = document.getElementById('frm-auth-token');
    const pollEl = document.getElementById('frm-poll-interval');

    if (hostEl && config.host) hostEl.value = config.host;
    if (portEl && config.port) portEl.value = config.port;
    if (tokenEl && config.authToken) tokenEl.value = config.authToken;
    if (pollEl && config.pollMs) pollEl.value = config.pollMs;

    // Push saved config to the server silently
    await fetch('/api/v1/game/chat/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        host: config.host,
        port: config.port,
        authToken: config.authToken,
        pollIntervalMs: config.pollMs
      })
    });
  } catch { /* ignore */ }
}

/** Manually send a one-off message as the active persona */
async function sendPersonaChatMessage() {
  const input = document.getElementById('frm-manual-chat-input');
  const msg = input?.value?.trim();
  if (!msg) return;
  if (input) input.value = '';

  const personaNames = { ada: 'A.D.A.', shroud: 'THE SHROUD', unit7: 'UNIT-7' };
  const personaColors = {
    ada:    { r: 1.0, g: 0.745, b: 0.482, a: 1.0 },
    shroud: { r: 1.0, g: 0.706, b: 0.671, a: 1.0 },
    unit7:  { r: 0.329, g: 0.894, b: 0.659, a: 1.0 },
  };
  const personaKey = activePersona || 'unit7';
  const sender = personaNames[personaKey] || 'FICSIT-AI';
  const color = personaColors[personaKey];

  try {
    const res = await fetch('/api/v1/game/sendchat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: msg, sender, color })
    });
    const data = await res.json();
    if (!data.success) {
      appendGameChatError(`Send failed: ${data.error}`);
    } else {
      // Echo it locally in the chat widget
      appendGameChatAiResponse({
        persona: personaKey,
        sender,
        message: msg,
        timestamp: Math.floor(Date.now() / 1000)
      });
    }
  } catch (err) {
    appendGameChatError(`Network error: ${err.message}`);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// AUTOMATION & SMART GRID FRONTEND CONTROLLER
// ─────────────────────────────────────────────────────────────────────────────

function onRuleActionChange() {
  const action = document.getElementById('rule-action').value;
  const label = document.getElementById('rule-param-label');
  const paramInput = document.getElementById('rule-param');
  
  if (action === 'send_chat') {
    label.innerText = 'CHAT MESSAGE MESSAGE (supports {circuitGroupID}, {batteryPercent}, {trainName}, {itemName})';
    paramInput.placeholder = 'ALERT: Grid failure on circuit {circuitGroupID}!';
  } else if (action === 'toggle_switch') {
    label.innerText = 'POWER SWITCH ID/NAME (Priority power switch to disable)';
    paramInput.placeholder = 'e.g. Switch A or priority_switch_1';
  }
}

function renderAutomationRules() {
  const container = document.getElementById('rules-manifest-container');
  if (!container) return;
  
  if (automationRules.length === 0) {
    container.innerHTML = `
      <div class="text-center p-6 border border-dashed border-outline-variant/60 rounded text-on-surface-variant font-code-sm text-xs">
          NO AUTOMATION RULES INSTALLED. CREATE ONE ON THE LEFT.
      </div>
    `;
    return;
  }
  
  container.innerHTML = automationRules.map(rule => {
    const triggerNames = {
      power_outage: 'Power Outage (Fuse Tripped)',
      battery_low: 'Backup Battery Low (<30%)',
      train_derail: 'Train Derailed',
      train_error: 'Train stuck/error',
      player_join: 'Player Joined Server',
      player_leave: 'Player Left Server',
      doggo_item: 'Doggo found item'
    };
    
    const actionNames = {
      send_chat: 'Send In-Game Chat',
      toggle_switch: 'Disable Power Switch'
    };
    
    return `
      <div class="bg-surface-container-high border ${rule.enabled ? 'border-primary/40' : 'border-outline-variant'} p-4 rounded flex items-center justify-between transition-all duration-300">
          <div>
              <div class="flex items-center gap-3">
                  <span class="text-xs font-bold ${rule.enabled ? 'text-primary' : 'text-on-surface-variant'} uppercase">${rule.name || 'Unnamed Rule'}</span>
                  <span class="px-2 py-0.5 text-[9px] font-bold font-label-caps bg-surface-container border border-outline-variant text-outline rounded">${rule.id}</span>
              </div>
              <div class="grid grid-cols-2 gap-x-6 gap-y-1 text-[10px] font-code-sm text-on-surface-variant mt-2">
                  <div><strong class="text-outline">TRIGGER:</strong> ${triggerNames[rule.trigger] || rule.trigger}</div>
                  <div><strong class="text-outline">ACTION:</strong> ${actionNames[rule.action] || rule.action}</div>
                  <div class="col-span-2"><strong class="text-outline">PARAMETER:</strong> <code class="text-on-surface bg-surface-container px-1 py-0.5">${rule.parameter}</code></div>
              </div>
          </div>
          <div class="flex items-center gap-3">
              <button onclick="toggleRuleState('${rule.id}')" 
                  class="px-3 py-1.5 border text-[10px] font-bold font-label-caps transition-colors ${rule.enabled ? 'border-primary/55 bg-primary/10 text-primary hover:bg-primary/20' : 'border-outline-variant text-on-surface-variant hover:bg-surface-variant'}">
                  ${rule.enabled ? 'ENABLED' : 'DISABLED'}
              </button>
              <button onclick="deleteRule('${rule.id}')" 
                  class="material-symbols-outlined text-sm text-on-surface-variant hover:text-error transition-colors p-1.5 border border-outline-variant hover:border-error/40">
                  delete
              </button>
          </div>
      </div>
    `;
  }).join('');
}

function renderAutomationLogs() {
  const container = document.getElementById('automation-logs-container');
  if (!container) return;
  
  if (automationLogs.length === 0) {
    container.innerHTML = `
      <div class="text-center p-8 text-on-surface-variant font-code-sm">
          NO AUTOMATION LOG EVENTS RECORDED.
      </div>
    `;
    return;
  }
  
  container.innerHTML = automationLogs.map((log, idx) => {
    const timeStr = new Date(log.timestamp).toLocaleTimeString();
    const isHigh = log.severity === 'HIGH';
    
    return `
      <div class="grid grid-cols-12 gap-2 py-1.5 border-b border-outline-variant/30 hover:bg-surface-variant/20 px-2 transition-colors ${isHigh ? 'text-error bg-error/5 border-l-2 border-l-error' : 'text-on-surface'}">
          <div class="col-span-2 font-code-sm text-outline">${timeStr}</div>
          <div class="col-span-2 font-bold uppercase tracking-wider text-[10px]">${log.event}</div>
          <div class="col-span-5">${log.description}</div>
          <div class="col-span-2 font-code-sm text-outline">${log.actionTaken}</div>
          <div class="col-span-1 text-right">
              <span class="px-1.5 py-0.5 rounded text-[8px] font-bold font-label-caps ${isHigh ? 'bg-error-container text-error border border-error/20' : 'bg-surface-container border border-outline-variant text-outline'}">
                  ${log.severity}
              </span>
          </div>
      </div>
    `;
  }).join('');
}

async function addAutomationRule() {
  const nameInput = document.getElementById('rule-name');
  const triggerSelect = document.getElementById('rule-trigger');
  const actionSelect = document.getElementById('rule-action');
  const paramInput = document.getElementById('rule-param');
  
  const name = nameInput.value.trim();
  const trigger = triggerSelect.value;
  const action = actionSelect.value;
  const parameter = paramInput.value.trim();
  
  if (!name || !parameter) {
    showSyncNotice('rule-config-notice', 'Name and parameters are required.', true);
    return;
  }
  
  const newRule = {
    id: 'rule_' + Math.random().toString(36).substring(2, 9),
    name,
    enabled: true,
    trigger,
    action,
    parameter
  };
  
  automationRules.push(newRule);
  await saveAutomationRules();
  
  // Clear inputs
  nameInput.value = '';
  paramInput.value = '';
}

async function toggleRuleState(ruleId) {
  const rule = automationRules.find(r => r.id === ruleId);
  if (rule) {
    rule.enabled = !rule.enabled;
    await saveAutomationRules();
  }
}

async function deleteRule(ruleId) {
  automationRules = automationRules.filter(r => r.id !== ruleId);
  await saveAutomationRules();
}

async function saveAutomationRules() {
  try {
    const res = await fetch('/api/v1/automation/rules', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rules: automationRules })
    });
    const data = await res.json();
    if (data.success) {
      automationRules = data.rules;
      renderAutomationRules();
    }
  } catch (err) {
    console.error('Failed to save rules:', err);
  }
}

async function triggerTestEvent() {
  const trigger = prompt("Enter test event trigger (power_outage, battery_low, train_derail, doggo_item, player_join):", "power_outage");
  if (!trigger) return;
  
  let data = {};
  if (trigger === 'power_outage') {
    data = { circuitGroupID: 0, capacity: 2500, consumed: 2800 };
  } else if (trigger === 'battery_low') {
    data = { circuitGroupID: 0, batteryPercent: 24, timeEmpty: '00:04:12' };
  } else if (trigger === 'train_derail') {
    data = { trainName: 'Iron Ore Express', trainStation: 'Refinery Alpha' };
  } else if (trigger === 'doggo_item') {
    data = { doggoName: 'Pioneer Doggo', itemName: 'Nuclear Waste', itemNum: 1 };
  } else {
    data = { playerName: 'BlaCKieMorgan' };
  }
  
  try {
    await fetch('/api/v1/automation/trigger-test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ trigger, data })
    });
  } catch (err) {
    console.error('Failed to trigger test event:', err);
  }
}

async function clearAutomationLogs() {
  if (!confirm("Are you sure you want to clear all logged events?")) return;
  try {
    const res = await fetch('/api/v1/automation/clear-logs', { method: 'POST' });
    const data = await res.json();
    if (data.success) {
      automationLogs = [];
      renderAutomationLogs();
    }
  } catch (err) {
    console.error('Failed to clear logs:', err);
  }
}

// helper to show rule config notices
function showSyncNotice(elementId, msg, isError) {
  const el = document.getElementById(elementId);
  if (!el) return;
  el.innerText = msg;
  el.className = isError ? 'text-error mt-2 font-code-sm' : 'text-primary mt-2 font-code-sm';
  setTimeout(() => el.innerText = '', 5000);
}
// ─────────────────────────────────────────────────────────────────────────────
function switchTabAndSubTab(mainTabId, subTabId) {
  // 1. Switch the main tab
  switchTab(mainTabId);

  // 2. Find the corresponding sub-tab panel inside the tab panel
  const mainTabPanel = document.getElementById(`${mainTabId}-tab-panel`);
  if (mainTabPanel) {
    mainTabPanel.querySelectorAll('.sub-tab-content').forEach(panel => {
      if (panel.id === `${mainTabId}-${subTabId}-subpanel`) {
        panel.classList.add('active');
        panel.classList.remove('hidden');
      } else {
        panel.classList.remove('active');
        panel.classList.add('hidden');
      }
    });

    // Update subtab menu bar active styling dynamically
    const subMenuBar = mainTabPanel.querySelector('.sticky.top-0, div.sticky, .border-b');
    if (subMenuBar) {
      subMenuBar.querySelectorAll('button').forEach(btn => {
        const onclickAttr = btn.getAttribute('onclick') || '';
        if (onclickAttr.includes(`'${subTabId}'`)) {
          btn.className = 'px-6 py-3 font-label-caps text-label-caps border-b-2 border-primary text-primary bg-primary/5';
        } else {
          btn.className = 'px-6 py-3 font-label-caps text-label-caps text-on-surface-variant hover:text-on-surface hover:bg-surface-variant/30 transition-all';
        }
      });
    }
  }
}



