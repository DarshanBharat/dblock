<script lang="ts">
  import {
    ArrowLeft,
    ChevronLeft,
    ChevronRight,
    AlertTriangle,
    CheckCircle2,
    Clock,
    ShieldAlert,
    Lock,
    Unlock,
    ExternalLink,
    Info,
    Sparkles,
    FileCheck2,
    Activity,
    Building2,
  } from '@lucide/svelte';
  import { V3_SUBJECT_ROWS, V3_STUDY_META, V3_SITES, countryFlag } from '../data/v3Data';

  export let subjectId: string;
  export let onBack: () => void;
  export let onSelectSubject: (id: string) => void;
  export let onSelectSite: (siteId: string) => void;
  export let onSelectDomain: (domainId: string) => void = () => {};
  export let onSelectTab: (tab: string) => void;

  const DOMAIN_ID_MAP: Record<string, string> = {
    'EDC Data Cleaning': 'edc',
    'Query Resolution': 'queries',
    'External Data Reconciliation': 'external_data',
    'Safety Reconciliation': 'safety',
    'Medical Coding': 'coding',
    'PI Signatures': 'pi_signatures',
    'Protocol Deviations': 'deviations',
    'SDV / SDR': 'sdv',
  };

  $: subjectIndex = Math.max(
    0,
    V3_SUBJECT_ROWS.findIndex((s) => s.id === subjectId)
  );
  $: subject = V3_SUBJECT_ROWS[subjectIndex] || V3_SUBJECT_ROWS[0];
  $: site = V3_SITES.find((s) => s.id === subject.siteId);

  // Interactive What-If domain lock simulation
  let simulatedClearedDomains: string[] = [];
  $: if (subjectId) {
    simulatedClearedDomains = [];
  }

  function toggleSimDomain(domain: string) {
    simulatedClearedDomains = simulatedClearedDomains.includes(domain)
      ? simulatedClearedDomains.filter((d) => d !== domain)
      : [...simulatedClearedDomains, domain];
  }

  $: incompleteDomains = subject.domainBreakdown.filter((d) => d.status !== 'Complete');
  $: remainingIncomplete = incompleteDomains.filter((d) => !simulatedClearedDomains.includes(d.domain));
  $: simBonus =
    incompleteDomains.length === 0
      ? 0
      : Math.round(
          ((incompleteDomains.length - remainingIncomplete.length) / incompleteDomains.length) *
            (100 - subject.readiness)
        );
  $: effectiveReadiness = Math.min(100, subject.readiness + simBonus);
  $: hardGatesRemaining =
    remainingIncomplete.filter(
      (d) =>
        d.domain.includes('External') ||
        d.domain.includes('Safety') ||
        d.domain.includes('PI Signatures') ||
        d.domain.includes('Query')
    ).length;

  $: isFreezeEligible = effectiveReadiness >= 95 && hardGatesRemaining === 0;
  $: estDelayDays = isFreezeEligible
    ? 0
    : Math.max(1, Math.round((100 - effectiveReadiness) / 8) + hardGatesRemaining);

  // Open & Closed Queries / Domain Items filtering
  let itemStatusFilter: 'all' | 'Open' | 'Closed' = 'all';
  let itemSeverityFilter: 'all' | 'Critical' | 'Routine' = 'all';
  let selectedDomainFilter: string | null = null;

  function mapCategoryToDomain(cat: string): string {
    const c = cat.toLowerCase();
    if (c.includes('edc')) return 'EDC Data Cleaning';
    if (c.includes('quer')) return 'Query Resolution';
    if (c.includes('ext') || c.includes('lab')) return 'External Data Reconciliation';
    if (c.includes('saf') || c.includes('sae')) return 'Safety Reconciliation';
    if (c.includes('cod')) return 'Medical Coding';
    if (c.includes('sig')) return 'PI Signatures';
    if (c.includes('dev')) return 'Protocol Deviations';
    if (c.includes('sdv')) return 'SDV / SDR';
    return 'Query Resolution';
  }

  $: closedItemsForSubject = [
    { id: `QRY-CLS-${subject.siteId}-01`, category: 'Query Resolution', domain: 'Query Resolution', issue: 'Concomitant medication start date query answered & closed', severity: 'Routine', daysOpen: 0, status: 'Closed', closedDate: '24 Oct 2026' },
    { id: `QRY-CLS-${subject.siteId}-02`, category: 'Query Resolution', domain: 'Query Resolution', issue: 'RECIST target lesion measurement unit query resolved & closed', severity: 'Critical', daysOpen: 0, status: 'Closed', closedDate: '26 Oct 2026' },
    { id: `EDC-CLS-${subject.siteId}-03`, category: 'EDC Data Cleaning', domain: 'EDC Data Cleaning', issue: 'Screening demographics, vitals & medical history forms cleaned', severity: 'Routine', daysOpen: 0, status: 'Closed', closedDate: '19 Oct 2026' },
    { id: `LAB-CLS-${subject.siteId}-04`, category: 'External Data', domain: 'External Data Reconciliation', issue: 'Week 12 central laboratory chemistry panel reconciled', severity: 'Routine', daysOpen: 0, status: 'Closed', closedDate: '22 Oct 2026' },
    { id: `SAE-CLS-${subject.siteId}-05`, category: 'Safety', domain: 'Safety Reconciliation', issue: 'Baseline AE/SAE terms & seriousness verified across Argus & EDC', severity: 'Critical', daysOpen: 0, status: 'Closed', closedDate: '25 Oct 2026' },
    { id: `COD-CLS-${subject.siteId}-06`, category: 'Medical Coding', domain: 'Medical Coding', issue: 'MedDRA v26.1 & WHODrug dictionary coding approved', severity: 'Routine', daysOpen: 0, status: 'Closed', closedDate: '21 Oct 2026' },
    { id: `SIG-CLS-${subject.siteId}-07`, category: 'PI Signatures', domain: 'PI Signatures', issue: 'Screening & Day 1 eCRFs electronically signed by PI', severity: 'Routine', daysOpen: 0, status: 'Closed', closedDate: '20 Oct 2026' },
    { id: `PD-CLS-${subject.siteId}-08`, category: 'Protocol Deviations', domain: 'Protocol Deviations', issue: 'Week 12 visit window (+2d) deviation reviewed & closed', severity: 'Routine', daysOpen: 0, status: 'Closed', closedDate: '23 Oct 2026' },
    { id: `SDV-CLS-${subject.siteId}-09`, category: 'SDV / SDR', domain: 'SDV / SDR', issue: '100% source data verification completed for Visits 1–4', severity: 'Routine', daysOpen: 0, status: 'Closed', closedDate: '27 Oct 2026' },
  ];

  $: allSubjectItems = [
    ...subject.openItems.map((it) => ({
      ...it,
      domain: mapCategoryToDomain(it.category),
      status: 'Open' as const,
      closedDate: '—',
    })),
    ...closedItemsForSubject,
  ];

  $: filteredSubjectItems = allSubjectItems.filter((item) => {
    const matchStatus = itemStatusFilter === 'all' || item.status === itemStatusFilter;
    const matchSev = itemSeverityFilter === 'all' || item.severity === itemSeverityFilter;
    const matchDom = !selectedDomainFilter || item.domain === selectedDomainFilter;
    return matchStatus && matchSev && matchDom;
  });

  function filterByDomain(domainName: string) {
    selectedDomainFilter = selectedDomainFilter === domainName ? null : domainName;
    const el = document.getElementById('subject-items-table');
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function classBadge(c: string): string {
    if (c === 'Lock Ready') return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    if (c === 'Conditionally Ready') return 'bg-blue-50 text-blue-700 border-blue-200';
    if (c === 'Action Required') return 'bg-amber-50 text-amber-700 border-amber-200';
    return 'bg-rose-50 text-rose-700 border-rose-200';
  }

  function barColor(pct: number) {
    if (pct >= 90) return 'bg-emerald-500';
    if (pct >= 75) return 'bg-blue-500';
    if (pct >= 55) return 'bg-amber-500';
    return 'bg-rose-500';
  }

  function goPrev() {
    const prevIdx = subjectIndex > 0 ? subjectIndex - 1 : V3_SUBJECT_ROWS.length - 1;
    onSelectSubject(V3_SUBJECT_ROWS[prevIdx].id);
  }

  function goNext() {
    const nextIdx = subjectIndex < V3_SUBJECT_ROWS.length - 1 ? subjectIndex + 1 : 0;
    onSelectSubject(V3_SUBJECT_ROWS[nextIdx].id);
  }
</script>

<div class="space-y-2.5">
  <!-- Executive DBL Subject Header Card -->
  <div class="bg-white rounded-xl border border-slate-200/80 shadow-xs px-3.5 py-2.5">
    <div class="flex flex-wrap items-start justify-between gap-2 pb-2 border-b border-slate-100">
      <div>
        <button
          type="button"
          on:click={onBack}
          class="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 hover:text-blue-600 mb-0.5 cursor-pointer"
        >
          <ArrowLeft size={12} /> Back to Subjects
        </button>
        <div class="flex flex-wrap items-center gap-2">
          <h1 class="text-base font-bold text-slate-900 font-mono tracking-tight leading-tight">
            {subject.id}
          </h1>
          <span class="px-2 py-0.5 rounded-full border text-[11px] font-semibold {classBadge(subject.classification)}">
            {subject.classification}
          </span>
          {#if isFreezeEligible}
            <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
              <Lock size={10} /> Casebook Freeze Eligible
            </span>
          {:else}
            <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-bold">
              <Unlock size={10} /> Freeze Blocked ({hardGatesRemaining} hard gate{hardGatesRemaining === 1 ? '' : 's'})
            </span>
          {/if}
        </div>
        <p class="text-[11px] text-slate-500 mt-0.5">
          {V3_STUDY_META.protocol} · Site {subject.siteId} ({site?.name || subject.country}) · {subject.keyInfo.arm}
        </p>
      </div>

      <div class="flex flex-col items-end gap-1">
        <div class="flex flex-wrap items-center gap-1.5">
          <div class="inline-flex items-center rounded-lg border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[11px]">
            <button type="button" on:click={goPrev} class="p-1 rounded hover:bg-white text-slate-600 cursor-pointer" aria-label="Previous subject">
              <ChevronLeft size={13} />
            </button>
            <span class="px-1.5 font-semibold text-slate-700">{subjectIndex + 1} / {V3_SUBJECT_ROWS.length}</span>
            <button type="button" on:click={goNext} class="p-1 rounded hover:bg-white text-slate-600 cursor-pointer" aria-label="Next subject">
              <ChevronRight size={13} />
            </button>
          </div>
          <button
            type="button"
            on:click={() => onSelectSite(subject.siteId)}
            class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 cursor-pointer"
          >
            <Building2 size={12} /> Site {subject.siteId}
          </button>
          <button
            type="button"
            on:click={() => onSelectTab('actions_sim')}
            class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold cursor-pointer shadow-xs"
          >
            Open Action Workbench <ExternalLink size={12} />
          </button>
        </div>
        <span class="text-[10px] text-slate-400">Target DBL: {V3_STUDY_META.targetDbl} · Last activity: {subject.lastActivity}</span>
      </div>
    </div>

    <!-- 8-Column Subject Clinical & DBL Metadata Strip -->
    <div class="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 pt-2 text-[11px]">
      <div>
        <div class="text-[10px] text-slate-400">Country</div>
        <div class="font-semibold text-slate-800">{countryFlag(subject.country)} {subject.country}</div>
      </div>
      <div>
        <div class="text-[10px] text-slate-400">Investigator</div>
        <div class="font-semibold text-slate-800 truncate">{subject.keyInfo.investigator}</div>
      </div>
      <div>
        <div class="text-[10px] text-slate-400">Subject Status</div>
        <div class="font-semibold text-slate-800">{subject.status}</div>
      </div>
      <div>
        <div class="text-[10px] text-slate-400">Age / Sex</div>
        <div class="font-semibold text-slate-800">{subject.keyInfo.ageSex}</div>
      </div>
      <div>
        <div class="text-[10px] text-slate-400">Analysis Set</div>
        <div class="font-semibold text-slate-800">{subject.keyInfo.analysisSet} {subject.lockPopulation ? '(Lock Pop)' : ''}</div>
      </div>
      <div>
        <div class="text-[10px] text-slate-400">Randomization</div>
        <div class="font-semibold text-slate-800">{subject.keyInfo.randomization}</div>
      </div>
      <div>
        <div class="text-[10px] text-slate-400">Enrolment Date</div>
        <div class="font-semibold text-slate-800">{subject.keyInfo.enrolmentDate}</div>
      </div>
      <div>
        <div class="text-[10px] text-slate-400">Last Visit Date</div>
        <div class="font-semibold text-slate-800">{subject.keyInfo.lastVisitDate}</div>
      </div>
    </div>
  </div>

  <!-- 5 DBL-Focused KPI Cards -->
  <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
    <div class="bg-white rounded-xl border border-slate-200/80 p-3 shadow-xs">
      <div class="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400">
        <span>Lock Readiness</span>
        <Activity size={13} class="text-blue-600" />
      </div>
      <div class="mt-1 flex items-baseline gap-2">
        <span class="text-xl font-extrabold text-slate-900">{effectiveReadiness}%</span>
        {#if simBonus > 0}
          <span class="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 text-[10px] font-bold">+{simBonus}% sim</span>
        {:else}
          <span class="text-[10px] font-semibold text-slate-400">Goal: 100%</span>
        {/if}
      </div>
      <div class="mt-1.5 h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
        <div class="h-full rounded-full {barColor(effectiveReadiness)} transition-all duration-200" style="width:{effectiveReadiness}%"></div>
      </div>
    </div>

    <div class="bg-white rounded-xl border border-slate-200/80 p-3 shadow-xs">
      <div class="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400">
        <span>Hard Lock Gates</span>
        <ShieldAlert size={13} class="text-rose-500" />
      </div>
      <div class="mt-1 flex items-baseline gap-1.5">
        <span class="text-xl font-extrabold {hardGatesRemaining > 0 ? 'text-rose-600' : 'text-emerald-600'}">{hardGatesRemaining}</span>
        <span class="text-[10px] text-slate-500">blocking freeze</span>
      </div>
      <div class="mt-1 text-[10px] text-slate-500">
        {subject.hasSae ? 'SAE discrepancy active' : subject.hasEndpointIssue ? 'Endpoint query active' : 'No SAE / endpoint gates'}
      </div>
    </div>

    <div class="bg-white rounded-xl border border-slate-200/80 p-3 shadow-xs">
      <div class="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400">
        <span>DBL Delay Exposure</span>
        <Clock size={13} class="text-amber-500" />
      </div>
      <div class="mt-1 flex items-baseline gap-1.5">
        <span class="text-xl font-extrabold {estDelayDays === 0 ? 'text-emerald-600' : 'text-amber-600'}">
          {estDelayDays === 0 ? '0d' : `+${estDelayDays}d`}
        </span>
        <span class="text-[10px] text-slate-500">{estDelayDays === 0 ? 'On time' : 'slip risk'}</span>
      </div>
      <div class="mt-1 text-[10px] text-slate-500">Owner: <strong class="text-slate-700">{subject.owner}</strong></div>
    </div>

    <div class="bg-white rounded-xl border border-slate-200/80 p-3 shadow-xs">
      <div class="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400">
        <span>Open Items & Aging</span>
        <AlertTriangle size={13} class="text-rose-500" />
      </div>
      <div class="mt-1 flex items-baseline gap-1.5">
        <span class="text-xl font-extrabold text-slate-900">{subject.openItems.length}</span>
        <span class="text-[10px] font-bold text-rose-600">
          {subject.openItems.filter((i) => i.severity === 'Critical').length} critical
        </span>
      </div>
      <div class="mt-1 text-[10px] text-slate-500">Oldest open: {subject.daysOpen}d</div>
    </div>

    <div class="bg-white rounded-xl border border-slate-200/80 p-3 shadow-xs">
      <div class="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400">
        <span>Casebook Freeze</span>
        <FileCheck2 size={13} class="{isFreezeEligible ? 'text-emerald-600' : 'text-rose-500'}" />
      </div>
      <div class="mt-1 flex items-baseline gap-1.5">
        <span class="text-base font-extrabold {isFreezeEligible ? 'text-emerald-700' : 'text-rose-700'}">
          {isFreezeEligible ? 'Eligible to Freeze' : 'Not Eligible'}
        </span>
      </div>
      <div class="mt-1 text-[10px] text-slate-500">
        {isFreezeEligible ? 'All 8 lock gates satisfied' : 'Resolve hard gates to unlock'}
      </div>
    </div>
  </div>

  <!-- Row 1: Visit Timeline (6) + DBL Risks (3) + Next Best Actions (3) -->
  <div class="grid grid-cols-1 lg:grid-cols-12 gap-3">
    <div class="lg:col-span-6 bg-white rounded-xl border border-slate-200/80 p-3 shadow-xs">
      <div class="flex items-center justify-between pb-2 mb-3 border-b border-slate-100">
        <h3 class="text-xs font-bold text-slate-900">Subject Visit & Casebook Freeze Timeline</h3>
        <span class="text-[10px] font-semibold text-slate-400">Milestone Gate</span>
      </div>
      <div class="grid grid-cols-4 gap-2 text-center">
        {#each subject.timeline as step}
          <div class="flex flex-col items-center p-2 rounded-lg bg-slate-50/70 border border-slate-100">
            <span class="w-3 h-3 rounded-full {step.state === 'completed' ? 'bg-emerald-500' : step.state === 'in_progress' ? 'bg-amber-400' : step.state === 'missed' ? 'bg-rose-500' : 'bg-slate-300'}"></span>
            <span class="text-[10px] font-bold text-slate-800 mt-1 leading-tight">{step.label}</span>
            <span class="text-[9px] text-slate-400 mt-0.5">{step.date}</span>
          </div>
        {/each}
        <div class="flex flex-col items-center p-2 rounded-lg border {isFreezeEligible ? 'bg-emerald-50 border-emerald-200' : 'bg-rose-50/60 border-rose-200'}">
          <span class="w-3 h-3 rounded-full {isFreezeEligible ? 'bg-emerald-500' : 'bg-rose-500'}"></span>
          <span class="text-[10px] font-bold text-slate-900 mt-1 leading-tight">Freeze</span>
          <span class="text-[9px] text-slate-500 mt-0.5">{isFreezeEligible ? 'Ready' : 'Blocked'}</span>
        </div>
        <div class="flex flex-col items-center p-2 rounded-lg bg-slate-50/70 border border-slate-100">
          <span class="w-3 h-3 rounded-full bg-blue-500"></span>
          <span class="text-[10px] font-bold text-slate-800 mt-1 leading-tight">DBL Lock</span>
          <span class="text-[9px] text-slate-400 mt-0.5">{V3_STUDY_META.targetDbl}</span>
        </div>
      </div>
    </div>

    <div class="lg:col-span-3 bg-white rounded-xl border border-slate-200/80 p-3 shadow-xs">
      <div class="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
        <h3 class="text-xs font-bold text-slate-900">DBL Risks & Impact</h3>
        <Sparkles size={13} class="text-amber-500" />
      </div>
      {#if subject.risksAndImpact.length === 0}
        <div class="flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50/60 border border-emerald-200/60 rounded-lg p-2.5">
          <CheckCircle2 size={14} /> No active DBL risks for this subject.
        </div>
      {:else}
        <div class="space-y-1.5">
          {#each subject.risksAndImpact as r}
            <div class="flex items-start gap-2 text-[11px] p-2 rounded-lg bg-rose-50/60 border border-rose-200/60">
              {#if r.level === 'Critical'}
                <AlertTriangle size={13} class="text-rose-600 shrink-0 mt-0.5" />
              {:else}
                <Info size={13} class="text-amber-600 shrink-0 mt-0.5" />
              {/if}
              <span class="text-slate-700 leading-snug">{r.text}</span>
            </div>
          {/each}
        </div>
      {/if}
    </div>

    <div class="lg:col-span-3 bg-white rounded-xl border border-slate-200/80 p-3 shadow-xs flex flex-col justify-between">
      <div>
        <div class="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
          <h3 class="text-xs font-bold text-slate-900">Next Best DBL Actions</h3>
          <span class="px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 text-[10px] font-bold">{subject.nextBestActions.length}</span>
        </div>
        {#if subject.nextBestActions.length === 0}
          <div class="p-3 rounded-lg bg-emerald-50/60 border border-emerald-200/60 text-xs text-emerald-800 flex items-center gap-2">
            <CheckCircle2 size={14} /> Ready for casebook freeze.
          </div>
        {:else}
          <div class="space-y-1.5">
            {#each subject.nextBestActions as a}
              <div class="p-2 rounded-lg border border-slate-200/80 bg-slate-50/70 space-y-1">
                <div class="flex items-start justify-between gap-2">
                  <div class="text-[11px] font-bold text-slate-900 leading-snug">{a.action}</div>
                  <span class="px-1.5 py-0.5 rounded text-[9px] font-bold shrink-0 {a.status === 'In Progress' ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-700'}">{a.status}</span>
                </div>
                <div class="text-[10px] text-slate-500">{a.owner} · Due {a.targetDate}</div>
              </div>
            {/each}
          </div>
        {/if}
      </div>
      <div class="pt-2 mt-2 border-t border-slate-100 flex items-center gap-1.5">
        <button
          type="button"
          on:click={() => onSelectSite(subject.siteId)}
          class="flex-1 px-2 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-[11px] font-semibold text-slate-700 cursor-pointer"
        >Site {subject.siteId}</button>
        <button
          type="button"
          on:click={() => onSelectTab('actions_sim')}
          class="flex-1 px-2 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-semibold cursor-pointer"
        >Actions</button>
      </div>
    </div>
  </div>

  <!-- Full-Width Domain Readiness for This Subject Table -->
  <div class="bg-white rounded-xl border border-slate-200/80 p-3 shadow-xs space-y-2.5">
    <div class="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-100">
      <div>
        <h3 class="text-xs font-bold text-slate-900">Domain Readiness for This Subject (8 Clinical Domains)</h3>
        <p class="text-[10px] text-slate-500">Click any domain to open its Clinical Domain drill-down page, or toggle "Sim. Clear" to test freeze eligibility</p>
      </div>
      {#if simulatedClearedDomains.length > 0}
        <button
          type="button"
          on:click={() => (simulatedClearedDomains = [])}
          class="px-2.5 py-1 rounded-lg border border-blue-200 bg-blue-50 text-[11px] font-semibold text-blue-700 cursor-pointer"
        >Reset Simulation ({simulatedClearedDomains.length})</button>
      {/if}
    </div>

    <div class="rounded-lg border border-slate-200/80 overflow-x-auto">
      <table class="w-full text-xs">
        <thead class="bg-slate-50 border-b border-slate-200 text-[10px] font-bold uppercase tracking-wider text-slate-500">
          <tr>
            <th class="px-3 py-2 text-left">Domain</th>
            <th class="px-3 py-2 text-left">Status</th>
            <th class="px-3 py-2 text-left">Details</th>
            <th class="px-3 py-2 text-left">Completion</th>
            <th class="px-3 py-2 text-center">What-If Gate</th>
            <th class="px-3 py-2 text-right">Drill Down</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100">
          {#each subject.domainBreakdown as row}
            {@const isSimCleared = simulatedClearedDomains.includes(row.domain)}
            {@const isDone = row.status === 'Complete' || isSimCleared}
            {@const pct = isSimCleared ? 100 : row.completion}
            {@const domId = DOMAIN_ID_MAP[row.domain] || 'edc'}
            <tr class="hover:bg-blue-50/30 transition-colors cursor-pointer {selectedDomainFilter === row.domain ? 'bg-blue-50/60' : ''}" on:click={() => filterByDomain(row.domain)}>
              <td class="px-3 py-2">
                <div class="inline-flex items-center gap-1.5">
                  <span class="font-bold text-slate-900">{row.domain}</span>
                  <button
                    type="button"
                    on:click|stopPropagation={() => onSelectDomain(domId)}
                    class="p-0.5 rounded hover:bg-blue-100 text-blue-600 cursor-pointer"
                    title="Go to {row.domain} Clinical Domain page"
                  >
                    <ExternalLink size={11} />
                  </button>
                </div>
              </td>
              <td class="px-3 py-2">
                <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border {isDone ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'}">
                  {isDone ? 'Complete' : 'Action Required'}
                </span>
              </td>
              <td class="px-3 py-2 text-slate-600">{isSimCleared ? 'Simulated resolved for DBL' : row.details}</td>
              <td class="px-3 py-2">
                <div class="flex items-center gap-2">
                  <span class="font-mono font-bold text-slate-900 w-9">{pct}%</span>
                  <div class="w-20 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                    <div class="h-full rounded-full {barColor(pct)}" style="width:{pct}%"></div>
                  </div>
                </div>
              </td>
              <td class="px-3 py-2 text-center" on:click|stopPropagation>
                {#if row.status !== 'Complete'}
                  <label class="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-white border border-slate-200 text-[10px] font-semibold text-slate-700 cursor-pointer hover:border-emerald-400">
                    <input
                      type="checkbox"
                      checked={isSimCleared}
                      on:change={() => toggleSimDomain(row.domain)}
                      class="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>Sim. Clear</span>
                  </label>
                {:else}
                  <span class="text-[10px] font-semibold text-emerald-600">Passed</span>
                {/if}
              </td>
              <td class="px-3 py-2 text-right" on:click|stopPropagation>
                <button
                  type="button"
                  on:click={() => filterByDomain(row.domain)}
                  class="inline-flex items-center gap-1 px-2 py-1 rounded text-[10px] font-bold transition-colors cursor-pointer {selectedDomainFilter === row.domain ? 'bg-blue-600 text-white' : 'bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white'}"
                >
                  {selectedDomainFilter === row.domain ? 'Filtered ✓' : 'Open Domain'}
                  <ChevronRight size={11} />
                </button>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  </div>

  <!-- Full-Width Open & Closed Queries / Domain Items Log -->
  <div id="subject-items-table" class="bg-white rounded-xl border border-slate-200/80 p-3 shadow-xs space-y-2.5">
    <div class="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-100">
      <div class="flex items-center gap-2 flex-wrap">
        <h3 class="text-xs font-bold text-slate-900">Queries & Domain Items Log (Open & Closed)</h3>
        <span class="px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[10px] font-bold">{filteredSubjectItems.length} items</span>
        {#if selectedDomainFilter}
          <button
            type="button"
            on:click={() => (selectedDomainFilter = null)}
            class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-600 text-white text-[10px] font-bold cursor-pointer"
          >
            Domain: {selectedDomainFilter} ×
          </button>
        {/if}
      </div>

      <div class="flex flex-wrap items-center gap-2 text-[11px] font-semibold">
        <div class="inline-flex items-center gap-1">
          {#each [
            { key: 'all', label: `All (${allSubjectItems.length})` },
            { key: 'Open', label: `Open (${subject.openItems.length})` },
            { key: 'Closed', label: `Closed (${closedItemsForSubject.length})` },
          ] as st}
            <button
              type="button"
              on:click={() => (itemStatusFilter = st.key as any)}
              class="px-2.5 py-1 rounded-full border cursor-pointer transition-colors {itemStatusFilter === st.key ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}"
            >
              {st.label}
            </button>
          {/each}
        </div>
        <span class="text-slate-300">|</span>
        <div class="inline-flex items-center gap-1">
          {#each ['all', 'Critical', 'Routine'] as sev}
            <button
              type="button"
              on:click={() => (itemSeverityFilter = sev as any)}
              class="px-2.5 py-1 rounded-full border cursor-pointer transition-colors {itemSeverityFilter === sev ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}"
            >
              {sev === 'all' ? 'All Severities' : sev}
            </button>
          {/each}
        </div>
      </div>
    </div>

    {#if filteredSubjectItems.length === 0}
      <div class="py-6 text-center text-xs text-slate-500">
        No items match the selected domain/status filter.
      </div>
    {:else}
      <div class="rounded-lg border border-slate-200/80 overflow-x-auto">
        <table class="w-full text-xs">
          <thead class="bg-slate-50 border-b border-slate-200 text-[10px] font-bold uppercase tracking-wider text-slate-500">
            <tr>
              <th class="px-3 py-2 text-left">Record ID</th>
              <th class="px-3 py-2 text-left">Domain</th>
              <th class="px-3 py-2 text-left">Issue / Verification Detail</th>
              <th class="px-3 py-2 text-left">Status</th>
              <th class="px-3 py-2 text-left">Severity</th>
              <th class="px-3 py-2 text-right">Age / Closed</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            {#each filteredSubjectItems as item}
              <tr class="hover:bg-slate-50/70">
                <td class="px-3 py-2 font-mono font-bold text-blue-700">{item.id}</td>
                <td class="px-3 py-2 font-semibold text-slate-800">{item.domain}</td>
                <td class="px-3 py-2 text-slate-700">{item.issue}</td>
                <td class="px-3 py-2">
                  <span class="px-2 py-0.5 rounded-full text-[10px] font-bold border {item.status === 'Closed' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'}">
                    {item.status}
                  </span>
                </td>
                <td class="px-3 py-2">
                  <span class="px-2 py-0.5 rounded-full text-[10px] font-bold border {item.severity === 'Critical' ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-slate-100 text-slate-700 border-slate-200'}">
                    {item.severity}
                  </span>
                </td>
                <td class="px-3 py-2 text-right font-mono font-bold {item.status === 'Closed' ? 'text-emerald-600' : item.daysOpen >= 10 ? 'text-rose-600' : 'text-slate-700'}">
                  {item.status === 'Closed' ? item.closedDate : `${item.daysOpen}d open`}
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    {/if}
  </div>
</div>
