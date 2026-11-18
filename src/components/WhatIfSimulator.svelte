<script lang="ts">
  import {
    workflow,
    addToPlan,
    dateAfter
  } from '../lib/workflow';
  import {
    Calendar,
    AlertTriangle,
    CheckCircle2,
    Clock,
    Info,
    Check,
    Compass,
    Sliders,
    Activity,
    Layers,
    ChevronRight
  } from '@lucide/svelte';

  export let interventions: any[];
  export let study: any;
  export let activeRole: string = 'all';
  export let onSelectTab: (tab: string) => void;

  let categoryFilter = 'all';
  let interventionStateView = 'after';

  // Active intervention inspected in the 4-Level Drill-Down
  let activeDrillInterventionId = 'INT-01';

  const interventionDrillCatalog: Record<string, any> = {
    'INT-01': {
      id: 'INT-01',
      category: 'Reconciliation',
      title: 'Resolve remaining SAE discrepancies',
      assumptions: 'Joint CRA & PV physician teleconference held within 24h; Site 104 PI signs updated Form AE-02 & DD-01 within 48h.',
      overlapNote: 'Overlaps 18% with INT-02 (LabCorp transfer) and INT-05 (PI sign-offs) because Subject 104-003 and 104-012 casebook locks require both SAE clearance and lab/PI sign-off.',
      affectedEntities: 'Site 104 (Boston Medical Center) · Subjects SUBJ-104-003 & SUBJ-104-012 · Vendor: Oracle Argus Safety',
      records: [
        {
          recordId: 'SAE-REC-104-01',
          desc: 'Subj 104-003 Grade 3 CRS onset discordance (Rave Oct 12 vs Argus Oct 14)',
          readinessBefore: '72/100',
          readinessAfter: '76/100',
          potentialDblBefore: '21 Dec 2026',
          potentialDblAfter: '19 Dec 2026'
        },
        {
          recordId: 'SAE-REC-104-02',
          desc: 'Subj 104-012 Fatal Sepsis Form DD-01 certified discharge summary reconciliation',
          readinessBefore: '76/100',
          readinessAfter: '79/100',
          potentialDblBefore: '19 Dec 2026',
          potentialDblAfter: '18 Dec 2026'
        }
      ]
    },
    'INT-02': {
      id: 'INT-02',
      category: 'Operational',
      title: 'Expedite central laboratory data transfer',
      assumptions: 'LabCorp bioinformatics re-exports FASTQ package from primary sequencer cache; SHA-256 checksum passes by Nov 01.',
      overlapNote: 'Laboratory transfer and reconciliation actions overlap on Site 104 critical path; combined impact is damped by 0.82x rather than simply additive.',
      affectedEntities: 'Sites 104 (Boston) & 317 (Charité Berlin) · Subject SUBJ-104-019 · Vendor Transfer: LabCorp Batch #LXB-8921',
      records: [
        {
          recordId: 'LXB-8921',
          desc: '48 ctDNA NGS biomarker samples (Cycle 4–6) overdue 4 days',
          readinessBefore: '72/100',
          readinessAfter: '77/100',
          potentialDblBefore: '21 Dec 2026',
          potentialDblAfter: '19 Dec 2026'
        }
      ]
    },
    'INT-03': {
      id: 'INT-03',
      category: 'Data management',
      title: 'Prioritise ageing primary endpoint queries',
      assumptions: 'Dedicated 2-hour query resolution sprint with Site 104 & Site 317 coordinators and BioClinica central imaging reader.',
      overlapNote: 'Overlaps with INT-05 (PI sign-offs) as casebooks cannot receive final PI e-signature until open queries are closed.',
      affectedEntities: 'Sites 104 & 317 · Subjects SUBJ-104-003, SUBJ-317-005 · Vendor: BioClinica Imaging',
      records: [
        {
          recordId: 'QRY-104-089',
          desc: 'Subj 104-003 Form TU-01 Target Lesion sum diameter mismatch (28mm vs 36mm) [Endpoint-Critical]',
          readinessBefore: '72/100',
          readinessAfter: '74/100',
          potentialDblBefore: '21 Dec 2026',
          potentialDblAfter: '20 Dec 2026'
        },
        {
          recordId: 'QRY-317-044',
          desc: 'Subj 317-005 Form TU-01 Thoracic CT 5mm slice thickness deviation [Endpoint-Critical]',
          readinessBefore: '74/100',
          readinessAfter: '75/100',
          potentialDblBefore: '20 Dec 2026',
          potentialDblAfter: '19 Dec 2026'
        }
      ]
    },
    'INT-04': {
      id: 'INT-04',
      category: 'Operational',
      title: 'Add temporary data-cleaning capacity (5 days)',
      assumptions: 'Two senior CDMs deployed for a 5-day sprint to clear 54 non-critical open queries across EU and US sites.',
      overlapNote: 'Partially overlaps with routine site query closure velocity.',
      affectedEntities: 'Study-wide (18 sites) · Subjects SUBJ-208-014, SUBJ-104-021 (+36 routine subjects)',
      records: [
        {
          recordId: 'QRY-208-112',
          desc: '38 non-critical ConMed and demographic queries at Site 208 (St. Mary\'s Hospital)',
          readinessBefore: '72/100',
          readinessAfter: '75/100',
          potentialDblBefore: '21 Dec 2026',
          potentialDblAfter: '20 Dec 2026'
        }
      ]
    },
    'INT-05': {
      id: 'INT-05',
      category: 'Site',
      title: 'Obtain investigator sign-offs',
      assumptions: 'Sub-investigator delegation approved at Site 405; 1-hour signing clinic held with PIs at Sites 104 and 405.',
      overlapNote: 'Dependent on prior query and SAE resolution on those subject casebooks.',
      affectedEntities: 'Sites 104 (Boston) & 405 (Seoul National Univ. Hospital) · 18 completed subject casebooks',
      records: [
        {
          recordId: 'SIG-405-C4C6',
          desc: '18 completed subject eCRF casebooks awaiting PI electronic signature',
          readinessBefore: '72/100',
          readinessAfter: '74/100',
          potentialDblBefore: '21 Dec 2026',
          potentialDblAfter: '20 Dec 2026'
        }
      ]
    },
    'INT-06': {
      id: 'INT-06',
      category: 'Reconciliation',
      title: 'Complete medical coding review',
      assumptions: 'Batch approval of 38 outstanding MedDRA 27.0 and WHODrug Global C3 terms by medical coding specialist.',
      overlapNote: 'Low overlap; independent CDM dictionary review track.',
      affectedEntities: 'Study-wide (Sites 104, 608, 677) · 12 manual coder review terms',
      records: [
        {
          recordId: 'COD-608-019',
          desc: 'MedDRA 27.0 & WHODrug C3 manual synonym verification for 12 subjects',
          readinessBefore: '72/100',
          readinessAfter: '74/100',
          potentialDblBefore: '21 Dec 2026',
          potentialDblAfter: '20 Dec 2026'
        }
      ]
    }
  };

  $: activeDrill = interventionDrillCatalog[activeDrillInterventionId] || interventionDrillCatalog['INT-01'];

  function toggleIntervention(id: string) {
    activeDrillInterventionId = id;
    workflow.update(s => ({
      ...s,
      selected: s.selected.includes(id)
        ? s.selected.filter(x => x !== id)
        : [...s.selected, id]
    }));
  }

  function clearAllSelections() {
    workflow.update(s => ({ ...s, selected: [] }));
  }

  $: selectedItems = interventions.filter(i => $workflow.selected.includes(i.id));

  $: if (activeRole === 'safety') {
    categoryFilter = 'reconciliation';
  } else if (activeRole === 'vendor') {
    categoryFilter = 'operational';
  } else if (activeRole === 'cdm') {
    categoryFilter = 'datamgmt';
  } else if (activeRole === 'cra_site') {
    categoryFilter = 'site';
  } else if (activeRole === 'all' || activeRole === 'my_queue') {
    categoryFilter = 'all';
  }

  $: filteredInterventions = interventions.filter(i => {
    if (categoryFilter === 'operational' && i.category !== 'Operational') return false;
    if (categoryFilter === 'reconciliation' && i.category !== 'Reconciliation') return false;
    if (categoryFilter === 'site' && i.category !== 'Site') return false;
    if (categoryFilter === 'datamgmt' && i.category !== 'Data management') return false;
    return true;
  });

  // Non-additive overlap calculation (Laboratory transfer and reconciliation actions overlap)
  $: rawReduction = selectedItems.reduce((acc, curr) => acc + curr.delayReductionDays, 0);
  $: damping = selectedItems.length > 1 ? 0.82 : 1.0;
  $: delayReduction = Math.min(study.delayDays, Number((rawReduction * damping).toFixed(1)));
  $: remainingDelay = Math.max(0, Number((study.delayDays - delayReduction).toFixed(1)));
  $: potentialDblSimulated = dateAfter(study.plannedDbl, remainingDelay);

  // Readiness score gain
  $: scoreGain = Math.min(28, selectedItems.reduce((acc, curr) => acc + curr.readinessScoreGain, 0));
  $: simulatedScore = Math.min(100, study.overallReadinessScore + scoreGain);

  // Critical blockers resolved
  $: blockersResolved = Math.min(study.criticalBlockersCount, selectedItems.length * 2);
  $: remainingBlockers = Math.max(0, study.criticalBlockersCount - blockersResolved);

  function handleAddToPlan() {
    addToPlan();
    setTimeout(() => {
      onSelectTab('action_workbench');
    }, 400);
  }
</script>

<div class="space-y-6">

  <!-- ========================================================================= -->
  <!-- PAGE HEADER                                                               -->
  <!-- ========================================================================= -->
  <div class="flex flex-col sm:flex-row sm:items-end justify-between gap-3 pb-1">
    <div>
      <h1 class="text-2xl sm:text-[26px] font-bold tracking-tight text-slate-900 font-display">
        What-If Intervention Simulator
      </h1>
      <p class="text-sm text-slate-500 mt-1">
        Toggle interventions to model non-additive critical-path overlaps and shift the Potential DBL date.
      </p>
    </div>
    <div class="px-3 py-1.5 rounded-xl bg-white border border-slate-200/90 text-xs font-semibold text-slate-700 shadow-2xs shrink-0 num-tabular">
      Simulated DBL: <span class="text-emerald-600">{potentialDblSimulated}</span>
    </div>
  </div>

  <!-- ========================================================================= -->
  <!-- TOP 3 KPI CARDS (Renamed to Potential DBL Date Wording per Image 3 Blue)  -->
  <!-- ========================================================================= -->
  <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
    
    <!-- Current potential DBL date -->
    <div class="db-card p-5 flex items-center gap-4">
      <div class="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
        <Calendar size={20} />
      </div>
      <div>
        <div class="text-xs font-semibold text-slate-500">Current Potential DBL</div>
        <div class="text-xl font-bold text-slate-900 mt-1 num-tabular tracking-tight">
          21 Dec 2026
        </div>
        <div class="text-xs text-rose-600 font-medium mt-0.5">
          6 days after Target (15 Dec)
        </div>
      </div>
    </div>

    <!-- Simulated potential DBL date -->
    <div class="db-card p-5 flex items-center gap-4">
      <div class="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
        <Activity size={20} />
      </div>
      <div>
        <div class="text-xs font-semibold text-slate-500">Simulated Potential DBL</div>
        <div class="flex items-baseline gap-1.5 mt-1">
          <span class="text-xl font-bold text-emerald-700 num-tabular tracking-tight">{potentialDblSimulated}</span>
          <span class="text-xs font-semibold text-slate-500">({remainingDelay}d)</span>
        </div>
        <div class="text-xs text-slate-500 mt-0.5">
          Readiness: <strong class="text-slate-800">{study.overallReadinessScore} &rarr; {simulatedScore}/100</strong>
        </div>
      </div>
    </div>

    <!-- Critical-Path Overlap Adjustment -->
    <div class="db-card p-5 flex items-center gap-4">
      <div class="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
        <AlertTriangle size={20} />
      </div>
      <div>
        <div class="text-xs font-semibold text-slate-500">Overlap-Adjusted Shift</div>
        <div class="text-lg font-bold text-slate-900 mt-1 num-tabular tracking-tight">
          {rawReduction.toFixed(1)}d &rarr; {delayReduction.toFixed(1)}d earlier
        </div>
        <div class="text-xs text-amber-700 font-medium mt-0.5">
          0.82x overlap damping applied
        </div>
      </div>
    </div>

  </div>

  <!-- ========================================================================= -->
  <!-- 3 COLUMN SIGNATURE LAYOUT: 1. SELECT -> 2. POTENTIAL DBL -> 3. BASIS      -->
  <!-- ========================================================================= -->
  <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
    
    <div class="lg:col-span-5 bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
      <div>
        <span class="text-[10px] font-extrabold uppercase tracking-wider text-blue-600 block">
          Intervention Category Filter
        </span>
        <h2 class="text-sm font-bold text-slate-900">1. Select interventions to simulate</h2>
        <p class="text-[11px] text-slate-500 mt-0.5">
          Click any checkbox to simulate; click any row to inspect its 4-level assumptions, overlaps, and resolved records below.
        </p>
      </div>

      <div class="flex items-center space-x-3 border-b border-slate-200 pb-2 text-xs font-semibold text-slate-600 overflow-x-auto">
        <button
          type="button"
          on:click={() => categoryFilter = 'all'}
          class="pb-2 -mb-2 border-b-2 transition-colors cursor-pointer whitespace-nowrap {categoryFilter === 'all' ? 'border-blue-600 text-blue-600 font-bold' : 'border-transparent hover:text-slate-900'}"
        >
          All categories
        </button>
        <button
          type="button"
          on:click={() => categoryFilter = 'operational'}
          class="pb-2 -mb-2 border-b-2 transition-colors cursor-pointer whitespace-nowrap {categoryFilter === 'operational' ? 'border-blue-600 text-blue-600 font-bold' : 'border-transparent hover:text-slate-900'}"
        >
          Operational
        </button>
        <button
          type="button"
          on:click={() => categoryFilter = 'reconciliation'}
          class="pb-2 -mb-2 border-b-2 transition-colors cursor-pointer whitespace-nowrap {categoryFilter === 'reconciliation' ? 'border-blue-600 text-blue-600 font-bold' : 'border-transparent hover:text-slate-900'}"
        >
          Reconciliation
        </button>
        <button
          type="button"
          on:click={() => categoryFilter = 'site'}
          class="pb-2 -mb-2 border-b-2 transition-colors cursor-pointer whitespace-nowrap {categoryFilter === 'site' ? 'border-blue-600 text-blue-600 font-bold' : 'border-transparent hover:text-slate-900'}"
        >
          Site
        </button>
        <button
          type="button"
          on:click={() => categoryFilter = 'datamgmt'}
          class="pb-2 -mb-2 border-b-2 transition-colors cursor-pointer whitespace-nowrap {categoryFilter === 'datamgmt' ? 'border-blue-600 text-blue-600 font-bold' : 'border-transparent hover:text-slate-900'}"
        >
          Data management
        </button>
      </div>

      <div class="space-y-2.5">
        {#each filteredInterventions as item}
          {@const isChecked = $workflow.selected.includes(item.id)}
          <div
            class="flex items-start space-x-3 p-3 rounded-xl border transition-all cursor-pointer {activeDrillInterventionId === item.id ? 'bg-blue-50/60 border-blue-500 ring-1 ring-blue-300' : isChecked ? 'bg-blue-50/30 border-blue-300' : 'bg-white border-slate-200 hover:border-slate-300'}"
            on:click={() => activeDrillInterventionId = item.id}
            on:keydown={(e) => e.key === 'Enter' && (activeDrillInterventionId = item.id)}
            role="button"
            tabindex="0"
          >
            <input
              type="checkbox"
              checked={isChecked}
              on:click|stopPropagation
              on:change={() => toggleIntervention(item.id)}
              class="rounded text-blue-600 focus:ring-blue-500 w-4 h-4 mt-0.5 shrink-0 cursor-pointer"
            />
            <div class="flex-1 min-w-0">
              <div class="flex items-center justify-between gap-1">
                <span class="text-xs font-bold text-slate-900">
                  {item.title}
                </span>
                <span class="px-2 py-0.5 rounded text-[10px] font-bold shrink-0 {item.impactTier === 'high' ? 'bg-rose-100 text-rose-800' : item.impactTier === 'medium' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'}">
                  {item.category} &middot; -{item.delayReductionDays}d raw
                </span>
              </div>
              <div class="text-[11px] text-slate-500 mt-0.5 flex items-center justify-between">
                <span>{item.itemsCount}</span>
                <span class="text-[10px] text-blue-600 font-semibold">Inspect intervention &darr;</span>
              </div>
            </div>
          </div>
        {/each}
      </div>

      <div class="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
        <span class="font-bold text-blue-600">{selectedItems.length} actions selected</span>
        <button
          type="button"
          on:click={clearAllSelections}
          class="text-blue-600 hover:text-blue-800 font-semibold cursor-pointer"
        >
          Clear all
        </button>
      </div>
    </div>

    <!-- COLUMN 2: POTENTIAL DBL DATE COMPARISON (4 COLS) -->
    <div class="lg:col-span-4 bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
      <div>
        <h2 class="text-sm font-bold text-slate-900">2. Resulting Potential DBL Date</h2>
        <p class="text-[11px] text-slate-500 mt-0.5">
          Shows how selected interventions move the <strong>Potential DBL date</strong> toward the unchanged <strong>15 December 2026</strong> target.
        </p>
      </div>

      <div class="flex justify-end">
        <div class="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs font-semibold">
          <button
            type="button"
            on:click={() => interventionStateView = 'before'}
            class="px-2.5 py-1 rounded-md transition-all cursor-pointer {interventionStateView === 'before' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'}"
          >
            Before intervention
          </button>
          <button
            type="button"
            on:click={() => interventionStateView = 'after'}
            class="px-2.5 py-1 rounded-md transition-all cursor-pointer {interventionStateView === 'after' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'}"
          >
            After intervention
          </button>
        </div>
      </div>

      <div class="grid grid-cols-3 gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
        <div class="space-y-0.5">
          <div class="text-[10px] text-slate-500 uppercase font-bold">Potential DBL</div>
          <strong class="text-sm font-extrabold text-slate-900 block num-tabular">
            {interventionStateView === 'after' ? potentialDblSimulated : study.forecastDbl}
          </strong>
          <span class="text-[10px] font-bold {interventionStateView === 'after' ? 'text-emerald-600' : 'text-rose-600'}">
            {interventionStateView === 'after' ? `${remainingDelay}d after target` : `6d after target`}
          </span>
        </div>

        <div class="space-y-0.5 border-x border-slate-200 px-1">
          <div class="text-[10px] text-slate-500 uppercase font-bold">Readiness</div>
          <strong class="text-sm font-extrabold text-slate-900 block num-tabular">
            {interventionStateView === 'after' ? `${simulatedScore}/100` : `${study.overallReadinessScore}/100`}
          </strong>
          <span class="text-[10px] font-bold text-emerald-600">
            {interventionStateView === 'after' ? `+${scoreGain} pts` : 'Baseline'}
          </span>
        </div>

        <div class="space-y-0.5">
          <div class="text-[10px] text-slate-500 uppercase font-bold">Blockers</div>
          <strong class="text-sm font-extrabold text-slate-900 block num-tabular">
            {interventionStateView === 'after' ? remainingBlockers : study.criticalBlockersCount}
          </strong>
          <span class="text-[10px] font-bold text-emerald-600">
            {interventionStateView === 'after' ? `-${blockersResolved} resolved` : '8 active'}
          </span>
        </div>
      </div>

      <!-- Potential DBL Date Comparison Chart -->
      <div class="space-y-2 pt-1">
        <h3 class="text-xs font-bold text-slate-900 uppercase tracking-wider">
          Potential DBL Date vs Target DBL (Unchanged)
        </h3>

        <div class="bg-white rounded-xl border border-slate-200 p-3 relative">
          <svg viewBox="0 0 340 130" class="w-full h-auto overflow-visible text-[10px]">
            <line x1="85" y1="5" x2="85" y2="105" stroke="#94a3b8" stroke-width="1.5" stroke-dasharray="3,3" />
            
            <text x="5" y="20" fill="#64748b" font-weight="600" font-size="8.5">Current potential DBL</text>
            <text x="5" y="28" fill="#94a3b8" font-size="7.5">(No intervention)</text>
            <line x1="85" y1="22" x2="250" y2="22" stroke="#94a3b8" stroke-width="2.5" stroke-linecap="round" />
            <circle cx="250" cy="22" r="4.5" fill="#64748b" />
            <text x="260" y="25" fill="#475569" font-family="monospace" font-weight="700" font-size="8.5">2026-12-21</text>

            <text x="5" y="48" fill="#1e40af" font-weight="700" font-size="8.5">Simulated potential DBL</text>
            <line
              x1="85"
              y1="46"
              x2={interventionStateView === 'after' ? 140 : 250}
              y2="46"
              stroke="#2563eb"
              stroke-width="3"
              stroke-linecap="round"
            />
            <circle
              cx={interventionStateView === 'after' ? 140 : 250}
              cy="46"
              r="5"
              fill="#2563eb"
            />
            <text
              x={interventionStateView === 'after' ? 150 : 260}
              y="49"
              fill="#1e40af"
              font-family="monospace"
              font-weight="700"
              font-size="8.5"
            >
              {interventionStateView === 'after' ? potentialDblSimulated : study.forecastDbl}
            </text>

            <text x="5" y="73" fill="#065f46" font-weight="600" font-size="8.5">Best case potential DBL</text>
            <line x1="85" y1="71" x2="115" y2="71" stroke="#059669" stroke-width="2.5" stroke-linecap="round" />
            <circle cx="115" cy="71" r="4.5" fill="#059669" />
            <text x="125" y="74" fill="#065f46" font-family="monospace" font-weight="700" font-size="8.5">2026-12-16</text>

            <text x="5" y="98" fill="#9f1239" font-weight="600" font-size="8.5">At-risk potential DBL</text>
            <line x1="85" y1="96" x2="300" y2="96" stroke="#f43f5e" stroke-width="2.5" stroke-linecap="round" />
            <circle cx="300" cy="96" r="4.5" fill="#f43f5e" />
            <text x="306" y="99" fill="#9f1239" font-family="monospace" font-weight="700" font-size="8.5">2026-12-23</text>

            <text x="85" y="117" fill="#1e293b" font-weight="800" font-size="8" text-anchor="middle">Target DBL (Unchanged)</text>
            <text x="85" y="126" fill="#64748b" font-family="monospace" font-weight="700" font-size="7.5" text-anchor="middle">2026-12-15</text>
          </svg>
        </div>
      </div>
    </div>

    <!-- COLUMN 3: OVERLAP & CALCULATION BASIS SUMMARY (3 COLS) -->
    <div class="lg:col-span-3 bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
      <div>
        <h2 class="text-sm font-bold text-slate-900">3. Potential DBL Shift &amp; Overlap Basis</h2>
        <p class="text-[11px] text-slate-500 mt-0.5">
          Defined basis for how the simulated potential DBL date is calculated.
        </p>
      </div>

      <div class="p-3.5 rounded-xl bg-blue-50/70 border border-blue-200 text-left">
        <div class="text-[10px] text-slate-600 uppercase font-bold">
          Potential DBL Date Shift
        </div>
        <div class="text-xl font-extrabold text-slate-900 mt-1 num-tabular">
          21 Dec &rarr; {potentialDblSimulated}
        </div>
        <div class="text-[11px] text-blue-800 font-semibold mt-0.5">
          Net shift: -{delayReduction.toFixed(1)} days (Moderate confidence)
        </div>
      </div>

      <!-- Amber Overlap Warning Alert (Image 3 Requirement) -->
      <div class="p-3 rounded-lg bg-amber-50 border border-amber-200 flex items-start space-x-2 text-xs text-amber-900">
        <AlertTriangle size={15} class="text-amber-600 shrink-0 mt-0.5" />
        <p class="text-[11px] leading-snug">
          <strong>Non-Additive Overlap Rule:</strong> Laboratory transfer and reconciliation actions overlap. Combined impact (<strong>{delayReduction.toFixed(1)}d</strong>) is lower than the simple sum of their individual effects (<strong>{rawReduction.toFixed(1)}d</strong>).
        </p>
      </div>

      <div class="space-y-1.5 text-xs text-slate-700 pt-1">
        <strong class="font-bold text-slate-900 text-xs block uppercase tracking-wide">Key assumptions</strong>
        <ul class="space-y-1 text-[11px] text-slate-600 leading-snug">
          <li>&bull; Selected actions completed within 48 hours</li>
          <li>&bull; Shared critical-path dependency at Site 104 damped by 0.82x</li>
          <li>&bull; Current query closure velocity continues</li>
        </ul>
      </div>

      <button
        type="button"
        on:click={handleAddToPlan}
        class="w-full py-2.5 px-4 rounded-lg bg-blue-600 text-white font-extrabold text-xs hover:bg-blue-700 transition-colors shadow-sm cursor-pointer"
      >
        Confirm in Action Workbench &rarr;
      </button>
    </div>

  </div>

  <!-- ========================================================================= -->
  <!-- 4-LEVEL INTERVENTION DRILL-DOWN PANEL (Image 3 Blue Requirement)          -->
  <!-- ========================================================================= -->
  <div class="bg-white rounded-xl border-2 border-blue-200 p-5 shadow-xs space-y-4">
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
      <div>
        <div class="flex items-center space-x-2">
          <Layers size={16} class="text-blue-600" />
          <h3 class="text-sm font-extrabold text-slate-900">
            4-Level Intervention Traceability Drill-Down: {activeDrill.id} &ndash; {activeDrill.title}
          </h3>
          <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
            Category: {activeDrill.category}
          </span>
        </div>
        <p class="text-[11px] text-slate-500 mt-0.5">
          Click any intervention in Column 1 above to inspect its specific assumptions, overlap interactions, affected entities, and record-level before/after readiness and potential DBL date.
        </p>
      </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
      <div class="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
        <div class="text-[10px] font-extrabold uppercase tracking-wider text-blue-700">
          Category &rarr; Specific Intervention &rarr; Assumptions &amp; Overlaps
        </div>
        <div>
          <strong class="text-slate-900 block">Operational Assumptions:</strong>
          <p class="text-slate-600 text-[11px] mt-0.5 leading-relaxed">{activeDrill.assumptions}</p>
        </div>
        <div class="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-[11px]">
          <strong>Overlap with other selected interventions:</strong> {activeDrill.overlapNote}
        </div>
      </div>

      <div class="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
        <div class="text-[10px] font-extrabold uppercase tracking-wider text-blue-700">
          Intervention &rarr; Affected Sites, Subjects or Vendor Transfers
        </div>
        <div class="p-3 bg-white rounded-lg border border-slate-200 space-y-1.5">
          <div class="font-bold text-slate-900">{activeDrill.affectedEntities}</div>
          <p class="text-[11px] text-slate-500">
            Directly linked to source records in Medidata Rave EDC, Oracle Argus Safety, and external vendor feeds.
          </p>
        </div>
      </div>
    </div>

    <div class="space-y-2">
      <div class="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
        Items Resolved by Intervention, with Before &amp; After Readiness and Potential DBL Date
      </div>
      <div class="border border-slate-200 rounded-xl overflow-hidden">
        <table class="w-full text-left border-collapse text-xs">
          <thead class="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold border-b border-slate-200">
            <tr>
              <th class="py-2.5 px-3">Resolved Record ID</th>
              <th class="py-2.5 px-3">Item Description</th>
              <th class="py-2.5 px-3 text-center">Readiness (Before &rarr; After)</th>
              <th class="py-2.5 px-3 text-center">Potential DBL Date (Before &rarr; After)</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 font-medium text-slate-700">
            {#each activeDrill.records as rec}
              <tr class="hover:bg-slate-50">
                <td class="py-2.5 px-3 font-mono font-bold text-slate-900">{rec.recordId}</td>
                <td class="py-2.5 px-3 text-slate-800">{rec.desc}</td>
                <td class="py-2.5 px-3 text-center font-mono">
                  <span class="text-slate-500">{rec.readinessBefore}</span> &rarr; <strong class="text-emerald-700">{rec.readinessAfter}</strong>
                </td>
                <td class="py-2.5 px-3 text-center font-mono">
                  <span class="text-rose-600">{rec.potentialDblBefore}</span> &rarr; <strong class="text-emerald-700">{rec.potentialDblAfter}</strong>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    </div>
  </div>

</div>
