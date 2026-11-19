<script lang="ts">
  import {
    ChevronRight,
    ChevronDown,
    Search,
    AlertTriangle,
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
    X,
  } from '@lucide/svelte';
  import { V3_PORTFOLIO_STUDIES, type V3PortfolioStudy } from '../data/v3Data';

  export let onSelectStudy: (studyId: string) => void;

  // =========================================================================
  // COMPREHENSIVE PORTFOLIO FILTERS
  // =========================================================================
  let selectedTA = 'all';
  let studySearch = '';
  let selectedStudyDropdown = 'all';
  let showStudyDropdown = false;

  const milestoneOptions = [
    { id: 'dbl', label: 'Database Lock (DBL)' },
    { id: 'lslv', label: 'Last Subject Last Visit (LSLV)' },
    { id: 'protocol_amendments', label: 'Protocol Amendments' },
    { id: 'submissions', label: 'Regulatory Submissions' },
    { id: 'safety_milestones', label: 'Safety Milestones / DMC' },
  ];
  let selectedMilestones: string[] = milestoneOptions.map((m) => m.id);

  let riskTiers: Record<'Critical' | 'High' | 'Medium' | 'Low', boolean> = {
    Critical: true,
    High: true,
    Medium: true,
    Low: true,
  };

  let dblStatusFilter: 'all' | 'delayed' | 'on_track' = 'all';
  let trajectoryFilter: 'all' | 'improving' | 'slipping' = 'all';
  let selectedPhase = 'all';
  let selectedCountry = 'all';
  let selectedDomain = 'all';
  let selectedOwner = 'all';
  let selectedActionStatus = 'all';
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

  const availableTAs = Array.from(new Set(V3_PORTFOLIO_STUDIES.map((s) => s.therapeuticArea))).sort();
  const availablePhases = Array.from(new Set(V3_PORTFOLIO_STUDIES.map((s) => s.phase))).sort();
  const availableCountries = Array.from(new Set(V3_PORTFOLIO_STUDIES.flatMap((s) => s.countries))).sort();
  const availableDomains = Array.from(
    new Set(V3_PORTFOLIO_STUDIES.map((s) => s.criticalDomain).filter((d) => d !== 'None'))
  ).sort();
  const availableOwners = Array.from(new Set(V3_PORTFOLIO_STUDIES.map((s) => s.owner))).sort();

  $: studyLookupMatches = V3_PORTFOLIO_STUDIES.filter((s) => {
    const matchTA = selectedTA === 'all' || s.therapeuticArea === selectedTA;
    const q = studySearch.trim().toLowerCase();
    const matchQ =
      !q ||
      s.id.toLowerCase().includes(q) ||
      s.title.toLowerCase().includes(q) ||
      s.indication.toLowerCase().includes(q);
    return matchTA && matchQ;
  });

  function toggleMilestone(id: string) {
    if (selectedMilestones.includes(id)) {
      if (selectedMilestones.length > 1) {
        selectedMilestones = selectedMilestones.filter((m) => m !== id);
      }
    } else {
      selectedMilestones = [...selectedMilestones, id];
    }
  }

  function clearAllFilters() {
    selectedTA = 'all';
    studySearch = '';
    selectedStudyDropdown = 'all';
    selectedMilestones = milestoneOptions.map((m) => m.id);
    riskTiers = { Critical: true, High: true, Medium: true, Low: true };
    dblStatusFilter = 'all';
    trajectoryFilter = 'all';
    selectedPhase = 'all';
    selectedCountry = 'all';
    selectedDomain = 'all';
    selectedOwner = 'all';
    selectedActionStatus = 'all';
    recoverableOnly = false;
  }

  $: activeFilterCount =
    (selectedTA !== 'all' ? 1 : 0) +
    (studySearch.trim() !== '' || selectedStudyDropdown !== 'all' ? 1 : 0) +
    (selectedMilestones.length < milestoneOptions.length ? 1 : 0) +
    (Object.values(riskTiers).filter(Boolean).length < 4 ? 1 : 0) +
    (dblStatusFilter !== 'all' ? 1 : 0) +
    (trajectoryFilter !== 'all' ? 1 : 0) +
    (selectedPhase !== 'all' ? 1 : 0) +
    (selectedCountry !== 'all' ? 1 : 0) +
    (selectedDomain !== 'all' ? 1 : 0) +
    (selectedOwner !== 'all' ? 1 : 0) +
    (selectedActionStatus !== 'all' ? 1 : 0) +
    (recoverableOnly ? 1 : 0);

  $: filteredStudies = V3_PORTFOLIO_STUDIES.filter((s) => {
    if (selectedTA !== 'all' && s.therapeuticArea !== selectedTA) return false;
    if (selectedStudyDropdown !== 'all' && s.id !== selectedStudyDropdown) return false;
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
    if (!s.milestones.some((m) => selectedMilestones.includes(m))) return false;
    if (!riskTiers[s.riskTier]) return false;
    if (dblStatusFilter === 'delayed' && s.delayDays === 0) return false;
    if (dblStatusFilter === 'on_track' && s.delayDays > 0) return false;
    if (trajectoryFilter === 'improving' && s.trend7d <= 0) return false;
    if (trajectoryFilter === 'slipping' && s.trend7d >= 0) return false;
    if (selectedPhase !== 'all' && s.phase !== selectedPhase) return false;
    if (selectedCountry !== 'all' && !s.countries.includes(selectedCountry)) return false;
    if (selectedDomain !== 'all' && s.criticalDomain !== selectedDomain) return false;
    if (selectedOwner !== 'all' && s.owner !== selectedOwner) return false;
    if (selectedActionStatus !== 'all' && s.actionStatus !== selectedActionStatus) return false;
    if (recoverableOnly && s.recoverableDays <= 0) return false;
    return true;
  });

  function toggleSort(field: SortField) {
    if (sortField === field) {
      sortDir = sortDir === 'desc' ? 'asc' : 'desc';
    } else {
      sortField = field;
      sortDir = field === 'readiness' || field === 'variance' || field === 'targetDbl' || field === 'predictedDbl' ? 'asc' : 'desc';
    }
  }

  $: sortedStudies = [...filteredStudies].sort((a, b) => {
    const dir = sortDir === 'asc' ? 1 : -1;
    if (sortField === 'variance') {
      return ((a.readiness - a.expected) - (b.readiness - b.expected)) * dir;
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

  function readinessBarColor(readiness: number, expected: number): string {
    if (readiness >= expected) return 'bg-emerald-500';
    if (expected - readiness <= 5) return 'bg-amber-500';
    return 'bg-rose-500';
  }

  function formatCountries(countries: string[]): string {
    if (countries.length <= 3) return countries.join(', ');
    return `${countries.slice(0, 3).join(', ')} +${countries.length - 3}`;
  }
</script>

<div class="space-y-5">
  <!-- Header -->
  <div class="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs flex flex-wrap items-center justify-between gap-4">
    <div>
      <div class="text-[11px] font-bold uppercase tracking-wider text-blue-600">
        Portfolio Command · D-60 to Forecast DBL
      </div>
      <h1 class="text-xl font-bold text-slate-900 mt-0.5">Studies in Active Lock Window</h1>
      <p class="text-xs text-slate-500 mt-1">
        Ranked by <span class="font-semibold text-slate-700">Highest Recoverable DBL Risk</span> — filter by therapeutic area, milestone gate, country, domain, or owner, and click any study to inspect.
      </p>
    </div>
    <button
      type="button"
      on:click={() => onSelectStudy('CA-209-301')}
      class="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs cursor-pointer"
    >
      Open Featured Study: CA-209-301 <ChevronRight size={14} />
    </button>
  </div>

  <!-- 5 Interactive Portfolio KPIs -->
  <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
    <button
      type="button"
      on:click={clearAllFilters}
      class="text-left bg-white rounded-xl border p-4 shadow-xs transition-all cursor-pointer hover:border-blue-300 {activeFilterCount === 0 ? 'border-blue-200 ring-1 ring-blue-100' : 'border-slate-200/80'}"
    >
      <div class="text-xs font-medium text-slate-500">Studies in Scope</div>
      <div class="mt-1.5 flex items-baseline gap-1.5">
        <span class="text-3xl font-bold text-slate-900">{filteredStudies.length}</span>
        <span class="text-xs text-slate-400 font-semibold">of {V3_PORTFOLIO_STUDIES.length}</span>
      </div>
      <div class="text-[11px] text-slate-400 mt-2">Mean readiness: <span class="font-semibold text-slate-700">{meanReadiness}%</span></div>
    </button>

    <button
      type="button"
      on:click={() => { dblStatusFilter = dblStatusFilter === 'delayed' ? 'all' : 'delayed'; }}
      class="text-left bg-white rounded-xl border p-4 shadow-xs transition-all cursor-pointer hover:border-rose-300 {dblStatusFilter === 'delayed' ? 'border-rose-300 ring-2 ring-rose-100' : 'border-slate-200/80'}"
    >
      <div class="text-xs font-medium text-slate-500">Forecast to Miss DBL</div>
      <div class="mt-1.5 flex items-baseline gap-1.5">
        <span class="text-3xl font-bold text-rose-600">{studiesMissing}</span>
        <span class="text-sm text-slate-400 font-semibold">of {filteredStudies.length}</span>
      </div>
      <div class="text-[11px] text-slate-500 mt-2">Click to {dblStatusFilter === 'delayed' ? 'clear' : 'filter delayed'}</div>
    </button>

    <div class="bg-white rounded-xl border border-slate-200/80 p-4 shadow-xs">
      <div class="text-xs font-medium text-slate-500">Critical-Path Blockers</div>
      <div class="text-3xl font-bold text-slate-900 mt-1.5">{totalBlockers}</div>
      <div class="text-[11px] text-slate-500 mt-2">Hard-gate blockers across slice</div>
    </div>

    <div class="bg-white rounded-xl border border-slate-200/80 p-4 shadow-xs">
      <div class="text-xs font-medium text-slate-500">Portfolio Delay Exposure</div>
      <div class="text-3xl font-bold text-amber-600 mt-1.5">{totalDelayExposure}d</div>
      <div class="text-[11px] text-slate-500 mt-2">Cumulative forecast slip days</div>
    </div>

    <button
      type="button"
      on:click={() => { recoverableOnly = !recoverableOnly; }}
      class="text-left rounded-xl border p-4 shadow-xs transition-all cursor-pointer bg-emerald-50/40 hover:border-emerald-400 {recoverableOnly ? 'border-emerald-400 ring-2 ring-emerald-200' : 'border-emerald-200'}"
    >
      <div class="text-xs font-medium text-emerald-800">Intervention Opportunity</div>
      <div class="text-3xl font-bold text-emerald-700 mt-1.5">{totalRecoverable}d</div>
      <div class="text-[11px] text-emerald-700 mt-2">Click to {recoverableOnly ? 'show all' : 'filter recoverable'}</div>
    </button>
  </div>

  <!-- Main Workspace: Filter Rail (3 cols) + Improved Table/Cards (9 cols) -->
  <div class="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
    <!-- LEFT FILTER RAIL -->
    <aside class="lg:col-span-3 bg-white rounded-xl border border-slate-200/80 p-4 shadow-xs space-y-4">
      <div class="flex items-center justify-between pb-2.5 border-b border-slate-100">
        <div class="flex items-center gap-2">
          <SlidersHorizontal size={14} class="text-blue-600" />
          <h2 class="text-xs font-bold uppercase tracking-wider text-slate-800">Portfolio Filters</h2>
          {#if activeFilterCount > 0}
            <span class="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700">
              {activeFilterCount}
            </span>
          {/if}
        </div>
        <button
          type="button"
          on:click={clearAllFilters}
          class="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:text-blue-800 cursor-pointer"
        >
          <RotateCcw size={11} /> Reset
        </button>
      </div>

      <!-- 1. Therapeutic Area -->
      <div class="space-y-1">
        <label for="v3-ta-filter" class="text-[11px] font-semibold text-slate-700 block">Therapeutic Area</label>
        <div class="relative">
          <select
            id="v3-ta-filter"
            bind:value={selectedTA}
            on:change={() => { selectedStudyDropdown = 'all'; }}
            class="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg py-2 px-2.5 text-slate-800 font-medium appearance-none focus:outline-hidden focus:border-blue-500 focus:bg-white"
          >
            <option value="all">All Therapeutic Areas ({V3_PORTFOLIO_STUDIES.length})</option>
            {#each availableTAs as ta}
              <option value={ta}>
                {ta} ({V3_PORTFOLIO_STUDIES.filter((s) => s.therapeuticArea === ta).length})
              </option>
            {/each}
          </select>
          <ChevronDown size={13} class="absolute right-2.5 top-2.5 text-slate-400 pointer-events-none" />
        </div>
      </div>

      <!-- 2. Searchable Study Protocol -->
      <div class="space-y-1">
        <div class="flex items-center justify-between">
          <label for="v3-study-search" class="text-[11px] font-semibold text-slate-700">Protocol / Study ID</label>
          <span class="text-[10px] text-slate-400">{studyLookupMatches.length} available</span>
        </div>
        <div class="relative">
          <Search size={12} class="absolute left-2.5 top-2.5 text-slate-400" />
          <input
            id="v3-study-search"
            type="text"
            bind:value={studySearch}
            on:focus={() => (showStudyDropdown = true)}
            on:blur={() => setTimeout(() => (showStudyDropdown = false), 160)}
            placeholder="Search ID, indication, driver..."
            class="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg py-1.5 pl-7 pr-6 text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-blue-500 focus:bg-white"
          />
          {#if studySearch || selectedStudyDropdown !== 'all'}
            <button
              type="button"
              on:click={() => { studySearch = ''; selectedStudyDropdown = 'all'; }}
              class="absolute right-2 top-2 text-slate-400 hover:text-slate-600 cursor-pointer"
              aria-label="Clear search"
            >
              <X size={12} />
            </button>
          {/if}
          {#if showStudyDropdown}
            <div class="absolute left-0 right-0 top-9 bg-white border border-slate-200 rounded-lg shadow-lg max-h-48 overflow-y-auto z-30 divide-y divide-slate-100 text-xs">
              <button
                type="button"
                on:mousedown={() => { selectedStudyDropdown = 'all'; studySearch = ''; }}
                class="w-full text-left px-2.5 py-1.5 hover:bg-slate-50 font-semibold text-blue-600"
              >
                Show all matching ({studyLookupMatches.length})
              </button>
              {#each studyLookupMatches as st}
                <button
                  type="button"
                  on:mousedown={() => { selectedStudyDropdown = st.id; studySearch = st.id; }}
                  class="w-full text-left px-2.5 py-1.5 hover:bg-slate-50 flex items-center justify-between gap-2"
                >
                  <div class="truncate">
                    <span class="font-bold font-mono text-slate-900">{st.id}</span>
                    <span class="text-[11px] text-slate-500 ml-1">· {st.indication}</span>
                  </div>
                  <span class="text-[10px] font-mono text-slate-500 shrink-0">{st.readiness}%</span>
                </button>
              {/each}
            </div>
          {/if}
        </div>
      </div>

      <!-- 3. Active Milestone Gates -->
      <div class="space-y-1.5 pt-2.5 border-t border-slate-100">
        <span class="text-[11px] font-semibold text-slate-700 block">Active Milestone Gates</span>
        <div class="space-y-1 text-xs text-slate-600">
          {#each milestoneOptions as mOpt}
            <label class="flex items-center gap-2 cursor-pointer hover:text-slate-900 py-0.5">
              <input
                type="checkbox"
                checked={selectedMilestones.includes(mOpt.id)}
                on:change={() => toggleMilestone(mOpt.id)}
                class="rounded text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
              />
              <span>{mOpt.label}</span>
            </label>
          {/each}
        </div>
      </div>

      <!-- 4. Risk Tier & DBL Status -->
      <div class="space-y-2 pt-2.5 border-t border-slate-100">
        <span class="text-[11px] font-semibold text-slate-700 block">Risk Classification</span>
        <div class="space-y-1 text-xs text-slate-600">
          {#each [
            { key: 'Critical' as const, dot: 'bg-rose-500', label: 'Critical (>5d slip / >70%)' },
            { key: 'High' as const, dot: 'bg-orange-500', label: 'High (3–5d slip)' },
            { key: 'Medium' as const, dot: 'bg-amber-400', label: 'Medium (1–2d slip)' },
            { key: 'Low' as const, dot: 'bg-emerald-500', label: 'Low / On Track (0d)' },
          ] as tier}
            <label class="flex items-center justify-between cursor-pointer hover:text-slate-900 py-0.5">
              <span class="flex items-center gap-2">
                <input type="checkbox" bind:checked={riskTiers[tier.key]} class="rounded text-blue-600 w-3.5 h-3.5" />
                <span class="w-2 h-2 rounded-full {tier.dot}"></span>
                <span>{tier.label}</span>
              </span>
              <span class="text-[11px] text-slate-400 font-mono">
                {V3_PORTFOLIO_STUDIES.filter((s) => s.riskTier === tier.key).length}
              </span>
            </label>
          {/each}
        </div>

        <div class="grid grid-cols-2 gap-2 pt-1">
          <div>
            <label for="v3-dbl-status" class="text-[11px] font-semibold text-slate-700 block mb-1">DBL Status</label>
            <select
              id="v3-dbl-status"
              bind:value={dblStatusFilter}
              class="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg py-1.5 px-2 text-slate-800"
            >
              <option value="all">All</option>
              <option value="delayed">Miss DBL</option>
              <option value="on_track">On Track</option>
            </select>
          </div>
          <div>
            <label for="v3-traj" class="text-[11px] font-semibold text-slate-700 block mb-1">7d Trajectory</label>
            <select
              id="v3-traj"
              bind:value={trajectoryFilter}
              class="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg py-1.5 px-2 text-slate-800"
            >
              <option value="all">All</option>
              <option value="improving">Improving</option>
              <option value="slipping">Slipping</option>
            </select>
          </div>
        </div>
      </div>

      <!-- 5. Phase & Country -->
      <div class="grid grid-cols-2 gap-2 pt-2.5 border-t border-slate-100">
        <div>
          <label for="v3-phase" class="text-[11px] font-semibold text-slate-700 block mb-1">Phase</label>
          <select
            id="v3-phase"
            bind:value={selectedPhase}
            class="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg py-1.5 px-2 text-slate-800"
          >
            <option value="all">All</option>
            {#each availablePhases as p}
              <option value={p}>{p}</option>
            {/each}
          </select>
        </div>
        <div>
          <label for="v3-country" class="text-[11px] font-semibold text-slate-700 block mb-1">Country</label>
          <select
            id="v3-country"
            bind:value={selectedCountry}
            class="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg py-1.5 px-2 text-slate-800"
          >
            <option value="all">All ({availableCountries.length})</option>
            {#each availableCountries as c}
              <option value={c}>{c}</option>
            {/each}
          </select>
        </div>
      </div>

      <!-- 6. Critical Domain, Owner & Action Status -->
      <div class="space-y-2 pt-2.5 border-t border-slate-100">
        <div>
          <label for="v3-domain" class="text-[11px] font-semibold text-slate-700 block mb-1">Critical-Path Domain</label>
          <select
            id="v3-domain"
            bind:value={selectedDomain}
            class="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg py-1.5 px-2 text-slate-800"
          >
            <option value="all">All Domains</option>
            {#each availableDomains as dom}
              <option value={dom}>{dom}</option>
            {/each}
          </select>
        </div>

        <div class="grid grid-cols-2 gap-2">
          <div>
            <label for="v3-owner" class="text-[11px] font-semibold text-slate-700 block mb-1">Owner</label>
            <select
              id="v3-owner"
              bind:value={selectedOwner}
              class="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg py-1.5 px-2 text-slate-800"
            >
              <option value="all">All</option>
              {#each availableOwners as own}
                <option value={own}>{own}</option>
              {/each}
            </select>
          </div>
          <div>
            <label for="v3-action-status" class="text-[11px] font-semibold text-slate-700 block mb-1">Action Status</label>
            <select
              id="v3-action-status"
              bind:value={selectedActionStatus}
              class="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg py-1.5 px-2 text-slate-800"
            >
              <option value="all">All</option>
              <option value="Escalated">Escalated</option>
              <option value="In Progress">In Progress</option>
              <option value="Assigned">Assigned</option>
              <option value="On Track">On Track</option>
            </select>
          </div>
        </div>
      </div>
    </aside>

    <!-- RIGHT WORKSPACE: TOOLBAR + IMPROVED TABLE / CARDS -->
    <div class="lg:col-span-9 space-y-3">
      <div class="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
        <!-- Toolbar -->
        <div class="px-4 py-3.5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <div class="flex items-center gap-2">
            <h2 class="text-sm font-bold text-slate-900">Portfolio Risk Ranking</h2>
            <span class="px-2 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700">
              {sortedStudies.length} of {V3_PORTFOLIO_STUDIES.length}
            </span>
            {#if recoverableOnly}
              <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                Recoverable &gt;0d
                <button type="button" on:click={() => (recoverableOnly = false)} class="cursor-pointer"><X size={10} /></button>
              </span>
            {/if}
          </div>

          <div class="flex flex-wrap items-center gap-2">
            <div class="flex items-center gap-1.5 text-xs text-slate-500">
              <ArrowUpDown size={12} />
              <span>Sort:</span>
              <select
                bind:value={sortField}
                class="bg-slate-50 border border-slate-200 rounded-lg py-1 px-2 text-xs font-medium text-slate-800"
              >
                <option value="priorityScore">Priority Score</option>
                <option value="delayDays">Forecast Slip (Days)</option>
                <option value="probDelay">Probability of Delay</option>
                <option value="readiness">Readiness %</option>
                <option value="variance">Plan Variance</option>
                <option value="hardGates">Hard-Gate Blockers</option>
                <option value="recoverableDays">Recoverable Days</option>
                <option value="predictedDbl">Predicted DBL Date</option>
              </select>
              <button
                type="button"
                on:click={() => (sortDir = sortDir === 'desc' ? 'asc' : 'desc')}
                class="p-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 cursor-pointer"
                title="Toggle sort direction"
              >
                {#if sortDir === 'desc'}
                  <ArrowDown size={12} />
                {:else}
                  <ArrowUp size={12} />
                {/if}
              </button>
            </div>

            <div class="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-0.5">
              <button
                type="button"
                on:click={() => (viewLayout = 'table')}
                class="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium cursor-pointer {viewLayout === 'table' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-700'}"
              >
                <Table size={12} /> Table
              </button>
              <button
                type="button"
                on:click={() => (viewLayout = 'cards')}
                class="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium cursor-pointer {viewLayout === 'cards' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-700'}"
              >
                <LayoutGrid size={12} /> Cards
              </button>
            </div>
          </div>
        </div>

        {#if sortedStudies.length === 0}
          <div class="p-12 text-center space-y-2">
            <div class="text-sm font-semibold text-slate-700">No studies match your current filters</div>
            <p class="text-xs text-slate-500">Try clearing one or more filters in the left rail to view studies.</p>
            <button
              type="button"
              on:click={clearAllFilters}
              class="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-semibold cursor-pointer"
            >
              <RotateCcw size={12} /> Reset All Filters
            </button>
          </div>
        {:else if viewLayout === 'table'}
          <div class="overflow-x-auto">
            <table class="w-full text-xs border-collapse">
              <thead>
                <tr class="bg-slate-50/80 border-b border-slate-200/80 text-left text-[11px] font-semibold text-slate-500">
                  <th class="py-2.5 pl-4 pr-2 whitespace-nowrap">
                    <button type="button" on:click={() => toggleSort('priorityScore')} class="inline-flex items-center gap-1 hover:text-slate-900 cursor-pointer">
                      Rank / Score
                    </button>
                  </th>
                  <th class="py-2.5 px-2.5 min-w-[230px]">Study &amp; Scope</th>
                  <th class="py-2.5 px-2.5 min-w-[165px]">
                    <button type="button" on:click={() => toggleSort('readiness')} class="inline-flex items-center gap-1 hover:text-slate-900 cursor-pointer">
                      Readiness vs Plan
                    </button>
                  </th>
                  <th class="py-2.5 px-2.5 whitespace-nowrap">
                    <button type="button" on:click={() => toggleSort('predictedDbl')} class="inline-flex items-center gap-1 hover:text-slate-900 cursor-pointer">
                      LSLV &amp; DBL Schedule
                    </button>
                  </th>
                  <th class="py-2.5 px-2.5 whitespace-nowrap">
                    <button type="button" on:click={() => toggleSort('probDelay')} class="inline-flex items-center gap-1 hover:text-slate-900 cursor-pointer">
                      Risk &amp; Hard Gates
                    </button>
                  </th>
                  <th class="py-2.5 px-2.5 min-w-[180px]">Critical-Path Driver</th>
                  <th class="py-2.5 px-2.5 text-right whitespace-nowrap">
                    <button type="button" on:click={() => toggleSort('recoverableDays')} class="inline-flex items-center gap-1 hover:text-slate-900 cursor-pointer">
                      Recoverable
                    </button>
                  </th>
                  <th class="py-2.5 pl-2.5 pr-4 text-right whitespace-nowrap">Owner &amp; Status</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                {#each sortedStudies as st, idx}
                  {@const variance = st.readiness - st.expected}
                  <tr
                    class="hover:bg-blue-50/40 transition-colors cursor-pointer group {st.id === 'CA-209-301' ? 'bg-blue-50/25' : ''}"
                    on:click={() => onSelectStudy(st.id)}
                  >
                    <!-- 1. Rank & Priority Score -->
                    <td class="py-3.5 pl-4 pr-2 align-top whitespace-nowrap">
                      <div class="flex items-center gap-1.5">
                        <span class="text-[11px] font-bold text-slate-400 w-4">#{idx + 1}</span>
                        <span class="px-2 py-0.5 rounded-md text-[11px] font-bold border font-mono {priorityBadge(st.priorityScore)}">
                          {st.priorityScore}
                        </span>
                      </div>
                      <div class="text-[10px] text-slate-400 mt-1 pl-5">{st.riskTier} Risk</div>
                    </td>

                    <!-- 2. Study & Scope -->
                    <td class="py-3.5 px-2.5 align-top">
                      <div class="flex items-center gap-1.5 flex-wrap">
                        <span class="font-bold text-blue-700 font-mono text-[13px] group-hover:underline">{st.id}</span>
                        {#if st.id === 'CA-209-301'}
                          <span class="px-1.5 py-0.5 rounded text-[9px] font-bold bg-blue-100 text-blue-800">DEMO</span>
                        {/if}
                        <span class="px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-700">{st.phase}</span>
                        <span class="px-1.5 py-0.5 rounded text-[10px] font-medium bg-indigo-50 text-indigo-700">{st.therapeuticArea}</span>
                      </div>
                      <div class="text-[11px] font-medium text-slate-800 mt-0.5 line-clamp-1">{st.title}</div>
                      <div class="text-[10px] text-slate-500 mt-0.5">
                        {st.sitesCount} sites · {st.subjectsCount} subj · <span class="text-slate-600 font-medium">{formatCountries(st.countries)}</span>
                      </div>
                    </td>

                    <!-- 3. Readiness vs Plan (Visual Bar + Variance + 7d Trend) -->
                    <td class="py-3.5 px-2.5 align-top">
                      <div class="flex items-center justify-between gap-2">
                        <span class="font-bold text-slate-900 font-mono">{st.readiness}%</span>
                        <span class="text-[10px] font-semibold px-1.5 py-0.5 rounded {variance >= 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}">
                          {variance >= 0 ? `+${variance}` : variance} pts vs {st.expected}%
                        </span>
                      </div>
                      <!-- Progress bar with expected tick -->
                      <div class="relative h-2 bg-slate-100 rounded-full mt-1.5 overflow-hidden">
                        <div
                          class="h-full rounded-full {readinessBarColor(st.readiness, st.expected)}"
                          style="width: {st.readiness}%"
                        ></div>
                        <div
                          class="absolute top-0 bottom-0 w-0.5 bg-slate-900/70"
                          style="left: {st.expected}%"
                          title="Expected: {st.expected}%"
                        ></div>
                      </div>
                      <div class="flex items-center justify-between text-[10px] text-slate-500 mt-1">
                        <span>{st.cleanSubjects}/{st.subjectsCount} clean</span>
                        <span class="inline-flex items-center gap-0.5 font-semibold {st.trend7d >= 0 ? 'text-emerald-600' : 'text-rose-600'}">
                          {#if st.trend7d >= 0}
                            <TrendingUp size={10} /> +{st.trend7d}%
                          {:else}
                            <TrendingDown size={10} /> {st.trend7d}%
                          {/if}
                          7d
                        </span>
                      </div>
                    </td>

                    <!-- 4. LSLV & DBL Schedule -->
                    <td class="py-3.5 px-2.5 align-top whitespace-nowrap">
                      <div class="flex items-center gap-1.5">
                        <span class="font-bold {st.delayDays > 0 ? 'text-rose-600' : 'text-emerald-700'}">{st.predictedDbl}</span>
                        {#if st.delayDays > 0}
                          <span class="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                            +{st.delayDays}d
                          </span>
                        {:else}
                          <span class="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            On Time
                          </span>
                        {/if}
                      </div>
                      <div class="text-[10px] text-slate-500 mt-1">Target DBL: {st.targetDbl}</div>
                      <div class="text-[10px] text-slate-400">LSLV: {st.lslvDate}</div>
                    </td>

                    <!-- 5. Risk & Hard Gates -->
                    <td class="py-3.5 px-2.5 align-top whitespace-nowrap">
                      <div class="flex items-center gap-2">
                        <span class="font-bold font-mono {st.probDelay >= 60 ? 'text-rose-600' : st.probDelay >= 30 ? 'text-amber-600' : 'text-emerald-600'}">
                          {st.probDelay}%
                        </span>
                        <span class="text-[10px] text-slate-400">slip prob</span>
                      </div>
                      <div class="mt-1 flex items-center gap-1.5">
                        {#if st.hardGates > 0}
                          <span class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                            <ShieldAlert size={10} /> {st.hardGates} gates
                          </span>
                        {:else}
                          <span class="px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-500">0 gates</span>
                        {/if}
                      </div>
                      <div class="text-[10px] text-slate-400 mt-0.5">{st.criticalSites}/{st.sitesCount} crit. sites</div>
                    </td>

                    <!-- 6. Critical-Path Driver -->
                    <td class="py-3.5 px-2.5 align-top">
                      {#if st.delayDays > 0}
                        <span class="inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-200 mb-1">
                          {st.criticalDomain}
                        </span>
                        <div class="text-[11px] text-slate-700 leading-snug flex items-start gap-1">
                          <AlertTriangle size={11} class="text-amber-500 shrink-0 mt-0.5" />
                          <span>{st.criticalDriver}</span>
                        </div>
                      {:else}
                        <span class="inline-block px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-50 text-emerald-700 mb-1">
                          Clear
                        </span>
                        <div class="text-[11px] text-slate-400">{st.criticalDriver}</div>
                      {/if}
                    </td>

                    <!-- 7. Recoverable -->
                    <td class="py-3.5 px-2.5 align-top text-right whitespace-nowrap">
                      {#if st.recoverableDays > 0}
                        <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <Sparkles size={11} /> +{st.recoverableDays}d
                        </span>
                        <div class="text-[10px] text-slate-400 mt-1">recoverable</div>
                      {:else}
                        <span class="text-slate-400 font-medium">0d</span>
                      {/if}
                    </td>

                    <!-- 8. Owner & Status -->
                    <td class="py-3.5 pl-2.5 pr-4 align-top text-right whitespace-nowrap">
                      <div class="flex flex-col items-end gap-1">
                        <span class="px-2 py-0.5 rounded-full text-[10px] font-semibold border {statusBadge(st.actionStatus)}">
                          {st.actionStatus}
                        </span>
                        <span class="text-[11px] text-slate-600 font-medium">{st.owner}</span>
                        <span class="inline-flex items-center gap-0.5 text-[11px] text-blue-600 font-semibold group-hover:translate-x-0.5 transition-transform">
                          Inspect <ChevronRight size={12} />
                        </span>
                      </div>
                    </td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>
        {:else}
          <!-- Cards Layout -->
          <div class="p-4 grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {#each sortedStudies as st, idx}
              {@const variance = st.readiness - st.expected}
              <button
                type="button"
                on:click={() => onSelectStudy(st.id)}
                class="text-left rounded-xl border border-slate-200/90 hover:border-blue-400 p-4 transition-all hover:shadow-sm cursor-pointer bg-white space-y-3"
              >
                <div class="flex items-start justify-between gap-2">
                  <div>
                    <div class="flex items-center gap-1.5 flex-wrap">
                      <span class="text-[11px] font-bold text-slate-400">#{idx + 1}</span>
                      <span class="font-bold font-mono text-blue-700 text-sm">{st.id}</span>
                      <span class="px-1.5 py-0.5 rounded text-[10px] font-bold border {priorityBadge(st.priorityScore)}">
                        Score {st.priorityScore}
                      </span>
                      <span class="px-1.5 py-0.5 rounded text-[10px] bg-slate-100 text-slate-700">{st.phase}</span>
                      <span class="px-1.5 py-0.5 rounded text-[10px] bg-indigo-50 text-indigo-700">{st.therapeuticArea}</span>
                    </div>
                    <div class="text-xs font-semibold text-slate-900 mt-1">{st.title}</div>
                  </div>
                  <span class="px-2 py-0.5 rounded-full text-[10px] font-semibold border shrink-0 {statusBadge(st.actionStatus)}">
                    {st.actionStatus}
                  </span>
                </div>

                <div class="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 text-xs">
                  <div>
                    <div class="text-[10px] text-slate-400">Readiness</div>
                    <div class="font-bold text-slate-900">{st.readiness}% <span class="text-[10px] font-normal {variance >= 0 ? 'text-emerald-600' : 'text-rose-600'}">({variance >= 0 ? `+${variance}` : variance})</span></div>
                  </div>
                  <div>
                    <div class="text-[10px] text-slate-400">Predicted DBL</div>
                    <div class="font-bold {st.delayDays > 0 ? 'text-rose-600' : 'text-emerald-700'}">
                      {st.predictedDbl} {st.delayDays > 0 ? `(+${st.delayDays}d)` : ''}
                    </div>
                  </div>
                  <div>
                    <div class="text-[10px] text-slate-400">Recoverable</div>
                    <div class="font-bold text-emerald-700">{st.recoverableDays > 0 ? `+${st.recoverableDays}d` : '0d'}</div>
                  </div>
                </div>

                <div class="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-100">
                  <span class="truncate max-w-[70%]">{st.criticalDriver}</span>
                  <span class="text-blue-600 font-semibold inline-flex items-center gap-0.5">
                    Inspect <ChevronRight size={12} />
                  </span>
                </div>
              </button>
            {/each}
          </div>
        {/if}
      </div>
    </div>
  </div>
</div>
