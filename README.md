# FICSIT Server Manager & Cognitive Link

A premium, interactive, single-page server management dashboard designed for Satisfactory dedicated servers. The interface unifies real-time machine telemetry, modular component (mod) managers, API sandbox controllers, SteamCMD installation pipelines, and cognitive terminal shells.

---

## 📅 Progress Log: What Has Been Done

### 1. Architectural Consolidation
* Analyzed the four raw templates from [stich.md](file:///opt/satisfactory-server/stich.md) representing disparate server manager screens.
* Built a unified, highly aesthetic Single Page Application (SPA) in [public/index.html](file:///opt/satisfactory-server/public/index.html) with clean sidebar navigation.
* Relocated the user profile avatar card and the AI Cognitive Sync badge from the top header to the bottom of the sidebar to maximize workspace area.
* Removed the header navigation bar entirely and expanded the sidebar and canvas wrappers to fill the screen (`h-screen`).

### 2. Styling & Retro Industrial Theme
* Formulated [public/index.css](file:///opt/satisfactory-server/public/index.css) to package CSS animations, CRT scanline screen effects, hazard notification bars, blinking cursors, and custom webkit scrollbars.
* Designed responsive flex structures utilizing custom Tailwind theme variables (FICSIT orange `#f19e38`, telemetry green `#54e4a8`, and slate backgrounds).
* Fixed a tab layout display conflict where Tailwind's utility class `.flex` overrode the custom `.tab-content` hiding property, preventing pages from switching properly in the browser.


### 3. Server Power Controls & Logic
* Programmed Express API endpoints in [server.js](file:///opt/satisfactory-server/server.js) for server control commands (`/api/v1/server/start`, `/api/v1/server/stop`, `/api/v1/server/restart`).
* Updated the metrics update interval broadcaster. When stopped, the system logs the process offline and reports `0.0 TPS` and `0.0 GB RAM`.
* Tied the UI start/stop/restart buttons to the `triggerServerPower()` logic in [public/app.js](file:///opt/satisfactory-server/public/app.js), disabling active actions contextually depending on status.

### 4. Interactive Simulation & Logs Console
* Replaced heavy network throughput charts with a **Live Server STDOUT System Console** displaying system startups, configurations, engine reloads, and pioneer coordinate coordinates login logs.
* Forwarded WebSocket `console_log` streams to update both the API Sandbox console and the main Telemetry tab console concurrently.

### 5. SteamCMD Binary Update Wrapper
* Integrated Node's `child_process` `spawn` to run the real `/opt/steamcmd/steamcmd.sh` command.
* Configured real-time stdout line streaming and regex parsers (`progress: \d+.\d+`) to map actual binary package downloads on the progress bar.
* Installed system dependencies (`xclip`) and verified critical 32-bit (`i386`) GCC libraries (`lib32gcc-s1`, `lib32stdc++6`, and `libc6-i386`) are configured correctly.

### 6. Real-time Disk Space Telemetry
* Configured `/api/v1/diskspace` in `server.js` executing `df -h /opt` to get storage info dynamically.
* Added a refresh button next to **Disk Volume Space** header.
* Implemented JavaScript logic in `app.js` (`queryDiskSpace(btn)`) to fetch and parse disk details, trigger an active rotation animation on the refresh icon, dynamically toggle warning warnings vs success messages, and change the progress bar visual color thresholds (using `bg-error` if disk utilization is >= 85%, else `bg-primary`).
* Hooked the function inside `syncUiState()` to perform an initial call when the WebSocket client establishes connection.

### 7. Modular Component (Mod) Manager Redesign
* Re-implemented the Mod Tab panel in `index.html` with a dual-pane layout: 35% Repository List and 65% Specification Detail workspace.
* Programmed client-side merging of local installed modules (`serverState.mods`) and repository modules (`serverState.repoMods`) into a single searchable list.
* Designed a dynamic **FICSIT-CLI Logs** CRT command box for each individual mod, showing real-time command input execution, download feedback, and dependency validation logging upon user actions.
* Created a backend endpoint `POST /api/v1/mods/uninstall` in `server.js` to delete local mod configurations and clean up associated database tables.
* Wired up responsive primary (Install / Enable / Disable / Update) and secondary (Uninstall) action buttons alongside manual priority indices and structural dependencies lists.

### 8. Server Control pipelines & ficsit-cli integration
* Renamed the sidebar and UI layout tabs from **SteamCMD** to **SERVER CONTROL** to encompass all installer/utility tools.
* Added a new **FICSIT-CLI & SML Pipeline** card inside [public/index.html](file:///opt/satisfactory-server/public/index.html).
* Coded backend download endpoints (`/api/v1/ficsit/install-cli`, `/api/v1/ficsit/install-sml`, `/api/v1/ficsit/uninstall-sml`) in [server.js](file:///opt/satisfactory-server/server.js) to automate downloading the Linux `ficsit_linux_amd64` executable from the Github repository and set proper execute bits.
* Configured real-time system check validations on server boot to discover local mod loader instances and binary files.
* Tied the frontend buttons (`Install ficsit-cli`, `Install SML Mod Loader`, `Uninstall SML`) in [public/app.js](file:///opt/satisfactory-server/public/app.js) to trigger WebSocket feedback logs and dynamically toggle state classes depending on installations records.
* Added a mirroring three-column configuration status grid (showing **STEAMCMD STATUS**, **SERVER BINARIES** version check, and target **INSTALL PATH** records) inside the Dedicated Server Installation panel in [public/index.html](file:///opt/satisfactory-server/public/index.html) and linked dynamic updates in [public/app.js](file:///opt/satisfactory-server/public/app.js).

### 9. Telemetry Card Optimization and Real Process Control
* Compacted the Telemetry tab metrics cards by reducing grid gaps, cell paddings, icon sizes, and height parameters.
* Replaced mock server power controls with a real process controller in [server.js](file:///opt/satisfactory-server/server.js) that spawns the `/opt/satisfactory-server/server/FactoryServer.sh` script, streams Unreal Engine output/error logs in real time, and broadcasts them via WebSockets.
* Implemented graceful server termination via `SIGINT` (to allow normal autosave execution) with an automatic polling fallback to `SIGKILL` if the process does not terminate within 30 seconds.
* Added auto-detection on startup to discover if the Satisfactory process is already running, and connected real memory metrics queries via `pgrep` and `ps` to display true RSS memory consumption on the dashboard.
* Verified the SteamCMD download successfully installed ELF 64-bit binaries in `/opt/satisfactory-server/server/Engine/Binaries/Linux/FactoryServer-Linux-Shipping`.
* Resolved Unreal Engine root execution restrictions by recursively updating file ownership to the `satisfactory` user and configuration of `spawn` to run the game server under `sudo -u satisfactory`.
* Redesigned the Cognitive Shell panel inside [index.html](file:///opt/satisfactory-server/public/index.html) to use the new FICSIT Cognitive Link V3.5 template layout, adding sliders for thermal limits, creative noise, and recursion depth, model selection buttons, and a vertical telemetry stream bar.
* Fixed the line-numbering overflow bug in the Cognitive Link console where using container heights caused incorrect line counts due to flexbox stretching. Reconfigured `updateLineNumbers()` in [app.js](file:///opt/satisfactory-server/public/app.js) to calculate line count by summing the rendered heights (`offsetHeight`) of only the individual active log elements inside the console content container.

---

## 📋 Roadmap: What Is To Be Done

### 🛠️ Phase 1: Real Server Logs Pipeline
* [ ] **Unreal Engine Log Tailer**: Replace the simulated startup logs with an actual file tailer (e.g. using `tail -f`) pointing to the Satisfactory server log file (usually `~/.config/Epic/FactoryGame/Saved/Logs/FactoryGame.log`).
* [ ] **Stdout Filter**: Implement warning/error highlighter regex rules to colorize server errors (`[ERROR]`, `[WARNING]`) in the Telemetry tab console.

### ⚙️ Phase 2: Configuration Editor
* [ ] **Core Config Tab**: Design a panel inside the Control tab to parse, edit, and write core server files like `ServerSettings.ini`, `Game.ini`, and `Engine.ini`.
* [ ] **Settings Input Validation**: Implement boundaries checks on settings adjustments (e.g. maximum players limit, tick rate constants).

### 🗺️ Phase 3: Pioneer Tracker
* [ ] **Pioneer Database**: Build a list showing currently online pioneers, their join timestamp, ping, and last reported location coordinates.
* [ ] **Map Visualization**: Render a 2D canvas visualization of pioneer coordinate offsets inside the central workspace.

### ☁️ Phase 4: Backup Operations
* [ ] **Saves Archiver**: Add a files list on the API tab enabling operators to download auto-save games (`.sav`) directly from the server.
* [ ] **Cloud Uploader**: Integrate backup upload scripts (like AWS S3 or FICSIT.APP cloud APIs) to store backup files securely.

---

## 🚀 Relaunching the Server Manager
To run the server manager locally on port `3030`:
```bash
npm install
npm run dev
```
The interface will be available at [http://localhost:3030/](http://localhost:3030/).
