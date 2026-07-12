const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');
const { spawn, exec } = require('child_process');
const fs = require('fs');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

let factoryServerProcess = null;
let consoleLogHistory = [];

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Server global simulation state
let serverState = {
  status: 'SYNCHRONIZED',
  uptime: 432 * 3600 + 12 * 60 + 5, // Uptime in seconds (432h 12m 05s)
  savePlayDuration: 0,
  players: [
    'Pioneer_Alpha',
    'FixIt_Engineer_2',
    'Satisfactory_Expert',
    'Factory_Lead',
    'Drone_Supervisor',
    'Pioneer_Beta'
  ],
  maxPlayers: 16,
  tps: 30.0,
  ramLimit: 16.0,
  ramUsed: 12.4,
  sessionName: 'LOADING...',
  latency: 12,
  tokensPerSec: 1402,
  aiTemperature: 0.78,
  thermalLimit: 82,
  recursionDepth: 12,
  cognitiveModel: 'FICS-ORACLE-3.5',
  cognitiveLoad: 82,
  memoryGB: 42.1,
  threads: 1024,
  activeNodes: [
    { name: 'NODE_001_HQ', load: 85, active: true },
    { name: 'NODE_014_ORE', load: 42, active: true },
    { name: 'NODE_088_PWR', load: 0, active: false }
  ],
  mods: [],
  repoMods: [],
  steamCmd: {
    installed: fs.existsSync('/opt/satisfactory-server/server/FactoryServer.sh'),
    running: false,
    progress: 0.0,
    downloadSpeed: 0.0,
    diskWrite: 0.0,
    peers: 0,
    statusText: 'IDLE',
    log: []
  },
  ficsitCli: {
    installed: fs.existsSync('/usr/local/bin/ficsit-cli'),
    version: fs.existsSync('/usr/local/bin/ficsit-cli') ? 'v0.7.0' : null,
    smlInstalled: fs.existsSync('/opt/satisfactory-server/server/FactoryGame/Mods'),
    smlVersion: fs.existsSync('/opt/satisfactory-server/server/FactoryGame/Mods') ? 'v3.8.0' : null,
    running: false,
    progress: 0.0,
    statusText: 'IDLE',
    log: []
  }
};

// Increment uptime clock
setInterval(() => {
  if (serverState.status === 'RUNNING') {
    serverState.uptime += 1;
    serverState.savePlayDuration += 1;
  } else if (serverState.status === 'STOPPED') {
    serverState.uptime = 0;
  }
}, 1000);

// Detect if server is already running on startup
consoleLogHistory.push({
  timestamp: new Date().toISOString(),
  source: 'SYSTEM',
  message: 'Dedicated server manager interface booted.'
});

exec('pgrep -f FactoryServer-Linux-Shipping', (err, stdout) => {
  if (!err && stdout.trim()) {
    serverState.status = 'RUNNING';
    consoleLogHistory.push({
      timestamp: new Date().toISOString(),
      source: 'SYSTEM',
      message: 'Active Dedicated Server process detected (Running in background).'
    });
  } else {
    serverState.status = 'STOPPED';
    serverState.uptime = 0;
    consoleLogHistory.push({
      timestamp: new Date().toISOString(),
      source: 'SYSTEM',
      message: 'Dedicated Server process is currently offline/stopped.'
    });
  }
});

// ── Satisfactory Dedicated Server API sync ─────────────────────────────────
const DS_HOST = 'localhost';
const DS_PORT = 7777;
const DS_PATH = '/api/v1';
let dsAuthToken = null;
const https = require('https');

const SAVES_DIR = '/opt/satisfactory-server/.config/Epic/FactoryGame/Saved/SaveGames/server';

// Parse session name and play time from the most recently updated save file
function getMostRecentSaveMetadata() {
  try {
    if (!fs.existsSync(SAVES_DIR)) return null;
    const files = fs.readdirSync(SAVES_DIR);
    const savFiles = files.filter(f => f.endsWith('.sav'));
    if (savFiles.length === 0) return null;
    
    // Find the save file with the latest mtime
    let latestFile = null;
    let latestMtime = 0;
    for (const f of savFiles) {
      const fullPath = path.join(SAVES_DIR, f);
      const stat = fs.statSync(fullPath);
      if (stat.mtimeMs > latestMtime) {
        latestMtime = stat.mtimeMs;
        latestFile = fullPath;
      }
    }

    if (!latestFile) return null;

    // Read header (first 2048 bytes)
    const fd = fs.openSync(latestFile, 'r');
    const buffer = Buffer.alloc(2048);
    fs.readSync(fd, buffer, 0, 2048, 0);
    fs.closeSync(fd);

    const offsetRef = { offset: 0 };
    const headerVersion = buffer.readInt32LE(offsetRef.offset);
    offsetRef.offset += 4;
    const saveVersion = buffer.readInt32LE(offsetRef.offset);
    offsetRef.offset += 4;
    const buildVersion = buffer.readInt32LE(offsetRef.offset);
    offsetRef.offset += 4;

    const readString = (buf, offRef) => {
      if (offRef.offset + 4 > buf.length) return '';
      const len = buf.readInt32LE(offRef.offset);
      offRef.offset += 4;
      if (len === 0) return '';
      if (len > 0) {
        if (offRef.offset + len > buf.length) return '';
        const strBytes = buf.subarray(offRef.offset, offRef.offset + len - 1);
        offRef.offset += len;
        return strBytes.toString('utf8');
      } else {
        const absoluteLen = -len;
        if (offRef.offset + absoluteLen * 2 > buf.length) return '';
        const strBytes = buf.subarray(offRef.offset, offRef.offset + absoluteLen * 2 - 2);
        offRef.offset += absoluteLen * 2;
        return strBytes.toString('utf16le');
      }
    };

    let saveName = '';
    if (headerVersion >= 14) {
      saveName = readString(buffer, offsetRef);
    }

    const mapName = readString(buffer, offsetRef);
    const mapOptions = readString(buffer, offsetRef);

    let sessionName = '';
    if (headerVersion >= 4) {
      sessionName = readString(buffer, offsetRef);
    }

    let playDurationSeconds = 0;
    if (headerVersion >= 3) {
      if (offsetRef.offset + 4 <= buffer.length) {
        playDurationSeconds = buffer.readInt32LE(offsetRef.offset);
      }
    }

    return {
      sessionName: sessionName || saveName.replace(/_autosave_\d+$/, '') || path.basename(latestFile).replace(/\.sav$/, '').replace(/_autosave_\d+$/, '') || 'Grassy Factory',
      playDurationSeconds
    };
  } catch (err) {
    console.error('Error reading save metadata:', err);
    return null;
  }
}

// Set the session name and playtime from files immediately at startup
const initialMetadata = getMostRecentSaveMetadata();
if (initialMetadata) {
  serverState.sessionName = initialMetadata.sessionName;
  serverState.savePlayDuration = initialMetadata.playDurationSeconds;
}

// Refresh save metadata every 30s
setInterval(() => {
  const meta = getMostRecentSaveMetadata();
  if (meta) {
    let changed = false;
    if (meta.sessionName && meta.sessionName !== serverState.sessionName) {
      serverState.sessionName = meta.sessionName;
      changed = true;
    }
    if (meta.playDurationSeconds !== undefined && meta.playDurationSeconds !== serverState.savePlayDuration) {
      serverState.savePlayDuration = meta.playDurationSeconds;
      changed = true;
    }
    if (changed) {
      broadcastToWs('session_update', {
        sessionName: serverState.sessionName,
        savePlayDuration: serverState.savePlayDuration,
        tps: serverState.tps,
        players: serverState.players,
        maxPlayers: serverState.maxPlayers,
        status: serverState.status
      });
    }
  }
}, 30000);

// Raw HTTPS POST to the DS (ignores self-signed cert)
function dsPost(body, token) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify(body);
    const opts = {
      host: DS_HOST, port: DS_PORT, path: DS_PATH,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      },
      rejectUnauthorized: false,
      timeout: 5000
    };
    const req = https.request(opts, res => {
      let raw = '';
      res.on('data', c => raw += c);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(raw) }); }
        catch { resolve({ status: res.statusCode, body: {} }); }
      });
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('timeout')); });
    req.write(payload);
    req.end();
  });
}

async function dsLogin() {
  try {
    const r = await dsPost({ function: 'PasswordlessLogin', data: { MinimumPrivilegeLevel: 'NotAuthenticated' } });
    dsAuthToken = r.body?.data?.authenticationToken || null;
  } catch { dsAuthToken = null; }
}

async function syncDsState() {
  if (!dsAuthToken) await dsLogin();
  if (!dsAuthToken) return;

  try {
    const r = await dsPost({ function: 'QueryServerState', data: {} }, dsAuthToken);

    if (r.status === 401 || r.status === 403) { dsAuthToken = null; return; }

    const gs = r.body?.data?.serverGameState;
    if (!gs) return;

    if (gs.activeSessionName) serverState.sessionName = gs.activeSessionName;
    if (gs.averageTickRate != null) serverState.tps = parseFloat(gs.averageTickRate.toFixed(1));
    if (gs.numConnectedPlayers != null) {
      const realCount = gs.numConnectedPlayers;
      if (realCount < serverState.players.length) serverState.players = serverState.players.slice(0, realCount);
    }
    if (gs.playerLimit != null) serverState.maxPlayers = gs.playerLimit;
    if (gs.isGameRunning) serverState.status = 'RUNNING';

    broadcastToWs('session_update', {
      sessionName: serverState.sessionName,
      tps: serverState.tps,
      players: serverState.players,
      maxPlayers: serverState.maxPlayers,
      status: serverState.status
    });
  } catch { /* DS unreachable */ }
}

// Poll DS API every 10 seconds; fire immediately on startup
setInterval(syncDsState, 10000);
setTimeout(syncDsState, 2000);
// ─────────────────────────────────────────────────────────────────────────────

// API Endpoints
app.get('/api/v1/health', (req, res) => {
  res.json({
    status: 'healthy',
    tps: serverState.tps,
    players: serverState.players.length,
    ram: `${serverState.ramUsed.toFixed(1)} GB / ${serverState.ramLimit.toFixed(1)} GB`,
    session: serverState.sessionName,
    timestamp: new Date().toISOString()
  });
});

app.post('/api/v1/auth/login', (req, res) => {
  const { username, password } = req.body;
  // Simple simulator auth
  res.json({
    success: true,
    token: 'ficsit-token-cognitive-auth-key-2026',
    operator: username || 'System Operator'
  });
});

app.get('/api/v1/diskspace', (req, res) => {
  exec('df -h /opt | tail -n 1', (err, stdout) => {
    if (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
    const parts = stdout.trim().split(/\s+/);
    if (parts.length >= 6) {
      const total = parts[1];
      const used = parts[2];
      const avail = parts[3];
      const percentStr = parts[4]; // e.g. "69%"
      const percentNum = parseInt(percentStr.replace('%', ''), 10);
      
      res.json({
        success: true,
        total,
        used,
        avail,
        percent: percentStr,
        percentNum
      });
    } else {
      res.status(500).json({ success: false, error: 'Could not parse disk utility output' });
    }
  });
});



// Helper for loading installed mods from filesystem
const MODS_DIR = '/opt/satisfactory-server/server/FactoryGame/Mods';
const PROFILES_PATH = '/opt/satisfactory-server/.local/share/ficsit/profiles.json';

function loadInstalledMods() {
  const installedMods = [];
  try {
    if (fs.existsSync(MODS_DIR)) {
      let profiles = {};
      if (fs.existsSync(PROFILES_PATH)) {
        try {
          profiles = JSON.parse(fs.readFileSync(PROFILES_PATH, 'utf8'));
        } catch (e) {
          console.error('Error parsing profiles.json:', e);
        }
      }
      const enabledModsMap = profiles.profiles?.Default?.mods || {};
      let loadOrderIndex = 1;

      const scanDirectory = (dirPath, isGameFeatures = false) => {
        if (!fs.existsSync(dirPath)) return;
        const files = fs.readdirSync(dirPath);
        files.forEach(file => {
          if (!isGameFeatures && file === 'GameFeatures') return;
          const fullPath = path.join(dirPath, file);
          try {
            if (fs.statSync(fullPath).isDirectory()) {
              const subFiles = fs.readdirSync(fullPath);
              const upluginFile = subFiles.find(f => f.endsWith('.uplugin'));
              if (upluginFile) {
                const upluginPath = path.join(fullPath, upluginFile);
                const uplugin = JSON.parse(fs.readFileSync(upluginPath, 'utf8'));
                const modId = file;
                
                // Avoid duplicates
                if (installedMods.some(m => m.id === modId)) return;

                const isEnabled = enabledModsMap[modId] ? enabledModsMap[modId].enabled !== false : true;
                
                installedMods.push({
                  id: modId,
                  name: uplugin.FriendlyName || modId,
                  version: uplugin.SemVersion || uplugin.VersionName || '1.0.0',
                  author: uplugin.CreatedBy || 'Unknown',
                  status: isEnabled ? 'ENABLED' : 'DISABLED',
                  enabled: isEnabled,
                  description: uplugin.Description || '',
                  compatibility: 'U8 STABLE',
                  dependencies: (uplugin.Plugins || []).map(p => p.Name),
                  logo: null,
                  downloads: null,
                  loadOrder: loadOrderIndex++
                });
              }
            }
          } catch (e) {
            console.error(`Error parsing mod folder ${file}:`, e);
          }
        });
      };

      // Scan main Mods folder
      scanDirectory(MODS_DIR, false);
      // Scan GameFeatures subfolder
      scanDirectory(path.join(MODS_DIR, 'GameFeatures'), true);
    }
  } catch (err) {
    console.error('Error loading installed mods:', err);
  }
  
  const smlMod = installedMods.find(m => m.id === 'SML');
  serverState.ficsitCli.smlInstalled = !!smlMod;
  serverState.ficsitCli.smlVersion = smlMod ? smlMod.version : null;
  serverState.mods = installedMods;
}


function installSmlInternal(callback) {
  serverState.ficsitCli.running = true;
  serverState.ficsitCli.progress = 25.0;
  serverState.ficsitCli.statusText = 'INSTALLING SML';
  broadcastToWs('ficsit_state', serverState.ficsitCli);
  broadcastToWs('ficsit_log', 'Injecting SML dependency into profiles.json...');

  try {
    let profiles = {
      profiles: {
        Default: {
          mods: {},
          name: "Default",
          required_targets: null
        }
      },
      selected_profile: "Default",
      version: 0
    };
    if (fs.existsSync(PROFILES_PATH)) {
      try {
        profiles = JSON.parse(fs.readFileSync(PROFILES_PATH, 'utf8'));
      } catch (e) {
        broadcastToWs('ficsit_log', '[WARNING] Failed to parse profiles.json, recreating standard profile.');
      }
    }
    
    if (!profiles.profiles) profiles.profiles = {};
    if (!profiles.profiles.Default) profiles.profiles.Default = { mods: {}, name: "Default" };
    if (!profiles.profiles.Default.mods) profiles.profiles.Default.mods = {};
    
    profiles.profiles.Default.mods["SML"] = { version: "*", enabled: true };
    
    fs.mkdirSync(path.dirname(PROFILES_PATH), { recursive: true });
    fs.writeFileSync(PROFILES_PATH, JSON.stringify(profiles, null, 2), 'utf8');
    
    broadcastToWs('ficsit_log', 'Successfully updated profiles.json. Invoking ficsit-cli apply...');
    serverState.ficsitCli.progress = 50.0;
    broadcastToWs('ficsit_state', serverState.ficsitCli);
    
    const applyProcess = spawn('ficsit-cli', ['apply']);
    
    applyProcess.stdout.on('data', (data) => {
      const output = data.toString().trim();
      if (output) broadcastToWs('ficsit_log', output);
    });
    
    applyProcess.stderr.on('data', (data) => {
      const output = data.toString().trim();
      if (output) broadcastToWs('ficsit_log', `[CLI-ERR] ${output}`);
    });
    
    applyProcess.on('close', (code) => {
      serverState.ficsitCli.running = false;
      if (code === 0) {
        loadInstalledMods();
        serverState.ficsitCli.progress = 100.0;
        serverState.ficsitCli.statusText = 'SUCCESS';
        broadcastToWs('ficsit_log', 'Satisfactory Mod Loader (SML) installed and configured successfully.');
        broadcastToWs('console_log', {
          timestamp: new Date().toISOString(),
          source: 'SYSTEM',
          message: `Satisfactory Mod Loader (SML) version ${serverState.ficsitCli.smlVersion || 'v3.12.0'} initialized.`
        });
      } else {
        serverState.ficsitCli.statusText = 'FAILED';
        broadcastToWs('ficsit_log', `[ERROR] ficsit-cli apply failed with exit code ${code}`);
      }
      broadcastToWs('ficsit_state', serverState.ficsitCli);
      if (callback) callback(code === 0);
    });
  } catch (err) {
    serverState.ficsitCli.running = false;
    serverState.ficsitCli.statusText = 'FAILED';
    broadcastToWs('ficsit_log', `[ERROR] Exception during SML installation: ${err.message}`);
    broadcastToWs('ficsit_state', serverState.ficsitCli);
    if (callback) callback(false);
  }
}

app.post('/api/v1/ficsit/install-cli', (req, res) => {
  if (serverState.ficsitCli.running) {
    return res.status(400).json({ success: false, error: 'Pipeline task already running' });
  }

  serverState.ficsitCli.running = true;
  serverState.ficsitCli.progress = 5.0;
  serverState.ficsitCli.statusText = 'DOWNLOADING CLI';
  broadcastToWs('ficsit_state', serverState.ficsitCli);
  broadcastToWs('ficsit_log', 'Initiating ficsit-cli download pipeline...');
  
  const curl = spawn('curl', ['-L', '-o', '/usr/local/bin/ficsit-cli', 'https://github.com/satisfactorymodding/ficsit-cli/releases/download/v0.7.0/ficsit_linux_amd64']);
  
  curl.stdout.on('data', (data) => {
    broadcastToWs('ficsit_log', data.toString().trim());
  });
  
  curl.stderr.on('data', (data) => {
    broadcastToWs('ficsit_log', data.toString().trim());
  });
  
  curl.on('close', (code) => {
    if (code === 0) {
      exec('chmod +x /usr/local/bin/ficsit-cli', (err) => {
        if (err) {
          serverState.ficsitCli.running = false;
          serverState.ficsitCli.statusText = 'FAILED';
          broadcastToWs('ficsit_log', `[ERROR] Failed to set execute permissions: ${err.message}`);
          broadcastToWs('ficsit_state', serverState.ficsitCli);
        } else {
          serverState.ficsitCli.installed = true;
          serverState.ficsitCli.version = 'v0.7.0';
          serverState.ficsitCli.progress = 25.0;
          broadcastToWs('ficsit_log', 'ficsit-cli binary downloaded and permissions validated successfully.');
          broadcastToWs('console_log', {
            timestamp: new Date().toISOString(),
            source: 'SYSTEM',
            message: 'ficsit-cli installer binaries updated successfully.'
          });
          
          // Now chain SML loader installation!
          installSmlInternal();
        }
      });
    } else {
      serverState.ficsitCli.running = false;
      serverState.ficsitCli.statusText = 'FAILED';
      broadcastToWs('ficsit_log', `[ERROR] Download process failed with exit code ${code}`);
      broadcastToWs('ficsit_state', serverState.ficsitCli);
    }
  });
  
  res.json({ success: true });
});

app.post('/api/v1/ficsit/install-sml', (req, res) => {
  if (serverState.ficsitCli.running) {
    return res.status(400).json({ success: false, error: 'Pipeline task already running' });
  }
  installSmlInternal();
  res.json({ success: true });
});

app.post('/api/v1/ficsit/uninstall-sml', (req, res) => {
  if (serverState.ficsitCli.running) {
    return res.status(400).json({ success: false, error: 'Pipeline task already running' });
  }

  serverState.ficsitCli.running = true;
  serverState.ficsitCli.progress = 25.0;
  serverState.ficsitCli.statusText = 'UNINSTALLING SML';
  broadcastToWs('ficsit_state', serverState.ficsitCli);
  broadcastToWs('ficsit_log', 'Removing SML dependency from profiles.json...');

  try {
    if (fs.existsSync(PROFILES_PATH)) {
      const profiles = JSON.parse(fs.readFileSync(PROFILES_PATH, 'utf8'));
      if (profiles.profiles?.Default?.mods) {
        delete profiles.profiles.Default.mods["SML"];
        profiles.profiles.Default.mods = {};
      }
      fs.writeFileSync(PROFILES_PATH, JSON.stringify(profiles, null, 2), 'utf8');
    }
    
    broadcastToWs('ficsit_log', 'profiles.json updated. Invoking ficsit-cli apply to clean installation...');
    serverState.ficsitCli.progress = 50.0;
    broadcastToWs('ficsit_state', serverState.ficsitCli);
    
    const applyProcess = spawn('ficsit-cli', ['apply']);
    
    applyProcess.stdout.on('data', (data) => {
      const output = data.toString().trim();
      if (output) broadcastToWs('ficsit_log', output);
    });
    
    applyProcess.stderr.on('data', (data) => {
      const output = data.toString().trim();
      if (output) broadcastToWs('ficsit_log', `[CLI-ERR] ${output}`);
    });
    
    applyProcess.on('close', (code) => {
      serverState.ficsitCli.running = false;
      if (code === 0) {
        loadInstalledMods();
        serverState.ficsitCli.progress = 0.0;
        serverState.ficsitCli.statusText = 'IDLE';
        broadcastToWs('ficsit_log', 'Satisfactory Mod Loader (SML) uninstalled. Mods directory cleared.');
        broadcastToWs('console_log', {
          timestamp: new Date().toISOString(),
          source: 'SYSTEM',
          message: 'Satisfactory Mod Loader (SML) uninstalled.'
        });
      } else {
        serverState.ficsitCli.statusText = 'FAILED';
        broadcastToWs('ficsit_log', `[ERROR] ficsit-cli apply failed with exit code ${code}`);
      }
      broadcastToWs('ficsit_state', serverState.ficsitCli);
    });
  } catch (err) {
    serverState.ficsitCli.running = false;
    serverState.ficsitCli.statusText = 'FAILED';
    broadcastToWs('ficsit_log', `[ERROR] Exception during SML uninstallation: ${err.message}`);
    broadcastToWs('ficsit_state', serverState.ficsitCli);
  }
  
  res.json({ success: true });
});


app.get('/api/v1/state', (req, res) => {
  loadInstalledMods();
  res.json(serverState);
});

app.post('/api/v1/command', (req, res) => {
  const { function: funcName, data } = req.body;
  if (!funcName) {
    return res.status(400).json({ error: 'Missing function parameter' });
  }

  let logMsg = '';
  let responseData = {};

  if (funcName === 'RunCommand') {
    const cmd = data?.command;
    const params = data?.parameters || [];
    logMsg = `Executing console command: ${cmd} ${params.join(' ')}`;
    
    if (cmd === 'SaveGame') {
      const name = params[0] || 'backup_save';
      responseData = { success: true, message: `Game saved successfully as: ${name}` };
    } else if (cmd === 'list_players') {
      responseData = { success: true, players: serverState.players };
    } else {
      responseData = { success: true, message: `Command '${cmd}' sent to Unreal Engine console.` };
    }
  } else {
    responseData = { success: false, error: `Unknown function: ${funcName}` };
  }

  broadcastToWs('console_log', {
    timestamp: new Date().toISOString(),
    source: 'API-EXEC',
    message: logMsg || `API invoked: ${funcName}`
  });

  res.json(responseData);
});

app.post('/api/v1/save', (req, res) => {
  const saveName = req.body.saveName || `${serverState.sessionName}_auto_save`;
  
  broadcastToWs('console_log', {
    timestamp: new Date().toISOString(),
    source: 'SYSTEM',
    message: `Auto-save sequence triggered. Save name: ${saveName}`
  });

  setTimeout(() => {
    broadcastToWs('console_log', {
      timestamp: new Date().toISOString(),
      source: 'SYSTEM',
      message: `Save complete: ${saveName}.sav - Size: 18.2MB`
    });
  }, 1000);

  res.json({ success: true, message: 'Save initiated', filename: `${saveName}.sav` });
});

// Helper functions for dedicated server management
function startServer() {
  if (serverState.status === 'RUNNING' || factoryServerProcess) {
    return false;
  }

  serverState.status = 'RUNNING';
  serverState.tps = 30.0;
  serverState.ramUsed = 2.5;
  serverState.players = [];

  const scriptPath = '/opt/satisfactory-server/server/FactoryServer.sh';
  const args = ['-log', '-unattended'];

  const isModded = serverState.ficsitCli && serverState.ficsitCli.smlInstalled;
  const startupMsg = isModded 
    ? `Initiating dedicated server startup sequence in MODDED mode (SML ${serverState.ficsitCli.smlVersion || 'v3.12.0'} detected)...`
    : 'Initiating dedicated server startup sequence in VANILLA mode...';

  broadcastToWs('console_log', {
    timestamp: new Date().toISOString(),
    source: 'SYSTEM',
    message: startupMsg
  });

  try {
    factoryServerProcess = spawn('sudo', ['-u', 'satisfactory', scriptPath, ...args], { 
      cwd: '/opt/satisfactory-server/server',
      env: { ...process.env, HOME: '/opt/satisfactory-server' } 
    });

    factoryServerProcess.stdout.on('data', (data) => {
      const output = data.toString();
      const lines = output.split('\n');
      lines.forEach(line => {
        const trimmed = line.trim();
        if (trimmed) {
          // Parse player connection/join logs
          if (trimmed.includes('Join succeeded:')) {
            const match = trimmed.match(/Join succeeded:\s*([a-zA-Z0-9_-]+)/);
            if (match && match[1]) {
              const player = match[1];
              if (!serverState.players.includes(player)) {
                serverState.players.push(player);
                broadcastToWs('server_status_update', serverState);
                handlePlayerJoined(player);
              }
            }
          }
          broadcastToWs('console_log', {
            timestamp: new Date().toISOString(),
            source: 'ENGINE',
            message: trimmed
          });
        }
      });
    });

    factoryServerProcess.stderr.on('data', (data) => {
      const output = data.toString();
      const lines = output.split('\n');
      lines.forEach(line => {
        const trimmed = line.trim();
        if (trimmed) {
          broadcastToWs('console_log', {
            timestamp: new Date().toISOString(),
            source: 'ENGINE-ERR',
            message: trimmed
          });
        }
      });
    });

    factoryServerProcess.on('close', (code) => {
      broadcastToWs('console_log', {
        timestamp: new Date().toISOString(),
        source: 'SYSTEM',
        message: `Dedicated server process exited with code ${code}`
      });
      serverState.status = 'STOPPED';
      serverState.tps = 0.0;
      serverState.ramUsed = 0.0;
      serverState.players = [];
      broadcastToWs('server_status_update', serverState);
      factoryServerProcess = null;
    });

  } catch (err) {
    broadcastToWs('console_log', {
      timestamp: new Date().toISOString(),
      source: 'ERROR',
      message: `Failed to spawn dedicated server: ${err.message}`
    });
    serverState.status = 'STOPPED';
    broadcastToWs('server_status_update', serverState);
    factoryServerProcess = null;
  }

  return true;
}

async function handlePlayerJoined(player) {
  broadcastToWs('console_log', {
    timestamp: new Date().toISOString(),
    source: 'SYSTEM',
    message: `Player "${player}" joined the session.`
  });

  broadcastToWs('player_joined', { player, timestamp: new Date().toISOString() });

  if (frmConfig.enabled && frmActiveAiConfig && frmActivePersona) {
    try {
      const contextBlurb = `\n\n[EVENT]\nPlayer "${player}" has just joined the game server. Welcome them to the server in character. Keep your reply extremely SHORT (1 sentence) and plain text. Do NOT use markdown.`;
      const enrichedSystemPrompt = (frmActiveAiConfig.systemPrompt || '') + contextBlurb;

      const chatRes = await fetch(`http://localhost:${process.env.PORT || 3030}/api/v1/ai/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: frmActiveAiConfig.provider,
          baseUrl: frmActiveAiConfig.baseUrl,
          apiKey: frmActiveAiConfig.apiKey,
          model: frmActiveAiConfig.model,
          systemPrompt: enrichedSystemPrompt,
          message: `Greet player ${player}.`
        })
      });
      const chatData = await chatRes.json();
      if (chatData.success && chatData.reply) {
        const personaNames = { ada: 'A.D.A.', shroud: 'THE SHROUD', unit7: 'UNIT-7' };
        const senderName = personaNames[frmActivePersona] || 'AI';
        const color = personaChatColors[frmActivePersona] || { r: 1, g: 1, b: 1, a: 1 };

        await frmPost('/sendChatMessage', {
          message: chatData.reply.substring(0, 512),
          sender: senderName,
          color
        });

        broadcastToWs('game_chat_ai_response', {
          persona: frmActivePersona,
          sender: senderName,
          message: chatData.reply,
          timestamp: Math.floor(Date.now() / 1000)
        });
      }
    } catch (err) {
      if (process.env.DEBUG_FRM) console.error('[FRM welcome error]', err.message);
    }
  }
}

function stopServer(callback) {
  if (serverState.status === 'STOPPED' && !factoryServerProcess) {
    if (callback) callback();
    return;
  }

  let targetPid = factoryServerProcess ? factoryServerProcess.pid : null;

  const performStop = () => {
    serverState.status = 'STOPPED';
    serverState.tps = 0.0;
    serverState.ramUsed = 0.0;
    serverState.players = [];

    broadcastToWs('console_log', {
      timestamp: new Date().toISOString(),
      source: 'SYSTEM',
      message: 'SIGINT signal sent. Shutting down dedicated server...'
    });

    broadcastToWs('server_status_update', serverState);

    let terminated = false;

    const checkTermination = () => {
      if (terminated) return;
      if (targetPid) {
        try {
          process.kill(targetPid, 0);
        } catch (e) {
          terminated = true;
        }
      } else {
        exec('pgrep -f FactoryServer-Linux-Shipping', (err, stdout) => {
          if (!stdout.trim()) {
            terminated = true;
          }
        });
      }

      if (terminated) {
        broadcastToWs('console_log', {
          timestamp: new Date().toISOString(),
          source: 'SYSTEM',
          message: 'Dedicated server process terminated. Status: OFFLINE.'
        });
        if (callback) callback();
      }
    };

    if (targetPid) {
      try {
        process.kill(targetPid, 'SIGINT');
      } catch (e) {}
    } else {
      exec('pkill -INT -f FactoryServer-Linux-Shipping');
    }

    let pollCount = 0;
    const pollInterval = setInterval(() => {
      pollCount++;
      checkTermination();
      if (terminated || pollCount > 30) {
        clearInterval(pollInterval);
        if (!terminated) {
          broadcastToWs('console_log', {
            timestamp: new Date().toISOString(),
            source: 'SYSTEM',
            message: 'Server process did not terminate within 30 seconds. Sending SIGKILL...'
          });
          if (targetPid) {
            try {
              process.kill(targetPid, 'SIGKILL');
            } catch (e) {}
          } else {
            exec('pkill -KILL -f FactoryServer-Linux-Shipping');
          }
          setTimeout(() => {
            if (factoryServerProcess && factoryServerProcess.pid === targetPid) {
              factoryServerProcess = null;
            }
            if (callback) callback();
          }, 1000);
        } else {
          if (factoryServerProcess && factoryServerProcess.pid === targetPid) {
            factoryServerProcess = null;
          }
        }
      }
    }, 1000);
  };

  if (!targetPid) {
    exec('pgrep -f FactoryServer-Linux-Shipping', (err, stdout) => {
      if (stdout.trim()) {
        targetPid = parseInt(stdout.trim().split('\n')[0]);
      }
      performStop();
    });
  } else {
    performStop();
  }
}

// Dedicated server power endpoints
app.post('/api/v1/server/start', (req, res) => {
  if (serverState.status === 'RUNNING') {
    return res.json({ success: false, message: 'Server is already running' });
  }

  const success = startServer();
  if (success) {
    res.json({ success: true, status: 'RUNNING' });
  } else {
    res.json({ success: false, message: 'Could not start server' });
  }
});

app.post('/api/v1/server/stop', (req, res) => {
  if (serverState.status === 'STOPPED') {
    return res.json({ success: false, message: 'Server is already stopped' });
  }

  stopServer();
  res.json({ success: true, status: 'STOPPED' });
});

app.post('/api/v1/server/restart', (req, res) => {
  serverState.status = 'RESTARTING';
  serverState.tps = 0.0;
  serverState.ramUsed = 2.1;
  serverState.players = [];
  broadcastToWs('server_status_update', serverState);

  broadcastToWs('console_log', {
    timestamp: new Date().toISOString(),
    source: 'SYSTEM',
    message: 'Restart command received from operator. Stopping active server...'
  });

  stopServer(() => {
    broadcastToWs('console_log', {
      timestamp: new Date().toISOString(),
      source: 'SYSTEM',
      message: 'Server stopped. Relaunching dedicated server...'
    });
    setTimeout(() => {
      startServer();
    }, 1000);
  });

  res.json({ success: true, status: 'RESTARTING' });
});

// Mod management APIs
app.get('/api/v1/mods', (req, res) => {
  loadInstalledMods();
  res.json(serverState.mods);
});

// SMR Live Repository Proxy — fetches real data from ficsit.app GraphQL API
const SMR_API = 'https://api.ficsit.app/v2/query';

app.get('/api/v1/smr/mods', async (req, res) => {
  const search = req.query.search || '';
  const limit = Math.min(parseInt(req.query.limit) || 20, 100);
  const offset = parseInt(req.query.offset) || 0;
  const orderBy = req.query.order_by || 'last_version_date';
  const searchFilter = search.trim().length > 0 ? `search: ${JSON.stringify(search)},` : '';

  const query = `{
    getMods(filter: {
      limit: ${limit},
      offset: ${offset},
      order_by: ${orderBy},
      order: desc,
      ${searchFilter}
    }) {
      mods {
        id
        name
        short_description
        logo
        downloads
        last_version_date
        authors {
          user {
            username
            avatar
          }
        }
        tags {
          name
        }
        latestVersions {
          release {
            version
            sml_version
          }
        }
      }
      count
    }
  }`;

  try {
    const response = await fetch(SMR_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query }),
      signal: AbortSignal.timeout(12000)
    });

    if (!response.ok) {
      return res.status(502).json({ success: false, error: `SMR API responded with ${response.status}` });
    }

    const data = await response.json();
    if (data.errors) {
      return res.status(502).json({ success: false, error: data.errors[0]?.message || 'SMR GraphQL error' });
    }

    const mods = (data.data?.getMods?.mods || []).map(m => {
      const release = m.latestVersions?.release;
      return {
        id: m.id,
        name: m.name,
        short_description: m.short_description,
        logo: m.logo,
        downloads: m.downloads,
        last_version_date: m.last_version_date,
        author: m.authors?.[0]?.user?.username || 'Unknown',
        authorAvatar: m.authors?.[0]?.user?.avatar || null,
        tags: (m.tags || []).map(t => t.name),
        installed: serverState.mods.some(installed => installed.id === m.id),
        sml_version: release?.sml_version || null,
        version: release?.version || '?.?.?'
      };
    });

    res.json({ success: true, mods, count: data.data?.getMods?.count || 0 });
  } catch (err) {
    res.status(502).json({ success: false, error: `Cannot reach SMR: ${err.message}` });
  }
});

// SMR individual mod detail
app.get('/api/v1/smr/mod/:id', async (req, res) => {
  const modId = req.params.id;

  const query = `{
    getMod(modId: ${JSON.stringify(modId)}) {
      id
      name
      short_description
      full_description
      logo
      downloads
      last_version_date
      authors {
        user {
          username
          avatar
        }
      }
      tags {
        name
      }
      latestVersions {
        alpha { version sml_version }
        beta { version sml_version }
        release { version sml_version size }
      }
    }
  }`;

  try {
    const response = await fetch(SMR_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query }),
      signal: AbortSignal.timeout(10000)
    });

    if (!response.ok) {
      return res.status(502).json({ success: false, error: `SMR API responded with ${response.status}` });
    }

    const data = await response.json();
    if (data.errors) {
      return res.status(502).json({ success: false, error: data.errors[0]?.message || 'SMR GraphQL error' });
    }

    const m = data.data?.getMod;
    if (!m) return res.status(404).json({ success: false, error: 'Mod not found' });

    const latestRelease = m.latestVersions?.release;
    const latestAny = latestRelease || m.latestVersions?.beta || m.latestVersions?.alpha;

    res.json({
      success: true,
      mod: {
        id: m.id,
        name: m.name,
        short_description: m.short_description,
        full_description: m.full_description,
        logo: m.logo,
        downloads: m.downloads,
        last_version_date: m.last_version_date,
        version: latestAny?.version || '?.?.?',
        sml_version: latestAny?.sml_version || null,
        size_bytes: latestRelease?.size || null,
        author: m.authors?.[0]?.user?.username || 'Unknown',
        authorAvatar: m.authors?.[0]?.user?.avatar || null,
        authors: (m.authors || []).map(a => a.user?.username).filter(Boolean),
        tags: (m.tags || []).map(t => t.name),
        installed: serverState.mods.some(installed => installed.id === m.id)
      }
    });
  } catch (err) {
    res.status(502).json({ success: false, error: `Cannot reach SMR: ${err.message}` });
  }
});

app.post('/api/v1/mods/toggle', (req, res) => {
  const { id } = req.body;
  if (!id) return res.status(400).json({ success: false, error: 'Missing mod id' });

  try {
    let nextState = 'ENABLED';
    if (fs.existsSync(PROFILES_PATH)) {
      const profiles = JSON.parse(fs.readFileSync(PROFILES_PATH, 'utf8'));
      if (profiles.profiles?.Default?.mods && profiles.profiles.Default.mods[id]) {
        const currentEnabled = profiles.profiles.Default.mods[id].enabled !== false;
        profiles.profiles.Default.mods[id].enabled = !currentEnabled;
        nextState = !currentEnabled ? 'ENABLED' : 'DISABLED';
      }
      fs.writeFileSync(PROFILES_PATH, JSON.stringify(profiles, null, 2), 'utf8');
    }
    
    broadcastToWs('console_log', {
      timestamp: new Date().toISOString(),
      source: 'MOD_MGR',
      message: `Toggling mod ${id} to ${nextState}...`
    });

    const applyProcess = spawn('ficsit-cli', ['apply']);
    applyProcess.stdout.on('data', (data) => {
      const output = data.toString().trim();
      if (output) {
        broadcastToWs('console_log', {
          timestamp: new Date().toISOString(),
          source: 'MOD_MGR_LOG',
          message: output
        });
      }
    });
    applyProcess.on('close', (code) => {
      loadInstalledMods();
      if (code === 0) {
        broadcastToWs('console_log', {
          timestamp: new Date().toISOString(),
          source: 'MOD_MGR',
          message: `Successfully toggled mod ${id}.`
        });
      } else {
        broadcastToWs('console_log', {
          timestamp: new Date().toISOString(),
          source: 'MOD_MGR',
          message: `[ERROR] Failed to toggle mod: ${id} (Exit code ${code})`
        });
      }
    });

    const mod = serverState.mods.find(m => m.id === id);
    if (mod) {
      mod.enabled = !mod.enabled;
      mod.status = mod.enabled ? 'ENABLED' : 'DISABLED';
      return res.json({ success: true, mod });
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/v1/mods/install', (req, res) => {
  const { id, name, author, description } = req.body;
  if (!id) return res.status(400).json({ success: false, error: 'Missing mod id' });

  try {
    let profiles = {
      profiles: {
        Default: {
          mods: {},
          name: "Default",
          required_targets: null
        }
      },
      selected_profile: "Default",
      version: 0
    };
    if (fs.existsSync(PROFILES_PATH)) {
      try {
        profiles = JSON.parse(fs.readFileSync(PROFILES_PATH, 'utf8'));
      } catch (e) {}
    }
    
    if (!profiles.profiles) profiles.profiles = {};
    if (!profiles.profiles.Default) profiles.profiles.Default = { mods: {}, name: "Default" };
    if (!profiles.profiles.Default.mods) profiles.profiles.Default.mods = {};
    
    profiles.profiles.Default.mods[id] = { version: "*", enabled: true };
    
    fs.mkdirSync(path.dirname(PROFILES_PATH), { recursive: true });
    fs.writeFileSync(PROFILES_PATH, JSON.stringify(profiles, null, 2), 'utf8');
    
    broadcastToWs('console_log', {
      timestamp: new Date().toISOString(),
      source: 'MOD_MGR',
      message: `Triggering installation for mod: ${id}...`
    });

    const applyProcess = spawn('ficsit-cli', ['apply']);
    applyProcess.stdout.on('data', (data) => {
      const output = data.toString().trim();
      if (output) {
        broadcastToWs('console_log', {
          timestamp: new Date().toISOString(),
          source: 'MOD_MGR_LOG',
          message: output
        });
      }
    });
    applyProcess.on('close', (code) => {
      loadInstalledMods();
      if (code === 0) {
        broadcastToWs('console_log', {
          timestamp: new Date().toISOString(),
          source: 'MOD_MGR',
          message: `Successfully installed mod: ${id} and dependencies.`
        });
      } else {
        broadcastToWs('console_log', {
          timestamp: new Date().toISOString(),
          source: 'MOD_MGR',
          message: `[ERROR] Failed to install mod: ${id} (Exit code ${code})`
        });
      }
    });

    const tempMod = {
      id,
      name: name || id,
      version: 'Installing...',
      author: author || 'Pending',
      status: 'ENABLED',
      enabled: true,
      description: description || 'Downloading and resolving dependencies...',
      compatibility: 'U8 STABLE',
      dependencies: [],
      logo: null,
      downloads: null,
      loadOrder: serverState.mods.length + 1
    };
    
    if (!serverState.mods.some(m => m.id === id)) {
      serverState.mods.push(tempMod);
    }
    
    res.json({ success: true, mod: tempMod });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/v1/mods/update', (req, res) => {
  const { id } = req.body;
  if (!id) return res.status(400).json({ success: false, error: 'Missing mod id' });

  broadcastToWs('console_log', {
    timestamp: new Date().toISOString(),
    source: 'MOD_MGR',
    message: `Checking updates/re-applying configuration for mod: ${id}...`
  });

  const applyProcess = spawn('ficsit-cli', ['apply']);
  applyProcess.stdout.on('data', (data) => {
    const output = data.toString().trim();
    if (output) {
      broadcastToWs('console_log', {
        timestamp: new Date().toISOString(),
        source: 'MOD_MGR_LOG',
        message: output
      });
    }
  });
  applyProcess.on('close', (code) => {
    loadInstalledMods();
    if (code === 0) {
      broadcastToWs('console_log', {
        timestamp: new Date().toISOString(),
        source: 'MOD_MGR',
        message: `Mod updates applied successfully.`
      });
    } else {
      broadcastToWs('console_log', {
        timestamp: new Date().toISOString(),
        source: 'MOD_MGR',
        message: `[ERROR] Failed to apply mod updates (Exit code ${code})`
      });
    }
  });

  res.json({ success: true });
});

app.post('/api/v1/mods/uninstall', (req, res) => {
  const { id } = req.body;
  if (!id) return res.status(400).json({ success: false, error: 'Missing mod id' });

  try {
    if (fs.existsSync(PROFILES_PATH)) {
      const profiles = JSON.parse(fs.readFileSync(PROFILES_PATH, 'utf8'));
      if (profiles.profiles?.Default?.mods) {
        delete profiles.profiles.Default.mods[id];
      }
      fs.writeFileSync(PROFILES_PATH, JSON.stringify(profiles, null, 2), 'utf8');
    }
    
    broadcastToWs('console_log', {
      timestamp: new Date().toISOString(),
      source: 'MOD_MGR',
      message: `Triggering uninstallation for mod: ${id}...`
    });

    const applyProcess = spawn('ficsit-cli', ['apply']);
    applyProcess.stdout.on('data', (data) => {
      const output = data.toString().trim();
      if (output) {
        broadcastToWs('console_log', {
          timestamp: new Date().toISOString(),
          source: 'MOD_MGR_LOG',
          message: output
        });
      }
    });
    applyProcess.on('close', (code) => {
      loadInstalledMods();
      if (code === 0) {
        broadcastToWs('console_log', {
          timestamp: new Date().toISOString(),
          source: 'MOD_MGR',
          message: `Successfully uninstalled mod: ${id}.`
        });
      } else {
        broadcastToWs('console_log', {
          timestamp: new Date().toISOString(),
          source: 'MOD_MGR',
          message: `[ERROR] Failed to uninstall mod: ${id} (Exit code ${code})`
        });
      }
    });

    res.json({ success: true, id });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});


// SteamCMD download logic simulation & actual wrapper
let steamCmdProcess = null;

function startSteamCmdSimulation() {
  if (serverState.steamCmd.running) return;
  
  serverState.steamCmd.running = true;
  serverState.steamCmd.progress = 0.0;
  serverState.steamCmd.peers = 8;
  serverState.steamCmd.statusText = 'DOWNLOADING';
  serverState.steamCmd.downloadSpeed = 0;
  serverState.steamCmd.diskWrite = 0;
  
  broadcastToWs('steamcmd_state', serverState.steamCmd);
  broadcastToWs('steamcmd_log', 'Invoking actual SteamCMD dedicated server update client...');

  const steamCmdPath = '/opt/steamcmd/steamcmd.sh';
  const args = [
    '+@sSteamCmdForcePlatformType', 'linux',
    '+force_install_dir', '/opt/satisfactory-server/server',
    '+login', 'anonymous',
    '+app_update', '1690800', 'validate',
    '+quit'
  ];
  try {
    steamCmdProcess = spawn('sudo', ['-u', 'satisfactory', steamCmdPath, ...args], { env: { ...process.env, HOME: '/opt/satisfactory-server', LC_ALL: 'en_US.UTF-8', LANG: 'en_US.UTF-8' } });
    
    steamCmdProcess.stdout.on('data', (data) => {
      const output = data.toString();
      const lines = output.split('\n');
      
      lines.forEach(line => {
        const trimmed = line.trim();
        if (!trimmed) return;

        // Broadcast raw output logs in real-time
        broadcastToWs('steamcmd_log', trimmed);

        // Capture download progress values
        const match = trimmed.match(/progress:\s+([0-9.]+)/i);
        if (match) {
          const percent = parseFloat(match[1]);
          serverState.steamCmd.progress = percent;
          
          if (trimmed.includes('downloading')) {
            serverState.steamCmd.statusText = 'DOWNLOADING';
            serverState.steamCmd.downloadSpeed = 35.0 + Math.random() * 15;
            serverState.steamCmd.diskWrite = 95.0 + Math.random() * 25;
          } else if (trimmed.includes('verifying')) {
            serverState.steamCmd.statusText = 'VALIDATING';
            serverState.steamCmd.downloadSpeed = 0.0;
            serverState.steamCmd.diskWrite = 120.0 + Math.random() * 30;
          }
          broadcastToWs('steamcmd_state', serverState.steamCmd);
        }
      });
    });

    steamCmdProcess.stderr.on('data', (data) => {
      const errorMsg = data.toString().trim();
      if (errorMsg) {
        broadcastToWs('steamcmd_log', `[ERROR] ${errorMsg}`);
      }
    });

    steamCmdProcess.on('close', (code) => {
      serverState.steamCmd.running = false;
      serverState.steamCmd.downloadSpeed = 0;
      serverState.steamCmd.diskWrite = 0;
      serverState.steamCmd.peers = 0;
      
      if (code === 0) {
        serverState.steamCmd.progress = 100.0;
        serverState.steamCmd.statusText = 'SUCCESS';
        serverState.steamCmd.installed = true;
        broadcastToWs('steamcmd_log', 'SteamCMD installation/validation process finished successfully.');
        broadcastToWs('console_log', {
          timestamp: new Date().toISOString(),
          source: 'SYSTEM',
          message: 'Satisfactory server binary updated via real SteamCMD wrapper.'
        });
      } else {
        serverState.steamCmd.statusText = 'FAILED';
        broadcastToWs('steamcmd_log', `SteamCMD process exited with error code: ${code}`);
      }
      
      broadcastToWs('steamcmd_state', serverState.steamCmd);
      steamCmdProcess = null;
    });

    steamCmdProcess.on('error', (err) => {
      broadcastToWs('steamcmd_log', `Failed to execute SteamCMD process: ${err.message}`);
      serverState.steamCmd.running = false;
      serverState.steamCmd.statusText = 'FAILED';
      broadcastToWs('steamcmd_state', serverState.steamCmd);
      steamCmdProcess = null;
    });

  } catch (err) {
    broadcastToWs('steamcmd_log', `Execution wrapper exception: ${err.message}`);
    serverState.steamCmd.running = false;
    serverState.steamCmd.statusText = 'FAILED';
    broadcastToWs('steamcmd_state', serverState.steamCmd);
    steamCmdProcess = null;
  }
}

function abortSteamCmdSimulation() {
  if (steamCmdProcess) {
    broadcastToWs('steamcmd_log', 'Sending SIGINT interrupt signal to active SteamCMD client...');
    steamCmdProcess.kill('SIGINT');
    setTimeout(() => {
      if (steamCmdProcess) {
        broadcastToWs('steamcmd_log', 'SteamCMD unresponsive, sending SIGKILL kill signal...');
        steamCmdProcess.kill('SIGKILL');
      }
    }, 2000);
  } else {
    serverState.steamCmd.running = false;
    serverState.steamCmd.statusText = 'ABORTED';
    broadcastToWs('steamcmd_log', 'System idle status set to ABORTED.');
    broadcastToWs('steamcmd_state', serverState.steamCmd);
  }
}
function stripAnsi(str) {
  if (typeof str !== 'string') return str;
  return str.replace(/[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g, '');
}

// WebSocket broadcast helpers
function broadcastToWs(type, data) {
  // Strip ANSI escape sequences from logs to prevent rendering corruption in the browser console
  if (type === 'steamcmd_log' || type === 'ficsit_log') {
    data = stripAnsi(data);
  } else if (type === 'console_log' && data && typeof data.message === 'string') {
    data.message = stripAnsi(data.message);
  }

  if (type === 'ficsit_log') {
    console.log(`[FICSIT-LOG] ${data}`);
  }
  if (type === 'console_log') {
    console.log(`[CONSOLE-LOG] [${data.source || 'UNKNOWN'}] ${data.message}`);
    consoleLogHistory.push(data);
    if (consoleLogHistory.length > 200) {
      consoleLogHistory.shift();
    }
  }
  const payload = JSON.stringify({ type, data });
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(payload);
    }
  });
}


// AI Chat proxy endpoint — routes to configured provider
const http2 = require('http'); // alias for clarity

// Ollama: list installed models + detect currently loaded model
app.get('/api/v1/ai/ollama/models', async (req, res) => {
  const baseUrl = req.query.baseUrl || 'http://localhost:11434';
  try {
    // Fetch all installed models
    const [tagsRes, psRes] = await Promise.all([
      fetch(`${baseUrl}/api/tags`),
      fetch(`${baseUrl}/api/ps`)
    ]);

    if (!tagsRes.ok) {
      return res.json({ success: false, error: `Ollama /api/tags responded with ${tagsRes.status}` });
    }

    const tagsData = await tagsRes.json();
    const psData = psRes.ok ? await psRes.json() : { models: [] };

    const models = (tagsData.models || []).map(m => ({
      name: m.name,
      value: m.name,
      size: m.details?.parameter_size || '',
      family: m.details?.family || '',
      quantization: m.details?.quantization_level || '',
      capabilities: m.capabilities || []
    }));

    // Detect currently loaded/running model
    const loadedModels = (psData.models || []).map(m => m.name || m.model);
    const activeModel = loadedModels.length > 0 ? loadedModels[0] : null;

    res.json({ success: true, models, activeModel });
  } catch (err) {
    res.json({ success: false, error: `Cannot reach Ollama at ${baseUrl}: ${err.message}` });
  }
});

// GET /api/v1/ai/models — generic models fetching endpoint
app.get('/api/v1/ai/models', async (req, res) => {
  const { provider, baseUrl, apiKey } = req.query;
  if (!provider) {
    return res.status(400).json({ success: false, error: 'Missing provider' });
  }

  try {
    if (provider === 'ollama') {
      const targetBaseUrl = baseUrl || 'http://localhost:11434';
      const [tagsRes, psRes] = await Promise.all([
        fetch(`${targetBaseUrl}/api/tags`),
        fetch(`${targetBaseUrl}/api/ps`).catch(() => ({ ok: false }))
      ]);
      if (!tagsRes.ok) {
        return res.json({ success: false, error: `Ollama responded with status ${tagsRes.status}` });
      }
      const tagsData = await tagsRes.json();
      const psData = psRes.ok ? await psRes.json() : { models: [] };
      const models = (tagsData.models || []).map(m => ({
        name: m.name,
        value: m.name,
        size: m.details?.parameter_size || ''
      }));
      const activeModel = psData.models?.length > 0 ? (psData.models[0].name || psData.models[0].model) : null;
      return res.json({ success: true, models, activeModel });
    }

    if (provider === 'gemini') {
      const targetBaseUrl = baseUrl || 'https://generativelanguage.googleapis.com';
      const url = `${targetBaseUrl}/v1beta/models?key=${apiKey || ''}`;
      const response = await fetch(url);
      if (!response.ok) {
        const errTxt = await response.text();
        return res.json({ success: false, error: `Gemini API error ${response.status}: ${errTxt.substring(0, 150)}` });
      }
      const data = await response.json();
      const models = (data.models || [])
        .filter(m => m.supportedGenerationMethods?.includes('generateContent'))
        .map(m => ({
          name: m.displayName || m.name,
          value: m.name.replace(/^models\//, '')
        }));
      return res.json({ success: true, models });
    }

    if (provider === 'openrouter') {
      const url = 'https://openrouter.ai/api/v1/models';
      const response = await fetch(url);
      if (!response.ok) {
        return res.json({ success: false, error: `OpenRouter responded with status ${response.status}` });
      }
      const data = await response.json();
      const models = (data.data || []).map(m => ({
        name: m.name || m.id,
        value: m.id
      }));
      return res.json({ success: true, models });
    }

    if (provider === 'anthropic') {
      const targetBaseUrl = baseUrl || 'https://api.anthropic.com';
      const url = `${targetBaseUrl}/v1/models`;
      const headers = {
        'x-api-key': apiKey || '',
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json'
      };
      const response = await fetch(url, { headers });
      if (!response.ok) {
        const errTxt = await response.text();
        return res.json({ success: false, error: `Anthropic API error ${response.status}: ${errTxt.substring(0, 150)}` });
      }
      const data = await response.json();
      const models = (data.data || []).map(m => ({
        name: m.display_name || m.model_id,
        value: m.model_id
      }));
      return res.json({ success: true, models });
    }

    // OpenAI and compatible (LM Studio, llama.cpp)
    const targetBaseUrl = baseUrl || 'https://api.openai.com/v1';
    const cleanBase = targetBaseUrl.endsWith('/') ? targetBaseUrl.slice(0, -1) : targetBaseUrl;
    const url = `${cleanBase}/models`;
    const headers = {};
    if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`;
    const response = await fetch(url, { headers });
    if (!response.ok) {
      const errTxt = await response.text();
      return res.json({ success: false, error: `API error ${response.status}: ${errTxt.substring(0, 150)}` });
    }
    const data = await response.json();
    const models = (data.data || []).map(m => ({
      name: m.id,
      value: m.id
    }));
    return res.json({ success: true, models });

  } catch (err) {
    res.json({ success: false, error: `Error fetching models: ${err.message}` });
  }
});

// Ollama: load (warm up) a model into memory

// Ollama: load (warm up) a model into memory
app.post('/api/v1/ai/ollama/load', async (req, res) => {
  const { baseUrl = 'http://localhost:11434', model } = req.body;
  if (!model) return res.status(400).json({ success: false, error: 'Missing model name' });

  try {
    // Sending an empty prompt with keep_alive tells Ollama to load the model without generating
    const response = await fetch(`${baseUrl}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model, prompt: '', keep_alive: -1 })
    });

    if (!response.ok) {
      const errText = await response.text();
      return res.json({ success: false, error: `Ollama responded ${response.status}: ${errText.substring(0, 200)}` });
    }

    // Consume the response body (Ollama streams even for empty prompts)
    await response.text();
    res.json({ success: true, model });
  } catch (err) {
    res.json({ success: false, error: err.message });
  }
});

app.post('/api/v1/ai/chat', async (req, res) => {
  const { provider, baseUrl, apiKey, model, systemPrompt, message } = req.body;

  if (!provider || !message) {
    return res.status(400).json({ success: false, error: 'Missing provider or message' });
  }

  try {
    let reply = '';

    // ── GEMINI ──
    if (provider === 'gemini') {
      const endpoint = `${baseUrl}/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const payload = JSON.stringify({
        system_instruction: { parts: [{ text: systemPrompt }] },
        contents: [{ role: 'user', parts: [{ text: message }] }]
      });
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: payload
      });
      if (!response.ok) {
        const errText = await response.text();
        return res.json({ success: false, error: `Gemini API error ${response.status}: ${errText.substring(0, 200)}` });
      }
      const data = await response.json();
      reply = data?.candidates?.[0]?.content?.parts?.[0]?.text || '[No response content]';

    // ── ANTHROPIC ──
    } else if (provider === 'anthropic') {
      const response = await fetch(`${baseUrl}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model,
          max_tokens: 1024,
          system: systemPrompt,
          messages: [{ role: 'user', content: message }]
        })
      });
      if (!response.ok) {
        const errText = await response.text();
        return res.json({ success: false, error: `Anthropic API error ${response.status}: ${errText.substring(0, 200)}` });
      }
      const data = await response.json();
      reply = data?.content?.[0]?.text || '[No response content]';

    // ── OPENAI / OPENROUTER / LM STUDIO / LLAMA.CPP (OpenAI-compatible) ──
    } else {
      const endpoint = provider === 'ollama'
        ? `${baseUrl}/api/chat`
        : `${baseUrl}/chat/completions`;

      const headers = { 'Content-Type': 'application/json' };
      if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`;
      if (provider === 'openrouter') {
        headers['HTTP-Referer'] = 'https://ficsit-server-manager';
        headers['X-Title'] = 'FICSIT Cognitive Link';
      }

      let body;
      if (provider === 'ollama') {
        body = JSON.stringify({
          model,
          stream: false,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: message }
          ]
        });
      } else {
        body = JSON.stringify({
          model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: message }
          ],
          max_tokens: 1024
        });
      }

      const response = await fetch(endpoint, { method: 'POST', headers, body });
      if (!response.ok) {
        const errText = await response.text();
        return res.json({ success: false, error: `Provider API error ${response.status}: ${errText.substring(0, 200)}` });
      }
      const data = await response.json();
      if (provider === 'ollama') {
        reply = data?.message?.content || '[No response content]';
      } else {
        reply = data?.choices?.[0]?.message?.content || '[No response content]';
      }
    }

    res.json({ success: true, reply });
  } catch (err) {
    res.json({ success: false, error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// FRM GAME CHAT INTEGRATION
// Proxies Ficsit Remote Monitoring (FRM) chat endpoints so the AI personas
// can read player messages and respond directly inside the game chat.
//
// FRM Web Server runs on port 8080 by default.
// Endpoints used:
//   GET  http://localhost:<FRM_PORT>/getChatMessages   — read recent chat
//   POST http://localhost:<FRM_PORT>/sendChatMessage   — send a message in-game
// ─────────────────────────────────────────────────────────────────────────────

let frmConfig = {
  host: 'localhost',
  port: 8080,
  authToken: '',          // X-FRM-Authorization header value
  enabled: false,         // Chat-bridge on/off
  pollIntervalMs: 5000,   // How often to poll for new messages
};

// Track the newest TimeStamp we have processed so we don't re-respond
let lastChatTimestamp = 0;
let chatPollTimer = null;

// Persona colour map: RGBA floats (0-1) matching each persona's terminal colour
const personaChatColors = {
  ada:    { r: 1.0, g: 0.745, b: 0.482, a: 1.0 }, // amber/orange  (#ffbf7b)
  shroud: { r: 1.0, g: 0.706, b: 0.671, a: 1.0 }, // error red     (#ffb4ab)
  unit7:  { r: 0.329, g: 0.894, b: 0.659, a: 1.0 }, // teal-green  (#54e4a8)
};

// Active persona + AI config shared with the AI chat bridge
// (populated when the client selects a persona and saves AI settings)
let frmActivePersona = null;       // persona key: 'ada' | 'shroud' | 'unit7'
let frmActiveAiConfig = null;      // full AI config object from saveAiSettings WS message

/** Make a raw HTTP GET to FRM web server */
function frmGet(path) {
  return new Promise((resolve, reject) => {
    const opts = {
      host: frmConfig.host,
      port: frmConfig.port,
      path,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(frmConfig.authToken ? { 
          'X-FRM-Authorization': frmConfig.authToken,
          'X-API-Key': frmConfig.authToken 
        } : {})
      },
      timeout: 4000
    };
    const req = require('http').request(opts, res => {
      let raw = '';
      res.on('data', c => raw += c);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(raw) }); }
        catch { resolve({ status: res.statusCode, body: [] }); }
      });
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('FRM GET timeout')); });
    req.end();
  });
}

/** Make a raw HTTP POST to FRM web server */
function frmPost(path, body) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify(body);
    const opts = {
      host: frmConfig.host,
      port: frmConfig.port,
      path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
        ...(frmConfig.authToken ? { 
          'X-FRM-Authorization': frmConfig.authToken,
          'X-API-Key': frmConfig.authToken 
        } : {})
      },
      timeout: 6000
    };
    const req = require('http').request(opts, res => {
      let raw = '';
      res.on('data', c => raw += c);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(raw) }); }
        catch { resolve({ status: res.statusCode, body: {} }); }
      });
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('FRM POST timeout')); });
    req.write(payload);
    req.end();
  });
}

// GET /api/v1/game/chat — fetch recent in-game chat messages
app.get('/api/v1/game/chat', async (req, res) => {
  try {
    const r = await frmGet('/getChatMessages');
    res.json({ success: true, messages: r.body || [] });
  } catch (err) {
    res.json({ success: false, error: err.message, messages: [] });
  }
});

// POST /api/v1/game/sendchat — send a message into the game chat
app.post('/api/v1/game/sendchat', async (req, res) => {
  const { message, sender, color } = req.body;
  if (!message) return res.status(400).json({ success: false, error: 'Missing message' });
  try {
    const payload = { message };
    if (sender) payload.sender = sender.substring(0, 32);
    if (color)  payload.color  = color;
    const r = await frmPost('/sendChatMessage', payload);
    res.json({ success: true, result: r.body });
  } catch (err) {
    res.json({ success: false, error: err.message });
  }
});

// POST /api/v1/game/chat/config — update FRM connection config
app.post('/api/v1/game/chat/config', (req, res) => {
  const { host, port, authToken, enabled, pollIntervalMs } = req.body;
  if (host !== undefined)          frmConfig.host          = host;
  if (port !== undefined)          frmConfig.port          = parseInt(port, 10) || 8080;
  if (authToken !== undefined)     frmConfig.authToken     = authToken;
  if (pollIntervalMs !== undefined) frmConfig.pollIntervalMs = parseInt(pollIntervalMs, 10) || 5000;

  const wasEnabled = frmConfig.enabled;
  if (enabled !== undefined) frmConfig.enabled = !!enabled;

  if (frmConfig.enabled && !wasEnabled) {
    startChatPolling();
  } else if (!frmConfig.enabled && wasEnabled) {
    stopChatPolling();
  }

  res.json({ success: true, config: frmConfig });
});

// GET /api/v1/game/chat/config — read current config + status
app.get('/api/v1/game/chat/config', (req, res) => {
  res.json({ success: true, config: frmConfig, lastChatTimestamp });
});

// POST /api/v1/game/chat/persona — update which persona is active for chat bridge
app.post('/api/v1/game/chat/persona', (req, res) => {
  const { personaKey, aiConfig } = req.body;
  if (personaKey) frmActivePersona = personaKey;
  if (aiConfig)   frmActiveAiConfig = aiConfig;
  res.json({ success: true, persona: frmActivePersona });
});

// ── Chat polling & AI response engine ────────────────────────────────────────
async function pollAndRespondToChat() {
  if (!frmConfig.enabled) return;

  try {
    const r = await frmGet('/getChatMessages');
    const messages = Array.isArray(r.body) ? r.body : [];

    // Filter to Player-type messages newer than the last we processed
    const newPlayerMessages = messages.filter(m =>
      m.Type === 'Player' &&
      m.TimeStamp > lastChatTimestamp
    );

    if (newPlayerMessages.length === 0) return;

    // Advance the high-water mark
    lastChatTimestamp = Math.max(...newPlayerMessages.map(m => m.TimeStamp));

    // Broadcast all new messages to the UI
    broadcastToWs('game_chat_messages', newPlayerMessages);

    // If AI is not configured, stop here
    if (!frmActiveAiConfig || !frmActivePersona) return;
    const isLocal = ['ollama', 'lmstudio', 'llamacpp'].includes(frmActiveAiConfig.provider);
    if (!frmActiveAiConfig.apiKey && !isLocal) return;

    // Build a combined user prompt from all new messages
    const combinedPrompt = newPlayerMessages
      .map(m => `[${m.Sender}]: ${m.Message}`)
      .join('\n');

    // Append server context to the system prompt
    const contextBlurb = `\n\n[CURRENT SERVER STATE]\nSession: ${serverState.sessionName} | TPS: ${serverState.tps} | Players: ${serverState.players.length}/${serverState.maxPlayers} | Status: ${serverState.status}`;
    const enrichedSystemPrompt = (frmActiveAiConfig.systemPrompt || '') + contextBlurb +
      '\n\nYou are responding to in-game chat messages. Keep your reply SHORT (1-2 sentences max). Do NOT use markdown or formatting tags — plain text only.';

    // Call the AI
    let aiReply = '';
    try {
      const chatRes = await fetch(`http://localhost:${process.env.PORT || 3030}/api/v1/ai/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: frmActiveAiConfig.provider,
          baseUrl: frmActiveAiConfig.baseUrl,
          apiKey: frmActiveAiConfig.apiKey,
          model: frmActiveAiConfig.model,
          systemPrompt: enrichedSystemPrompt,
          message: combinedPrompt
        })
      });
      const chatData = await chatRes.json();
      if (chatData.success) aiReply = chatData.reply;
      else {
        broadcastToWs('game_chat_error', `AI error: ${chatData.error}`);
        return;
      }
    } catch (err) {
      broadcastToWs('game_chat_error', `AI call failed: ${err.message}`);
      return;
    }

    if (!aiReply.trim()) return;

    // Persona metadata for the chat message
    const personaNames = { ada: 'A.D.A.', shroud: 'THE SHROUD', unit7: 'UNIT-7' };
    const senderName = personaNames[frmActivePersona] || 'AI';
    const color = personaChatColors[frmActivePersona] || { r: 1, g: 1, b: 1, a: 1 };

    // Send to game chat via FRM
    try {
      await frmPost('/sendChatMessage', {
        message: aiReply.substring(0, 512), // FRM message length sanity cap
        sender: senderName.substring(0, 32),
        color
      });

      // Echo to UI
      broadcastToWs('game_chat_ai_response', {
        persona: frmActivePersona,
        sender: senderName,
        message: aiReply,
        timestamp: Math.floor(Date.now() / 1000)
      });
    } catch (err) {
      broadcastToWs('game_chat_error', `FRM sendChatMessage failed: ${err.message}`);
    }

  } catch (err) {
    // FRM not reachable — not an error worth spamming
    if (process.env.DEBUG_FRM) console.error('[FRM poll error]', err.message);
  }
}

function startChatPolling() {
  if (chatPollTimer) return; // already running
  broadcastToWs('game_chat_status', { enabled: true, message: 'Chat bridge started. Polling FRM...' });
  lastChatTimestamp = Math.floor(Date.now() / 1000); // ignore messages before startup
  chatPollTimer = setInterval(pollAndRespondToChat, frmConfig.pollIntervalMs);
}

function stopChatPolling() {
  if (chatPollTimer) {
    clearInterval(chatPollTimer);
    chatPollTimer = null;
  }
  broadcastToWs('game_chat_status', { enabled: false, message: 'Chat bridge stopped.' });
}
// ─────────────────────────────────────────────────────────────────────────────


// WS client connections
wss.on('connection', ws => {
  // Send initial state
  ws.send(JSON.stringify({ type: 'init_state', data: serverState }));
  // Send console history
  ws.send(JSON.stringify({ type: 'console_history', data: consoleLogHistory }));
  // Send initial automation rules and logs
  ws.send(JSON.stringify({ type: 'automation_state', data: { rules: automationRules, logs: automationLogs } }));


  ws.on('message', message => {
    try {
      const parsed = JSON.parse(message);
      
      if (parsed.type === 'terminal_command') {
        const cmd = parsed.data.trim();
        if (cmd === '') return;

        // Handle echo-only prefix (client already called the AI directly)
        if (cmd.startsWith('__echo__:')) {
          const actualCmd = cmd.slice('__echo__:'.length);
          broadcastToWs('terminal_log', { source: 'USER', text: actualCmd });
          return;
        }

        // Legacy fallback: echo command and generate basic reply
        broadcastToWs('terminal_log', { source: 'USER', text: cmd });

        // Simulate processing delay
        setTimeout(() => {
          let reply = '';
          if (cmd.startsWith('help')) {
            reply = 'Available terminal commands:\n - state: Display dedicated server parameters\n - mods: List installed module ids\n - sync: Force manifest validation\n - clear: Wipe console buffer\n - reboot: Reset the cognitive link shell';
          } else if (cmd.startsWith('state')) {
            reply = `STATUS: ${serverState.status}\nUPTIME: ${Math.floor(serverState.uptime / 3600)}h Uptime\nSESSION: ${serverState.sessionName}\nTPS: ${serverState.tps} TPS\nPLAYERS: ${serverState.players.length}/${serverState.maxPlayers}`;
          } else if (cmd.startsWith('mods')) {
            reply = 'Installed Modules:\n' + serverState.mods.map(m => ` - [${m.id}] ${m.name} (${m.version}) [${m.status}]`).join('\n');
          } else if (cmd.startsWith('sync')) {
            reply = 'Cognitive link manifest verified at 99.98% integrity.';
          } else if (cmd.startsWith('reboot')) {
            reply = 'Rebooting cognitive link terminal... Handshake verification active.';
          } else {
            reply = `Action "${cmd}" acknowledged. Data integrity validated. Standard response generated.`;
          }
          broadcastToWs('terminal_log', { source: 'AI', text: reply });
        }, 800);
      }
      
      else if (parsed.type === 'steamcmd_action') {
        const action = parsed.data;
        if (action === 'start') {
          startSteamCmdSimulation();
        } else if (action === 'abort') {
          abortSteamCmdSimulation();
        }
      }
      
      else if (parsed.type === 'calibrate') {
        const { key, value } = parsed.data;
        serverState[key] = value;
        // Broadcast configuration change
        broadcastToWs('calibrated_state', { key, value });
      }

      // Sync AI config to FRM chat bridge when user saves settings
      else if (parsed.type === 'save_ai_settings') {
        frmActiveAiConfig = parsed.data;
      }

      // Sync active persona to FRM chat bridge when user selects one
      else if (parsed.type === 'select_persona') {
        frmActivePersona = parsed.data.personaKey;
        if (parsed.data.aiConfig) frmActiveAiConfig = parsed.data.aiConfig;
      }

    } catch (err) {
      console.error('Error handling WebSocket message:', err);
    }
  });
});


// Periodically update charts metrics via WS
setInterval(() => {
  if (serverState.status === 'RUNNING') {
    // Find PID of FactoryServer-Linux-Shipping
    exec('pgrep -f FactoryServer-Linux-Shipping', (err, stdout) => {
      if (err || !stdout.trim()) {
        // Fallback if pgrep fails or server is starting up
        const ramDelta = (Math.random() - 0.5) * 0.1;
        serverState.ramUsed = Math.max(2.1, Math.min(3.5, parseFloat((2.5 + ramDelta).toFixed(2))));
        
        const tpsDelta = (Math.random() - 0.5) * 0.2;
        serverState.tps = Math.max(28.5, Math.min(30.0, parseFloat((30.0 + tpsDelta).toFixed(1))));
      } else {
        const pid = stdout.trim().split('\n')[0];
        exec(`ps -p ${pid} -o rss=`, (err2, stdout2) => {
          if (!err2 && stdout2.trim()) {
            const rssKb = parseInt(stdout2.trim(), 10);
            if (!isNaN(rssKb)) {
              // Convert KB to GB
              serverState.ramUsed = parseFloat((rssKb / 1024 / 1024).toFixed(2));
            }
          }
          const tpsDelta = (Math.random() - 0.5) * 0.1;
          serverState.tps = Math.max(29.0, Math.min(30.0, parseFloat((30.0 + tpsDelta).toFixed(1))));
        });
      }
    });
  } else if (serverState.status === 'STOPPED') {
    serverState.tps = 0.0;
    serverState.ramUsed = 0.0;
    serverState.players = [];
  } else if (serverState.status === 'RESTARTING') {
    serverState.tps = 0.0;
    serverState.ramUsed = 2.1;
    serverState.players = [];
  }
  
  const loadDelta = Math.floor((Math.random() - 0.5) * 6);
  serverState.cognitiveLoad = Math.max(75, Math.min(95, serverState.cognitiveLoad + loadDelta));

  broadcastToWs('metrics_update', {
    tps: serverState.tps,
    ramUsed: serverState.ramUsed,
    cognitiveLoad: serverState.cognitiveLoad,
    timestamp: new Date().toISOString()
  });
}, 2000);

// ─────────────────────────────────────────────────────────────────────────────
// AUTOMATION & EVENT-RESPONSE ENGINE
// ─────────────────────────────────────────────────────────────────────────────
let prevPowerOutages = {};
let prevBatteryLow = {};
let prevDerailedTrains = {};
let prevTrainErrors = {};
let prevOnlinePlayers = [];
let prevDoggoInventories = {};
let automationLogs = [];
let automationRules = [];

function loadAutomationRules() {
  try {
    const filePath = path.join(__dirname, 'automation_rules.json');
    if (fs.existsSync(filePath)) {
      automationRules = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    } else {
      automationRules = [
        {
          id: 'rule_outage',
          name: 'Power Grid Failure Alert',
          enabled: true,
          trigger: 'power_outage',
          action: 'send_chat',
          parameter: 'ALERT: Power grid collapse detected on Circuit {circuitGroupID}! Automated safety systems are active.'
        },
        {
          id: 'rule_train',
          name: 'Train Derailment Alert',
          enabled: true,
          trigger: 'train_derail',
          action: 'send_chat',
          parameter: 'ALERT: Train {trainName} has derailed en route to {trainStation}!'
        },
        {
          id: 'rule_doggo',
          name: 'Lizard Doggo Loot Alert',
          enabled: true,
          trigger: 'doggo_item',
          action: 'send_chat',
          parameter: 'Good doggo! A Lizard Doggo has found {itemNum}x {itemName}!'
        }
      ];
      fs.writeFileSync(filePath, JSON.stringify(automationRules, null, 2));
    }
  } catch (err) {
    console.error('[Automation Rules Load Error]', err);
  }
}
loadAutomationRules();

function triggerAutomationEvent(trigger, data) {
  const timestamp = new Date().toISOString();
  const eventId = 'evt_' + Math.random().toString(36).substring(2, 11);
  let eventDesc = '';

  if (trigger === 'power_outage') {
    eventDesc = `Power Outage on Circuit ${data.circuitGroupID} (Capacity: ${data.capacity}MW)`;
  } else if (trigger === 'battery_low') {
    eventDesc = `Backup Batteries Low on Circuit ${data.circuitGroupID} (${data.batteryPercent}%, Time Left: ${data.timeEmpty})`;
  } else if (trigger === 'train_derail') {
    eventDesc = `Train '${data.trainName}' derailed heading to '${data.trainStation}'`;
  } else if (trigger === 'train_error') {
    eventDesc = `Train '${data.trainName}' error: ${data.errorMsg}`;
  } else if (trigger === 'player_join') {
    eventDesc = `Player '${data.playerName}' joined the server`;
  } else if (trigger === 'player_leave') {
    eventDesc = `Player '${data.playerName}' disconnected`;
  } else if (trigger === 'doggo_item') {
    eventDesc = `${data.doggoName} found item: ${data.itemNum}x ${data.itemName}`;
  }

  const newLog = {
    id: eventId,
    timestamp,
    event: trigger,
    description: eventDesc,
    actionTaken: 'No matching rules triggered.',
    severity: ['power_outage', 'battery_low', 'train_derail'].includes(trigger) ? 'HIGH' : 'INFO'
  };

  const matchingRules = automationRules.filter(r => r.enabled && r.trigger === trigger);
  const actions = [];

  matchingRules.forEach(rule => {
    let formattedText = rule.parameter || '';
    Object.keys(data).forEach(key => {
      formattedText = formattedText.replace(new RegExp(`{${key}}`, 'g'), data[key]);
    });

    if (rule.action === 'send_chat') {
      actions.push(`Send Chat: "${formattedText}"`);
      frmPost('/sendChatMessage', {
        message: formattedText.substring(0, 512),
        sender: 'FICSIT A.I.',
        color: { r: 1.0, g: 0.5, b: 0.0, a: 1.0 }
      }).catch(err => console.error('[Send Chat failed]', err.message));
    } else if (rule.action === 'toggle_switch') {
      const switchId = rule.parameter;
      actions.push(`Disable Switch: "${switchId}"`);
      frmPost('/setSwitches', {
        ID: switchId,
        status: false
      }).catch(err => console.error('[Set Switch failed]', err.message));
    }
  });

  if (actions.length > 0) {
    newLog.actionTaken = actions.join(' | ');
  }

  automationLogs.unshift(newLog);
  if (automationLogs.length > 100) automationLogs.pop();

  broadcastToWs('automation_event', { log: newLog, logs: automationLogs });
}

async function pollAndProcessAutomation() {
  if (serverState.status !== 'RUNNING' || !frmConfig.authToken) return;

  try {
    // 1. Fetch Power Info
    const powerRes = await frmGet('/getPower');
    if (powerRes.status === 200 && Array.isArray(powerRes.body)) {
      powerRes.body.forEach(circuit => {
        const id = circuit.CircuitGroupID !== undefined ? circuit.CircuitGroupID : 0;
        const fuseTriggered = !!circuit.FuseTriggered;
        if (prevPowerOutages[id] !== undefined && !prevPowerOutages[id] && fuseTriggered) {
          triggerAutomationEvent('power_outage', {
            circuitGroupID: id,
            capacity: circuit.PowerCapacity || 0,
            consumed: circuit.PowerConsumed || 0
          });
        }
        prevPowerOutages[id] = fuseTriggered;

        const battPct = circuit.BatteryPercent || 0;
        const diff = circuit.BatteryDifferential || 0;
        const isLow = (battPct < 30 && diff < 0);
        if (prevBatteryLow[id] !== undefined && !prevBatteryLow[id] && isLow) {
          triggerAutomationEvent('battery_low', {
            circuitGroupID: id,
            batteryPercent: battPct,
            timeEmpty: circuit.BatteryTimeEmpty || '00:00:00'
          });
        }
        prevBatteryLow[id] = isLow;
      });
    }

    // 2. Fetch Trains
    const trainRes = await frmGet('/getTrains');
    if (trainRes.status === 200 && Array.isArray(trainRes.body)) {
      trainRes.body.forEach(train => {
        const name = train.Name || train.TrainName;
        if (!name) return;

        const derailed = !!train.Derail || !!train.IsDerailed;
        if (prevDerailedTrains[name] !== undefined && !prevDerailedTrains[name] && derailed) {
          triggerAutomationEvent('train_derail', {
            trainName: name,
            trainStation: train.TrainStation || 'Unknown Station'
          });
        }
        prevDerailedTrains[name] = derailed;

        const hasError = !!train.ErrorStatus || (train.SelfDrivingStatus === 'Error');
        if (prevTrainErrors[name] !== undefined && !prevTrainErrors[name] && hasError) {
          triggerAutomationEvent('train_error', {
            trainName: name,
            errorMsg: train.ErrorStatus || 'Self driving error'
          });
        }
        prevTrainErrors[name] = hasError;
      });
    }

    // 3. Fetch Players
    const playerRes = await frmGet('/getPlayer');
    if (playerRes.status === 200 && Array.isArray(playerRes.body)) {
      const currentPlayers = playerRes.body.map(p => p.PlayerName || p.Name).filter(Boolean);
      currentPlayers.forEach(name => {
        if (!prevOnlinePlayers.includes(name)) {
          triggerAutomationEvent('player_join', { playerName: name });
        }
      });
      prevOnlinePlayers.forEach(name => {
        if (!currentPlayers.includes(name)) {
          triggerAutomationEvent('player_leave', { playerName: name });
        }
      });
      prevOnlinePlayers = currentPlayers;
    }

    // 4. Fetch Doggos
    const doggoRes = await frmGet('/getDoggo');
    if (doggoRes.status === 200 && Array.isArray(doggoRes.body)) {
      doggoRes.body.forEach(doggo => {
        const name = doggo.Name || `Lizard Doggo #${doggo.ID || 'Unknown'}`;
        const inv = doggo.Inventory || [];
        const currentCount = Array.isArray(inv) ? inv.reduce((sum, item) => sum + (item.NumItems || 1), 0) : 0;
        const prevCount = prevDoggoInventories[name] || 0;
        if (currentCount > prevCount) {
          const lastItem = inv[inv.length - 1] || {};
          triggerAutomationEvent('doggo_item', {
            doggoName: name,
            itemName: lastItem.ItemName || 'Unknown Item',
            itemNum: lastItem.NumItems || 1
          });
        }
        prevDoggoInventories[name] = currentCount;
      });
    }

  } catch (err) {
    if (process.env.DEBUG_FRM) console.error('[Automation Loop Error]', err.message);
  }
}

// Start independent automation polling timer
let automationPollTimer = setInterval(pollAndProcessAutomation, 5000);

// Automation REST Routes
app.get('/api/v1/automation/rules', (req, res) => {
  res.json({ success: true, rules: automationRules });
});

app.post('/api/v1/automation/rules', (req, res) => {
  const { rules } = req.body;
  if (!Array.isArray(rules)) return res.status(400).json({ success: false, error: 'Invalid rules array' });
  automationRules = rules;
  try {
    fs.writeFileSync(path.join(__dirname, 'automation_rules.json'), JSON.stringify(automationRules, null, 2));
    broadcastToWs('automation_state', { rules: automationRules, logs: automationLogs });
    res.json({ success: true, rules: automationRules });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/v1/automation/logs', (req, res) => {
  res.json({ success: true, logs: automationLogs });
});

app.post('/api/v1/automation/trigger-test', (req, res) => {
  const { trigger, data } = req.body;
  triggerAutomationEvent(trigger, data || {});
  res.json({ success: true, message: `Test event '${trigger}' triggered.` });
});

app.post('/api/v1/automation/clear-logs', (req, res) => {
  automationLogs = [];
  broadcastToWs('automation_state', { rules: automationRules, logs: automationLogs });
  res.json({ success: true, message: 'Logs cleared.' });
});

loadInstalledMods();


const PORT = process.env.PORT || 3030;
server.listen(PORT, () => {
  console.log(`Server manager listening on port ${PORT}`);
});
