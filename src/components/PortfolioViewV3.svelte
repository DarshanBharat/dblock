<script lang="ts">
  import { ChevronRight, Search, AlertTriangle } from '@lucide/svelte';
  import { V3_PORTFOLIO_STUDIES } from '../data/v3Data';

  export let onSelectStudy: (studyId: string) => void;

  let searchQuery = '';
  let statusFilter = 'all';

  $: filteredStudies = V3_PORTFOLIO_STUDIES.filter((s) => {
    const q = searchQuery.trim().toLowerCase();
    const matchSearch =
      !q ||
      s.id.toLowerCase().includes(q) ||
      s.title.toLowerCase().includes(q) ||
      s.therapeuticArea.toLowerCase().includes(q) ||
      s.criticalDriver.toLowerCase().includes(q);
    const matchStatus =
      statusFilter === 'all' ||
      (statusFilter === 'delayed' && s.delayDays > 0) ||
      (statusFilter === 'on_track' && s.delayDays === 0);
    return matchSearch && matchStatus;
  });

  const studiesMissing = V3_PORTFOLIO_STUDIES.filter((s) => s.delayDays > 0).length;
  const totalBlockers = V3_PORTFOLIO_STUDIES.reduce((sum, s) => sum + s.hardGates, 0);
  const totalDelayExposure = V3_PORTFOLIO_STUDIES.reduce((sum, s) => sum + s.delayDays, 0);
  const totalRecoverable = V3_PORTFOLIO_STUDIES.reduce((sum, s) => sum + s.recoverableDays, 0);

  function statusBadge(status: string): string {
    if (status === 'Escalated') return 'bg-rose-50 text-rose-700 border-rose-200';
    if (status === 'In Progress') return 'bg-amber-50 text-amber-700 border-amber-200';
    if (status === 'Assigned') return 'bg-blue-50 text-blue-700 border-blue-200';
    return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  }
</script>

<div class="space-y-5">
  <!-- Header -->
  <div class="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs flex flex-wrap items-center justify-between gap-4">
    <div>
      <div class="text-[11px] font-bold uppercase tracking-wider text-blue-600">Portfolio Command · D-60 to Forecast DBL</div>
      <h1 class="text-xl font-bold text-slate-900 mt-0.5">Studies in Active Lock Window</h1>
      <p class="text-xs text-slate-500 mt-1">
        Ranked by <span class="font-semibold text-slate-700">Highest Recoverable DBL Risk</span> — connecting risk, critical-path driver, owner, and recoverable days.
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

  <!-- 5 Recommended Portfolio KPIs (PDF pages 2–3) -->
  <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
    <div class="bg-white rounded-xl border border-slate-200/80 p-4 shadow-xs">
      <div class="text-xs font-medium text-slate-500">Studies in Active Lock Window</div>
      <div class="text-3xl font-bold text-slate-900 mt-1.5">{V3_PORTFOLIO_STUDIES.length}</div>
      <div class="text-[11px] text-slate-400 mt-2">D-60 to Forecast DBL · Post-LSLV</div>
    </div>

    <div class="bg-white rounded-xl border border-slate-200/80 p-4 shadow-xs">
      <div class="text-xs font-medium text-slate-500">Studies Forecast to Miss DBL</div>
      <div class="mt-1.5 flex items-baseline gap-1.5">
        <span class="text-3xl font-bold text-rose-600">{studiesMissing}</span>
        <span class="text-sm text-slate-400 font-semibold">of {V3_PORTFOLIO_STUDIES.length}</span>
      </div>
      <div class="text-[11px] text-slate-500 mt-2">1–3d: 3 · 4–7d: 3 studies</div>
    </div>

    <div class="bg-white rounded-xl border border-slate-200/80 p-4 shadow-xs">
      <div class="text-xs font-medium text-slate-500">Critical-Path Blockers</div>
      <div class="text-3xl font-bold text-slate-900 mt-1.5">{totalBlockers}</div>
      <div class="text-[11px] text-slate-500 mt-2">Across {studiesMissing} delayed studies</div>
    </div>

    <div class="bg-white rounded-xl border border-slate-200/80 p-4 shadow-xs">
      <div class="text-xs font-medium text-slate-500">Portfolio Delay Exposure</div>
      <div class="text-3xl font-bold text-amber-600 mt-1.5">{totalDelayExposure}d</div>
      <div class="text-[11px] text-slate-500 mt-2">Cumulative forecast delay days</div>
    </div>

    <div class="bg-white rounded-xl border border-emerald-200 bg-emerald-50/40 p-4 shadow-xs">
      <div class="text-xs font-medium text-emerald-800">Intervention Opportunity</div>
      <div class="text-3xl font-bold text-emerald-700 mt-1.5">{totalRecoverable}d</div>
      <div class="text-[11px] text-emerald-700 mt-2">Forecast days potentially recoverable</div>
    </div>
  </div>

  <!-- Preferred Portfolio Table (PDF page 49) -->
  <div class="bg-white rounded-xl border border-slate-200/80 p-4 shadow-xs space-y-3">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div class="flex items-center gap-2">
        <h2 class="text-sm font-bold text-slate-900">Portfolio Risk Ranking ({filteredStudies.length} studies)</h2>
        <span class="text-[11px] text-slate-400">Click any study to inspect</span>
      </div>
      <div class="flex items-center gap-2">
        <div class="relative">
          <Search size={12} class="absolute left-2.5 top-2.5 text-slate-400" />
          <input
            type="text"
            bind:value={searchQuery}
            placeholder="Search study, TA, driver..."
            class="pl-7 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:outline-hidden focus:border-blue-500"
          />
        </div>
        <select bind:value={statusFilter} class="text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white">
          <option value="all">All Studies</option>
          <option value="delayed">Forecast to Miss DBL</option>
          <option value="on_track">On Track</option>
        </select>
      </div>
    </div>

    <div class="overflow-x-auto">
      <table class="w-full text-xs">
        <thead>
          <tr class="text-left text-[11px] text-slate-400 border-b border-slate-100">
            <th class="pb-2 font-medium">Study</th>
            <th class="pb-2 font-medium text-right">Readiness / Exp</th>
            <th class="pb-2 font-medium">Target DBL</th>
            <th class="pb-2 font-medium">Predicted DBL</th>
            <th class="pb-2 font-medium text-right">Prob. Delay</th>
            <th class="pb-2 font-medium">Critical Driver</th>
            <th class="pb-2 font-medium text-right">Recoverable</th>
            <th class="pb-2 font-medium">Owner</th>
            <th class="pb-2 font-medium">Status</th>
            <th class="pb-2 font-medium text-right">Action</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100">
          {#each filteredStudies as st}
            <tr
              class="hover:bg-blue-50/50 transition-colors cursor-pointer {st.id === 'CA-209-301' ? 'bg-blue-50/30' : ''}"
              on:click={() => onSelectStudy(st.id)}
            >
              <td class="py-3">
                <div class="flex items-center gap-1.5">
                  <span class="font-bold text-blue-700 font-mono">{st.id}</span>
                  {#if st.id === 'CA-209-301'}
                    <span class="px-1.5 py-0.5 rounded text-[9px] font-bold bg-blue-100 text-blue-800">DEMO</span>
                  {/if}
                </div>
                <div class="text-[11px] text-slate-500 truncate max-w-[210px]">{st.therapeuticArea} · {st.sitesCount} sites · {st.subjectsCount} subj</div>
              </td>
              <td class="py-3 text-right whitespace-nowrap">
                <span class="font-bold text-slate-900">{st.readiness}%</span>
                <span class="text-slate-400"> / {st.expected}%</span>
                {#if st.readiness < st.expected}
                  <div class="text-[10px] font-semibold text-rose-600">{st.readiness - st.expected} pts</div>
                {/if}
              </td>
              <td class="py-3 text-slate-600 whitespace-nowrap">{st.targetDbl}</td>
              <td class="py-3 whitespace-nowrap">
                <span class="font-semibold {st.delayDays > 0 ? 'text-rose-600' : 'text-emerald-700'}">{st.predictedDbl}</span>
                {#if st.delayDays > 0}
                  <span class="ml-1 text-[10px] font-bold text-rose-600">(+{st.delayDays}d)</span>
                {/if}
              </td>
              <td class="py-3 text-right font-bold {st.probDelay >= 60 ? 'text-rose-600' : st.probDelay >= 30 ? 'text-amber-600' : 'text-emerald-600'}">
                {st.probDelay}%
              </td>
              <td class="py-3 text-slate-700">
                {#if st.delayDays > 0}
                  <span class="inline-flex items-center gap-1">
                    <AlertTriangle size={11} class="text-amber-500 shrink-0" />
                    {st.criticalDriver}
                  </span>
                {:else}
                  <span class="text-slate-400">None</span>
                {/if}
              </td>
              <td class="py-3 text-right font-bold {st.recoverableDays > 0 ? 'text-emerald-700' : 'text-slate-400'}">
                {st.recoverableDays > 0 ? `${st.recoverableDays}d` : '0d'}
              </td>
              <td class="py-3 text-slate-600">{st.owner}</td>
              <td class="py-3">
                <span class="px-2 py-0.5 rounded-full text-[10px] font-semibold border {statusBadge(st.actionStatus)}">
                  {st.actionStatus}
                </span>
              </td>
              <td class="py-3 text-right">
                <span class="inline-flex items-center gap-0.5 text-blue-600 font-semibold">
                  Inspect <ChevronRight size={13} />
                </span>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  </div>
</div>
