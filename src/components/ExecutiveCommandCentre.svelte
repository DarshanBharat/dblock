<script lang="ts">
  import {
    ArrowRight,
    AlertTriangle,
    CheckCircle2,
    Clock,
    TrendingUp,
    ShieldAlert,
    HelpCircle,
    Compass,
    Sparkles,
    ChevronRight,
    ChevronDown,
    Activity,
    Info,
    Sliders,
    Layers,
    X
  } from '@lucide/svelte';

  export let study: any;
  export let actions: any[];
  export let timelineSnapshots: any[] = [];
  export let sites: any[] = [];
  export let subjects: any[] = [];
  export let saeDiscrepancies: any[] = [];
  export let labBatches: any[] = [];
  export let queriesDetail: any[] = [];
  export let activeRole: string = 'all';
  export let onSelectTab: (tab: string, readinessCategory?: string, showWeightConfig?: boolean) => void;
  export let onSelectSite: (id: string) => void;

  // Modal state for "How is this calculated?" Readiness Definition & 5-Component Weightage
  let showReadinessDefinitionModal = false;

  // Selected Potential Delay Driver for drill-down (driver -> affected sites or vendors -> individual open items)
  let expandedDriverId: string | null = 'drv-1';

  // Readiness by category bars (exact values from Image 6 manager screenshot)
  const readinessByCategoryBars = [
    {
      id: 'edc_cleaning',
      label: 'EDC data cleaning',
      pct: 92,
      color: 'emerald',
      roles: ['all', 'my_queue', 'cra_site', 'cdm'],
      summary: '2,944 of 3,200 expected eCRF forms entered & verified across 220 subjects'
    },
    {
      id: 'query_resolution',
      label: 'Query resolution',
      pct: 85,
      color: 'emerald',
      roles: ['all', 'my_queue', 'cra_site', 'cdm'],
      summary: '385 of 453 total queries closed; 68 open (14 endpoint-critical >14d)'
    },
    {
      id: 'external_recon',
      label: 'External data reconciliation',
      pct: 65,
      color: 'amber',
      roles: ['all', 'my_queue', 'vendor'],
      summary: 'LabCorp ctDNA batch #LXB-8921 (48 samples) overdue 4d; BioClinica & eCOA 88% reconciled'
    },
    {
      id: 'medical_coding',
      label: 'Medical coding',
      pct: 90,
      color: 'emerald',
      roles: ['all', 'cdm'],
      summary: '1,890 of 2,100 MedDRA 27.0 & WHODrug terms coded; 12 terms pending manual review'
    },
    {
      id: 'site_signoffs',
      label: 'Site sign-offs',
      pct: 75,
      color: 'amber',
      roles: ['all', 'my_queue', 'cra_site'],
      summary: '165 of 220 subject casebooks signed by PI; 18 overdue at Sites 104 & 405'
    },
    {
      id: 'safety_recon',
      label: 'Safety reconciliation',
      pct: 80,
      color: 'emerald',
      roles: ['all', 'my_queue', 'safety'],
      summary: '82 of 84 SAE cases reconciled between Rave & Argus; 2 critical discrepancies at Site 104'
    }
  ];

  // Five major components recommended to calculate the score (Image 7)
  const fiveScoreComponents = [
    {
      component: 'EDC data cleanliness',
      weight: '30%',
      score: 89,
      measures: 'Missing pages, open queries, incomplete data, review status'
    },
    {
      component: 'External data reconciliation',
      weight: '25%',
      score: 65,
      measures: 'Lab, eCOA, imaging, IRT, safety data completeness'
    },
    {
      component: 'Site readiness',
      weight: '20%',
      score: 75,
      measures: 'Outstanding entry, investigator sign-offs, site closure'
    },
    {
      component: 'CDM completion',
      weight: '15%',
      score: 85,
      measures: 'Medical coding, SAE reconciliation, review and sign-off'
    },
    {
      component: 'Cross-functional readiness',
      weight: '10%',
      score: 82,
      measures: 'Clinical, safety, biostatistics and other required approvals'
    }
  ];

  // Leading Potential Delay Drivers with drill-down: driver -> affected sites/vendors -> individual open items
  const leadingDelayDrivers = [
    {
      id: 'drv-1',
      factor: 'Safety reconciliation discrepancies (SAE freeze blocker)',
      weight: 35,
      impact: '35% (~2.1d)',
      status: 'Critical',
      roles: ['all', 'my_queue', 'safety', 'cra_site'],
      summary: '2 unresolved SAE discrepancies at Site 104 blocking pharmacovigilance safety freeze.',
      affectedEntity: 'Site 104 (Boston Medical Center) & Oracle Argus Safety',
      siteId: '104',
      openItems: [
        { id: 'SAE-REC-104-01', desc: 'Subj 104-003: Grade 3 CRS onset date mismatch (Rave Oct 12 vs Argus Oct 14)', age: '12d', owner: 'Dr. Sarah Lin (PV)' },
        { id: 'SAE-REC-104-02', desc: 'Subj 104-012: Fatal Sepsis Form DD-01 missing certified hospital discharge narrative', age: '9d', owner: 'Marcus Campbell (CRA)' }
      ]
    },
    {
      id: 'drv-2',
      factor: 'Central laboratory transfer overdue (Vendor feed)',
      weight: 30,
      impact: '30% (~1.8d)',
      status: 'Critical',
      roles: ['all', 'my_queue', 'vendor'],
      summary: 'LabCorp ctDNA Batch #LXB-8921 (48 samples) SHA-256 checksum failure awaiting QA re-export.',
      affectedEntity: 'Vendor: LabCorp Bioanalytical Geneva (Affects Sites 104 & 317)',
      siteId: '104',
      openItems: [
        { id: 'LXB-8921', desc: '48 ctDNA NGS samples (Cycle 4–6) overdue 4 days; FASTQ trailer checksum failed', age: '4d late', owner: 'J.-P. Dupuis (Vendor Ops)' },
        { id: 'LXB-8940', desc: 'Eurofins serum chemistry batch (112 samples) pending sponsor QA sign-off', age: '1d late', owner: 'Mark Henderson (EDM)' }
      ]
    },
    {
      id: 'drv-3',
      factor: 'Ageing queries (>14 days, including endpoint-critical)',
      weight: 22,
      impact: '22% (~1.3d)',
      status: 'High',
      roles: ['all', 'my_queue', 'cdm', 'cra_site'],
      summary: '68 total outstanding queries across study; 14 aged >14d (5 RECIST endpoint-critical at Sites 104 & 317).',
      affectedEntity: 'Site 104 (Boston) & Site 317 (Charité Berlin)',
      siteId: '317',
      openItems: [
        { id: 'QRY-104-089', desc: 'Subj 104-003 Form TU-01: Target lesion diameter 28mm in eCRF vs 36mm on scan worksheet [Endpoint-Critical]', age: '16d', owner: 'Site 104 Coordinator' },
        { id: 'QRY-317-044', desc: 'Subj 317-005 Form TU-01: Thoracic CT 5mm slice thickness protocol deviation [Endpoint-Critical]', age: '12d', owner: 'BioClinica ICR / Site 317' }
      ]
    },
    {
      id: 'drv-4',
      factor: 'Pending investigator casebook sign-offs',
      weight: 13,
      impact: '13% (~0.8d)',
      status: 'Moderate',
      roles: ['all', 'cra_site'],
      summary: '18 completed subject casebooks awaiting Principal Investigator electronic signatures.',
      affectedEntity: 'Site 405 (Seoul National Univ.) & Site 104 (Boston)',
      siteId: '405',
      openItems: [
        { id: 'SIG-405-BATCH', desc: '12 completed casebooks awaiting PI e-signature at Site 405 (Sub-I delegation pending)', age: '11d', owner: 'Tom Becker (TMF Lead)' },
        { id: 'SIG-104-BATCH', desc: '6 completed casebooks awaiting final PI sign-off at Site 104 post query closure', age: '8d', owner: 'Dr. Vance (Site 104 PI)' }
      ]
    }
  ];

  $: filteredCategoryBars = activeRole === 'all'
    ? readinessByCategoryBars
    : readinessByCategoryBars.filter(c => c.roles.includes(activeRole));

  $: filteredDelayDrivers = activeRole === 'all'
    ? leadingDelayDrivers
    : leadingDelayDrivers.filter(d => d.roles.includes(activeRole));

  // Sparkline/Trend points for the dual-axis chart
  const weeks = ['Week -4', 'Week -3', 'Week -2', 'Week -1', 'Current'];
</script>

<div class="space-y-6">

  <!-- ========================================================================= -->
  <!-- PAGE HEADER                                                               -->
  <!-- ========================================================================= -->
  <div class="flex flex-col sm:flex-row sm:items-end justify-between gap-3 pb-1">
    <div>
      <div class="flex items-center gap-2.5 flex-wrap">
        <h1 class="text-2xl sm:text-[26px] font-bold tracking-tight text-slate-900 font-display">
          Study {study.protocol} &middot; Overview
        </h1>
        <span class="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/80 text-[11px] font-semibold">
          Active
        </span>
      </div>
      <p class="text-sm text-slate-500 mt-1">
        Oncology (NSCLC) &middot; Phase III &middot; Global &mdash; 158 of 220 subjects clean, Potential DBL 6 days after target.
      </p>
    </div>
    <div class="text-left sm:text-right shrink-0">
      <div class="text-xs font-medium text-slate-500">Data refreshed 31 Oct 2026, 08:00 UTC</div>
      <div class="text-[11px] text-slate-400 mt-0.5">EDC, Safety, Central Lab, eCOA, Coding</div>
    </div>
  </div>

  <!-- ========================================================================= -->
  <!-- 4 TOP KPI CARDS                                                           -->
  <!-- ========================================================================= -->
  <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
    
    <!-- 1. Overall Readiness -->
    <div class="db-card p-5 flex flex-col justify-between">
      <div class="flex items-center justify-between gap-3">
        <div>
          <div class="text-xs font-semibold text-slate-500">Overall Readiness</div>
          <div class="flex items-baseline gap-1 mt-1.5">
            <span class="text-3xl font-bold text-slate-900 num-tabular tracking-tight">{study.overallReadinessScore}</span>
            <span class="text-sm text-slate-400 font-medium">/100</span>
          </div>
          <div class="text-xs text-slate-600 mt-1">
            <strong class="font-semibold text-slate-800">158/220</strong> clean subjects
          </div>
        </div>

        <!-- Ring gauge -->
        <div class="relative w-14 h-14 shrink-0 flex items-center justify-center">
          <svg class="w-14 h-14 -rotate-90" viewBox="0 0 36 36">
            <circle cx="18" cy="18" r="14" fill="none" class="stroke-slate-100" stroke-width="3.5" />
            <circle
              cx="18" cy="18" r="14" fill="none"
              class="stroke-blue-600"
              stroke-width="3.5"
              stroke-dasharray="88"
              stroke-dashoffset={88 - (88 * study.overallReadinessScore / 100)}
              stroke-linecap="round"
            />
          </svg>
          <span class="absolute text-xs font-bold text-slate-800 num-tabular">{study.overallReadinessScore}%</span>
        </div>
      </div>

      <div class="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
        <button
          type="button"
          on:click={() => showReadinessDefinitionModal = true}
          class="text-blue-600 hover:text-blue-700 font-semibold hover:underline flex items-center gap-1 cursor-pointer"
        >
          <HelpCircle size={13} />
          <span>How it's calculated</span>
        </button>
        <button
          type="button"
          on:click={() => onSelectTab('digital_twin', 'edc_cleaning', true)}
          class="text-slate-500 hover:text-slate-800 font-medium cursor-pointer"
        >
          Weights &rarr;
        </button>
      </div>
    </div>

    <!-- 2. Potential DBL Date -->
    <div class="db-card p-5 flex flex-col justify-between">
      <div>
        <div class="flex items-center justify-between gap-2">
          <span class="text-xs font-semibold text-slate-500">Potential DBL Date</span>
          <span class="text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200/70">
            Moderate conf.
          </span>
        </div>
        <div class="text-2xl font-bold text-slate-900 mt-1.5 num-tabular tracking-tight">
          21 Dec 2026
        </div>
        <div class="text-xs text-slate-500 mt-1">
          Target: <strong class="font-semibold text-slate-700">15 Dec 2026</strong> (unchanged)
        </div>
      </div>
      <div class="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
        <span class="font-semibold text-rose-600">+6 days after target</span>
        <span class="text-slate-400 num-tabular">18–22 Dec</span>
      </div>
    </div>

    <!-- 3. Critical Blockers -->
    <div class="db-card p-5 flex flex-col justify-between">
      <div>
        <div class="flex items-center justify-between">
          <span class="text-xs font-semibold text-slate-500">Critical Blockers</span>
          <div class="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
            <AlertTriangle size={15} />
          </div>
        </div>
        <div class="text-3xl font-bold text-slate-900 mt-1.5 num-tabular tracking-tight">
          {study.criticalBlockersCount}
        </div>
        <div class="text-xs text-slate-500 mt-1">
          2 SAEs &middot; 2 Labs &middot; 3 Queries &middot; 1 PI
        </div>
      </div>
      <div class="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
        <span class="text-emerald-600 font-semibold">Improved 1d this week</span>
        <button
          type="button"
          on:click={() => onSelectTab('digital_twin')}
          class="text-blue-600 font-semibold hover:underline cursor-pointer"
        >
          Drill down &rarr;
        </button>
      </div>
    </div>

    <!-- 4. Higher-Risk Sites -->
    <button
      type="button"
      class="db-card-interactive p-5 cursor-pointer group flex flex-col justify-between text-left"
      on:click={() => onSelectTab('risk_matrix')}
    >
      <div class="w-full">
        <div class="flex items-center justify-between">
          <span class="text-xs font-semibold text-slate-500">Higher-Risk Sites</span>
          <ChevronRight size={16} class="text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" />
        </div>
        <div class="text-3xl font-bold text-slate-900 mt-1.5 num-tabular tracking-tight">
          {study.highRiskSitesCount} <span class="text-base font-medium text-slate-400">/ {study.totalSites}</span>
        </div>
        <div class="text-xs text-slate-500 mt-1">
          Sites 104 (Critical), 317, 405
        </div>
      </div>
      <div class="mt-4 pt-3 border-t border-slate-100 w-full text-xs font-semibold text-blue-600 group-hover:underline">
        Inspect sites &amp; vendor risks &rarr;
      </div>
    </button>

  </div>

  <!-- ========================================================================= -->
  <!-- TRACEABILITY OF HOW READINESS SCORE HAS ARRIVED (Image 6 Manager Spec)    -->
  <!-- "Readiness by category" clickable bars -> opens Readiness Tab derivation  -->
  <!-- ========================================================================= -->
  <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
    
    <!-- Left 7 Cols: Readiness by Category (Clickable Bars -> Readiness Tab) -->
    <div class="lg:col-span-7 bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
      <div>
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
          <div>
            <div class="flex items-center space-x-2">
              <h3 class="text-sm font-extrabold text-slate-900">Readiness by category</h3>
              <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                Click any bar to inspect derivation in Readiness Tab
              </span>
            </div>
            <p class="text-[11px] text-slate-500 mt-0.5">
              Traceability of how the 72/100 study readiness score is derived across core clinical data parameters.
            </p>
          </div>

          <button
            type="button"
            on:click={() => onSelectTab('digital_twin', 'edc_cleaning', true)}
            class="shrink-0 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 border border-slate-200 hover:border-blue-300 font-bold text-xs flex items-center space-x-1.5 transition-colors cursor-pointer"
          >
            <Sliders size={13} />
            <span>Configuration of the weightage</span>
          </button>
        </div>

        <!-- 6 Clickable Bars matching Image 6: 92%, 85%, 65%, 90%, 75%, 80% -->
        <div class="space-y-3 mt-4">
          {#each filteredCategoryBars as cat}
            <button
              type="button"
              on:click={() => onSelectTab('digital_twin', cat.id, false)}
              class="w-full text-left p-2.5 rounded-lg hover:bg-blue-50/60 border border-transparent hover:border-blue-200 transition-all group cursor-pointer"
            >
              <div class="flex items-center justify-between text-xs font-bold text-slate-800">
                <span class="group-hover:text-blue-700 flex items-center space-x-1.5">
                  <span>{cat.label}</span>
                  <span class="text-[10px] font-normal text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">
                    (Click to view how {cat.pct}% is derived &rarr;)
                  </span>
                </span>
                <span class="font-extrabold num-tabular {cat.pct < 70 ? 'text-amber-600' : cat.pct < 80 ? 'text-amber-600' : 'text-emerald-700'}">
                  {cat.pct}%
                </span>
              </div>
              <div class="w-full bg-slate-100 rounded-full h-2.5 mt-1.5 overflow-hidden">
                <div
                  class="h-full rounded-full transition-all duration-500 {cat.color === 'emerald' ? 'bg-emerald-500' : 'bg-amber-500'}"
                  style="width: {cat.pct}%"
                ></div>
              </div>
              <div class="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
                <span>{cat.summary}</span>
                <ChevronRight size={13} class="text-slate-400 group-hover:text-blue-600 shrink-0" />
              </div>
            </button>
          {/each}
        </div>
      </div>

      <!-- Footer matching Image 6 bottom summary -->
      <div class="mt-4 pt-3 border-t border-slate-100 grid grid-cols-3 gap-3 text-xs">
        <div>
          <span class="text-[10px] text-slate-400 uppercase font-bold block">Potential DBL Date</span>
          <strong class="text-sm font-extrabold text-slate-900">21 December 2026</strong>
        </div>
        <div>
          <span class="text-[10px] text-slate-400 uppercase font-bold block">Target DBL (Unchanged)</span>
          <strong class="text-sm font-extrabold text-slate-900">15 December 2026</strong>
        </div>
        <div>
          <span class="text-[10px] text-slate-400 uppercase font-bold block">Potential Delay</span>
          <strong class="text-sm font-extrabold text-rose-600">6 days after target</strong>
        </div>
      </div>
    </div>

    <!-- Right 5 Cols: DBL Readiness Trend & Study Milestones -->
    <div class="lg:col-span-5 bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between space-y-4">
      <div>
        <div class="flex items-center justify-between mb-2">
          <div>
            <h3 class="text-sm font-bold text-slate-900">Readiness &amp; Potential DBL Trajectory</h3>
            <p class="text-[11px] text-slate-500">4-week progression vs unchanged 15 Dec target</p>
          </div>
          <div class="flex items-center space-x-3 text-[10px] font-semibold">
            <span class="flex items-center space-x-1 text-blue-700">
              <span class="w-2.5 h-2.5 rounded-full bg-blue-600 inline-block"></span>
              <span>Readiness</span>
            </span>
            <span class="flex items-center space-x-1 text-rose-600">
              <span class="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block"></span>
              <span>Days after Target</span>
            </span>
          </div>
        </div>

        <!-- SVG Line Chart -->
        <div class="relative w-full h-36 pt-1">
          <svg class="w-full h-full overflow-visible" viewBox="0 0 280 120">
            <line x1="20" y1="15" x2="270" y2="15" stroke="#f1f5f9" stroke-dasharray="2" />
            <line x1="20" y1="50" x2="270" y2="50" stroke="#f1f5f9" stroke-dasharray="2" />
            <line x1="20" y1="85" x2="270" y2="85" stroke="#f1f5f9" stroke-dasharray="2" />
            <line x1="20" y1="110" x2="270" y2="110" stroke="#e2e8f0" />

            <text x="2" y="18" font-size="8" fill="#94a3b8">100%</text>
            <text x="2" y="53" font-size="8" fill="#94a3b8">75%</text>
            <text x="2" y="88" font-size="8" fill="#94a3b8">50%</text>

            <text x="272" y="18" font-size="8" fill="#f43f5e">+15d</text>
            <text x="272" y="53" font-size="8" fill="#f43f5e">+10d</text>
            <text x="272" y="88" font-size="8" fill="#f43f5e">+5d</text>

            <polyline
              fill="none"
              stroke="#2563eb"
              stroke-width="2.5"
              stroke-linecap="round"
              stroke-linejoin="round"
              points="35,52 90,49 145,46 200,44 255,43"
            />
            <polyline
              fill="none"
              stroke="#f43f5e"
              stroke-width="2.2"
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-dasharray="3 3"
              points="35,75 90,85 145,90 200,95 255,80"
            />

            {#each [52, 49, 46, 44, 43] as y, i}
              <circle cx={35 + i * 55} cy={y} r={i === 4 ? 4 : 3} class="fill-blue-600 stroke-white stroke-2" />
            {/each}
            {#each [75, 85, 90, 95, 80] as y, i}
              <circle cx={35 + i * 55} cy={y} r={i === 4 ? 4 : 3} class="fill-rose-500 stroke-white stroke-2" />
            {/each}

            <text x="242" y="36" font-size="9" font-weight="bold" fill="#1d4ed8">72/100</text>
            <text x="245" y="73" font-size="9" font-weight="bold" fill="#e11d48">+6d</text>
          </svg>
        </div>

        <div class="flex justify-between px-3 text-[10px] text-slate-500 font-medium">
          {#each weeks as w}
            <span>{w}</span>
          {/each}
        </div>
      </div>

      <!-- Compact Milestones Comparison (Target vs Potential DBL distinct) -->
      <div class="pt-3 border-t border-slate-100 space-y-2 text-xs">
        <div class="text-[11px] font-bold text-slate-700 uppercase tracking-wider">Key Milestone Dates</div>
        <div class="grid grid-cols-2 gap-2">
          <div class="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
            <span class="text-[10px] text-slate-500 block">Planned LSLV</span>
            <strong class="font-mono text-slate-900">30 Nov 2026</strong>
          </div>
          <div class="p-2.5 rounded-lg bg-blue-50/60 border border-blue-200">
            <span class="text-[10px] text-blue-800 font-semibold block">Target DBL (Unchanged)</span>
            <strong class="font-mono text-blue-950">15 Dec 2026</strong>
          </div>
          <div class="p-2.5 rounded-lg bg-rose-50/60 border border-rose-200 col-span-2 flex items-center justify-between">
            <div>
              <span class="text-[10px] text-rose-800 font-semibold block">Potential DBL Date (Based on Current Progress)</span>
              <strong class="font-mono text-rose-700 text-sm">21 Dec 2026 (Range: 18–22 Dec)</strong>
            </div>
            <span class="px-2 py-0.5 rounded bg-rose-100 text-rose-800 font-bold text-[10px]">
              6 days after target
            </span>
          </div>
        </div>
      </div>
    </div>

  </div>

  <!-- ========================================================================= -->
  <!-- SIDE-BY-SIDE: POTENTIAL DELAY DRIVERS & RECOMMENDED ACTIONS (Image 5 Blue)-->
  <!-- (Duplicate domain breakdown donut removed per manager instruction)        -->
  <!-- ========================================================================= -->
  <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
    
    <!-- LEFT SIDE: Potential Delay Drivers (Leading Reasons Only + Drill-down) -->
    <div class="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
      <div>
        <div class="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <div class="flex items-center space-x-2">
              <h3 class="text-sm font-extrabold text-slate-900">Potential delay drivers</h3>
              <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                Leading reasons only
              </span>
            </div>
            <p class="text-[11px] text-slate-500 mt-0.5">
              Click any driver to drill down: <strong>Driver &rarr; Affected sites or vendors &rarr; Individual open items</strong>
            </p>
          </div>
          <span class="text-[10px] text-slate-400 font-semibold uppercase">Contribution</span>
        </div>

        <div class="space-y-3 mt-4">
          {#each filteredDelayDrivers as driver}
            <div class="rounded-xl border transition-all {expandedDriverId === driver.id ? 'border-blue-300 bg-blue-50/20 shadow-2xs' : 'border-slate-200 bg-white'}">
              <button
                type="button"
                on:click={() => expandedDriverId = expandedDriverId === driver.id ? null : driver.id}
                class="w-full text-left p-3.5 cursor-pointer"
              >
                <div class="flex items-center justify-between text-xs font-bold text-slate-900">
                  <span class="flex items-center space-x-1.5">
                    <ChevronDown size={14} class="text-slate-400 transition-transform {expandedDriverId === driver.id ? 'rotate-180 text-blue-600' : ''}" />
                    <span>{driver.factor}</span>
                  </span>
                  <span class="font-extrabold {driver.weight >= 30 ? 'text-rose-600' : driver.weight >= 20 ? 'text-amber-600' : 'text-blue-600'}">
                    {driver.impact}
                  </span>
                </div>
                <div class="w-full bg-slate-100 rounded-full h-2 mt-2 overflow-hidden">
                  <div
                    class="h-full rounded-full {driver.weight >= 30 ? 'bg-rose-500' : driver.weight >= 20 ? 'bg-amber-500' : 'bg-blue-600'}"
                    style="width: {driver.weight}%"
                  ></div>
                </div>
                <p class="text-[11px] text-slate-600 mt-1.5">
                  {driver.summary}
                </p>
              </button>

              {#if expandedDriverId === driver.id}
                <div class="px-3.5 pb-3.5 pt-2 border-t border-slate-200/80 space-y-2 text-xs">
                  <div class="flex items-center justify-between text-[11px]">
                    <span class="text-slate-500"><strong>Affected Sites / Vendors:</strong> {driver.affectedEntity}</span>
                    <button
                      type="button"
                      on:click={() => onSelectSite(driver.siteId)}
                      class="text-blue-600 font-bold hover:underline cursor-pointer"
                    >
                      Open Site {driver.siteId} &rarr;
                    </button>
                  </div>
                  <div class="space-y-1.5">
                    {#each driver.openItems as item}
                      <div class="p-2 rounded-lg bg-white border border-slate-200 flex items-start justify-between gap-2 text-[11px]">
                        <div>
                          <span class="font-mono font-bold text-slate-900">{item.id}</span>
                          <span class="text-slate-700 ml-1">{item.desc}</span>
                          <div class="text-[10px] text-slate-400 mt-0.5">Owner: {item.owner}</div>
                        </div>
                        <span class="px-1.5 py-0.5 rounded bg-rose-50 text-rose-700 font-bold text-[10px] shrink-0">
                          {item.age}
                        </span>
                      </div>
                    {/each}
                  </div>
                </div>
              {/if}
            </div>
          {/each}
        </div>
      </div>

      <div class="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
        <span class="text-slate-500 text-[11px]">Aligned with Site 104 weights (35% / 30% / 22% / 13%)</span>
        <button
          type="button"
          on:click={() => onSelectTab('digital_twin')}
          class="font-bold text-blue-600 hover:text-blue-800 flex items-center space-x-1 cursor-pointer"
        >
          <span>Explore full readiness drill-down</span>
          <ArrowRight size={13} />
        </button>
      </div>
    </div>

    <!-- RIGHT SIDE: Recommended Actions (Aligned directly to the Potential Delay Drivers) -->
    <div class="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
      <div>
        <div class="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <div class="flex items-center space-x-2">
              <h3 class="text-sm font-extrabold text-slate-900">Recommended actions</h3>
              <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                Mapped to leading delay drivers
              </span>
            </div>
            <p class="text-[11px] text-slate-500 mt-0.5">
              Prioritized interventions directly addressing each leading potential delay driver on the left.
            </p>
          </div>
          <button
            type="button"
            on:click={() => onSelectTab('action_workbench')}
            class="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center space-x-1 cursor-pointer"
          >
            <span>Workbench</span>
            <ArrowRight size={13} />
          </button>
        </div>

        <div class="space-y-3 mt-4">
          {#each actions.slice(0, 4) as act, idx}
            <div
              class="p-3.5 rounded-xl border border-slate-200 hover:border-blue-400 bg-slate-50/50 hover:bg-blue-50/30 transition-all cursor-pointer"
              on:click={() => onSelectTab('action_workbench')}
              on:keydown={(e) => e.key === 'Enter' && onSelectTab('action_workbench')}
              role="button"
              tabindex="0"
            >
              <div class="flex items-center justify-between">
                <div class="flex items-center space-x-2">
                  <span class="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold {act.priority === 'Critical' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'}">
                    {act.priority} &middot; {act.id}
                  </span>
                  <span class="text-[10px] font-semibold text-slate-500">
                    Addresses Driver #{idx + 1} ({act.domain})
                  </span>
                </div>
                <span class="font-extrabold text-emerald-600 font-mono text-xs">
                  {act.delayImpact || `-${act.daysSaved} days`}
                </span>
              </div>

              <div class="font-bold text-slate-900 text-xs mt-1.5">
                {act.title || act.action}
              </div>
              <p class="text-[11px] text-slate-600 mt-0.5 leading-snug">
                {act.rationale}
              </p>

              <div class="flex items-center justify-between text-[10px] text-slate-500 mt-2 pt-2 border-t border-slate-200/70">
                <span><strong>Scope:</strong> {act.site} &middot; <strong>Owner:</strong> {act.owner}</span>
                <span class="font-mono">Due: {act.dueDate}</span>
              </div>
            </div>
          {/each}
        </div>
      </div>

      <div class="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
        <span class="text-slate-500 text-[11px]">
          Completing top 3 actions can recover <strong>4–6 days</strong> toward the 15 Dec target.
        </span>
        <button
          type="button"
          on:click={() => onSelectTab('action_workbench')}
          class="font-bold text-blue-600 hover:text-blue-800 text-xs flex items-center space-x-1 cursor-pointer"
        >
          <span>View all 12 actions</span>
          <ArrowRight size={13} />
        </button>
      </div>
    </div>

  </div>

  <!-- Footnote provenance (Image 5 Explicit Requirement) -->
  <div class="text-[11px] text-slate-500 flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-3 border-t border-slate-200">
    <div>
      <strong>Data refreshed: 31 October 2026, 08:00 UTC</strong> &middot; <strong>Sources: EDC, Safety, Central Lab, eCOA and Coding</strong>
    </div>
    <div class="font-medium text-slate-500">
      DBLock AI &middot; All prototype scores &amp; delay figures are illustrative dummy values with documented formulas
    </div>
  </div>

  <!-- ========================================================================= -->
  <!-- MODAL: "HOW IS THIS CALCULATED?" READINESS DEFINITION & 5-COMPONENT WEIGHTS-->
  <!-- (Image 5, 6, 7, 8 Requirement)                                            -->
  <!-- ========================================================================= -->
  {#if showReadinessDefinitionModal}
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div class="relative w-full max-w-2xl bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        <div class="px-6 py-4 bg-gradient-to-r from-blue-950 to-slate-900 text-white flex items-center justify-between">
          <div>
            <span class="text-[10px] font-bold uppercase tracking-wider text-blue-300 block">Readiness Score Definition</span>
            <h2 class="text-base font-extrabold text-white">How the 72/100 DBL Readiness Score is Calculated</h2>
          </div>
          <button
            type="button"
            on:click={() => showReadinessDefinitionModal = false}
            class="text-slate-300 hover:text-white p-1 rounded-lg"
          >
            <X size={18} />
          </button>
        </div>

        <div class="p-6 overflow-y-auto space-y-4 text-xs text-slate-700">
          <div class="p-3.5 rounded-lg bg-blue-50 border border-blue-200 text-blue-950 space-y-1">
            <div class="font-bold text-xs">Subject-Level Cleanliness Basis (Critical vs Non-Critical Weighted)</div>
            <p class="text-[11px] leading-relaxed">
              Readiness represents the share of enrolled subjects without outstanding issues (<strong>158 of 220 clean subjects = 71.8% &approx; 72/100</strong>), where subjects with critical blockers (18 subjects: open SAE discrepancies, endpoint-critical queries, overdue lab transfers) carry a <code>2.0x</code> penalty weight and non-critical items (44 subjects: routine queries, minor coding) carry a <code>0.5x</code> weight.
            </p>
          </div>

          <div>
            <h3 class="font-bold text-slate-900 text-xs uppercase tracking-wider mb-2">
              A. Five Major Components to Calculate the Score
            </h3>
            <div class="border border-slate-200 rounded-lg overflow-hidden">
              <table class="w-full text-left border-collapse text-xs">
                <thead class="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold border-b border-slate-200">
                  <tr>
                    <th class="py-2.5 px-3">Component</th>
                    <th class="py-2.5 px-3 text-right">Suggested Weight</th>
                    <th class="py-2.5 px-3">What it measures</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100">
                  {#each fiveScoreComponents as comp}
                    <tr>
                      <td class="py-2.5 px-3 font-bold text-slate-900">{comp.component}</td>
                      <td class="py-2.5 px-3 text-right font-extrabold text-blue-700">{comp.weight}</td>
                      <td class="py-2.5 px-3 text-slate-600">{comp.measures}</td>
                    </tr>
                  {/each}
                  <tr class="bg-slate-50 font-extrabold text-slate-900">
                    <td class="py-2.5 px-3">Total</td>
                    <td class="py-2.5 px-3 text-right text-blue-700">100%</td>
                    <td class="py-2.5 px-3 text-slate-500 font-normal">Configurable in Readiness Tab</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div class="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            type="button"
            on:click={() => {
              showReadinessDefinitionModal = false;
              onSelectTab('digital_twin', 'edc_cleaning', true);
            }}
            class="px-4 py-2 rounded-lg bg-blue-600 text-white font-bold text-xs hover:bg-blue-700 cursor-pointer"
          >
            Open Weightage Configuration &amp; 4-Level Drill-Down in Readiness Tab &rarr;
          </button>
          <button
            type="button"
            on:click={() => showReadinessDefinitionModal = false}
            class="px-3 py-1.5 rounded-lg bg-slate-200 text-slate-700 font-semibold text-xs hover:bg-slate-300 cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  {/if}

</div>
