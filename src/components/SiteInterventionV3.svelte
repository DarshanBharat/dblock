<script lang="ts">
  import {
    ArrowLeft,
    AlertTriangle,
    CheckCircle2,
    Clock,
    SlidersHorizontal,
    Search,
    X,
    RotateCcw,
    ArrowUpDown,
    ArrowUp,
    ArrowDown,
    Activity,
    Users,
    ShieldAlert,
    Calendar,
    Sparkles,
    ChevronRight,
  } from '@lucide/svelte';
  import {
    V3_STUDY_META,
    V3_SITES,
    V3_SUBJECT_ROWS,
    V3_ACTIONS,
    V3_DOMAINS,
    countryFlag,
    type V3SubjectRow,
  } from '../data/v3Data';
  import SubjectDrawerV3 from './SubjectDrawerV3.svelte';
  import MultiSelectFilter from './MultiSelectFilter.svelte';

  export let siteId: string;
  export let onBackToSites: () => void;
  export let onSelectTab: (tab: any) => void;
  export let onSelectSubject: (subjectId: string) => void = () => {};

  $: site = V3_SITES.find((s) => s.id === siteId) || V3_SITES[0];

  // Site subjects (fallback to deterministic subset if a site has fewer rows in mock data)
  $: rawSiteSubjects = V3_SUBJECT_ROWS.filter((r) => r.siteId === site.id);
  $: siteSubjects =
    rawSiteSubjects.length > 0
      ? rawSiteSubjects
      : V3_SUBJECT_ROWS.slice(0, 6).map((r, idx) => ({
          ...r,
          id: `${site.id}-${String(idx + 1).padStart(3, '0')}`,
          siteId: site.id,
          country: site.country,
        }));

  $: siteActions = V3_ACTIONS.filter((a) => a.siteId === site.id);

  // Interactive What-If recovery levers
  let whatIfSelected: string[] = [];
  const WHAT_IF_LEVERS = [
    { id: 'blocker', label: 'Clear top critical query backlog', gain: 7, daysSaved: 4 },
    { id: 'cra_sprint', label: 'Deploy 5-day remote SDV sprint', gain: 6, daysSaved: 3 },
    { id: 'vendor_sync', label: 'Expedite lab & safety reconciliation', gain: 4, daysSaved: 2 },
  ];

  function toggleWhatIf(id: string) {
    whatIfSelected = whatIfSelected.includes(id)
      ? whatIfSelected.filter((x) => x !== id)
      : [...whatIfSelected, id];
  }

  $: whatIfGain = WHAT_IF_LEVERS.filter((l) => whatIfSelected.includes(l.id)).reduce(
    (acc, l) => acc + l.gain,
    0
  );
  $: whatIfDaysSaved = WHAT_IF_LEVERS.filter((l) => whatIfSelected.includes(l.id)).reduce(
    (acc, l) => acc + l.daysSaved,
    0
  );
  $: projectedReadiness = Math.min(99, site.readiness + whatIfGain);
  $: baseDelayDays = site.dblImpactDays;
  $: netDelayDays = Math.max(0, baseDelayDays - whatIfDaysSaved);

  // Trajectory chart points
  let hoveredWeekIdx: number | null = null;
  $: trajectoryPoints = (() => {
    const cur = site.readiness;
    const base = Math.max(28, cur - 22);
    const weeks = ['W-4', 'W-3', 'W-2', 'W-1', 'Current', 'W+1', 'DBL'];
    return weeks.map((label, i) => {
      const expected = Math.round(45 + (i / 6) * 45);
      const actual = i <= 4 ? Math.round(base + (i / 4) * (cur - base)) : null;
      const forecastBase = Math.min(96, Math.round(cur + ((i - 4) / 2) * Math.max(6, (88 - cur) * 0.65)));
      const forecast = i >= 4 ? (i === 4 ? cur : forecastBase) : null;
      const simulated =
        i >= 4
          ? i === 4
            ? cur
            : Math.min(99, forecastBase + Math.round((whatIfGain * (i - 4)) / 2))
          : null;
      return { label, expected, actual, forecast, simulated };
    });
  })();

  // Site Domain Breakdown (all 8 canonical domains)
  $: domainBreakdown = V3_DOMAINS.map((dom) => {
    const entries = siteSubjects
      .map((s) => s.domainBreakdown.find((d) => d.domain === dom.name))
      .filter((d): d is NonNullable<typeof d> => Boolean(d));
    const pct = entries.length
      ? Math.round(entries.reduce((acc, d) => acc + d.completion, 0) / entries.length)
      : site.readiness;
    const open = entries.filter((d) => d.status === 'Action Required').length;
    return { name: dom.name, pct, open };
  });

  // Subject table tabs, filters & sorting
  let rightPanelTab: 'risks' | 'actions' = 'risks';
  let patientTab: 'readiness' | 'domain_tracker' = 'readiness';
  const DOMAIN_COLUMNS = [
    { match: 'EDC Data Cleaning', short: 'EDC Data Cleaning' },
    { match: 'Query Resolution', short: 'Query Resolution' },
    { match: 'External Data Reconciliation', short: 'External Data Reconciliation' },
    { match: 'Safety Reconciliation', short: 'Safety Reconciliation' },
    { match: 'Medical Coding', short: 'Medical Coding' },
    { match: 'PI Signatures', short: 'PI Signatures' },
    { match: 'Protocol Deviations', short: 'Protocol Deviations' },
    { match: 'SDV / SDR', short: 'SDV / SDR' },
  ];
  let subjectSearch = '';
  let classificationFilters: string[] = [];
  let domainStatusFilters: string[] = [];
  type SubjSortCol = 'id' | 'classification' | 'readiness' | 'daysOpen' | 'owner' | 'status';
  let subjSortCol: SubjSortCol = 'readiness';
  let subjSortDir: 'asc' | 'desc' = 'asc';

  function toggleSubjSort(col: SubjSortCol) {
    if (subjSortCol === col) {
      subjSortDir = subjSortDir === 'asc' ? 'desc' : 'asc';
    } else {
      subjSortCol = col;
      subjSortDir = col === 'daysOpen' ? 'desc' : 'asc';
    }
  }

  function resetSubjectFilters() {
    subjectSearch = '';
    classificationFilters = [];
    domainStatusFilters = [];
  }

  function getSubjectRiskStatus(subj: V3SubjectRow): string {
    if (subj.classification === 'Hard Blocked') return 'High risk';
    if (subj.classification === 'Action Required') return 'At risk';
    return 'On track';
  }

  $: filteredSubjects = siteSubjects
    .filter((subj) => {
      const q = subjectSearch.trim().toLowerCase();
      const matchesSearch =
        !q ||
        subj.id.toLowerCase().includes(q) ||
        subj.owner.toLowerCase().includes(q) ||
        subj.classification.toLowerCase().includes(q) ||
        subj.keyOpenItems.toLowerCase().includes(q);
      const matchesClass =
        classificationFilters.length === 0 || classificationFilters.includes(subj.classification);
      const st = getSubjectRiskStatus(subj);
      const matchesStatus = domainStatusFilters.length === 0 || domainStatusFilters.includes(st);
      return matchesSearch && matchesClass && matchesStatus;
    })
    .sort((a, b) => {
      const dir = subjSortDir === 'asc' ? 1 : -1;
      let cmp = 0;
      switch (subjSortCol) {
        case 'id':
          cmp = a.id.localeCompare(b.id);
          break;
        case 'classification':
          cmp = a.classification.localeCompare(b.classification);
          break;
        case 'daysOpen':
          cmp = a.daysOpen - b.daysOpen;
          break;
        case 'owner':
          cmp = a.owner.localeCompare(b.owner);
          break;
        case 'status':
          cmp = getSubjectRiskStatus(a).localeCompare(getSubjectRiskStatus(b));
          break;
        case 'readiness':
        default:
          cmp = a.readiness - b.readiness;
          break;
      }
      return cmp * dir;
    });

  // Subject drawer state
  let selectedSubjectIdx: number | null = null;
  $: activeDrawerSubject =
    selectedSubjectIdx !== null && filteredSubjects[selectedSubjectIdx]
      ? filteredSubjects[selectedSubjectIdx]
      : null;

  function statusBadgeClass(status: string) {
    if (status === 'High risk') return 'bg-rose-50 text-rose-700 border-rose-200';
    if (status === 'At risk') return 'bg-amber-50 text-amber-700 border-amber-200';
    return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  }

  function classBadgeClass(cls: string) {
    if (cls === 'Hard Blocked') return 'bg-rose-50 text-rose-700 border-rose-200';
    if (cls === 'Action Required') return 'bg-amber-50 text-amber-700 border-amber-200';
    if (cls === 'Conditionally Ready') return 'bg-blue-50 text-blue-700 border-blue-200';
    return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  }

  function barColor(pct: number) {
    if (pct >= 85) return 'bg-emerald-500';
    if (pct >= 70) return 'bg-blue-500';
    if (pct >= 55) return 'bg-amber-500';
    return 'bg-rose-500';
  }
</script>

<div class="space-y-3">
  <!-- Sticky Compact Executive Header -->
  <div class="sticky top-0 z-20 -mx-1 px-1 py-1.5 bg-slate-50/95 backdrop-blur-xs border-b border-slate-200/70 flex flex-wrap items-center justify-between gap-2">
    <div class="flex items-center gap-2.5 min-w-0">
      <button
        type="button"
        on:click={onBackToSites}
        class="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 cursor-pointer transition-colors shrink-0"
      >
        <ArrowLeft size={13} /> Sites
      </button>
      <div class="min-w-0">
        <div class="flex items-center gap-2 flex-wrap">
          <h2 class="text-sm font-bold text-slate-900 tracking-tight">Site {site.id} · {site.name}</h2>
          <span class="px-2 py-0.5 rounded-full border text-[10px] font-bold {statusBadgeClass(site.riskLevel)}">{site.riskLevel}</span>
          <span class="px-1.5 py-0.5 rounded bg-slate-200/70 text-[10px] font-semibold text-slate-700">{countryFlag(site.country)} {site.country}</span>
        </div>
        <p class="text-[11px] text-slate-500 truncate">
          PI: <span class="font-medium text-slate-700">{site.piName}</span> · Target Freeze: <span class="font-medium text-slate-700">{site.plannedFreezeDate}</span> · {site.enrolled} Subjects Enrolled
        </p>
      </div>
    </div>

    <div class="flex items-center gap-2">
      <button
        type="button"
        on:click={() => onSelectTab('domains')}
        class="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 cursor-pointer transition-colors"
      >
        Domain Drilldown
      </button>
      <button
        type="button"
        on:click={() => onSelectTab('actions_sim')}
        class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs cursor-pointer transition-colors"
      >
        <SlidersHorizontal size={12} /> Simulate Recovery
      </button>
    </div>
  </div>

  <!-- 5 Executive KPI Cards -->
  <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
    <div class="bg-white rounded-xl border border-slate-200/80 p-3 shadow-xs">
      <div class="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400">
        <span>Site Readiness</span>
        <Activity size={13} class="text-blue-600" />
      </div>
      <div class="mt-1 flex items-baseline gap-2">
        <span class="text-xl font-extrabold text-slate-900">{projectedReadiness}%</span>
        {#if whatIfGain > 0}
          <span class="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 text-[10px] font-bold">+{whatIfGain}% sim</span>
        {:else}
          <span class="text-[10px] font-semibold {site.readiness >= 85 ? 'text-emerald-600' : 'text-amber-600'}">Goal: {site.expectedReadiness}%</span>
        {/if}
      </div>
      <div class="mt-1.5 h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
        <div class="h-full rounded-full {barColor(projectedReadiness)} transition-all duration-200" style="width:{projectedReadiness}%"></div>
      </div>
    </div>

    <div class="bg-white rounded-xl border border-slate-200/80 p-3 shadow-xs">
      <div class="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400">
        <span>Subjects</span>
        <Users size={13} class="text-indigo-500" />
      </div>
      <div class="mt-1 flex items-baseline gap-1.5">
        <span class="text-xl font-extrabold text-slate-900">{site.enrolled}</span>
        <span class="text-[10px] text-slate-500">enrolled</span>
      </div>
      <div class="mt-1 text-[10px] text-slate-500">
        {site.completed} completed · {site.criticalSubjects} critical
      </div>
    </div>

    <div class="bg-white rounded-xl border border-slate-200/80 p-3 shadow-xs">
      <div class="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400">
        <span>Hard Gate Blockers</span>
        <ShieldAlert size={13} class="text-rose-500" />
      </div>
      <div class="mt-1 flex items-baseline gap-1.5">
        <span class="text-xl font-extrabold text-slate-900">{site.hardGateBlockers}</span>
        <span class="text-[10px] font-bold text-rose-600">{siteActions.length} actions</span>
      </div>
      <div class="mt-1 text-[10px] text-slate-500">7d trend: {site.trend7d >= 0 ? `+${site.trend7d}%` : `${site.trend7d}%`}</div>
    </div>

    <div class="bg-white rounded-xl border border-slate-200/80 p-3 shadow-xs">
      <div class="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400">
        <span>DBL Delay Risk</span>
        <Calendar size={13} class="text-amber-500" />
      </div>
      <div class="mt-1 flex items-baseline gap-1.5">
        <span class="text-xl font-extrabold {netDelayDays === 0 ? 'text-emerald-600' : 'text-rose-600'}">
          {netDelayDays === 0 ? 'On Time' : `+${netDelayDays}d`}
        </span>
        {#if whatIfDaysSaved > 0}
          <span class="text-[10px] font-bold text-emerald-600">(-{whatIfDaysSaved}d saved)</span>
        {/if}
      </div>
      <div class="mt-1 text-[10px] text-slate-500">Est Ready: {site.estReadyDate}</div>
    </div>

    <div class="bg-white rounded-xl border border-slate-200/80 p-3 shadow-xs">
      <div class="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400">
        <span>SDV & Query Pace</span>
        <Clock size={13} class="text-emerald-500" />
      </div>
      <div class="mt-1 flex items-baseline gap-1.5">
        <span class="text-xl font-extrabold text-slate-900">{Math.min(98, site.readiness + 6)}%</span>
        <span class="text-[10px] text-slate-500">SDV complete</span>
      </div>
      <div class="mt-1 text-[10px] text-slate-500">Target DBL: {V3_STUDY_META.targetDbl}</div>
    </div>
  </div>

  <!-- 3-Column Visual Intelligence Row -->
  <div class="grid grid-cols-1 lg:grid-cols-12 gap-3">
    <!-- Col 1 (5 cols): Site Readiness Trajectory Chart -->
    <div class="lg:col-span-5 bg-white rounded-xl border border-slate-200/80 p-3 shadow-xs flex flex-col">
      <div class="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
        <div>
          <h3 class="text-xs font-bold text-slate-900">Site Readiness Trajectory</h3>
          <p class="text-[10px] text-slate-500">Actual vs Expected vs Forecast {whatIfGain > 0 ? '& What-If' : ''}</p>
        </div>
        <div class="flex items-center gap-2.5 text-[10px] font-semibold">
          <span class="inline-flex items-center gap-1 text-slate-600"><span class="w-2 h-0.5 bg-slate-400"></span>Expected</span>
          <span class="inline-flex items-center gap-1 text-blue-700"><span class="w-2 h-0.5 bg-blue-600"></span>Actual</span>
          <span class="inline-flex items-center gap-1 text-emerald-700"><span class="w-2 h-0.5 bg-emerald-500"></span>{whatIfGain > 0 ? 'Simulated' : 'Forecast'}</span>
        </div>
      </div>

      <div class="relative flex-1 min-h-[175px]" on:mouseleave={() => (hoveredWeekIdx = null)} role="presentation">
        <svg viewBox="0 0 380 155" class="w-full h-full overflow-visible">
          {#each [30, 50, 70, 90] as tick}
            {@const y = 130 - ((tick - 25) / 75) * 115}
            <line x1="28" y1={y} x2="365" y2={y} stroke="#f1f5f9" stroke-width="1" />
            <text x="4" y={y + 3} font-size="8" fill="#94a3b8">{tick}%</text>
          {/each}

          <polyline
            fill="none"
            stroke="#94a3b8"
            stroke-width="1.75"
            stroke-dasharray="4 3"
            points={trajectoryPoints.map((p, i) => `${34 + i * 54},${130 - ((p.expected - 25) / 75) * 115}`).join(' ')}
          />

          <polyline
            fill="none"
            stroke="#2563eb"
            stroke-width="2.5"
            points={trajectoryPoints
              .filter((p) => p.actual !== null)
              .map((p, i) => `${34 + i * 54},${130 - (((p.actual || 0) - 25) / 75) * 115}`)
              .join(' ')}
          />

          <polyline
            fill="none"
            stroke="#10b981"
            stroke-width="2.25"
            stroke-dasharray="4 2"
            points={trajectoryPoints
              .map((p, i) => (p.simulated !== null ? `${34 + i * 54},${130 - ((p.simulated - 25) / 75) * 115}` : null))
              .filter(Boolean)
              .join(' ')}
          />

          {#each trajectoryPoints as pt, i}
            {@const x = 34 + i * 54}
            {@const yVal = pt.actual ?? pt.simulated ?? pt.expected}
            {@const y = 130 - ((yVal - 25) / 75) * 115}
            <text x={x} y="148" text-anchor="middle" font-size="8" font-weight={i === 4 ? '700' : '500'} fill={i === 4 ? '#0f172a' : '#64748b'}>{pt.label}</text>
            <circle
              cx={x}
              cy={y}
              r={hoveredWeekIdx === i ? 5 : 3.2}
              fill={pt.actual !== null ? '#2563eb' : '#10b981'}
              stroke="#ffffff"
              stroke-width="1.5"
            />
            <rect
              x={x - 22}
              y="10"
              width="44"
              height="125"
              fill="transparent"
              role="presentation"
              class="cursor-pointer"
              on:mouseenter={() => (hoveredWeekIdx = i)}
            />
          {/each}
        </svg>

        {#if hoveredWeekIdx !== null && trajectoryPoints[hoveredWeekIdx]}
          {@const pt = trajectoryPoints[hoveredWeekIdx]}
          <div class="absolute top-1 right-1 bg-slate-900/95 text-white rounded-lg px-2.5 py-1.5 text-[10px] shadow-md pointer-events-none">
            <div class="font-bold text-slate-200">{pt.label}</div>
            <div>Expected: <span class="font-mono font-bold">{pt.expected}%</span></div>
            {#if pt.actual !== null}
              <div>Actual: <span class="font-mono font-bold text-blue-300">{pt.actual}%</span></div>
            {/if}
            {#if pt.simulated !== null}
              <div>{whatIfGain > 0 ? 'Simulated' : 'Forecast'}: <span class="font-mono font-bold text-emerald-300">{pt.simulated}%</span></div>
            {/if}
          </div>
        {/if}
      </div>
    </div>

    <!-- Col 2 (4 cols): Site Domain Readiness Breakdown -->
    <div class="lg:col-span-4 bg-white rounded-xl border border-slate-200/80 p-3 shadow-xs flex flex-col">
      <div class="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
        <div>
          <h3 class="text-xs font-bold text-slate-900">Domain Readiness Breakdown</h3>
          <p class="text-[10px] text-slate-500">Click any domain to inspect study-wide drivers</p>
        </div>
        <span class="text-[10px] font-semibold text-slate-400">5 domains</span>
      </div>

      <div class="flex-1 flex flex-col justify-center space-y-2.5">
        {#each domainBreakdown as dom}
          <button
            type="button"
            on:click={() => onSelectTab('domains')}
            class="w-full text-left group cursor-pointer"
          >
            <div class="flex items-center justify-between text-[11px] mb-1">
              <span class="font-semibold text-slate-800 group-hover:text-blue-600 transition-colors">{dom.name}</span>
              <span class="font-mono font-bold text-slate-700">{dom.pct}% <span class="text-[10px] font-normal text-slate-400">({dom.open} open)</span></span>
            </div>
            <div class="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
              <div class="h-full rounded-full {barColor(dom.pct)}" style="width:{dom.pct}%"></div>
            </div>
          </button>
        {/each}
      </div>
    </div>

    <!-- Col 3 (3 cols): Tabbed Risk Drivers & What-If / Prioritised Action Plan -->
    <div class="lg:col-span-3 bg-white rounded-xl border border-slate-200/80 p-3 shadow-xs flex flex-col justify-between">
      <div>
        <div class="flex items-center justify-between gap-1 pb-2 mb-2 border-b border-slate-100">
          <div class="inline-flex rounded-lg bg-slate-100 p-0.5 text-[10px] font-semibold">
            <button
              type="button"
              on:click={() => (rightPanelTab = 'risks')}
              class="px-2 py-0.5 rounded-md cursor-pointer transition-colors {rightPanelTab === 'risks' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'}"
            >
              Risk Drivers
            </button>
            <button
              type="button"
              on:click={() => (rightPanelTab = 'actions')}
              class="px-2 py-0.5 rounded-md cursor-pointer transition-colors inline-flex items-center gap-1 {rightPanelTab === 'actions' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'}"
            >
              <span>Action Plan</span>
              <span class="px-1 rounded-full text-[9px] font-bold {rightPanelTab === 'actions' ? 'bg-amber-100 text-amber-800' : 'bg-slate-200/80 text-slate-600'}">{siteActions.length}</span>
            </button>
          </div>
          <Sparkles size={13} class="text-blue-600 shrink-0" />
        </div>

        {#if rightPanelTab === 'risks'}
          <div class="space-y-1.5 mb-3">
            {#if site.riskDrivers.length === 0}
              <div class="flex items-start gap-1.5 text-[11px] text-emerald-800 bg-emerald-50/70 border border-emerald-200/60 rounded-lg px-2 py-1.5">
                <CheckCircle2 size={12} class="text-emerald-600 shrink-0 mt-0.5" />
                <span>{site.primaryDriver}</span>
              </div>
            {:else}
              {#each site.riskDrivers as drv}
                <div class="flex items-start gap-1.5 text-[11px] text-slate-700 bg-rose-50/60 border border-rose-200/60 rounded-lg px-2 py-1.5">
                  <AlertTriangle size={12} class="text-rose-500 shrink-0 mt-0.5" />
                  <div class="leading-snug">
                    <span class="font-bold text-slate-900">{drv.title}</span>
                    <span class="text-rose-600 font-semibold"> (+{drv.impactDays}d)</span>
                    <div class="text-[10px] text-slate-600">{drv.detail}</div>
                  </div>
                </div>
              {/each}
            {/if}
          </div>
        {:else}
          <div class="space-y-1.5 mb-2 max-h-[210px] overflow-y-auto pr-0.5">
            {#if siteActions.length === 0}
              <div class="py-6 text-center text-xs text-slate-500 flex flex-col items-center justify-center gap-1.5">
                <CheckCircle2 size={16} class="text-emerald-500" />
                <span>No escalated site-level actions pending.</span>
              </div>
            {:else}
              {#each siteActions as act}
                <div class="p-2 rounded-lg border border-slate-200/80 bg-slate-50/60 hover:bg-white transition-colors space-y-1">
                  <div class="flex items-start justify-between gap-1.5">
                    <span class="text-[11px] font-bold text-slate-900 leading-snug">{act.title}</span>
                    <span class="px-1.5 py-0.5 rounded text-[9px] font-bold shrink-0 {act.status === 'Overdue' ? 'bg-rose-100 text-rose-700' : act.status === 'In Progress' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'}">{act.status}</span>
                  </div>
                  <div class="flex items-center justify-between text-[10px] text-slate-500">
                    <span>{act.owner}</span>
                    <span>Due {act.dueDate} · <strong class="text-rose-600">+{act.estDblImpactDays}d</strong></span>
                  </div>
                </div>
              {/each}
            {/if}
          </div>
        {/if}
      </div>

      {#if rightPanelTab === 'risks'}
        <div class="pt-2 border-t border-slate-100 space-y-1.5">
          <div class="text-[10px] font-bold uppercase tracking-wider text-slate-400">Test Recovery Levers</div>
          {#each WHAT_IF_LEVERS as lever}
            {@const checked = whatIfSelected.includes(lever.id)}
            <label class="flex items-center justify-between gap-2 p-1.5 rounded-lg border text-[11px] cursor-pointer transition-colors {checked ? 'bg-emerald-50/70 border-emerald-300 text-emerald-900' : 'bg-slate-50/70 border-slate-200/70 text-slate-700 hover:bg-slate-100/70'}">
              <span class="flex items-center gap-1.5 min-w-0">
                <input
                  type="checkbox"
                  checked={checked}
                  on:change={() => toggleWhatIf(lever.id)}
                  class="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                />
                <span class="truncate font-medium">{lever.label}</span>
              </span>
              <span class="font-mono font-bold text-emerald-700 shrink-0">+{lever.gain}%</span>
            </label>
          {/each}
        </div>
      {:else}
        <div class="pt-2 border-t border-slate-100 flex items-center justify-between">
          <span class="text-[10px] text-slate-400">Prioritised by DBL impact</span>
          <button
            type="button"
            on:click={() => onSelectTab('actions_sim')}
            class="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:underline cursor-pointer"
          >
            Open Action Workbench <ChevronRight size={12} />
          </button>
        </div>
      {/if}
    </div>
  </div>

  <!-- Patient Readiness & 8-Domain Patient Tracker -->
  <div class="bg-white rounded-xl border border-slate-200/80 p-3 shadow-xs space-y-2.5">
    <div class="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-100">
      <div class="flex items-center gap-4 text-xs font-semibold">
        <button
          type="button"
          on:click={() => (patientTab = 'readiness')}
          class="pb-1 border-b-2 cursor-pointer inline-flex items-center gap-1.5 transition-colors {patientTab === 'readiness' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'}"
        >
          <span>Patient Readiness</span>
          <span class="px-1.5 py-0.5 rounded-full text-[10px] font-bold {patientTab === 'readiness' ? 'bg-blue-50 text-blue-700' : 'bg-slate-100 text-slate-600'}">{filteredSubjects.length}</span>
        </button>
        <button
          type="button"
          on:click={() => (patientTab = 'domain_tracker')}
          class="pb-1 border-b-2 cursor-pointer inline-flex items-center gap-1.5 transition-colors {patientTab === 'domain_tracker' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'}"
        >
          <span>Patient Domain Tracker (8 Domains)</span>
          <span class="px-1.5 py-0.5 rounded-full text-[10px] font-bold {patientTab === 'domain_tracker' ? 'bg-blue-50 text-blue-700' : 'bg-slate-100 text-slate-600'}">8 domains</span>
        </button>
      </div>
      <div class="flex items-center gap-2">
        {#if subjectSearch || classificationFilters.length > 0 || domainStatusFilters.length > 0}
          <button
            type="button"
            on:click={resetSubjectFilters}
            class="inline-flex items-center gap-1 px-2 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-[11px] font-semibold text-slate-600 cursor-pointer"
          >
            <RotateCcw size={11} /> Reset
          </button>
        {/if}
        <span class="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-lg border border-slate-200/80 bg-slate-50 text-[10px] font-medium text-slate-500">
          Click any patient row for details
        </span>
      </div>
    </div>

    <div class="rounded-xl bg-slate-50/90 border border-slate-200/80 p-2.5 flex flex-wrap items-center gap-2">
      <div class="relative flex-1 min-w-[200px]">
        <Search size={13} class="absolute left-2.5 top-2 text-slate-400" />
        <input
          type="text"
          bind:value={subjectSearch}
          placeholder="Search patient ID, owner, classification, or open items..."
          class="w-full pl-8 pr-7 py-1.5 text-xs border border-slate-200 rounded-lg bg-white focus:outline-hidden focus:border-blue-500"
        />
        {#if subjectSearch}
          <button
            type="button"
            on:click={() => (subjectSearch = '')}
            class="absolute right-2 top-2 text-slate-400 hover:text-slate-600 cursor-pointer"
          >
            <X size={13} />
          </button>
        {/if}
      </div>

      <MultiSelectFilter
        label="Classifications"
        options={[
          { value: 'Hard Blocked', label: 'Hard Blocked', dotColor: '#f43f5e' },
          { value: 'Action Required', label: 'Action Required', dotColor: '#f59e0b' },
          { value: 'Conditionally Ready', label: 'Conditionally Ready', dotColor: '#3b82f6' },
          { value: 'Lock Ready', label: 'Lock Ready', dotColor: '#10b981' },
        ]}
        selected={classificationFilters}
        onChange={(next) => (classificationFilters = next)}
      />

      <MultiSelectFilter
        label="Status"
        options={[
          { value: 'High risk', label: 'High risk', dotColor: '#f43f5e' },
          { value: 'At risk', label: 'At risk', dotColor: '#f59e0b' },
          { value: 'On track', label: 'On track', dotColor: '#10b981' },
        ]}
        selected={domainStatusFilters}
        onChange={(next) => (domainStatusFilters = next)}
      />
    </div>

    {#if patientTab === 'readiness'}
      <div class="rounded-lg border border-slate-200/80 overflow-x-auto">
        <table class="w-full text-xs">
          <thead class="bg-slate-50 border-b border-slate-200 text-[10px] font-bold uppercase tracking-wider text-slate-500">
            <tr>
              {#each [
                { col: 'id', label: 'Patient ID', align: 'text-left' },
                { col: 'classification', label: 'Classification', align: 'text-left' },
                { col: 'readiness', label: 'Readiness %', align: 'text-left' },
                { col: 'daysOpen', label: 'Days Open', align: 'text-right' },
                { col: 'owner', label: 'Owner', align: 'text-left' },
                { col: 'status', label: 'Status', align: 'text-left' },
              ] as h}
                <th class="px-3 py-2 {h.align}">
                  <button
                    type="button"
                    on:click={() => toggleSubjSort(h.col as SubjSortCol)}
                    class="inline-flex items-center gap-1 hover:text-slate-900 cursor-pointer"
                  >
                    <span>{h.label}</span>
                    {#if subjSortCol === h.col}
                      {#if subjSortDir === 'asc'}<ArrowUp size={11} class="text-blue-600" />
                      {:else}<ArrowDown size={11} class="text-blue-600" />{/if}
                    {:else}
                      <ArrowUpDown size={10} class="text-slate-300" />
                    {/if}
                  </button>
                </th>
              {/each}
              <th class="px-3 py-2 text-left">Key Open Items</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            {#if filteredSubjects.length === 0}
              <tr>
                <td colspan="7" class="px-4 py-6 text-center text-slate-500">No patients match the selected filters.</td>
              </tr>
            {:else}
              {#each filteredSubjects as subj, idx}
                {@const st = getSubjectRiskStatus(subj)}
                <tr
                  on:click={() => onSelectSubject(subj.id)}
                  class="hover:bg-blue-50/40 cursor-pointer transition-colors"
                >
                  <td class="px-3 py-2 font-mono font-bold text-blue-700">{subj.id}</td>
                  <td class="px-3 py-2">
                    <span class="inline-flex px-2 py-0.5 rounded-full border text-[10px] font-bold {classBadgeClass(subj.classification)}">{subj.classification}</span>
                  </td>
                  <td class="px-3 py-2">
                    <div class="flex items-center gap-2">
                      <span class="font-mono font-bold text-slate-900 w-9">{subj.readiness}%</span>
                      <div class="w-16 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                        <div class="h-full rounded-full {barColor(subj.readiness)}" style="width:{subj.readiness}%"></div>
                      </div>
                    </div>
                  </td>
                  <td class="px-3 py-2 text-right font-mono font-semibold text-slate-800">{subj.daysOpen}d</td>
                  <td class="px-3 py-2 text-slate-700">{subj.owner}</td>
                  <td class="px-3 py-2">
                    <span class="inline-flex px-2 py-0.5 rounded-full border text-[10px] font-bold {statusBadgeClass(st)}">{st}</span>
                  </td>
                  <td class="px-3 py-2 text-slate-600 max-w-[240px] truncate">{subj.keyOpenItems}</td>
                </tr>
              {/each}
            {/if}
          </tbody>
        </table>
      </div>
    {:else}
      <!-- Clean 8-Domain Patient Tracker Matrix -->
      <div class="rounded-lg border border-slate-200/80 overflow-x-auto">
        <table class="w-full text-xs">
          <thead class="bg-slate-50 border-b border-slate-200 text-[10px] font-bold uppercase tracking-wider text-slate-500">
            <tr>
              <th class="px-3 py-2 text-left sticky left-0 bg-slate-50 z-10">Patient ID</th>
              <th class="px-2.5 py-2 text-center">Overall</th>
              {#each DOMAIN_COLUMNS as col}
                <th class="px-2 py-2 text-center whitespace-nowrap">{col.short}</th>
              {/each}
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            {#if filteredSubjects.length === 0}
              <tr>
                <td colspan="10" class="px-4 py-6 text-center text-slate-500">No patients match the selected filters.</td>
              </tr>
            {:else}
              {#each filteredSubjects as subj, idx}
                <tr
                  on:click={() => onSelectSubject(subj.id)}
                  class="hover:bg-blue-50/40 cursor-pointer transition-colors"
                >
                  <td class="px-3 py-2 sticky left-0 bg-white z-10 border-r border-slate-100">
                    <div class="font-mono font-bold text-blue-700">{subj.id}</div>
                    <div class="text-[10px] text-slate-500">{subj.classification}</div>
                  </td>
                  <td class="px-2.5 py-2 text-center">
                    <span class="font-mono font-bold text-slate-900">{subj.readiness}%</span>
                  </td>
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
              {/each}
            {/if}
          </tbody>
        </table>
      </div>
    {/if}
  </div>
</div>

{#if activeDrawerSubject && selectedSubjectIdx !== null}
  <SubjectDrawerV3
    subject={activeDrawerSubject}
    subjectIndex={selectedSubjectIdx}
    totalSubjects={filteredSubjects.length}
    onClose={() => (selectedSubjectIdx = null)}
    onPrev={() => (selectedSubjectIdx = selectedSubjectIdx !== null && selectedSubjectIdx > 0 ? selectedSubjectIdx - 1 : filteredSubjects.length - 1)}
    onNext={() => (selectedSubjectIdx = selectedSubjectIdx !== null && selectedSubjectIdx < filteredSubjects.length - 1 ? selectedSubjectIdx + 1 : 0)}
    onOpenActions={() => { selectedSubjectIdx = null; onSelectTab('actions_sim'); }}
  />
{/if}
