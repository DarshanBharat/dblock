<script lang="ts">
  import {
    ArrowLeft,
    Search,
    RotateCcw,
    ChevronRight,
    ChevronLeft,
    SlidersHorizontal,
    ArrowUpDown,
    ArrowUp,
    ArrowDown,
    Filter,
    X,
    Users,
    CheckCircle2,
    AlertTriangle,
    ShieldAlert,
    Clock,
    Calendar,
  } from '@lucide/svelte';
  import { V3_STUDY_META, V3_SUBJECT_ROWS, V3_COUNTRY_SUMMARY, V3_SITES } from '../data/v3Data';
  import SubjectDrawerV3 from './SubjectDrawerV3.svelte';
  import MultiSelectFilter from './MultiSelectFilter.svelte';

  export let onSelectTab: (tab: string) => void;
  export let onSelectSubject: (subjectId: string) => void = () => {};

  // Multi-select filters
  let countryFilters: string[] = [];
  let siteFilters: string[] = [];
  let classificationFilters: string[] = [];
  let subjectStatusFilters: string[] = [];
  let criticalityFilters: string[] = [];
  let domainOpenFilters: string[] = [];
  let quickCohorts: string[] = [];
  let searchQuery = '';

  // Table tabs, sorting, pagination
  let activeTableTab: 'readiness' | 'domain_tracker' = 'readiness';
  type SortCol = 'id' | 'country' | 'siteId' | 'status' | 'readiness' | 'classification' | 'criticality' | 'daysOpen';
  let sortCol: SortCol = 'readiness';
  let sortDir: 'asc' | 'desc' = 'asc';
  let currentPage = 1;
  let pageSize = 10;

  let hoveredDonutIdx: number | null = null;
  let hoveredTimeIdx: number | null = null;
  let rightCardTab: 'sites' | 'insights' = 'sites';
  let drawerSubjectIndex: number | null = null;

  const STATUS_OVER_TIME = [
    { label: 'D-60', lockReady: 92, conditional: 48, actionReq: 46, hardBlocked: 34 },
    { label: 'D-45', lockReady: 112, conditional: 44, actionReq: 38, hardBlocked: 26 },
    { label: 'D-30', lockReady: 130, conditional: 40, actionReq: 31, hardBlocked: 19 },
    { label: 'D-15', lockReady: 146, conditional: 36, actionReq: 24, hardBlocked: 14 },
    { label: 'Current', lockReady: 158, conditional: 32, actionReq: 20, hardBlocked: 10 },
    { label: 'LSLV', lockReady: 184, conditional: 22, actionReq: 10, hardBlocked: 4 },
    { label: 'DBL', lockReady: 214, conditional: 6, actionReq: 0, hardBlocked: 0 },
  ];

  const DOMAIN_COLUMNS = [
    { match: 'EDC Data Cleaning', short: 'EDC Cleaning' },
    { match: 'Query Resolution', short: 'Queries' },
    { match: 'External Data Reconciliation', short: 'Ext. Data' },
    { match: 'Safety Reconciliation', short: 'Safety / SAE' },
    { match: 'Medical Coding', short: 'Coding' },
    { match: 'PI Signatures', short: 'PI Sign.' },
    { match: 'Protocol Deviations', short: 'PDs' },
    { match: 'SDV / SDR', short: 'SDV / SDR' },
  ];

  function toggleArrayItem(arr: string[], val: string): string[] {
    return arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val];
  }

  function toggleSort(col: SortCol) {
    if (sortCol === col) {
      sortDir = sortDir === 'asc' ? 'desc' : 'asc';
    } else {
      sortCol = col;
      sortDir = col === 'daysOpen' ? 'desc' : 'asc';
    }
  }

  $: filteredSubjects = V3_SUBJECT_ROWS.filter((s) => {
    const q = searchQuery.trim().toLowerCase();
    const matchSearch =
      !q ||
      s.id.toLowerCase().includes(q) ||
      s.siteId.toLowerCase().includes(q) ||
      s.country.toLowerCase().includes(q) ||
      s.owner.toLowerCase().includes(q) ||
      s.keyOpenItems.toLowerCase().includes(q);
    const matchCountry = countryFilters.length === 0 || countryFilters.includes(s.country);
    const matchSite = siteFilters.length === 0 || siteFilters.includes(s.siteId);
    const matchClass = classificationFilters.length === 0 || classificationFilters.includes(s.classification);
    const matchStatus = subjectStatusFilters.length === 0 || subjectStatusFilters.includes(s.status);
    const matchCrit = criticalityFilters.length === 0 || criticalityFilters.includes(s.criticality);
    const matchDomain =
      domainOpenFilters.length === 0 ||
      domainOpenFilters.some((domName) =>
        s.domainBreakdown.some((d) => d.domain === domName && d.status === 'Action Required')
      );
    const matchCohorts =
      quickCohorts.length === 0 ||
      quickCohorts.every(
        (c) =>
          (c === 'lock_pop' && s.lockPopulation) ||
          (c === 'endpoint' && s.hasEndpointIssue) ||
          (c === 'sae' && s.hasSae)
      );
    return matchSearch && matchCountry && matchSite && matchClass && matchStatus && matchCrit && matchDomain && matchCohorts;
  }).sort((a, b) => {
    const dir = sortDir === 'asc' ? 1 : -1;
    const critRank: Record<string, number> = { Critical: 4, High: 3, Medium: 2, Low: 1 };
    const classRank: Record<string, number> = {
      'Hard Blocked': 4,
      'Action Required': 3,
      'Conditionally Ready': 2,
      'Lock Ready': 1,
    };
    let cmp = 0;
    switch (sortCol) {
      case 'id':
        cmp = a.id.localeCompare(b.id);
        break;
      case 'country':
        cmp = a.country.localeCompare(b.country);
        break;
      case 'siteId':
        cmp = a.siteId.localeCompare(b.siteId, undefined, { numeric: true });
        break;
      case 'status':
        cmp = a.status.localeCompare(b.status);
        break;
      case 'classification':
        cmp = (classRank[a.classification] || 0) - (classRank[b.classification] || 0);
        break;
      case 'criticality':
        cmp = (critRank[a.criticality] || 0) - (critRank[b.criticality] || 0);
        break;
      case 'daysOpen':
        cmp = a.daysOpen - b.daysOpen;
        break;
      case 'readiness':
      default:
        cmp = a.readiness - b.readiness;
        break;
    }
    return cmp !== 0 ? cmp * dir : b.daysOpen - a.daysOpen;
  });

  $: totalPages = Math.max(1, Math.ceil(filteredSubjects.length / pageSize));
  $: if (currentPage > totalPages) currentPage = 1;
  $: pagedSubjects = filteredSubjects.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  $: activeFilterCount =
    countryFilters.length +
    siteFilters.length +
    classificationFilters.length +
    subjectStatusFilters.length +
    criticalityFilters.length +
    domainOpenFilters.length +
    quickCohorts.length +
    (searchQuery.trim() ? 1 : 0);

  $: visiblePageNumbers = (() => {
    const pages: number[] = [];
    const start = Math.max(1, currentPage - 2);
    const end = Math.min(totalPages, start + 4);
    for (let p = Math.max(1, end - 4); p <= end; p++) pages.push(p);
    return pages;
  })();

  function resetAllFilters() {
    countryFilters = [];
    siteFilters = [];
    classificationFilters = [];
    subjectStatusFilters = [];
    criticalityFilters = [];
    domainOpenFilters = [];
    quickCohorts = [];
    searchQuery = '';
    sortCol = 'readiness';
    sortDir = 'asc';
    currentPage = 1;
  }

  // Donut data (live counts from V3_SUBJECT_ROWS)
  const subjectDonut = [
    { label: 'Lock Ready', count: V3_SUBJECT_ROWS.filter((s) => s.classification === 'Lock Ready').length, color: '#10b981' },
    { label: 'Conditionally Ready', count: V3_SUBJECT_ROWS.filter((s) => s.classification === 'Conditionally Ready').length, color: '#3b82f6' },
    { label: 'Action Required', count: V3_SUBJECT_ROWS.filter((s) => s.classification === 'Action Required').length, color: '#f59e0b' },
    { label: 'Hard Blocked', count: V3_SUBJECT_ROWS.filter((s) => s.classification === 'Hard Blocked').length, color: '#f43f5e' },
  ].map((d) => ({ ...d, pct: Math.round((d.count / V3_SUBJECT_ROWS.length) * 100) }));

  const R = 40;
  const CIRC = 2 * Math.PI * R;
  const donutArcs = (() => {
    let offset = 0;
    return subjectDonut.map((seg) => {
      const len = (seg.pct / 100) * CIRC;
      const arc = { ...seg, dasharray: `${len} ${CIRC - len}`, dashoffset: -offset };
      offset += len;
      return arc;
    });
  })();

  // Live domain open counts across V3_SUBJECT_ROWS
  $: domainOpenBars = DOMAIN_COLUMNS.map((col) => ({
    domain: col.match,
    label: col.match,
    short: col.short,
    count: V3_SUBJECT_ROWS.filter((s) =>
      s.domainBreakdown.some((d) => d.domain === col.match && d.status === 'Action Required')
    ).length,
  })).sort((a, b) => b.count - a.count);

  $: maxDomainOpen = Math.max(1, ...domainOpenBars.map((d) => d.count));

  const topSitesNotReady = [
    { siteId: '317', country: 'Germany', total: 20, notReady: 10, pct: 50 },
    { siteId: '405', country: 'South Korea', total: 18, notReady: 8, pct: 44 },
    { siteId: '104', country: 'United States', total: 16, notReady: 6, pct: 38 },
    { siteId: '208', country: 'France', total: 14, notReady: 5, pct: 36 },
    { siteId: '511', country: 'Spain', total: 12, notReady: 4, pct: 33 },
  ];

  function classBadge(c: string): string {
    if (c === 'Lock Ready') return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    if (c === 'Conditionally Ready') return 'bg-blue-50 text-blue-700 border-blue-200';
    if (c === 'Action Required') return 'bg-amber-50 text-amber-700 border-amber-200';
    return 'bg-rose-50 text-rose-700 border-rose-200';
  }

  function barColor(pct: number) {
    if (pct >= 85) return 'bg-emerald-500';
    if (pct >= 70) return 'bg-blue-500';
    if (pct >= 55) return 'bg-amber-500';
    return 'bg-rose-500';
  }
</script>

<div class="space-y-2.5">
  <!-- Executive Header Card (matching StudyOverviewV3 & SitesCountriesV3) -->
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
            {V3_STUDY_META.protocol} <span class="text-slate-300 font-normal">|</span> Subjects
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
        <div class="flex flex-wrap items-center gap-1.5">
          {#if activeFilterCount > 0}
            <button
              type="button"
              on:click={resetAllFilters}
              class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 cursor-pointer"
            >
              <RotateCcw size={12} /> Reset Filters
            </button>
          {/if}
          <button
            type="button"
            on:click={() => onSelectTab('actions_sim')}
            class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 cursor-pointer"
          >
            <SlidersHorizontal size={12} /> Simulate Subject Impact
          </button>
        </div>
        <span class="text-[10px] text-slate-400">Last refreshed: {V3_STUDY_META.lastRefreshed}</span>
      </div>
    </div>

    <!-- Metadata Strip -->
    <div class="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 pt-2 text-[11px]">
      <div>
        <div class="text-[10px] text-slate-400">Total Enrolled</div>
        <div class="font-semibold text-slate-800">{V3_SUBJECT_ROWS.length}</div>
      </div>
      <div>
        <div class="text-[10px] text-slate-400">Lock Population</div>
        <div class="font-semibold text-slate-800">{V3_SUBJECT_ROWS.filter((s) => s.lockPopulation).length}</div>
      </div>
      <div>
        <div class="text-[10px] text-slate-400">Endpoint-Critical</div>
        <div class="font-semibold text-amber-700">{V3_SUBJECT_ROWS.filter((s) => s.hasEndpointIssue).length}</div>
      </div>
      <div>
        <div class="text-[10px] text-slate-400">SAE Subjects</div>
        <div class="font-semibold text-rose-600">{V3_SUBJECT_ROWS.filter((s) => s.hasSae).length}</div>
      </div>
      <div>
        <div class="text-[10px] text-slate-400">Lock Ready</div>
        <div class="font-semibold text-emerald-700">{subjectDonut[0].count} ({subjectDonut[0].pct}%)</div>
      </div>
      <div>
        <div class="text-[10px] text-slate-400">Hard Blocked</div>
        <div class="font-bold text-rose-600">{subjectDonut[3].count}</div>
      </div>
      <div>
        <div class="text-[10px] text-slate-400">Target DBL</div>
        <div class="font-semibold text-slate-800">{V3_STUDY_META.targetDbl}</div>
      </div>
      <div>
        <div class="text-[10px] text-slate-400">Predicted DBL</div>
        <div class="font-bold text-rose-600">{V3_STUDY_META.predictedDbl} (+{V3_STUDY_META.delayDays}d)</div>
      </div>
    </div>
  </div>

  <!-- 6 Balanced KPI Cards (clickable to filter) -->
  <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
    <button
      type="button"
      on:click={() => { classificationFilters = []; currentPage = 1; }}
      class="text-left bg-white rounded-xl border border-slate-200/80 p-3 shadow-xs hover:shadow-sm transition-all cursor-pointer"
    >
      <div class="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400">
        <span>Total Subjects</span>
        <Users size={13} class="text-blue-500" />
      </div>
      <div class="mt-1 flex items-baseline gap-1.5">
        <span class="text-xl font-extrabold text-slate-900">{filteredSubjects.length}</span>
        <span class="text-[10px] text-slate-400">/ {V3_SUBJECT_ROWS.length}</span>
      </div>
      <div class="mt-1 text-[10px] text-slate-500">Shown in table</div>
    </button>

    <button
      type="button"
      on:click={() => { classificationFilters = toggleArrayItem(classificationFilters, 'Lock Ready'); currentPage = 1; }}
      class="text-left bg-white rounded-xl border p-3 shadow-xs hover:shadow-sm transition-all cursor-pointer {classificationFilters.includes('Lock Ready') ? 'border-emerald-400 ring-2 ring-emerald-100' : 'border-slate-200/80'}"
    >
      <div class="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-emerald-600">
        <span>Lock Ready</span>
        <CheckCircle2 size={13} />
      </div>
      <div class="mt-1 flex items-baseline gap-1.5">
        <span class="text-xl font-extrabold text-emerald-700">{subjectDonut[0].count}</span>
        <span class="text-[10px] font-bold text-emerald-600">{subjectDonut[0].pct}%</span>
      </div>
      <div class="mt-1 text-[10px] text-emerald-600/80">Click to filter</div>
    </button>

    <button
      type="button"
      on:click={() => { classificationFilters = toggleArrayItem(classificationFilters, 'Conditionally Ready'); currentPage = 1; }}
      class="text-left bg-white rounded-xl border p-3 shadow-xs hover:shadow-sm transition-all cursor-pointer {classificationFilters.includes('Conditionally Ready') ? 'border-blue-400 ring-2 ring-blue-100' : 'border-slate-200/80'}"
    >
      <div class="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-blue-600">
        <span>Conditionally Ready</span>
        <Clock size={13} />
      </div>
      <div class="mt-1 flex items-baseline gap-1.5">
        <span class="text-xl font-extrabold text-blue-700">{subjectDonut[1].count}</span>
        <span class="text-[10px] font-bold text-blue-600">{subjectDonut[1].pct}%</span>
      </div>
      <div class="mt-1 text-[10px] text-blue-600/80">Click to filter</div>
    </button>

    <button
      type="button"
      on:click={() => { classificationFilters = toggleArrayItem(classificationFilters, 'Action Required'); currentPage = 1; }}
      class="text-left bg-white rounded-xl border p-3 shadow-xs hover:shadow-sm transition-all cursor-pointer {classificationFilters.includes('Action Required') ? 'border-amber-400 ring-2 ring-amber-100' : 'border-slate-200/80'}"
    >
      <div class="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-amber-600">
        <span>Action Required</span>
        <AlertTriangle size={13} />
      </div>
      <div class="mt-1 flex items-baseline gap-1.5">
        <span class="text-xl font-extrabold text-amber-700">{subjectDonut[2].count}</span>
        <span class="text-[10px] font-bold text-amber-600">{subjectDonut[2].pct}%</span>
      </div>
      <div class="mt-1 text-[10px] text-amber-600/80">Click to filter</div>
    </button>

    <button
      type="button"
      on:click={() => { classificationFilters = toggleArrayItem(classificationFilters, 'Hard Blocked'); currentPage = 1; }}
      class="text-left bg-white rounded-xl border p-3 shadow-xs hover:shadow-sm transition-all cursor-pointer {classificationFilters.includes('Hard Blocked') ? 'border-rose-400 ring-2 ring-rose-100' : 'border-slate-200/80'}"
    >
      <div class="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-rose-600">
        <span>Hard Blocked</span>
        <ShieldAlert size={13} />
      </div>
      <div class="mt-1 flex items-baseline gap-1.5">
        <span class="text-xl font-extrabold text-rose-700">{subjectDonut[3].count}</span>
        <span class="text-[10px] font-bold text-rose-600">{subjectDonut[3].pct}%</span>
      </div>
      <div class="mt-1 text-[10px] text-rose-600/80">Click to filter</div>
    </button>

    <div class="bg-white rounded-xl border border-slate-200/80 p-3 shadow-xs">
      <div class="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400">
        <span>Forecast Ready</span>
        <Calendar size={13} class="text-emerald-600" />
      </div>
      <div class="mt-1 flex items-baseline gap-1.5">
        <span class="text-base font-extrabold text-slate-900">18 Dec</span>
        <span class="text-[10px] font-bold text-emerald-600">-3d vs DBL</span>
      </div>
      <div class="mt-1 text-[10px] text-slate-500">At current velocity</div>
    </div>
  </div>

  <!-- 3-Column Visual Intelligence Row (Full Width, No Sidebar) -->
  <div class="grid grid-cols-1 lg:grid-cols-12 gap-3">
    <!-- Col 1 (4 cols): Interactive Subject Readiness Donut -->
    <div
      class="lg:col-span-4 bg-white rounded-xl border border-slate-200/80 p-3 shadow-xs flex flex-col justify-between"
      role="presentation"
      on:mouseleave={() => (hoveredDonutIdx = null)}
    >
      <div class="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
        <h3 class="text-xs font-bold text-slate-900">Readiness Distribution</h3>
        {#if classificationFilters.length > 0}
          <button
            type="button"
            on:click={() => { classificationFilters = []; currentPage = 1; }}
            class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-blue-50 border border-blue-200 text-[10px] font-semibold text-blue-700 cursor-pointer"
          >
            {classificationFilters.length} selected <X size={10} />
          </button>
        {:else}
          <span class="text-[10px] font-semibold text-slate-400">Click slices to filter</span>
        {/if}
      </div>

      <div class="flex items-center gap-3 flex-1">
        <svg viewBox="0 0 110 110" class="w-24 h-24 shrink-0 overflow-visible">
          <circle cx="55" cy="55" r={R} fill="none" stroke="#f1f5f9" stroke-width="14" />
          {#each donutArcs as arc, idx}
            {@const isHovered = hoveredDonutIdx === idx}
            {@const isSelected = classificationFilters.includes(arc.label)}
            {@const isActive = isHovered || isSelected}
            {@const hasFocus = hoveredDonutIdx !== null || classificationFilters.length > 0}
            <circle
              cx="55"
              cy="55"
              r={R}
              fill="none"
              stroke={arc.color}
              stroke-width={isActive ? 17 : 14}
              stroke-dasharray={arc.dasharray}
              stroke-dashoffset={arc.dashoffset}
              opacity={hasFocus && !isActive ? 0.3 : 1}
              transform="rotate(-90 55 55)"
              class="cursor-pointer transition-all duration-150"
              role="button"
              tabindex="0"
              on:mouseenter={() => (hoveredDonutIdx = idx)}
              on:click={() => { classificationFilters = toggleArrayItem(classificationFilters, arc.label); currentPage = 1; }}
              on:keydown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); classificationFilters = toggleArrayItem(classificationFilters, arc.label); currentPage = 1; } }}
            />
          {/each}
          <text x="55" y="53" text-anchor="middle" font-size="13" font-weight="800" fill="#0f172a">{V3_SUBJECT_ROWS.length}</text>
          <text x="55" y="65" text-anchor="middle" font-size="8" fill="#64748b">Subjects</text>
        </svg>

        <div class="space-y-1 flex-1 min-w-0">
          {#each subjectDonut as seg, idx}
            {@const isSel = classificationFilters.includes(seg.label)}
            <button
              type="button"
              on:mouseenter={() => (hoveredDonutIdx = idx)}
              on:click={() => { classificationFilters = toggleArrayItem(classificationFilters, seg.label); currentPage = 1; }}
              class="w-full flex items-center justify-between text-[11px] px-1.5 py-0.5 rounded cursor-pointer transition-colors {isSel ? 'bg-blue-50 font-bold text-blue-800' : 'hover:bg-slate-50 text-slate-700'}"
            >
              <span class="inline-flex items-center gap-1.5 truncate">
                <span class="w-2 h-2 rounded-full shrink-0" style="background:{seg.color}"></span>
                <span class="truncate">{seg.label}</span>
              </span>
              <span class="font-mono font-bold text-slate-900 shrink-0">{seg.count}</span>
            </button>
          {/each}
        </div>
      </div>
    </div>

    <!-- Col 2 (4 cols): Subjects by Key Domain with Open Items (Interactive) -->
    <div class="lg:col-span-4 bg-white rounded-xl border border-slate-200/80 p-3 shadow-xs flex flex-col">
      <div class="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
        <div>
          <h3 class="text-xs font-bold text-slate-900">Subjects with Open Items by Domain</h3>
          <p class="text-[10px] text-slate-500">Click any domain bar to multi-filter</p>
        </div>
        {#if domainOpenFilters.length > 0}
          <button
            type="button"
            on:click={() => { domainOpenFilters = []; currentPage = 1; }}
            class="text-[10px] font-semibold text-blue-600 hover:underline cursor-pointer"
          >Clear</button>
        {/if}
      </div>

      <div class="space-y-1.5 flex-1 flex flex-col justify-center">
        {#each domainOpenBars as b}
          {@const active = domainOpenFilters.includes(b.domain)}
          <button
            type="button"
            on:click={() => { domainOpenFilters = toggleArrayItem(domainOpenFilters, b.domain); currentPage = 1; }}
            class="w-full grid grid-cols-12 items-center gap-2 text-[11px] px-1.5 py-0.5 rounded cursor-pointer transition-colors {active ? 'bg-blue-50 ring-1 ring-blue-200' : 'hover:bg-slate-50'}"
          >
            <span class="col-span-5 text-left truncate font-medium {active ? 'text-blue-800 font-bold' : 'text-slate-700'}">{b.short}</span>
            <div class="col-span-6 h-2 bg-slate-100 rounded-full overflow-hidden">
              <div class="h-full rounded-full {active ? 'bg-blue-600' : 'bg-blue-500/80'}" style="width: {(b.count / maxDomainOpen) * 100}%"></div>
            </div>
            <span class="col-span-1 text-right font-mono font-bold text-slate-900">{b.count}</span>
          </button>
        {/each}
      </div>
    </div>

    <!-- Col 3 (4 cols): Top 5 Sites Not Ready / Key Insights Tabbed Card -->
    <div class="lg:col-span-4 bg-white rounded-xl border border-slate-200/80 p-3 shadow-xs flex flex-col">
      <div class="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
        <div class="inline-flex rounded-lg bg-slate-100 p-0.5 text-[10px] font-semibold">
          <button
            type="button"
            on:click={() => (rightCardTab = 'sites')}
            class="px-2 py-0.5 rounded-md cursor-pointer {rightCardTab === 'sites' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'}"
          >Top 5 Sites Not Ready</button>
          <button
            type="button"
            on:click={() => (rightCardTab = 'insights')}
            class="px-2 py-0.5 rounded-md cursor-pointer {rightCardTab === 'insights' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'}"
          >Key Insights (3)</button>
        </div>
        {#if siteFilters.length > 0 && rightCardTab === 'sites'}
          <button
            type="button"
            on:click={() => { siteFilters = []; currentPage = 1; }}
            class="text-[10px] font-semibold text-blue-600 hover:underline cursor-pointer"
          >Clear</button>
        {/if}
      </div>

      {#if rightCardTab === 'sites'}
        <div class="space-y-1.5 flex-1">
          {#each topSitesNotReady as r}
            {@const active = siteFilters.includes(r.siteId)}
            <button
              type="button"
              on:click={() => { siteFilters = toggleArrayItem(siteFilters, r.siteId); currentPage = 1; }}
              class="w-full flex items-center justify-between p-1.5 rounded-lg border text-xs cursor-pointer transition-all {active ? 'bg-blue-50/70 border-blue-300 ring-1 ring-blue-100' : 'bg-slate-50/60 border-slate-100 hover:bg-slate-100/70'}"
            >
              <div class="text-left">
                <span class="font-mono font-bold text-blue-700">Site {r.siteId}</span>
                <span class="text-[11px] text-slate-500 ml-1">{r.country}</span>
              </div>
              <div class="flex items-center gap-2 text-[11px]">
                <span class="text-slate-600">{r.notReady}/{r.total} not ready</span>
                <span class="font-bold {r.pct >= 45 ? 'text-rose-600' : 'text-amber-600'}">{r.pct}%</span>
              </div>
            </button>
          {/each}
        </div>
      {:else}
        <ol class="space-y-2 text-[11px] text-slate-700 flex-1 flex flex-col justify-center">
          <li class="flex items-start gap-2 rounded-lg bg-slate-50/80 border border-slate-100 px-2.5 py-1.5">
            <span class="w-4 h-4 rounded-full bg-blue-50 text-blue-700 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">1</span>
            <span>10 subjects are hard blocked, led by external data reconciliation and SAE discrepancies.</span>
          </li>
          <li class="flex items-start gap-2 rounded-lg bg-slate-50/80 border border-slate-100 px-2.5 py-1.5">
            <span class="w-4 h-4 rounded-full bg-blue-50 text-blue-700 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">2</span>
            <span>Sites 317 (DE) and 405 (KR) account for the highest concentration of non-ready subjects.</span>
          </li>
          <li class="flex items-start gap-2 rounded-lg bg-slate-50/80 border border-slate-100 px-2.5 py-1.5">
            <span class="w-4 h-4 rounded-full bg-blue-50 text-blue-700 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">3</span>
            <span>At current closure velocity, all subjects are forecast ready by 18 Dec 2026 (3d before predicted DBL).</span>
          </li>
        </ol>
      {/if}
    </div>
  </div>

  <!-- 2-Column Row: Subjects by Status Over Time & Subjects by Country -->
  <div class="grid grid-cols-1 lg:grid-cols-12 gap-3">
    <!-- Left 6 cols: Subjects by Status Over Time -->
    <div class="lg:col-span-6 bg-white rounded-xl border border-slate-200/80 p-3 shadow-xs flex flex-col">
      <div class="flex flex-wrap items-center justify-between gap-2 pb-2 mb-2 border-b border-slate-100">
        <div>
          <h3 class="text-xs font-bold text-slate-900">Subjects by Status Over Time</h3>
          <p class="text-[10px] text-slate-500">Progression from D-60 through Current to Target DBL (n=220)</p>
        </div>
        <div class="flex flex-wrap items-center gap-2 text-[10px] font-semibold">
          <span class="inline-flex items-center gap-1 text-emerald-700"><span class="w-2 h-2 rounded-full bg-emerald-500"></span>Lock Ready</span>
          <span class="inline-flex items-center gap-1 text-blue-700"><span class="w-2 h-2 rounded-full bg-blue-500"></span>Conditional</span>
          <span class="inline-flex items-center gap-1 text-amber-700"><span class="w-2 h-2 rounded-full bg-amber-500"></span>Action Req</span>
          <span class="inline-flex items-center gap-1 text-rose-700"><span class="w-2 h-2 rounded-full bg-rose-500"></span>Hard Blocked</span>
        </div>
      </div>

      <div class="relative h-[165px]" role="presentation" on:mouseleave={() => (hoveredTimeIdx = null)}>
        <svg viewBox="0 0 460 150" class="w-full h-full overflow-visible">
          {#each [0, 55, 110, 165, 220] as tick}
            {@const gy = 126 - (tick / 220) * 112}
            <line x1="34" y1={gy} x2="446" y2={gy} stroke="#f1f5f9" stroke-width="1" />
            <text x="28" y={gy + 3} text-anchor="end" font-size="8" fill="#94a3b8">{tick}</text>
          {/each}

          <!-- Lock Ready Line -->
          <polyline
            fill="none"
            stroke="#10b981"
            stroke-width="2.25"
            points={STATUS_OVER_TIME.map((p, i) => `${46 + i * 64},${126 - (p.lockReady / 220) * 112}`).join(' ')}
          />
          <!-- Conditional Line -->
          <polyline
            fill="none"
            stroke="#3b82f6"
            stroke-width="1.75"
            points={STATUS_OVER_TIME.map((p, i) => `${46 + i * 64},${126 - (p.conditional / 220) * 112}`).join(' ')}
          />
          <!-- Action Required Line -->
          <polyline
            fill="none"
            stroke="#f59e0b"
            stroke-width="1.75"
            points={STATUS_OVER_TIME.map((p, i) => `${46 + i * 64},${126 - (p.actionReq / 220) * 112}`).join(' ')}
          />
          <!-- Hard Blocked Line -->
          <polyline
            fill="none"
            stroke="#f43f5e"
            stroke-width="2"
            points={STATUS_OVER_TIME.map((p, i) => `${46 + i * 64},${126 - (p.hardBlocked / 220) * 112}`).join(' ')}
          />

          {#each STATUS_OVER_TIME as pt, i}
            {@const x = 46 + i * 64}
            <line x1={x} y1="14" x2={x} y2="126" stroke={hoveredTimeIdx === i ? '#cbd5e1' : 'transparent'} stroke-dasharray="3 2" />
            <circle cx={x} cy={126 - (pt.lockReady / 220) * 112} r={hoveredTimeIdx === i ? 4.5 : 3} fill="#10b981" stroke="#fff" stroke-width="1" />
            <circle cx={x} cy={126 - (pt.hardBlocked / 220) * 112} r={hoveredTimeIdx === i ? 4.5 : 3} fill="#f43f5e" stroke="#fff" stroke-width="1" />
            <text x={x} y="142" text-anchor="middle" font-size="8.5" font-weight={pt.label === 'Current' ? '700' : '500'} fill={pt.label === 'Current' ? '#0f172a' : '#64748b'}>{pt.label}</text>
            <rect
              x={x - 28}
              y="10"
              width="56"
              height="120"
              fill="transparent"
              role="presentation"
              class="cursor-pointer"
              on:mouseenter={() => (hoveredTimeIdx = i)}
            />
          {/each}
        </svg>

        {#if hoveredTimeIdx !== null && STATUS_OVER_TIME[hoveredTimeIdx]}
          {@const pt = STATUS_OVER_TIME[hoveredTimeIdx]}
          <div class="absolute top-1 right-1 bg-slate-900/95 text-white rounded-lg px-2.5 py-1.5 text-[10px] shadow-md pointer-events-none space-y-0.5">
            <div class="font-bold text-slate-200">{pt.label}</div>
            <div class="text-emerald-300">Lock Ready: <strong>{pt.lockReady}</strong></div>
            <div class="text-blue-300">Conditional: <strong>{pt.conditional}</strong></div>
            <div class="text-amber-300">Action Req: <strong>{pt.actionReq}</strong></div>
            <div class="text-rose-300">Hard Blocked: <strong>{pt.hardBlocked}</strong></div>
          </div>
        {/if}
      </div>
    </div>

    <!-- Right 6 cols: Subjects by Country (Stacked Interactive Bars) -->
    <div class="lg:col-span-6 bg-white rounded-xl border border-slate-200/80 p-3 shadow-xs flex flex-col">
      <div class="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
        <div>
          <h3 class="text-xs font-bold text-slate-900">Subjects by Country</h3>
          <p class="text-[10px] text-slate-500">Click any country bar to multi-filter the subject table</p>
        </div>
        {#if countryFilters.length > 0}
          <button type="button" on:click={() => { countryFilters = []; currentPage = 1; }} class="text-[10px] font-semibold text-blue-600 hover:underline cursor-pointer">Clear</button>
        {/if}
      </div>

      <div class="space-y-1.5 flex-1 flex flex-col justify-center">
        {#each V3_COUNTRY_SUMMARY as c}
          {@const subjs = V3_SUBJECT_ROWS.filter((s) => s.country === c.country)}
          {@const total = Math.max(1, subjs.length)}
          {@const lr = subjs.filter((s) => s.classification === 'Lock Ready').length}
          {@const cr = subjs.filter((s) => s.classification === 'Conditionally Ready').length}
          {@const ar = subjs.filter((s) => s.classification === 'Action Required').length}
          {@const hb = subjs.filter((s) => s.classification === 'Hard Blocked').length}
          {@const isSelected = countryFilters.includes(c.country)}
          <button
            type="button"
            on:click={() => { countryFilters = toggleArrayItem(countryFilters, c.country); currentPage = 1; }}
            class="w-full grid grid-cols-12 items-center gap-2 text-[11px] px-2 py-1 rounded-lg border transition-all cursor-pointer {isSelected ? 'border-blue-500 bg-blue-50/50 ring-1 ring-blue-200' : 'border-transparent hover:bg-slate-50'}"
          >
            <span class="col-span-4 text-left font-semibold text-slate-800 truncate">{c.flag} {c.country}</span>
            <div class="col-span-6 h-2.5 rounded-full bg-slate-100 overflow-hidden flex">
              <div class="bg-emerald-500 h-full" style="width:{(lr / total) * 100}%" title="Lock Ready: {lr}"></div>
              <div class="bg-blue-500 h-full" style="width:{(cr / total) * 100}%" title="Conditional: {cr}"></div>
              <div class="bg-amber-500 h-full" style="width:{(ar / total) * 100}%" title="Action Required: {ar}"></div>
              <div class="bg-rose-500 h-full" style="width:{(hb / total) * 100}%" title="Hard Blocked: {hb}"></div>
            </div>
            <span class="col-span-2 text-right font-mono font-bold text-slate-700">{subjs.length} <span class="text-[10px] font-normal text-rose-600">({ar + hb})</span></span>
          </button>
        {/each}
      </div>
    </div>
  </div>

  <!-- Full-Width Subject Directory & 8-Domain Tracker -->
  <div class="bg-white rounded-xl border border-slate-200/80 p-3 shadow-xs space-y-2.5">
    <!-- Sub-tabs & Page Size -->
    <div class="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-100">
      <div class="flex items-center gap-4 text-xs font-semibold">
        <button
          type="button"
          on:click={() => (activeTableTab = 'readiness')}
          class="pb-1 border-b-2 cursor-pointer inline-flex items-center gap-1.5 transition-colors {activeTableTab === 'readiness' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'}"
        >
          <span>Subject Readiness</span>
          <span class="px-1.5 py-0.5 rounded-full text-[10px] font-bold {activeTableTab === 'readiness' ? 'bg-blue-50 text-blue-700' : 'bg-slate-100 text-slate-600'}">{filteredSubjects.length}</span>
        </button>
        <button
          type="button"
          on:click={() => (activeTableTab = 'domain_tracker')}
          class="pb-1 border-b-2 cursor-pointer inline-flex items-center gap-1.5 transition-colors {activeTableTab === 'domain_tracker' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'}"
        >
          <span>8-Domain Subject Tracker</span>
          <span class="px-1.5 py-0.5 rounded-full text-[10px] font-bold {activeTableTab === 'domain_tracker' ? 'bg-blue-50 text-blue-700' : 'bg-slate-100 text-slate-600'}">8 domains</span>
        </button>
      </div>

      <div class="flex items-center gap-2 text-[11px] text-slate-500">
        <span class="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-lg border border-slate-200/80 bg-slate-50 text-[10px]">
          <ArrowUpDown size={10} class="text-slate-400" /> Click column to sort · Click row for Subject Drawer
        </span>
        <select bind:value={pageSize} on:change={() => (currentPage = 1)} class="border border-slate-200 rounded-lg px-2 py-1 bg-white text-xs text-slate-700 cursor-pointer">
          <option value={10}>10 / page</option>
          <option value={25}>25 / page</option>
          <option value={50}>50 / page</option>
          <option value={220}>All (220)</option>
        </select>
      </div>
    </div>

    <!-- Polished Multi-Select Filter Bar -->
    <div class="rounded-xl bg-slate-50/90 border border-slate-200/80 p-2.5 space-y-2">
      <!-- Row 1: Classification Multi-Select Pills + Cohort Toggles -->
      <div class="flex flex-wrap items-center justify-between gap-2">
        <div class="flex flex-wrap items-center gap-1.5">
          <span class="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 mr-1">
            <Filter size={11} /> Classification
          </span>
          <button
            type="button"
            on:click={() => { classificationFilters = []; currentPage = 1; }}
            class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-all cursor-pointer {classificationFilters.length === 0 ? 'bg-slate-900 text-white border-slate-900 shadow-2xs' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'}"
          >
            <span>All</span>
            <span class="px-1 rounded-full text-[10px] font-bold {classificationFilters.length === 0 ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'}">{V3_SUBJECT_ROWS.length}</span>
          </button>
          {#each subjectDonut as seg}
            {@const active = classificationFilters.includes(seg.label)}
            <button
              type="button"
              on:click={() => { classificationFilters = toggleArrayItem(classificationFilters, seg.label); currentPage = 1; }}
              class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-all cursor-pointer {active ? 'bg-slate-900 text-white border-slate-900 shadow-2xs' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'}"
            >
              <span class="w-1.5 h-1.5 rounded-full" style="background:{seg.color}"></span>
              <span>{seg.label}</span>
              <span class="px-1 rounded-full text-[10px] font-bold {active ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'}">{seg.count}</span>
            </button>
          {/each}
        </div>

        <div class="flex flex-wrap items-center gap-1.5">
          {#each [
            { id: 'lock_pop', label: 'Lock Pop' },
            { id: 'endpoint', label: 'Endpoint-Critical' },
            { id: 'sae', label: 'SAE Subjects' },
          ] as qf}
            {@const active = quickCohorts.includes(qf.id)}
            <button
              type="button"
              on:click={() => { quickCohorts = toggleArrayItem(quickCohorts, qf.id); currentPage = 1; }}
              class="px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-all cursor-pointer {active ? 'bg-blue-600 text-white border-blue-600 shadow-2xs' : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300'}"
            >
              {qf.label}
            </button>
          {/each}
        </div>
      </div>

      <!-- Row 2: Search + Multi-Select Dropdowns -->
      <div class="flex flex-wrap items-center gap-2">
        <div class="relative flex-1 min-w-[200px]">
          <Search size={13} class="absolute left-2.5 top-2 text-slate-400" />
          <input
            type="text"
            bind:value={searchQuery}
            on:input={() => (currentPage = 1)}
            placeholder="Search subject ID, site, country, owner, or open item..."
            class="w-full pl-8 pr-7 py-1.5 text-xs border border-slate-200 rounded-lg bg-white focus:outline-hidden focus:border-blue-500"
          />
          {#if searchQuery}
            <button
              type="button"
              on:click={() => { searchQuery = ''; currentPage = 1; }}
              class="absolute right-2 top-2 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X size={13} />
            </button>
          {/if}
        </div>

        <MultiSelectFilter
          label="Countries"
          options={V3_COUNTRY_SUMMARY.map((c) => ({ value: c.country, label: `${c.flag} ${c.country}` }))}
          selected={countryFilters}
          onChange={(next) => { countryFilters = next; currentPage = 1; }}
        />

        <MultiSelectFilter
          label="Sites"
          options={V3_SITES.map((st) => ({ value: st.id, label: `Site ${st.id} (${st.country})` }))}
          selected={siteFilters}
          onChange={(next) => { siteFilters = next; currentPage = 1; }}
        />

        <MultiSelectFilter
          label="Status"
          options={[
            { value: 'Completed', label: 'Completed', dotColor: '#10b981' },
            { value: 'Ongoing', label: 'Ongoing', dotColor: '#3b82f6' },
            { value: 'Discontinued', label: 'Discontinued', dotColor: '#f43f5e' },
          ]}
          selected={subjectStatusFilters}
          onChange={(next) => { subjectStatusFilters = next; currentPage = 1; }}
        />

        <MultiSelectFilter
          label="Criticality"
          options={[
            { value: 'Critical', label: 'Critical', dotColor: '#f43f5e' },
            { value: 'High', label: 'High', dotColor: '#f59e0b' },
            { value: 'Medium', label: 'Medium', dotColor: '#3b82f6' },
            { value: 'Low', label: 'Low', dotColor: '#94a3b8' },
          ]}
          selected={criticalityFilters}
          onChange={(next) => { criticalityFilters = next; currentPage = 1; }}
        />

        <MultiSelectFilter
          label="Open Domains"
          options={DOMAIN_COLUMNS.map((d) => ({ value: d.match, label: d.short }))}
          selected={domainOpenFilters}
          onChange={(next) => { domainOpenFilters = next; currentPage = 1; }}
        />
      </div>
    </div>

    {#if activeTableTab === 'readiness'}
      <div class="rounded-lg border border-slate-200/80 overflow-x-auto">
        <table class="w-full text-xs">
          <thead class="bg-slate-50 border-b border-slate-200 text-[10px] font-bold uppercase tracking-wider text-slate-500">
            <tr>
              {#each [
                { col: 'id', label: 'Subject ID', align: 'text-left' },
                { col: 'country', label: 'Country', align: 'text-left' },
                { col: 'siteId', label: 'Site', align: 'text-left' },
                { col: 'status', label: 'Status', align: 'text-left' },
                { col: 'readiness', label: 'Readiness', align: 'text-left' },
                { col: 'classification', label: 'Classification', align: 'text-left' },
                { col: 'criticality', label: 'Criticality', align: 'text-left' },
                { col: 'daysOpen', label: 'Days Open', align: 'text-right' },
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
              <th class="px-3 py-2 text-left">Key Open Items</th>
              <th class="px-3 py-2 text-right">Action</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            {#each pagedSubjects as s, idx}
              <tr
                class="hover:bg-blue-50/40 cursor-pointer transition-colors"
                on:click={() => onSelectSubject(s.id)}
              >
                <td class="px-3 py-2 font-mono font-bold text-blue-700">{s.id}</td>
                <td class="px-3 py-2 text-slate-600">{s.country}</td>
                <td class="px-3 py-2 font-mono text-slate-600">{s.siteId}</td>
                <td class="px-3 py-2 text-slate-600">{s.status}</td>
                <td class="px-3 py-2">
                  <div class="flex items-center gap-2">
                    <span class="font-mono font-bold text-slate-900 w-8">{s.readiness}%</span>
                    <div class="w-14 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                      <div class="h-full rounded-full {barColor(s.readiness)}" style="width:{s.readiness}%"></div>
                    </div>
                  </div>
                </td>
                <td class="px-3 py-2">
                  <span class="px-2 py-0.5 rounded-full text-[10px] font-bold border {classBadge(s.classification)}">
                    {s.classification}
                  </span>
                </td>
                <td class="px-3 py-2">
                  <span class="font-semibold {s.criticality === 'Critical' ? 'text-rose-600' : s.criticality === 'High' ? 'text-amber-600' : 'text-slate-600'}">
                    {s.criticality}
                  </span>
                </td>
                <td class="px-3 py-2 text-right font-mono text-slate-700">{s.daysOpen}d</td>
                <td class="px-3 py-2 text-slate-600 max-w-[220px] truncate">{s.keyOpenItems}</td>
                <td class="px-3 py-2 text-right">
                  <span class="inline-flex items-center gap-0.5 text-blue-600 font-semibold">
                    View <ChevronRight size={13} />
                  </span>
                </td>
              </tr>
            {:else}
              <tr>
                <td colspan="10" class="py-8 text-center text-xs text-slate-400">
                  No subjects match the current filters.
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    {:else}
      <!-- 8-Domain Subject Tracker Matrix -->
      <div class="rounded-lg border border-slate-200/80 overflow-x-auto">
        <table class="w-full text-xs">
          <thead class="bg-slate-50 border-b border-slate-200 text-[10px] font-bold uppercase tracking-wider text-slate-500">
            <tr>
              <th class="px-3 py-2 text-left sticky left-0 bg-slate-50 z-10">Subject ID</th>
              <th class="px-2.5 py-2 text-center">Site</th>
              <th class="px-2.5 py-2 text-center">Overall</th>
              {#each DOMAIN_COLUMNS as col}
                <th class="px-2 py-2 text-center whitespace-nowrap">{col.short}</th>
              {/each}
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            {#each pagedSubjects as subj, idx}
              <tr
                on:click={() => onSelectSubject(subj.id)}
                class="hover:bg-blue-50/40 cursor-pointer transition-colors"
              >
                <td class="px-3 py-2 sticky left-0 bg-white z-10 border-r border-slate-100">
                  <div class="font-mono font-bold text-blue-700">{subj.id}</div>
                  <div class="text-[10px] text-slate-500">{subj.classification}</div>
                </td>
                <td class="px-2.5 py-2 text-center font-mono text-slate-600">{subj.siteId}</td>
                <td class="px-2.5 py-2 text-center font-mono font-bold text-slate-900">{subj.readiness}%</td>
                {#each DOMAIN_COLUMNS as col}
                  {@const dom = subj.domainBreakdown.find((d) => d.domain === col.match)}
                  <td class="px-2 py-2 text-center" title={dom ? `${dom.domain}: ${dom.details} (${dom.completion}%)` : ''}>
                    {#if dom}
                      {#if dom.status === 'Complete'}
                        <span class="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-bold">
                          ✓ {dom.completion}%
                        </span>
                      {:else if dom.completion < 60}
                        <span class="inline-flex items-center px-1.5 py-0.5 rounded-md bg-rose-50 border border-rose-200 text-rose-700 text-[10px] font-bold">
                          {dom.completion}%
                        </span>
                      {:else}
                        <span class="inline-flex items-center px-1.5 py-0.5 rounded-md bg-amber-50 border border-amber-200 text-amber-700 text-[10px] font-bold">
                          {dom.completion}%
                        </span>
                      {/if}
                    {:else}
                      <span class="text-slate-300">—</span>
                    {/if}
                  </td>
                {/each}
              </tr>
            {:else}
              <tr>
                <td colspan="11" class="py-8 text-center text-xs text-slate-400">
                  No subjects match the current filters.
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    {/if}

    <!-- Pagination -->
    <div class="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs">
      <span class="text-slate-500">
        Showing {filteredSubjects.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, filteredSubjects.length)} of {filteredSubjects.length} subjects · Page {currentPage} of {totalPages}
      </span>
      <div class="flex items-center gap-1.5">
        <button
          type="button"
          disabled={currentPage <= 1}
          on:click={() => (currentPage = Math.max(1, currentPage - 1))}
          class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-200 text-slate-700 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed hover:bg-slate-50"
        >
          <ChevronLeft size={13} /> Prev
        </button>
        {#each visiblePageNumbers as p}
          <button
            type="button"
            on:click={() => (currentPage = p)}
            class="px-2.5 py-1 rounded-lg border text-xs font-semibold cursor-pointer {currentPage === p ? 'bg-blue-600 text-white border-blue-600' : 'border-slate-200 text-slate-700 hover:bg-slate-50'}"
          >
            {p}
          </button>
        {/each}
        <button
          type="button"
          disabled={currentPage >= totalPages}
          on:click={() => (currentPage = Math.min(totalPages, currentPage + 1))}
          class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-200 text-slate-700 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed hover:bg-slate-50"
        >
          Next <ChevronRight size={13} />
        </button>
      </div>
    </div>
  </div>
</div>

{#if drawerSubjectIndex !== null && filteredSubjects[drawerSubjectIndex]}
  <SubjectDrawerV3
    subject={filteredSubjects[drawerSubjectIndex]}
    subjectIndex={drawerSubjectIndex}
    totalSubjects={filteredSubjects.length}
    onClose={() => (drawerSubjectIndex = null)}
    onPrev={() => (drawerSubjectIndex = drawerSubjectIndex !== null && drawerSubjectIndex > 0 ? drawerSubjectIndex - 1 : filteredSubjects.length - 1)}
    onNext={() => (drawerSubjectIndex = drawerSubjectIndex !== null && drawerSubjectIndex < filteredSubjects.length - 1 ? drawerSubjectIndex + 1 : 0)}
    onOpenActions={() => { drawerSubjectIndex = null; onSelectTab('actions_sim'); }}
  />
{/if}
