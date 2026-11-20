<script lang="ts">
  import {
    ArrowLeft,
    Search,
    X,
    RotateCcw,
    ArrowUpDown,
    ArrowUp,
    ArrowDown,
    AlertTriangle,
    CheckCircle2,
    Clock,
    SlidersHorizontal,
    ExternalLink,
    MapPin,
    Activity,
    ShieldAlert,
    Filter,
    ChevronRight,
    ChevronLeft,
  } from '@lucide/svelte';
  import {
    V3_STUDY_META,
    V3_COUNTRY_SUMMARY,
    V3_SITES,
    type V3SiteSpec,
  } from '../data/v3Data';
  import WorldMapWidgetV3 from './WorldMapWidgetV3.svelte';
  import MultiSelectFilter from './MultiSelectFilter.svelte';

  export let countryFilter: string = 'all';
  export let onSelectTab: (tab: any) => void = () => {};
  export let onSelectSite: (siteId: string) => void = () => {};

  const REGION_BY_COUNTRY: Record<string, string> = {
    'United States': 'North America',
    Canada: 'North America',
    Germany: 'Western Europe',
    France: 'Western Europe',
    Spain: 'Western Europe',
    'South Korea': 'Asia-Pacific',
    Australia: 'Asia-Pacific',
  };

  // Multi-select filter state
  let searchQuery = '';
  let regionFilters: string[] = [];
  let countryFilters: string[] = countryFilter && countryFilter !== 'all' ? [countryFilter] : [];
  let statusFilters: string[] = [];
  let readinessBands: string[] = [];
  let driverFilters: string[] = [];
  let onlyCriticalSites = false;

  // Sync incoming countryFilter prop -> countryFilters without reactive cycle
  let lastPropCountry = countryFilter;
  $: if (countryFilter !== lastPropCountry) {
    lastPropCountry = countryFilter;
    countryFilters = countryFilter && countryFilter !== 'all' ? [countryFilter] : [];
  }

  function updateCountryFilters(next: string[]) {
    countryFilters = next;
    const synced = next.length === 1 ? next[0] : 'all';
    lastPropCountry = synced;
    countryFilter = synced;
  }

  // Visual widget state & pagination
  let visualMode: 'map' | 'quadrant' | 'feeds' = 'map';
  let hoveredQuadrantSite: V3SiteSpec | null = null;
  let sitePage = 1;
  let sitePageSize = 10;

  // Sorting state
  type SortCol =
    | 'id'
    | 'country'
    | 'piName'
    | 'enrolled'
    | 'readiness'
    | 'riskLevel'
    | 'dblImpactDays'
    | 'hardGateBlockers'
    | 'primaryDriver';
  let sortCol: SortCol = 'readiness';
  let sortDir: 'asc' | 'desc' = 'asc';

  function toggleSort(col: SortCol) {
    if (sortCol === col) {
      sortDir = sortDir === 'asc' ? 'desc' : 'asc';
    } else {
      sortCol = col;
      sortDir = col === 'readiness' || col === 'id' || col === 'country' || col === 'piName' ? 'asc' : 'desc';
    }
  }

  function toggleArrayItem(arr: string[], val: string): string[] {
    return arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val];
  }

  function getReadinessBand(pct: number): string {
    if (pct >= 85) return 'lock_ready';
    if (pct >= 70) return 'watch';
    if (pct >= 55) return 'at_risk';
    return 'critical';
  }

  function resetAllFilters() {
    searchQuery = '';
    regionFilters = [];
    updateCountryFilters([]);
    statusFilters = [];
    readinessBands = [];
    driverFilters = [];
    onlyCriticalSites = false;
  }

  // Derived unique options
  $: allRegions = Array.from(
    new Set(V3_COUNTRY_SUMMARY.map((c) => REGION_BY_COUNTRY[c.country] || 'Other'))
  ).sort();
  $: allCountries = V3_COUNTRY_SUMMARY.map((c) => c.country).sort();
  $: allDrivers = Array.from(new Set(V3_SITES.map((s) => s.primaryDriver))).sort();

  // Status counts (unfiltered base for quick pills)
  $: statusCounts = {
    all: V3_SITES.length,
    'High risk': V3_SITES.filter((s) => s.riskLevel === 'High risk').length,
    'At risk': V3_SITES.filter((s) => s.riskLevel === 'At risk').length,
    'On track': V3_SITES.filter((s) => s.riskLevel === 'On track').length,
  };

  // Filtered & sorted sites
  $: filteredSites = V3_SITES.filter((s) => {
    const q = searchQuery.trim().toLowerCase();
    const matchesSearch =
      !q ||
      s.id.toLowerCase().includes(q) ||
      s.name.toLowerCase().includes(q) ||
      s.country.toLowerCase().includes(q) ||
      s.piName.toLowerCase().includes(q) ||
      s.primaryDriver.toLowerCase().includes(q);
    const region = REGION_BY_COUNTRY[s.country] || 'Other';
    const matchesRegion = regionFilters.length === 0 || regionFilters.includes(region);
    const matchesCountry = countryFilters.length === 0 || countryFilters.includes(s.country);
    const matchesStatus = statusFilters.length === 0 || statusFilters.includes(s.riskLevel);
    const matchesBand =
      readinessBands.length === 0 || readinessBands.includes(getReadinessBand(s.readiness));
    const matchesDriver = driverFilters.length === 0 || driverFilters.includes(s.primaryDriver);
    const matchesCritical = !onlyCriticalSites || s.hardGateBlockers > 0;
    return (
      matchesSearch &&
      matchesRegion &&
      matchesCountry &&
      matchesStatus &&
      matchesBand &&
      matchesDriver &&
      matchesCritical
    );
  }).sort((a, b) => {
    const dir = sortDir === 'asc' ? 1 : -1;
    const statusRank: Record<string, number> = { 'High risk': 3, 'At risk': 2, 'On track': 1 };
    let cmp = 0;
    switch (sortCol) {
      case 'id':
        cmp = a.id.localeCompare(b.id, undefined, { numeric: true });
        break;
      case 'country':
        cmp = a.country.localeCompare(b.country);
        break;
      case 'piName':
        cmp = a.piName.localeCompare(b.piName);
        break;
      case 'enrolled':
        cmp = a.enrolled - b.enrolled;
        break;
      case 'riskLevel':
        cmp = (statusRank[a.riskLevel] || 0) - (statusRank[b.riskLevel] || 0);
        break;
      case 'dblImpactDays':
        cmp = a.dblImpactDays - b.dblImpactDays;
        break;
      case 'hardGateBlockers':
        cmp = a.hardGateBlockers - b.hardGateBlockers;
        break;
      case 'primaryDriver':
        cmp = a.primaryDriver.localeCompare(b.primaryDriver);
        break;
      case 'readiness':
      default:
        cmp = a.readiness - b.readiness;
        break;
    }
    return cmp !== 0 ? cmp * dir : b.hardGateBlockers - a.hardGateBlockers;
  });

  $: totalSitePages = Math.max(1, Math.ceil(filteredSites.length / sitePageSize));
  $: if (sitePage > totalSitePages) sitePage = 1;
  $: pagedSites = filteredSites.slice((sitePage - 1) * sitePageSize, sitePage * sitePageSize);
  $: visibleSitePages = (() => {
    const pages: number[] = [];
    const start = Math.max(1, sitePage - 2);
    const end = Math.min(totalSitePages, start + 4);
    for (let p = Math.max(1, end - 4); p <= end; p++) pages.push(p);
    return pages;
  })();

  $: activeFilterCount =
    (searchQuery.trim() ? 1 : 0) +
    regionFilters.length +
    countryFilters.length +
    statusFilters.length +
    readinessBands.length +
    driverFilters.length +
    (onlyCriticalSites ? 1 : 0);

  // KPI metrics (reflect filteredSites if filtered, or all sites)
  $: kpiSites = filteredSites.length > 0 ? filteredSites : V3_SITES;
  $: avgReadiness = Math.round(
    kpiSites.reduce((acc, s) => acc + s.readiness, 0) / Math.max(1, kpiSites.length)
  );
  $: highRiskCount = kpiSites.filter((s) => s.riskLevel === 'High risk').length;
  $: atRiskCount = kpiSites.filter((s) => s.riskLevel === 'At risk').length;
  $: onTrackCount = kpiSites.filter((s) => s.riskLevel === 'On track').length;
  $: totalHardGates = kpiSites.reduce((acc, s) => acc + s.hardGateBlockers, 0);
  $: totalCriticalSubjects = kpiSites.reduce((acc, s) => acc + s.criticalSubjects, 0);
  $: totalSubjects = kpiSites.reduce((acc, s) => acc + s.enrolled, 0);

  // Distribution buckets
  $: distBuckets = [
    {
      key: 'lock_ready',
      label: 'Lock Ready (≥85%)',
      count: V3_SITES.filter((s) => s.readiness >= 85).length,
      color: 'bg-emerald-500',
      dot: '#10b981',
      text: 'text-emerald-700',
    },
    {
      key: 'watch',
      label: 'Watch (70–84%)',
      count: V3_SITES.filter((s) => s.readiness >= 70 && s.readiness < 85).length,
      color: 'bg-blue-500',
      dot: '#3b82f6',
      text: 'text-blue-700',
    },
    {
      key: 'at_risk',
      label: 'At Risk (55–69%)',
      count: V3_SITES.filter((s) => s.readiness >= 55 && s.readiness < 70).length,
      color: 'bg-amber-500',
      dot: '#f59e0b',
      text: 'text-amber-700',
    },
    {
      key: 'critical',
      label: 'Critical (<55%)',
      count: V3_SITES.filter((s) => s.readiness < 55).length,
      color: 'bg-rose-500',
      dot: '#f43f5e',
      text: 'text-rose-700',
    },
  ];

  // Top 5 priority sites
  $: topPrioritySites = [...V3_SITES]
    .sort((a, b) => a.readiness - b.readiness || b.hardGateBlockers - a.hardGateBlockers)
    .slice(0, 5);

  const VENDOR_FEEDS = [
    { vendor: 'Medidata Rave EDC', status: 'Synced', lag: '14m ago', health: 'ok', records: '18,420' },
    { vendor: 'Covance Central Lab', status: 'Delayed', lag: '18h lag', health: 'warn', records: '6,190' },
    { vendor: 'Clario eCOA / ePRO', status: 'Synced', lag: '42m ago', health: 'ok', records: '9,840' },
    { vendor: 'ERT / Cardiac ECG', status: 'Reconciling', lag: '4h lag', health: 'warn', records: '2,310' },
    { vendor: 'Argus Safety DB', status: 'Synced', lag: '8m ago', health: 'ok', records: '412' },
  ];

  function statusBadgeClass(status: string) {
    if (status === 'High risk') return 'bg-rose-50 text-rose-700 border-rose-200';
    if (status === 'At risk') return 'bg-amber-50 text-amber-700 border-amber-200';
    return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  }

  function readinessBarColor(pct: number) {
    if (pct >= 85) return 'bg-emerald-500';
    if (pct >= 70) return 'bg-blue-500';
    if (pct >= 55) return 'bg-amber-500';
    return 'bg-rose-500';
  }
</script>

<div class="space-y-2.5">
  <!-- Top Sites & Countries Banner (matching StudyOverviewV3) -->
  <div class="bg-white rounded-xl border border-slate-200/80 shadow-xs px-3.5 py-2.5">
    <div class="flex flex-wrap items-start justify-between gap-2 pb-2 border-b border-slate-100">
      <div>
        <button
          type="button"
          on:click={() => onSelectTab('command_centre')}
          class="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 hover:text-blue-600 mb-0.5 cursor-pointer"
        >
          <ArrowLeft size={12} /> Back to Study Overview
        </button>
        <div class="flex flex-wrap items-center gap-2">
          <h1 class="text-base font-bold text-slate-900 tracking-tight leading-tight">
            {V3_STUDY_META.protocol} <span class="text-slate-300 font-normal">|</span> Sites & Countries
          </h1>
          <span class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <span class="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
            {V3_SITES.filter((s) => s.riskLevel === 'High risk').length} High Risk Sites
          </span>
          {#if activeFilterCount > 0}
            <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-[10px] font-bold text-blue-700">
              <Filter size={10} /> {activeFilterCount} filter{activeFilterCount > 1 ? 's' : ''} active
            </span>
          {/if}
        </div>
        <p class="text-[11px] text-slate-500 mt-0.5">{V3_STUDY_META.title}</p>
      </div>

      <div class="flex flex-col items-end gap-1">
        <div class="flex flex-wrap items-center gap-1.5">
          {#if activeFilterCount > 0}
            <button
              type="button"
              on:click={resetAllFilters}
              class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 cursor-pointer transition-colors"
            >
              <RotateCcw size={12} /> Reset Filters
            </button>
          {/if}
        </div>
        <span class="text-[10px] text-slate-400">Last refreshed: {V3_STUDY_META.lastRefreshed}</span>
      </div>
    </div>

    <!-- Metadata Strip -->
    <div class="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 pt-2 text-[11px]">
      <div>
        <div class="text-[10px] text-slate-400">Active Sites</div>
        <div class="font-semibold text-slate-800">{kpiSites.length} / {V3_SITES.length}</div>
      </div>
      <div>
        <div class="text-[10px] text-slate-400">Countries</div>
        <div class="font-semibold text-slate-800">{V3_COUNTRY_SUMMARY.length} Countries</div>
      </div>
      <div>
        <div class="text-[10px] text-slate-400">Regions</div>
        <div class="font-semibold text-slate-800">{V3_STUDY_META.regions}</div>
      </div>
      <div>
        <div class="text-[10px] text-slate-400">Enrolled Subjects</div>
        <div class="font-semibold text-slate-800">{totalSubjects}</div>
      </div>
      <div>
        <div class="text-[10px] text-slate-400">Avg Readiness</div>
        <div class="font-semibold text-slate-800">{avgReadiness}%</div>
      </div>
      <div>
        <div class="text-[10px] text-slate-400">Target DBL</div>
        <div class="font-semibold text-slate-800">{V3_STUDY_META.targetDbl}</div>
      </div>
      <div>
        <div class="text-[10px] text-slate-400">Predicted DBL (P80)</div>
        <div class="font-bold text-rose-600">{V3_STUDY_META.predictedDbl} (+{V3_STUDY_META.delayDays}d)</div>
      </div>
      <div>
        <div class="text-[10px] text-slate-400">Hard Gate Blockers</div>
        <div class="font-bold text-rose-600">{totalHardGates} blockers</div>
      </div>
    </div>
  </div>

  <!-- 6 Balanced KPI Cards -->
  <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
    <div class="bg-white rounded-xl border border-slate-200/80 p-3 shadow-xs hover:shadow-sm transition-shadow">
      <div class="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400">
        <span>Active Sites</span>
        <MapPin size={13} class="text-blue-500" />
      </div>
      <div class="mt-1 flex items-baseline gap-1.5">
        <span class="text-xl font-extrabold text-slate-900">{kpiSites.length}</span>
        <span class="text-[11px] text-slate-500 font-medium">/ {V3_SITES.length}</span>
      </div>
      <div class="mt-1 text-[10px] text-slate-500">{totalSubjects} enrolled subjects</div>
    </div>

    <div class="bg-white rounded-xl border border-slate-200/80 p-3 shadow-xs hover:shadow-sm transition-shadow">
      <div class="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400">
        <span>Avg Readiness</span>
        <Activity size={13} class="text-blue-600" />
      </div>
      <div class="mt-1 flex items-baseline gap-1.5">
        <span class="text-xl font-extrabold text-slate-900">{avgReadiness}%</span>
        <span class="text-[10px] font-bold {avgReadiness >= 85 ? 'text-emerald-600' : 'text-amber-600'}">
          {avgReadiness >= 85 ? 'On Target' : `${85 - avgReadiness}% to goal`}
        </span>
      </div>
      <div class="mt-1.5 h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
        <div class="h-full rounded-full {readinessBarColor(avgReadiness)}" style="width:{avgReadiness}%"></div>
      </div>
    </div>

    <button
      type="button"
      on:click={() => (statusFilters = toggleArrayItem(statusFilters, 'High risk'))}
      class="text-left bg-white rounded-xl border p-3 shadow-xs hover:shadow-sm transition-all cursor-pointer {statusFilters.includes('High risk') ? 'border-rose-400 ring-2 ring-rose-100' : 'border-slate-200/80'}"
    >
      <div class="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-rose-600">
        <span>High Risk</span>
        <ShieldAlert size={13} />
      </div>
      <div class="mt-1 flex items-baseline gap-1.5">
        <span class="text-xl font-extrabold text-rose-700">{highRiskCount}</span>
        <span class="text-[10px] text-slate-500 font-medium">sites</span>
      </div>
      <div class="mt-1 text-[10px] text-rose-600/80 font-medium">Click to filter</div>
    </button>

    <button
      type="button"
      on:click={() => (statusFilters = toggleArrayItem(statusFilters, 'At risk'))}
      class="text-left bg-white rounded-xl border p-3 shadow-xs hover:shadow-sm transition-all cursor-pointer {statusFilters.includes('At risk') ? 'border-amber-400 ring-2 ring-amber-100' : 'border-slate-200/80'}"
    >
      <div class="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-amber-600">
        <span>At Risk</span>
        <Clock size={13} />
      </div>
      <div class="mt-1 flex items-baseline gap-1.5">
        <span class="text-xl font-extrabold text-amber-700">{atRiskCount}</span>
        <span class="text-[10px] text-slate-500 font-medium">sites</span>
      </div>
      <div class="mt-1 text-[10px] text-amber-600/80 font-medium">Click to filter</div>
    </button>

    <button
      type="button"
      on:click={() => (statusFilters = toggleArrayItem(statusFilters, 'On track'))}
      class="text-left bg-white rounded-xl border p-3 shadow-xs hover:shadow-sm transition-all cursor-pointer {statusFilters.includes('On track') ? 'border-emerald-400 ring-2 ring-emerald-100' : 'border-slate-200/80'}"
    >
      <div class="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-emerald-600">
        <span>On Track</span>
        <CheckCircle2 size={13} />
      </div>
      <div class="mt-1 flex items-baseline gap-1.5">
        <span class="text-xl font-extrabold text-emerald-700">{onTrackCount}</span>
        <span class="text-[10px] text-slate-500 font-medium">sites</span>
      </div>
      <div class="mt-1 text-[10px] text-emerald-600/80 font-medium">Click to filter</div>
    </button>

    <div class="bg-white rounded-xl border border-slate-200/80 p-3 shadow-xs hover:shadow-sm transition-shadow">
      <div class="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400">
        <span>Hard Blockers</span>
        <AlertTriangle size={13} class="text-rose-500" />
      </div>
      <div class="mt-1 flex items-baseline gap-1.5">
        <span class="text-xl font-extrabold text-slate-900">{totalHardGates}</span>
        <span class="text-[10px] font-bold text-rose-600">{totalCriticalSubjects} crit subj</span>
      </div>
      <div class="mt-1 text-[10px] text-slate-500">Across {kpiSites.length} shown sites</div>
    </div>
  </div>

  <!-- Top Visual Row: Map/Quadrant/Feeds (6) + Distribution (3) + Top 5 Priority Sites (3) -->
  <div class="grid grid-cols-1 lg:grid-cols-12 gap-3">
    <!-- Left 6 cols: Interactive Map / Risk Quadrant / Vendor Feeds -->
    <div class="lg:col-span-6 bg-white rounded-xl border border-slate-200/80 p-3 shadow-xs flex flex-col">
      <div class="flex items-center justify-between gap-2 pb-2 mb-2 border-b border-slate-100">
        <div>
          <h3 class="text-xs font-bold text-slate-900">
            {#if visualMode === 'map'}Global Site Readiness Map
            {:else if visualMode === 'quadrant'}Site Risk Quadrant (Readiness vs Hard Blockers)
            {:else}External Vendor & EDC Feed Health{/if}
          </h3>
          <p class="text-[10px] text-slate-500">
            {#if visualMode === 'map'}Click a country or site pin to filter or inspect
            {:else if visualMode === 'quadrant'}Hover bubble for details · Click to open site workspace
            {:else}Real-time ingestion lag affecting site readiness scores{/if}
          </p>
        </div>
        <div class="inline-flex rounded-lg bg-slate-100 p-0.5 text-[10px] font-semibold">
          <button
            type="button"
            on:click={() => (visualMode = 'map')}
            class="px-2 py-1 rounded-md cursor-pointer transition-colors {visualMode === 'map' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'}"
          >Map</button>
          <button
            type="button"
            on:click={() => (visualMode = 'quadrant')}
            class="px-2 py-1 rounded-md cursor-pointer transition-colors {visualMode === 'quadrant' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'}"
          >Quadrant</button>
          <button
            type="button"
            on:click={() => (visualMode = 'feeds')}
            class="px-2 py-1 rounded-md cursor-pointer transition-colors {visualMode === 'feeds' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'}"
          >Feeds</button>
        </div>
      </div>

      {#if visualMode === 'map'}
        <div class="rounded-lg overflow-hidden border border-slate-200/70">
          <WorldMapWidgetV3
            heightClass="h-[250px]"
            selectedCountry={countryFilters.length === 1 ? countryFilters[0] : 'all'}
            onSelectCountry={(c) => updateCountryFilters(c === 'all' ? [] : toggleArrayItem(countryFilters, c))}
            onSelectSite={(id) => onSelectSite(id)}
          />
        </div>
      {:else if visualMode === 'quadrant'}
        <div class="relative h-[250px] bg-slate-50/70 rounded-lg border border-slate-200/70 p-2">
          <svg viewBox="0 0 470 230" class="w-full h-full overflow-visible">
            <!-- Quadrant backgrounds (x: 46..452, y: 12..192) -->
            <rect x="46" y="12" width="203" height="90" fill="#fff1f2" opacity="0.6" />
            <rect x="249" y="12" width="203" height="90" fill="#fefce8" opacity="0.55" />
            <rect x="46" y="102" width="203" height="90" fill="#fffbeb" opacity="0.45" />
            <rect x="249" y="102" width="203" height="90" fill="#ecfdf5" opacity="0.6" />

            <!-- Gridlines -->
            {#each [2, 4, 6, 8] as yTick}
              {@const gy = 192 - (yTick / 8) * 180}
              <line x1="46" y1={gy} x2="452" y2={gy} stroke="#e2e8f0" stroke-width="0.75" />
              <line x1="42" y1={gy} x2="46" y2={gy} stroke="#64748b" stroke-width="1" />
              <text x="39" y={gy + 3} text-anchor="end" font-size="8" font-weight="600" fill="#64748b">{yTick}</text>
            {/each}
            <text x="39" y="195" text-anchor="end" font-size="8" font-weight="600" fill="#64748b">0</text>

            {#each [30, 50, 75, 100] as xTick}
              {@const gx = 46 + ((xTick - 30) / 70) * 406}
              <line x1={gx} y1="12" x2={gx} y2="192" stroke="#e2e8f0" stroke-width="0.75" />
              <line x1={gx} y1="192" x2={gx} y2="196" stroke="#64748b" stroke-width="1" />
              <text x={gx} y="206" text-anchor="middle" font-size="8" font-weight="600" fill="#64748b">{xTick}%</text>
            {/each}

            <!-- Quadrant center dividers -->
            <line x1="249" y1="12" x2="249" y2="192" stroke="#94a3b8" stroke-width="1" stroke-dasharray="3 3" />
            <line x1="46" y1="102" x2="452" y2="102" stroke="#94a3b8" stroke-width="1" stroke-dasharray="3 3" />

            <!-- Solid X & Y Axis Lines -->
            <line x1="46" y1="12" x2="46" y2="192" stroke="#475569" stroke-width="1.25" />
            <line x1="46" y1="192" x2="452" y2="192" stroke="#475569" stroke-width="1.25" />

            <!-- Axis Titles -->
            <text x="14" y="102" text-anchor="middle" font-size="8.5" font-weight="700" fill="#475569" transform="rotate(-90 14 102)">Hard Gate Blockers</text>
            <text x="249" y="222" text-anchor="middle" font-size="8.5" font-weight="700" fill="#475569">Site Readiness %</text>

            <!-- Quadrant Labels -->
            <text x="52" y="23" font-size="7.5" font-weight="700" fill="#be123c">CRITICAL INTERVENTION</text>
            <text x="446" y="23" text-anchor="end" font-size="7.5" font-weight="700" fill="#b45309">HIGH BLOCKER / WATCH</text>
            <text x="52" y="186" font-size="7.5" font-weight="700" fill="#d97706">LOW READINESS</text>
            <text x="446" y="186" text-anchor="end" font-size="7.5" font-weight="700" fill="#047857">LOCK READY</text>

            {#each filteredSites as s}
              {@const cx = 46 + Math.max(0, Math.min(1, (s.readiness - 30) / 70)) * 406}
              {@const cy = 192 - Math.max(0, Math.min(1, s.hardGateBlockers / 8)) * 180}
              {@const fill = s.riskLevel === 'High risk' ? '#f43f5e' : s.riskLevel === 'At risk' ? '#f59e0b' : '#10b981'}
              <circle
                {cx}
                {cy}
                r={hoveredQuadrantSite?.id === s.id ? 7.5 : 5.5}
                {fill}
                fill-opacity="0.85"
                stroke="#ffffff"
                stroke-width="1.5"
                class="cursor-pointer transition-all"
                role="button"
                tabindex="0"
                on:mouseenter={() => (hoveredQuadrantSite = s)}
                on:mouseleave={() => (hoveredQuadrantSite = null)}
                on:click={() => onSelectSite(s.id)}
                on:keydown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelectSite(s.id); } }}
              />
            {/each}
          </svg>
          {#if hoveredQuadrantSite}
            <div class="absolute top-2 right-2 bg-slate-900 text-white rounded-lg px-2.5 py-1.5 text-[10px] shadow-lg pointer-events-none">
              <div class="font-bold">Site {hoveredQuadrantSite.id} · {hoveredQuadrantSite.country}</div>
              <div class="text-slate-300">Readiness: {hoveredQuadrantSite.readiness}% · Hard Gates: {hoveredQuadrantSite.hardGateBlockers}</div>
            </div>
          {/if}
        </div>
      {:else}
        <div class="h-[250px] overflow-y-auto space-y-1.5 pr-1">
          {#each VENDOR_FEEDS as feed}
            <div class="flex items-center justify-between p-2 rounded-lg border border-slate-100 bg-slate-50/70">
              <div class="flex items-center gap-2 min-w-0">
                <span class="w-2 h-2 rounded-full shrink-0 {feed.health === 'ok' ? 'bg-emerald-500' : 'bg-amber-500'}"></span>
                <div class="min-w-0">
                  <div class="text-xs font-semibold text-slate-800 truncate">{feed.vendor}</div>
                  <div class="text-[10px] text-slate-500">{feed.records} records ingested</div>
                </div>
              </div>
              <div class="text-right shrink-0">
                <span class="px-1.5 py-0.5 rounded text-[10px] font-bold {feed.health === 'ok' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}">{feed.status}</span>
                <div class="text-[10px] text-slate-400 mt-0.5">{feed.lag}</div>
              </div>
            </div>
          {/each}
        </div>
      {/if}
    </div>

    <!-- Middle 3 cols: Interactive Readiness Distribution -->
    <div class="lg:col-span-3 bg-white rounded-xl border border-slate-200/80 p-3 shadow-xs flex flex-col justify-between">
      <div class="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
        <div>
          <h3 class="text-xs font-bold text-slate-900">Readiness Distribution</h3>
          <p class="text-[10px] text-slate-500">Click bands to multi-filter</p>
        </div>
        {#if readinessBands.length > 0}
          <button
            type="button"
            on:click={() => (readinessBands = [])}
            class="text-[10px] font-semibold text-blue-600 hover:underline cursor-pointer"
          >Clear</button>
        {/if}
      </div>

      <div class="flex-1 flex flex-col justify-center space-y-2.5">
        {#each distBuckets as b}
          {@const pct = Math.round((b.count / V3_SITES.length) * 100)}
          {@const active = readinessBands.includes(b.key)}
          <button
            type="button"
            on:click={() => (readinessBands = toggleArrayItem(readinessBands, b.key))}
            class="w-full text-left p-2 rounded-lg border transition-all cursor-pointer {active ? 'border-blue-500 bg-blue-50/50 ring-1 ring-blue-200' : 'border-slate-100 bg-slate-50/60 hover:bg-slate-100/70'}"
          >
            <div class="flex items-center justify-between text-[11px] font-semibold mb-1">
              <span class="text-slate-800">{b.label}</span>
              <span class="{b.text} font-bold">{b.count} sites ({pct}%)</span>
            </div>
            <div class="h-1.5 w-full rounded-full bg-slate-200/80 overflow-hidden">
              <div class="h-full rounded-full {b.color}" style="width:{pct}%"></div>
            </div>
          </button>
        {/each}
      </div>
    </div>

    <!-- Right 3 cols: Top 5 Priority Sites -->
    <div class="lg:col-span-3 bg-white rounded-xl border border-slate-200/80 p-3 shadow-xs flex flex-col">
      <div class="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
        <div>
          <h3 class="text-xs font-bold text-slate-900">Priority Intervention Sites</h3>
          <p class="text-[10px] text-slate-500">Lowest readiness · Click to open</p>
        </div>
        <span class="px-1.5 py-0.5 rounded bg-rose-50 text-rose-700 text-[10px] font-bold">Top 5</span>
      </div>

      <div class="flex-1 space-y-1.5">
        {#each topPrioritySites as site}
          <button
            type="button"
            on:click={() => onSelectSite(site.id)}
            class="w-full text-left p-2 rounded-lg border border-slate-100 bg-slate-50/70 hover:bg-blue-50/50 hover:border-blue-200 transition-all cursor-pointer flex items-center justify-between gap-2 group"
          >
            <div class="min-w-0">
              <div class="flex items-center gap-1.5">
                <span class="text-xs font-bold text-slate-900 group-hover:text-blue-700">Site {site.id}</span>
                <span class="text-[10px] text-slate-500 truncate">{site.country}</span>
              </div>
              <div class="text-[10px] text-slate-500 truncate">{site.primaryDriver}</div>
            </div>
            <div class="text-right shrink-0 flex items-center gap-1.5">
              <div>
                <div class="text-xs font-extrabold {site.readiness < 55 ? 'text-rose-600' : 'text-amber-600'}">{site.readiness}%</div>
                <div class="text-[9px] text-slate-400">+{site.dblImpactDays}d DBL</div>
              </div>
              <ChevronRight size={13} class="text-slate-300 group-hover:text-blue-600" />
            </div>
          </button>
        {/each}
      </div>
    </div>
  </div>

  <!-- 7-Card Country Risk Strip (Multi-Select) -->
  <div class="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
    {#each V3_COUNTRY_SUMMARY as c}
      {@const isSelected = countryFilters.includes(c.country)}
      <button
        type="button"
        on:click={() => updateCountryFilters(toggleArrayItem(countryFilters, c.country))}
        class="text-left bg-white rounded-xl border p-2.5 shadow-xs hover:shadow-sm transition-all cursor-pointer {isSelected ? 'border-blue-500 ring-2 ring-blue-100 bg-blue-50/30' : 'border-slate-200/80 hover:border-slate-300'}"
      >
        <div class="flex items-center justify-between gap-1">
          <span class="text-xs font-bold text-slate-900 truncate">{c.flag} {c.country}</span>
          <span class="text-[10px] font-bold {c.readiness >= 80 ? 'text-emerald-600' : c.readiness >= 65 ? 'text-amber-600' : 'text-rose-600'}">{c.readiness}%</span>
        </div>
        <div class="mt-1 h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
          <div class="h-full rounded-full {readinessBarColor(c.readiness)}" style="width:{c.readiness}%"></div>
        </div>
        <div class="mt-1.5 flex items-center justify-between text-[10px] text-slate-500">
          <span>{c.sites} sites</span>
          <span class="{c.highRiskSites > 0 ? 'text-rose-600 font-semibold' : ''}">{c.highRiskSites} high risk</span>
        </div>
      </button>
    {/each}
  </div>

  <!-- Full-Width Site Details Table with Multi-Select Filter Bar -->
  <div class="bg-white rounded-xl border border-slate-200/80 p-3 shadow-xs space-y-2.5">
    <div class="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-100">
      <div class="flex items-center gap-2">
        <h3 class="text-xs font-bold text-slate-900">Site Readiness Directory</h3>
        <span class="px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[10px] font-bold">{filteredSites.length} of {V3_SITES.length}</span>
      </div>
      <div class="flex items-center gap-2">
        <span class="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-lg border border-slate-200/80 bg-slate-50 text-[10px] font-medium text-slate-500">
          <ArrowUpDown size={10} class="text-slate-400" /> Click any column to sort · Click row to open Site Workspace
        </span>
        <select bind:value={sitePageSize} on:change={() => (sitePage = 1)} class="border border-slate-200 rounded-lg px-2 py-1 bg-white text-xs text-slate-700 cursor-pointer">
          <option value={10}>10 / page</option>
          <option value={25}>25 / page</option>
          <option value={50}>50 / page</option>
          <option value={V3_SITES.length}>All ({V3_SITES.length})</option>
        </select>
      </div>
    </div>

    <!-- Polished Multi-Select Filter Bar -->
    <div class="rounded-xl bg-slate-50/90 border border-slate-200/80 p-2.5 space-y-2">
      <!-- Row 1: Status Multi-Select Pills + Critical Toggle -->
      <div class="flex flex-wrap items-center justify-between gap-2">
        <div class="flex flex-wrap items-center gap-1.5">
          <span class="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 mr-1">
            <Filter size={11} /> Status
          </span>
          <button
            type="button"
            on:click={() => (statusFilters = [])}
            class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-all cursor-pointer {statusFilters.length === 0 ? 'bg-slate-900 text-white border-slate-900 shadow-2xs' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'}"
          >
            <span>All</span>
            <span class="px-1.5 rounded-full text-[10px] font-bold {statusFilters.length === 0 ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'}">{statusCounts.all}</span>
          </button>
          {#each [
            { key: 'High risk', label: 'High risk', count: statusCounts['High risk'], dot: 'bg-rose-500' },
            { key: 'At risk', label: 'At risk', count: statusCounts['At risk'], dot: 'bg-amber-500' },
            { key: 'On track', label: 'On track', count: statusCounts['On track'], dot: 'bg-emerald-500' },
          ] as pill}
            {@const active = statusFilters.includes(pill.key)}
            <button
              type="button"
              on:click={() => (statusFilters = toggleArrayItem(statusFilters, pill.key))}
              class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-all cursor-pointer {active ? 'bg-slate-900 text-white border-slate-900 shadow-2xs' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'}"
            >
              <span class="w-1.5 h-1.5 rounded-full {pill.dot}"></span>
              <span>{pill.label}</span>
              <span class="px-1.5 rounded-full text-[10px] font-bold {active ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'}">{pill.count}</span>
            </button>
          {/each}
        </div>

        <button
          type="button"
          on:click={() => (onlyCriticalSites = !onlyCriticalSites)}
          class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-all cursor-pointer {onlyCriticalSites ? 'bg-rose-600 text-white border-rose-600 shadow-2xs' : 'bg-white text-slate-600 border-slate-200 hover:border-rose-300 hover:text-rose-700'}"
        >
          <span class="w-1.5 h-1.5 rounded-full {onlyCriticalSites ? 'bg-white' : 'bg-rose-500'}"></span>
          Hard Gate Blockers Only
        </button>
      </div>

      <!-- Row 2: Search + Multi-Select Dropdowns -->
      <div class="flex flex-wrap items-center gap-2">
        <div class="relative flex-1 min-w-[220px]">
          <Search size={13} class="absolute left-2.5 top-2 text-slate-400" />
          <input
            type="text"
            bind:value={searchQuery}
            placeholder="Search site ID, institution, PI, country, or risk driver..."
            class="w-full pl-8 pr-7 py-1.5 text-xs border border-slate-200 rounded-lg bg-white focus:outline-hidden focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
          />
          {#if searchQuery}
            <button
              type="button"
              on:click={() => (searchQuery = '')}
              class="absolute right-2 top-2 text-slate-400 hover:text-slate-600 cursor-pointer"
              aria-label="Clear search"
            >
              <X size={13} />
            </button>
          {/if}
        </div>

        <MultiSelectFilter
          label="Regions"
          options={allRegions.map((r) => ({ value: r, label: r }))}
          selected={regionFilters}
          onChange={(next) => (regionFilters = next)}
        />
        <MultiSelectFilter
          label="Countries"
          options={allCountries.map((c) => ({
            value: c,
            label: c,
            count: V3_SITES.filter((s) => s.country === c).length,
          }))}
          selected={countryFilters}
          onChange={(next) => updateCountryFilters(next)}
        />
        <MultiSelectFilter
          label="Readiness"
          options={distBuckets.map((b) => ({
            value: b.key,
            label: b.label,
            count: b.count,
            dotColor: b.dot,
          }))}
          selected={readinessBands}
          onChange={(next) => (readinessBands = next)}
        />
        <MultiSelectFilter
          label="Drivers"
          options={allDrivers.map((d) => ({ value: d, label: d }))}
          selected={driverFilters}
          onChange={(next) => (driverFilters = next)}
        />
      </div>
    </div>

    <!-- Sortable Table -->
    <div class="rounded-lg border border-slate-200/80 overflow-x-auto">
      <table class="w-full text-xs">
        <thead class="bg-slate-50 border-b border-slate-200 text-[10px] font-bold uppercase tracking-wider text-slate-500">
          <tr>
            {#each [
              { col: 'id', label: 'Site', align: 'text-left' },
              { col: 'country', label: 'Country', align: 'text-left' },
              { col: 'piName', label: 'Principal Investigator', align: 'text-left' },
              { col: 'enrolled', label: 'Subjects', align: 'text-right' },
              { col: 'readiness', label: 'Readiness %', align: 'text-left' },
              { col: 'riskLevel', label: 'Status', align: 'text-left' },
              { col: 'hardGateBlockers', label: 'Hard Gates', align: 'text-right' },
              { col: 'dblImpactDays', label: 'DBL Impact', align: 'text-right' },
              { col: 'primaryDriver', label: 'Primary Driver', align: 'text-left' },
            ] as h}
              <th class="px-3 py-2 {h.align}">
                <button
                  type="button"
                  on:click={() => toggleSort(h.col as SortCol)}
                  class="inline-flex items-center gap-1 hover:text-slate-900 cursor-pointer"
                >
                  <span>{h.label}</span>
                  {#if sortCol === h.col}
                    {#if sortDir === 'asc'}<ArrowUp size={11} class="text-blue-600" />
                    {:else}<ArrowDown size={11} class="text-blue-600" />{/if}
                  {:else}
                    <ArrowUpDown size={10} class="text-slate-300" />
                  {/if}
                </button>
              </th>
            {/each}
            <th class="px-3 py-2 text-right">Workspace</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100">
          {#if filteredSites.length === 0}
            <tr>
              <td colspan="10" class="px-4 py-8 text-center text-slate-500">
                No sites match the selected filters.
                <button type="button" on:click={resetAllFilters} class="ml-1 text-blue-600 font-semibold hover:underline cursor-pointer">Reset filters</button>
              </td>
            </tr>
          {:else}
            {#each pagedSites as site}
              <tr
                on:click={() => onSelectSite(site.id)}
                class="hover:bg-blue-50/40 cursor-pointer transition-colors group"
              >
                <td class="px-3 py-2">
                  <div class="font-bold text-slate-900 group-hover:text-blue-700">Site {site.id}</div>
                  <div class="text-[10px] text-slate-500 truncate max-w-[170px]">{site.name}</div>
                </td>
                <td class="px-3 py-2 text-slate-700 font-medium">{site.country}</td>
                <td class="px-3 py-2 text-slate-600">{site.piName}</td>
                <td class="px-3 py-2 text-right font-mono font-semibold text-slate-800">{site.enrolled}</td>
                <td class="px-3 py-2">
                  <div class="flex items-center gap-2">
                    <span class="font-mono font-bold text-slate-900 w-9">{site.readiness}%</span>
                    <div class="w-16 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                      <div class="h-full rounded-full {readinessBarColor(site.readiness)}" style="width:{site.readiness}%"></div>
                    </div>
                  </div>
                </td>
                <td class="px-3 py-2">
                  <span class="inline-flex px-2 py-0.5 rounded-full border text-[10px] font-bold {statusBadgeClass(site.riskLevel)}">{site.riskLevel}</span>
                </td>
                <td class="px-3 py-2 text-right font-mono font-bold {site.hardGateBlockers > 0 ? 'text-rose-600' : 'text-slate-400'}">{site.hardGateBlockers}</td>
                <td class="px-3 py-2 text-right font-mono font-semibold {site.dblImpactDays > 0 ? 'text-amber-700' : 'text-emerald-600'}">{site.dblImpactDays > 0 ? `+${site.dblImpactDays}d` : '0d'}</td>
                <td class="px-3 py-2 text-slate-600 max-w-[200px] truncate">{site.primaryDriver}</td>
                <td class="px-3 py-2 text-right" on:click|stopPropagation>
                  <button
                    type="button"
                    on:click={() => onSelectSite(site.id)}
                    class="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white text-[10px] font-bold transition-colors cursor-pointer"
                  >Open <ExternalLink size={10} /></button>
                </td>
              </tr>
            {/each}
          {/if}
        </tbody>
      </table>
    </div>

    <!-- Pagination Footer -->
    <div class="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs">
      <span class="text-slate-500">
        Showing {filteredSites.length === 0 ? 0 : (sitePage - 1) * sitePageSize + 1}–{Math.min(sitePage * sitePageSize, filteredSites.length)} of {filteredSites.length} sites · Page {sitePage} of {totalSitePages}
      </span>
      <div class="flex items-center gap-1.5">
        <button
          type="button"
          disabled={sitePage <= 1}
          on:click={() => (sitePage = Math.max(1, sitePage - 1))}
          class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-200 text-slate-700 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed hover:bg-slate-50"
        >
          <ChevronLeft size={13} /> Prev
        </button>
        {#each visibleSitePages as p}
          <button
            type="button"
            on:click={() => (sitePage = p)}
            class="px-2.5 py-1 rounded-lg border text-xs font-semibold cursor-pointer {sitePage === p ? 'bg-blue-600 text-white border-blue-600' : 'border-slate-200 text-slate-700 hover:bg-slate-50'}"
          >
            {p}
          </button>
        {/each}
        <button
          type="button"
          disabled={sitePage >= totalSitePages}
          on:click={() => (sitePage = Math.min(totalSitePages, sitePage + 1))}
          class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-200 text-slate-700 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed hover:bg-slate-50"
        >
          Next <ChevronRight size={13} />
        </button>
      </div>
    </div>
  </div>
</div>
