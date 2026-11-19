<script lang="ts">
  import { ArrowLeft, ChevronRight, Search, Info } from '@lucide/svelte';
  import { V3_DOMAINS, V3_STUDY_META, V3_SUBJECT_ROWS } from '../data/v3Data';
  import SubjectDrawerV3 from './SubjectDrawerV3.svelte';

  export let selectedDomainId: string = 'edc';
  export let onSelectTab: (tab: string) => void;
  export let onSelectSite: (siteId: string) => void;

  let subTab: 'site' | 'subject' | 'details' = 'site';
  let searchQuery = '';
  let statusFilter = 'all';
  let drawerSubjectId: string | null = null;

  $: drawerSubjectIdx = drawerSubjectId
    ? V3_SUBJECT_ROWS.findIndex((s) => s.id === drawerSubjectId)
    : -1;
  $: drawerSubject = drawerSubjectIdx >= 0 ? V3_SUBJECT_ROWS[drawerSubjectIdx] : null;

  $: currentDomain = V3_DOMAINS.find((d) => d.id === selectedDomainId) || V3_DOMAINS[0];

  $: filteredBreakdown = currentDomain.breakdownRows.filter((r) => {
    const q = searchQuery.trim().toLowerCase();
    const matchesSearch =
      !q ||
      r.country.toLowerCase().includes(q) ||
      r.siteId.toLowerCase().includes(q);
    const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  function statusPill(status: string): string {
    if (status === 'On track') return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    if (status === 'High risk') return 'bg-rose-50 text-rose-700 border-rose-200';
    return 'bg-amber-50 text-amber-700 border-amber-200';
  }

  function dotColor(status: string): string {
    if (status === 'On track') return 'bg-emerald-500';
    if (status === 'High risk') return 'bg-rose-500';
    return 'bg-amber-500';
  }

  // Trend chart geometry
  const W = 320;
  const H = 155;
  const PAD_L = 30;
  const PAD_R = 12;
  const PAD_T = 14;
  const PAD_B = 26;
  const plotW = W - PAD_L - PAD_R;
  const plotH = H - PAD_T - PAD_B;

  $: xPos = (i: number) => PAD_L + (i / Math.max(1, currentDomain.trendSeries.length - 1)) * plotW;
  const yPos = (val: number) => PAD_T + ((100 - val) / 100) * plotH;

  $: actualPoints = currentDomain.trendSeries
    .map((p, i) => (p.actual !== null ? `${xPos(i)},${yPos(p.actual)}` : null))
    .filter(Boolean)
    .join(' ');
  $: expectedPoints = currentDomain.trendSeries
    .map((p, i) => `${xPos(i)},${yPos(p.expected)}`)
    .join(' ');
  $: forecastPoints = currentDomain.trendSeries
    .map((p, i) => (p.forecast !== null ? `${xPos(i)},${yPos(p.forecast)}` : null))
    .filter(Boolean)
    .join(' ');

  // Donut chart geometry
  const R = 42;
  const CIRC = 2 * Math.PI * R;
  $: donutArcs = (() => {
    let offset = 0;
    return currentDomain.donutSegments.map((seg) => {
      const len = (seg.pct / 100) * CIRC;
      const arc = { ...seg, dasharray: `${len} ${CIRC - len}`, dashoffset: -offset };
      offset += len;
      return arc;
    });
  })();
</script>

<div class="space-y-4">
  <!-- Top Header -->
  <div class="bg-white rounded-xl border border-slate-200/80 p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
    <div>
      <button
        type="button"
        on:click={() => onSelectTab('command_centre')}
        class="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-blue-600 mb-1 cursor-pointer"
      >
        <ArrowLeft size={13} /> Back to Study Overview
      </button>
      <div class="flex flex-wrap items-center gap-2.5">
        <h1 class="text-lg font-bold text-slate-900">
          {V3_STUDY_META.protocol} <span class="text-slate-300 font-normal">|</span> Clinical Domain Drill-down
        </h1>
        <span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border {statusPill(currentDomain.status)}">
          <span class="w-1.5 h-1.5 rounded-full {dotColor(currentDomain.status)}"></span>
          {currentDomain.status}
        </span>
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

  <!-- Sidebar + Main Drilldown -->
  <div class="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
    <!-- Left Domain Selector -->
    <aside class="lg:col-span-3 bg-white rounded-xl border border-slate-200/80 p-3 shadow-xs space-y-1">
      <div class="px-2 py-1.5 text-xs font-bold text-slate-700 uppercase tracking-wider">Clinical Domains</div>
      {#each V3_DOMAINS as dom}
        {@const active = dom.id === currentDomain.id}
        <button
          type="button"
          on:click={() => { selectedDomainId = dom.id; searchQuery = ''; statusFilter = 'all'; }}
          class="w-full text-left px-3 py-2.5 rounded-lg border transition-colors flex items-center justify-between cursor-pointer {active ? 'bg-blue-50/90 border-blue-300 shadow-2xs' : 'bg-white border-transparent hover:bg-slate-50'}"
        >
          <div>
            <div class="text-xs font-semibold {active ? 'text-blue-900' : 'text-slate-800'}">{dom.name}</div>
            <div class="flex items-center gap-1.5 mt-1 text-[11px] text-slate-600">
              <span class="font-bold text-slate-900">{dom.readiness}%</span>
              <span class="w-1.5 h-1.5 rounded-full {dotColor(dom.status)}"></span>
              <span>{dom.status}</span>
            </div>
          </div>
          <ChevronRight size={14} class={active ? 'text-blue-600' : 'text-slate-400'} />
        </button>
      {/each}
    </aside>

    <!-- Main Domain Content -->
    <div class="lg:col-span-9 space-y-4">
      <!-- Domain Header & 4 KPI Cards -->
      <div class="bg-white rounded-xl border border-slate-200/80 p-4 shadow-xs">
        <div class="flex flex-wrap items-center justify-between gap-2 mb-4">
          <div>
            <h2 class="text-base font-bold text-slate-900">{currentDomain.name}</h2>
            <p class="text-xs text-slate-500">{currentDomain.subtitle}</p>
          </div>
          <span class="inline-flex items-center gap-1 text-[11px] text-slate-500 border border-slate-200 rounded-lg px-2.5 py-1">
            <Info size={12} /> View Domain Definition
          </span>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
          <div class="rounded-lg border border-slate-200/80 p-3 bg-slate-50/50">
            <div class="text-[11px] font-medium text-slate-500">Domain Readiness</div>
            <div class="mt-1 flex items-baseline gap-2">
              <span class="text-2xl font-bold text-slate-900">{currentDomain.readiness}%</span>
              <span class="text-[11px] font-semibold {currentDomain.variance <= -10 ? 'text-rose-600' : 'text-amber-600'}">
                {currentDomain.variance}% vs expected
              </span>
            </div>
            <div class="mt-2 h-1.5 w-full rounded-full bg-slate-200 overflow-hidden">
              <div
                class="h-full rounded-full {currentDomain.status === 'On track' ? 'bg-emerald-500' : currentDomain.status === 'High risk' ? 'bg-rose-500' : 'bg-amber-500'}"
                style="width: {currentDomain.readiness}%"
              ></div>
            </div>
            <div class="mt-1.5 text-[11px] text-slate-400">Expected today: {currentDomain.expected}%</div>
          </div>

          <div class="rounded-lg border border-slate-200/80 p-3 bg-slate-50/50">
            <div class="text-[11px] font-medium text-slate-500">{currentDomain.kpi2Label}</div>
            <div class="mt-1 flex items-baseline gap-2">
              <span class="text-2xl font-bold text-slate-900">{currentDomain.kpi2Value}</span>
              <span class="text-[11px] font-semibold text-rose-600">{currentDomain.kpi2Delta}</span>
            </div>
            <div class="mt-3 text-[11px] text-slate-500">{currentDomain.kpi2Sub}</div>
          </div>

          <div class="rounded-lg border border-slate-200/80 p-3 bg-slate-50/50">
            <div class="text-[11px] font-medium text-slate-500">{currentDomain.kpi3Label}</div>
            <div class="mt-1 text-2xl font-bold text-slate-900">{currentDomain.kpi3Value}</div>
            <div class="mt-3 text-[11px] text-slate-500">{currentDomain.kpi3Sub}</div>
          </div>

          <div class="rounded-lg border border-slate-200/80 p-3 bg-slate-50/50">
            <div class="text-[11px] font-medium text-slate-500">Predicted Completion Date</div>
            <div class="mt-1 flex items-center gap-2">
              <span class="text-xl font-bold text-slate-900">{currentDomain.predictedCompletion}</span>
              <span class="text-[10px] font-semibold px-1.5 py-0.5 rounded border {statusPill(currentDomain.status)}">
                {currentDomain.status}
              </span>
            </div>
            <div class="mt-3 text-[11px] font-semibold {currentDomain.dblImpactDays > 0 ? 'text-rose-600' : 'text-emerald-600'}">
              Contribution to DBL delay: {currentDomain.dblImpactDays > 0 ? `+${currentDomain.dblImpactDays} day${currentDomain.dblImpactDays > 1 ? 's' : ''}` : '0 days'}
            </div>
          </div>
        </div>
      </div>

      <!-- Charts & Key Insights Row -->
      <div class="grid grid-cols-1 md:grid-cols-12 gap-4">
        <!-- Trend Chart -->
        <div class="md:col-span-5 bg-white rounded-xl border border-slate-200/80 p-4 shadow-xs">
          <div class="flex items-center justify-between mb-2">
            <h3 class="text-xs font-bold text-slate-900">{currentDomain.trendLabel}</h3>
          </div>
          <div class="flex items-center gap-3 text-[10px] text-slate-500 mb-2">
            <span class="inline-flex items-center gap-1"><span class="w-2 h-0.5 bg-blue-600 inline-block"></span> Actual</span>
            <span class="inline-flex items-center gap-1"><span class="w-2 h-0.5 border-t border-dashed border-slate-400 inline-block"></span> Expected</span>
            <span class="inline-flex items-center gap-1"><span class="w-2 h-0.5 border-t border-dashed border-emerald-500 inline-block"></span> Forecast</span>
          </div>
          <svg viewBox="0 0 {W} {H}" class="w-full h-auto">
            {#each [0, 20, 40, 60, 80, 100] as tick}
              <line x1={PAD_L} y1={yPos(tick)} x2={W - PAD_R} y2={yPos(tick)} stroke="#e2e8f0" stroke-width="1" />
              <text x={PAD_L - 5} y={yPos(tick) + 3} text-anchor="end" font-size="8" fill="#94a3b8">{tick}%</text>
            {/each}
            <polyline fill="none" stroke="#94a3b8" stroke-width="1.5" stroke-dasharray="3 3" points={expectedPoints} />
            <polyline fill="none" stroke="#10b981" stroke-width="1.8" stroke-dasharray="3 2" points={forecastPoints} />
            <polyline fill="none" stroke="#2563eb" stroke-width="2.2" points={actualPoints} />
            {#each currentDomain.trendSeries as p, i}
              {#if p.actual !== null}
                <circle cx={xPos(i)} cy={yPos(p.actual)} r="3" fill="#2563eb" />
                <text x={xPos(i)} y={yPos(p.actual) - 6} text-anchor="middle" font-size="8" font-weight="700" fill="#1e293b">{p.actual}%</text>
              {/if}
              <text x={xPos(i)} y={H - 8} text-anchor="middle" font-size="8" fill="#64748b">{p.label}</text>
            {/each}
          </svg>
        </div>

        <!-- Donut Chart -->
        <div class="md:col-span-4 bg-white rounded-xl border border-slate-200/80 p-4 shadow-xs">
          <h3 class="text-xs font-bold text-slate-900 mb-3">{currentDomain.donutTitle}</h3>
          <div class="flex items-center gap-3">
            <svg viewBox="0 0 110 110" class="w-24 h-24 shrink-0">
              <circle cx="55" cy="55" r={R} fill="none" stroke="#f1f5f9" stroke-width="14" />
              {#each donutArcs as arc}
                <circle
                  cx="55"
                  cy="55"
                  r={R}
                  fill="none"
                  stroke={arc.color}
                  stroke-width="14"
                  stroke-dasharray={arc.dasharray}
                  stroke-dashoffset={arc.dashoffset}
                  transform="rotate(-90 55 55)"
                />
              {/each}
              <text x="55" y="53" text-anchor="middle" font-size="13" font-weight="800" fill="#0f172a">{currentDomain.donutCenterValue}</text>
              <text x="55" y="65" text-anchor="middle" font-size="8" fill="#64748b">{currentDomain.donutCenterLabel}</text>
            </svg>
            <div class="space-y-1.5 flex-1 min-w-0">
              {#each currentDomain.donutSegments as seg}
                <div class="flex items-center justify-between text-[11px] gap-1">
                  <span class="inline-flex items-center gap-1.5 truncate text-slate-700">
                    <span class="w-2 h-2 rounded-full shrink-0" style="background:{seg.color}"></span>
                    <span class="truncate">{seg.label}</span>
                  </span>
                  <span class="font-semibold text-slate-900 shrink-0">{seg.count}</span>
                </div>
              {/each}
            </div>
          </div>
        </div>

        <!-- Key Insights -->
        <div class="md:col-span-3 bg-white rounded-xl border border-slate-200/80 p-4 shadow-xs">
          <h3 class="text-xs font-bold text-slate-900 mb-2.5">Key Insights</h3>
          <ol class="space-y-2">
            {#each currentDomain.insights as ins, idx}
              <li class="flex items-start gap-2 text-[11px] text-slate-700 leading-snug">
                <span class="w-4 h-4 rounded-full bg-slate-100 text-slate-600 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">{idx + 1}</span>
                <span>{ins}</span>
              </li>
            {/each}
          </ol>
        </div>
      </div>

      <!-- Breakdown Section -->
      <div class="bg-white rounded-xl border border-slate-200/80 p-4 shadow-xs space-y-3">
        <div class="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
          <div class="flex items-center gap-4 text-xs font-semibold">
            <button type="button" on:click={() => (subTab = 'site')} class="pb-1 border-b-2 cursor-pointer {subTab === 'site' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500'}">
              {currentDomain.breakdownTitle}
            </button>
            <button type="button" on:click={() => (subTab = 'subject')} class="pb-1 border-b-2 cursor-pointer {subTab === 'subject' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500'}">
              Subject Breakdown
            </button>
            <button type="button" on:click={() => (subTab = 'details')} class="pb-1 border-b-2 cursor-pointer {subTab === 'details' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500'}">
              Pending Records
            </button>
          </div>
          <div class="flex items-center gap-2">
            <div class="relative">
              <Search size={12} class="absolute left-2.5 top-2 text-slate-400" />
              <input
                type="text"
                bind:value={searchQuery}
                placeholder="Search site or country..."
                class="pl-7 pr-2.5 py-1 text-xs border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:outline-hidden focus:border-blue-500"
              />
            </div>
            <select bind:value={statusFilter} class="text-xs border border-slate-200 rounded-lg px-2 py-1 bg-white">
              <option value="all">All Status</option>
              <option value="On track">On track</option>
              <option value="At risk">At risk</option>
              <option value="High risk">High risk</option>
            </select>
          </div>
        </div>

        {#if subTab === 'site' || subTab === 'subject'}
          <div class="overflow-x-auto">
            <table class="w-full text-xs">
              <thead>
                <tr class="text-left text-[11px] text-slate-400 border-b border-slate-100">
                  <th class="pb-2 font-medium">Country / Source</th>
                  <th class="pb-2 font-medium">Site ID</th>
                  <th class="pb-2 font-medium text-right">Subjects</th>
                  <th class="pb-2 font-medium text-right">Expected</th>
                  <th class="pb-2 font-medium text-right">Complete</th>
                  <th class="pb-2 font-medium text-right">Incomplete</th>
                  <th class="pb-2 font-medium text-right">% Complete</th>
                  <th class="pb-2 font-medium text-right">Trend (7d)</th>
                  <th class="pb-2 font-medium text-right">Critical</th>
                  <th class="pb-2 font-medium text-right">Status</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                {#each filteredBreakdown as row}
                  <tr
                    class="hover:bg-blue-50/40 cursor-pointer"
                    on:click={() => { if (/^\d+$/.test(row.siteId)) onSelectSite(row.siteId); }}
                  >
                    <td class="py-2 font-medium text-slate-800">{row.country}</td>
                    <td class="py-2 font-mono text-slate-600">{row.siteId}</td>
                    <td class="py-2 text-right text-slate-600">{row.subjects}</td>
                    <td class="py-2 text-right text-slate-600">{row.expected}</td>
                    <td class="py-2 text-right text-slate-600">{row.complete}</td>
                    <td class="py-2 text-right font-semibold text-rose-600">{row.incomplete}</td>
                    <td class="py-2 text-right font-bold text-slate-900">{row.pctComplete}%</td>
                    <td class="py-2 text-right font-semibold {row.trend7d.startsWith('-') ? 'text-rose-600' : 'text-emerald-600'}">{row.trend7d}</td>
                    <td class="py-2 text-right font-semibold {row.criticalItems > 0 ? 'text-rose-600' : 'text-slate-500'}">{row.criticalItems}</td>
                    <td class="py-2 text-right">
                      <span class="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full border {statusPill(row.status)}">
                        <span class="w-1.5 h-1.5 rounded-full {dotColor(row.status)}"></span>
                        {row.status}
                      </span>
                    </td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>
        {/if}

        <!-- Top Pending Items Table -->
        <div class="pt-2 border-t border-slate-100">
          <div class="flex items-center justify-between mb-2">
            <h4 class="text-xs font-bold text-slate-900">{currentDomain.topPendingTitle}</h4>
            <button type="button" on:click={() => onSelectTab('subjects')} class="text-[11px] font-semibold text-blue-600 hover:underline cursor-pointer">
              View All Subjects →
            </button>
          </div>
          <div class="overflow-x-auto">
            <table class="w-full text-xs">
              <thead>
                <tr class="text-left text-[11px] text-slate-400 border-b border-slate-100">
                  <th class="pb-1.5 font-medium">Subject ID</th>
                  <th class="pb-1.5 font-medium">Site</th>
                  <th class="pb-1.5 font-medium">Visit / Scope</th>
                  <th class="pb-1.5 font-medium">Form / Item</th>
                  <th class="pb-1.5 font-medium">Issue</th>
                  <th class="pb-1.5 font-medium text-right">Days Open</th>
                  <th class="pb-1.5 font-medium">Criticality</th>
                  <th class="pb-1.5 font-medium">Owner</th>
                  <th class="pb-1.5 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                {#each currentDomain.topPendingRows as item}
                  <tr class="hover:bg-blue-50/50 cursor-pointer" on:click={() => (drawerSubjectId = item.subjectId)}>
                    <td class="py-2 font-mono font-medium text-blue-700">{item.subjectId}</td>
                    <td class="py-2 text-slate-600">{item.siteId}</td>
                    <td class="py-2 text-slate-600">{item.visit}</td>
                    <td class="py-2 font-medium text-slate-800">{item.form}</td>
                    <td class="py-2 text-slate-600">{item.issue}</td>
                    <td class="py-2 text-right font-semibold text-slate-800">{item.daysOpen}</td>
                    <td class="py-2">
                      <span class="px-1.5 py-0.5 rounded text-[10px] font-semibold {item.criticality === 'Critical' ? 'bg-rose-50 text-rose-700' : item.criticality === 'High' ? 'bg-amber-50 text-amber-700' : 'bg-slate-100 text-slate-700'}">
                        {item.criticality}
                      </span>
                    </td>
                    <td class="py-2 text-slate-600">{item.owner}</td>
                    <td class="py-2 text-right">
                      <span class="text-blue-600 hover:text-blue-800 font-semibold">
                        {item.actionLabel} →
                      </span>
                    </td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>

{#if drawerSubject}
  <SubjectDrawerV3
    subject={drawerSubject}
    subjectIndex={drawerSubjectIdx}
    totalSubjects={V3_SUBJECT_ROWS.length}
    onClose={() => (drawerSubjectId = null)}
    onPrev={() => {
      const prevIdx = (drawerSubjectIdx - 1 + V3_SUBJECT_ROWS.length) % V3_SUBJECT_ROWS.length;
      drawerSubjectId = V3_SUBJECT_ROWS[prevIdx].id;
    }}
    onNext={() => {
      const nextIdx = (drawerSubjectIdx + 1) % V3_SUBJECT_ROWS.length;
      drawerSubjectId = V3_SUBJECT_ROWS[nextIdx].id;
    }}
    onOpenActions={() => { drawerSubjectId = null; onSelectTab('actions_sim'); }}
  />
{/if}
