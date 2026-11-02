<script lang="ts">
  import {
    ArrowRight,
    Search,
    MapPin,
    BarChart3,
    Table,
    Download,
    AlertTriangle,
    CheckCircle2,
    Clock,
    Building2,
    FileText,
    Filter,
    ShieldAlert,
    ExternalLink,
    X,
    Sparkles,
    ChevronRight,
    Info
  } from '@lucide/svelte';

  export let sites: any[];
  export let subjects: any[];
  export let dimensions: any[];
  export let onSelectSite: (id: string) => void;
  export let onSelectTab: (tab: string) => void;

  // View mode
  let viewMode = 'map'; // 'map' | 'chart' | 'table'
  let viewByMetric = 'impact'; // 'impact' | 'probability' | 'volume'
  let riskTierFilter = 'all'; // 'all' | 'critical' | 'high' | 'medium' | 'low'
  let searchQuery = '';

  // Drawer state
  let activeSite: any = null;
  let drawerTab = 'why'; // 'why' | 'evidence' | 'actions'

  // Map zoom
  let mapZoom = 1;

  // Auto-select site 104 initially if none is selected
  function openSiteDrawer(site: any) {
    activeSite = site;
    drawerTab = 'why';
  }

  function closeDrawer() {
    activeSite = null;
  }

  // Filtered sites
  $: filteredSites = sites.filter(s => {
    if (riskTierFilter === 'critical' && s.riskLevel !== 'Critical') return false;
    if (riskTierFilter === 'high' && s.riskLevel !== 'High') return false;
    if (riskTierFilter === 'medium' && s.riskLevel !== 'Medium') return false;
    if (riskTierFilter === 'low' && s.riskLevel !== 'Low') return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return s.id.toLowerCase().includes(q) ||
        s.name.toLowerCase().includes(q) ||
        s.country.toLowerCase().includes(q) ||
        s.city.toLowerCase().includes(q);
    }
    return true;
  });

  // Sort sites
  $: sortedSites = [...filteredSites].sort((a, b) => {
    if (viewByMetric === 'impact') {
      return b.maxDelayDays - a.maxDelayDays;
    }
    if (viewByMetric === 'probability') {
      return b.riskProbability - a.riskProbability;
    }
    return b.openItems - a.openItems;
  });

  function getRiskBadge(level: string) {
    if (level === 'Critical') return 'bg-rose-100 text-rose-800 border-rose-200';
    if (level === 'High') return 'bg-amber-100 text-amber-800 border-amber-200';
    if (level === 'Medium') return 'bg-orange-100 text-orange-800 border-orange-200';
    return 'bg-emerald-100 text-emerald-800 border-emerald-200';
  }

  function getSparklinePoints(trend: number[]) {
    if (!trend || trend.length < 2) return '';
    const min = Math.min(...trend) - 5;
    const max = Math.max(...trend) + 5;
    const range = max - min || 1;
    const width = 50;
    const height = 16;
    return trend.map((val, idx) => {
      const x = (idx / (trend.length - 1)) * width;
      const y = height - ((val - min) / range) * height;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(' ');
  }

  // World map coordinates normalized to SVG viewBox 0 0 800 400
  function mapCoords(lat: number, lng: number) {
    const x = ((lng + 180) / 360) * 800;
    const y = ((90 - lat) / 180) * 400;
    return { x, y };
  }
</script>

<div class="space-y-6">

  <!-- ========================================================================= -->
  <!-- HERO BANNER: SITES & RISKS                                                -->
  <!-- ========================================================================= -->
  <div class="rounded-2xl bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950 text-white p-6 shadow-md border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
    <div>
      <span class="text-[10px] font-extrabold uppercase tracking-widest text-blue-300">
        PRIORITISE WHERE IT MATTERS
      </span>
      <h1 class="text-2xl sm:text-3xl font-extrabold text-white mt-1 tracking-tight">
        Sites &amp; risks
      </h1>
      <p class="text-xs sm:text-sm text-slate-300 mt-1.5 leading-relaxed">
        Compare sites, explore risks and focus on what is most likely to delay database lock.
      </p>
    </div>

    <!-- View Controls -->
    <div class="flex items-center space-x-3 self-start md:self-center">
      <div class="flex items-center space-x-1.5 text-xs text-slate-300">
        <span class="text-slate-400">View by:</span>
        <select
          bind:value={viewByMetric}
          class="bg-white/10 border border-white/20 rounded-lg py-1.5 px-2.5 text-xs font-semibold text-white focus:outline-hidden focus:bg-slate-800"
        >
          <option value="impact" class="text-slate-900">DBL impact (days)</option>
          <option value="probability" class="text-slate-900">Risk probability (%)</option>
          <option value="volume" class="text-slate-900">Open items volume</option>
        </select>
      </div>

      <div class="flex items-center bg-white/10 p-0.5 rounded-lg border border-white/20">
        <button
          on:click={() => viewMode = 'map'}
          class="px-2.5 py-1 rounded-md text-xs font-semibold flex items-center space-x-1 transition-all {viewMode === 'map' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:text-white'}"
        >
          <MapPin size={13} />
          <span>Map</span>
        </button>
        <button
          on:click={() => viewMode = 'chart'}
          class="px-2.5 py-1 rounded-md text-xs font-semibold flex items-center space-x-1 transition-all {viewMode === 'chart' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:text-white'}"
        >
          <BarChart3 size={13} />
          <span>Chart</span>
        </button>
        <button
          on:click={() => viewMode = 'table'}
          class="px-2.5 py-1 rounded-md text-xs font-semibold flex items-center space-x-1 transition-all {viewMode === 'table' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:text-white'}"
        >
          <Table size={13} />
          <span>Table</span>
        </button>
      </div>
    </div>
  </div>

  <!-- ========================================================================= -->
  <!-- 4 KPIS ROW                                                                -->
  <!-- ========================================================================= -->
  <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
    <div class="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex items-center space-x-3">
      <div class="w-10 h-10 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
        <ShieldAlert size={20} />
      </div>
      <div>
        <div class="text-2xl font-extrabold text-slate-900 num-tabular">3</div>
        <div class="text-xs font-semibold text-slate-600">High-risk sites</div>
        <div class="text-[10px] text-slate-400">&gt; 5 days impact</div>
      </div>
    </div>

    <div class="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex items-center space-x-3">
      <div class="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
        <Building2 size={20} />
      </div>
      <div>
        <div class="text-2xl font-extrabold text-slate-900 num-tabular">18</div>
        <div class="text-xs font-semibold text-slate-600">Total sites</div>
        <div class="text-[10px] text-slate-400">3 countries</div>
      </div>
    </div>

    <div class="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex items-center space-x-3">
      <div class="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
        <FileText size={20} />
      </div>
      <div>
        <div class="text-2xl font-extrabold text-slate-900 num-tabular">342</div>
        <div class="text-xs font-semibold text-slate-600">Open items</div>
        <div class="text-[10px] text-slate-400">Across all sites</div>
      </div>
    </div>

    <div class="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex items-center space-x-3">
      <div class="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
        <Clock size={20} />
      </div>
      <div>
        <div class="text-2xl font-extrabold text-slate-900 num-tabular">11.2</div>
        <div class="text-xs font-semibold text-slate-600">Est. total DBL delay</div>
        <div class="text-[10px] text-slate-400">Days</div>
      </div>
    </div>
  </div>

  <!-- ========================================================================= -->
  <!-- MAIN VISUAL: WORLD MAP & RISK BY DATA DOMAIN                              -->
  <!-- ========================================================================= -->
  <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
    
    <!-- World Map Container (2 Cols) -->
    <div class="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between overflow-hidden">
      <div>
        <div class="flex items-center justify-between mb-2">
          <div>
            <h3 class="text-sm font-bold text-slate-900">Site risk by location</h3>
            <p class="text-[11px] text-slate-500">Color coded by forecast DBL delay impact</p>
          </div>

          <!-- Legend -->
          <div class="flex items-center space-x-2 text-[10px] font-semibold">
            <span class="flex items-center space-x-1">
              <span class="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
              <span class="text-slate-600">Critical (&gt;5d)</span>
            </span>
            <span class="flex items-center space-x-1">
              <span class="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
              <span class="text-slate-600">High (3–5d)</span>
            </span>
            <span class="flex items-center space-x-1">
              <span class="w-2.5 h-2.5 rounded-full bg-orange-400"></span>
              <span class="text-slate-600">Medium (1–3d)</span>
            </span>
            <span class="flex items-center space-x-1">
              <span class="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
              <span class="text-slate-600">Low (&lt;1d)</span>
            </span>
          </div>
        </div>

        <!-- Stylized Map Canvas -->
        <div class="relative w-full h-64 bg-slate-50 rounded-xl border border-slate-200/80 overflow-hidden flex items-center justify-center">
          
          <!-- SVG Continents Outlines & Grid -->
          <svg class="w-full h-full text-slate-200 stroke-slate-300 stroke-[0.8] fill-slate-200/50" viewBox="0 0 800 400">
            <!-- Background graticule lines -->
            <line x1="0" y1="100" x2="800" y2="100" stroke="#e2e8f0" stroke-width="0.5" stroke-dasharray="2" />
            <line x1="0" y1="200" x2="800" y2="200" stroke="#cbd5e1" stroke-width="0.7" />
            <line x1="0" y1="300" x2="800" y2="300" stroke="#e2e8f0" stroke-width="0.5" stroke-dasharray="2" />
            <line x1="200" y1="0" x2="200" y2="400" stroke="#e2e8f0" stroke-width="0.5" stroke-dasharray="2" />
            <line x1="400" y1="0" x2="400" y2="400" stroke="#cbd5e1" stroke-width="0.7" />
            <line x1="600" y1="0" x2="600" y2="400" stroke="#e2e8f0" stroke-width="0.5" stroke-dasharray="2" />

            <!-- North America -->
            <path d="M120 70 L240 60 L280 110 L250 170 L220 180 L190 220 L160 180 L120 120 Z" />
            <!-- South America -->
            <path d="M220 220 L270 230 L290 290 L260 360 L230 310 L210 240 Z" />
            <!-- Europe -->
            <path d="M380 70 L460 70 L480 130 L430 160 L380 140 L370 100 Z" />
            <!-- Africa -->
            <path d="M380 160 L460 160 L490 240 L440 330 L390 270 L370 200 Z" />
            <!-- Asia -->
            <path d="M480 70 L680 70 L720 160 L660 220 L550 200 L490 140 Z" />
            <!-- Australia -->
            <path d="M640 270 L720 270 L730 330 L650 340 Z" />

            <!-- Site Location Pins -->
            {#each sites as s}
              {@const coords = mapCoords(s.lat, s.lng)}
              <g
                class="cursor-pointer group"
                on:click={() => openSiteDrawer(s)}
              >
                <!-- Pulse ring for critical sites -->
                {#if s.riskLevel === 'Critical'}
                  <circle
                    cx={coords.x}
                    cy={coords.y}
                    r="9"
                    fill="none"
                    stroke="#f43f5e"
                    stroke-width="1.5"
                    class="animate-ping opacity-75"
                  />
                {/if}

                <!-- Main circle pin -->
                <circle
                  cx={coords.x}
                  cy={coords.y}
                  r={s.id === '104' ? '6.5' : s.riskLevel === 'Critical' ? '5.5' : '4.5'}
                  fill={s.riskLevel === 'Critical' ? '#e11d48' : s.riskLevel === 'High' ? '#f59e0b' : s.riskLevel === 'Medium' ? '#fb923c' : '#10b981'}
                  stroke="#ffffff"
                  stroke-width="1.5"
                  class="transition-transform group-hover:scale-125"
                />
              </g>
            {/each}
          </svg>

          <!-- Interactive Popover for Site 104 (Matching Screenshot 3) -->
          <div
            class="absolute top-12 left-44 bg-white/95 backdrop-blur-md rounded-lg p-2.5 shadow-lg border border-slate-300 text-xs cursor-pointer hover:border-blue-500 transition-all z-20"
            on:click={() => openSiteDrawer(sites.find(s => s.id === '104') || sites[0])}
          >
            <div class="flex items-center space-x-1.5 font-bold text-slate-900">
              <span class="w-2 h-2 rounded-full bg-rose-600"></span>
              <span>Site 104</span>
            </div>
            <div class="text-[11px] text-slate-500">Boston, US</div>
            <div class="text-xs font-bold text-rose-600 mt-0.5">5–7 days impact</div>
            <div class="text-[10px] text-blue-600 font-semibold mt-1">Click to inspect &rarr;</div>
          </div>

          <!-- Map Zoom Controls -->
          <div class="absolute bottom-3 left-3 flex flex-col bg-white rounded-md border border-slate-200 shadow-xs overflow-hidden">
            <button
              on:click={() => mapZoom = Math.min(2, mapZoom + 0.2)}
              class="px-2 py-1 text-xs font-bold text-slate-700 hover:bg-slate-100 border-b border-slate-200"
            >+</button>
            <button
              on:click={() => mapZoom = Math.max(0.8, mapZoom - 0.2)}
              class="px-2 py-1 text-xs font-bold text-slate-700 hover:bg-slate-100"
            >-</button>
          </div>

        </div>
      </div>

      <div class="mt-3 text-xs text-slate-500 flex items-center justify-between">
        <span>Click on any pin or table row to open the explainable risk drawer</span>
        <button
          on:click={() => openSiteDrawer(sites.find(s => s.id === '104') || sites[0])}
          class="text-blue-600 hover:text-blue-800 font-bold"
        >
          Inspect Site 104 &rarr;
        </button>
      </div>
    </div>

    <!-- Risk by Data Domain Progress Bars -->
    <div class="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
      <div>
        <h3 class="text-sm font-bold text-slate-900 mb-1">Risk by data domain</h3>
        <p class="text-[11px] text-slate-500 mb-4">Relative contribution to overall lock delay</p>

        <div class="space-y-4">
          <div>
            <div class="flex justify-between text-xs font-semibold text-slate-800">
              <span>Safety reconciliation</span>
              <span class="font-bold text-rose-600">28%</span>
            </div>
            <div class="w-full bg-slate-100 rounded-full h-2 mt-1.5 overflow-hidden">
              <div class="bg-rose-500 h-full rounded-full" style="width: 28%"></div>
            </div>
          </div>

          <div>
            <div class="flex justify-between text-xs font-semibold text-slate-800">
              <span>External laboratory</span>
              <span class="font-bold text-amber-600">24%</span>
            </div>
            <div class="w-full bg-slate-100 rounded-full h-2 mt-1.5 overflow-hidden">
              <div class="bg-amber-500 h-full rounded-full" style="width: 24%"></div>
            </div>
          </div>

          <div>
            <div class="flex justify-between text-xs font-semibold text-slate-800">
              <span>EDC / Queries</span>
              <span class="font-bold text-amber-500">22%</span>
            </div>
            <div class="w-full bg-slate-100 rounded-full h-2 mt-1.5 overflow-hidden">
              <div class="bg-amber-400 h-full rounded-full" style="width: 22%"></div>
            </div>
          </div>

          <div>
            <div class="flex justify-between text-xs font-semibold text-slate-800">
              <span>Medical coding</span>
              <span class="font-bold text-blue-600">12%</span>
            </div>
            <div class="w-full bg-slate-100 rounded-full h-2 mt-1.5 overflow-hidden">
              <div class="bg-blue-600 h-full rounded-full" style="width: 12%"></div>
            </div>
          </div>

          <div>
            <div class="flex justify-between text-xs font-semibold text-slate-800">
              <span>Site sign-offs</span>
              <span class="font-bold text-indigo-600">10%</span>
            </div>
            <div class="w-full bg-slate-100 rounded-full h-2 mt-1.5 overflow-hidden">
              <div class="bg-indigo-600 h-full rounded-full" style="width: 10%"></div>
            </div>
          </div>

          <div>
            <div class="flex justify-between text-xs font-semibold text-slate-800">
              <span>eCOA / Imaging</span>
              <span class="font-bold text-sky-500">4%</span>
            </div>
            <div class="w-full bg-slate-100 rounded-full h-2 mt-1.5 overflow-hidden">
              <div class="bg-sky-400 h-full rounded-full" style="width: 4%"></div>
            </div>
          </div>
        </div>
      </div>

      <div class="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-500">
        Safety reconciliation and external lab data account for <strong>52%</strong> of delay risk.
      </div>
    </div>

  </div>

  <!-- ========================================================================= -->
  <!-- TABLE VIEW WITH DBL IMPACT VS VOLUME DIFFERENTIATOR                       -->
  <!-- ========================================================================= -->
  <div class="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
    
    <!-- Filter Chips & Search Bar -->
    <div class="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      
      <!-- Filter Chips -->
      <div class="flex items-center space-x-1.5 overflow-x-auto text-xs">
        <button
          on:click={() => riskTierFilter = 'all'}
          class="px-3 py-1.5 rounded-lg font-semibold transition-all {riskTierFilter === 'all' ? 'bg-blue-600 text-white shadow-xs' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}"
        >
          All sites ({sites.length})
        </button>
        <button
          on:click={() => riskTierFilter = 'critical'}
          class="px-3 py-1.5 rounded-lg font-semibold transition-all {riskTierFilter === 'critical' ? 'bg-rose-600 text-white shadow-xs' : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'}"
        >
          Critical ({sites.filter(s => s.riskLevel === 'Critical').length})
        </button>
        <button
          on:click={() => riskTierFilter = 'high'}
          class="px-3 py-1.5 rounded-lg font-semibold transition-all {riskTierFilter === 'high' ? 'bg-amber-600 text-white shadow-xs' : 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200'}"
        >
          High ({sites.filter(s => s.riskLevel === 'High').length})
        </button>
        <button
          on:click={() => riskTierFilter = 'medium'}
          class="px-3 py-1.5 rounded-lg font-semibold transition-all {riskTierFilter === 'medium' ? 'bg-orange-500 text-white shadow-xs' : 'bg-orange-50 text-orange-700 hover:bg-orange-100 border border-orange-200'}"
        >
          Medium ({sites.filter(s => s.riskLevel === 'Medium').length})
        </button>
        <button
          on:click={() => riskTierFilter = 'low'}
          class="px-3 py-1.5 rounded-lg font-semibold transition-all {riskTierFilter === 'low' ? 'bg-emerald-600 text-white shadow-xs' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'}"
        >
          Low ({sites.filter(s => s.riskLevel === 'Low').length})
        </button>
      </div>

      <!-- Search & Export -->
      <div class="flex items-center space-x-2.5 self-end sm:self-center">
        <div class="relative">
          <Search size={14} class="absolute left-2.5 top-2.5 text-slate-400" />
          <input
            type="text"
            bind:value={searchQuery}
            placeholder="Search site, country or site ID"
            class="text-xs bg-slate-50 border border-slate-200 rounded-lg py-1.5 pl-8 pr-3 text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-blue-500 w-52"
          />
        </div>

        <button class="px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-700 font-semibold text-xs hover:bg-slate-100 flex items-center space-x-1">
          <Download size={13} />
          <span>Export</span>
        </button>
      </div>
    </div>

    <!-- The Site Table -->
    <div class="overflow-x-auto">
      <table class="w-full text-left border-collapse text-xs">
        <thead>
          <tr class="bg-slate-50/80 text-slate-500 border-b border-slate-200 text-[10px] font-bold uppercase tracking-wider">
            <th class="py-3 px-4">Site ID</th>
            <th class="py-3 px-3">Site name</th>
            <th class="py-3 px-3">Country</th>
            <th class="py-3 px-3 text-center">Open items</th>
            <th class="py-3 px-3 text-center">Risk prob (%)</th>
            <th class="py-3 px-3 text-center">Est. DBL impact (days)</th>
            <th class="py-3 px-3">Risk level</th>
            <th class="py-3 px-3">Key risk drivers</th>
            <th class="py-3 px-3">Trend (4w)</th>
            <th class="py-3 px-3 text-right"></th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100 font-medium text-slate-700">
          {#each sortedSites as site}
            <tr
              class="hover:bg-blue-50/40 transition-colors cursor-pointer group {site.id === '104' ? 'bg-amber-50/20' : ''}"
              on:click={() => openSiteDrawer(site)}
            >
              <td class="py-3.5 px-4 font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                {site.id}
              </td>
              <td class="py-3.5 px-3 font-semibold text-slate-900">
                {site.name}
              </td>
              <td class="py-3.5 px-3 text-slate-600 font-semibold">
                {site.countryCode}
              </td>
              <!-- Open items: Notice Site 208 has 41, but Site 104 has 19! -->
              <td class="py-3.5 px-3 text-center font-bold {site.id === '208' ? 'text-blue-700 font-extrabold' : 'text-slate-800'}">
                {site.openItems}
              </td>
              <td class="py-3.5 px-3 text-center font-bold {site.riskProbability >= 70 ? 'text-rose-600' : site.riskProbability >= 40 ? 'text-amber-600' : 'text-slate-600'}">
                {site.riskProbability}%
              </td>
              <!-- Forecast impact: Site 104 is 5-7 days (Critical), Site 208 is 1-2 days (Medium) -->
              <td class="py-3.5 px-3 text-center font-bold font-mono {site.maxDelayDays >= 5 ? 'text-rose-600 text-sm' : site.maxDelayDays >= 3 ? 'text-amber-600' : 'text-slate-700'}">
                {site.forecastImpactDays}
              </td>
              <td class="py-3.5 px-3">
                <span class="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border {getRiskBadge(site.riskLevel)}">
                  {site.riskLevel}
                </span>
              </td>
              <td class="py-3.5 px-3 text-slate-600 truncate max-w-[170px]">
                {site.keyRiskDrivers}
              </td>
              <td class="py-3.5 px-3">
                <svg class="w-14 h-4 overflow-visible" viewBox="0 0 50 16">
                  <polyline
                    fill="none"
                    stroke={site.riskLevel === 'Critical' ? '#f43f5e' : site.riskLevel === 'High' ? '#f59e0b' : site.riskLevel === 'Medium' ? '#fb923c' : '#10b981'}
                    stroke-width="1.8"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    points={getSparklinePoints(site.trend)}
                  />
                </svg>
              </td>
              <td class="py-3.5 px-3 text-right">
                <ChevronRight size={15} class="text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all inline-block" />
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>

    <!-- Table footer insight -->
    <div class="p-3.5 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-600 gap-2">
      <div class="flex items-center space-x-2">
        <Sparkles size={14} class="text-blue-600" />
        <span><strong>Key differentiator demonstrated:</strong> Site 104 has only 19 open items but causes 5–7 days delay. Site 208 has 41 open items but only 1–2 days delay.</span>
      </div>
      <span class="text-slate-400 text-[11px]">Showing 1–{sortedSites.length} of {sites.length} sites</span>
    </div>

  </div>

  <!-- ========================================================================= -->
  <!-- SCREEN 4: EXPLAINABLE SITE RISK & EVIDENCE DRAWER (SLIDE-OVER)             -->
  <!-- ========================================================================= -->
  {#if activeSite}
    <div class="fixed inset-0 z-50 flex justify-end">
      <!-- Backdrop -->
      <div
        class="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity"
        on:click={closeDrawer}
      ></div>

      <!-- Drawer Panel -->
      <aside class="relative w-full max-w-xl bg-white h-full shadow-2xl border-l border-slate-200 overflow-y-auto flex flex-col z-10">
        
        <!-- Drawer Header -->
        <div class="p-6 border-b border-slate-200 bg-slate-50/70 sticky top-0 bg-white/95 backdrop-blur-md z-10 flex items-start justify-between">
          <div>
            <div class="flex items-center space-x-2">
              <span class="text-xs font-bold text-slate-500 uppercase tracking-wider">Site Details</span>
              <span class="px-2 py-0.5 rounded text-[10px] font-bold border {getRiskBadge(activeSite.riskLevel)}">
                {activeSite.riskLevel} risk
              </span>
            </div>
            <h2 class="text-xl font-extrabold text-slate-900 mt-1">
              Site {activeSite.id} &ndash; Risk details
            </h2>
            <p class="text-xs text-slate-500">
              {activeSite.name} &middot; {activeSite.country}
            </p>
          </div>

          <button
            on:click={closeDrawer}
            class="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
            aria-label="Close drawer"
          >
            <X size={20} />
          </button>
        </div>

        <!-- 4 Top Metrics Row in Drawer -->
        <div class="grid grid-cols-4 gap-2 p-4 bg-slate-50 border-b border-slate-200 text-center">
          <div class="p-2 bg-white rounded-lg border border-slate-200/80">
            <span class="text-[10px] text-slate-400 uppercase font-bold block">Readiness</span>
            <strong class="text-sm font-extrabold text-slate-900">{activeSite.readinessScore}/100</strong>
          </div>
          <div class="p-2 bg-white rounded-lg border border-slate-200/80">
            <span class="text-[10px] text-slate-400 uppercase font-bold block">Risk Prob.</span>
            <strong class="text-sm font-extrabold text-rose-600">{activeSite.riskProbability}%</strong>
          </div>
          <div class="p-2 bg-white rounded-lg border border-slate-200/80">
            <span class="text-[10px] text-slate-400 uppercase font-bold block">Est. Impact</span>
            <strong class="text-sm font-extrabold text-rose-600">{activeSite.forecastImpactDays}</strong>
          </div>
          <div class="p-2 bg-white rounded-lg border border-slate-200/80">
            <span class="text-[10px] text-slate-400 uppercase font-bold block">Open Items</span>
            <strong class="text-sm font-extrabold text-slate-900">{activeSite.openItems}</strong>
          </div>
        </div>

        <!-- 3 Drawer Tabs: Why at risk? | Supporting evidence | Recommended actions -->
        <div class="flex border-b border-slate-200 px-6 text-xs font-bold text-slate-600">
          <button
            on:click={() => drawerTab = 'why'}
            class="py-3 px-3 border-b-2 transition-colors {drawerTab === 'why' ? 'border-blue-600 text-blue-600 font-extrabold' : 'border-transparent hover:text-slate-900'}"
          >
            Why at risk?
          </button>
          <button
            on:click={() => drawerTab = 'evidence'}
            class="py-3 px-3 border-b-2 transition-colors {drawerTab === 'evidence' ? 'border-blue-600 text-blue-600 font-extrabold' : 'border-transparent hover:text-slate-900'}"
          >
            Supporting evidence
          </button>
          <button
            on:click={() => drawerTab = 'actions'}
            class="py-3 px-3 border-b-2 transition-colors {drawerTab === 'actions' ? 'border-blue-600 text-blue-600 font-extrabold' : 'border-transparent hover:text-slate-900'}"
          >
            Recommended actions
          </button>
        </div>

        <!-- Drawer Tab Content -->
        <div class="p-6 space-y-6 flex-1 text-xs text-slate-700">
          
          {#if drawerTab === 'why'}
            <!-- Factor Contributions -->
            <div>
              <h3 class="text-xs font-bold text-slate-900 uppercase tracking-wider mb-1">
                Key drivers of predicted delay
              </h3>
              <p class="text-[11px] text-slate-500 mb-3">
                Relative contribution of each factor to the predicted DBL impact.
              </p>

              <div class="space-y-3">
                <div>
                  <div class="flex justify-between font-semibold text-slate-800">
                    <span>Ageing EDC queries (primary endpoint)</span>
                    <span class="font-bold text-rose-600">45%</span>
                  </div>
                  <div class="w-full bg-slate-100 rounded-full h-2 mt-1">
                    <div class="bg-rose-500 h-full rounded-full" style="width: 45%"></div>
                  </div>
                </div>

                <div>
                  <div class="flex justify-between font-semibold text-slate-800">
                    <span>Laboratory transfer delay</span>
                    <span class="font-bold text-amber-600">25%</span>
                  </div>
                  <div class="w-full bg-slate-100 rounded-full h-2 mt-1">
                    <div class="bg-amber-500 h-full rounded-full" style="width: 25%"></div>
                  </div>
                </div>

                <div>
                  <div class="flex justify-between font-semibold text-slate-800">
                    <span>Safety reconciliation discrepancies</span>
                    <span class="font-bold text-orange-600">15%</span>
                  </div>
                  <div class="w-full bg-slate-100 rounded-full h-2 mt-1">
                    <div class="bg-orange-500 h-full rounded-full" style="width: 15%"></div>
                  </div>
                </div>

                <div>
                  <div class="flex justify-between font-semibold text-slate-800">
                    <span>Investigator sign-off status</span>
                    <span class="font-bold text-blue-600">10%</span>
                  </div>
                  <div class="w-full bg-slate-100 rounded-full h-2 mt-1">
                    <div class="bg-blue-600 h-full rounded-full" style="width: 10%"></div>
                  </div>
                </div>

                <div>
                  <div class="flex justify-between font-semibold text-slate-800">
                    <span>Other (coding, eCOA, misc.)</span>
                    <span class="font-bold text-slate-500">5%</span>
                  </div>
                  <div class="w-full bg-slate-100 rounded-full h-2 mt-1">
                    <div class="bg-slate-400 h-full rounded-full" style="width: 5%"></div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Callout Note -->
            <div class="p-3.5 rounded-lg bg-blue-50/80 border border-blue-200 text-blue-900 flex items-start space-x-2.5">
              <Sparkles size={16} class="text-blue-600 shrink-0 mt-0.5" />
              <p class="leading-relaxed">
                <strong>Critical Path Alert:</strong> This site is on the critical path due to unresolved SAE discrepancies affecting pharmacovigilance safety freeze and an overdue central laboratory transfer.
              </p>
            </div>

            <!-- Impact Summary -->
            <div class="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <h4 class="font-bold text-slate-900 text-xs uppercase tracking-wide">Impact Summary</h4>
              <div class="grid grid-cols-3 gap-2 pt-1 text-center">
                <div class="p-2 bg-white rounded-md border border-slate-200">
                  <div class="text-xs font-extrabold text-rose-600">{activeSite.forecastImpactDays}</div>
                  <div class="text-[10px] text-slate-400">Potential DBL delay</div>
                </div>
                <div class="p-2 bg-white rounded-md border border-slate-200">
                  <div class="text-xs font-extrabold text-slate-800">~{activeSite.enrolledSubjects} subjects</div>
                  <div class="text-[10px] text-slate-400">Impacted</div>
                </div>
                <div class="p-2 bg-white rounded-md border border-slate-200">
                  <div class="text-xs font-extrabold text-emerald-600">High</div>
                  <div class="text-[10px] text-slate-400">Model confidence</div>
                </div>
              </div>
            </div>

            <!-- Model Rationale -->
            <div class="p-3.5 rounded-lg bg-slate-100/70 border border-slate-200 text-slate-700">
              <strong class="font-bold text-slate-900 block text-[11px] uppercase tracking-wide mb-1">
                Model Rationale &middot; Historical Pattern Match
              </strong>
              <p class="text-[11px] leading-relaxed">
                Based on historical patterns from 48 prior oncology studies, sites with unresolved SAE discrepancies and central laboratory transfer delays exceeding 3 days have a <strong>75&ndash;85% likelihood</strong> of delaying the global DBL milestone.
              </p>
            </div>

          {:else if drawerTab === 'evidence'}
            <!-- Supporting Evidence Tab -->
            <div class="space-y-4">
              <div class="flex items-center justify-between">
                <h3 class="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Traceable Supporting Signals
                </h3>
                <span class="text-[11px] text-slate-400 font-mono">Extract: 2026-10-31 08:00 UTC</span>
              </div>

              <div class="border border-slate-200 rounded-lg overflow-hidden">
                <table class="w-full text-left border-collapse text-xs">
                  <thead class="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold">
                    <tr>
                      <th class="py-2.5 px-3">Evidence Item</th>
                      <th class="py-2.5 px-2">Source</th>
                      <th class="py-2.5 px-2">Status</th>
                      <th class="py-2.5 px-2 text-right">Updated</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-slate-100 font-medium">
                    <tr>
                      <td class="py-2.5 px-3 font-semibold text-slate-900">
                        3 primary endpoint queries (RECIST Lesions)
                      </td>
                      <td class="py-2.5 px-2 text-slate-600">EDC</td>
                      <td class="py-2.5 px-2"><span class="px-2 py-0.5 rounded bg-rose-100 text-rose-800 text-[10px] font-bold">Open (&gt;14d)</span></td>
                      <td class="py-2.5 px-2 text-right text-slate-500 font-mono text-[11px]">31 Oct</td>
                    </tr>
                    <tr>
                      <td class="py-2.5 px-3 font-semibold text-slate-900">
                        Central lab transfer (Batch #LXB-8921 ctDNA)
                      </td>
                      <td class="py-2.5 px-2 text-slate-600">LabCorp Feed</td>
                      <td class="py-2.5 px-2"><span class="px-2 py-0.5 rounded bg-rose-100 text-rose-800 text-[10px] font-bold">Overdue (4d)</span></td>
                      <td class="py-2.5 px-2 text-right text-slate-500 font-mono text-[11px]">30 Oct</td>
                    </tr>
                    <tr>
                      <td class="py-2.5 px-3 font-semibold text-slate-900">
                        2 SAE reconciliation discrepancies (Subj 104-003, 104-012)
                      </td>
                      <td class="py-2.5 px-2 text-slate-600">Argus / EDC</td>
                      <td class="py-2.5 px-2"><span class="px-2 py-0.5 rounded bg-amber-100 text-amber-800 text-[10px] font-bold">Discrepant</span></td>
                      <td class="py-2.5 px-2 text-right text-slate-500 font-mono text-[11px]">31 Oct</td>
                    </tr>
                    <tr>
                      <td class="py-2.5 px-3 font-semibold text-slate-900">
                        Investigator sign-off pending for 12 casebooks
                      </td>
                      <td class="py-2.5 px-2 text-slate-600">EDC</td>
                      <td class="py-2.5 px-2"><span class="px-2 py-0.5 rounded bg-blue-100 text-blue-800 text-[10px] font-bold">Pending</span></td>
                      <td class="py-2.5 px-2 text-right text-slate-500 font-mono text-[11px]">31 Oct</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div class="p-3 bg-slate-50 rounded-lg border border-slate-200 text-[11px] text-slate-500 space-y-1">
                <div><strong>Source System:</strong> {activeSite.traceability.sourceSystem}</div>
                <div><strong>Model Prediction ID:</strong> {activeSite.traceability.predictionId}</div>
                <div><strong>Refresh Timestamp:</strong> {activeSite.traceability.lastRefresh}</div>
              </div>
            </div>

          {:else}
            <!-- Recommended Actions Tab -->
            <div class="space-y-4">
              <h3 class="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Targeted AI Interventions for Site {activeSite.id}
              </h3>

              <div class="space-y-3">
                <div class="p-3.5 rounded-lg border border-rose-200 bg-rose-50/40 space-y-2">
                  <div class="flex items-center justify-between">
                    <span class="px-2 py-0.5 rounded bg-rose-100 text-rose-800 font-bold text-[10px]">Critical &middot; ACT-001</span>
                    <span class="font-bold text-emerald-600 text-xs">-3.0 days impact</span>
                  </div>
                  <div class="font-bold text-slate-900 text-xs">Resolve 2 SAE discrepancies at Site 104</div>
                  <p class="text-[11px] text-slate-600 leading-relaxed">
                    Unresolved SAE discrepancies blocking safety database freeze, a prerequisite for DBL.
                  </p>
                  <div class="text-[11px] text-slate-500 flex justify-between pt-1 border-t border-rose-100">
                    <span>Owner: <strong>Dr. Sarah Lin (Safety Lead)</strong></span>
                    <span>Due: <strong>2026-11-02</strong></span>
                  </div>
                </div>

                <div class="p-3.5 rounded-lg border border-rose-200 bg-rose-50/40 space-y-2">
                  <div class="flex items-center justify-between">
                    <span class="px-2 py-0.5 rounded bg-rose-100 text-rose-800 font-bold text-[10px]">Critical &middot; ACT-002</span>
                    <span class="font-bold text-emerald-600 text-xs">-1.8 days impact</span>
                  </div>
                  <div class="font-bold text-slate-900 text-xs">Escalate overdue LabCorp ctDNA transfer (#LXB-8921)</div>
                  <p class="text-[11px] text-slate-600 leading-relaxed">
                    Vendor transfer is 4 days overdue due to binary checksum failure.
                  </p>
                  <div class="text-[11px] text-slate-500 flex justify-between pt-1 border-t border-rose-100">
                    <span>Owner: <strong>Jean-Pierre Dupuis (Vendor Ops)</strong></span>
                    <span>Due: <strong>2026-11-01</strong></span>
                  </div>
                </div>
              </div>
            </div>
          {/if}

        </div>

        <!-- Drawer Footer Buttons -->
        <div class="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3 sticky bottom-0">
          <button
            on:click={() => { closeDrawer(); onSelectTab('action_workbench'); }}
            class="flex-1 py-2.5 px-4 rounded-lg bg-blue-600 text-white font-bold text-xs hover:bg-blue-700 transition-colors shadow-xs flex items-center justify-center space-x-1.5"
          >
            <span>View recommended actions</span>
            <ArrowRight size={14} />
          </button>
          <button
            on:click={closeDrawer}
            class="py-2.5 px-4 rounded-lg border border-slate-300 bg-white text-slate-700 font-semibold text-xs hover:bg-slate-50 transition-colors"
          >
            Back to sites
          </button>
        </div>

      </aside>
    </div>
  {/if}

</div>
