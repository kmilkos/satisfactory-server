<!-- Mod Registry & Deployment -->
<!DOCTYPE html>

<html class="dark" lang="en"><head>
<meta charset="utf-8"/>
<meta content="width=device-width, initial-scale=1.0" name="viewport"/>
<title>FICSIT COGNITIVE LINK - Mod Management</title>
<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&family=JetBrains+Mono:wght@400;700&family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@100..900&display=swap" rel="stylesheet"/>
<style>
        .material-symbols-outlined {
            font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
        }
        .glass-panel {
            background: rgba(15, 23, 42, 0.8);
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
        }
        ::-webkit-scrollbar {
            width: 6px;
            height: 6px;
        }
        ::-webkit-scrollbar-track {
            background: #060e20;
        }
        ::-webkit-scrollbar-thumb {
            background: #2d3449;
            border-radius: 3px;
        }
        ::-webkit-scrollbar-thumb:hover {
            background: #f19e38;
        }
        @keyframes scanline {
            0% { transform: translateY(-100%); }
            100% { transform: translateY(100%); }
        }
        .scanline-effect::after {
            content: "";
            position: absolute;
            top: 0; left: 0; width: 100%; height: 100%;
            background: linear-gradient(to bottom, transparent, rgba(241, 158, 56, 0.05), transparent);
            animation: scanline 8s linear infinite;
            pointer-events: none;
        }
    </style>
<script id="tailwind-config">
        tailwind.config = {
          darkMode: "class",
          theme: {
            extend: {
              "colors": {
                      "surface-container-highest": "#2d3449",
                      "on-tertiary-fixed": "#002113",
                      "secondary": "#b9c7df",
                      "inverse-primary": "#895200",
                      "secondary-fixed": "#d5e3fc",
                      "surface-container-low": "#131b2e",
                      "primary-fixed-dim": "#ffb86a",
                      "inverse-on-surface": "#283044",
                      "surface-container-high": "#222a3d",
                      "primary": "#ffbf7b",
                      "surface-bright": "#31394d",
                      "error-container": "#93000a",
                      "inverse-surface": "#dae2fd",
                      "tertiary-fixed-dim": "#4edea3",
                      "on-secondary-fixed-variant": "#3a485b",
                      "tertiary-container": "#2ec78e",
                      "surface-variant": "#2d3449",
                      "error": "#ffb4ab",
                      "surface-dim": "#0b1326",
                      "surface-container-lowest": "#060e20",
                      "on-surface-variant": "#d8c3b0",
                      "on-tertiary-container": "#004d33",
                      "on-primary-fixed-variant": "#683d00",
                      "on-tertiary": "#003824",
                      "on-secondary-container": "#abb9d1",
                      "surface-tint": "#ffb86a",
                      "on-primary-fixed": "#2c1700",
                      "on-surface": "#dae2fd",
                      "outline": "#a08d7c",
                      "on-primary": "#492900",
                      "background": "#0b1326",
                      "primary-fixed": "#ffdcbc",
                      "on-secondary-fixed": "#0d1c2e",
                      "surface": "#0b1326",
                      "secondary-container": "#3c4a5e",
                      "on-tertiary-fixed-variant": "#005236",
                      "on-secondary": "#233144",
                      "on-error": "#690005",
                      "primary-container": "#f19e38",
                      "on-background": "#dae2fd",
                      "secondary-fixed-dim": "#b9c7df",
                      "surface-container": "#171f33",
                      "on-error-container": "#ffdad6",
                      "tertiary": "#54e4a8",
                      "outline-variant": "#534436",
                      "tertiary-fixed": "#6ffbbe",
                      "on-primary-container": "#633a00"
              },
              "borderRadius": {
                      "DEFAULT": "0.125rem",
                      "lg": "0.25rem",
                      "xl": "0.5rem",
                      "full": "0.75rem"
              },
              "spacing": {
                      "density-comfortable": "16px",
                      "container-max": "1440px",
                      "margin": "24px",
                      "gutter": "16px",
                      "density-compact": "8px",
                      "unit": "4px"
              },
              "fontFamily": {
                      "body-lg": ["Inter"],
                      "label-caps": ["Inter"],
                      "display-lg": ["Inter"],
                      "code-sm": ["JetBrains Mono"],
                      "body-md": ["Inter"],
                      "headline-md": ["Inter"],
                      "headline-sm": ["Inter"]
              }
            }
          }
        }
    </script>
</head>
<body class="bg-background text-on-surface font-body-md selection:bg-primary selection:text-on-primary-container overflow-hidden">
<!-- Top Navigation Bar -->
<header class="w-full h-16 bg-surface-container-high border-b border-outline-variant flex justify-between items-center px-margin fixed top-0 z-50">
<div class="flex items-center gap-6">
<span class="font-display-lg text-display-lg font-bold tracking-tight text-primary">FICSIT COGNITIVE LINK</span>
<nav class="hidden md:flex gap-6 items-center h-full">
<a class="text-on-surface-variant font-medium hover:bg-surface-variant transition-colors duration-200 px-3 py-1" href="#">NODES</a>
<a class="text-on-surface-variant font-medium hover:bg-surface-variant transition-colors duration-200 px-3 py-1" href="#">METRICS</a>
<a class="text-on-surface-variant font-medium hover:bg-surface-variant transition-colors duration-200 px-3 py-1" href="#">LOGS</a>
</nav>
</div>
<div class="flex items-center gap-4">
<button class="material-symbols-outlined text-primary hover:bg-surface-variant p-2 transition-colors">speed</button>
<button class="material-symbols-outlined text-primary hover:bg-surface-variant p-2 transition-colors">database</button>
<div class="w-8 h-8 rounded-full border border-primary overflow-hidden">
<img class="w-full h-full object-cover" data-alt="A highly detailed 3D render of a futuristic engineer's profile picture. The character is wearing a sleek industrial helmet with amber visors reflecting data screens. The background is a dark, high-tech FICSIT factory interior with orange and blue light accents. The mood is professional and focused." src="https://lh3.googleusercontent.com/aida-public/AB6AXuCLSHx4ewJNzpLB7SNJk6gGhS_7gyC2B0O2Ry9nH5deoqo3uTITeHB9YhEAalUwcCy_MDfBOlKOVCqlP0UPQ_H7sG7Bc7roBxa7eyhuyUx4s39l7Z70grFAhRo3Xl7IUUxd7SPolFFOSMwRH_GH701wnwIViCmLCyEh5jUAvWdmllN7HnzJWcASIyGPwLXbKVTH6OXD_AlNr1C3nqZP0g7IDYh9ULPvEUgtuQ30pWSvlHQmN8lpA4Z2mTVbnsz1F6CWay5Rj6McHQ"/>
</div>
</div>
</header>
<!-- Sidebar Navigation -->
<aside class="fixed left-0 top-16 h-[calc(100vh-64px)] w-[240px] bg-surface-container border-r border-outline-variant flex flex-col py-margin z-40">
<div class="px-6 mb-8">
<div class="flex items-center gap-3 mb-1">
<span class="material-symbols-outlined text-primary text-3xl" style="font-variation-settings: 'FILL' 1;">memory</span>
<span class="font-headline-md text-headline-md text-primary">FICSIT INC.</span>
</div>
<p class="font-label-caps text-label-caps text-on-surface-variant opacity-70">CONSTRUCT_PAVE_AUTOMATE</p>
</div>
<nav class="flex-1 space-y-1">
<a class="flex items-center gap-4 text-on-surface-variant px-6 py-2 hover:bg-surface-variant transition-all font-label-caps text-label-caps" href="#">
<span class="material-symbols-outlined">analytics</span> TELEMETRY
            </a>
<a class="flex items-center gap-4 bg-secondary-container text-primary border-l-4 border-primary px-6 py-2 active:translate-x-1 transition-all font-label-caps text-label-caps" href="#">
<span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 1;">memory</span> MODELS
            </a>
<a class="flex items-center gap-4 text-on-surface-variant px-6 py-2 hover:bg-surface-variant transition-all font-label-caps text-label-caps" href="#">
<span class="material-symbols-outlined">settings_input_component</span> CONTROL
            </a>
<a class="flex items-center gap-4 text-on-surface-variant px-6 py-2 hover:bg-surface-variant transition-all font-label-caps text-label-caps" href="#">
<span class="material-symbols-outlined">verified_user</span> SECURITY
            </a>
<a class="flex items-center gap-4 text-on-surface-variant px-6 py-2 hover:bg-surface-variant transition-all font-label-caps text-label-caps" href="#">
<span class="material-symbols-outlined">terminal</span> SYSTEM
            </a>
</nav>
<div class="px-6 mt-auto space-y-4">
<button class="w-full py-3 bg-error-container text-error font-bold border border-error hover:bg-error hover:text-on-error transition-colors text-sm tracking-widest">
                EMERGENCY STOP
            </button>
<div class="pt-4 border-t border-outline-variant space-y-2">
<div class="flex items-center gap-3 text-on-surface-variant px-2 py-1 font-label-caps text-label-caps opacity-60">
<span class="material-symbols-outlined text-sm">query_stats</span> DIAGNOSTICS
                </div>
<div class="flex items-center gap-3 text-on-surface-variant px-2 py-1 font-label-caps text-label-caps opacity-60">
<span class="material-symbols-outlined text-sm">history</span> UPTIME: 432:12:05
                </div>
</div>
</div>
</aside>
<!-- Main Content Canvas -->
<main class="ml-[240px] mt-16 p-margin h-[calc(100vh-64px)] overflow-hidden flex gap-gutter">
<!-- Left: Mod Repository & Installed -->
<section class="flex-1 flex flex-col gap-gutter h-full overflow-hidden">
<!-- Header Actions -->
<div class="flex justify-between items-end mb-2">
<div>
<h1 class="font-headline-md text-headline-md text-on-surface">MODULAR COMPONENT MANAGEMENT</h1>
<p class="text-on-surface-variant font-body-md">Active session: US-EAST-B4 // Status: SYNCHRONIZED</p>
</div>
<button class="bg-primary-container text-on-primary-container px-6 py-2 font-bold flex items-center gap-2 hover:brightness-110 active:scale-95 transition-all shadow-lg">
<span class="material-symbols-outlined">sync</span>
                    SYNC WITH SERVER
                </button>
</div>
<!-- Scrollable Content -->
<div class="flex-1 overflow-y-auto pr-2 space-y-8">
<!-- Installed Mods Section -->
<div>
<div class="flex items-center gap-3 mb-4 border-l-2 border-primary pl-4">
<h2 class="font-headline-sm text-headline-sm text-primary uppercase tracking-wider">Installed System Modules</h2>
<span class="bg-surface-container-highest px-2 py-0.5 rounded text-[10px] font-bold text-on-surface-variant">6 ACTIVE</span>
</div>
<div class="grid grid-cols-1 xl:grid-cols-2 gap-4">
<!-- Mod Card 1: Enabled -->
<div class="bg-surface-container-low border border-outline-variant p-4 flex gap-4 relative group hover:border-primary transition-colors">
<div class="w-16 h-16 bg-surface-container-highest flex-shrink-0 flex items-center justify-center">
<span class="material-symbols-outlined text-primary text-3xl">settings_suggest</span>
</div>
<div class="flex-1 min-w-0">
<div class="flex justify-between items-start">
<h3 class="font-bold text-on-surface truncate">Power Manager Pro</h3>
<span class="bg-tertiary-container/20 text-tertiary text-[10px] px-1.5 py-0.5 border border-tertiary/30">ENABLED</span>
</div>
<div class="font-code-sm text-code-sm text-on-surface-variant mt-1">v2.4.1 // Author: MirceaPauli</div>
<div class="mt-2 flex gap-2">
<button class="text-[10px] font-bold px-2 py-1 bg-surface-container-highest text-on-surface hover:text-primary">CONFIGURE</button>
<button class="text-[10px] font-bold px-2 py-1 bg-surface-container-highest text-on-surface hover:text-error">DISABLE</button>
</div>
</div>
</div>
<!-- Mod Card 2: Update Available -->
<div class="bg-surface-container-low border border-primary p-4 flex gap-4 relative group shadow-[0_0_15px_rgba(241,158,56,0.1)]">
<div class="w-16 h-16 bg-surface-container-highest flex-shrink-0 flex items-center justify-center">
<span class="material-symbols-outlined text-primary text-3xl">precision_manufacturing</span>
</div>
<div class="flex-1 min-w-0">
<div class="flex justify-between items-start">
<h3 class="font-bold text-on-surface truncate">FICSIT Blueprint Plus</h3>
<span class="bg-primary/20 text-primary text-[10px] px-1.5 py-0.5 border border-primary/30 flex items-center gap-1">
<span class="material-symbols-outlined text-[10px]">update</span> UPDATE AVAILABLE
                                    </span>
</div>
<div class="font-code-sm text-code-sm text-on-surface-variant mt-1">v1.2.0 (New: v1.3.0) // Author: Benal</div>
<div class="mt-2 flex gap-2">
<button class="text-[10px] font-bold px-2 py-1 bg-primary text-on-primary-container hover:brightness-110">UPDATE NOW</button>
<button class="text-[10px] font-bold px-2 py-1 bg-surface-container-highest text-on-surface hover:text-primary">DETAILS</button>
</div>
</div>
</div>
<!-- Mod Card 3: Error -->
<div class="bg-surface-container-low border border-error/50 p-4 flex gap-4 relative group">
<div class="w-16 h-16 bg-error-container/20 flex-shrink-0 flex items-center justify-center">
<span class="material-symbols-outlined text-error text-3xl">warning</span>
</div>
<div class="flex-1 min-w-0">
<div class="flex justify-between items-start">
<h3 class="font-bold text-on-surface truncate">Advanced Teleports</h3>
<span class="bg-error/20 text-error text-[10px] px-1.5 py-0.5 border border-error/30">CONFLICT ERROR</span>
</div>
<div class="font-code-sm text-code-sm text-on-surface-variant mt-1">v0.9.8 // Author: SML-Core</div>
<div class="mt-2 flex gap-2">
<button class="text-[10px] font-bold px-2 py-1 bg-error-container text-error hover:bg-error hover:text-on-error">REPAIR</button>
<button class="text-[10px] font-bold px-2 py-1 bg-surface-container-highest text-on-surface hover:text-primary">LOGS</button>
</div>
</div>
</div>
<!-- Mod Card 4: Normal -->
<div class="bg-surface-container-low border border-outline-variant p-4 flex gap-4 relative group hover:border-primary transition-colors">
<div class="w-16 h-16 bg-surface-container-highest flex-shrink-0 flex items-center justify-center">
<span class="material-symbols-outlined text-primary text-3xl">view_in_ar</span>
</div>
<div class="flex-1 min-w-0">
<div class="flex justify-between items-start">
<h3 class="font-bold text-on-surface truncate">Structural Solutions</h3>
<span class="bg-surface-container-highest text-on-surface-variant text-[10px] px-1.5 py-0.5">ENABLED</span>
</div>
<div class="font-code-sm text-code-sm text-on-surface-variant mt-1">v3.0.4 // Author: TotalXyz</div>
<div class="mt-2 flex gap-2">
<button class="text-[10px] font-bold px-2 py-1 bg-surface-container-highest text-on-surface hover:text-primary">CONFIGURE</button>
</div>
</div>
</div>
</div>
</div>
<!-- Mod Repository Section -->
<div>
<div class="flex items-center justify-between mb-4 border-l-2 border-on-surface-variant pl-4">
<h2 class="font-headline-sm text-headline-sm text-on-surface uppercase tracking-wider">Repository (FICSIT.APP)</h2>
<div class="flex gap-2">
<input class="bg-surface-container-lowest border border-outline-variant text-xs px-3 py-1.5 focus:border-primary focus:ring-0 w-48 font-body-md" placeholder="Search modules..." type="text"/>
<button class="bg-surface-container-highest p-1.5 border border-outline-variant text-on-surface">
<span class="material-symbols-outlined text-sm">filter_list</span>
</button>
</div>
</div>
<div class="grid grid-cols-1 xl:grid-cols-2 gap-4 opacity-80 hover:opacity-100 transition-opacity">
<!-- Repo Mod Card 1 -->
<div class="bg-surface-container border border-outline-variant/30 p-4 flex gap-4 group cursor-pointer hover:bg-surface-container-high hover:border-primary transition-all">
<div class="w-16 h-16 bg-surface-container-highest flex-shrink-0 grayscale group-hover:grayscale-0 flex items-center justify-center transition-all">
<span class="material-symbols-outlined text-primary text-3xl">rocket_launch</span>
</div>
<div class="flex-1 min-w-0">
<h3 class="font-bold text-on-surface group-hover:text-primary transition-colors">Efficiency Checker</h3>
<div class="font-code-sm text-code-sm text-on-surface-variant mt-1">Author: McGalleon</div>
<div class="mt-2 flex items-center justify-between">
<span class="text-[10px] text-on-surface-variant">Downloads: 45.2k</span>
<button class="text-[10px] font-bold px-2 py-1 bg-surface-container-highest text-primary border border-primary/20 hover:bg-primary hover:text-on-primary-container">INSTALL</button>
</div>
</div>
</div>
<!-- Repo Mod Card 2 -->
<div class="bg-surface-container border border-outline-variant/30 p-4 flex gap-4 group cursor-pointer hover:bg-surface-container-high hover:border-primary transition-all">
<div class="w-16 h-16 bg-surface-container-highest flex-shrink-0 grayscale group-hover:grayscale-0 flex items-center justify-center transition-all">
<span class="material-symbols-outlined text-primary text-3xl">auto_fix_high</span>
</div>
<div class="flex-1 min-w-0">
<h3 class="font-bold text-on-surface group-hover:text-primary transition-colors">Micro-Manage</h3>
<div class="font-code-sm text-code-sm text-on-surface-variant mt-1">Author: TwoTwoIsFour</div>
<div class="mt-2 flex items-center justify-between">
<span class="text-[10px] text-on-surface-variant">Downloads: 128k</span>
<button class="text-[10px] font-bold px-2 py-1 bg-surface-container-highest text-primary border border-primary/20 hover:bg-primary hover:text-on-primary-container">INSTALL</button>
</div>
</div>
</div>
</div>
</div>
</div>
</section>
<!-- Right: Detail Panel -->
<aside class="w-[380px] h-full glass-panel border border-outline-variant flex flex-col relative overflow-hidden scanline-effect">
<div class="p-6 flex-1 overflow-y-auto">
<!-- Selected Mod Header -->
<div class="mb-6">
<div class="flex justify-between items-start mb-4">
<span class="material-symbols-outlined text-primary text-5xl bg-surface-container-highest p-3 rounded-lg">precision_manufacturing</span>
<div class="text-right">
<span class="font-code-sm text-code-sm text-primary block">ID: 0XAF-BLUE-PLUS</span>
<span class="text-[10px] text-on-surface-variant">MOD VERSION: 1.2.0</span>
</div>
</div>
<h2 class="font-headline-md text-headline-md text-on-surface mb-1">FICSIT Blueprint Plus</h2>
<p class="text-primary font-bold text-xs uppercase tracking-widest">By Benal Industries</p>
</div>
<!-- Stats Grid -->
<div class="grid grid-cols-2 gap-2 mb-8">
<div class="bg-surface-container-lowest p-3 border border-outline-variant">
<span class="block text-[10px] text-on-surface-variant mb-1">STATUS</span>
<span class="text-primary font-bold text-xs">OUTDATED</span>
</div>
<div class="bg-surface-container-lowest p-3 border border-outline-variant">
<span class="block text-[10px] text-on-surface-variant mb-1">COMPATIBILITY</span>
<span class="text-tertiary font-bold text-xs">U8 STABLE</span>
</div>
</div>
<!-- Description -->
<div class="mb-8">
<h4 class="font-label-caps text-label-caps text-on-surface-variant mb-3 border-b border-outline-variant pb-1">OVERVIEW</h4>
<p class="text-body-md text-on-surface leading-relaxed opacity-80">
                        Extends the vanilla blueprint system with advanced alignment tools, nested blueprint support, and remote sharing capabilities via the FICSIT cloud. Essential for massive scale factory planning.
                    </p>
</div>
<!-- Dependencies -->
<div class="mb-8">
<h4 class="font-label-caps text-label-caps text-on-surface-variant mb-3 border-b border-outline-variant pb-1">DEPENDENCIES</h4>
<div class="space-y-2">
<div class="flex items-center justify-between bg-surface-container-low p-2 border-l-2 border-tertiary">
<span class="text-xs font-bold">FICSIT Mod Loader</span>
<span class="material-symbols-outlined text-tertiary text-sm" style="font-variation-settings: 'FILL' 1;">check_circle</span>
</div>
<div class="flex items-center justify-between bg-surface-container-low p-2 border-l-2 border-tertiary">
<span class="text-xs font-bold">SML Core Library</span>
<span class="material-symbols-outlined text-tertiary text-sm" style="font-variation-settings: 'FILL' 1;">check_circle</span>
</div>
</div>
</div>
<!-- Load Order Toggle -->
<div class="bg-surface-container-highest p-4 border border-primary/30">
<div class="flex items-center justify-between mb-2">
<label class="font-bold text-xs text-primary uppercase">MANUAL LOAD ORDER</label>
<button class="w-10 h-5 bg-primary relative rounded-full p-0.5 transition-colors">
<div class="w-4 h-4 bg-on-primary-container rounded-full translate-x-5 transition-transform"></div>
</button>
</div>
<div class="flex items-center gap-2">
<input class="w-16 bg-background border-outline-variant text-xs text-on-surface text-center py-1 font-code-sm" type="number" value="12"/>
<span class="text-[10px] text-on-surface-variant">Priority Index (Higher loads later)</span>
</div>
</div>
</div>
<!-- Panel Footer Actions -->
<div class="p-6 bg-surface-container-low border-t border-outline-variant grid grid-cols-2 gap-3">
<button class="py-2 bg-surface-container-highest border border-outline-variant text-on-surface font-bold text-xs hover:bg-surface-variant">UNINSTALL</button>
<button class="py-2 bg-primary text-on-primary-container font-bold text-xs hover:brightness-110">UPDATE (v1.3.0)</button>
</div>
</aside>
</main>
<!-- Floating Toast Notification (Simulated interaction) -->
<div class="fixed bottom-margin right-margin bg-surface-container-highest border border-primary p-4 shadow-2xl flex items-center gap-4 translate-y-24 opacity-0 transition-all duration-500 z-[100]" id="sync-toast">
<div class="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
<div class="pr-8">
<h5 class="text-xs font-bold text-primary">SYNCHRONIZING DATA</h5>
<p class="text-[10px] text-on-surface-variant font-code-sm">Manifest verification in progress...</p>
</div>
<button class="material-symbols-outlined text-on-surface-variant text-sm" onclick="hideToast()">close</button>
</div>
<script>
        function showToast() {
            const toast = document.getElementById('sync-toast');
            toast.classList.remove('translate-y-24', 'opacity-0');
        }
        function hideToast() {
            const toast = document.getElementById('sync-toast');
            toast.classList.add('translate-y-24', 'opacity-0');
        }

        // Attach to the Sync button
        document.querySelector('button.bg-primary-container').addEventListener('click', () => {
            showToast();
            setTimeout(hideToast, 5000);
        });

        // Toggle effect for the manual load order button
        const toggleBtn = document.querySelector('aside button.w-10');
        const knob = toggleBtn.querySelector('div');
        toggleBtn.addEventListener('click', () => {
            const isActive = knob.classList.contains('translate-x-5');
            if (isActive) {
                knob.classList.remove('translate-x-5');
                toggleBtn.classList.replace('bg-primary', 'bg-surface-variant');
            } else {
                knob.classList.add('translate-x-5');
                toggleBtn.classList.replace('bg-surface-variant', 'bg-primary');
            }
        });
    </script>
</body></html>

<!-- Server API Control -->
<!DOCTYPE html>

<html class="dark" lang="en"><head>
<meta charset="utf-8"/>
<meta content="width=device-width, initial-scale=1.0" name="viewport"/>
<title>FICSIT Remote Management - API Control</title>
<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;900&amp;family=JetBrains+Mono:wght@400;700&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<script id="tailwind-config">
      tailwind.config = {
        darkMode: "class",
        theme: {
          extend: {
            "colors": {
                    "background": "#0b1326",
                    "primary-container": "#f19e38",
                    "on-background": "#dae2fd",
                    "surface-container-low": "#131b2e",
                    "inverse-primary": "#895200",
                    "surface-container-high": "#222a3d",
                    "on-secondary-fixed-variant": "#3a485b",
                    "on-secondary": "#233144",
                    "on-error-container": "#ffdad6",
                    "on-primary-fixed-variant": "#683d00",
                    "surface-dim": "#0b1326",
                    "outline": "#a08d7c",
                    "on-surface-variant": "#d8c3b0",
                    "on-secondary-container": "#abb9d1",
                    "on-tertiary-container": "#004d33",
                    "tertiary": "#54e4a8",
                    "primary-fixed-dim": "#ffb86a",
                    "outline-variant": "#534436",
                    "on-tertiary": "#003824",
                    "inverse-on-surface": "#283044",
                    "error": "#ffb4ab",
                    "surface-container-highest": "#2d3449",
                    "on-tertiary-fixed": "#002113",
                    "surface-bright": "#31394d",
                    "secondary-fixed": "#d5e3fc",
                    "on-primary": "#492900",
                    "surface": "#0b1326",
                    "surface-container-lowest": "#060e20",
                    "error-container": "#93000a",
                    "surface-variant": "#2d3449",
                    "surface-container": "#171f33",
                    "secondary-fixed-dim": "#b9c7df",
                    "surface-tint": "#ffb86a",
                    "tertiary-fixed": "#6ffbbe",
                    "on-primary-fixed": "#2c1700",
                    "primary": "#ffbf7b",
                    "tertiary-fixed-dim": "#4edea3",
                    "secondary-container": "#3c4a5e",
                    "on-surface": "#dae2fd",
                    "on-secondary-fixed": "#0d1c2e",
                    "secondary": "#b9c7df",
                    "on-primary-container": "#633a00",
                    "primary-fixed": "#ffdcbc",
                    "inverse-surface": "#dae2fd",
                    "tertiary-container": "#2ec78e",
                    "on-error": "#690005",
                    "on-tertiary-fixed-variant": "#005236"
            },
            "borderRadius": {
                    "DEFAULT": "0.125rem",
                    "lg": "0.25rem",
                    "xl": "0.5rem",
                    "full": "0.75rem"
            },
            "spacing": {
                    "margin": "24px",
                    "density-compact": "8px",
                    "container-max": "1440px",
                    "gutter": "16px",
                    "unit": "4px",
                    "density-comfortable": "16px"
            },
            "fontFamily": {
                    "display-lg": ["Inter"],
                    "headline-sm": ["Inter"],
                    "body-md": ["Inter"],
                    "code-sm": ["JetBrains Mono"],
                    "label-caps": ["Inter"],
                    "body-lg": ["Inter"],
                    "headline-md": ["Inter"],
                    "display-lg-mobile": ["Inter"]
            },
            "fontSize": {
                    "display-lg": ["32px", {"lineHeight": "40px", "letterSpacing": "-0.02em", "fontWeight": "700"}],
                    "headline-sm": ["18px", {"lineHeight": "24px", "fontWeight": "600"}],
                    "body-md": ["14px", {"lineHeight": "20px", "fontWeight": "400"}],
                    "code-sm": ["13px", {"lineHeight": "18px", "fontWeight": "400"}],
                    "label-caps": ["11px", {"lineHeight": "16px", "letterSpacing": "0.05em", "fontWeight": "700"}],
                    "body-lg": ["16px", {"lineHeight": "24px", "fontWeight": "400"}],
                    "headline-md": ["24px", {"lineHeight": "32px", "letterSpacing": "-0.01em", "fontWeight": "600"}],
                    "display-lg-mobile": ["24px", {"lineHeight": "32px", "fontWeight": "700"}]
            }
          },
        },
      }
    </script>
<style>
        .material-symbols-outlined {
            font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
        }
        .glass-panel {
            background: rgba(15, 23, 42, 0.8);
            backdrop-filter: blur(12px);
            border: 1px solid #1E293B;
        }
        .zebra-stripe:nth-child(even) {
            background: rgba(255, 255, 255, 0.02);
        }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: #0b1326; }
        ::-webkit-scrollbar-thumb { background: #534436; }
    </style>
</head>
<body class="bg-background text-on-background font-body-md selection:bg-primary-container selection:text-on-primary-container">
<!-- SideNavBar Anchor -->
<aside class="fixed left-0 top-0 h-full w-[240px] bg-surface-container-low border-r border-outline-variant flex flex-col z-50">
<div class="p-6">
<h1 class="font-display-lg text-display-lg font-bold text-primary-container leading-none">FICSIT</h1>
<p class="text-[10px] uppercase tracking-widest text-outline mt-1 font-bold">Control Systems</p>
</div>
<nav class="flex-1 px-3 space-y-1">
<a class="flex items-center gap-3 px-4 py-3 text-on-surface-variant hover:bg-surface-container-highest transition-colors rounded group" href="#">
<span class="material-symbols-outlined">dashboard</span>
<span class="font-body-md">Dashboard</span>
</a>
<a class="flex items-center gap-3 px-4 py-3 text-on-surface-variant hover:bg-surface-container-highest transition-colors rounded group" href="#">
<span class="material-symbols-outlined">memory</span>
<span class="font-body-md">Instances</span>
</a>
<a class="flex items-center gap-3 px-4 py-3 text-on-surface-variant hover:bg-surface-container-highest transition-colors rounded group" href="#">
<span class="material-symbols-outlined">terminal</span>
<span class="font-body-md">SteamCMD</span>
</a>
<a class="flex items-center gap-3 px-4 py-3 text-on-surface-variant hover:bg-surface-container-highest transition-colors rounded group" href="#">
<span class="material-symbols-outlined">lan</span>
<span class="font-body-md">Network</span>
</a>
<a class="flex items-center gap-3 px-4 py-3 bg-surface-container-high border-l-4 border-primary-container text-on-surface group" href="#">
<span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 1;">settings</span>
<span class="font-body-md">Settings</span>
</a>
</nav>
<div class="p-4 border-t border-outline-variant">
<div class="flex items-center gap-3 mb-4">
<div class="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center text-on-primary-container font-bold">SO</div>
<div>
<p class="text-sm font-bold">System Operator</p>
<p class="text-[10px] text-outline">Nodes: 12 Active</p>
</div>
</div>
<button class="w-full py-2 bg-primary-container text-on-primary-container font-bold text-sm rounded active:scale-95 transition-all">
                New Instance
            </button>
</div>
</aside>
<!-- Main Shell -->
<div class="ml-[240px] min-h-screen flex flex-col">
<!-- TopNavBar Anchor -->
<header class="h-16 flex justify-between items-center px-margin border-b border-outline-variant sticky top-0 bg-background/80 backdrop-blur-md z-40">
<div class="flex items-center gap-8">
<span class="font-headline-sm text-headline-sm font-black text-primary">API Management</span>
<nav class="hidden md:flex gap-6">
<a class="text-on-surface-variant hover:text-on-surface transition-opacity font-body-md" href="#">Cluster Health</a>
<a class="text-on-surface-variant hover:text-on-surface transition-opacity font-body-md" href="#">Metrics</a>
<a class="text-primary border-b-2 border-primary pb-1 font-body-md" href="#">API Keys</a>
</nav>
</div>
<div class="flex items-center gap-4">
<div class="relative group">
<span class="absolute inset-y-0 left-3 flex items-center text-outline">
<span class="material-symbols-outlined text-sm">search</span>
</span>
<input class="bg-surface-container-lowest border border-outline-variant rounded-lg pl-10 pr-4 py-1.5 text-sm focus:border-primary-container focus:ring-0 w-64 transition-all" placeholder="Search targets..." type="text"/>
</div>
<div class="flex gap-2">
<button class="p-2 text-on-surface-variant hover:bg-surface-container-high rounded transition-colors">
<span class="material-symbols-outlined">notifications</span>
</button>
<button class="p-2 text-on-surface-variant hover:bg-surface-container-high rounded transition-colors">
<span class="material-symbols-outlined">account_circle</span>
</button>
</div>
<button class="px-4 py-2 bg-primary-container text-on-primary-container font-bold text-xs uppercase tracking-wider rounded active:scale-95 transition-all">
                    Execute Task
                </button>
</div>
</header>
<!-- Main Content Canvas -->
<main class="flex-1 p-margin space-y-gutter max-w-[1440px]">
<!-- Live Metrics Section -->
<section class="grid grid-cols-1 md:grid-cols-4 gap-gutter">
<div class="bg-surface-container-low border border-outline-variant p-5 rounded-lg flex flex-col gap-2 relative overflow-hidden group">
<div class="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
<span class="material-symbols-outlined text-6xl">groups</span>
</div>
<span class="text-outline text-[11px] font-bold uppercase tracking-widest">Player Count</span>
<div class="flex items-baseline gap-2">
<span class="text-3xl font-black text-on-surface">06</span>
<span class="text-outline font-bold">/ 16</span>
</div>
<div class="w-full bg-surface-container-lowest h-1.5 rounded-full mt-2">
<div class="bg-tertiary h-full rounded-full" style="width: 37.5%"></div>
</div>
</div>
<div class="bg-surface-container-low border border-outline-variant p-5 rounded-lg flex flex-col gap-2 relative overflow-hidden group">
<div class="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
<span class="material-symbols-outlined text-6xl">pulse_alert</span>
</div>
<span class="text-outline text-[11px] font-bold uppercase tracking-widest">Server Tick Health</span>
<div class="flex items-baseline gap-2">
<span class="text-3xl font-black text-tertiary">30.0</span>
<span class="text-outline font-bold">TPS</span>
</div>
<div class="flex gap-1 mt-2">
<div class="h-4 w-full bg-tertiary/20 border-b-2 border-tertiary"></div>
<div class="h-6 w-full bg-tertiary/20 border-b-2 border-tertiary"></div>
<div class="h-3 w-full bg-tertiary/20 border-b-2 border-tertiary"></div>
<div class="h-5 w-full bg-tertiary/20 border-b-2 border-tertiary"></div>
<div class="h-4 w-full bg-tertiary/20 border-b-2 border-tertiary"></div>
</div>
</div>
<div class="bg-surface-container-low border border-outline-variant p-5 rounded-lg flex flex-col gap-2 relative overflow-hidden group">
<div class="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
<span class="material-symbols-outlined text-6xl">database</span>
</div>
<span class="text-outline text-[11px] font-bold uppercase tracking-widest">Active Session</span>
<span class="text-lg font-bold text-on-surface truncate">MEGA_FACTORY_PROD_V4</span>
<span class="text-xs text-outline">Uptime: 14h 22m 04s</span>
</div>
<div class="bg-surface-container-low border border-outline-variant p-5 rounded-lg flex flex-col gap-2 relative overflow-hidden group">
<div class="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
<span class="material-symbols-outlined text-6xl">memory</span>
</div>
<span class="text-outline text-[11px] font-bold uppercase tracking-widest">RAM Utilization</span>
<div class="flex items-baseline gap-2">
<span class="text-3xl font-black text-primary">12.4</span>
<span class="text-outline font-bold">GB</span>
</div>
<span class="text-xs text-outline">Limit: 16.0 GB</span>
</div>
</section>
<!-- API Function Grid -->
<section class="grid grid-cols-1 md:grid-cols-3 gap-gutter">
<!-- Health Check -->
<div class="bg-surface-container border border-outline-variant p-6 rounded-lg flex flex-col justify-between hover:border-primary-container/50 transition-colors">
<div>
<div class="flex justify-between items-start mb-4">
<span class="px-2 py-1 bg-tertiary/10 text-tertiary text-[10px] font-bold rounded border border-tertiary/20">GET</span>
<span class="material-symbols-outlined text-outline">monitor_heart</span>
</div>
<h3 class="font-headline-sm text-headline-sm text-on-surface mb-1">Health Check</h3>
<p class="font-code-sm text-code-sm text-outline-variant truncate">/api/v1/health</p>
</div>
<button class="mt-6 w-full py-2.5 bg-secondary-container text-on-secondary-container font-bold text-sm rounded flex items-center justify-center gap-2 hover:bg-surface-container-highest transition-colors">
<span class="material-symbols-outlined text-sm">play_arrow</span>
                        Execute
                    </button>
</div>
<!-- Auth -->
<div class="bg-surface-container border border-outline-variant p-6 rounded-lg flex flex-col justify-between hover:border-primary-container/50 transition-colors">
<div>
<div class="flex justify-between items-start mb-4">
<span class="px-2 py-1 bg-primary-container/10 text-primary-container text-[10px] font-bold rounded border border-primary-container/20">POST</span>
<span class="material-symbols-outlined text-outline">key</span>
</div>
<h3 class="font-headline-sm text-headline-sm text-on-surface mb-1">Authentication</h3>
<p class="font-code-sm text-code-sm text-outline-variant truncate">/api/v1/auth/login</p>
</div>
<button class="mt-6 w-full py-2.5 bg-secondary-container text-on-secondary-container font-bold text-sm rounded flex items-center justify-center gap-2 hover:bg-surface-container-highest transition-colors">
<span class="material-symbols-outlined text-sm">lock_open</span>
                        Authenticate
                    </button>
</div>
<!-- Get Server State -->
<div class="bg-surface-container border border-outline-variant p-6 rounded-lg flex flex-col justify-between hover:border-primary-container/50 transition-colors">
<div>
<div class="flex justify-between items-start mb-4">
<span class="px-2 py-1 bg-tertiary/10 text-tertiary text-[10px] font-bold rounded border border-tertiary/20">GET</span>
<span class="material-symbols-outlined text-outline">info</span>
</div>
<h3 class="font-headline-sm text-headline-sm text-on-surface mb-1">Get Server State</h3>
<p class="font-code-sm text-code-sm text-outline-variant truncate">/api/v1/state</p>
</div>
<button class="mt-6 w-full py-2.5 bg-secondary-container text-on-secondary-container font-bold text-sm rounded flex items-center justify-center gap-2 hover:bg-surface-container-highest transition-colors">
<span class="material-symbols-outlined text-sm">refresh</span>
                        Fetch Data
                    </button>
</div>
<!-- Run Command -->
<div class="bg-surface-container border border-outline-variant p-6 rounded-lg flex flex-col justify-between hover:border-primary-container/50 transition-colors">
<div>
<div class="flex justify-between items-start mb-4">
<span class="px-2 py-1 bg-primary-container/10 text-primary-container text-[10px] font-bold rounded border border-primary-container/20">POST</span>
<span class="material-symbols-outlined text-outline">terminal</span>
</div>
<h3 class="font-headline-sm text-headline-sm text-on-surface mb-1">Run Command</h3>
<p class="font-code-sm text-code-sm text-outline-variant truncate">/api/v1/command</p>
</div>
<button class="mt-6 w-full py-2.5 bg-secondary-container text-on-secondary-container font-bold text-sm rounded flex items-center justify-center gap-2 hover:bg-surface-container-highest transition-colors">
<span class="material-symbols-outlined text-sm">code</span>
                        Send Payload
                    </button>
</div>
<!-- Save Game -->
<div class="bg-surface-container border border-outline-variant p-6 rounded-lg flex flex-col justify-between hover:border-primary-container/50 transition-colors">
<div>
<div class="flex justify-between items-start mb-4">
<span class="px-2 py-1 bg-primary-container/10 text-primary-container text-[10px] font-bold rounded border border-primary-container/20">POST</span>
<span class="material-symbols-outlined text-outline">save</span>
</div>
<h3 class="font-headline-sm text-headline-sm text-on-surface mb-1">Save Game</h3>
<p class="font-code-sm text-code-sm text-outline-variant truncate">/api/v1/save</p>
</div>
<button class="mt-6 w-full py-2.5 bg-secondary-container text-on-secondary-container font-bold text-sm rounded flex items-center justify-center gap-2 hover:bg-surface-container-highest transition-colors">
<span class="material-symbols-outlined text-sm">cloud_upload</span>
                        Trigger Save
                    </button>
</div>
<!-- System Config -->
<div class="bg-surface-container border border-outline-variant p-6 rounded-lg flex flex-col justify-between hover:border-primary-container/50 transition-colors group">
<div class="flex flex-col h-full justify-center items-center text-center">
<span class="material-symbols-outlined text-outline-variant text-4xl mb-2">add_circle</span>
<p class="text-outline font-bold text-sm">Add Endpoint</p>
</div>
</div>
</section>
<!-- Console Section -->
<section class="grid grid-cols-1 lg:grid-cols-3 gap-gutter">
<div class="lg:col-span-2 bg-surface-container-low border border-outline-variant rounded-lg overflow-hidden flex flex-col">
<div class="px-4 py-3 border-b border-outline-variant flex justify-between items-center">
<div class="flex items-center gap-2">
<span class="material-symbols-outlined text-tertiary">terminal</span>
<span class="font-bold text-sm">Server Console</span>
</div>
<div class="flex gap-4">
<span class="text-[10px] text-outline uppercase font-bold flex items-center gap-1">
<span class="w-1.5 h-1.5 rounded-full bg-tertiary animate-pulse"></span> Connected
                            </span>
<button class="text-outline hover:text-on-surface"><span class="material-symbols-outlined text-sm">delete</span></button>
</div>
</div>
<div class="flex-1 bg-[#020617] p-4 h-64 overflow-y-auto font-code-sm text-code-sm space-y-1">
<div class="zebra-stripe py-0.5"><span class="text-outline">[14:22:01]</span> <span class="text-tertiary">SYSTEM:</span> Authentication handshake successful.</div>
<div class="zebra-stripe py-0.5"><span class="text-outline">[14:22:03]</span> <span class="text-primary-container">UE-LOG:</span> LogOnline: Display: OSS: Async task 'FOnlineAsyncTaskSteamGetServerDetails' started.</div>
<div class="zebra-stripe py-0.5"><span class="text-outline">[14:22:05]</span> <span class="text-on-background">INFO:</span> Server state updated. Active session: MEGA_FACTORY_PROD_V4</div>
<div class="zebra-stripe py-0.5"><span class="text-outline">[14:22:10]</span> <span class="text-error">ERROR:</span> Connection to Steam Master Server timed out. Retrying...</div>
<div class="zebra-stripe py-0.5"><span class="text-outline">[14:23:44]</span> <span class="text-on-background">&gt; list_players</span></div>
<div class="zebra-stripe py-0.5"><span class="text-outline">[14:23:44]</span> 0: Pioneer_Alpha</div>
<div class="zebra-stripe py-0.5"><span class="text-outline">[14:23:44]</span> 1: FixIt_Engineer_2</div>
</div>
<div class="p-3 bg-surface-container border-t border-outline-variant flex gap-3">
<input class="flex-1 bg-background border border-outline-variant rounded px-4 py-2 font-code-sm text-code-sm focus:border-primary-container focus:ring-0 outline-none" placeholder="Send Unreal Engine argument..." type="text"/>
<button class="bg-primary-container text-on-primary-container px-6 rounded font-bold text-sm active:scale-95 transition-all">SEND</button>
</div>
</div>
<!-- API Information / Docs Card -->
<div class="bg-surface-container-low border border-outline-variant rounded-lg p-6 flex flex-col">
<h3 class="font-headline-sm text-headline-sm mb-4">Payload Reference</h3>
<div class="space-y-4 flex-1">
<div class="space-y-2">
<p class="text-[10px] text-outline uppercase font-bold tracking-widest">Selected Endpoint</p>
<div class="bg-surface-container-lowest p-3 rounded border border-outline-variant">
<p class="font-code-sm text-code-sm text-primary">POST /api/v1/command</p>
</div>
</div>
<div class="space-y-2">
<p class="text-[10px] text-outline uppercase font-bold tracking-widest">JSON Body</p>
<pre class="bg-surface-container-lowest p-4 rounded border border-outline-variant font-code-sm text-code-sm overflow-x-auto text-on-surface-variant">{
  "function": "RunCommand",
  "data": {
    "command": "SaveGame",
    "parameters": ["auto_save_01"]
  }
}</pre>
</div>
</div>
<button class="mt-6 text-primary-container text-sm font-bold flex items-center justify-center gap-2 hover:underline">
<span class="material-symbols-outlined text-sm">open_in_new</span>
                        Open API Documentation
                    </button>
</div>
</section>
</main>
</div>
<!-- Background Elements -->
<div class="fixed inset-0 -z-10 opacity-20 pointer-events-none">

</div>
<script>
        // Simple micro-interaction for execute buttons
        document.querySelectorAll('button').forEach(btn => {
            btn.addEventListener('click', function() {
                if(this.textContent.includes('Execute')) {
                    const originalText = this.innerHTML;
                    this.innerHTML = '<span class="material-symbols-outlined text-sm animate-spin">sync</span> Running...';
                    this.classList.add('opacity-70');
                    setTimeout(() => {
                        this.innerHTML = '<span class="material-symbols-outlined text-sm">check_circle</span> Success';
                        this.classList.replace('bg-secondary-container', 'bg-tertiary/20');
                        this.classList.add('text-tertiary');
                        setTimeout(() => {
                            this.innerHTML = originalText;
                            this.classList.replace('bg-tertiary/20', 'bg-secondary-container');
                            this.classList.remove('text-tertiary', 'opacity-70');
                        }, 2000);
                    }, 1200);
                }
            });
        });
    </script>
</body></html>

<!-- SteamCMD Operations -->
<!DOCTYPE html>

<html class="dark" lang="en"><head>
<meta charset="utf-8"/>
<meta content="width=device-width, initial-scale=1.0" name="viewport"/>
<title>FICSIT Remote Management - SteamCMD Operations</title>
<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;900&amp;family=JetBrains+Mono:wght@400;700&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<script id="tailwind-config">
        tailwind.config = {
            darkMode: "class",
            theme: {
                extend: {
                    "colors": {
                        "background": "#0b1326",
                        "primary-container": "#f19e38",
                        "on-background": "#dae2fd",
                        "surface-container-low": "#131b2e",
                        "inverse-primary": "#895200",
                        "surface-container-high": "#222a3d",
                        "on-secondary-fixed-variant": "#3a485b",
                        "on-secondary": "#233144",
                        "on-error-container": "#ffdad6",
                        "on-primary-fixed-variant": "#683d00",
                        "surface-dim": "#0b1326",
                        "outline": "#a08d7c",
                        "on-surface-variant": "#d8c3b0",
                        "on-secondary-container": "#abb9d1",
                        "on-tertiary-container": "#004d33",
                        "tertiary": "#54e4a8",
                        "primary-fixed-dim": "#ffb86a",
                        "outline-variant": "#534436",
                        "on-tertiary": "#003824",
                        "inverse-on-surface": "#283044",
                        "error": "#ffb4ab",
                        "surface-container-highest": "#2d3449",
                        "on-tertiary-fixed": "#002113",
                        "surface-bright": "#31394d",
                        "secondary-fixed": "#d5e3fc",
                        "on-primary": "#492900",
                        "surface": "#0b1326",
                        "surface-container-lowest": "#060e20",
                        "error-container": "#93000a",
                        "surface-variant": "#2d3449",
                        "surface-container": "#171f33",
                        "secondary-fixed-dim": "#b9c7df",
                        "surface-tint": "#ffb86a",
                        "tertiary-fixed": "#6ffbbe",
                        "on-primary-fixed": "#2c1700",
                        "primary": "#ffbf7b",
                        "tertiary-fixed-dim": "#4edea3",
                        "secondary-container": "#3c4a5e",
                        "on-surface": "#dae2fd",
                        "on-secondary-fixed": "#0d1c2e",
                        "secondary": "#b9c7df",
                        "on-primary-container": "#633a00",
                        "primary-fixed": "#ffdcbc",
                        "inverse-surface": "#dae2fd",
                        "tertiary-container": "#2ec78e",
                        "on-error": "#690005",
                        "on-tertiary-fixed-variant": "#005236"
                    },
                    "borderRadius": {
                        "DEFAULT": "0.125rem",
                        "lg": "0.25rem",
                        "xl": "0.5rem",
                        "full": "0.75rem"
                    },
                    "spacing": {
                        "margin": "24px",
                        "density-compact": "8px",
                        "container-max": "1440px",
                        "gutter": "16px",
                        "unit": "4px",
                        "density-comfortable": "16px"
                    },
                    "fontFamily": {
                        "display-lg": ["Inter"],
                        "headline-sm": ["Inter"],
                        "body-md": ["Inter"],
                        "code-sm": ["JetBrains Mono"],
                        "label-caps": ["Inter"],
                        "body-lg": ["Inter"],
                        "headline-md": ["Inter"],
                        "display-lg-mobile": ["Inter"]
                    },
                    "fontSize": {
                        "display-lg": ["32px", {"lineHeight": "40px", "letterSpacing": "-0.02em", "fontWeight": "700"}],
                        "headline-sm": ["18px", {"lineHeight": "24px", "fontWeight": "600"}],
                        "body-md": ["14px", {"lineHeight": "20px", "fontWeight": "400"}],
                        "code-sm": ["13px", {"lineHeight": "18px", "fontWeight": "400"}],
                        "label-caps": ["11px", {"lineHeight": "16px", "letterSpacing": "0.05em", "fontWeight": "700"}],
                        "body-lg": ["16px", {"lineHeight": "24px", "fontWeight": "400"}],
                        "headline-md": ["24px", {"lineHeight": "32px", "letterSpacing": "-0.01em", "fontWeight": "600"}],
                        "display-lg-mobile": ["24px", {"lineHeight": "32px", "fontWeight": "700"}]
                    }
                }
            }
        }
    </script>
<style>
        .glass-overlay {
            background: rgba(15, 23, 42, 0.8);
            backdrop-filter: blur(12px);
        }
        .console-stripe:nth-child(even) {
            background: rgba(255, 255, 255, 0.02);
        }
        .scrollbar-hide::-webkit-scrollbar {
            display: none;
        }
        @keyframes progress-shimmer {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
        }
        .shimmer-effect {
            animation: progress-shimmer 2s infinite;
            background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
        }
    </style>
</head>
<body class="bg-background text-on-background font-body-md selection:bg-primary-container selection:text-on-primary-container">
<!-- SideNavBar (Shared Component) -->
<aside class="fixed left-0 top-0 h-full w-[240px] bg-surface-container-low border-r border-outline-variant flex flex-col z-50">
<div class="p-6">
<h1 class="font-display-lg text-display-lg font-bold text-primary-container">FICSIT Control</h1>
<p class="text-on-surface-variant font-label-caps opacity-70">Active Nodes: 12</p>
</div>
<nav class="flex-1 px-3 space-y-1">
<a class="flex items-center gap-3 px-4 py-3 text-on-surface-variant hover:bg-surface-container-highest transition-colors rounded duration-150 active:scale-95" href="#">
<span class="material-symbols-outlined">dashboard</span>
<span class="font-body-md">Dashboard</span>
</a>
<a class="flex items-center gap-3 px-4 py-3 text-on-surface-variant hover:bg-surface-container-highest transition-colors rounded duration-150 active:scale-95" href="#">
<span class="material-symbols-outlined">memory</span>
<span class="font-body-md">Instances</span>
</a>
<!-- Active State for SteamCMD -->
<a class="flex items-center gap-3 px-4 py-3 bg-surface-container-high border-l-4 border-primary-container text-on-surface transition-colors rounded duration-150 active:scale-95" href="#">
<span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 1;">terminal</span>
<span class="font-body-md">SteamCMD</span>
</a>
<a class="flex items-center gap-3 px-4 py-3 text-on-surface-variant hover:bg-surface-container-highest transition-colors rounded duration-150 active:scale-95" href="#">
<span class="material-symbols-outlined">lan</span>
<span class="font-body-md">Network</span>
</a>
<a class="flex items-center gap-3 px-4 py-3 text-on-surface-variant hover:bg-surface-container-highest transition-colors rounded duration-150 active:scale-95" href="#">
<span class="material-symbols-outlined">settings</span>
<span class="font-body-md">Settings</span>
</a>
</nav>
<div class="p-4 bg-surface-container-lowest/50">
<button class="w-full py-2 bg-primary-container text-on-primary-container font-bold rounded hover:brightness-110 active:scale-95 transition-all">
                New Instance
            </button>
</div>
<footer class="p-4 border-t border-outline-variant space-y-2">
<a class="flex items-center gap-3 px-4 py-2 text-on-surface-variant hover:text-on-surface text-sm" href="#">
<span class="material-symbols-outlined text-sm">help</span>
<span>Docs</span>
</a>
<a class="flex items-center gap-3 px-4 py-2 text-on-surface-variant hover:text-on-surface text-sm" href="#">
<span class="material-symbols-outlined text-sm">contact_support</span>
<span>Support</span>
</a>
</footer>
</aside>
<!-- TopNavBar (Shared Component) -->
<header class="fixed top-0 left-[240px] right-0 h-16 bg-background border-b border-outline-variant flex items-center justify-between px-margin z-40">
<div class="flex items-center gap-6">
<span class="font-display-lg text-display-lg font-black text-primary">FICSIT Remote Management</span>
<div class="h-8 w-[1px] bg-outline-variant"></div>
<nav class="hidden md:flex gap-6">
<a class="text-on-surface-variant hover:text-on-surface font-headline-sm transition-opacity" href="#">Cluster Health</a>
<a class="text-on-surface-variant hover:text-on-surface font-headline-sm transition-opacity" href="#">Metrics</a>
<a class="text-on-surface-variant hover:text-on-surface font-headline-sm transition-opacity" href="#">API Keys</a>
</nav>
</div>
<div class="flex items-center gap-4">
<div class="flex items-center gap-2">
<button class="material-symbols-outlined p-2 text-on-surface-variant hover:text-on-surface transition-colors">notifications</button>
<button class="material-symbols-outlined p-2 text-on-surface-variant hover:text-on-surface transition-colors">account_circle</button>
</div>
<button class="bg-primary-container text-on-primary-container px-4 py-2 font-bold rounded text-sm hover:brightness-110 active:scale-95 transition-all">
                Execute Task
            </button>
</div>
</header>
<!-- Main Content Canvas -->
<main class="ml-[240px] pt-16 min-h-screen p-margin max-w-[1440px]">
<!-- Header Section -->
<div class="flex justify-between items-end mb-8">
<div>
<h2 class="font-headline-md text-headline-md text-on-surface mb-1">SteamCMD Operations</h2>
<p class="text-on-surface-variant">Update, validate, and manage dedicated server binaries via SteamCMD pipeline.</p>
</div>
<div class="flex gap-3">
<span class="bg-tertiary/10 text-tertiary px-3 py-1 rounded flex items-center gap-2 text-xs font-bold border border-tertiary/20">
<span class="w-2 h-2 rounded-full bg-tertiary animate-pulse"></span>
                    SYSTEM LINK ACTIVE
                </span>
</div>
</div>
<div class="grid grid-cols-12 gap-gutter">
<!-- Installation & Update (Bento Main) -->
<section class="col-span-12 lg:col-span-8 space-y-gutter">
<div class="bg-surface-container-low border border-outline-variant rounded p-6 relative overflow-hidden">
<!-- Subtle Background decoration -->
<div class="absolute top-0 right-0 p-8 opacity-5">
<span class="material-symbols-outlined text-9xl">download</span>
</div>
<div class="flex justify-between items-start mb-6 relative z-10">
<div>
<h3 class="font-headline-sm text-headline-sm text-primary-container flex items-center gap-2">
<span class="material-symbols-outlined">install_desktop</span>
                                Installation &amp; Update
                            </h3>
<p class="text-on-surface-variant text-sm">Steam App ID: 1690800 (Satisfactory Dedicated Server)</p>
</div>
<div class="text-right">
<span class="text-xs text-on-surface-variant font-label-caps block mb-1">ESTIMATED REMAINING</span>
<span class="font-headline-sm text-headline-sm text-on-surface">04:12</span>
</div>
</div>
<!-- Progress Bar Component -->
<div class="space-y-4 mb-8 relative z-10">
<div class="flex justify-between items-center text-sm">
<div class="flex items-center gap-4">
<span class="font-bold text-on-surface">Downloading Binaries...</span>
<span class="text-on-surface-variant">9.4 GB / 15.2 GB</span>
</div>
<span class="font-code-sm text-primary-container">62.5%</span>
</div>
<div class="h-4 bg-background border border-outline-variant rounded-full overflow-hidden p-1">
<div class="h-full bg-primary-container rounded-full relative transition-all duration-500 ease-out" style="width: 62.5%">
<div class="absolute inset-0 shimmer-effect"></div>
</div>
</div>
<div class="grid grid-cols-4 gap-4 pt-2">
<div class="bg-background/50 p-3 rounded border border-outline-variant/30">
<span class="text-[10px] text-on-surface-variant font-label-caps block mb-1">DOWNLOAD SPEED</span>
<span class="text-sm font-bold text-on-surface">42.8 MB/s</span>
</div>
<div class="bg-background/50 p-3 rounded border border-outline-variant/30">
<span class="text-[10px] text-on-surface-variant font-label-caps block mb-1">DISK WRITE</span>
<span class="text-sm font-bold text-on-surface">112.4 MB/s</span>
</div>
<div class="bg-background/50 p-3 rounded border border-outline-variant/30">
<span class="text-[10px] text-on-surface-variant font-label-caps block mb-1">PEER COUNT</span>
<span class="text-sm font-bold text-on-surface">8 ACTIVE</span>
</div>
<div class="bg-background/50 p-3 rounded border border-outline-variant/30">
<span class="text-[10px] text-on-surface-variant font-label-caps block mb-1">VALIDATION</span>
<span class="text-sm font-bold text-tertiary">PENDING</span>
</div>
</div>
</div>
<!-- Console: System Pipe -->
<div class="space-y-2 relative z-10">
<div class="flex items-center justify-between px-2">
<span class="text-xs font-label-caps text-on-surface-variant">Live System Pipe (SteamCMD)</span>
<div class="flex gap-2">
<button class="material-symbols-outlined text-sm text-on-surface-variant hover:text-primary transition-colors">content_copy</button>
<button class="material-symbols-outlined text-sm text-on-surface-variant hover:text-primary transition-colors">filter_list</button>
</div>
</div>
<div class="h-[320px] bg-black rounded border border-outline-variant font-code-sm text-code-sm overflow-hidden flex flex-col shadow-inner">
<div class="p-4 overflow-y-auto scrollbar-hide flex-1" id="console-output">
<div class="console-stripe py-1 px-2 text-on-tertiary-fixed-variant opacity-60">[08:42:01] Initializing SteamCMD shell...</div>
<div class="console-stripe py-1 px-2 text-on-tertiary-fixed-variant opacity-60">[08:42:03] Logging in to Steam Public anonymously...</div>
<div class="console-stripe py-1 px-2 text-primary-container">[08:42:05] Update check for AppID 1690800: Update required.</div>
<div class="console-stripe py-1 px-2 text-on-background/80">[08:42:06] Update state: 0x3 (Downloading)</div>
<div class="console-stripe py-1 px-2 text-on-background/80">[08:43:12] Progress: 1.2 GB / 15.2 GB (7.89%)</div>
<div class="console-stripe py-1 px-2 text-on-background/80">[08:45:30] Progress: 4.8 GB / 15.2 GB (31.5%)</div>
<div class="console-stripe py-1 px-2 text-on-background/80">[08:47:44] Progress: 7.1 GB / 15.2 GB (46.7%)</div>
<div class="console-stripe py-1 px-2 text-primary">[08:49:12] High throughput detected - balancing disk cache...</div>
<div class="console-stripe py-1 px-2 text-on-background/80">[08:50:22] Progress: 9.4 GB / 15.2 GB (62.5%)</div>
<div class="console-stripe py-1 px-2 text-on-background font-bold animate-pulse">&gt; Receiving fragment 4128... </div>
</div>
</div>
</div>
<div class="mt-6 flex justify-end gap-3">
<button class="px-6 py-2 border border-outline-variant text-on-surface rounded font-bold hover:bg-surface-container-highest transition-colors active:scale-95">
                            Abort Operation
                        </button>
<button class="px-6 py-2 bg-primary-container text-on-primary-container rounded font-bold hover:brightness-110 transition-all active:scale-95">
                            Restart Task
                        </button>
</div>
</div>
</section>
<!-- Sidebar Telemetry Cards -->
<aside class="col-span-12 lg:col-span-4 space-y-gutter">
<!-- Disk Telemetry -->
<div class="bg-surface-container-low border border-outline-variant rounded p-5">
<div class="flex items-center gap-3 mb-6">
<div class="p-2 bg-primary-container/10 text-primary-container rounded">
<span class="material-symbols-outlined">storage</span>
</div>
<h4 class="font-headline-sm text-headline-sm">Disk Management</h4>
</div>
<div class="space-y-6">
<div>
<div class="flex justify-between text-xs font-label-caps text-on-surface-variant mb-2">
<span>PRIMARY VOLUME (NVME)</span>
<span>82% FULL</span>
</div>
<div class="h-2 bg-background rounded-full overflow-hidden">
<div class="h-full bg-error rounded-full" style="width: 82%"></div>
</div>
</div>
<div class="grid grid-cols-2 gap-4">
<div>
<span class="block text-[10px] text-on-surface-variant font-label-caps">AVAILABLE</span>
<span class="text-lg font-bold text-on-surface">18.4 GB</span>
</div>
<div>
<span class="block text-[10px] text-on-surface-variant font-label-caps">FS TYPE</span>
<span class="text-lg font-bold text-on-surface">EXT4</span>
</div>
</div>
<p class="text-xs text-error p-2 bg-error-container/10 border border-error/20 rounded">
<span class="material-symbols-outlined text-[14px] align-middle mr-1">warning</span>
                            Warning: Low disk space for full validation.
                        </p>
</div>
</div>
<!-- Network Telemetry -->
<div class="bg-surface-container-low border border-outline-variant rounded p-5">
<div class="flex items-center gap-3 mb-6">
<div class="p-2 bg-tertiary/10 text-tertiary rounded">
<span class="material-symbols-outlined">speed</span>
</div>
<h4 class="font-headline-sm text-headline-sm">Network Throughput</h4>
</div>
<div class="h-32 flex items-end gap-1 mb-4">
<!-- Simulated Chart Bars -->
<div class="flex-1 bg-tertiary/30 h-[20%] rounded-t"></div>
<div class="flex-1 bg-tertiary/30 h-[35%] rounded-t"></div>
<div class="flex-1 bg-tertiary/30 h-[60%] rounded-t"></div>
<div class="flex-1 bg-tertiary/30 h-[45%] rounded-t"></div>
<div class="flex-1 bg-tertiary/60 h-[80%] rounded-t"></div>
<div class="flex-1 bg-tertiary/80 h-[95%] rounded-t animate-pulse"></div>
<div class="flex-1 bg-tertiary/80 h-[90%] rounded-t"></div>
<div class="flex-1 bg-tertiary/60 h-[70%] rounded-t"></div>
<div class="flex-1 bg-tertiary/30 h-[40%] rounded-t"></div>
<div class="flex-1 bg-tertiary/30 h-[20%] rounded-t"></div>
</div>
<div class="flex justify-between items-center bg-background/50 p-3 rounded">
<div>
<span class="text-[10px] text-on-surface-variant font-label-caps">CURRENT RX</span>
<span class="block text-md font-bold text-on-surface">342.1 Mbps</span>
</div>
<span class="material-symbols-outlined text-tertiary animate-bounce">arrow_downward</span>
</div>
</div>
<!-- WebSocket Connection -->
<div class="bg-surface-container-low border border-outline-variant rounded p-5">
<div class="flex items-center justify-between mb-4">
<span class="text-xs font-label-caps text-on-surface-variant">WEBSOCKET STATUS</span>
<span class="text-xs font-bold text-tertiary">STABLE</span>
</div>
<div class="flex items-center gap-4">
<div class="w-12 h-12 rounded-full border-2 border-tertiary/20 flex items-center justify-center">
<span class="material-symbols-outlined text-tertiary">sync_alt</span>
</div>
<div>
<span class="block font-bold text-on-surface">wss://ficsit.remote.io</span>
<span class="text-xs text-on-surface-variant">Latency: 12ms | Jitter: 2ms</span>
</div>
</div>
</div>
<!-- Visual Asset Placeholder (The Control Room Aesthetic) -->
<div class="relative h-48 rounded overflow-hidden group">
<img alt="Cyberpunk high tech server room" class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-60" data-alt="A cinematic, high-detail wide shot of a futuristic server room inspired by industrial automation and cyberpunk aesthetics. The room is filled with vertical server racks glowing with amber and orange indicator lights, contrasting against the deep blue and charcoal-gray shadows of the environment. Precise laser-etched panels and heavy metallic piping are visible in the foreground, suggesting a rugged, high-performance computing facility. The atmosphere is dense with a technical, high-security mood." src="https://lh3.googleusercontent.com/aida-public/AB6AXuAxJc-HoBeMuLXUBbqcIIegE4LjhxPKSNlKfVDnwtB6uitAl_qtwbmJnh6Uq6DRhfFE--bM96LZ1Mpgj1gs3vcMlNjpec7RoApeGxMlStlTdDqbTJbRcp8TUA80EJVlngrSQFeRKsefMGzaVr3OOg4uaRhgoTVqigUqlXDRK4kKGushRKEo73JbNWEtT168ydlbpKpu80uwsbhAvgUziEqSv04gbC2DklHCPzRtTq4LhoOFbsFY9BpAUjoFUhEjJT-6RAWXDS4S-w"/>
<div class="absolute inset-0 bg-gradient-to-t from-background to-transparent"></div>
<div class="absolute bottom-4 left-4">
<span class="text-[10px] text-primary-container font-label-caps bg-black/50 px-2 py-1 rounded">LOCAL NODE 01-A</span>
</div>
</div>
</aside>
</div>
</main>
<!-- Micro-interaction Script -->
<script>
        // Simple console auto-scroller simulation
        const consoleEl = document.getElementById('console-output');
        setInterval(() => {
            if (consoleEl) {
                consoleEl.scrollTop = consoleEl.scrollHeight;
            }
        }, 1000);

        // Dynamic speed variation simulation
        const networkDisplay = document.querySelector('span.text-md.font-bold.text-on-surface');
        if (networkDisplay) {
            setInterval(() => {
                const speed = (340 + Math.random() * 10).toFixed(1);
                networkDisplay.innerText = `${speed} Mbps`;
            }, 2000);
        }
    </script>
</body></html>

<!-- FICSIT Cognitive Link Terminal -->
<!DOCTYPE html>

<html class="dark" lang="en"><head>
<meta charset="utf-8"/>
<meta content="width=device-width, initial-scale=1.0" name="viewport"/>
<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&amp;family=JetBrains+Mono:wght@400;700&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<script id="tailwind-config">
        tailwind.config = {
            darkMode: "class",
            theme: {
                extend: {
                    "colors": {
                        "tertiary-container": "#2ec78e",
                        "surface-dim": "#0b1326",
                        "on-primary": "#492900",
                        "on-tertiary-fixed-variant": "#005236",
                        "on-primary-fixed-variant": "#683d00",
                        "on-error-container": "#ffdad6",
                        "tertiary-fixed-dim": "#4edea3",
                        "surface-variant": "#2d3449",
                        "on-secondary-container": "#abb9d1",
                        "error-container": "#93000a",
                        "secondary-container": "#3c4a5e",
                        "tertiary-fixed": "#6ffbbe",
                        "surface-tint": "#ffb86a",
                        "primary-fixed-dim": "#ffb86a",
                        "on-primary-fixed": "#2c1700",
                        "on-primary-container": "#633a00",
                        "on-tertiary-container": "#004d33",
                        "on-tertiary": "#003824",
                        "secondary-fixed-dim": "#b9c7df",
                        "outline": "#a08d7c",
                        "on-surface-variant": "#d8c3b0",
                        "on-surface": "#dae2fd",
                        "surface-container": "#171f33",
                        "on-secondary-fixed-variant": "#3a485b",
                        "surface-bright": "#31394d",
                        "error": "#ffb4ab",
                        "surface-container-lowest": "#060e20",
                        "on-tertiary-fixed": "#002113",
                        "on-secondary-fixed": "#0d1c2e",
                        "inverse-on-surface": "#283044",
                        "surface": "#0b1326",
                        "on-secondary": "#233144",
                        "secondary": "#b9c7df",
                        "primary": "#ffbf7b",
                        "background": "#0b1326",
                        "surface-container-high": "#222a3d",
                        "on-error": "#690005",
                        "on-background": "#dae2fd",
                        "tertiary": "#54e4a8",
                        "outline-variant": "#534436",
                        "secondary-fixed": "#d5e3fc",
                        "inverse-surface": "#dae2fd",
                        "surface-container-highest": "#2d3449",
                        "inverse-primary": "#895200",
                        "surface-container-low": "#131b2e",
                        "primary-fixed": "#ffdcbc",
                        "primary-container": "#f19e38"
                    },
                    "borderRadius": {
                        "DEFAULT": "0px",
                        "lg": "0px",
                        "xl": "0px",
                        "full": "9999px"
                    },
                    "spacing": {
                        "density-compact": "8px",
                        "unit": "4px",
                        "density-comfortable": "16px",
                        "container-max": "1440px",
                        "gutter": "16px",
                        "margin": "24px"
                    },
                    "fontFamily": {
                        "label-caps": ["Inter"],
                        "body-md": ["Inter"],
                        "code-sm": ["JetBrains Mono"],
                        "headline-sm": ["Inter"],
                        "headline-md": ["Inter"],
                        "body-lg": ["Inter"]
                    }
                }
            }
        }
    </script>
<style>
        body {
            background-color: #0b1326;
            color: #dae2fd;
            overflow: hidden;
        }
        .scrollbar-industrial::-webkit-scrollbar {
            width: 4px;
        }
        .scrollbar-industrial::-webkit-scrollbar-track {
            background: #131b2e;
        }
        .scrollbar-industrial::-webkit-scrollbar-thumb {
            background: #534436;
        }
        .scrollbar-industrial::-webkit-scrollbar-thumb:hover {
            background: #ffbf7b;
        }
        .line-numbers {
            border-right: 1px solid #2d3449;
            color: #534436;
        }
        .cursor-blink {
            animation: blink 1s step-end infinite;
        }
        @keyframes blink {
            from, to { opacity: 1; }
            50% { opacity: 0; }
        }
        .hazard-stripe {
            background: repeating-linear-gradient(
                45deg,
                #f19e38,
                #f19e38 10px,
                #000 10px,
                #000 20px
            );
        }
    </style>
</head>
<body class="font-body-md text-body-md h-screen flex flex-col">
<!-- TopAppBar -->
<header class="flex justify-between items-center w-full px-gutter h-16 bg-surface-container-lowest dark:bg-surface-container-lowest border-b border-outline-variant z-50">
<div class="flex items-center gap-4">
<span class="font-headline-md text-headline-md font-bold text-primary tracking-tighter">FICSIT COGNITIVE LINK V3.5</span>
<div class="flex items-center gap-2 bg-surface-container px-3 py-1 border border-outline-variant">
<span class="w-2 h-2 bg-tertiary animate-pulse"></span>
<span class="font-label-caps text-label-caps text-tertiary">AI COGNITIVE SYNC: NOMINAL</span>
</div>
</div>
<div class="hidden md:flex items-center gap-8">
<div class="flex flex-col items-end">
<span class="font-label-caps text-label-caps text-outline">LATENCY: <span class="text-primary">12.4ms</span></span>
<span class="font-label-caps text-label-caps text-outline">TOKENS: <span class="text-primary">1,402/sec</span></span>
</div>
<div class="font-code-sm text-code-sm text-primary bg-surface-container-high px-4 py-2 border border-primary/20" id="utc-clock">
                2024-05-24 14:02:44 UTC
            </div>
<div class="flex gap-4">
<span class="material-symbols-outlined text-primary cursor-pointer active:opacity-80">settings_input_component</span>
<span class="material-symbols-outlined text-primary cursor-pointer active:opacity-80">terminal</span>
<span class="material-symbols-outlined text-primary cursor-pointer active:opacity-80">sensors</span>
</div>
</div>
</header>
<main class="flex flex-1 overflow-hidden">
<!-- SideNavBar / Control Panel -->
<aside class="flex flex-col h-full w-[280px] bg-surface-container dark:bg-surface-container border-r border-outline-variant overflow-y-auto scrollbar-industrial">
<div class="p-gutter border-b border-outline-variant">
<span class="font-label-caps text-label-caps text-primary block mb-4">SYSTEM CALIBRATION</span>
<div class="space-y-6">
<!-- Temperature Control -->
<div class="space-y-2">
<div class="flex justify-between">
<label class="font-label-caps text-label-caps text-on-surface-variant">AI TEMPERATURE</label>
<span class="text-primary font-code-sm text-code-sm">0.78</span>
</div>
<input class="w-full accent-primary bg-surface-container-lowest appearance-none h-1 border border-outline-variant" max="2" min="0" step="0.01" type="range" value="0.78"/>
</div>
<!-- Model Selector -->
<div class="space-y-2">
<label class="font-label-caps text-label-caps text-on-surface-variant">COGNITIVE MODEL</label>
<select class="w-full bg-surface-container-lowest border border-outline-variant text-primary font-code-sm text-code-sm px-2 py-2 outline-none appearance-none">
<option>FICSIT-QUANTUM-L-80B</option>
<option>ADA-COGNITIVE-V2</option>
<option>PIONEER-RECON-7B</option>
</select>
</div>
<!-- Latency Chart -->
<div class="space-y-2">
<label class="font-label-caps text-label-caps text-on-surface-variant">INFERENCE LATENCY (MS)</label>
<div class="h-32 flex items-end gap-1 bg-surface-container-lowest border border-outline-variant p-2">
<div class="bg-tertiary-container w-full" style="height: 40%"></div>
<div class="bg-tertiary-container w-full" style="height: 45%"></div>
<div class="bg-tertiary-container w-full" style="height: 38%"></div>
<div class="bg-primary w-full" style="height: 70%"></div>
<div class="bg-tertiary-container w-full" style="height: 42%"></div>
<div class="bg-tertiary-container w-full" style="height: 35%"></div>
<div class="bg-tertiary-container w-full" style="height: 48%"></div>
</div>
</div>
</div>
</div>
<div class="flex-1 overflow-y-auto">
<nav class="flex flex-col">
<div class="bg-secondary-container text-on-secondary-container border-l-4 border-primary px-4 py-3 flex items-center gap-3 transition-all duration-150 ease-in-out cursor-pointer">
<span class="material-symbols-outlined">analytics</span>
<span class="font-label-caps text-label-caps">TELEMETRY</span>
</div>
<div class="text-on-surface-variant px-4 py-3 flex items-center gap-3 hover:bg-surface-variant hover:text-on-surface transition-all duration-150 ease-in-out cursor-pointer">
<span class="material-symbols-outlined">psychology</span>
<span class="font-label-caps text-label-caps">MODELS</span>
</div>
<div class="text-on-surface-variant px-4 py-3 flex items-center gap-3 hover:bg-surface-variant hover:text-on-surface transition-all duration-150 ease-in-out cursor-pointer">
<span class="material-symbols-outlined">settings_suggest</span>
<span class="font-label-caps text-label-caps">CONTROL</span>
</div>
<div class="text-on-surface-variant px-4 py-3 flex items-center gap-3 hover:bg-surface-variant hover:text-on-surface transition-all duration-150 ease-in-out cursor-pointer">
<span class="material-symbols-outlined">shield</span>
<span class="font-label-caps text-label-caps">SECURITY</span>
</div>
<div class="text-on-surface-variant px-4 py-3 flex items-center gap-3 hover:bg-surface-variant hover:text-on-surface transition-all duration-150 ease-in-out cursor-pointer">
<span class="material-symbols-outlined">memory</span>
<span class="font-label-caps text-label-caps">SYSTEM</span>
</div>
</nav>
</div>
<div class="p-gutter border-t border-outline-variant bg-surface-container-low">
<div class="flex items-center gap-3 mb-2">
<img alt="FICSIT OS LOGO" class="w-8 h-8 border border-primary/40 p-1" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDyHf5oFqZWas20xPxWSfHdFBWtg_odR_EnK7dN15_j5eBqblhTl7qwZYN7VpsH5WowgoGZAAUb-RSp40qhZS9RdTPjSieaaj0U2T0j0ngSNMqOZKxaYQtJt01DAHJUQ_UEKHd4oK-mVhkq6LQ4nTL2QZ5oFJdXa4hO1VLMXzHaKKbs_6OyKdz1bF2IaXED3Ki9-MJBG6Ti0pnwVZlJrIRMJkB6_UfTS6NzJoGN8OjNYWU7d_s0jEzi5scDVEaqp3dTQndQcC91Xw"/>
<div>
<div class="font-label-caps text-label-caps text-primary">FICSIT TERMINAL</div>
<div class="text-[10px] text-outline">v4.2.0-STABLE</div>
</div>
</div>
</div>
</aside>
<!-- Central Workspace -->
<section class="flex-1 flex flex-col bg-surface relative">

<!-- Terminal Header -->
<div class="bg-surface-container-high px-4 py-2 border-b border-outline-variant flex justify-between items-center z-10">
<div class="flex items-center gap-4">
<span class="font-label-caps text-label-caps text-on-surface-variant">CONSTRUCT_LOG_012.FCT</span>
<span class="text-[10px] bg-primary/10 text-primary px-2 py-0.5 border border-primary/20">RW</span>
</div>
<div class="flex gap-2">
<span class="w-2 h-2 rounded-full bg-error/40"></span>
<span class="w-2 h-2 rounded-full bg-primary/40"></span>
<span class="w-2 h-2 rounded-full bg-tertiary/40"></span>
</div>
</div>
<!-- Terminal Area -->
<div class="flex-1 overflow-y-auto scrollbar-industrial bg-[#020617] font-code-sm text-code-sm p-4 relative z-10 flex" id="terminal-content">
<div class="line-numbers flex flex-col pr-4 text-right select-none h-full">
<span>001</span>
<span>002</span>
<span>003</span>
<span>004</span>
<span>005</span>
<span>006</span>
<span>007</span>
<span>008</span>
<span>009</span>
<span>010</span>
</div>
<div class="flex-1 pl-4 space-y-1">
<div class="flex gap-2 text-outline">
<span class="text-tertiary font-bold">[AI-RECON-SYNC]</span>
<span>Connection established. FICSIT Primary Node responding...</span>
</div>
<div class="flex gap-2 text-outline">
<span class="text-tertiary font-bold">[AI-RECON-SYNC]</span>
<span>Handshake verified. Decryption protocols active.</span>
</div>
<div class="mt-4 p-3 bg-primary/5 border-l-2 border-primary">
<span class="text-primary font-bold">USER:</span> <span class="text-on-surface">Initiate status check on Heavy Modular Frame production line 04. Provide efficiency metrics and thermal constraints.</span>
</div>
<div class="flex gap-2 text-outline mt-4">
<span class="text-primary font-bold">[AI-RECON-SYNC]</span>
<span>Retrieving production data...</span>
</div>
<div class="text-on-surface-variant pl-4">
<div class="grid grid-cols-2 gap-4 max-w-md my-4 p-4 border border-outline-variant bg-surface-container">
<span class="text-outline">EFFICIENCY:</span> <span class="text-tertiary">98.4%</span>
<span class="text-outline">THERMAL_LOAD:</span> <span class="text-error">72.1°C</span>
<span class="text-outline">OUTPUT_RATE:</span> <span class="text-primary">2.81/min</span>
<span class="text-outline">STABILITY:</span> <span class="text-tertiary">NOMINAL</span>
</div>
</div>
<div class="flex gap-2 text-outline">
<span class="text-primary font-bold">[AI-RECON-SYNC]</span>
<span class="animate-pulse">Awaiting further instruction_</span>
</div>
</div>
</div>
<!-- Bottom Dock -->
<div class="p-gutter bg-surface-container-lowest border-t border-outline-variant z-10">
<div class="flex items-center gap-4 bg-[#020617] border border-outline-variant p-1 pr-4">
<div class="bg-primary px-3 py-2 text-[#020617] font-label-caps text-label-caps font-bold">
                        ficsit-ai://sys-shell_
                    </div>
<input class="flex-1 bg-transparent border-none outline-none text-primary font-code-sm text-code-sm focus:ring-0" placeholder="Enter cognitive command or query parameter..." type="text"/>
<div class="flex items-center gap-4">
<span class="w-3 h-5 bg-primary cursor-blink"></span>
<div class="flex gap-2">
<span class="material-symbols-outlined text-outline hover:text-primary transition-colors cursor-pointer" title="Execute">play_arrow</span>
<span class="material-symbols-outlined text-outline hover:text-primary transition-colors cursor-pointer" title="Save Log">save</span>
<span class="material-symbols-outlined text-outline hover:text-error transition-colors cursor-pointer" title="Abort">cancel</span>
</div>
</div>
</div>
</div>
</section>
<!-- Right System Panel (Additional Dashboard for "High End UI") -->
<aside class="hidden xl:flex flex-col w-[320px] bg-surface-container-high border-l border-outline-variant p-4 gap-6 scrollbar-industrial overflow-y-auto">
<div class="space-y-4">
<div class="flex items-center justify-between border-b border-outline-variant pb-2">
<span class="font-label-caps text-label-caps text-primary">REAL-TIME TELEMETRY</span>
<span class="material-symbols-outlined text-outline text-sm">more_vert</span>
</div>
<!-- Bento Style Widgets -->
<div class="grid grid-cols-2 gap-3">
<div class="col-span-2 bg-surface-container-highest border border-outline-variant p-3">
<div class="text-[10px] text-outline mb-1">COGNITIVE LOAD</div>
<div class="flex items-end justify-between">
<span class="text-2xl font-code-sm text-primary">82%</span>
<div class="flex gap-1 h-8 items-end pb-1">
<div class="w-1 bg-tertiary" style="height: 20%"></div>
<div class="w-1 bg-tertiary" style="height: 40%"></div>
<div class="w-1 bg-tertiary" style="height: 60%"></div>
<div class="w-1 bg-primary" style="height: 100%"></div>
</div>
</div>
</div>
<div class="bg-surface-container-highest border border-outline-variant p-3">
<div class="text-[10px] text-outline mb-1">MEMORY</div>
<div class="text-xl font-code-sm text-tertiary">42.1GB</div>
</div>
<div class="bg-surface-container-highest border border-outline-variant p-3">
<div class="text-[10px] text-outline mb-1">THREADS</div>
<div class="text-xl font-code-sm text-tertiary">1,024</div>
</div>
</div>
<div class="border border-outline-variant p-4 space-y-3">
<div class="flex justify-between items-center">
<span class="font-label-caps text-label-caps text-on-surface-variant">ACTIVE NODES</span>
<span class="text-primary text-[10px]">12 ACTIVE</span>
</div>
<div class="space-y-2">
<div class="flex items-center gap-3">
<div class="w-1 h-8 bg-tertiary"></div>
<div class="flex-1">
<div class="text-[11px] font-bold">NODE_001_HQ</div>
<div class="w-full bg-surface-container-lowest h-1">
<div class="bg-tertiary h-full" style="width: 85%"></div>
</div>
</div>
</div>
<div class="flex items-center gap-3">
<div class="w-1 h-8 bg-tertiary"></div>
<div class="flex-1">
<div class="text-[11px] font-bold">NODE_014_ORE</div>
<div class="w-full bg-surface-container-lowest h-1">
<div class="bg-tertiary h-full" style="width: 42%"></div>
</div>
</div>
</div>
<div class="flex items-center gap-3 opacity-50">
<div class="w-1 h-8 bg-outline"></div>
<div class="flex-1">
<div class="text-[11px] font-bold">NODE_088_PWR</div>
<div class="w-full bg-surface-container-lowest h-1">
<div class="bg-outline h-full" style="width: 0%"></div>
</div>
</div>
</div>
</div>
</div>
<!-- Industrial Banner -->
<div class="relative overflow-hidden h-24 border border-outline-variant group">
<div class="absolute inset-0 hazard-stripe opacity-10 group-hover:opacity-20 transition-opacity"></div>
<div class="relative z-10 p-4 h-full flex flex-col justify-center">
<span class="text-[10px] font-bold text-primary">SYSTEM WARNING</span>
<span class="text-sm font-bold uppercase leading-tight">Thermal overload protocols active.</span>
</div>
<div class="absolute right-2 bottom-2">
<span class="material-symbols-outlined text-primary/40 text-4xl">warning</span>
</div>
</div>
<!-- Visualization -->
<div class="h-40 border border-outline-variant relative bg-surface">
<div class="absolute inset-0 flex items-center justify-center">

</div>
<div class="absolute top-2 left-2 text-[10px] text-outline">COGNITIVE_MESH_VIZ</div>
</div>
</div>
</aside>
</main>
<!-- Footer Stats / Small Dock -->
<footer class="h-8 bg-surface-container-lowest border-t border-outline-variant flex items-center justify-between px-gutter font-code-sm text-[10px] text-outline overflow-hidden">
<div class="flex items-center gap-6">
<div class="flex items-center gap-2">
<span class="w-2 h-2 rounded-full bg-tertiary"></span>
<span>OS_STATUS: STABLE</span>
</div>
<div class="flex items-center gap-2">
<span class="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
<span>SYNC_WAVE: 144Hz</span>
</div>
<div class="flex items-center gap-2">
<span>ENCRYPTION: AES-4096-QUANTUM</span>
</div>
</div>
<div class="flex items-center gap-4">
<span class="hover:text-primary cursor-pointer transition-colors">SUPPORT</span>
<span class="hover:text-primary cursor-pointer transition-colors">REBOOT_SYS</span>
<div class="bg-outline-variant h-8 w-[1px]"></div>
<span class="text-primary font-bold">FICSIT-INC-PROPRIETARY-2024</span>
</div>
</footer>
<script>
        // Simple Clock Update
        function updateClock() {
            const now = new Date();
            const utc = now.toISOString().replace('T', ' ').substring(0, 19) + ' UTC';
            document.getElementById('utc-clock').textContent = utc;
        }
        setInterval(updateClock, 1000);
        updateClock();

        // Dynamic Line Number Generation
        const terminal = document.getElementById('terminal-content');
        const lineContainer = terminal.querySelector('.line-numbers');
        function updateLineNumbers() {
            const lineCount = Math.floor(terminal.scrollHeight / 20) + 10;
            let lines = '';
            for (let i = 1; i <= lineCount; i++) {
                lines += `<span>${String(i).padStart(3, '0')}</span>`;
            }
            lineContainer.innerHTML = lines;
        }
        updateLineNumbers();
        window.addEventListener('resize', updateLineNumbers);

        // Simple typing interaction mock
        const terminalBody = terminal.querySelector('.flex-1');
        const mainInput = document.querySelector('input[type="text"]');
        
        mainInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter' && this.value.trim() !== '') {
                const val = this.value;
                const userMsg = document.createElement('div');
                userMsg.className = 'mt-4 p-3 bg-primary/5 border-l-2 border-primary';
                userMsg.innerHTML = `<span class="text-primary font-bold">USER:</span> <span class="text-on-surface">${val}</span>`;
                terminalBody.appendChild(userMsg);
                
                const aiResponse = document.createElement('div');
                aiResponse.className = 'flex gap-2 text-outline mt-2';
                aiResponse.innerHTML = `<span class="text-tertiary font-bold">[AI-RECON-SYNC]</span> <span class="animate-pulse">Processing request for "${val}"...</span>`;
                terminalBody.appendChild(aiResponse);
                
                this.value = '';
                terminal.scrollTop = terminal.scrollHeight;
                updateLineNumbers();

                setTimeout(() => {
                   aiResponse.querySelector('span:last-child').classList.remove('animate-pulse');
                   aiResponse.querySelector('span:last-child').textContent = `Action "${val}" acknowledged. Data integrity validated at 99.98%.`;
                   terminal.scrollTop = terminal.scrollHeight;
                }, 1500);
            }
        });
    </script>
</body></html>
