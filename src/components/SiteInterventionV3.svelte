<script lang="ts">
  import { ArrowLeft, AlertTriangle, CheckCircle2, ChevronRight, Sliders } from '@lucide/svelte';
  import {
    V3_SITES,
    V3_SUBJECT_ROWS,
    V3_ACTIONS,
    type V3SiteSpec
  } from '../data/v3Data';
  import SubjectDrawerV3 from './SubjectDrawerV3.svelte';

  export let siteId: string;
  export let onBackToSites: () => void;
  export let onSelectTab: (tab: string) => void;

  let subjectFilter = 'all';
  let drawerSubjectIndex: number | null = null;

  $: site = (V3_SITES.find((s) => s.id === siteId) || V3_SITES[0]) as V3SiteSpec;
  $: siteSubjects = V3_SUBJECT_ROWS.filter((s) => s.siteId === site.id);
  $: filteredSubjects = siteSubjects.filter(
    (s) => subjectFilter === 'all' || s.classification === subjectFilter
  );
  $: siteActions = V3_ACTIONS.filter((a) => a.siteId === site.id || a.studySite.includes(site.id));

  function riskBadge(risk: string): string {
    if (risk === 'On track') return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    if (risk === 'High risk') return 'bg-rose-50 text-rose-700 border-rose-200';
    return 'bg-amber-50 text-amber-700 border-amber-200';
  }

  function classBadge(c: string): string {
    if (c === 'Lock Ready') return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    if (c === 'Conditionally Ready') return 'bg-amber-50 text-amber-700 border-amber-200';
    if (c === 'Action Required') return 'bg-orange-50 text-orange-700 border-orange-200';
    return 'bg-rose-50 text-rose-700 border-rose-200';
  }
</script>

<div class="space-y-4">
  <!-- Site Header -->
  <div class="bg-white rounded-xl border border-slate-200/80 p-4 sm:p-5 shadow-xs">
    <div class="flex flex-wrap items-start justify-between gap-3 pb-3 border-b border-slate-100">
      <div>
        <button
          type="button"
          on:click={onBackToSites}
          class="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-blue-600 mb-1.5 cursor-pointer"
        >
          <ArrowLeft size={13} /> Back to Sites & Countries
        </button>
        <div class="flex flex-wrap items-center gap-2.5">
          <h1 class="text-lg font-bold text-slate-900">
            Site {site.id} Lock Readiness and Intervention Detail
          </h1>
          <span class="px-2.5 py-0.5 rounded-full text-xs font-semibold border {riskBadge(site.riskLevel)}">
            {site.riskLevel}
          </span>
        </div>
        <p class="text-xs text-slate-500 mt-0.5">
          {site.name} · {site.country} · PI: <span class="font-medium text-slate-700">{site.piName}</span>
        </p>
      </div>
      <button
        type="button"
        on:click={() => onSelectTab('actions_sim')}
        class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold cursor-pointer"
      >
        <Sliders size={13} /> Simulate Site Actions
      </button>
    </div>

    <!-- Site Metrics Strip -->
    <div class="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 pt-3 text-xs">
      <div>
        <div class="text-[11px] text-slate-400">Site Readiness</div>
        <div class="font-bold text-slate-900 text-base">
          {site.readiness}/100
          <span class="text-[11px] font-normal text-slate-400">(Exp {site.expectedReadiness})</span>
        </div>
      </div>
      <div>
        <div class="text-[11px] text-slate-400">7-Day Trend</div>
        <div class="font-bold text-base {site.trend7d < 0 ? 'text-rose-600' : 'text-emerald-600'}">
          {site.trend7d >= 0 ? `+${site.trend7d}` : site.trend7d} pts
        </div>
      </div>
      <div>
        <div class="text-[11px] text-slate-400">Study DBL Impact</div>
        <div class="font-bold text-base {site.dblImpactDays > 0 ? 'text-rose-600' : 'text-emerald-600'}">
          {site.dblImpactDays > 0 ? `+${site.dblImpactDays} days` : '0 days'}
        </div>
      </div>
      <div>
        <div class="text-[11px] text-slate-400">Subjects (Enr / Comp / Disc)</div>
        <div class="font-semibold text-slate-800">{site.enrolled} / {site.completed} / {site.discontinued}</div>
      </div>
      <div>
        <div class="text-[11px] text-slate-400">Data-Entry Cut-off</div>
        <div class="font-semibold text-slate-800">{site.dataCutoffDate}</div>
      </div>
      <div>
        <div class="text-[11px] text-slate-400">Forecast Site-Ready</div>
        <div class="font-bold {site.dblImpactDays > 0 ? 'text-rose-600' : 'text-emerald-700'}">{site.estReadyDate}</div>
      </div>
      <div>
        <div class="text-[11px] text-slate-400">Required Site-Ready</div>
        <div class="font-semibold text-slate-800">{site.requiredReadyDate}</div>
      </div>
    </div>
  </div>

  <!-- Why is this site at risk? + Sequenced Site Action Plan -->
  <div class="grid grid-cols-1 lg:grid-cols-12 gap-4">
    <div class="lg:col-span-6 bg-white rounded-xl border border-slate-200/80 p-4 shadow-xs space-y-2.5">
      <h2 class="text-sm font-bold text-slate-900">Why is Site {site.id} at risk?</h2>
      {#if site.riskDrivers.length === 0}
        <div class="flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg p-3">
          <CheckCircle2 size={15} />
          <span>No critical-path blockers. Site {site.id} is on track for planned freeze on {site.plannedFreezeDate}.</span>
        </div>
      {:else}
        <div class="space-y-2">
          {#each site.riskDrivers as drv}
            <div class="rounded-lg border border-slate-200/80 p-3 bg-slate-50/60 flex items-start justify-between gap-3">
              <div class="flex items-start gap-2">
                <AlertTriangle size={14} class="text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <div class="text-xs font-bold text-slate-900">{drv.title}</div>
                  <div class="text-[11px] text-slate-600 mt-0.5">{drv.detail}</div>
                </div>
              </div>
              <div class="text-right shrink-0">
                <div class="text-xs font-bold text-rose-600">+{drv.impactDays}d</div>
                {#if drv.hardGate}
                  <span class="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-rose-100 text-rose-700">Hard Gate</span>
                {/if}
              </div>
            </div>
          {/each}
        </div>
      {/if}
    </div>

    <div class="lg:col-span-6 bg-white rounded-xl border border-slate-200/80 p-4 shadow-xs space-y-2.5">
      <div class="flex items-center justify-between">
        <h2 class="text-sm font-bold text-slate-900">Prioritised Site Action Plan</h2>
        <span class="text-[11px] text-slate-400">Owner · Due · Recoverable</span>
      </div>
      {#if siteActions.length === 0}
        <p class="text-xs text-slate-500">No urgent site-level escalations required.</p>
      {:else}
        <table class="w-full text-xs">
          <thead>
            <tr class="text-left text-[11px] text-slate-400 border-b border-slate-100">
              <th class="pb-1.5 font-medium">Action</th>
              <th class="pb-1.5 font-medium">Owner</th>
              <th class="pb-1.5 font-medium">Due</th>
              <th class="pb-1.5 font-medium text-right">Impact</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            {#each siteActions as act}
              <tr>
                <td class="py-2 font-medium text-slate-800">{act.title}</td>
                <td class="py-2 text-slate-600">{act.owner}</td>
                <td class="py-2 text-slate-600 whitespace-nowrap">{act.dueDate}</td>
                <td class="py-2 text-right font-bold text-emerald-700">{act.estDblImpactDays < 0 ? `${act.estDblImpactDays}d` : '0d'}</td>
              </tr>
            {/each}
          </tbody>
        </table>
      {/if}
    </div>
  </div>

  <!-- Subject Readiness Table at Site Level -->
  <div class="bg-white rounded-xl border border-slate-200/80 p-4 shadow-xs space-y-3">
    <div class="flex flex-wrap items-center justify-between gap-2">
      <div>
        <h2 class="text-sm font-bold text-slate-900">Subject Readiness Table · Site {site.id} ({filteredSubjects.length} of {siteSubjects.length} subjects)</h2>
        <p class="text-[11px] text-slate-400">Click any subject to open the Subject Details Drawer</p>
      </div>
      <div class="flex flex-wrap items-center gap-1.5 text-xs">
        {#each ['all', 'Hard Blocked', 'Action Required', 'Conditionally Ready', 'Lock Ready'] as cls}
          <button
            type="button"
            on:click={() => (subjectFilter = cls)}
            class="px-2.5 py-1 rounded-lg border text-xs font-medium cursor-pointer {subjectFilter === cls ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}"
          >
            {cls === 'all' ? 'All' : cls}
          </button>
        {/each}
      </div>
    </div>

    <div class="overflow-x-auto">
      <table class="w-full text-xs">
        <thead>
          <tr class="text-left text-[11px] text-slate-400 border-b border-slate-100">
            <th class="pb-2 font-medium">Subject ID</th>
            <th class="pb-2 font-medium">Status</th>
            <th class="pb-2 font-medium text-right">Readiness</th>
            <th class="pb-2 font-medium">Classification</th>
            <th class="pb-2 font-medium">Key Open Items</th>
            <th class="pb-2 font-medium">Owner</th>
            <th class="pb-2 font-medium text-right">Action</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100">
          {#each filteredSubjects as s, idx}
            <tr class="hover:bg-blue-50/50 cursor-pointer" on:click={() => (drawerSubjectIndex = idx)}>
              <td class="py-2 font-mono font-bold text-blue-700">{s.id}</td>
              <td class="py-2 text-slate-600">{s.status}</td>
              <td class="py-2 text-right font-bold text-slate-900">{s.readiness}%</td>
              <td class="py-2">
                <span class="px-2 py-0.5 rounded-full text-[10px] font-semibold border {classBadge(s.classification)}">
                  {s.classification}
                </span>
              </td>
              <td class="py-2 text-slate-600 max-w-xs truncate">{s.keyOpenItems}</td>
              <td class="py-2 text-slate-600">{s.owner}</td>
              <td class="py-2 text-right">
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

{#if drawerSubjectIndex !== null && filteredSubjects[drawerSubjectIndex]}
  <SubjectDrawerV3
    subject={filteredSubjects[drawerSubjectIndex]}
    subjectIndex={drawerSubjectIndex}
    totalSubjects={filteredSubjects.length}
    onClose={() => (drawerSubjectIndex = null)}
    onPrev={() => {
      if (drawerSubjectIndex !== null) {
        drawerSubjectIndex = (drawerSubjectIndex - 1 + filteredSubjects.length) % filteredSubjects.length;
      }
    }}
    onNext={() => {
      if (drawerSubjectIndex !== null) {
        drawerSubjectIndex = (drawerSubjectIndex + 1) % filteredSubjects.length;
      }
    }}
    onOpenActions={() => { drawerSubjectIndex = null; onSelectTab('actions_sim'); }}
  />
{/if}
