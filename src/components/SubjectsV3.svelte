<script lang="ts">
  import { ArrowLeft, Search, RotateCcw, ChevronRight } from '@lucide/svelte';
  import { V3_STUDY_META, V3_SUBJECT_ROWS, V3_COUNTRY_SUMMARY } from '../data/v3Data';
  import SubjectDrawerV3 from './SubjectDrawerV3.svelte';

  export let onSelectTab: (tab: string) => void;

  let countryFilter = 'all';
  let siteFilter = 'all';
  let readinessFilter = 'all';
  let quickFilter: 'all' | 'lock_pop' | 'hard_blocked' | 'endpoint' | 'sae' = 'all';
  let searchQuery = '';
  let currentPage = 1;
  let pageSize = 25;

  let drawerSubjectIndex: number | null = null;

  $: filteredSubjects = V3_SUBJECT_ROWS.filter((s) => {
    const q = searchQuery.trim().toLowerCase();
    const matchSearch =
      !q ||
      s.id.toLowerCase().includes(q) ||
      s.siteId.toLowerCase().includes(q) ||
      s.country.toLowerCase().includes(q);
    const matchCountry = countryFilter === 'all' || s.country === countryFilter;
    const matchSite = siteFilter === 'all' || s.siteId === siteFilter;
    const matchReadiness = readinessFilter === 'all' || s.classification === readinessFilter;
    const matchQuick =
      quickFilter === 'all' ||
      (quickFilter === 'lock_pop' && s.lockPopulation) ||
      (quickFilter === 'hard_blocked' && s.classification === 'Hard Blocked') ||
      (quickFilter === 'endpoint' && s.hasEndpointIssue) ||
      (quickFilter === 'sae' && s.hasSae);
    return matchSearch && matchCountry && matchSite && matchReadiness && matchQuick;
  });

  $: totalPages = Math.max(1, Math.ceil(filteredSubjects.length / pageSize));
  $: if (currentPage > totalPages) currentPage = 1;
  $: pagedSubjects = filteredSubjects.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  // Donut data matching page 37 (220 subjects: 158 Lock Ready, 32 Conditionally Ready, 20 Action Required, 10 Hard Blocked)
  const subjectDonut = [
    { label: 'Lock Ready', count: 158, pct: 72, color: '#10b981' },
    { label: 'Conditionally Ready', count: 32, pct: 15, color: '#f59e0b' },
    { label: 'Action Required', count: 20, pct: 9, color: '#f97316' },
    { label: 'Hard Blocked', count: 10, pct: 5, color: '#ef4444' },
  ];
  const R = 40;
  const CIRC = 2 * Math.PI * R;
  const donutArcs = (() => {
    let offset = 0;
    return subjectDonut.map((seg) => {
      const len = (seg.pct / 100) * CIRC;
      const arc = { ...seg, dasharray: `${len} ${CIRC - len}`, dashoffset: -offset };
      offset += len;
      return arc;
    });
  })();

  const domainOpenBars = [
    { label: 'External Data Reconciliation', count: 48 },
    { label: 'Query Resolution', count: 42 },
    { label: 'PI Signatures', count: 28 },
    { label: 'Safety Reconciliation', count: 22 },
    { label: 'EDC Data Cleaning', count: 18 },
    { label: 'Medical Coding', count: 16 },
    { label: 'Protocol Deviations', count: 14 },
    { label: 'SDV / SDR', count: 12 },
  ];

  const topSitesNotReady = [
    { siteId: '317', country: 'Germany', total: 28, notReady: 18, pct: 64 },
    { siteId: '405', country: 'South Korea', total: 24, notReady: 12, pct: 50 },
    { siteId: '208', country: 'France', total: 26, notReady: 8, pct: 31 },
    { siteId: '104', country: 'United States', total: 34, notReady: 6, pct: 18 },
    { siteId: '118', country: 'Spain', total: 12, notReady: 4, pct: 33 },
  ];

  function classBadge(c: string): string {
    if (c === 'Lock Ready') return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    if (c === 'Conditionally Ready') return 'bg-amber-50 text-amber-700 border-amber-200';
    if (c === 'Action Required') return 'bg-orange-50 text-orange-700 border-orange-200';
    return 'bg-rose-50 text-rose-700 border-rose-200';
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
          {V3_STUDY_META.protocol} <span class="text-slate-300 font-normal">|</span> Subjects
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
      <div class="text-[11px] text-slate-500">Total Subjects</div>
      <div class="mt-1 flex items-baseline gap-1.5">
        <span class="text-2xl font-bold text-slate-900">220</span>
        <span class="text-xs text-slate-400">100%</span>
      </div>
    </div>
    <div class="bg-white rounded-xl border border-slate-200/80 p-3.5 shadow-xs">
      <div class="text-[11px] text-slate-500">Subjects Lock Ready</div>
      <div class="mt-1 flex items-baseline gap-1.5">
        <span class="text-2xl font-bold text-slate-900">158</span>
        <span class="text-xs font-semibold text-emerald-600">72%</span>
      </div>
    </div>
    <div class="bg-white rounded-xl border border-slate-200/80 p-3.5 shadow-xs">
      <div class="text-[11px] text-slate-500">Conditionally Ready</div>
      <div class="mt-1 flex items-baseline gap-1.5">
        <span class="text-2xl font-bold text-slate-900">32</span>
        <span class="text-xs font-semibold text-amber-600">15%</span>
      </div>
    </div>
    <div class="bg-white rounded-xl border border-slate-200/80 p-3.5 shadow-xs">
      <div class="text-[11px] text-slate-500">Action Required</div>
      <div class="mt-1 flex items-baseline gap-1.5">
        <span class="text-2xl font-bold text-slate-900">20</span>
        <span class="text-xs font-semibold text-orange-600">9%</span>
      </div>
    </div>
    <div class="bg-white rounded-xl border border-slate-200/80 p-3.5 shadow-xs">
      <div class="text-[11px] text-slate-500">Hard Blocked</div>
      <div class="mt-1 flex items-baseline gap-1.5">
        <span class="text-2xl font-bold text-slate-900">10</span>
        <span class="text-xs font-semibold text-rose-600">5%</span>
      </div>
    </div>
    <div class="bg-white rounded-xl border border-slate-200/80 p-3.5 shadow-xs">
      <div class="text-[11px] text-slate-500">Forecast: All Subjects Ready</div>
      <div class="mt-1 flex items-baseline gap-1.5">
        <span class="text-lg font-bold text-slate-900">18 Dec 2026</span>
        <span class="text-[11px] font-semibold text-emerald-600">-3d</span>
      </div>
    </div>
  </div>

  <!-- Filters + Main Grid -->
  <div class="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
    <aside class="lg:col-span-3 bg-white rounded-xl border border-slate-200/80 p-4 shadow-xs space-y-3.5">
      <div class="flex items-center justify-between">
        <h2 class="text-xs font-bold text-slate-900 uppercase tracking-wider">Filters</h2>
        <button
          type="button"
          on:click={() => { countryFilter = 'all'; readinessFilter = 'all'; quickFilter = 'all'; searchQuery = ''; }}
          class="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:underline cursor-pointer"
        >
          <RotateCcw size={11} /> Reset
        </button>
      </div>
      <div>
        <label for="sub-country" class="block text-[11px] font-medium text-slate-500 mb-1">Country</label>
        <select id="sub-country" bind:value={countryFilter} class="w-full text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white">
          <option value="all">All Countries</option>
          {#each V3_COUNTRY_SUMMARY as c}
            <option value={c.country}>{c.country}</option>
          {/each}
        </select>
      </div>
      <div>
        <label for="sub-class" class="block text-[11px] font-medium text-slate-500 mb-1">Subject Readiness</label>
        <select id="sub-class" bind:value={readinessFilter} class="w-full text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white">
          <option value="all">All Classifications</option>
          <option value="Hard Blocked">Hard Blocked</option>
          <option value="Action Required">Action Required</option>
          <option value="Conditionally Ready">Conditionally Ready</option>
          <option value="Lock Ready">Lock Ready</option>
        </select>
      </div>
      <div>
        <label for="sub-search" class="block text-[11px] font-medium text-slate-500 mb-1">Search Subject ID</label>
        <div class="relative">
          <Search size={12} class="absolute left-2.5 top-2.5 text-slate-400" />
          <input
            id="sub-search"
            type="text"
            bind:value={searchQuery}
            placeholder="e.g. CA209-301-104-012"
            class="w-full pl-7 pr-2.5 py-1.5 text-xs border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:outline-hidden focus:border-blue-500"
          />
        </div>
      </div>

      <div class="pt-2 border-t border-slate-100 space-y-1.5">
        <div class="text-[11px] font-bold text-slate-700 mb-1">Quick Filters</div>
        {#each [
          { id: 'all', label: 'All Subjects (220)' },
          { id: 'lock_pop', label: 'Lock Population (n=180)' },
          { id: 'hard_blocked', label: 'Hard Blocked (10)' },
          { id: 'endpoint', label: 'Endpoint-Critical Subjects (24)' },
          { id: 'sae', label: 'SAE Subjects (18)' },
        ] as qf}
          <button
            type="button"
            on:click={() => (quickFilter = qf.id as any)}
            class="w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer {quickFilter === qf.id ? 'bg-blue-50 border-blue-300 text-blue-800 font-semibold' : 'bg-white border-slate-200/70 text-slate-700 hover:bg-slate-50'}"
          >
            {qf.label}
          </button>
        {/each}
      </div>
    </aside>

    <!-- Main Right Area -->
    <div class="lg:col-span-9 space-y-4">
      <!-- Top Visuals Row -->
      <div class="grid grid-cols-1 md:grid-cols-12 gap-4">
        <!-- Donut -->
        <div class="md:col-span-5 bg-white rounded-xl border border-slate-200/80 p-4 shadow-xs">
          <h3 class="text-xs font-bold text-slate-900 mb-3">Subject Readiness Distribution</h3>
          <div class="flex items-center gap-4">
            <svg viewBox="0 0 110 110" class="w-28 h-28 shrink-0">
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
              <text x="55" y="52" text-anchor="middle" font-size="14" font-weight="800" fill="#0f172a">220</text>
              <text x="55" y="65" text-anchor="middle" font-size="8.5" fill="#64748b">Subjects</text>
            </svg>
            <div class="space-y-2 flex-1">
              {#each subjectDonut as seg}
                <div class="flex items-center justify-between text-xs">
                  <span class="inline-flex items-center gap-1.5 text-slate-700">
                    <span class="w-2.5 h-2.5 rounded-full" style="background:{seg.color}"></span>
                    {seg.label}
                  </span>
                  <span class="font-bold text-slate-900">{seg.count} <span class="font-normal text-slate-400">({seg.pct}%)</span></span>
                </div>
              {/each}
            </div>
          </div>
        </div>

        <!-- Subjects by Key Domain with Open Items -->
        <div class="md:col-span-7 bg-white rounded-xl border border-slate-200/80 p-4 shadow-xs">
          <h3 class="text-xs font-bold text-slate-900 mb-3">Subjects by Key Domain with Open Items</h3>
          <div class="space-y-2">
            {#each domainOpenBars as b}
              <div class="grid grid-cols-12 items-center gap-2 text-[11px]">
                <span class="col-span-5 text-slate-700 truncate font-medium">{b.label}</span>
                <div class="col-span-6 h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div class="h-full bg-blue-600 rounded-full" style="width: {(b.count / 50) * 100}%"></div>
                </div>
                <span class="col-span-1 text-right font-bold text-slate-900">{b.count}</span>
              </div>
            {/each}
          </div>
        </div>
      </div>

      <!-- Top 5 Sites by Subjects Not Lock Ready + Key Insights -->
      <div class="grid grid-cols-1 md:grid-cols-12 gap-4">
        <div class="md:col-span-7 bg-white rounded-xl border border-slate-200/80 p-4 shadow-xs">
          <h3 class="text-xs font-bold text-slate-900 mb-2.5">Top 5 Sites by Subjects Not Lock Ready</h3>
          <table class="w-full text-xs">
            <thead>
              <tr class="text-left text-[11px] text-slate-400 border-b border-slate-100">
                <th class="pb-1.5 font-medium">Site ID</th>
                <th class="pb-1.5 font-medium">Country</th>
                <th class="pb-1.5 font-medium text-right">Total Subjects</th>
                <th class="pb-1.5 font-medium text-right">Not Lock Ready</th>
                <th class="pb-1.5 font-medium text-right">% Not Ready</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              {#each topSitesNotReady as r}
                <tr
                  class="hover:bg-blue-50/50 cursor-pointer {siteFilter === r.siteId ? 'bg-blue-50/70' : ''}"
                  on:click={() => { siteFilter = siteFilter === r.siteId ? 'all' : r.siteId; currentPage = 1; }}
                >
                  <td class="py-1.5 font-mono font-bold text-blue-700">{r.siteId}</td>
                  <td class="py-1.5 text-slate-700">{r.country}</td>
                  <td class="py-1.5 text-right text-slate-600">{r.total}</td>
                  <td class="py-1.5 text-right font-semibold text-slate-900">{r.notReady}</td>
                  <td class="py-1.5 text-right font-bold {r.pct >= 50 ? 'text-rose-600' : 'text-amber-600'}">{r.pct}%</td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>

        <div class="md:col-span-5 bg-white rounded-xl border border-slate-200/80 p-4 shadow-xs">
          <h3 class="text-xs font-bold text-slate-900 mb-2.5">Key Insights</h3>
          <ol class="space-y-2 text-[11px] text-slate-700">
            <li><span class="font-bold text-slate-900">1.</span> 10 subjects are hard blocked, of which 6 are due to external data reconciliation and 2 due to SAE discrepancies.</li>
            <li><span class="font-bold text-slate-900">2.</span> Site 317 (DE) and 405 (KR) contribute to 60% of subjects not lock ready.</li>
            <li><span class="font-bold text-slate-900">3.</span> 24 endpoint-critical subjects are not yet ready for lock.</li>
            <li><span class="font-bold text-slate-900">4.</span> If current closure velocity continues, all subjects are expected to be ready by 18 Dec 2026 (3 days before predicted DBL).</li>
          </ol>
        </div>
      </div>

      <!-- Subject List Table -->
      <div class="bg-white rounded-xl border border-slate-200/80 p-4 shadow-xs">
        <div class="flex flex-wrap items-center justify-between gap-2 mb-3">
          <div class="flex items-center gap-2">
            <h3 class="text-xs font-bold text-slate-900">Subject List · Click any row to open Subject Details Drawer</h3>
            {#if siteFilter !== 'all'}
              <button
                type="button"
                on:click={() => (siteFilter = 'all')}
                class="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-[11px] font-semibold cursor-pointer"
              >
                Site {siteFilter} ×
              </button>
            {/if}
          </div>
          <div class="flex items-center gap-2 text-[11px] text-slate-500">
            <span>Showing {pagedSubjects.length} of {filteredSubjects.length} subjects</span>
            <select bind:value={pageSize} on:change={() => (currentPage = 1)} class="border border-slate-200 rounded px-1.5 py-0.5 bg-white text-xs">
              <option value={25}>25 / page</option>
              <option value={50}>50 / page</option>
              <option value={220}>All (220)</option>
            </select>
          </div>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full text-xs">
            <thead>
              <tr class="text-left text-[11px] text-slate-400 border-b border-slate-100">
                <th class="pb-2 font-medium">Subject ID</th>
                <th class="pb-2 font-medium">Country</th>
                <th class="pb-2 font-medium">Site ID</th>
                <th class="pb-2 font-medium">Status</th>
                <th class="pb-2 font-medium text-right">Readiness</th>
                <th class="pb-2 font-medium">Classification</th>
                <th class="pb-2 font-medium">Key Open Items</th>
                <th class="pb-2 font-medium">Criticality</th>
                <th class="pb-2 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              {#each pagedSubjects as s, idx}
                <tr class="hover:bg-blue-50/50 cursor-pointer" on:click={() => (drawerSubjectIndex = (currentPage - 1) * pageSize + idx)}>
                  <td class="py-2.5 font-mono font-bold text-blue-700">{s.id}</td>
                  <td class="py-2.5 text-slate-600">{s.country}</td>
                  <td class="py-2.5 font-mono text-slate-600">{s.siteId}</td>
                  <td class="py-2.5 text-slate-600">{s.status}</td>
                  <td class="py-2.5 text-right font-bold text-slate-900">{s.readiness}%</td>
                  <td class="py-2.5">
                    <span class="px-2 py-0.5 rounded-full text-[11px] font-medium border {classBadge(s.classification)}">
                      {s.classification}
                    </span>
                  </td>
                  <td class="py-2.5 text-slate-600 max-w-xs truncate">{s.keyOpenItems}</td>
                  <td class="py-2.5">
                    <span class="font-semibold {s.criticality === 'Critical' ? 'text-rose-600' : s.criticality === 'High' ? 'text-amber-600' : 'text-slate-600'}">
                      {s.criticality}
                    </span>
                  </td>
                  <td class="py-2.5 text-right">
                    <span class="inline-flex items-center gap-0.5 text-blue-600 font-semibold">
                      View <ChevronRight size={13} />
                    </span>
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
        {#if totalPages > 1}
          <div class="flex items-center justify-between pt-3 mt-3 border-t border-slate-100 text-xs">
            <span class="text-slate-500">Page {currentPage} of {totalPages}</span>
            <div class="flex items-center gap-2">
              <button
                type="button"
                disabled={currentPage === 1}
                on:click={() => (currentPage = Math.max(1, currentPage - 1))}
                class="px-2.5 py-1 rounded border border-slate-200 bg-white text-slate-700 disabled:opacity-40 cursor-pointer"
              >
                Previous
              </button>
              <button
                type="button"
                disabled={currentPage === totalPages}
                on:click={() => (currentPage = Math.min(totalPages, currentPage + 1))}
                class="px-2.5 py-1 rounded border border-slate-200 bg-white text-slate-700 disabled:opacity-40 cursor-pointer"
              >
                Next
              </button>
            </div>
          </div>
        {/if}
      </div>
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
