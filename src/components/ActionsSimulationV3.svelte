<script lang="ts">
  import { ArrowLeft, Play, RotateCcw, Plus } from '@lucide/svelte';
  import { V3_STUDY_META, V3_ACTIONS, V3_SIMULATION_SCENARIOS } from '../data/v3Data';
  import { runDblSimulation, formatShortDate, type SimulationScenarioInput } from '../lib/dblEngine';

  export let onSelectTab: (tab: string) => void;

  let statusFilter = 'all';
  let ownerFilter = 'all';
  let domainFilter = 'all';

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

  $: filteredActions = V3_ACTIONS.filter((a) => {
    const matchStatus = statusFilter === 'all' || a.status === statusFilter;
    const matchOwner = ownerFilter === 'all' || a.owner === ownerFilter;
    const matchDomain = domainFilter === 'all' || a.domain === domainFilter;
    return matchStatus && matchOwner && matchDomain;
  });

  const owners = Array.from(new Set(V3_ACTIONS.map((a) => a.owner)));
  const domains = Array.from(new Set(V3_ACTIONS.map((a) => a.domain)));

  const ownerBars = [
    { label: 'Data Management', count: 8, color: '#3b82f6' },
    { label: 'Clinical Operations', count: 5, color: '#f59e0b' },
    { label: 'Vendor Manager', count: 3, color: '#8b5cf6' },
    { label: 'Safety Lead', count: 3, color: '#ef4444' },
    { label: 'CRA / Site', count: 3, color: '#10b981' },
    { label: 'Coding Lead', count: 2, color: '#06b6d4' },
  ];

  const domainBars = [
    { label: 'External Data', count: 6, color: '#8b5cf6' },
    { label: 'Query Resolution', count: 5, color: '#3b82f6' },
    { label: 'PI Signatures', count: 4, color: '#f59e0b' },
    { label: 'Safety Reconciliation', count: 3, color: '#ef4444' },
    { label: 'SDV / SDR', count: 3, color: '#10b981' },
    { label: 'Protocol Deviations', count: 2, color: '#64748b' },
    { label: 'Medical Coding', count: 1, color: '#06b6d4' },
  ];

  function toggleScenario(id: string) {
    scenarios = scenarios.map((s) => (s.id === id ? { ...s, enabled: !s.enabled } : s));
  }
</script>

<div class="space-y-4">
  <!-- Header -->
  <div class="bg-white rounded-xl border border-slate-200/80 p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
    <div>
      <button
        type="button"
        on:click={() => onSelectTab('command_centre')}
        class="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-blue-600 mb-1 cursor-pointer"
      >
        <ArrowLeft size={13} /> Back to Study Overview
      </button>
      <div class="flex items-center gap-2.5">
        <h1 class="text-lg font-bold text-slate-900">
          {V3_STUDY_META.protocol} <span class="text-slate-300 font-normal">|</span> Actions & Simulation
        </h1>
        <span class="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">At Risk</span>
      </div>
      <p class="text-xs text-slate-500 mt-0.5">{V3_STUDY_META.title}</p>
    </div>
    <div class="text-right text-xs">
      <div>
        Target DBL: <span class="font-semibold text-slate-800">{V3_STUDY_META.targetDbl}</span>
        <span class="mx-1.5 text-slate-300">|</span>
        Predicted DBL: <span class="font-bold text-rose-600">{V3_STUDY_META.predictedDbl} (+{V3_STUDY_META.delayDays}d)</span>
      </div>
      <div class="text-[11px] text-slate-400 mt-0.5">Last refreshed: {V3_STUDY_META.lastRefreshed}</div>
    </div>
  </div>

  <!-- 6 KPI Strip -->
  <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
    <div class="bg-white rounded-xl border border-slate-200/80 p-3.5 shadow-xs">
      <div class="text-[11px] text-slate-500">Total Open Actions</div>
      <div class="mt-1 flex items-baseline gap-1.5">
        <span class="text-2xl font-bold text-slate-900">24</span>
        <span class="text-[11px] text-slate-400">across 6 domains</span>
      </div>
    </div>
    <div class="bg-white rounded-xl border border-slate-200/80 p-3.5 shadow-xs">
      <div class="text-[11px] text-slate-500">Overdue Actions</div>
      <div class="mt-1 flex items-baseline gap-1.5">
        <span class="text-2xl font-bold text-slate-900">8</span>
        <span class="text-xs font-semibold text-rose-600">33%</span>
      </div>
    </div>
    <div class="bg-white rounded-xl border border-slate-200/80 p-3.5 shadow-xs">
      <div class="text-[11px] text-slate-500">Potential DBL Days Recoverable</div>
      <div class="mt-1 text-2xl font-bold text-emerald-700">{simOutput.daysRecovered} days</div>
      <div class="text-[10px] text-slate-400 mt-0.5">If selected actions completed</div>
    </div>
    <div class="bg-white rounded-xl border border-slate-200/80 p-3.5 shadow-xs">
      <div class="text-[11px] text-slate-500">Predicted DBL (Current)</div>
      <div class="mt-1 text-lg font-bold text-slate-900">{V3_STUDY_META.predictedDbl}</div>
      <div class="text-[11px] font-semibold text-rose-600">(+{simOutput.baselineVarianceDays} days)</div>
    </div>
    <div class="bg-white rounded-xl border border-slate-200/80 p-3.5 shadow-xs">
      <div class="text-[11px] text-slate-500">Predicted DBL (After Actions)</div>
      <div class="mt-1 text-lg font-bold text-emerald-700">{formatShortDate(simOutput.simulatedDblDate)}</div>
      <div class="text-[11px] font-semibold text-emerald-600">(-{simOutput.daysRecovered} days)</div>
    </div>
    <div class="bg-white rounded-xl border border-slate-200/80 p-3.5 shadow-xs">
      <div class="text-[11px] text-slate-500">Probability of Meeting Target DBL</div>
      <div class="mt-1 flex items-baseline gap-1.5">
        <span class="text-xl font-bold text-rose-600">{simOutput.baselineProbPct}%</span>
        <span class="text-slate-400">→</span>
        <span class="text-xl font-bold text-emerald-600">{simOutput.simulatedProbPct}%</span>
      </div>
    </div>
  </div>

  <!-- Filters + Actions Table + What-If Simulation -->
  <div class="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
    <!-- Left Filters -->
    <aside class="lg:col-span-2 bg-white rounded-xl border border-slate-200/80 p-3.5 shadow-xs space-y-3">
      <div class="flex items-center justify-between">
        <h2 class="text-xs font-bold text-slate-900 uppercase tracking-wider">Filters</h2>
        <button
          type="button"
          on:click={() => { statusFilter = 'all'; ownerFilter = 'all'; domainFilter = 'all'; }}
          class="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:underline cursor-pointer"
        >
          <RotateCcw size={11} /> Reset
        </button>
      </div>
      <div>
        <label for="act-status" class="block text-[11px] text-slate-500 mb-1">Action Status</label>
        <select id="act-status" bind:value={statusFilter} class="w-full text-xs border border-slate-200 rounded-lg px-2 py-1.5 bg-white">
          <option value="all">All</option>
          <option value="Open">Open</option>
          <option value="In Progress">In Progress</option>
          <option value="Overdue">Overdue</option>
        </select>
      </div>
      <div>
        <label for="act-owner" class="block text-[11px] text-slate-500 mb-1">Owner</label>
        <select id="act-owner" bind:value={ownerFilter} class="w-full text-xs border border-slate-200 rounded-lg px-2 py-1.5 bg-white">
          <option value="all">All</option>
          {#each owners as o}
            <option value={o}>{o}</option>
          {/each}
        </select>
      </div>
      <div>
        <label for="act-domain" class="block text-[11px] text-slate-500 mb-1">Domain</label>
        <select id="act-domain" bind:value={domainFilter} class="w-full text-xs border border-slate-200 rounded-lg px-2 py-1.5 bg-white">
          <option value="all">All</option>
          {#each domains as d}
            <option value={d}>{d}</option>
          {/each}
        </select>
      </div>
    </aside>

    <!-- Center Actions Table -->
    <div class="lg:col-span-6 bg-white rounded-xl border border-slate-200/80 p-4 shadow-xs">
      <div class="flex items-center justify-between mb-3">
        <div class="text-xs font-bold text-slate-900">Recommended Actions ({filteredActions.length})</div>
        <button type="button" class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer">
          <Plus size={12} /> Add Action
        </button>
      </div>
      <div class="overflow-x-auto">
        <table class="w-full text-xs">
          <thead>
            <tr class="text-left text-[11px] text-slate-400 border-b border-slate-100">
              <th class="pb-2 font-medium">Pri</th>
              <th class="pb-2 font-medium">Action / Recommendation</th>
              <th class="pb-2 font-medium">Owner</th>
              <th class="pb-2 font-medium">Due Date</th>
              <th class="pb-2 font-medium text-right">Impact</th>
              <th class="pb-2 font-medium">Status</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            {#each filteredActions as a}
              <tr class="hover:bg-slate-50/70">
                <td class="py-2 font-bold text-slate-700">P{a.priority}</td>
                <td class="py-2">
                  <div class="font-medium text-slate-800">{a.title}</div>
                  <div class="text-[10px] text-slate-400">{a.domain} · {a.studySite}</div>
                </td>
                <td class="py-2 text-slate-600">{a.owner}</td>
                <td class="py-2 text-slate-600 whitespace-nowrap">{a.dueDate}</td>
                <td class="py-2 text-right font-bold {a.estDblImpactDays < 0 ? 'text-rose-600' : 'text-slate-500'}">
                  {a.estDblImpactDays < 0 ? `${a.estDblImpactDays}d` : '0d'}
                </td>
                <td class="py-2">
                  <span class="px-1.5 py-0.5 rounded text-[10px] font-semibold {a.status === 'Overdue' ? 'bg-rose-50 text-rose-700' : a.status === 'In Progress' ? 'bg-amber-50 text-amber-700' : 'bg-blue-50 text-blue-700'}">
                    {a.status}
                  </span>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    </div>

    <!-- Right What-If Simulation Panel -->
    <div class="lg:col-span-4 bg-white rounded-xl border border-slate-200/80 p-4 shadow-xs space-y-3">
      <div>
        <h2 class="text-sm font-bold text-slate-900">What-If Simulation</h2>
        <p class="text-[11px] text-slate-500 mt-0.5">See how closing key actions improves the P80 predicted DBL date.</p>
      </div>

      <div class="space-y-2 text-xs">
        <div class="text-[11px] font-bold text-slate-700">Select Scenarios</div>
        {#each scenarios as sc}
          <label class="flex items-start gap-2 cursor-pointer text-slate-700">
            <input type="checkbox" checked={sc.enabled} on:change={() => toggleScenario(sc.id)} class="mt-0.5 rounded border-slate-300 text-blue-600" />
            <span>{sc.label} <span class="text-emerald-600 font-semibold">(-{sc.daysSaved}d)</span></span>
          </label>
        {/each}
        <label class="flex items-start gap-2 cursor-pointer text-slate-600 pt-1 border-t border-slate-100">
          <input type="checkbox" bind:checked={ignoreNonCritical} class="mt-0.5 rounded border-slate-300 text-blue-600" />
          <span>Ignore non-critical items</span>
        </label>
        <label class="flex items-start gap-2 cursor-pointer text-slate-600">
          <input type="checkbox" bind:checked={includeContingency} class="mt-0.5 rounded border-slate-300 text-blue-600" />
          <span>Include 2-day operational contingency</span>
        </label>
      </div>

      <button
        type="button"
        on:click={triggerSimulation}
        class="w-full inline-flex items-center justify-center gap-1.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold cursor-pointer"
      >
        <Play size={13} /> Run Simulation
      </button>

      <!-- Simulation Result -->
      <div class="rounded-lg border border-emerald-200 bg-emerald-50/50 p-3 space-y-2">
        <div class="text-xs font-bold text-slate-900">Simulation Result</div>
        <div class="flex items-baseline justify-between">
          <div>
            <div class="text-[10px] text-slate-500">Predicted DBL Date (P80)</div>
            <div class="text-base font-bold text-slate-900">{formatShortDate(simOutput.simulatedDblDate)}</div>
          </div>
          <span class="px-2 py-0.5 rounded text-xs font-bold bg-emerald-100 text-emerald-800">
            -{simOutput.daysRecovered} days
          </span>
        </div>
        <div class="flex items-center justify-between text-xs pt-1 border-t border-emerald-200/60">
          <span class="text-slate-600">Probability of Meeting Target DBL</span>
          <span class="font-bold text-emerald-700">{simOutput.baselineProbPct}% → {simOutput.simulatedProbPct}%</span>
        </div>
        <div class="flex items-center justify-between text-xs">
          <span class="text-slate-600">Expected Readiness at DBL</span>
          <span class="font-bold text-slate-900">{simOutput.simulatedReadinessPct}%</span>
        </div>
        <div class="text-[10px] text-slate-500 pt-1 border-t border-emerald-200/60">
          Monte Carlo Range: <span class="font-semibold">P50 {formatShortDate(simOutput.p50Date)}</span> · P80 {formatShortDate(simOutput.p80Date)} · P90 {formatShortDate(simOutput.p90Date)}
        </div>
      </div>
    </div>
  </div>

  <!-- Bottom Visuals: Actions by Owner & Actions by Domain -->
  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
    <div class="bg-white rounded-xl border border-slate-200/80 p-4 shadow-xs">
      <h3 class="text-xs font-bold text-slate-900 mb-3">Actions by Owner</h3>
      <div class="space-y-2">
        {#each ownerBars as b}
          <div class="grid grid-cols-12 items-center gap-2 text-[11px]">
            <span class="col-span-4 text-slate-700 font-medium truncate">{b.label}</span>
            <div class="col-span-7 h-2.5 bg-slate-100 rounded-full overflow-hidden">
              <div class="h-full rounded-full" style="width:{(b.count / 10) * 100}%; background:{b.color}"></div>
            </div>
            <span class="col-span-1 text-right font-bold text-slate-900">{b.count}</span>
          </div>
        {/each}
      </div>
    </div>

    <div class="bg-white rounded-xl border border-slate-200/80 p-4 shadow-xs">
      <h3 class="text-xs font-bold text-slate-900 mb-3">Actions by Domain</h3>
      <div class="space-y-2">
        {#each domainBars as b}
          <div class="grid grid-cols-12 items-center gap-2 text-[11px]">
            <span class="col-span-4 text-slate-700 font-medium truncate">{b.label}</span>
            <div class="col-span-7 h-2.5 bg-slate-100 rounded-full overflow-hidden">
              <div class="h-full rounded-full" style="width:{(b.count / 8) * 100}%; background:{b.color}"></div>
            </div>
            <span class="col-span-1 text-right font-bold text-slate-900">{b.count}</span>
          </div>
        {/each}
      </div>
    </div>
  </div>
</div>
