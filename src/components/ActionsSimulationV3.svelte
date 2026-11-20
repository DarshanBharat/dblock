<script lang="ts">
  import {
    ArrowLeft,
    Play,
    RotateCcw,
    Plus,
    Search,
    X,
    ArrowUpDown,
    ArrowUp,
    ArrowDown,
    Filter,
    ChevronLeft,
    ChevronRight,
    CheckCircle2,
    Clock,
    AlertTriangle,
    TrendingUp,
    Calendar,
    Sparkles,
  } from '@lucide/svelte';
  import { V3_STUDY_META, V3_ACTIONS, V3_SIMULATION_SCENARIOS, type V3ActionRow } from '../data/v3Data';
  import { runDblSimulation, formatShortDate, type SimulationScenarioInput } from '../lib/dblEngine';
  import MultiSelectFilter from './MultiSelectFilter.svelte';

  export let onSelectTab: (tab: string) => void;
  export let onSelectSite: (siteId: string) => void = () => {};

  let activeSubTab: 'actions' | 'simulations' = 'actions';

  // Multi-select filter state
  let searchQuery = '';
  let statusFilters: string[] = [];
  let ownerFilters: string[] = [];
  let domainFilters: string[] = [];

  // Sorting & pagination
  type SortCol = 'priority' | 'title' | 'owner' | 'dueDate' | 'estDblImpactDays' | 'status';
  let sortCol: SortCol = 'priority';
  let sortDir: 'asc' | 'desc' = 'asc';
  let actionPage = 1;
  let actionPageSize = 10;

  // Custom actions + inline Add Action form
  let localActions: V3ActionRow[] = [...V3_ACTIONS];
  let showAddForm = false;
  let newTitle = '';
  let newDomain = 'Query Resolution';
  let newOwner = 'Data Management';
  let newPriority = 1;

  function addAction() {
    if (!newTitle.trim()) return;
    const item: V3ActionRow = {
      id: `ACT-CUSTOM-${localActions.length + 1}`,
      priority: newPriority,
      title: newTitle.trim(),
      domain: newDomain,
      studySite: 'Site 317 (DE)',
      siteId: '317',
      owner: newOwner,
      dueDate: '05 Nov 2026',
      estDblImpactDays: -1,
      status: 'Open',
      actionLabel: 'Review',
    };
    localActions = [item, ...localActions];
    newTitle = '';
    showAddForm = false;
  }

  let scenarios: SimulationScenarioInput[] = V3_SIMULATION_SCENARIOS.map((s) => ({ ...s }));
  let ignoreNonCritical = false;
  let includeContingency = false;

  $: simOutput = runDblSimulation({
    targetDblIso: V3_STUDY_META.targetDblIso,
    baselinePredictedDblIso: V3_STUDY_META.predictedDblIso,
    baselineProbPct: V3_STUDY_META.probMeetingDbl,
    baselineReadinessPct: V3_STUDY_META.overallReadiness,
    scenarios,
    includeContingency,
    ignoreNonCritical,
  });

  function triggerSimulation() {
    scenarios = [...scenarios];
  }

  function toggleArrayItem(arr: string[], val: string): string[] {
    return arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val];
  }

  function toggleSort(col: SortCol) {
    if (sortCol === col) {
      sortDir = sortDir === 'asc' ? 'desc' : 'asc';
    } else {
      sortCol = col;
      sortDir = col === 'estDblImpactDays' ? 'asc' : 'asc';
    }
  }

  function resetFilters() {
    searchQuery = '';
    statusFilters = [];
    ownerFilters = [];
    domainFilters = [];
    actionPage = 1;
  }

  $: owners = Array.from(new Set(localActions.map((a) => a.owner))).sort();
  $: domains = Array.from(new Set(localActions.map((a) => a.domain))).sort();

  $: filteredActions = localActions
    .filter((a) => {
      const q = searchQuery.trim().toLowerCase();
      const matchSearch =
        !q ||
        a.title.toLowerCase().includes(q) ||
        a.domain.toLowerCase().includes(q) ||
        a.owner.toLowerCase().includes(q) ||
        a.studySite.toLowerCase().includes(q);
      const matchStatus = statusFilters.length === 0 || statusFilters.includes(a.status);
      const matchOwner = ownerFilters.length === 0 || ownerFilters.includes(a.owner);
      const matchDomain = domainFilters.length === 0 || domainFilters.includes(a.domain);
      return matchSearch && matchStatus && matchOwner && matchDomain;
    })
    .sort((a, b) => {
      const dir = sortDir === 'asc' ? 1 : -1;
      const statusRank: Record<string, number> = { Overdue: 3, 'In Progress': 2, Open: 1 };
      let cmp = 0;
      switch (sortCol) {
        case 'title':
          cmp = a.title.localeCompare(b.title);
          break;
        case 'owner':
          cmp = a.owner.localeCompare(b.owner);
          break;
        case 'dueDate':
          cmp = a.dueDate.localeCompare(b.dueDate);
          break;
        case 'estDblImpactDays':
          cmp = a.estDblImpactDays - b.estDblImpactDays;
          break;
        case 'status':
          cmp = (statusRank[a.status] || 0) - (statusRank[b.status] || 0);
          break;
        case 'priority':
        default:
          cmp = a.priority - b.priority;
          break;
      }
      return cmp * dir;
    });

  $: totalActionPages = Math.max(1, Math.ceil(filteredActions.length / actionPageSize));
  $: if (actionPage > totalActionPages) actionPage = 1;
  $: pagedActions = filteredActions.slice((actionPage - 1) * actionPageSize, actionPage * actionPageSize);
  $: visiblePages = (() => {
    const pages: number[] = [];
    const start = Math.max(1, actionPage - 2);
    const end = Math.min(totalActionPages, start + 4);
    for (let p = Math.max(1, end - 4); p <= end; p++) pages.push(p);
    return pages;
  })();

  $: activeFilterCount =
    (searchQuery.trim() ? 1 : 0) + statusFilters.length + ownerFilters.length + domainFilters.length;

  $: statusCounts = {
    all: localActions.length,
    Overdue: localActions.filter((a) => a.status === 'Overdue').length,
    'In Progress': localActions.filter((a) => a.status === 'In Progress').length,
    Open: localActions.filter((a) => a.status === 'Open').length,
  };

  $: ownerBars = owners.map((o, idx) => ({
    label: o,
    count: localActions.filter((a) => a.owner === o).length,
    color: ['#3b82f6', '#f59e0b', '#8b5cf6', '#ef4444', '#10b981', '#06b6d4'][idx % 6],
  })).sort((a, b) => b.count - a.count);

  $: domainBars = domains.map((d, idx) => ({
    label: d,
    count: localActions.filter((a) => a.domain === d).length,
    color: ['#8b5cf6', '#3b82f6', '#f59e0b', '#ef4444', '#10b981', '#64748b', '#06b6d4'][idx % 7],
  })).sort((a, b) => b.count - a.count);

  function toggleScenario(id: string) {
    scenarios = scenarios.map((s) => (s.id === id ? { ...s, enabled: !s.enabled } : s));
  }
</script>

<div class="space-y-2.5">
  <!-- Executive Header Card (matching StudyOverviewV3, Sites, Subjects) -->
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
            {V3_STUDY_META.protocol} <span class="text-slate-300 font-normal">|</span> Actions
          </h1>
          <span class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <span class="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
            At Risk
          </span>
          {#if activeFilterCount > 0}
            <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-[10px] font-bold text-blue-700">
              <Filter size={10} /> {activeFilterCount} active
            </span>
          {/if}
        </div>
        <p class="text-[11px] text-slate-500 mt-0.5">{V3_STUDY_META.title}</p>
      </div>

      <div class="flex flex-col items-end gap-1">
        <div class="flex items-center gap-1.5">
          {#if activeFilterCount > 0}
            <button
              type="button"
              on:click={resetFilters}
              class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 cursor-pointer"
            >
              <RotateCcw size={12} /> Reset Filters
            </button>
          {/if}
          <button
            type="button"
            on:click={() => (showAddForm = !showAddForm)}
            class="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold cursor-pointer shadow-xs"
          >
            <Plus size={12} /> {showAddForm ? 'Cancel' : 'Add Action'}
          </button>
        </div>
        <span class="text-[10px] text-slate-400">Last refreshed: {V3_STUDY_META.lastRefreshed}</span>
      </div>
    </div>

    <!-- 8-Column Metadata Strip -->
    <div class="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 pt-2 text-[11px]">
      <div>
        <div class="text-[10px] text-slate-400">Total Actions</div>
        <div class="font-semibold text-slate-800">{localActions.length}</div>
      </div>
      <div>
        <div class="text-[10px] text-slate-400">Overdue</div>
        <div class="font-bold text-rose-600">{statusCounts.Overdue}</div>
      </div>
      <div>
        <div class="text-[10px] text-slate-400">In Progress</div>
        <div class="font-semibold text-amber-700">{statusCounts['In Progress']}</div>
      </div>
      <div>
        <div class="text-[10px] text-slate-400">Open</div>
        <div class="font-semibold text-blue-700">{statusCounts.Open}</div>
      </div>
      <div>
        <div class="text-[10px] text-slate-400">Target DBL</div>
        <div class="font-semibold text-slate-800">{V3_STUDY_META.targetDbl}</div>
      </div>
      <div>
        <div class="text-[10px] text-slate-400">Current P80 DBL</div>
        <div class="font-bold text-rose-600">{V3_STUDY_META.predictedDbl} (+{simOutput.baselineVarianceDays}d)</div>
      </div>
      <div>
        <div class="text-[10px] text-slate-400">Simulated DBL</div>
        <div class="font-bold text-emerald-700">{formatShortDate(simOutput.simulatedDblDate)} (-{simOutput.daysRecovered}d)</div>
      </div>
      <div>
        <div class="text-[10px] text-slate-400">DBL Probability</div>
        <div class="font-bold text-emerald-700">{simOutput.baselineProbPct}% → {simOutput.simulatedProbPct}%</div>
      </div>
    </div>
  </div>

  <!-- Inline Add Action Drawer (when toggled) -->
  {#if showAddForm}
    <div class="bg-white rounded-xl border border-blue-200 p-3 shadow-xs flex flex-wrap items-end gap-2.5 text-xs">
      <div class="flex-1 min-w-[200px]">
        <label for="new-act-title" class="block text-[10px] font-bold uppercase text-slate-500 mb-1">Action Description</label>
        <input id="new-act-title" type="text" bind:value={newTitle} placeholder="e.g. Escalate Site 317 RECIST query resolution..." class="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs" />
      </div>
      <div>
        <label for="new-act-domain" class="block text-[10px] font-bold uppercase text-slate-500 mb-1">Domain</label>
        <select id="new-act-domain" bind:value={newDomain} class="px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs bg-white">
          {#each domains as d}<option value={d}>{d}</option>{/each}
        </select>
      </div>
      <div>
        <label for="new-act-owner" class="block text-[10px] font-bold uppercase text-slate-500 mb-1">Owner</label>
        <select id="new-act-owner" bind:value={newOwner} class="px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs bg-white">
          {#each owners as o}<option value={o}>{o}</option>{/each}
        </select>
      </div>
      <div>
        <label for="new-act-pri" class="block text-[10px] font-bold uppercase text-slate-500 mb-1">Priority</label>
        <select id="new-act-pri" bind:value={newPriority} class="px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs bg-white">
          <option value={1}>P1</option>
          <option value={2}>P2</option>
          <option value={3}>P3</option>
        </select>
      </div>
      <button type="button" on:click={addAction} class="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold cursor-pointer">Save Action</button>
    </div>
  {/if}

  <!-- Sub-tabs: Actions Directory vs DBL Simulations -->
  <div class="bg-white rounded-xl border border-slate-200/80 px-3.5 py-2 shadow-xs flex flex-wrap items-center justify-between gap-2">
    <div class="flex items-center gap-2 text-xs font-semibold">
      <button
        type="button"
        on:click={() => (activeSubTab = 'actions')}
        class="px-3 py-1.5 rounded-lg border transition-colors cursor-pointer inline-flex items-center gap-1.5 {activeSubTab === 'actions' ? 'bg-blue-600 text-white border-blue-600 shadow-2xs' : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'}"
      >
        <span>Actions Directory</span>
        <span class="px-1.5 py-0.2 rounded-full text-[10px] font-bold {activeSubTab === 'actions' ? 'bg-white/20 text-white' : 'bg-slate-200/80 text-slate-600'}">{localActions.length}</span>
      </button>
      <button
        type="button"
        on:click={() => (activeSubTab = 'simulations')}
        class="px-3 py-1.5 rounded-lg border transition-colors cursor-pointer inline-flex items-center gap-1.5 {activeSubTab === 'simulations' ? 'bg-blue-600 text-white border-blue-600 shadow-2xs' : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'}"
      >
        <Sparkles size={12} />
        <span>Simulations</span>
        <span class="px-1.5 py-0.2 rounded-full text-[10px] font-bold {activeSubTab === 'simulations' ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-700'}">-{simOutput.daysRecovered}d</span>
      </button>
    </div>
    <span class="text-[11px] text-slate-500">
      {activeSubTab === 'actions' ? 'Operational action tracking & site escalation queue' : 'Monte Carlo P80 what-if recovery scenarios'}
    </span>
  </div>

  {#if activeSubTab === 'actions'}
    <!-- Actions KPI Cards -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
      <div class="bg-white rounded-xl border border-slate-200/80 p-3 shadow-xs">
        <div class="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400">
          <span>Open Actions</span>
          <CheckCircle2 size={13} class="text-blue-600" />
        </div>
        <div class="mt-1 flex items-baseline gap-1.5">
          <span class="text-xl font-extrabold text-slate-900">{filteredActions.length}</span>
          <span class="text-[10px] text-slate-400">/ {localActions.length}</span>
        </div>
        <div class="mt-1 text-[10px] text-slate-500">Across {domains.length} domains</div>
      </div>

      <button
        type="button"
        on:click={() => { statusFilters = toggleArrayItem(statusFilters, 'Overdue'); actionPage = 1; }}
        class="text-left bg-white rounded-xl border p-3 shadow-xs hover:shadow-sm transition-all cursor-pointer {statusFilters.includes('Overdue') ? 'border-rose-400 ring-2 ring-rose-100' : 'border-slate-200/80'}"
      >
        <div class="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-rose-600">
          <span>Overdue</span>
          <AlertTriangle size={13} />
        </div>
        <div class="mt-1 flex items-baseline gap-1.5">
          <span class="text-xl font-extrabold text-rose-700">{statusCounts.Overdue}</span>
          <span class="text-[10px] font-bold text-rose-600">{Math.round((statusCounts.Overdue / Math.max(1, localActions.length)) * 100)}%</span>
        </div>
        <div class="mt-1 text-[10px] text-rose-600/80">Click to filter</div>
      </button>

      <button
        type="button"
        on:click={() => { statusFilters = toggleArrayItem(statusFilters, 'In Progress'); actionPage = 1; }}
        class="text-left bg-white rounded-xl border p-3 shadow-xs hover:shadow-sm transition-all cursor-pointer {statusFilters.includes('In Progress') ? 'border-amber-400 ring-2 ring-amber-100' : 'border-slate-200/80'}"
      >
        <div class="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-amber-600">
          <span>In Progress</span>
          <Clock size={13} />
        </div>
        <div class="mt-1 flex items-baseline gap-1.5">
          <span class="text-xl font-extrabold text-amber-700">{statusCounts['In Progress']}</span>
          <span class="text-[10px] font-bold text-amber-600">{Math.round((statusCounts['In Progress'] / Math.max(1, localActions.length)) * 100)}%</span>
        </div>
        <div class="mt-1 text-[10px] text-amber-600/80">Click to filter</div>
      </button>

      <button
        type="button"
        on:click={() => { statusFilters = toggleArrayItem(statusFilters, 'Open'); actionPage = 1; }}
        class="text-left bg-white rounded-xl border p-3 shadow-xs hover:shadow-sm transition-all cursor-pointer {statusFilters.includes('Open') ? 'border-blue-400 ring-2 ring-blue-100' : 'border-slate-200/80'}"
      >
        <div class="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-blue-600">
          <span>Open Queue</span>
          <TrendingUp size={13} />
        </div>
        <div class="mt-1 flex items-baseline gap-1.5">
          <span class="text-xl font-extrabold text-blue-700">{statusCounts.Open}</span>
          <span class="text-[10px] font-bold text-blue-600">{Math.round((statusCounts.Open / Math.max(1, localActions.length)) * 100)}%</span>
        </div>
        <div class="mt-1 text-[10px] text-blue-600/80">Click to filter</div>
      </button>
    </div>

    <!-- Full-Width Recommended Actions Directory -->
    <div class="bg-white rounded-xl border border-slate-200/80 p-3 shadow-xs space-y-2.5">
      <div class="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-100">
        <div class="flex items-center gap-2">
          <h3 class="text-xs font-bold text-slate-900">Recommended Actions Directory</h3>
          <span class="px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[10px] font-bold">{filteredActions.length} of {localActions.length}</span>
        </div>
        <select bind:value={actionPageSize} on:change={() => (actionPage = 1)} class="border border-slate-200 rounded-lg px-2 py-1 bg-white text-xs text-slate-700 cursor-pointer">
          <option value={8}>8 / page</option>
          <option value={10}>10 / page</option>
          <option value={25}>25 / page</option>
        </select>
      </div>

      <!-- Polished Multi-Select Filter Bar -->
      <div class="rounded-xl bg-slate-50/90 border border-slate-200/80 p-2.5 space-y-2">
        <div class="flex flex-wrap items-center gap-1.5">
          <span class="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 mr-1">
            <Filter size={11} /> Status
          </span>
          <button
            type="button"
            on:click={() => { statusFilters = []; actionPage = 1; }}
            class="px-2.5 py-1 rounded-full text-[11px] font-semibold border cursor-pointer {statusFilters.length === 0 ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-200'}"
          >All ({statusCounts.all})</button>
          {#each [
            { key: 'Overdue', dot: 'bg-rose-500', count: statusCounts.Overdue },
            { key: 'In Progress', dot: 'bg-amber-500', count: statusCounts['In Progress'] },
            { key: 'Open', dot: 'bg-blue-500', count: statusCounts.Open },
          ] as st}
            {@const active = statusFilters.includes(st.key)}
            <button
              type="button"
              on:click={() => { statusFilters = toggleArrayItem(statusFilters, st.key); actionPage = 1; }}
              class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border cursor-pointer {active ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-200'}"
            >
              <span class="w-1.5 h-1.5 rounded-full {st.dot}"></span>
              <span>{st.key}</span>
              <span class="text-[10px] opacity-75">({st.count})</span>
            </button>
          {/each}
        </div>

        <div class="flex flex-wrap items-center gap-2">
          <div class="relative flex-1 min-w-[180px]">
            <Search size={13} class="absolute left-2.5 top-2 text-slate-400" />
            <input
              type="text"
              bind:value={searchQuery}
              on:input={() => (actionPage = 1)}
              placeholder="Search action, site, owner, or domain..."
              class="w-full pl-8 pr-7 py-1.5 text-xs border border-slate-200 rounded-lg bg-white focus:outline-hidden focus:border-blue-500"
            />
            {#if searchQuery}
              <button type="button" on:click={() => { searchQuery = ''; actionPage = 1; }} class="absolute right-2 top-2 text-slate-400 hover:text-slate-600 cursor-pointer"><X size={13} /></button>
            {/if}
          </div>
          <MultiSelectFilter
            label="Owners"
            options={owners.map((o) => ({ value: o, label: o }))}
            selected={ownerFilters}
            onChange={(next) => { ownerFilters = next; actionPage = 1; }}
          />
          <MultiSelectFilter
            label="Domains"
            options={domains.map((d) => ({ value: d, label: d }))}
            selected={domainFilters}
            onChange={(next) => { domainFilters = next; actionPage = 1; }}
          />
        </div>
      </div>

      <!-- Sortable Table -->
      <div class="rounded-lg border border-slate-200/80 overflow-x-auto">
        <table class="w-full text-xs">
          <thead class="bg-slate-50 border-b border-slate-200 text-[10px] font-bold uppercase tracking-wider text-slate-500">
            <tr>
              {#each [
                { col: 'priority', label: 'Pri', align: 'text-left' },
                { col: 'title', label: 'Action / Recommendation', align: 'text-left' },
                { col: 'owner', label: 'Owner', align: 'text-left' },
                { col: 'dueDate', label: 'Due Date', align: 'text-left' },
                { col: 'estDblImpactDays', label: 'Impact', align: 'text-right' },
                { col: 'status', label: 'Status', align: 'text-left' },
              ] as h}
                <th class="px-3 py-2 {h.align}">
                  <button type="button" on:click={() => toggleSort(h.col as SortCol)} class="inline-flex items-center gap-1 hover:text-slate-900 cursor-pointer">
                    <span>{h.label}</span>
                    {#if sortCol === h.col}
                      {#if sortDir === 'asc'}<ArrowUp size={11} class="text-blue-600" />{:else}<ArrowDown size={11} class="text-blue-600" />{/if}
                    {:else}<ArrowUpDown size={10} class="text-slate-300" />{/if}
                  </button>
                </th>
              {/each}
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            {#each pagedActions as a}
              <tr
                class="hover:bg-blue-50/40 cursor-pointer transition-colors"
                on:click={() => { if (a.siteId) onSelectSite(a.siteId); }}
              >
                <td class="px-3 py-2 font-bold text-slate-700">P{a.priority}</td>
                <td class="px-3 py-2">
                  <div class="font-semibold text-blue-700 hover:underline">{a.title}</div>
                  <div class="text-[10px] text-slate-400">{a.domain} · {a.studySite}</div>
                </td>
                <td class="px-3 py-2 text-slate-600">{a.owner}</td>
                <td class="px-3 py-2 text-slate-600 whitespace-nowrap">{a.dueDate}</td>
                <td class="px-3 py-2 text-right font-mono font-bold {a.estDblImpactDays < 0 ? 'text-rose-600' : 'text-slate-500'}">
                  {a.estDblImpactDays < 0 ? `${a.estDblImpactDays}d` : '0d'}
                </td>
                <td class="px-3 py-2">
                  <span class="px-2 py-0.5 rounded-full border text-[10px] font-bold {a.status === 'Overdue' ? 'bg-rose-50 text-rose-700 border-rose-200' : a.status === 'In Progress' ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-blue-50 text-blue-700 border-blue-200'}">
                    {a.status}
                  </span>
                </td>
              </tr>
            {:else}
              <tr><td colspan="6" class="py-6 text-center text-slate-400">No actions match the selected filters.</td></tr>
            {/each}
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div class="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs">
        <span class="text-slate-500">
          Showing {filteredActions.length === 0 ? 0 : (actionPage - 1) * actionPageSize + 1}–{Math.min(actionPage * actionPageSize, filteredActions.length)} of {filteredActions.length}
        </span>
        <div class="flex items-center gap-1">
          <button type="button" disabled={actionPage <= 1} on:click={() => (actionPage = Math.max(1, actionPage - 1))} class="inline-flex items-center gap-1 px-2 py-1 rounded-lg border border-slate-200 disabled:opacity-40 cursor-pointer"><ChevronLeft size={12} /> Prev</button>
          {#each visiblePages as p}
            <button type="button" on:click={() => (actionPage = p)} class="px-2.5 py-1 rounded-lg border font-semibold cursor-pointer {actionPage === p ? 'bg-blue-600 text-white border-blue-600' : 'border-slate-200 text-slate-700'}">{p}</button>
          {/each}
          <button type="button" disabled={actionPage >= totalActionPages} on:click={() => (actionPage = Math.min(totalActionPages, actionPage + 1))} class="inline-flex items-center gap-1 px-2 py-1 rounded-lg border border-slate-200 disabled:opacity-40 cursor-pointer">Next <ChevronRight size={12} /></button>
        </div>
      </div>
    </div>

    <!-- Actions Breakdown: By Owner + By Domain -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
      <div class="bg-white rounded-xl border border-slate-200/80 p-3 shadow-xs">
        <div class="flex items-center justify-between mb-2">
          <h3 class="text-xs font-bold text-slate-900">Actions by Owner</h3>
          {#if ownerFilters.length > 0}<button type="button" on:click={() => (ownerFilters = [])} class="text-[10px] text-blue-600 font-semibold cursor-pointer">Clear</button>{/if}
        </div>
        <div class="space-y-1.5">
          {#each ownerBars as b}
            {@const active = ownerFilters.includes(b.label)}
            <button
              type="button"
              on:click={() => { ownerFilters = toggleArrayItem(ownerFilters, b.label); actionPage = 1; }}
              class="w-full grid grid-cols-12 items-center gap-1.5 text-[11px] px-1 py-0.5 rounded cursor-pointer {active ? 'bg-blue-50 ring-1 ring-blue-200 font-bold' : 'hover:bg-slate-50'}"
            >
              <span class="col-span-5 text-left text-slate-700 truncate">{b.label}</span>
              <div class="col-span-6 h-2 bg-slate-100 rounded-full overflow-hidden">
                <div class="h-full rounded-full" style="width:{(b.count / Math.max(1, localActions.length)) * 100 * 2.5}%; background:{b.color}"></div>
              </div>
              <span class="col-span-1 text-right font-bold text-slate-900">{b.count}</span>
            </button>
          {/each}
        </div>
      </div>

      <div class="bg-white rounded-xl border border-slate-200/80 p-3 shadow-xs">
        <div class="flex items-center justify-between mb-2">
          <h3 class="text-xs font-bold text-slate-900">Actions by Domain</h3>
          {#if domainFilters.length > 0}<button type="button" on:click={() => (domainFilters = [])} class="text-[10px] text-blue-600 font-semibold cursor-pointer">Clear</button>{/if}
        </div>
        <div class="space-y-1.5">
          {#each domainBars as b}
            {@const active = domainFilters.includes(b.label)}
            <button
              type="button"
              on:click={() => { domainFilters = toggleArrayItem(domainFilters, b.label); actionPage = 1; }}
              class="w-full grid grid-cols-12 items-center gap-1.5 text-[11px] px-1 py-0.5 rounded cursor-pointer {active ? 'bg-blue-50 ring-1 ring-blue-200 font-bold' : 'hover:bg-slate-50'}"
            >
              <span class="col-span-5 text-left text-slate-700 truncate">{b.label}</span>
              <div class="col-span-6 h-2 bg-slate-100 rounded-full overflow-hidden">
                <div class="h-full rounded-full" style="width:{(b.count / Math.max(1, localActions.length)) * 100 * 2.5}%; background:{b.color}"></div>
              </div>
              <span class="col-span-1 text-right font-bold text-slate-900">{b.count}</span>
            </button>
          {/each}
        </div>
      </div>
    </div>
  {:else}
    <!-- 4 Simulation KPI Cards on Top -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
      <div class="bg-white rounded-xl border border-slate-200/80 p-3 shadow-xs">
        <div class="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-emerald-700">
          <span>Days Recoverable</span>
          <Sparkles size={13} />
        </div>
        <div class="mt-1 text-xl font-extrabold text-emerald-700">{simOutput.daysRecovered} days</div>
        <div class="mt-1 text-[10px] text-slate-500">From selected scenarios</div>
      </div>

      <div class="bg-white rounded-xl border border-slate-200/80 p-3 shadow-xs">
        <div class="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400">
          <span>Current P80 DBL</span>
          <Calendar size={13} class="text-rose-500" />
        </div>
        <div class="mt-1 text-xl font-extrabold text-slate-900">{V3_STUDY_META.predictedDbl}</div>
        <div class="mt-1 text-[10px] font-bold text-rose-600">+{simOutput.baselineVarianceDays}d vs target</div>
      </div>

      <div class="bg-white rounded-xl border border-slate-200/80 p-3 shadow-xs">
        <div class="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-emerald-700">
          <span>Simulated DBL</span>
          <Clock size={13} />
        </div>
        <div class="mt-1 text-xl font-extrabold text-emerald-700">{formatShortDate(simOutput.simulatedDblDate)}</div>
        <div class="mt-1 text-[10px] font-bold text-emerald-600">-{simOutput.daysRecovered}d recovered</div>
      </div>

      <div class="bg-white rounded-xl border border-slate-200/80 p-3 shadow-xs">
        <div class="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400">
          <span>DBL Probability</span>
          <TrendingUp size={13} class="text-emerald-600" />
        </div>
        <div class="mt-1 flex items-baseline gap-1.5">
          <span class="text-xl font-extrabold text-rose-600">{simOutput.baselineProbPct}%</span>
          <span class="text-slate-400 text-xs">→</span>
          <span class="text-xl font-extrabold text-emerald-600">{simOutput.simulatedProbPct}%</span>
        </div>
        <div class="mt-1 text-[10px] text-slate-500">Monte Carlo P80</div>
      </div>
    </div>

    <!-- Simulation Workspace: What-If Controls (Left) + Forecast & Waterfall (Right) -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-3 items-start">
      <div class="lg:col-span-5 bg-white rounded-xl border border-slate-200/80 p-3.5 shadow-xs space-y-3">
        <div class="pb-2 border-b border-slate-100">
          <h2 class="text-xs font-bold text-slate-900">What-If DBL Simulation</h2>
          <p class="text-[11px] text-slate-500 mt-0.5">Toggle scenarios to simulate P80 predicted DBL recovery.</p>
        </div>

        <div class="space-y-2 text-xs">
          {#each scenarios as sc}
            <label class="flex items-start gap-2 p-2 rounded-lg border cursor-pointer transition-colors {sc.enabled ? 'bg-blue-50/50 border-blue-200' : 'bg-slate-50/50 border-slate-100 hover:bg-slate-50'}">
              <input type="checkbox" checked={sc.enabled} on:change={() => toggleScenario(sc.id)} class="mt-0.5 rounded border-slate-300 text-blue-600" />
              <span class="flex-1 text-slate-700">{sc.label}</span>
              <span class="font-mono font-bold text-emerald-600 shrink-0">-{sc.daysSaved}d</span>
            </label>
          {/each}
          <label class="flex items-center gap-2 cursor-pointer text-slate-600 pt-1 border-t border-slate-100">
            <input type="checkbox" bind:checked={ignoreNonCritical} class="rounded border-slate-300 text-blue-600" />
            <span>Ignore non-critical items</span>
          </label>
          <label class="flex items-center gap-2 cursor-pointer text-slate-600">
            <input type="checkbox" bind:checked={includeContingency} class="rounded border-slate-300 text-blue-600" />
            <span>Include 2-day operational contingency</span>
          </label>
        </div>

        <button
          type="button"
          on:click={triggerSimulation}
          class="w-full inline-flex items-center justify-center gap-1.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold cursor-pointer shadow-xs"
        >
          <Play size={13} /> Run Simulation
        </button>

        <!-- Simulation Result -->
        <div class="rounded-xl border border-emerald-200 bg-emerald-50/50 p-3 space-y-2">
          <div class="text-xs font-bold text-slate-900">Simulation Result</div>
          <div class="flex items-baseline justify-between">
            <div>
              <div class="text-[10px] text-slate-500">Predicted DBL Date (P80)</div>
              <div class="text-base font-extrabold text-slate-900">{formatShortDate(simOutput.simulatedDblDate)}</div>
            </div>
            <span class="px-2 py-0.5 rounded text-xs font-bold bg-emerald-100 text-emerald-800">
              -{simOutput.daysRecovered} days
            </span>
          </div>
          <div class="flex items-center justify-between text-xs pt-1 border-t border-emerald-200/60">
            <span class="text-slate-600">Probability of Target DBL</span>
            <span class="font-bold text-emerald-700">{simOutput.baselineProbPct}% → {simOutput.simulatedProbPct}%</span>
          </div>
          <div class="flex items-center justify-between text-xs">
            <span class="text-slate-600">Expected Readiness at DBL</span>
            <span class="font-bold text-slate-900">{simOutput.simulatedReadinessPct}%</span>
          </div>
          <div class="text-[10px] text-slate-500 pt-1 border-t border-emerald-200/60">
            Monte Carlo: <span class="font-semibold">P50 {formatShortDate(simOutput.p50Date)}</span> · P80 {formatShortDate(simOutput.p80Date)} · P90 {formatShortDate(simOutput.p90Date)}
          </div>
        </div>
      </div>

      <div class="lg:col-span-7 space-y-3">
        <div class="bg-white rounded-xl border border-slate-200/80 p-3.5 shadow-xs">
          <h3 class="text-xs font-bold text-slate-900 mb-3">DBL Forecast – Current vs After</h3>
          <div class="space-y-3 text-xs">
            <div>
              <div class="flex justify-between mb-1">
                <span class="font-medium text-slate-700">Current P80</span>
                <span class="font-bold text-rose-600">{V3_STUDY_META.predictedDbl} (+{simOutput.baselineVarianceDays}d)</span>
              </div>
              <div class="h-2.5 w-full rounded-full bg-slate-100 overflow-hidden"><div class="h-full bg-rose-500 rounded-full" style="width: 92%"></div></div>
            </div>
            <div>
              <div class="flex justify-between mb-1">
                <span class="font-medium text-slate-700">Post Actions</span>
                <span class="font-bold text-emerald-700">{formatShortDate(simOutput.simulatedDblDate)} (-{simOutput.daysRecovered}d)</span>
              </div>
              <div class="h-2.5 w-full rounded-full bg-slate-100 overflow-hidden"><div class="h-full bg-emerald-500 rounded-full transition-all" style="width: {Math.max(45, 92 - simOutput.daysRecovered * 7)}%"></div></div>
            </div>
            <div>
              <div class="flex justify-between mb-1">
                <span class="font-medium text-slate-700">Target DBL</span>
                <span class="font-bold text-blue-700">{V3_STUDY_META.targetDbl}</span>
              </div>
              <div class="h-2.5 w-full rounded-full bg-slate-100 overflow-hidden"><div class="h-full bg-blue-600 rounded-full" style="width: 60%"></div></div>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-xl border border-slate-200/80 p-3.5 shadow-xs">
          <h3 class="text-xs font-bold text-slate-900 mb-2">Cumulative Impact (Waterfall)</h3>
          <div class="grid grid-cols-5 gap-1.5 items-end h-36 pt-4 text-center text-[10px]">
            <div class="flex flex-col items-center justify-end h-full">
              <span class="font-bold text-rose-600 mb-1">21 Dec</span>
              <div class="w-10 rounded-t bg-rose-500" style="height: 82px"></div>
              <span class="text-slate-500 mt-1 leading-tight">Current</span>
            </div>
            {#each scenarios as sc}
              <div class="flex flex-col items-center justify-end h-full">
                <span class="font-bold {sc.enabled ? 'text-emerald-700' : 'text-slate-400'} mb-1">{sc.enabled ? `-${sc.daysSaved}d` : '0d'}</span>
                <div class="w-10 rounded-t transition-all {sc.enabled ? 'bg-emerald-500' : 'bg-slate-200'}" style="height: {sc.enabled ? Math.max(16, sc.daysSaved * 15) : 8}px"></div>
                <span class="text-slate-500 mt-1 leading-tight truncate w-full">{sc.id.replace('sim-', '').toUpperCase()}</span>
              </div>
            {/each}
            <div class="flex flex-col items-center justify-end h-full">
              <span class="font-bold text-blue-700 mb-1">{formatShortDate(simOutput.simulatedDblDate).slice(0, 6)}</span>
              <div class="w-10 rounded-t bg-blue-600 transition-all" style="height: {Math.max(22, 82 - simOutput.daysRecovered * 7)}px"></div>
              <span class="text-slate-500 mt-1 leading-tight">Post</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  {/if}
</div>
