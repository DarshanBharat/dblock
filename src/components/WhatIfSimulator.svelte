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
    Activity
  } from '@lucide/svelte';

  export let interventions: any[];
  export let study: any;
  export let onSelectTab: (tab: string) => void;

  // Selected Category filter
  let categoryFilter = 'all'; // 'all' | 'operational' | 'reconciliation' | 'site' | 'datamgmt'

  // Toggle view: 'before' | 'after'
  let interventionStateView = 'after';

  function toggleIntervention(id: string) {
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

  // Filtered interventions
  $: filteredInterventions = interventions.filter(i => {
    if (categoryFilter === 'operational' && i.category !== 'Operational') return false;
    if (categoryFilter === 'reconciliation' && i.category !== 'Reconciliation') return false;
    if (categoryFilter === 'site' && i.category !== 'Site') return false;
    if (categoryFilter === 'datamgmt' && i.category !== 'Data management') return false;
    return true;
  });

  // Calculate dynamic outputs with non-linear overlap damping
  $: rawReduction = selectedItems.reduce((acc, curr) => acc + curr.delayReductionDays, 0);
  $: damping = selectedItems.length > 1 ? 0.82 : 1.0;
  $: delayReduction = Math.min(study.delayDays, Number((rawReduction * damping).toFixed(1)));
  $: remainingDelay = Math.max(0, Number((study.delayDays - delayReduction).toFixed(1)));
  $: forecastDblSimulated = dateAfter(study.plannedDbl, remainingDelay);

  // Readiness score gain
  $: scoreGain = Math.min(28, selectedItems.reduce((acc, curr) => acc + curr.readinessScoreGain, 0));
  $: simulatedScore = Math.min(100, study.overallReadinessScore + scoreGain);

  // Critical blockers resolved
  $: blockersResolved = Math.min(study.criticalBlockersCount, selectedItems.length * 2);
  $: remainingBlockers = Math.max(0, study.criticalBlockersCount - blockersResolved);

  // Delay avoided range
  $: minAvoided = Math.max(0, Number((delayReduction * 0.88).toFixed(1)));
  $: maxAvoided = Number((delayReduction * 1.2).toFixed(1));

  // Dynamic domain scores matching Image 8
  $: hasInt1 = $workflow.selected.includes('INT-01');
  $: hasInt2 = $workflow.selected.includes('INT-02');
  $: hasInt3 = $workflow.selected.includes('INT-03');
  $: hasInt4 = $workflow.selected.includes('INT-04');
  $: hasInt5 = $workflow.selected.includes('INT-05');
  $: hasInt6 = $workflow.selected.includes('INT-06');

  $: domainScores = {
    safety: { current: 48, after: 48 + (hasInt1 ? 30 : 0), delta: (hasInt1 ? 30 : 0) },
    lab: { current: 62, after: 62 + (hasInt2 ? 20 : 0), delta: (hasInt2 ? 20 : 0) },
    queries: { current: 70, after: 70 + (hasInt3 ? 8 : (selectedItems.length > 0 ? 5 : 0)), delta: (hasInt3 ? 8 : (selectedItems.length > 0 ? 5 : 0)) },
    coding: { current: 88, after: 88 + (hasInt6 ? 4 : (selectedItems.length > 0 ? 2 : 0)), delta: (hasInt6 ? 4 : (selectedItems.length > 0 ? 2 : 0)) },
    signOffs: { current: 80, after: 80 + (hasInt5 ? 4 : (selectedItems.length > 0 ? 2 : 0)), delta: (hasInt5 ? 4 : (selectedItems.length > 0 ? 2 : 0)) },
    ecoa: { current: 76, after: 76 + (hasInt4 ? 4 : (selectedItems.length > 0 ? 2 : 0)), delta: (hasInt4 ? 4 : (selectedItems.length > 0 ? 2 : 0)) }
  };

  let hasAddedToPlan = false;
  function handleAddToPlan() {
    addToPlan();
    hasAddedToPlan = true;
    setTimeout(() => {
      onSelectTab('action_workbench');
    }, 700);
  }
</script>

<div class="space-y-6">

  <!-- ========================================================================= -->
  <!-- HERO BANNER: WHAT-IF INTERVENTION SIMULATOR                               -->
  <!-- ========================================================================= -->
  <div class="rounded-2xl bg-gradient-to-r from-[#0d1b3e] via-[#10224d] to-[#122b68] text-white p-6 shadow-md border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
    <div class="max-w-xl z-10">
      <span class="text-[10px] font-extrabold uppercase tracking-widest text-blue-300">
        WHAT-IF INTERVENTION SIMULATOR
      </span>
      <h1 class="text-2xl sm:text-3xl font-extrabold text-white mt-1 tracking-tight">
        Explore actions. See the impact. Make better decisions.
      </h1>
      <p class="text-xs sm:text-sm text-slate-300 mt-1.5 leading-relaxed">
        Simulate different interventions to understand how they could change the forecast DBL date and readiness.
      </p>
    </div>

    <!-- Right: Curved Trajectory Graphics with Glowing Dot -->
    <div class="relative z-10 flex flex-col items-end text-right">
      <div class="text-xs text-blue-200">Better decisions today.</div>
      <div class="text-xs font-bold text-white mt-0.5">A faster, more predictable tomorrow.</div>
      <!-- SVG Glowing Trajectory Curve -->
      <svg class="w-64 h-12 mt-2 overflow-visible" viewBox="0 0 240 40">
        <path
          d="M 10 35 C 70 35, 120 15, 210 10"
          fill="none"
          stroke="rgba(96, 165, 250, 0.6)"
          stroke-width="2.5"
          stroke-linecap="round"
        />
        <circle cx="210" cy="10" r="5" fill="#38bdf8" />
        <circle cx="210" cy="10" r="10" fill="#38bdf8" opacity="0.3" class="animate-ping" />
      </svg>
    </div>

    <!-- Background decorative mesh -->
    <div class="absolute -right-10 -bottom-10 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
  </div>

  <!-- ========================================================================= -->
  <!-- TOP 3 KPI CARDS (Icon on LEFT matching Image 8)                           -->
  <!-- ========================================================================= -->
  <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
    
    <!-- Current forecast DBL date -->
    <div class="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex items-center space-x-3.5">
      <div class="w-11 h-11 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
        <Calendar size={22} />
      </div>
      <div>
        <div class="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Current forecast DBL date</div>
        <div class="text-2xl font-extrabold text-slate-900 mt-0.5 num-tabular">
          {study.forecastDbl}
          <span class="text-xs font-bold text-rose-600 ml-1.5">(+6 days vs. plan)</span>
        </div>
        <div class="text-[11px] text-slate-400 mt-0.5">Planned: {study.plannedDbl}</div>
      </div>
    </div>

    <!-- Overall readiness score -->
    <div class="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex items-center space-x-3.5">
      <div class="w-11 h-11 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
        <Activity size={22} />
      </div>
      <div>
        <div class="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Overall readiness score</div>
        <div class="flex items-baseline space-x-1.5 mt-0.5">
          <span class="text-2xl font-extrabold text-slate-900 num-tabular">{study.overallReadinessScore}/100</span>
          <span class="text-xs font-bold text-emerald-600">(+5 vs. last week)</span>
        </div>
      </div>
    </div>

    <!-- Critical blockers -->
    <div class="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex items-center space-x-3.5">
      <div class="w-11 h-11 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
        <AlertTriangle size={22} />
      </div>
      <div>
        <div class="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Critical blockers</div>
        <div class="text-2xl font-extrabold text-slate-900 mt-0.5 num-tabular">
          {study.criticalBlockersCount}
        </div>
        <div class="text-xs font-bold text-rose-600 mt-0.5">
          3 high-risk sites
        </div>
      </div>
    </div>

  </div>

  <!-- ========================================================================= -->
  <!-- 3 COLUMN SIGNATURE LAYOUT: 1. SELECT -> 2. PREDICTED IMPACT -> 3. SUMMARY -->
  <!-- ========================================================================= -->
  <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
    
    <!-- ======================================================================= -->
    <!-- COLUMN 1: SELECT INTERVENTIONS (5 COLS)                                 -->
    <!-- ======================================================================= -->
    <div class="lg:col-span-5 bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
      <div>
        <h2 class="text-sm font-bold text-slate-900">1. Select interventions to simulate</h2>
        <p class="text-[11px] text-slate-500 mt-0.5">
          Choose one or more actions to see the potential impact on DBL date and readiness.
        </p>
      </div>

      <!-- Filter tabs (Underline style matching Image 8) -->
      <div class="flex items-center space-x-4 border-b border-slate-200 pb-2 text-xs font-semibold text-slate-600">
        <button
          type="button"
          on:click={() => categoryFilter = 'all'}
          class="pb-2 -mb-2 border-b-2 transition-colors cursor-pointer {categoryFilter === 'all' ? 'border-blue-600 text-blue-600 font-bold' : 'border-transparent hover:text-slate-900'}"
        >
          All actions
        </button>
        <button
          type="button"
          on:click={() => categoryFilter = 'operational'}
          class="pb-2 -mb-2 border-b-2 transition-colors cursor-pointer {categoryFilter === 'operational' ? 'border-blue-600 text-blue-600 font-bold' : 'border-transparent hover:text-slate-900'}"
        >
          Operational
        </button>
        <button
          type="button"
          on:click={() => categoryFilter = 'reconciliation'}
          class="pb-2 -mb-2 border-b-2 transition-colors cursor-pointer {categoryFilter === 'reconciliation' ? 'border-blue-600 text-blue-600 font-bold' : 'border-transparent hover:text-slate-900'}"
        >
          Reconciliation
        </button>
        <button
          type="button"
          on:click={() => categoryFilter = 'site'}
          class="pb-2 -mb-2 border-b-2 transition-colors cursor-pointer {categoryFilter === 'site' ? 'border-blue-600 text-blue-600 font-bold' : 'border-transparent hover:text-slate-900'}"
        >
          Site
        </button>
        <button
          type="button"
          on:click={() => categoryFilter = 'datamgmt'}
          class="pb-2 -mb-2 border-b-2 transition-colors cursor-pointer {categoryFilter === 'datamgmt' ? 'border-blue-600 text-blue-600 font-bold' : 'border-transparent hover:text-slate-900'}"
        >
          Data management
        </button>
      </div>

      <!-- Checkbox List of Interventions matching Screenshot 8 -->
      <div class="space-y-2.5">
        {#each filteredInterventions as item}
          {@const isChecked = $workflow.selected.includes(item.id)}
          <label
            class="flex items-start space-x-3 p-3 rounded-xl border transition-all cursor-pointer group {isChecked ? 'bg-blue-50/50 border-blue-400 ring-1 ring-blue-300' : 'bg-white border-slate-200 hover:border-slate-300'}"
          >
            <input
              type="checkbox"
              checked={isChecked}
              on:change={() => toggleIntervention(item.id)}
              class="rounded text-blue-600 focus:ring-blue-500 w-4 h-4 mt-0.5 shrink-0 cursor-pointer"
            />
            <div class="flex-1 min-w-0">
              <div class="flex items-center justify-between gap-1">
                <span class="text-xs font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                  {item.title}
                </span>
                <span class="px-2 py-0.5 rounded text-[10px] font-bold shrink-0 {item.impactTier === 'high' ? 'bg-rose-100 text-rose-800' : item.impactTier === 'medium' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'}">
                  {item.impactLevel}
                </span>
              </div>
              <div class="text-[11px] text-slate-500 mt-0.5">{item.itemsCount}</div>
            </div>
          </label>
        {/each}
      </div>

      <!-- Footer count & Clear all -->
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

    <!-- ======================================================================= -->
    <!-- COLUMN 2: SEE THE PREDICTED IMPACT (4 COLS)                             -->
    <!-- ======================================================================= -->
    <div class="lg:col-span-4 bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
      <div>
        <h2 class="text-sm font-bold text-slate-900">2. See the predicted impact</h2>
        <p class="text-[11px] text-slate-500 mt-0.5">
          Estimated impact based on historical patterns and current study data.
        </p>
      </div>

      <!-- Before / After Toggle Buttons -->
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

      <!-- Sub-KPI Metrics Row (Recalculated!) -->
      <div class="grid grid-cols-3 gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
        <!-- Forecast DBL date -->
        <div class="space-y-0.5">
          <div class="flex items-center justify-center space-x-1 text-[10px] text-slate-500 uppercase font-bold">
            <Calendar size={11} class="text-blue-600" />
            <span>Forecast DBL Date</span>
          </div>
          <strong class="text-sm font-extrabold text-slate-900 block num-tabular">
            {interventionStateView === 'after' ? forecastDblSimulated : study.forecastDbl}
          </strong>
          <span class="text-[10px] font-bold {interventionStateView === 'after' ? 'text-emerald-600' : 'text-rose-600'}">
            {interventionStateView === 'after' ? `(-${delayReduction.toFixed(0)} days)` : `(+${study.delayDays}d vs plan)`}
          </span>
          <div class="text-[9px] text-slate-400">vs. current forecast</div>
        </div>

        <!-- Readiness score -->
        <div class="space-y-0.5 border-x border-slate-200 px-1">
          <div class="flex items-center justify-center space-x-1 text-[10px] text-slate-500 uppercase font-bold">
            <Activity size={11} class="text-emerald-600" />
            <span>Readiness score</span>
          </div>
          <strong class="text-sm font-extrabold text-slate-900 block num-tabular">
            {interventionStateView === 'after' ? `${simulatedScore}/100` : `${study.overallReadinessScore}/100`}
          </strong>
          <span class="text-[10px] font-bold text-emerald-600">
            {interventionStateView === 'after' ? `(+${scoreGain} points)` : 'Current baseline'}
          </span>
        </div>

        <!-- Critical blockers -->
        <div class="space-y-0.5">
          <div class="flex items-center justify-center space-x-1 text-[10px] text-slate-500 uppercase font-bold">
            <AlertTriangle size={11} class="text-rose-600" />
            <span>Critical blockers</span>
          </div>
          <strong class="text-sm font-extrabold text-slate-900 block num-tabular">
            {interventionStateView === 'after' ? remainingBlockers : study.criticalBlockersCount}
          </strong>
          <span class="text-[10px] font-bold text-emerald-600">
            {interventionStateView === 'after' ? `(-${blockersResolved})` : '8 on critical path'}
          </span>
          <div class="text-[9px] text-slate-400">{interventionStateView === 'after' ? 'remaining' : 'blockers'}</div>
        </div>
      </div>

      <!-- Forecast DBL date comparison timeline chart (Exact match to Screenshot 8) -->
      <div class="space-y-2 pt-1">
        <h3 class="text-xs font-bold text-slate-900 uppercase tracking-wider">
          Forecast DBL date comparison
        </h3>

        <!-- SVG Timeline Range Gantt Chart -->
        <div class="bg-white rounded-xl border border-slate-200 p-3 relative">
          <svg viewBox="0 0 340 130" class="w-full h-auto overflow-visible text-[10px]">
            <!-- Vertical Line for Planned DBL (2026-12-15) -->
            <line x1="85" y1="5" x2="85" y2="105" stroke="#94a3b8" stroke-width="1.5" stroke-dasharray="3,3" />
            
            <!-- Row 1: Current forecast (No action) -> Dec 21 -->
            <text x="5" y="20" fill="#64748b" font-weight="600" font-size="8.5">Current forecast</text>
            <text x="5" y="28" fill="#94a3b8" font-size="7.5">(No action)</text>
            <line x1="85" y1="22" x2="250" y2="22" stroke="#94a3b8" stroke-width="2.5" stroke-linecap="round" />
            <circle cx="250" cy="22" r="4.5" fill="#64748b" />
            <text x="260" y="25" fill="#475569" font-family="monospace" font-weight="700" font-size="8.5">2026-12-21</text>

            <!-- Row 2: Selected interventions -> Dec 17 -->
            <text x="5" y="48" fill="#1e40af" font-weight="700" font-size="8.5">Selected interventions</text>
            <line
              x1="85"
              y1="46"
              x2={interventionStateView === 'after' ? 140 : 250}
              y2="46"
              stroke="#2563eb"
              stroke-width="3"
              stroke-linecap="round"
              class="transition-all duration-500"
            />
            <circle
              cx={interventionStateView === 'after' ? 140 : 250}
              cy="46"
              r="5"
              fill="#2563eb"
              class="transition-all duration-500"
            />
            <text
              x={interventionStateView === 'after' ? 150 : 260}
              y="49"
              fill="#1e40af"
              font-family="monospace"
              font-weight="700"
              font-size="8.5"
            >
              {interventionStateView === 'after' ? forecastDblSimulated : study.forecastDbl}
            </text>

            <!-- Row 3: Best case scenario -> Dec 16 -->
            <text x="5" y="73" fill="#065f46" font-weight="600" font-size="8.5">Best case scenario</text>
            <line x1="85" y1="71" x2="115" y2="71" stroke="#059669" stroke-width="2.5" stroke-linecap="round" />
            <circle cx="115" cy="71" r="4.5" fill="#059669" />
            <text x="125" y="74" fill="#065f46" font-family="monospace" font-weight="700" font-size="8.5">2026-12-16</text>

            <!-- Row 4: At-risk scenario -> Dec 23 -->
            <text x="5" y="98" fill="#9f1239" font-weight="600" font-size="8.5">At-risk scenario</text>
            <line x1="85" y1="96" x2="300" y2="96" stroke="#f43f5e" stroke-width="2.5" stroke-linecap="round" />
            <circle cx="300" cy="96" r="4.5" fill="#f43f5e" />
            <text x="306" y="99" fill="#9f1239" font-family="monospace" font-weight="700" font-size="8.5">2026-12-23</text>

            <!-- Planned DBL Label below vertical line -->
            <text x="85" y="117" fill="#1e293b" font-weight="800" font-size="8" text-anchor="middle">Planned DBL</text>
            <text x="85" y="126" fill="#64748b" font-family="monospace" font-weight="700" font-size="7.5" text-anchor="middle">2026-12-15</text>
          </svg>
        </div>
      </div>
    </div>

    <!-- ======================================================================= -->
    <!-- COLUMN 3: IMPACT SUMMARY (3 COLS)                                       -->
    <!-- ======================================================================= -->
    <div class="lg:col-span-3 bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
      <div>
        <h2 class="text-sm font-bold text-slate-900">3. Impact summary</h2>
        <p class="text-[11px] text-slate-500 mt-0.5">
          Estimated range reflects uncertainty in data and execution timelines.
        </p>
      </div>

      <!-- Delay Avoided KPI Box -->
      <div class="p-3.5 rounded-xl bg-blue-50/70 border border-blue-200 text-left">
        <div class="flex items-center space-x-1.5 text-[10px] text-slate-600 uppercase font-bold">
          <Calendar size={13} class="text-blue-600" />
          <span>Estimated delay avoided</span>
        </div>
        <div class="text-2xl font-extrabold text-slate-900 mt-1 num-tabular">
          {minAvoided} &ndash; {maxAvoided} days
        </div>
        <div class="flex items-center space-x-1 text-[11px] text-slate-500 mt-0.5">
          <span>Confidence: <strong>Moderate</strong></span>
          <Info size={12} class="text-slate-400" />
        </div>
      </div>

      <!-- Green Alert Box: 65% delay exposure -->
      <div class="p-3 rounded-lg bg-emerald-50 border border-emerald-200 flex items-start space-x-2 text-xs text-emerald-900">
        <CheckCircle2 size={15} class="text-emerald-600 shrink-0 mt-0.5" />
        <p class="text-[11px] leading-snug">
          Combining SAE resolution and laboratory escalation addresses <strong>~65%</strong> of the current forecast delay exposure.
        </p>
      </div>

      <!-- Key Assumptions List -->
      <div class="space-y-1.5 text-xs text-slate-700 pt-1">
        <strong class="font-bold text-slate-900 text-xs block uppercase tracking-wide">Key assumptions</strong>
        <ul class="space-y-1 text-[11px] text-slate-600 leading-snug">
          <li class="flex items-start space-x-1.5">
            <span class="text-blue-600 font-bold">&bull;</span>
            <span>Selected actions completed within 48 hours</span>
          </li>
          <li class="flex items-start space-x-1.5">
            <span class="text-blue-600 font-bold">&bull;</span>
            <span>No new critical issues identified</span>
          </li>
          <li class="flex items-start space-x-1.5">
            <span class="text-blue-600 font-bold">&bull;</span>
            <span>Current query closure velocity continues</span>
          </li>
          <li class="flex items-start space-x-1.5">
            <span class="text-blue-600 font-bold">&bull;</span>
            <span>External data delivered as per vendor commitment</span>
          </li>
        </ul>
      </div>

      <!-- Amber Overlap Warning Alert -->
      <div class="p-3 rounded-lg bg-amber-50 border border-amber-200 flex items-start space-x-2 text-xs text-amber-900">
        <AlertTriangle size={15} class="text-amber-600 shrink-0 mt-0.5" />
        <p class="text-[11px] leading-snug">
          Laboratory transfer and reconciliation actions overlap. Combined impact may be lower than the sum of individual effects.
        </p>
      </div>
    </div>

  </div>

  <!-- ========================================================================= -->
  <!-- BOTTOM ROW: READINESS BY DOMAIN (LEFT 9 COLS) + TURN INSIGHT INTO ACTION  -->
  <!-- ========================================================================= -->
  <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
    
    <!-- Wide Left Panel: Impact on readiness by domain (9 Cols) -->
    <div class="lg:col-span-9 bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
      <div>
        <div class="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-2">
          <div>
            <h3 class="text-sm font-bold text-slate-900">Impact on readiness by domain</h3>
            <p class="text-[11px] text-slate-500">Expected improvement in readiness scores after selected interventions.</p>
          </div>

          <div class="flex items-center space-x-4 text-[11px]">
            <span class="flex items-center space-x-1.5 text-slate-500 font-medium">
              <span class="w-2.5 h-2.5 rounded-full bg-slate-400"></span>
              <span>Current</span>
            </span>
            <span class="flex items-center space-x-1.5 text-blue-700 font-bold">
              <span class="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
              <span>After intervention</span>
            </span>
            <span class="text-emerald-700 font-bold font-mono">&Delta; Change</span>
          </div>
        </div>

        <!-- 6 Domain Comparison Rows with Track, Gray/Blue Dots, Labels and Deltas -->
        <div class="space-y-3 pt-1 text-xs">
          
          <!-- Safety reconciliation -->
          <div class="flex items-center justify-between gap-3">
            <span class="w-44 shrink-0 text-[11px] font-semibold text-slate-700">Safety reconciliation</span>
            <div class="flex-1 bg-slate-100 rounded-full h-2.5 relative flex items-center">
              <div class="w-2.5 h-2.5 rounded-full bg-slate-400 absolute z-10 -ml-1" style="left: {domainScores.safety.current}%;"></div>
              <span class="text-[9px] font-mono text-slate-500 absolute -top-4 -ml-2" style="left: {domainScores.safety.current}%;">{domainScores.safety.current}%</span>
              
              <div class="bg-blue-600 h-full rounded-full absolute transition-all duration-500" style="left: {domainScores.safety.current}%; width: {domainScores.safety.after - domainScores.safety.current}%;"></div>
              
              <div class="w-2.5 h-2.5 rounded-full bg-blue-600 absolute z-10 -ml-1 transition-all duration-500" style="left: {domainScores.safety.after}%;"></div>
              <span class="text-[9px] font-mono font-bold text-blue-600 absolute -bottom-4 -ml-2 transition-all duration-500" style="left: {domainScores.safety.after}%;">{domainScores.safety.after}%</span>
            </div>
            <span class="w-12 text-right text-emerald-600 font-bold font-mono text-xs">+{domainScores.safety.delta}</span>
          </div>

          <!-- External data readiness -->
          <div class="flex items-center justify-between gap-3 pt-2">
            <span class="w-44 shrink-0 text-[11px] font-semibold text-slate-700">External data readiness</span>
            <div class="flex-1 bg-slate-100 rounded-full h-2.5 relative flex items-center">
              <div class="w-2.5 h-2.5 rounded-full bg-slate-400 absolute z-10 -ml-1" style="left: {domainScores.lab.current}%;"></div>
              <span class="text-[9px] font-mono text-slate-500 absolute -top-4 -ml-2" style="left: {domainScores.lab.current}%;">{domainScores.lab.current}%</span>

              <div class="bg-blue-600 h-full rounded-full absolute transition-all duration-500" style="left: {domainScores.lab.current}%; width: {domainScores.lab.after - domainScores.lab.current}%;"></div>

              <div class="w-2.5 h-2.5 rounded-full bg-blue-600 absolute z-10 -ml-1 transition-all duration-500" style="left: {domainScores.lab.after}%;"></div>
              <span class="text-[9px] font-mono font-bold text-blue-600 absolute -bottom-4 -ml-2 transition-all duration-500" style="left: {domainScores.lab.after}%;">{domainScores.lab.after}%</span>
            </div>
            <span class="w-12 text-right text-emerald-600 font-bold font-mono text-xs">+{domainScores.lab.delta}</span>
          </div>

          <!-- Query resolution -->
          <div class="flex items-center justify-between gap-3 pt-2">
            <span class="w-44 shrink-0 text-[11px] font-semibold text-slate-700">Query resolution</span>
            <div class="flex-1 bg-slate-100 rounded-full h-2.5 relative flex items-center">
              <div class="w-2.5 h-2.5 rounded-full bg-slate-400 absolute z-10 -ml-1" style="left: {domainScores.queries.current}%;"></div>
              <span class="text-[9px] font-mono text-slate-500 absolute -top-4 -ml-2" style="left: {domainScores.queries.current}%;">{domainScores.queries.current}%</span>

              <div class="bg-blue-600 h-full rounded-full absolute transition-all duration-500" style="left: {domainScores.queries.current}%; width: {domainScores.queries.after - domainScores.queries.current}%;"></div>

              <div class="w-2.5 h-2.5 rounded-full bg-blue-600 absolute z-10 -ml-1 transition-all duration-500" style="left: {domainScores.queries.after}%;"></div>
              <span class="text-[9px] font-mono font-bold text-blue-600 absolute -bottom-4 -ml-2 transition-all duration-500" style="left: {domainScores.queries.after}%;">{domainScores.queries.after}%</span>
            </div>
            <span class="w-12 text-right text-emerald-600 font-bold font-mono text-xs">+{domainScores.queries.delta}</span>
          </div>

          <!-- Medical coding -->
          <div class="flex items-center justify-between gap-3 pt-2">
            <span class="w-44 shrink-0 text-[11px] font-semibold text-slate-700">Medical coding</span>
            <div class="flex-1 bg-slate-100 rounded-full h-2.5 relative flex items-center">
              <div class="w-2.5 h-2.5 rounded-full bg-slate-400 absolute z-10 -ml-1" style="left: {domainScores.coding.current}%;"></div>
              <span class="text-[9px] font-mono text-slate-500 absolute -top-4 -ml-2" style="left: {domainScores.coding.current}%;">{domainScores.coding.current}%</span>

              <div class="bg-blue-600 h-full rounded-full absolute transition-all duration-500" style="left: {domainScores.coding.current}%; width: {domainScores.coding.after - domainScores.coding.current}%;"></div>

              <div class="w-2.5 h-2.5 rounded-full bg-blue-600 absolute z-10 -ml-1 transition-all duration-500" style="left: {domainScores.coding.after}%;"></div>
              <span class="text-[9px] font-mono font-bold text-blue-600 absolute -bottom-4 -ml-2 transition-all duration-500" style="left: {domainScores.coding.after}%;">{domainScores.coding.after}%</span>
            </div>
            <span class="w-12 text-right text-emerald-600 font-bold font-mono text-xs">+{domainScores.coding.delta}</span>
          </div>

          <!-- Sign-offs (SDV/SDR) -->
          <div class="flex items-center justify-between gap-3 pt-2">
            <span class="w-44 shrink-0 text-[11px] font-semibold text-slate-700">Sign-offs (SDV/SDR)</span>
            <div class="flex-1 bg-slate-100 rounded-full h-2.5 relative flex items-center">
              <div class="w-2.5 h-2.5 rounded-full bg-slate-400 absolute z-10 -ml-1" style="left: {domainScores.signOffs.current}%;"></div>
              <span class="text-[9px] font-mono text-slate-500 absolute -top-4 -ml-2" style="left: {domainScores.signOffs.current}%;">{domainScores.signOffs.current}%</span>

              <div class="bg-blue-600 h-full rounded-full absolute transition-all duration-500" style="left: {domainScores.signOffs.current}%; width: {domainScores.signOffs.after - domainScores.signOffs.current}%;"></div>

              <div class="w-2.5 h-2.5 rounded-full bg-blue-600 absolute z-10 -ml-1 transition-all duration-500" style="left: {domainScores.signOffs.after}%;"></div>
              <span class="text-[9px] font-mono font-bold text-blue-600 absolute -bottom-4 -ml-2 transition-all duration-500" style="left: {domainScores.signOffs.after}%;">{domainScores.signOffs.after}%</span>
            </div>
            <span class="w-12 text-right text-emerald-600 font-bold font-mono text-xs">+{domainScores.signOffs.delta}</span>
          </div>

          <!-- eCOA / Imaging -->
          <div class="flex items-center justify-between gap-3 pt-2">
            <span class="w-44 shrink-0 text-[11px] font-semibold text-slate-700">eCOA / Imaging</span>
            <div class="flex-1 bg-slate-100 rounded-full h-2.5 relative flex items-center">
              <div class="w-2.5 h-2.5 rounded-full bg-slate-400 absolute z-10 -ml-1" style="left: {domainScores.ecoa.current}%;"></div>
              <span class="text-[9px] font-mono text-slate-500 absolute -top-4 -ml-2" style="left: {domainScores.ecoa.current}%;">{domainScores.ecoa.current}%</span>

              <div class="bg-blue-600 h-full rounded-full absolute transition-all duration-500" style="left: {domainScores.ecoa.current}%; width: {domainScores.ecoa.after - domainScores.ecoa.current}%;"></div>

              <div class="w-2.5 h-2.5 rounded-full bg-blue-600 absolute z-10 -ml-1 transition-all duration-500" style="left: {domainScores.ecoa.after}%;"></div>
              <span class="text-[9px] font-mono font-bold text-blue-600 absolute -bottom-4 -ml-2 transition-all duration-500" style="left: {domainScores.ecoa.after}%;">{domainScores.ecoa.after}%</span>
            </div>
            <span class="w-12 text-right text-emerald-600 font-bold font-mono text-xs">+{domainScores.ecoa.delta}</span>
          </div>

        </div>
      </div>
    </div>

    <!-- Right Panel: Turn insight into action (3 Cols) matching Screenshot 8 -->
    <div class="lg:col-span-3 bg-gradient-to-br from-[#0c2356] via-[#0f2d6b] to-[#123682] text-white rounded-xl p-5 shadow-md border border-blue-900 flex flex-col justify-between">
      <div class="space-y-2">
        <div class="flex items-center space-x-2 text-blue-200">
          <Compass size={18} class="text-blue-300" />
          <h4 class="font-bold text-sm text-white">Turn insight into action</h4>
        </div>
        <p class="text-xs text-blue-100 leading-relaxed pt-1">
          This simulation shows a potential <strong>{delayReduction.toFixed(0)} day</strong> improvement in forecast DBL data. Review and confirm the actions in your Action Workbench.
        </p>
      </div>

      <button
        type="button"
        on:click={handleAddToPlan}
        class="w-full mt-4 py-2.5 px-4 rounded-lg bg-white text-blue-900 font-extrabold text-xs hover:bg-blue-50 transition-colors shadow-sm flex items-center justify-center space-x-1.5 cursor-pointer"
      >
        <span>Go to Actions &rarr;</span>
      </button>
    </div>

  </div>

  <!-- Footnote -->
  <div class="text-[11px] text-slate-400 flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-slate-200">
    <div>
      Data refreshed: 2026-10-31 08:00 UTC &middot; Sources: EDC, Safety, Central Lab, eCOA, Coding, IRT
    </div>
    <div class="font-medium text-slate-500">
      DBLock AI &middot; Clinical Data Science Workbench
    </div>
  </div>

</div>
