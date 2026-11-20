<script lang="ts">
  import {
    ChevronRight,
    Search,
    SlidersHorizontal,
    ArrowUpDown,
    ArrowUp,
    ArrowDown,
    Table,
    LayoutGrid,
    RotateCcw,
    TrendingUp,
    TrendingDown,
    ShieldAlert,
    Sparkles,
    Filter,
    X,
    Activity,
    Clock,
    Layers,
  } from '@lucide/svelte';
  import { V3_PORTFOLIO_STUDIES, countryFlag, type V3PortfolioStudy } from '../data/v3Data';
  import MultiSelectFilter from './MultiSelectFilter.svelte';

  export let onSelectStudy: (studyId: string) => void;

  // Multi-select filter state
  let studySearch = '';
  let taFilters: string[] = [];
  let phaseFilters: string[] = [];
  let countryFilters: string[] = [];
  let domainFilters: string[] = [];
  let ownerFilters: string[] = [];
  let actionStatusFilters: string[] = [];
  let milestoneFilters: string[] = [];
  let riskTierFilters: string[] = [];

  let dblStatusFilter: 'all' | 'delayed' | 'on_track' = 'all';
  let trajectoryFilter: 'all' | 'improving' | 'slipping' = 'all';
  let recoverableOnly = false;

  // View & Sorting
  let viewLayout: 'table' | 'cards' = 'table';
  type SortField =
    | 'priorityScore'
    | 'readiness'
    | 'variance'
    | 'delayDays'
    | 'probDelay'
    | 'hardGates'
    | 'recoverableDays'
    | 'targetDbl'
    | 'predictedDbl';
  let sortField: SortField = 'priorityScore';
  let sortDir: 'asc' | 'desc' = 'desc';

  const milestoneOptions = [
    { id: 'dbl', label: 'Database Lock (DBL)' },
    { id: 'lslv', label: 'Last Subject Last Visit (LSLV)' },
    { id: 'protocol_amendments', label: 'Protocol Amendments' },
    { id: 'submissions', label: 'Regulatory Submissions' },
    { id: 'safety_milestones', label: 'Safety Milestones / DMC' },
  ];

  const availableTAs = Array.from(new Set(V3_PORTFOLIO_STUDIES.map((s) => s.therapeuticArea))).sort();
  const availablePhases = Array.from(new Set(V3_PORTFOLIO_STUDIES.map((s) => s.phase))).sort();
  const availableCountries = Array.from(new Set(V3_PORTFOLIO_STUDIES.flatMap((s) => s.countries))).sort();
  const availableDomains = Array.from(
    new Set(V3_PORTFOLIO_STUDIES.map((s) => s.criticalDomain).filter((d) => d !== 'None'))
  ).sort();
  const availableOwners = Array.from(new Set(V3_PORTFOLIO_STUDIES.map((s) => s.owner))).sort();
  const availableStatuses = ['Escalated', 'In Progress', 'Assigned', 'On Track'];

  function toggleArrayItem(arr: string[], val: string): string[] {
    return arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val];
  }

  function clearAllFilters() {
    studySearch = '';
    taFilters = [];
    phaseFilters = [];
    countryFilters = [];
    domainFilters = [];
    ownerFilters = [];
    actionStatusFilters = [];
    milestoneFilters = [];
    riskTierFilters = [];
    dblStatusFilter = 'all';
    trajectoryFilter = 'all';
    recoverableOnly = false;
  }

  $: activeFilterCount =
    (studySearch.trim() ? 1 : 0) +
    taFilters.length +
    phaseFilters.length +
    countryFilters.length +
    domainFilters.length +
    ownerFilters.length +
    actionStatusFilters.length +
    milestoneFilters.length +
    riskTierFilters.length +
    (dblStatusFilter !== 'all' ? 1 : 0) +
    (trajectoryFilter !== 'all' ? 1 : 0) +
    (recoverableOnly ? 1 : 0);

  $: filteredStudies = V3_PORTFOLIO_STUDIES.filter((s) => {
    const q = studySearch.trim().toLowerCase();
    if (q) {
      const hit =
        s.id.toLowerCase().includes(q) ||
        s.title.toLowerCase().includes(q) ||
        s.indication.toLowerCase().includes(q) ||
        s.therapeuticArea.toLowerCase().includes(q) ||
        s.criticalDriver.toLowerCase().includes(q) ||
        s.owner.toLowerCase().includes(q);
      if (!hit) return false;
    }
    if (taFilters.length > 0 && !taFilters.includes(s.therapeuticArea)) return false;
    if (phaseFilters.length > 0 && !phaseFilters.includes(s.phase)) return false;
    if (countryFilters.length > 0 && !s.countries.some((c) => countryFilters.includes(c))) return false;
    if (domainFilters.length > 0 && !domainFilters.includes(s.criticalDomain)) return false;
    if (ownerFilters.length > 0 && !ownerFilters.includes(s.owner)) return false;
    if (actionStatusFilters.length > 0 && !actionStatusFilters.includes(s.actionStatus)) return false;
    if (milestoneFilters.length > 0 && !s.milestones.some((m) => milestoneFilters.includes(m))) return false;
    if (riskTierFilters.length > 0 && !riskTierFilters.includes(s.riskTier)) return false;
    if (dblStatusFilter === 'delayed' && s.delayDays === 0) return false;
    if (dblStatusFilter === 'on_track' && s.delayDays > 0) return false;
    if (trajectoryFilter === 'improving' && s.trend7d <= 0) return false;
    if (trajectoryFilter === 'slipping' && s.trend7d >= 0) return false;
    if (recoverableOnly && s.recoverableDays <= 0) return false;
    return true;
  });

  function toggleSort(field: SortField) {
    if (sortField === field) {
      sortDir = sortDir === 'desc' ? 'asc' : 'desc';
    } else {
      sortField = field;
      sortDir =
        field === 'readiness' || field === 'variance' || field === 'targetDbl' || field === 'predictedDbl'
          ? 'asc'
          : 'desc';
    }
  }

  $: sortedStudies = [...filteredStudies].sort((a, b) => {
    const dir = sortDir === 'asc' ? 1 : -1;
    if (sortField === 'variance') {
      return (a.readiness - a.expected - (b.readiness - b.expected)) * dir;
    }
    if (sortField === 'targetDbl' || sortField === 'predictedDbl') {
      return (new Date(a[sortField]).getTime() - new Date(b[sortField]).getTime()) * dir;
    }
    return ((a[sortField] as number) - (b[sortField] as number)) * dir;
  });

  // Dynamic KPIs reflecting current filtered slice
  $: studiesMissing = filteredStudies.filter((s) => s.delayDays > 0).length;
  $: totalBlockers = filteredStudies.reduce((sum, s) => sum + s.hardGates, 0);
  $: totalDelayExposure = filteredStudies.reduce((sum, s) => sum + s.delayDays, 0);
  $: totalRecoverable = filteredStudies.reduce((sum, s) => sum + s.recoverableDays, 0);
  $: meanReadiness = filteredStudies.length
    ? Math.round(filteredStudies.reduce((sum, s) => sum + s.readiness, 0) / filteredStudies.length)
    : 0;

  // Therapeutic Area summary
  $: taSummary = availableTAs.map((ta) => {
    const list = V3_PORTFOLIO_STUDIES.filter((s) => s.therapeuticArea === ta);
    const avg = Math.round(list.reduce((acc, s) => acc + s.readiness, 0) / Math.max(1, list.length));
    const slip = list.reduce((acc, s) => acc + s.delayDays, 0);
    return { ta, count: list.length, avg, slip };
  });

  // Top 3 priority recoverable studies
  $: topPriorityStudies = [...V3_PORTFOLIO_STUDIES]
    .sort((a, b) => b.priorityScore - a.priorityScore)
    .slice(0, 3);

  function statusBadge(status: V3PortfolioStudy['actionStatus']): string {
    if (status === 'Escalated') return 'bg-rose-50 text-rose-700 border-rose-200';
    if (status === 'In Progress') return 'bg-amber-50 text-amber-700 border-amber-200';
    if (status === 'Assigned') return 'bg-blue-50 text-blue-700 border-blue-200';
    return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  }

  function priorityBadge(score: number): string {
    if (score >= 70) return 'bg-rose-100 text-rose-800 border-rose-200';
    if (score >= 45) return 'bg-amber-100 text-amber-800 border-amber-200';
    if (score >= 25) return 'bg-blue-100 text-blue-800 border-blue-200';
    return 'bg-slate-100 text-slate-700 border-slate-200';
  }

  function riskTierBadge(tier: V3PortfolioStudy['riskTier']): string {
    if (tier === 'Critical') return 'bg-rose-50 text-rose-700 border-rose-200';
    if (tier === 'High') return 'bg-amber-50 text-amber-700 border-amber-200';
    if (tier === 'Medium') return 'bg-blue-50 text-blue-700 border-blue-200';
    return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  }

  function readinessBarColor(readiness: number, expected: number): string {
    if (readiness >= expected) return 'bg-emerald-500';
    if (expected - readiness <= 5) return 'bg-amber-500';
    return 'bg-rose-500';
  }

  function formatCountries(countries: string[]): string {
    const withFlags = countries.map((c) => {
      const f = countryFlag(c);
      return f ? `${f} ${c}` : c;
    });
    if (withFlags.length <= 3) return withFlags.join(', ');
    return `${withFlags.slice(0, 3).join(', ')} +${withFlags.length - 3}`;
  }
</script>

<div class="space-y-2.5">
  <!-- Executive Portfolio Header Card -->
  <div class="bg-white rounded-xl border border-slate-200/80 shadow-xs px-4 py-3 flex flex-wrap items-center justify-between gap-3">
    <div>
      <div class="flex flex-wrap items-center gap-2">
        <span class="text-[11px] font-bold uppercase tracking-wider text-blue-600">
          Portfolio Command · D-60 to Forecast DBL
        </span>
        {#if activeFilterCount > 0}
          <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-[10px] font-bold text-blue-700">
            <Filter size={10} /> {activeFilterCount} filter{activeFilterCount > 1 ? 's' : ''} active
          </span>
        {/if}
      </div>
      <h1 class="text-lg font-bold text-slate-900 mt-0.5 tracking-tight">Studies in Active Lock Window</h1>
      <p class="text-[11px] text-slate-500 mt-0.5">
        Ranked by <span class="font-semibold text-slate-700">Highest Recoverable DBL Risk</span> — filter across therapeutic areas, milestones, domains, and click any study to inspect.
      </p>
    </div>

    <div class="flex items-center gap-2">
      {#if activeFilterCount > 0}
        <button
          type="button"
          on:click={clearAllFilters}
          class="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 cursor-pointer"
        >
          <RotateCcw size={12} /> Reset Filters
        </button>
      {/if}
      <button
        type="button"
        on:click={() => onSelectStudy('CA-209-301')}
        class="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs cursor-pointer transition-colors"
      >
        Open Featured Study: CA-209-301 <ChevronRight size={14} />
      </button>
    </div>
  </div>

  <!-- 5 Interactive Portfolio KPIs -->
  <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
    <button
      type="button"
      on:click={clearAllFilters}
      class="text-left bg-white rounded-xl border p-3 shadow-xs transition-all cursor-pointer hover:border-blue-300 {activeFilterCount === 0 ? 'border-blue-200 ring-1 ring-blue-100' : 'border-slate-200/80'}"
    >
      <div class="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400">
        <span>Studies in Scope</span>
        <Layers size={13} class="text-blue-500" />
      </div>
      <div class="mt-1 flex items-baseline gap-1.5">
        <span class="text-2xl font-extrabold text-slate-900">{filteredStudies.length}</span>
        <span class="text-xs text-slate-400 font-semibold">/ {V3_PORTFOLIO_STUDIES.length}</span>
      </div>
      <div class="text-[10px] text-slate-500 mt-1">Mean readiness: <strong class="text-slate-800">{meanReadiness}%</strong></div>
    </button>

    <button
      type="button"
      on:click={() => { dblStatusFilter = dblStatusFilter === 'delayed' ? 'all' : 'delayed'; }}
      class="text-left bg-white rounded-xl border p-3 shadow-xs transition-all cursor-pointer hover:border-rose-300 {dblStatusFilter === 'delayed' ? 'border-rose-300 ring-2 ring-rose-100' : 'border-slate-200/80'}"
    >
      <div class="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-rose-600">
        <span>Forecast to Miss DBL</span>
        <Clock size={13} />
      </div>
      <div class="mt-1 flex items-baseline gap-1.5">
        <span class="text-2xl font-extrabold text-rose-600">{studiesMissing}</span>
        <span class="text-xs text-slate-400 font-semibold">of {filteredStudies.length}</span>
      </div>
      <div class="text-[10px] text-rose-600/80 mt-1">Click to {dblStatusFilter === 'delayed' ? 'clear' : 'filter delayed'}</div>
    </button>

    <div class="bg-white rounded-xl border border-slate-200/80 p-3 shadow-xs">
      <div class="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400">
        <span>Critical-Path Blockers</span>
        <ShieldAlert size={13} class="text-rose-500" />
      </div>
      <div class="text-2xl font-extrabold text-slate-900 mt-1">{totalBlockers}</div>
      <div class="text-[10px] text-slate-500 mt-1">Hard-gate blockers across slice</div>
    </div>

    <div class="bg-white rounded-xl border border-slate-200/80 p-3 shadow-xs">
      <div class="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400">
        <span>Portfolio Delay Exposure</span>
        <Activity size={13} class="text-amber-500" />
      </div>
      <div class="text-2xl font-extrabold text-amber-600 mt-1">+{totalDelayExposure}d</div>
      <div class="text-[10px] text-slate-500 mt-1">Cumulative forecast slip days</div>
    </div>

    <button
      type="button"
      on:click={() => { recoverableOnly = !recoverableOnly; }}
      class="text-left rounded-xl border p-3 shadow-xs transition-all cursor-pointer bg-emerald-50/40 hover:border-emerald-400 {recoverableOnly ? 'border-emerald-400 ring-2 ring-emerald-200' : 'border-emerald-200'}"
    >
      <div class="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-emerald-700">
        <span>Intervention Opportunity</span>
        <Sparkles size={13} />
      </div>
      <div class="text-2xl font-extrabold text-emerald-700 mt-1">{totalRecoverable}d</div>
      <div class="text-[10px] text-emerald-700 mt-1">Click to {recoverableOnly ? 'show all' : 'filter recoverable'}</div>
    </button>
  </div>

  <!-- Full-Width Studies Directory with Multi-Select Filter Bar -->
  <div class="bg-white rounded-xl border border-slate-200/80 p-3 shadow-xs space-y-2.5">
    <div class="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-100">
      <div class="flex items-center gap-2">
        <h3 class="text-xs font-bold text-slate-900">Portfolio Studies Directory</h3>
        <span class="px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[10px] font-bold">{sortedStudies.length} of {V3_PORTFOLIO_STUDIES.length}</span>
      </div>

      <div class="flex items-center gap-2">
        <span class="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-lg border border-slate-200/80 bg-slate-50 text-[10px] font-medium text-slate-500">
          <ArrowUpDown size={10} class="text-slate-400" /> Click column to sort · Click study to inspect
        </span>
        <div class="inline-flex rounded-lg bg-slate-100 p-0.5 text-[11px] font-semibold">
          <button
            type="button"
            on:click={() => (viewLayout = 'table')}
            class="inline-flex items-center gap-1 px-2 py-1 rounded-md cursor-pointer {viewLayout === 'table' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'}"
          >
            <Table size={12} /> Table
          </button>
          <button
            type="button"
            on:click={() => (viewLayout = 'cards')}
            class="inline-flex items-center gap-1 px-2 py-1 rounded-md cursor-pointer {viewLayout === 'cards' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'}"
          >
            <LayoutGrid size={12} /> Cards
          </button>
        </div>
      </div>
    </div>

    <!-- Polished Multi-Select Filter Bar -->
    <div class="rounded-xl bg-slate-50/90 border border-slate-200/80 p-2.5 space-y-2">
      <!-- Row 1: Risk Tier Multi-Select Pills + Status Toggles -->
      <div class="flex flex-wrap items-center justify-between gap-2">
        <div class="flex flex-wrap items-center gap-1.5">
          <span class="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 mr-1">
            <Filter size={11} /> Risk Tier
          </span>
          <button
            type="button"
            on:click={() => (riskTierFilters = [])}
            class="px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-all cursor-pointer {riskTierFilters.length === 0 ? 'bg-slate-900 text-white border-slate-900 shadow-2xs' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'}"
          >
            All ({V3_PORTFOLIO_STUDIES.length})
          </button>
          {#each [
            { tier: 'Critical', dot: 'bg-rose-500' },
            { tier: 'High', dot: 'bg-amber-500' },
            { tier: 'Medium', dot: 'bg-blue-500' },
            { tier: 'Low', dot: 'bg-emerald-500' },
          ] as item}
            {@const active = riskTierFilters.includes(item.tier)}
            <button
              type="button"
              on:click={() => (riskTierFilters = toggleArrayItem(riskTierFilters, item.tier))}
              class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-all cursor-pointer {active ? 'bg-slate-900 text-white border-slate-900 shadow-2xs' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'}"
            >
              <span class="w-1.5 h-1.5 rounded-full {item.dot}"></span>
              <span>{item.tier}</span>
            </button>
          {/each}
        </div>

        <div class="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            on:click={() => (dblStatusFilter = dblStatusFilter === 'delayed' ? 'all' : 'delayed')}
            class="px-2.5 py-1 rounded-full text-[11px] font-semibold border cursor-pointer {dblStatusFilter === 'delayed' ? 'bg-rose-600 text-white border-rose-600' : 'bg-white text-slate-600 border-slate-200 hover:border-rose-300'}"
          >
            Delayed Only
          </button>
          <button
            type="button"
            on:click={() => (trajectoryFilter = trajectoryFilter === 'slipping' ? 'all' : 'slipping')}
            class="px-2.5 py-1 rounded-full text-[11px] font-semibold border cursor-pointer {trajectoryFilter === 'slipping' ? 'bg-amber-600 text-white border-amber-600' : 'bg-white text-slate-600 border-slate-200 hover:border-amber-300'}"
          >
            Slipping Trend
          </button>
        </div>
      </div>

      <!-- Row 2: Search + Multi-Select Dropdowns -->
      <div class="flex flex-wrap items-center gap-2">
        <div class="relative flex-1 min-w-[200px]">
          <Search size={13} class="absolute left-2.5 top-2 text-slate-400" />
          <input
            type="text"
            bind:value={studySearch}
            placeholder="Search study ID, title, indication, driver, or owner..."
            class="w-full pl-8 pr-7 py-1.5 text-xs border border-slate-200 rounded-lg bg-white focus:outline-hidden focus:border-blue-500"
          />
          {#if studySearch}
            <button
              type="button"
              on:click={() => (studySearch = '')}
              class="absolute right-2 top-2 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X size={13} />
            </button>
          {/if}
        </div>

        <MultiSelectFilter
          label="Therapeutic Area"
          options={availableTAs.map((t) => ({ value: t, label: t }))}
          selected={taFilters}
          onChange={(next) => (taFilters = next)}
        />
        <MultiSelectFilter
          label="Phases"
          options={availablePhases.map((p) => ({ value: p, label: p }))}
          selected={phaseFilters}
          onChange={(next) => (phaseFilters = next)}
        />
        <MultiSelectFilter
          label="Countries"
          options={availableCountries.map((c) => ({ value: c, label: c }))}
          selected={countryFilters}
          onChange={(next) => (countryFilters = next)}
        />
        <MultiSelectFilter
          label="Critical Domains"
          options={availableDomains.map((d) => ({ value: d, label: d }))}
          selected={domainFilters}
          onChange={(next) => (domainFilters = next)}
        />
        <MultiSelectFilter
          label="Owners"
          options={availableOwners.map((o) => ({ value: o, label: o }))}
          selected={ownerFilters}
          onChange={(next) => (ownerFilters = next)}
        />
        <MultiSelectFilter
          label="Action Status"
          options={availableStatuses.map((s) => ({ value: s, label: s }))}
          selected={actionStatusFilters}
          onChange={(next) => (actionStatusFilters = next)}
        />
        <MultiSelectFilter
          label="Milestones"
          options={milestoneOptions.map((m) => ({ value: m.id, label: m.label }))}
          selected={milestoneFilters}
          onChange={(next) => (milestoneFilters = next)}
        />
      </div>
    </div>

    {#if viewLayout === 'table'}
      <div class="rounded-lg border border-slate-200/80 overflow-x-auto">
        <table class="w-full text-xs">
          <thead class="bg-slate-50 border-b border-slate-200 text-[10px] font-bold uppercase tracking-wider text-slate-500">
            <tr>
              <th class="px-3 py-2 text-left">
                <button type="button" on:click={() => toggleSort('priorityScore')} class="inline-flex items-center gap-1 hover:text-slate-900 cursor-pointer">
                  <span>Priority</span>
                  {#if sortField === 'priorityScore'}
                    {#if sortDir === 'asc'}<ArrowUp size={11} class="text-blue-600" />{:else}<ArrowDown size={11} class="text-blue-600" />{/if}
                  {:else}<ArrowUpDown size={10} class="text-slate-300" />{/if}
                </button>
              </th>
              <th class="px-3 py-2 text-left">Study / Indication</th>
              <th class="px-3 py-2 text-left">
                <button type="button" on:click={() => toggleSort('readiness')} class="inline-flex items-center gap-1 hover:text-slate-900 cursor-pointer">
                  <span>Readiness</span>
                  {#if sortField === 'readiness'}
                    {#if sortDir === 'asc'}<ArrowUp size={11} class="text-blue-600" />{:else}<ArrowDown size={11} class="text-blue-600" />{/if}
                  {:else}<ArrowUpDown size={10} class="text-slate-300" />{/if}
                </button>
              </th>
              <th class="px-3 py-2 text-left">
                <button type="button" on:click={() => toggleSort('targetDbl')} class="inline-flex items-center gap-1 hover:text-slate-900 cursor-pointer">
                  <span>Target / Pred DBL</span>
                  {#if sortField === 'targetDbl'}
                    {#if sortDir === 'asc'}<ArrowUp size={11} class="text-blue-600" />{:else}<ArrowDown size={11} class="text-blue-600" />{/if}
                  {:else}<ArrowUpDown size={10} class="text-slate-300" />{/if}
                </button>
              </th>
              <th class="px-3 py-2 text-right">
                <button type="button" on:click={() => toggleSort('delayDays')} class="inline-flex items-center gap-1 hover:text-slate-900 cursor-pointer">
                  <span>Delay</span>
                  {#if sortField === 'delayDays'}
                    {#if sortDir === 'asc'}<ArrowUp size={11} class="text-blue-600" />{:else}<ArrowDown size={11} class="text-blue-600" />{/if}
                  {:else}<ArrowUpDown size={10} class="text-slate-300" />{/if}
                </button>
              </th>
              <th class="px-3 py-2 text-right">
                <button type="button" on:click={() => toggleSort('hardGates')} class="inline-flex items-center gap-1 hover:text-slate-900 cursor-pointer">
                  <span>Blockers</span>
                  {#if sortField === 'hardGates'}
                    {#if sortDir === 'asc'}<ArrowUp size={11} class="text-blue-600" />{:else}<ArrowDown size={11} class="text-blue-600" />{/if}
                  {:else}<ArrowUpDown size={10} class="text-slate-300" />{/if}
                </button>
              </th>
              <th class="px-3 py-2 text-right">
                <button type="button" on:click={() => toggleSort('recoverableDays')} class="inline-flex items-center gap-1 hover:text-slate-900 cursor-pointer">
                  <span>Recoverable</span>
                  {#if sortField === 'recoverableDays'}
                    {#if sortDir === 'asc'}<ArrowUp size={11} class="text-blue-600" />{:else}<ArrowDown size={11} class="text-blue-600" />{/if}
                  {:else}<ArrowUpDown size={10} class="text-slate-300" />{/if}
                </button>
              </th>
              <th class="px-3 py-2 text-left">Critical Driver</th>
              <th class="px-3 py-2 text-left">Owner / Status</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            {#each sortedStudies as st}
              {@const variance = st.readiness - st.expected}
              <tr
                on:click={() => onSelectStudy(st.id)}
                class="hover:bg-blue-50/40 cursor-pointer transition-colors group"
              >
                <td class="px-3 py-2.5">
                  <span class="inline-flex items-center justify-center px-2 py-0.5 rounded-md border font-mono font-bold text-[11px] {priorityBadge(st.priorityScore)}">
                    {st.priorityScore}
                  </span>
                </td>
                <td class="px-3 py-2.5">
                  <div class="flex items-center gap-1.5">
                    <span class="font-mono font-bold text-blue-700 group-hover:underline">{st.id}</span>
                    <span class="px-1.5 py-0.5 rounded-full border text-[9px] font-bold {riskTierBadge(st.riskTier)}">{st.riskTier}</span>
                  </div>
                  <div class="text-[10px] text-slate-500 truncate max-w-[200px]">{st.therapeuticArea} · {st.phase} · {formatCountries(st.countries)}</div>
                </td>
                <td class="px-3 py-2.5">
                  <div class="flex items-center gap-2">
                    <span class="font-mono font-bold text-slate-900 w-8">{st.readiness}%</span>
                    <div class="w-16 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                      <div class="h-full rounded-full {readinessBarColor(st.readiness, st.expected)}" style="width:{st.readiness}%"></div>
                    </div>
                  </div>
                  <div class="text-[10px] flex items-center gap-1 mt-0.5 {variance >= 0 ? 'text-emerald-600' : 'text-rose-600'}">
                    <span>{variance >= 0 ? `+${variance}%` : `${variance}%`} vs plan</span>
                    {#if st.trend7d > 0}<TrendingUp size={10} />{:else if st.trend7d < 0}<TrendingDown size={10} />{/if}
                  </div>
                </td>
                <td class="px-3 py-2.5 text-[11px]">
                  <div class="font-medium text-slate-700">{st.targetDbl}</div>
                  <div class="font-bold {st.delayDays > 0 ? 'text-rose-600' : 'text-emerald-600'}">{st.predictedDbl}</div>
                </td>
                <td class="px-3 py-2.5 text-right font-mono font-bold {st.delayDays > 0 ? 'text-rose-600' : 'text-emerald-600'}">
                  {st.delayDays > 0 ? `+${st.delayDays}d` : '0d'}
                </td>
                <td class="px-3 py-2.5 text-right font-mono font-bold {st.hardGates > 0 ? 'text-rose-600' : 'text-slate-400'}">
                  {st.hardGates}
                </td>
                <td class="px-3 py-2.5 text-right font-mono font-bold {st.recoverableDays > 0 ? 'text-emerald-600' : 'text-slate-400'}">
                  {st.recoverableDays > 0 ? `${st.recoverableDays}d` : '—'}
                </td>
                <td class="px-3 py-2.5 text-slate-600 max-w-[200px] truncate">{st.criticalDriver}</td>
                <td class="px-3 py-2.5">
                  <div class="font-semibold text-slate-800">{st.owner}</div>
                  <span class="inline-flex mt-0.5 px-1.5 py-0.5 rounded border text-[9px] font-bold {statusBadge(st.actionStatus)}">{st.actionStatus}</span>
                </td>
              </tr>
            {:else}
              <tr>
                <td colspan="9" class="py-8 text-center text-xs text-slate-400">
                  No studies match the selected filters.
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    {:else}
      <!-- Cards View -->
      <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        {#each sortedStudies as st}
          <button
            type="button"
            on:click={() => onSelectStudy(st.id)}
            class="text-left p-3.5 rounded-xl border border-slate-200/80 bg-slate-50/40 hover:bg-white hover:border-blue-300 hover:shadow-sm transition-all cursor-pointer space-y-2.5"
          >
            <div class="flex items-start justify-between gap-2">
              <div>
                <div class="flex items-center gap-2">
                  <span class="font-mono text-sm font-bold text-blue-700">{st.id}</span>
                  <span class="px-1.5 py-0.5 rounded-full border text-[10px] font-bold {riskTierBadge(st.riskTier)}">{st.riskTier}</span>
                </div>
                <div class="text-[11px] text-slate-500 mt-0.5">{st.therapeuticArea} · {st.phase}</div>
              </div>
              <span class="px-2 py-0.5 rounded-md border font-mono font-bold text-xs {priorityBadge(st.priorityScore)}">{st.priorityScore}</span>
            </div>

            <div class="text-xs font-semibold text-slate-800 line-clamp-1">{st.title}</div>

            <div>
              <div class="flex items-center justify-between text-[11px] mb-1">
                <span class="text-slate-500">Readiness ({st.readiness}% vs {st.expected}%)</span>
                <span class="font-bold {st.delayDays > 0 ? 'text-rose-600' : 'text-emerald-600'}">
                  {st.delayDays > 0 ? `+${st.delayDays}d delay` : 'On track'}
                </span>
              </div>
              <div class="h-1.5 w-full rounded-full bg-slate-200 overflow-hidden">
                <div class="h-full rounded-full {readinessBarColor(st.readiness, st.expected)}" style="width:{st.readiness}%"></div>
              </div>
            </div>

            <div class="text-[11px] text-slate-600 truncate">{st.criticalDriver}</div>

            <div class="pt-2 border-t border-slate-200/70 flex items-center justify-between text-[10px]">
              <span class="text-slate-500">Owner: <strong class="text-slate-700">{st.owner}</strong></span>
              <span class="px-1.5 py-0.5 rounded border font-bold {statusBadge(st.actionStatus)}">{st.actionStatus}</span>
            </div>
          </button>
        {/each}
      </div>
    {/if}
  </div>
</div>
