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
      label: 'Site sign-offs (21 CFR Part 11)',
      pct: 75,
      color: 'amber',
      roles: ['all', 'my_queue', 'cra_site'],
      summary: '165 of 220 subject casebooks signed by PI; 18 overdue (8 Site 104, 6 Site 405, 4 Site 317)'
    },
    {
      id: 'safety_recon',
      label: 'Safety reconciliation (SDTM.AE / DD)',
      pct: 80,
      color: 'emerald',
      roles: ['all', 'my_queue', 'safety'],
      summary: '82 of 84 SAE cases reconciled between Rave & Argus; 2 critical discrepancies at Site 104'
    }
  ];

  const fiveScoreComponents = [
    {
      component: 'EDC data cleanliness',
      weight: '30%',
      score: 88,
      measures: 'eCRF completeness (92%), query closure (85%), SDV/SDR verification (87%)'
    },
    {
      component: 'External data reconciliation',
      weight: '25%',
      score: 65,
      measures: 'Central lab (#LXB-8921), eCOA PRO, BioClinica ICR, and safety feed alignment'
    },
    {
      component: 'Site readiness',
      weight: '20%',
      score: 75,
      measures: '21 CFR Part 11 Investigator casebook e-signatures (165/220 signed)'
    },
    {
      component: 'CDM completion',
      weight: '15%',
      score: 85,
      measures: 'MedDRA 27.0 / WHODrug C3 coding (90%) and Argus SAE reconciliation (80%)'
    },
    {
      component: 'Cross-functional readiness',
      weight: '10%',
      score: 80,
      measures: 'Clinical, pharmacovigilance, biostatistics, and regulatory lock approvals'
    }
  ];

  // Primary Delay Drivers with record-level open blockers and Ball-in-Court responsibility
  const leadingDelayDrivers = [
    {
      id: 'drv-1',
      factor: 'Safety reconciliation discrepancies',
      domainCode: 'SDTM.AE / DD',
      weight: 35,
      impact: '-2.1d',
      share: '35%',
      status: 'Critical',
      roles: ['all', 'my_queue', 'safety', 'cra_site'],
      summary: '2 unresolved SAE discordances between Rave EDC and Oracle Argus Safety at Site 104 blocking 08 Dec safety freeze.',
      affectedEntity: 'Site 104 (Boston Medical Center) · Oracle Argus Safety',
      siteId: '104',
      openItems: [
        { id: 'SAE-REC-104-01', desc: 'Subj 104-003 (Form AE-02): Grade 3 CRS onset date mismatch (Rave Oct 12 vs Argus Oct 14)', age: '12d', ballInCourt: 'PV Physician & Site 104 PI' },
        { id: 'SAE-REC-104-02', desc: 'Subj 104-012 (Form DD-01): Fatal Sepsis narrative missing certified hospice discharge summary', age: '9d', ballInCourt: 'Site 104 CRA (On-Site SDV)' }
      ]
    },
    {
      id: 'drv-2',
      factor: 'Central laboratory transfer overdue',
      domainCode: 'SDTM.LB / GF',
      weight: 30,
      impact: '-1.8d',
      share: '30%',
      status: 'Critical',
      roles: ['all', 'my_queue', 'vendor'],
      summary: 'LabCorp ctDNA NGS Batch #LXB-8921 (48 samples) failed SHA-256 checksum verification; 4 days past SLA.',
      affectedEntity: 'LabCorp Bioanalytical Geneva · Sites 104 & 317',
      siteId: '104',
      openItems: [
        { id: 'LXB-8921', desc: '48 ctDNA NGS samples (Cycles 4–6) failed SHA-256 integrity check; re-export in progress', age: '4d overdue', ballInCourt: 'LabCorp Vendor QA' },
        { id: 'LXB-8940', desc: 'Eurofins serum chemistry batch (112 samples) alkaline phosphatase drift verification', age: '1d overdue', ballInCourt: 'Sponsor External Data Lead' }
      ]
    },
    {
      id: 'drv-3',
      factor: 'Ageing primary endpoint RECIST queries',
      domainCode: 'SDTM.TU / TR',
      weight: 22,
      impact: '-1.3d',
      share: '22%',
      status: 'High',
      roles: ['all', 'my_queue', 'cdm', 'cra_site'],
      summary: '14 critical queries aged >14 days affecting RECIST 1.1 target lesion measurements at Sites 104 and 317.',
      affectedEntity: 'Site 104 (Boston) & Site 317 (Charité Berlin)',
      siteId: '317',
      openItems: [
        { id: 'QRY-104-089', desc: 'Subj 104-003 (Form TU-01): Target lesion sum diameter 28mm in eCRF vs 36mm on radiology worksheet', age: '16d', ballInCourt: 'Site 104 Coordinator' },
        { id: 'QRY-317-044', desc: 'Subj 317-005 (Form TU-01): Thoracic CT 5mm slice thickness deviation awaiting tie-breaker read', age: '12d', ballInCourt: 'BioClinica Central ICR' }
      ]
    },
    {
      id: 'drv-4',
      factor: 'Pending investigator 21 CFR Part 11 sign-offs',
      domainCode: 'eCRF Sign-Off',
      weight: 13,
      impact: '-0.8d',
      share: '13%',
      status: 'Moderate',
      roles: ['all', 'cra_site'],
      summary: '18 completed subject casebooks awaiting Principal Investigator electronic signatures across 3 sites.',
      affectedEntity: 'Site 104 (8), Site 405 (6), Site 317 (4)',
      siteId: '405',
      openItems: [
        { id: 'SIG-104-BATCH', desc: '8 completed casebooks at Site 104 ready for final PI signature following query closure', age: '8d', ballInCourt: 'Site 104 PI (Dr. Vance)' },
        { id: 'SIG-405-BATCH', desc: '6 completed casebooks at Site 405 awaiting delegated Sub-Investigator signature (PI on leave)', age: '11d', ballInCourt: 'Site 405 Sub-Investigator' },
        { id: 'SIG-317-BATCH', desc: '4 completed casebooks at Site 317 queued for weekly PI signing clinic', age: '6d', ballInCourt: 'Site 317 PI' }
      ]
    }
  ];

  $: filteredCategoryBars = activeRole === 'all'
    ? readinessByCategoryBars
    : readinessByCategoryBars.filter(c => c.roles.includes(activeRole));

  $: filteredDelayDrivers = activeRole === 'all'
    ? leadingDelayDrivers
    : leadingDelayDrivers.filter(d => d.roles.includes(activeRole));

</script>

<div class="space-y-6">

  <!-- ========================================================================= -->
  <!-- PAGE HEADER                                                               -->
  <!-- ========================================================================= -->
  <div class="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
    <div>
      <div class="flex items-center gap-2.5 flex-wrap">
        <h1 class="text-2xl sm:text-[26px] font-semibold tracking-tight text-slate-900 font-display">
          {study.protocol} &mdash; Executive Overview
        </h1>
        <span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-xs font-medium">
          <span class="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
          <span>Pre-Lock Window</span>
        </span>
      </div>
      <p class="text-sm text-slate-500 mt-1">
        {study.title} &middot; 158 of 220 enrolled subjects clean (71.8%)
      </p>
    </div>
    <div class="text-left sm:text-right shrink-0">
      <div class="text-xs font-medium text-slate-500 num-tabular">Snapshot: 31 Oct 2026, 08:00 UTC</div>
      <div class="text-[11px] text-slate-400 mt-0.5">Rave EDC &middot; Argus Safety &middot; LabCorp &middot; BioClinica &middot; Signant</div>
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
          <div class="text-xs font-medium text-slate-500">Clean Patient Readiness</div>
          <div class="flex items-baseline gap-1 mt-1.5">
            <span class="text-3xl font-semibold text-slate-900 num-tabular tracking-tight font-display">{study.overallReadinessScore}%</span>
          </div>
          <div class="text-xs text-slate-500 mt-1 num-tabular">
            <strong class="font-semibold text-slate-800">158 / 220</strong> subjects lock-ready
          </div>
        </div>

        <div class="relative w-14 h-14 shrink-0 flex items-center justify-center">
          <svg class="w-14 h-14 -rotate-90" viewBox="0 0 36 36">
            <circle cx="18" cy="18" r="14" fill="none" class="stroke-slate-100" stroke-width="3.2" />
            <circle
              cx="18" cy="18" r="14" fill="none"
              class="stroke-blue-600"
              stroke-width="3.2"
              stroke-dasharray="88"
              stroke-dashoffset={88 - (88 * study.overallReadinessScore / 100)}
              stroke-linecap="round"
            />
          </svg>
          <span class="absolute text-[11px] font-semibold text-slate-800 num-tabular">72/100</span>
        </div>
      </div>

      <div class="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
        <button
          type="button"
          on:click={() => showReadinessDefinitionModal = true}
          class="text-slate-600 hover:text-slate-900 font-medium flex items-center gap-1 cursor-pointer"
        >
          <HelpCircle size={13} class="text-slate-400" />
          <span>Scoring model</span>
        </button>
        <button
          type="button"
          on:click={() => onSelectTab('digital_twin', 'edc_cleaning', true)}
          class="text-blue-600 hover:text-blue-800 font-medium cursor-pointer"
        >
          Weights &rarr;
        </button>
      </div>
    </div>

    <!-- 2. Forecast DBL Date -->
    <div class="db-card p-5 flex flex-col justify-between">
      <div>
        <div class="flex items-center justify-between gap-2">
          <span class="text-xs font-medium text-slate-500">Forecast DBL Date</span>
          <span class="text-[11px] font-semibold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md num-tabular">
            +6d variance
          </span>
        </div>
        <div class="text-3xl font-semibold text-slate-900 mt-1.5 num-tabular tracking-tight font-display">
          21 Dec 2026
        </div>
        <div class="text-xs text-slate-500 mt-1 num-tabular">
          Target DBL: <strong class="font-semibold text-slate-800">15 Dec 2026</strong>
        </div>
      </div>
      <div class="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
        <span class="text-slate-500">90% CI: <strong class="text-slate-700 num-tabular">18–22 Dec</strong></span>
        <button
          type="button"
          on:click={() => onSelectTab('simulator')}
          class="text-blue-600 hover:text-blue-800 font-medium cursor-pointer"
        >
          Simulate &rarr;
        </button>
      </div>
    </div>

    <!-- 3. Critical Blockers -->
    <div class="db-card p-5 flex flex-col justify-between">
      <div>
        <div class="flex items-center justify-between">
          <span class="text-xs font-medium text-slate-500">Hard-Gate Blockers</span>
          <span class="w-2 h-2 rounded-full bg-rose-500"></span>
        </div>
        <div class="text-3xl font-semibold text-slate-900 mt-1.5 num-tabular tracking-tight font-display">
          {study.criticalBlockersCount}
        </div>
        <div class="text-xs text-slate-500 mt-1">
          2 SAEs &middot; 2 Labs &middot; 3 Queries &middot; 1 PI Batch
        </div>
      </div>
      <div class="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
        <span class="text-emerald-600 font-medium">-1d net burn-down vs W-1</span>
        <button
          type="button"
          on:click={() => onSelectTab('digital_twin')}
          class="text-blue-600 hover:text-blue-800 font-medium cursor-pointer"
        >
          Inspect &rarr;
        </button>
      </div>
    </div>

    <!-- 4. High-Risk Sites -->
    <button
      type="button"
      class="db-card-interactive p-5 cursor-pointer group flex flex-col justify-between text-left"
      on:click={() => onSelectTab('risk_matrix')}
    >
      <div class="w-full">
        <div class="flex items-center justify-between">
          <span class="text-xs font-medium text-slate-500">High-Risk Sites</span>
          <ChevronRight size={15} class="text-slate-400 group-hover:text-slate-900 group-hover:translate-x-0.5 transition-all" />
        </div>
        <div class="text-3xl font-semibold text-slate-900 mt-1.5 num-tabular tracking-tight font-display">
          {study.highRiskSitesCount} <span class="text-lg font-normal text-slate-400">/ {study.totalSites}</span>
        </div>
        <div class="text-xs text-slate-500 mt-1">
          Site 104 (Boston), Site 317 (Berlin), Site 405 (Seoul)
        </div>
      </div>
      <div class="mt-4 pt-3 border-t border-slate-100 w-full text-xs font-medium text-blue-600 group-hover:text-blue-800">
        Open site &amp; vendor heatmap &rarr;
      </div>
    </button>

  </div>

  <!-- ========================================================================= -->
  <!-- Domain readiness -->
  <div class="db-card p-6 flex flex-col justify-between">
    <div>
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100">
        <div>
          <h3 class="text-base font-semibold text-slate-900">Readiness by Clinical Domain</h3>
          <p class="text-xs text-slate-500 mt-0.5">
            Select any domain to inspect form-level completion and open query records.
          </p>
        </div>

        <button
          type="button"
          on:click={() => onSelectTab('digital_twin', 'edc_cleaning', true)}
          class="shrink-0 px-3 py-1.5 rounded-xl bg-slate-100/80 hover:bg-slate-200/70 text-slate-700 font-medium text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <Sliders size={13} />
          <span>Configure Weights</span>
        </button>
      </div>

      <div class="space-y-2.5 mt-4">
        {#each filteredCategoryBars as cat}
          <button
            type="button"
            on:click={() => onSelectTab('digital_twin', cat.id, false)}
            class="w-full text-left p-3 rounded-xl hover:bg-slate-50 transition-colors group cursor-pointer"
          >
            <div class="flex items-center justify-between text-xs">
              <span class="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">
                {cat.label}
              </span>
              <span class="font-semibold num-tabular {cat.pct < 70 ? 'text-rose-600' : cat.pct < 80 ? 'text-amber-600' : 'text-slate-900'}">
                {cat.pct}%
              </span>
            </div>
            <div class="w-full bg-slate-100 rounded-full h-1.5 mt-2 overflow-hidden">
              <div
                class="h-full rounded-full transition-all duration-500 {cat.pct < 70 ? 'bg-rose-500' : cat.pct < 80 ? 'bg-amber-500' : 'bg-emerald-500'}"
                style="width: {cat.pct}%"
              ></div>
            </div>
            <div class="text-xs text-slate-500 mt-1.5 flex items-center justify-between">
              <span>{cat.summary}</span>
              <ChevronRight size={13} class="text-slate-300 group-hover:text-slate-600 shrink-0" />
            </div>
          </button>
        {/each}
      </div>
    </div>

    <div class="mt-5 pt-4 border-t border-slate-100 grid grid-cols-3 gap-4 text-xs">
      <div>
        <span class="text-[11px] text-slate-400 block">LSLV Cut-Off</span>
        <strong class="text-sm font-semibold text-slate-900 num-tabular">30 Nov 2026</strong>
      </div>
      <div>
        <span class="text-[11px] text-slate-400 block">Target DBL</span>
        <strong class="text-sm font-semibold text-slate-900 num-tabular">15 Dec 2026</strong>
      </div>
      <div>
        <span class="text-[11px] text-slate-400 block">Forecast DBL</span>
        <strong class="text-sm font-semibold text-rose-600 num-tabular">21 Dec 2026 (+6d)</strong>
      </div>
    </div>
  </div>

  <!-- ========================================================================= -->
  <!-- BOTTOM ROW: DELAY DRIVERS & RECOMMENDED ACTIONS                           -->
  <!-- ========================================================================= -->
  <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
    
    <!-- LEFT SIDE: Critical-Path Delay Drivers -->
    <div class="db-card p-6 flex flex-col justify-between">
      <div>
        <div class="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <h3 class="text-base font-semibold text-slate-900">Critical-Path Delay Drivers</h3>
            <p class="text-xs text-slate-500 mt-0.5">
              Root causes of the +6.0d schedule variance and current Ball-in-Court ownership.
            </p>
          </div>
          <span class="text-xs text-slate-400 font-medium">Impact</span>
        </div>

        <div class="space-y-3 mt-4">
          {#each filteredDelayDrivers as driver}
            <div class="rounded-xl border transition-all {expandedDriverId === driver.id ? 'border-slate-300 bg-slate-50/50' : 'border-slate-200/70 bg-white hover:border-slate-300'}">
              <button
                type="button"
                on:click={() => expandedDriverId = expandedDriverId === driver.id ? null : driver.id}
                class="w-full text-left p-4 cursor-pointer"
              >
                <div class="flex items-center justify-between text-xs">
                  <div class="flex items-center gap-2">
                    <ChevronDown size={14} class="text-slate-400 transition-transform {expandedDriverId === driver.id ? 'rotate-180 text-slate-900' : ''}" />
                    <span class="font-semibold text-slate-900 text-[13px]">{driver.factor}</span>
                    <span class="font-mono text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">{driver.domainCode}</span>
                  </div>
                  <div class="flex items-center gap-2 num-tabular">
                    <span class="text-xs text-slate-400">{driver.share}</span>
                    <span class="font-mono font-semibold text-rose-600">{driver.impact}</span>
                  </div>
                </div>
                <div class="w-full bg-slate-100 rounded-full h-1.5 mt-2.5 overflow-hidden">
                  <div
                    class="h-full rounded-full {driver.weight >= 30 ? 'bg-rose-500' : driver.weight >= 20 ? 'bg-amber-500' : 'bg-blue-600'}"
                    style="width: {driver.weight}%"
                  ></div>
                </div>
                <p class="text-xs text-slate-500 mt-2 leading-relaxed">
                  {driver.summary}
                </p>
              </button>

              {#if expandedDriverId === driver.id}
                <div class="px-4 pb-4 pt-3 border-t border-slate-200/60 space-y-2.5 text-xs">
                  <div class="flex items-center justify-between text-xs">
                    <span class="text-slate-500">{driver.affectedEntity}</span>
                    <button
                      type="button"
                      on:click={() => onSelectSite(driver.siteId)}
                      class="text-blue-600 font-medium hover:underline cursor-pointer"
                    >
                      Inspect Site {driver.siteId} &rarr;
                    </button>
                  </div>
                  <div class="space-y-2">
                    {#each driver.openItems as item}
                      <div class="p-3 rounded-xl bg-white border border-slate-200/80 flex flex-col gap-1.5">
                        <div class="flex items-center justify-between gap-2">
                          <span class="font-mono font-semibold text-slate-900 text-xs">{item.id}</span>
                          <div class="flex items-center gap-1.5">
                            <span class="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium text-[11px]">
                              Ball in Court: {item.ballInCourt}
                            </span>
                            <span class="px-1.5 py-0.5 rounded-md bg-rose-50 text-rose-700 font-mono font-medium text-[11px] num-tabular">
                              {item.age}
                            </span>
                          </div>
                        </div>
                        <div class="text-xs text-slate-600 leading-relaxed">{item.desc}</div>
                      </div>
                    {/each}
                  </div>
                </div>
              {/if}
            </div>
          {/each}
        </div>
      </div>

      <div class="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
        <span class="text-slate-400 num-tabular">Total unmitigated slip: +6.0 days</span>
        <button
          type="button"
          on:click={() => onSelectTab('digital_twin')}
          class="font-semibold text-slate-900 hover:text-blue-600 flex items-center gap-1 cursor-pointer transition-colors"
        >
          <span>Open Readiness Tracker</span>
          <ArrowRight size={13} />
        </button>
      </div>
    </div>

    <!-- RIGHT SIDE: Recommended Actions -->
    <div class="db-card p-6 flex flex-col justify-between">
      <div>
        <div class="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <h3 class="text-base font-semibold text-slate-900">Recommended Interventions</h3>
            <p class="text-xs text-slate-500 mt-0.5">
              High-leverage operational actions mapped to the 4 primary delay drivers.
            </p>
          </div>
          <button
            type="button"
            on:click={() => onSelectTab('action_workbench')}
            class="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
          >
            <span>All Actions</span>
            <ArrowRight size={13} />
          </button>
        </div>

        <div class="space-y-3 mt-4">
          {#each actions.slice(0, 4) as act}
            <div
              class="p-4 rounded-xl border border-slate-200/80 hover:border-slate-300 bg-white hover:bg-slate-50/50 transition-all cursor-pointer group"
              on:click={() => onSelectTab('action_workbench')}
              on:keydown={(e) => e.key === 'Enter' && onSelectTab('action_workbench')}
              role="button"
              tabindex="0"
            >
              <div class="flex items-center justify-between gap-2">
                <div class="flex items-center gap-2">
                  <span class="w-2 h-2 rounded-full {act.priority === 'Critical' ? 'bg-rose-500' : 'bg-amber-500'}"></span>
                  <span class="font-mono text-xs font-semibold text-slate-500">{act.id}</span>
                  <span class="text-xs text-slate-400">&middot;</span>
                  <span class="text-xs font-medium text-slate-600">{act.domain}</span>
                </div>
                <span class="font-mono font-semibold text-emerald-600 text-xs num-tabular bg-emerald-50 px-2 py-0.5 rounded-md">
                  {act.delayImpact}
                </span>
              </div>

              <div class="font-semibold text-slate-900 text-sm mt-2 group-hover:text-blue-600 transition-colors">
                {act.title || act.action}
              </div>
              <p class="text-xs text-slate-500 mt-1 leading-relaxed">
                {act.rationale}
              </p>

              <div class="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 mt-3 pt-2.5 border-t border-slate-100">
                <div class="flex items-center gap-2">
                  <span class="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium text-[11px]">
                    Ball in Court: {act.ballInCourt || act.ownerName}
                  </span>
                  <span class="text-slate-400 text-[11px]">{act.scope || act.site}</span>
                </div>
                <span class="font-mono text-[11px] text-slate-400 num-tabular">SLA: {act.dueDate}</span>
              </div>
            </div>
          {/each}
        </div>
      </div>

      <div class="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
        <span class="text-slate-500">
          Executing top 3 interventions recovers <strong class="text-slate-800 num-tabular">~4.3 days</strong> (overlap-adjusted).
        </span>
        <button
          type="button"
          on:click={() => onSelectTab('action_workbench')}
          class="font-semibold text-slate-900 hover:text-blue-600 flex items-center gap-1 cursor-pointer transition-colors"
        >
          <span>Open Action Queue</span>
          <ArrowRight size={13} />
        </button>
      </div>
    </div>

  </div>

  <!-- ========================================================================= -->
  <!-- MODAL: SCORING MODEL & 5-COMPONENT WEIGHTS                                -->
  <!-- ========================================================================= -->
  {#if showReadinessDefinitionModal}
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div class="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200/80 overflow-hidden flex flex-col max-h-[90vh]">
        <div class="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <span class="text-[11px] font-medium text-slate-400 block">Scoring Methodology</span>
            <h2 class="text-base font-semibold text-slate-900">Clean Patient Readiness Model (72/100)</h2>
          </div>
          <button
            type="button"
            on:click={() => showReadinessDefinitionModal = false}
            class="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        <div class="p-6 overflow-y-auto space-y-5 text-xs text-slate-600">
          <div class="p-4 rounded-xl bg-slate-50 border border-slate-200/70 space-y-1.5">
            <div class="font-semibold text-slate-900">Subject-Level Cleanliness Basis</div>
            <p class="leading-relaxed">
              Readiness measures the proportion of enrolled subjects meeting all database lock criteria (<strong class="text-slate-900">158 of 220 clean subjects = 71.8%</strong>). Subjects with hard-gate blockers (18 subjects: open SAE discrepancies, RECIST primary endpoint queries, overdue central lab transfers) carry a <code>2.0x</code> penalty weight; non-critical items (44 subjects) carry a <code>0.5x</code> weight.
            </p>
          </div>

          <div>
            <h3 class="font-semibold text-slate-900 text-xs mb-2.5">
              Domain Component Weights
            </h3>
            <div class="border border-slate-200/80 rounded-xl overflow-hidden">
              <table class="w-full text-left border-collapse text-xs">
                <thead class="bg-slate-50 text-slate-500 text-[11px] font-medium border-b border-slate-200/80">
                  <tr>
                    <th class="py-2.5 px-4 font-medium">Component</th>
                    <th class="py-2.5 px-3 text-right font-medium">Weight</th>
                    <th class="py-2.5 px-3 text-right font-medium">Current</th>
                    <th class="py-2.5 px-4 font-medium">Clinical Scope</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100">
                  {#each fiveScoreComponents as comp}
                    <tr>
                      <td class="py-2.5 px-4 font-medium text-slate-900">{comp.component}</td>
                      <td class="py-2.5 px-3 text-right font-mono text-slate-700 num-tabular">{comp.weight}</td>
                      <td class="py-2.5 px-3 text-right font-mono font-semibold text-slate-900 num-tabular">{comp.score}%</td>
                      <td class="py-2.5 px-4 text-slate-500">{comp.measures}</td>
                    </tr>
                  {/each}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div class="px-6 py-4 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between">
          <button
            type="button"
            on:click={() => {
              showReadinessDefinitionModal = false;
              onSelectTab('digital_twin', 'edc_cleaning', true);
            }}
            class="px-4 py-2 rounded-xl bg-slate-900 text-white font-semibold text-xs hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Configure Weights in Readiness Tab &rarr;
          </button>
          <button
            type="button"
            on:click={() => showReadinessDefinitionModal = false}
            class="px-4 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 font-medium text-xs hover:bg-slate-50 cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  {/if}

</div>
