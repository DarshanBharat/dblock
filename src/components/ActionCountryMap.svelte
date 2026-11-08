<script lang="ts">
  import {
    MapPin,
    AlertTriangle,
    ShieldAlert,
    Clock,
    CheckCircle2,
    Maximize2,
    Minimize2,
    ZoomIn,
    ZoomOut,
    RotateCcw,
    Globe,
    Layers,
    Filter,
    ExternalLink
  } from '@lucide/svelte';

  export let actions: any[] = [];
  export let sites: any[] = [];
  export let selectedCountry: string = 'all';
  export let selectedActionId: string | null = null;
  export let onSelectCountry: (country: string) => void;
  export let onSelectAction: (actionId: string) => void;

  let isFullscreen = false;
  let hoveredSite: any = null;
  let zoomLevel = 1;
  let panX = 0;
  let panY = 0;

  // Site coordinates map
  const siteGeoMap: Record<string, { lat: number; lng: number; city: string; country: string; countryCode: string; flag: string }> = {
    'Site 104': { lat: 42.3601, lng: -71.0589, city: 'Boston', country: 'United States', countryCode: 'US', flag: '🇺🇸' },
    'Site 208': { lat: 41.8781, lng: -87.6298, city: 'Chicago', country: 'United States', countryCode: 'US', flag: '🇺🇸' },
    'Site 317': { lat: 52.5200, lng: 13.4050, city: 'Berlin', country: 'Germany', countryCode: 'DE', flag: '🇩🇪' },
    'Site 405': { lat: 37.5665, lng: 126.9780, city: 'Seoul', country: 'South Korea', countryCode: 'KR', flag: '🇰🇷' },
    'Site 502': { lat: -37.8136, lng: 144.9631, city: 'Melbourne', country: 'Australia', countryCode: 'AU', flag: '🇦🇺' },
    'Site 608': { lat: 43.6532, lng: -79.3832, city: 'Toronto', country: 'Canada', countryCode: 'CA', flag: '🇨🇦' },
    'Site 722': { lat: 48.8566, lng: 2.3522, city: 'Paris', country: 'France', countryCode: 'FR', flag: '🇫🇷' },
    'Site 815': { lat: 40.4168, lng: -3.7038, city: 'Madrid', country: 'Spain', countryCode: 'ES', flag: '🇪🇸' }
  };

  // Convert lat/lng to SVG Mercator projection coordinates (SVG 960 x 480)
  function project(lat: number, lng: number) {
    const x = ((lng + 180) * (960 / 360));
    const latRad = (lat * Math.PI) / 180;
    const mercN = Math.log(Math.tan(Math.PI / 4 + latRad / 2));
    const y = (480 / 2) - ((960 * mercN) / (2 * Math.PI));
    return {
      x: Math.max(20, Math.min(940, x)),
      y: Math.max(30, Math.min(450, y * 0.88 + 50))
    };
  }

  // Aggregate actions by site
  $: siteActionGroups = (() => {
    const map = new Map<string, { siteName: string; siteId: string; geo: any; actions: any[]; maxPriority: string; delaySaved: number }>();
    
    for (const a of actions) {
      const siteKey = a.site || a.scope;
      if (!siteKey || siteKey === 'Study-wide' || siteKey.includes('Multiple')) continue;
      
      const geo = siteGeoMap[siteKey] || { lat: 30, lng: 0, city: 'Unknown', country: 'Global', countryCode: 'GL', flag: '🌐' };
      
      if (!map.has(siteKey)) {
        map.set(siteKey, {
          siteName: siteKey,
          siteId: siteKey.replace('Site ', ''),
          geo,
          actions: [],
          maxPriority: 'Low',
          delaySaved: 0
        });
      }
      
      const group = map.get(siteKey)!;
      group.actions.push(a);
      group.delaySaved += (a.estImpactDays || a.daysSaved || 0);
      
      if (a.priority === 'Critical') group.maxPriority = 'Critical';
      else if (a.priority === 'High' && group.maxPriority !== 'Critical') group.maxPriority = 'High';
      else if (a.priority === 'Medium' && group.maxPriority !== 'Critical' && group.maxPriority !== 'High') group.maxPriority = 'Medium';
    }

    return Array.from(map.values());
  })();

  // Filtered site groups by selected country
  $: visibleSiteGroups = siteActionGroups.filter(g => {
    if (selectedCountry === 'all') return true;
    return g.geo.countryCode === selectedCountry || g.geo.country.toLowerCase() === selectedCountry.toLowerCase();
  });

  // Country summary metrics
  const countrySummaries = [
    { code: 'all', name: 'All Countries', flag: '🌐', count: 12, critical: 5 },
    { code: 'US', name: 'United States', flag: '🇺🇸', count: 4, critical: 2 },
    { code: 'DE', name: 'Germany', flag: '🇩🇪', count: 2, critical: 0 },
    { code: 'KR', name: 'South Korea', flag: '🇰🇷', count: 1, critical: 0 },
    { code: 'FR', name: 'France', flag: '🇫🇷', count: 1, critical: 0 },
    { code: 'ES', name: 'Spain', flag: '🇪🇸', count: 1, critical: 0 },
    { code: 'AU', name: 'Australia', flag: '🇦🇺', count: 1, critical: 0 },
    { code: 'global', name: 'Study-wide', flag: '🌐', count: 2, critical: 1 }
  ];

  function getPriorityColor(priority: string) {
    if (priority === 'Critical') return { bg: '#e11d48', ring: '#f43f5e', text: '#ffffff' };
    if (priority === 'High') return { bg: '#d97706', ring: '#f59e0b', text: '#ffffff' };
    if (priority === 'Medium') return { bg: '#2563eb', ring: '#3b82f6', text: '#ffffff' };
    return { bg: '#059669', ring: '#10b981', text: '#ffffff' };
  }

  function handleZoomIn() {
    zoomLevel = Math.min(2.5, zoomLevel + 0.25);
  }

  function handleZoomOut() {
    zoomLevel = Math.max(1, zoomLevel - 0.25);
    if (zoomLevel === 1) {
      panX = 0;
      panY = 0;
    }
  }

  function resetZoom() {
    zoomLevel = 1;
    panX = 0;
    panY = 0;
  }
</script>

<div class="space-y-3">
  
  <!-- Country Action Filter Pills Bar -->
  <div class="flex items-center justify-between gap-2 flex-wrap bg-white p-2.5 rounded-xl border border-slate-200 shadow-xs text-xs">
    <div class="flex items-center space-x-1.5 overflow-x-auto pb-1 sm:pb-0">
      <span class="text-[11px] font-bold text-slate-500 uppercase tracking-wider mr-1 flex items-center space-x-1">
        <Globe size={13} class="text-blue-600" />
        <span>Country:</span>
      </span>
      {#each countrySummaries as c}
        <button
          type="button"
          on:click={() => onSelectCountry(c.code)}
          class="px-2.5 py-1 rounded-lg font-semibold flex items-center space-x-1.5 transition-all cursor-pointer whitespace-nowrap {selectedCountry === c.code ? 'bg-blue-600 text-white shadow-xs' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'}"
        >
          <span>{c.flag}</span>
          <span>{c.name}</span>
          <span class="text-[10px] px-1 py-0.2 rounded font-mono font-bold {selectedCountry === c.code ? 'bg-blue-800 text-white' : 'bg-white text-slate-600'}">
            {c.count}
          </span>
          {#if c.critical > 0}
            <span class="w-1.5 h-1.5 rounded-full bg-rose-500" title="{c.critical} Critical actions"></span>
          {/if}
        </button>
      {/each}
    </div>

    <!-- Right: Map Controls -->
    <div class="flex items-center space-x-1 text-slate-600 shrink-0">
      <button
        type="button"
        on:click={handleZoomIn}
        class="p-1.5 hover:bg-slate-100 rounded text-slate-700 transition-colors cursor-pointer"
        title="Zoom In"
      >
        <ZoomIn size={14} />
      </button>
      <button
        type="button"
        on:click={handleZoomOut}
        class="p-1.5 hover:bg-slate-100 rounded text-slate-700 transition-colors cursor-pointer"
        title="Zoom Out"
      >
        <ZoomOut size={14} />
      </button>
      <button
        type="button"
        on:click={resetZoom}
        class="p-1.5 hover:bg-slate-100 rounded text-slate-700 transition-colors cursor-pointer"
        title="Reset Map View"
      >
        <RotateCcw size={14} />
      </button>
    </div>
  </div>

  <!-- Main Map Container -->
  <div class="relative w-full rounded-2xl overflow-hidden border border-slate-200 shadow-md bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 text-white">
    
    <!-- Top-Left Floating Map Header -->
    <div class="absolute top-3.5 left-4 z-20 pointer-events-none flex items-center space-x-3">
      <div class="bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-700/80 text-xs shadow-lg flex items-center space-x-2">
        <span class="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
        <span class="font-bold text-white tracking-wide">Action Geographic Distribution</span>
        <span class="text-slate-400">|</span>
        <span class="text-[11px] text-slate-300">
          Showing <strong>{visibleSiteGroups.length}</strong> active action sites
        </span>
      </div>
    </div>

    <!-- Top-Right Legend -->
    <div class="absolute top-3.5 right-4 z-20 pointer-events-none hidden sm:flex items-center space-x-3 bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-700/80 text-[11px] font-semibold text-slate-300 shadow-lg">
      <span class="flex items-center space-x-1">
        <span class="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse"></span>
        <span>Critical Action</span>
      </span>
      <span class="flex items-center space-x-1">
        <span class="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
        <span>High Priority</span>
      </span>
      <span class="flex items-center space-x-1">
        <span class="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
        <span>Medium Priority</span>
      </span>
    </div>

    <!-- Responsive SVG World Map Canvas -->
    <div class="w-full h-[360px] sm:h-[400px] overflow-hidden cursor-crosshair relative">
      <svg
        viewBox="0 0 960 480"
        class="w-full h-full select-none transition-transform duration-300 ease-out"
        style="transform: scale({zoomLevel}) translate({panX}px, {panY}px);"
      >
        <defs>
          <!-- Grid Pattern -->
          <pattern id="world-grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.04)" stroke-width="1" />
          </pattern>
          <!-- Radial gradient for continents glow -->
          <radialGradient id="land-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stop-color="#334155" stop-opacity="0.8" />
            <stop offset="100%" stop-color="#1e293b" stop-opacity="0.6" />
          </radialGradient>
        </defs>

        <!-- Ocean Background with Lat/Long Grid -->
        <rect width="960" height="480" fill="#0f172a" />
        <rect width="960" height="480" fill="url(#world-grid)" />

        <!-- Equator and Prime Meridian Subtle Guidelines -->
        <line x1="0" y1="240" x2="960" y2="240" stroke="rgba(255,255,255,0.08)" stroke-dasharray="4,4" stroke-width="1" />
        <line x1="480" y1="0" x2="480" y2="480" stroke="rgba(255,255,255,0.08)" stroke-dasharray="4,4" stroke-width="1" />

        <!-- Simplified Accurate Continents Landmass Shapes -->
        <g fill="url(#land-glow)" stroke="#475569" stroke-width="0.75" opacity="0.85">
          <!-- North America (US, Canada, Mexico) -->
          <path d="M 120 70 L 220 50 L 320 60 L 300 130 L 250 160 L 270 210 L 240 230 L 210 200 L 170 180 L 150 140 L 110 110 Z" />
          <!-- Central America -->
          <path d="M 240 230 L 270 260 L 290 280 L 270 290 L 250 260 Z" />
          <!-- South America -->
          <path d="M 280 280 L 370 310 L 360 380 L 320 440 L 290 400 L 260 320 Z" />
          <!-- Europe (UK, France, Germany, Spain, etc.) -->
          <path d="M 460 70 L 530 60 L 550 120 L 520 160 L 470 170 L 450 140 L 440 100 Z" />
          <!-- Scandinavia / North -->
          <path d="M 490 30 L 530 40 L 520 80 L 480 70 Z" />
          <!-- Africa -->
          <path d="M 460 180 L 550 180 L 580 260 L 530 380 L 490 380 L 460 270 L 440 200 Z" />
          <!-- Asia (Russia, China, South Korea, India, etc.) -->
          <path d="M 540 60 L 780 60 L 850 120 L 820 220 L 740 260 L 680 230 L 600 200 L 550 130 Z" />
          <!-- South Korea & Japan Arc -->
          <path d="M 790 160 L 820 170 L 810 210 L 780 190 Z" />
          <!-- Australia -->
          <path d="M 760 330 L 860 320 L 870 390 L 810 420 L 750 380 Z" />
          <!-- New Zealand -->
          <path d="M 880 400 L 900 400 L 890 430 Z" />
        </g>

        <!-- Country Labels Subtle -->
        <text x="210" y="145" fill="rgba(255,255,255,0.25)" font-size="11" font-weight="700" text-anchor="middle">UNITED STATES</text>
        <text x="495" y="130" fill="rgba(255,255,255,0.25)" font-size="9" font-weight="700" text-anchor="middle">EUROPE</text>
        <text x="750" y="160" fill="rgba(255,255,255,0.25)" font-size="10" font-weight="700" text-anchor="middle">ASIA</text>
        <text x="810" y="375" fill="rgba(255,255,255,0.25)" font-size="10" font-weight="700" text-anchor="middle">AUSTRALIA</text>

        <!-- Render Action Markers -->
        {#each visibleSiteGroups as group}
          {@const pos = project(group.geo.lat, group.geo.lng)}
          {@const colors = getPriorityColor(group.maxPriority)}
          {@const isCritical = group.maxPriority === 'Critical'}
          {@const isHovered = hoveredSite?.siteName === group.siteName}
          {@const isSelected = selectedActionId && group.actions.some(a => a.id === selectedActionId)}

          <g
            class="cursor-pointer group"
            on:mouseenter={() => hoveredSite = group}
            on:mouseleave={() => hoveredSite = null}
            on:click={() => {
              if (group.actions.length > 0) {
                onSelectAction(group.actions[0].id);
              }
            }}
          >
            <!-- Outer Pulse Wave for Critical Sites (Boston, etc.) -->
            {#if isCritical}
              <circle
                cx={pos.x}
                cy={pos.y}
                r={isHovered ? 26 : 20}
                fill="none"
                stroke={colors.ring}
                stroke-width="2"
                opacity="0.8"
                class="animate-ping"
              />
            {/if}

            <!-- Glow Halo -->
            <circle
              cx={pos.x}
              cy={pos.y}
              r={isSelected ? 18 : isHovered ? 16 : 13}
              fill={colors.bg}
              opacity={isSelected ? 0.45 : isHovered ? 0.35 : 0.2}
            />

            <!-- Main Marker Core Circle -->
            <circle
              cx={pos.x}
              cy={pos.y}
              r={isSelected ? 13 : isHovered ? 12 : 10}
              fill={colors.bg}
              stroke="#ffffff"
              stroke-width={isSelected ? 2.5 : 1.8}
              class="transition-all duration-150 drop-shadow-md"
            />

            <!-- Action Count Badge Text inside Circle -->
            <text
              x={pos.x}
              y={pos.y + 3.5}
              fill="#ffffff"
              font-size="9"
              font-weight="800"
              text-anchor="middle"
              pointer-events="none"
            >
              {group.actions.length}
            </text>

            <!-- Permanent Callout Badge for Boston Site 104 (Key Critical Blocker) -->
            {#if group.siteId === '104' && !isHovered}
              <g transform="translate({pos.x + 14}, {pos.y - 28})">
                <rect
                  width="135"
                  height="34"
                  rx="6"
                  fill="#1e293b"
                  stroke="#f43f5e"
                  stroke-width="1.2"
                  filter="drop-shadow(0 4px 6px rgba(0,0,0,0.4))"
                />
                <text x="8" y="14" fill="#ffffff" font-size="10" font-weight="800">
                  Site 104 &middot; Boston (US)
                </text>
                <text x="8" y="26" fill="#f43f5e" font-size="9" font-weight="700">
                  2 Critical Actions (-4.8d)
                </text>
              </g>
            {/if}

            <!-- Location Label under marker -->
            <text
              x={pos.x}
              y={pos.y + 19}
              fill="#cbd5e1"
              font-size="9"
              font-weight="600"
              text-anchor="middle"
              class="drop-shadow-sm pointer-events-none"
            >
              {group.geo.flag} {group.geo.city}
            </text>
          </g>
        {/each}
      </svg>

      <!-- Floating Interactive Tooltip when hovering any marker -->
      {#if hoveredSite}
        {@const pos = project(hoveredSite.geo.lat, hoveredSite.geo.lng)}
        <div
          class="absolute z-30 pointer-events-auto bg-slate-900/95 backdrop-blur-md text-white rounded-xl p-3.5 shadow-2xl border border-slate-700 w-72 text-xs transition-all"
          style="left: {Math.min(pos.x - 20, 680)}px; top: {Math.max(pos.y - 140, 20)}px;"
        >
          <div class="flex items-center justify-between pb-2 border-b border-slate-800">
            <div class="flex items-center space-x-1.5 font-bold text-slate-100">
              <span class="text-base">{hoveredSite.geo.flag}</span>
              <span>{hoveredSite.siteName}</span>
              <span class="text-slate-400 font-normal">({hoveredSite.geo.city})</span>
            </div>
            <span class="px-2 py-0.5 rounded text-[10px] font-bold {hoveredSite.maxPriority === 'Critical' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'}">
              {hoveredSite.maxPriority}
            </span>
          </div>

          <div class="py-2 space-y-1.5">
            <div class="text-[11px] text-slate-300 font-medium">
              <strong>{hoveredSite.actions.length}</strong> Recommended Action{hoveredSite.actions.length > 1 ? 's' : ''}:
            </div>
            {#each hoveredSite.actions as act}
              <button
                type="button"
                on:click={() => onSelectAction(act.id)}
                class="w-full text-left p-1.5 rounded bg-slate-800/80 hover:bg-blue-900/40 border border-slate-700/60 hover:border-blue-500 transition-colors flex items-center justify-between group cursor-pointer"
              >
                <div class="truncate mr-2">
                  <div class="font-bold text-[11px] text-slate-200 group-hover:text-blue-300 truncate">{act.title}</div>
                  <div class="text-[10px] text-slate-400">{act.id} &middot; {act.owner}</div>
                </div>
                <span class="font-bold font-mono text-emerald-400 text-[11px] shrink-0">
                  {act.delayImpact || `-${act.daysSaved}d`}
                </span>
              </button>
            {/each}
          </div>

          <div class="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
            <span>Potential lock savings:</span>
            <strong class="text-emerald-400 font-mono font-bold">-{hoveredSite.delaySaved.toFixed(1)} days</strong>
          </div>
        </div>
      {/if}

    </div>

    <!-- Bottom Map Bar: Country Breakdown Cards -->
    <div class="p-3 bg-slate-950/90 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
      <div class="flex items-center space-x-2 text-slate-400">
        <MapPin size={13} class="text-rose-400" />
        <span>Click on any country pin to highlight its pending clinical actions in the workbench below.</span>
      </div>

      <div class="flex items-center space-x-3 text-[11px]">
        <span class="text-slate-400">Total Delay Avoidance Potential:</span>
        <span class="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-mono font-bold">
          -6.2 days
        </span>
      </div>
    </div>

  </div>

</div>
