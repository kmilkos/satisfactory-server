# DaemonForge Labs: Brand Identity & Integration Guidelines

This document serves as the central source of truth for the DaemonForge Labs (DFL) brand architecture. It outlines the core visual identity, the persona of our mascot, and specific integration instructions for applying these elements consistently across all software interfaces, primarily focusing on game server management applications.

## 1. Core Brand Elements

The foundational elements of the brand define the overarching aesthetic and namespace for all current and future projects.

| Element | Specification | Context & Usage |
| :--- | :--- | :--- |
| **Brand Name** | DaemonForge Labs | Used in documentation, global footers, and official repositories. |
| **Tagline** | "Orchestrating digital worlds" | Used in landing pages, loading screens, and repository descriptions. |
| **Namespace** | `dfl-*` | Applied to all code repositories, packages, and CLI commands (e.g., `dfl-panel`, `dfl-core`). |
| **Node.js Support** | `v24.x (Active LTS)` | All applications and background daemons should be built and tested against the latest stable Node.js 24 LTS release. |

## 2. Industrial Color Palette

The color system is designed to evoke a heavy-duty, high-tech industrial environment. Strict adherence to this palette ensures consistency across Next.js and Tailwind CSS interfaces.

| Color Role | Hex Code | Tailwind Class | Usage Guidelines |
| :--- | :--- | :--- | :--- |
| **Background (Matte Black)** | `#121212` | `bg-zinc-950` | Primary application backgrounds, terminal outputs, and large canvas areas. |
| **Surface (Slate Grey)** | `#475569` | `bg-slate-600` | UI surfaces, cards, sidebars, secondary navigation, and inactive elements. |
| **Accent (Warning-label Orange)** | `#F97316` | `text-orange-500` / `bg-orange-500` | Primary action buttons, active states, critical server alerts, and holographic UI highlights. |

## 3. Mascot Persona: "Greg"

Greg represents the automated backbone of DaemonForge Labs. He is the visual embodiment of the `dfl-*` daemons running in the background.

*   **Visual Representation:** A sleek, highly advanced, matte-black geometric construct (like an anti-gravity octahedron) projecting hard-light holograms in Warning-label Orange.
*   **Personality:** Dry, hyper-competent, and mildly tired. He possesses immense computational power but communicates like a veteran IT sysadmin who just wants the servers to stop crashing.
*   **Implementation:** Displayed as a vector graphic in loading screens or error pages. When a server crashes, his visor simply displays an orange `¯\_(ツ)_/¯`.

## 4. Standardized App Integration: The Command Bridge

To maintain consistency across all DaemonForge Labs web applications, the layout utilizes a "Command Bridge" aesthetic. Greg serves as the central intelligence unit, with operational controls separated from system diagnostics.

### Layout Specifications (The Sticky Header)

*   **Center (The Core):** Greg is housed in a prominent, slightly elevated container perfectly centered at the top of the viewport. The specific app namespace (e.g., `dfl-panel`) is rendered directly below him in Accent Orange.
*   **Left Menu (Operations):** Dedicated exclusively to active server management and deployment (e.g., Deploy, Server Nodes, Backups).
*   **Right Menu (Diagnostics & Settings):** Dedicated exclusively to system health, logging, and configuration (e.g., System Logs, Daemon Status, Settings).

### Code Example (Next.js / Tailwind CSS)

Below is a standard React component snippet for the Command Bridge header, ready to be dropped into a standard DFL layout:

```jsx
export default function CommandBar({ appName = "dfl-panel" }) {
  return (
    <header className="relative w-full h-20 bg-zinc-950 border-b border-slate-700 flex items-center justify-between px-8 shadow-md">
      
      {/* Left Side: Server Operations */}
      <nav className="flex flex-1 space-x-6 text-sm font-sans font-medium text-slate-300">
        <a href="#" className="hover:text-orange-500 transition-colors">Deploy (SteamCMD)</a>
        <a href="#" className="hover:text-orange-500 transition-colors">Satisfactory Nodes</a>
        <a href="#" className="hover:text-orange-500 transition-colors">Minecraft Clusters</a>
        <a href="#" className="hover:text-orange-500 transition-colors">Backups</a>
      </nav>

      {/* Center: Greg & Namespace */}
      {/* Absolute positioning keeps Greg perfectly centered regardless of menu text length */}
      <div className="absolute left-1/2 transform -translate-x-1/2 flex flex-col items-center justify-center top-3">
        {/* Greg Avatar */}
        <div className="w-12 h-12 bg-slate-800 rounded-md flex items-center justify-center border border-slate-600 shadow-[0_0_15px_rgba(249,115,22,0.15)] group hover:border-orange-500 transition-all cursor-pointer">
          <span className="text-orange-500 font-bold tracking-tighter text-xl">_</span>
        </div>
        {/* Namespace */}
        <span className="text-orange-500 text-[10px] font-mono mt-1 uppercase tracking-widest">
          {appName}
        </span>
      </div>

      {/* Right Side: Diagnostics & Settings */}
      <nav className="flex flex-1 justify-end space-x-6 text-sm font-sans font-medium text-slate-300">
        <a href="#" className="hover:text-orange-500 transition-colors">System Logs</a>
        <a href="#" className="hover:text-orange-500 transition-colors">Daemon Status</a>
        <a href="#" className="hover:text-orange-500 transition-colors">Settings</a>
      </nav>
      
    </header>
  );
}
```

## 5. Typography Guidelines

To reinforce the developer-centric nature of the software, typographic choices heavily contrast clean reading text with terminal-style monospaced fonts.

*   **Primary Font (UI & General Text):** *Inter*. Provides exceptional readability on dark mode interfaces.
*   **Secondary Font (Code, Logs, Namespaces, Taglines):** *JetBrains Mono*. Reinforces the technical aesthetic. Used for the tagline "Orchestrating digital worlds" when displayed in loading screens.
