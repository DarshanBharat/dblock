<script lang="ts">
  import {
    workflow,
    addToPlan,
    dateAfter
  } from '../lib/workflow';
  import {
    ArrowRight,
    Calendar,
    AlertTriangle,
    CheckCircle2,
    Clock,
    Sparkles,
    ShieldAlert,
    Info,
    Check,
    Compass,
    Sliders,
    Zap
  } from '@lucide/svelte';

  export let interventions: any[];
  export let study: any;
  export let onSelectTab: (tab: string) => void;

  // Selected Category filter
  let categoryFilter = 'all'; // 'all' | 'operational' | 'reconciliation' | 'site' | 'datamgmt'

  // Toggle view
  let interventionStateView = 'after'; // 'before' | 'after'

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
  // Damping factor: overlapping actions don't add strictly linearly
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
  $: minAvoided = Math.max(0, Number((delayReduction * 0.85).toFixed(1)));
  $: maxAvoided = Number((delayReduction * 1.1).toFixed(1));

  // Dynamic domain scores
  $: domainScores = {
    safety: Math.min(98, 48 + ($workflow.selected.includes('INT-01') ? 30 : 0)),
    lab: Math.min(99, 62 + ($workflow.selected.includes('INT-02') ? 20 : 0)),
    queries: Math.min(95, 70 + ($workflow.selected.includes('INT-03') ? 8 : 0) + ($workflow.selected.includes('INT-04') ? 4 : 0)),
    coding: Math.min(98, 88 + ($workflow.selected.includes('INT-06') ? 4 : 0)),
    signOffs: Math.min(100, 80 + ($workflow.selected.includes('INT-05') ? 4 : 0)),
    ecoa: Math.min(95, 76 + ($workflow.selected.includes('INT-04') ? 4 : 0))
  };

  let hasAddedToPlan = false;
  function handleAddToPlan() {
    addToPlan();
    hasAddedToPlan = true;
    setTimeout(() => {
      onSelectTab('action_workbench');
    }, 900);
  }
</script>

<div class="space-y-6">

  <!-- ========================================================================= -->
  <!-- HERO BANNER: WHAT-IF INTERVENTION SIMULATOR                               -->
  <!-- ========================================================================= -->
  <div class="rounded-2xl bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950 text-white p-6 shadow-md border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-6">
    <div class="max-w-2xl">
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

    <div class="shrink-0 p-4 rounded-xl bg-white/10 backdrop-blur-md border border-white/15 max-w-xs text-xs text-blue-100">
      <div class="flex items-center space-x-2 font-semibold text-white mb-1">
        <Sliders size={15} class="text-blue-300" />
        <span>Evidence-Based Simulation</span>
      </div>
      <p class="text-[11px] text-blue-200/90 leading-relaxed">
        Better decisions today. A faster, more predictable tomorrow.
      </p>
    </div>
  </div>

  <!-- ========================================================================= -->
  <!-- TOP 3 KPI CARDS                                                           -->
  <!-- ========================================================================= -->
  <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
    
    <!-- Current forecast DBL date -->
    <div class="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex items-center justify-between">
      <div>
        <div class="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Current forecast DBL date</div>
        <div class="text-2xl font-extrabold text-slate-900 mt-1 num-tabular">
          {study.forecastDbl}
        </div>
        <div class="text-xs font-bold text-rose-600 mt-0.5">
          (+6 days vs. plan)
        </div>
        <div class="text-[10px] text-slate-400 mt-0.5">Planned: {study.plannedDbl}</div>
      </div>
      <div class="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
        <Calendar size={20} />
      </div>
    </div>

    <!-- Overall readiness score -->
    <div class="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex items-center justify-between">
      <div>
        <div class="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Overall readiness score</div>
        <div class="flex items-baseline space-x-1.5 mt-1">
          <span class="text-3xl font-extrabold text-slate-900 num-tabular">{study.overallReadinessScore}</span>
          <span class="text-sm font-semibold text-slate-400">/100</span>
        </div>
        <div class="text-xs font-bold text-emerald-600 mt-0.5">
          +5 vs. last week
        </div>
        <div class="text-[10px] text-slate-400 mt-0.5">Target: 95/100 before lock</div>
      </div>
      <div class="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
        <Activity size={20} />
      </div>
    </div>

    <!-- Critical blockers -->
    <div class="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex items-center justify-between">
      <div>
        <div class="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Critical blockers</div>
        <div class="text-3xl font-extrabold text-rose-600 mt-1 num-tabular">
          {study.criticalBlockersCount}
        </div>
        <div class="text-xs font-bold text-rose-700 mt-0.5">
          3 high-risk sites
        </div>
        <div class="text-[10px] text-slate-400 mt-0.5">Direct critical path dependencies</div>
      </div>
      <div class="w-10 h-10 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
        <AlertTriangle size={20} />
      </div>
    </div>

  </div>

  <!-- ========================================================================= -->
  <!-- 3 COLUMN SIGNATURE LAYOUT: SELECT -> PREDICTED IMPACT -> IMPACT SUMMARY   -->
  <!-- ========================================================================= -->
  <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
    
    <!-- ======================================================================= -->
    <!-- COLUMN 1: SELECT INTERVENTIONS (4 COLS)                                 -->
    <!-- ======================================================================= -->
    <div class="lg:col-span-4 bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
      <div>
        <h2 class="text-sm font-bold text-slate-900">1. Select interventions to simulate</h2>
        <p class="text-[11px] text-slate-500 mt-0.5">
          Choose one or more actions to see the potential impact on DBL date and readiness.
        </p>
      </div>

      <!-- Filter tabs -->
      <div class="flex flex-wrap gap-1 border-b border-slate-100 pb-2 text-[11px] font-semibold text-slate-600">
        <button
          on:click={() => categoryFilter = 'all'}
          class="px-2 py-1 rounded transition-colors {categoryFilter === 'all' ? 'bg-blue-600 text-white font-bold' : 'hover:bg-slate-100'}"
        >
          All actions
        </button>
        <button
          on:click={() => categoryFilter = 'operational'}
          class="px-2 py-1 rounded transition-colors {categoryFilter === 'operational' ? 'bg-blue-600 text-white font-bold' : 'hover:bg-slate-100'}"
        >
          Operational
        </button>
        <button
          on:click={() => categoryFilter = 'reconciliation'}
          class="px-2 py-1 rounded transition-colors {categoryFilter === 'reconciliation' ? 'bg-blue-600 text-white font-bold' : 'hover:bg-slate-100'}"
        >
          Reconciliation
        </button>
        <button
          on:click={() => categoryFilter = 'site'}
          class="px-2 py-1 rounded transition-colors {categoryFilter === 'site' ? 'bg-blue-600 text-white font-bold' : 'hover:bg-slate-100'}"
        >
          Site
        </button>
        <button
          on:click={() => categoryFilter = 'datamgmt'}
          class="px-2 py-1 rounded transition-colors {categoryFilter === 'datamgmt' ? 'bg-blue-600 text-white font-bold' : 'hover:bg-slate-100'}"
        >
          Data management
        </button>
      </div>

      <!-- Checkbox List of Interventions -->
      <div class="space-y-2.5">
        {#each filteredInterventions as item}
          {@const isChecked = $workflow.selected.includes(item.id)}
          <label
            class="flex items-start space-x-3 p-3 rounded-xl border transition-all cursor-pointer group {isChecked ? 'bg-blue-50/60 border-blue-400 ring-1 ring-blue-300' : 'bg-white border-slate-200 hover:border-slate-300'}"
          >
            <input
              type="checkbox"
              checked={isChecked}
              on:change={() => toggleIntervention(item.id)}
              class="rounded text-blue-600 focus:ring-blue-500 w-4 h-4 mt-0.5 shrink-0"
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
        <span class="font-bold text-blue-900">{selectedItems.length} action{selectedItems.length === 1 ? '' : 's'} selected</span>
        <button
          on:click={clearAllSelections}
          class="text-blue-600 hover:text-blue-800 font-semibold cursor-pointer"
        >
          Clear all
        </button>
      </div>
    </div>

    <!-- ======================================================================= -->
    <!-- COLUMN 2: SEE THE PREDICTED IMPACT (5 COLS)                             -->
    <!-- ======================================================================= -->
    <div class="lg:col-span-5 bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-5">
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-sm font-bold text-slate-900">2. See the predicted impact</h2>
          <p class="text-[11px] text-slate-500 mt-0.5">
            Estimated impact based on historical patterns and current study data.
          </p>
        </div>

        <!-- Before / After Toggle Buttons -->
        <div class="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs font-semibold">
          <button
            on:click={() => interventionStateView = 'before'}
            class="px-2.5 py-1 rounded-md transition-all {interventionStateView === 'before' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'}"
          >
            Before intervention
          </button>
          <button
            on:click={() => interventionStateView = 'after'}
            class="px-2.5 py-1 rounded-md transition-all {interventionStateView === 'after' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'}"
          >
            After intervention
          </button>
        </div>
      </div>

      <!-- Sub-KPI Metrics Card (Recalculated!) -->
      <div class="grid grid-cols-3 gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-center">
        <div>
          <span class="text-[10px] text-slate-400 uppercase font-bold block">Forecast DBL Date</span>
          <strong class="text-sm font-extrabold text-slate-900 block mt-0.5 num-tabular">
            {interventionStateView === 'after' ? forecastDblSimulated : study.forecastDbl}
          </strong>
          <span class="text-[10px] font-bold {interventionStateView === 'after' ? 'text-blue-600' : 'text-rose-600'}">
            {interventionStateView === 'after' ? `(-${delayReduction.toFixed(0)} days)` : `(+${study.delayDays}d vs plan)`}
          </span>
          <div class="text-[9px] text-slate-400">vs. current forecast</div>
        </div>

        <div>
          <span class="text-[10px] text-slate-400 uppercase font-bold block">Readiness score</span>
          <strong class="text-sm font-extrabold text-slate-900 block mt-0.5 num-tabular">
            {interventionStateView === 'after' ? `${simulatedScore}/100` : `${study.overallReadinessScore}/100`}
          </strong>
          <span class="text-[10px] font-bold text-emerald-600">
            {interventionStateView === 'after' ? `(+${scoreGain} points)` : 'Current baseline'}
          </span>
        </div>

        <div>
          <span class="text-[10px] text-slate-400 uppercase font-bold block">Critical blockers</span>
          <strong class="text-sm font-extrabold text-slate-900 block mt-0.5 num-tabular">
            {interventionStateView === 'after' ? remainingBlockers : study.criticalBlockersCount}
          </strong>
          <span class="text-[10px] font-bold text-emerald-600">
            {interventionStateView === 'after' ? `(-${blockersResolved} remaining)` : '8 on critical path'}
          </span>
        </div>
      </div>

      <!-- Forecast DBL date comparison chart -->
      <div>
        <h3 class="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
          Forecast DBL date comparison
        </h3>

        <div class="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
          
          <!-- Current forecast (no action) -->
          <div class="space-y-1">
            <div class="flex justify-between text-[11px] font-semibold text-slate-600">
              <span>Current forecast (No action)</span>
              <span class="font-mono text-slate-900 font-bold">2026-12-21</span>
            </div>
            <div class="w-full bg-slate-200 rounded-full h-2 relative">
              <div class="bg-slate-500 h-full rounded-full" style="width: 75%"></div>
            </div>
          </div>

          <!-- Selected interventions -->
          <div class="space-y-1">
            <div class="flex justify-between text-[11px] font-semibold text-blue-900">
              <span class="font-bold flex items-center space-x-1 text-blue-700">
                <span class="w-2 h-2 rounded-full bg-blue-600"></span>
                <span>Selected interventions</span>
              </span>
              <span class="font-mono text-blue-700 font-bold">{forecastDblSimulated}</span>
            </div>
            <div class="w-full bg-slate-200 rounded-full h-2.5 relative">
              <div class="bg-blue-600 h-full rounded-full transition-all duration-500" style="width: {interventionStateView === 'after' ? '50%' : '75%'}"></div>
            </div>
          </div>

          <!-- Best case scenario -->
          <div class="space-y-1">
            <div class="flex justify-between text-[11px] font-semibold text-emerald-800">
              <span>Best case scenario</span>
              <span class="font-mono text-emerald-800 font-bold">2026-12-16</span>
            </div>
            <div class="w-full bg-slate-200 rounded-full h-2 relative">
              <div class="bg-emerald-500 h-full rounded-full" style="width: 38%"></div>
            </div>
          </div>

          <!-- At risk scenario -->
          <div class="space-y-1">
            <div class="flex justify-between text-[11px] font-semibold text-rose-800">
              <span>At-risk scenario</span>
              <span class="font-mono text-rose-800 font-bold">2026-12-23</span>
            </div>
            <div class="w-full bg-slate-200 rounded-full h-2 relative">
              <div class="bg-rose-500 h-full rounded-full" style="width: 90%"></div>
            </div>
          </div>

          <!-- Target Planned DBL reference -->
          <div class="pt-2 border-t border-slate-200 flex justify-between text-[11px] font-bold text-slate-700">
            <span>Target Planned DBL:</span>
            <span class="font-mono text-blue-950 font-bold">{study.plannedDbl}</span>
          </div>

        </div>
      </div>

      <!-- Impact on readiness by domain (horizontal comparison bars) -->
      <div>
        <div class="flex items-center justify-between mb-2">
          <h3 class="text-xs font-bold text-slate-900 uppercase tracking-wider">
            Impact on readiness by domain
          </h3>
          <div class="flex items-center space-x-2 text-[10px]">
            <span class="flex items-center space-x-1 text-slate-500">
              <span class="w-2 h-2 rounded-full bg-slate-400"></span>
              <span>Current</span>
            </span>
            <span class="flex items-center space-x-1 text-blue-600 font-bold">
              <span class="w-2 h-2 rounded-full bg-blue-600"></span>
              <span>After intervention</span>
            </span>
            <span class="text-emerald-700 font-bold">&Delta; Change</span>
          </div>
        </div>

        <div class="space-y-2.5 text-xs">
          <!-- Safety -->
          <div>
            <div class="flex justify-between text-[11px] font-semibold text-slate-700">
              <span>Safety reconciliation</span>
              <span class="font-mono">
                {interventionStateView === 'after' ? `48% &rarr; ${domainScores.safety}%` : '48%'}
                <strong class="text-emerald-600 ml-1">+{domainScores.safety - 48}</strong>
              </span>
            </div>
            <div class="w-full bg-slate-100 rounded-full h-1.5 mt-1 relative">
              <div class="bg-slate-400 h-full rounded-full absolute" style="width: 48%"></div>
              {#if interventionStateView === 'after'}
                <div class="bg-blue-600 h-full rounded-full absolute opacity-90 transition-all duration-500" style="width: {domainScores.safety}%"></div>
              {/if}
            </div>
          </div>

          <!-- Lab -->
          <div>
            <div class="flex justify-between text-[11px] font-semibold text-slate-700">
              <span>External data readiness</span>
              <span class="font-mono">
                {interventionStateView === 'after' ? `62% &rarr; ${domainScores.lab}%` : '62%'}
                <strong class="text-emerald-600 ml-1">+{domainScores.lab - 62}</strong>
              </span>
            </div>
            <div class="w-full bg-slate-100 rounded-full h-1.5 mt-1 relative">
              <div class="bg-slate-400 h-full rounded-full absolute" style="width: 62%"></div>
              {#if interventionStateView === 'after'}
                <div class="bg-blue-600 h-full rounded-full absolute opacity-90 transition-all duration-500" style="width: {domainScores.lab}%"></div>
              {/if}
            </div>
          </div>

          <!-- Queries -->
          <div>
            <div class="flex justify-between text-[11px] font-semibold text-slate-700">
              <span>Query resolution</span>
              <span class="font-mono">
                {interventionStateView === 'after' ? `70% &rarr; ${domainScores.queries}%` : '70%'}
                <strong class="text-emerald-600 ml-1">+{domainScores.queries - 70}</strong>
              </span>
            </div>
            <div class="w-full bg-slate-100 rounded-full h-1.5 mt-1 relative">
              <div class="bg-slate-400 h-full rounded-full absolute" style="width: 70%"></div>
              {#if interventionStateView === 'after'}
                <div class="bg-blue-600 h-full rounded-full absolute opacity-90 transition-all duration-500" style="width: {domainScores.queries}%"></div>
              {/if}
            </div>
          </div>

          <!-- Coding -->
          <div>
            <div class="flex justify-between text-[11px] font-semibold text-slate-700">
              <span>Medical coding</span>
              <span class="font-mono">
                {interventionStateView === 'after' ? `88% &rarr; ${domainScores.coding}%` : '88%'}
                <strong class="text-emerald-600 ml-1">+{domainScores.coding - 88}</strong>
              </span>
            </div>
            <div class="w-full bg-slate-100 rounded-full h-1.5 mt-1 relative">
              <div class="bg-slate-400 h-full rounded-full absolute" style="width: 88%"></div>
              {#if interventionStateView === 'after'}
                <div class="bg-blue-600 h-full rounded-full absolute opacity-90 transition-all duration-500" style="width: {domainScores.coding}%"></div>
              {/if}
            </div>
          </div>

          <!-- Sign-offs -->
          <div>
            <div class="flex justify-between text-[11px] font-semibold text-slate-700">
              <span>Sign-offs (SDV/SDR)</span>
              <span class="font-mono">
                {interventionStateView === 'after' ? `80% &rarr; ${domainScores.signOffs}%` : '80%'}
                <strong class="text-emerald-600 ml-1">+{domainScores.signOffs - 80}</strong>
              </span>
            </div>
            <div class="w-full bg-slate-100 rounded-full h-1.5 mt-1 relative">
              <div class="bg-slate-400 h-full rounded-full absolute" style="width: 80%"></div>
              {#if interventionStateView === 'after'}
                <div class="bg-blue-600 h-full rounded-full absolute opacity-90 transition-all duration-500" style="width: {domainScores.signOffs}%"></div>
              {/if}
            </div>
          </div>

          <!-- eCOA -->
          <div>
            <div class="flex justify-between text-[11px] font-semibold text-slate-700">
              <span>eCOA / Imaging</span>
              <span class="font-mono">
                {interventionStateView === 'after' ? `76% &rarr; ${domainScores.ecoa}%` : '76%'}
                <strong class="text-emerald-600 ml-1">+{domainScores.ecoa - 76}</strong>
              </span>
            </div>
            <div class="w-full bg-slate-100 rounded-full h-1.5 mt-1 relative">
              <div class="bg-slate-400 h-full rounded-full absolute" style="width: 76%"></div>
              {#if interventionStateView === 'after'}
                <div class="bg-blue-600 h-full rounded-full absolute opacity-90 transition-all duration-500" style="width: {domainScores.ecoa}%"></div>
              {/if}
            </div>
          </div>
        </div>
      </div>

    </div>

    <!-- ======================================================================= -->
    <!-- COLUMN 3: IMPACT SUMMARY (3 COLS)                                       -->
    <!-- ======================================================================= -->
    <div class="lg:col-span-3 space-y-4">
      
      <div class="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
        <div>
          <h2 class="text-sm font-bold text-slate-900">3. Impact summary</h2>
          <p class="text-[11px] text-slate-500 mt-0.5">
            Estimated range reflects uncertainty in data and execution timelines.
          </p>
        </div>

        <!-- Delay Avoided KPI Box -->
        <div class="p-4 rounded-xl bg-blue-50/80 border border-blue-200 text-center">
          <span class="text-[10px] text-blue-900 uppercase font-bold tracking-wide block">Estimated delay avoided</span>
          <div class="text-3xl font-extrabold text-blue-700 my-1 num-tabular">
            {minAvoided} &ndash; {maxAvoided} days
          </div>
          <div class="flex items-center justify-center space-x-1 text-xs text-blue-800 font-medium">
            <span>Confidence: <strong>Moderate</strong></span>
            <Info size={13} class="text-blue-600" />
          </div>
        </div>

        <!-- Green Alert Box: 65% delay exposure -->
        <div class="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-start space-x-2.5 text-xs text-emerald-900">
          <CheckCircle2 size={16} class="text-emerald-600 shrink-0 mt-0.5" />
          <p class="leading-relaxed">
            Combining SAE resolution and laboratory escalation addresses <strong>~65%</strong> of the current forecast delay exposure.
          </p>
        </div>

        <!-- Key Assumptions List -->
        <div class="space-y-2 text-xs text-slate-700">
          <strong class="font-bold text-slate-900 text-xs block uppercase tracking-wide">Key assumptions</strong>
          <ul class="space-y-1.5 text-[11px] text-slate-600 leading-snug">
            <li class="flex items-start space-x-1.5">
              <span class="text-slate-400">&bull;</span>
              <span>Selected actions completed within 48 hours</span>
            </li>
            <li class="flex items-start space-x-1.5">
              <span class="text-slate-400">&bull;</span>
              <span>No new critical issues identified</span>
            </li>
            <li class="flex items-start space-x-1.5">
              <span class="text-slate-400">&bull;</span>
              <span>Current query closure velocity continues</span>
            </li>
            <li class="flex items-start space-x-1.5">
              <span class="text-slate-400">&bull;</span>
              <span>External data delivered as per vendor commitment</span>
            </li>
          </ul>
        </div>

        <!-- Amber Overlap Warning Alert -->
        <div class="p-3 rounded-lg bg-amber-50 border border-amber-200 flex items-start space-x-2 text-xs text-amber-900">
          <AlertTriangle size={15} class="text-amber-600 shrink-0 mt-0.5" />
          <p class="text-[11px] leading-snug">
            <strong>Warning:</strong> Laboratory transfer and reconciliation actions overlap. Combined impact may be lower than the sum of individual effects.
          </p>
        </div>

      </div>

      <!-- Turn insight into action CTA Card (Matching Screenshot 8) -->
      <div class="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white rounded-xl p-5 shadow-md border border-slate-800 space-y-3">
        <div class="flex items-start space-x-2.5">
          <Compass size={18} class="text-blue-300 shrink-0 mt-0.5" />
          <div>
            <h4 class="font-bold text-sm text-white">Turn insight into action</h4>
            <p class="text-xs text-slate-300 mt-1 leading-relaxed">
              This simulation shows a potential <strong>{delayReduction.toFixed(0)} day</strong> improvement in forecast DBL date. Review and confirm the actions in your Action Workbench.
            </p>
          </div>
        </div>

        <button
          on:click={handleAddToPlan}
          class="w-full py-2.5 px-4 rounded-lg bg-blue-600 text-white font-bold text-xs hover:bg-blue-500 transition-colors shadow-xs flex items-center justify-center space-x-1.5 cursor-pointer"
        >
          <span>{hasAddedToPlan ? 'Actions Added to Plan &rarr;' : 'Go to Actions \u2192'}</span>
          <ArrowRight size={14} />
        </button>
      </div>

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
