<script lang="ts">
  import { ArrowLeft, Search, RotateCcw, ChevronRight, ChevronLeft, SlidersHorizontal } from '@lucide/svelte';
  import { V3_STUDY_META, V3_COUNTRY_SUMMARY, V3_SITES } from '../data/v3Data';

  export let countryFilter = 'all';
  export let onSelectTab: (tab: string) => void;
  export let onSelectSite: (siteId: string) => void;

  let riskFilter = 'all';
  let readinessBand: 'all' | 'under70' | '70to84' | '85plus' = 'all';
  let quickFilter: 'all' | 'dbl_delay' | 'hard_gates' | 'low_readiness' = 'all';
  let sortBy: 'impact' | 'readiness_asc' | 'critical' | 'enrolled' = 'impact';
  let searchQuery = '';
  let currentPage = 1;
  let pageSize = 6;

  // Rank sites by DBL impact first (per PDF page 6/22), not readiness % alone
  const normalizedSites = [...V3_SITES].sort(
    (a, b) => b.dblImpactDays - a.dblImpactDays || b.criticalSubjects - a.criticalSubjects || a.readiness - b.readiness
  );

  $: filteredSites = normalizedSites
    .filter((s) => {
      const q = searchQuery.trim().toLowerCase();
      const matchSearch =
        !q ||
        s.id.toLowerCase().includes(q) ||
        s.name.toLowerCase().includes(q) ||
        s.country.toLowerCase().includes(q) ||
        s.piName.toLowerCase().includes(q) ||
        s.primaryDriver.toLowerCase().includes(q);
      const matchCountry = countryFilter === 'all' || s.country === countryFilter;
      const matchRisk = riskFilter === 'all' || s.riskLevel === riskFilter;
      const matchBand =
        readinessBand === 'all' ||
        (readinessBand === 'under70' && s.readiness < 70) ||
        (readinessBand === '70to84' && s.readiness >= 70 && s.readiness < 85) ||
        (readinessBand === '85plus' && s.readiness >= 85);
      const matchQuick =
        quickFilter === 'all' ||
        (quickFilter === 'dbl_delay' && s.dblImpactDays > 0) ||
        (quickFilter === 'hard_gates' && s.hardGateBlockers > 0) ||
        (quickFilter === 'low_readiness' && s.readiness < 75);
      return matchSearch && matchCountry && matchRisk && matchBand && matchQuick;
    })
    .sort((a, b) => {
      if (sortBy === 'readiness_asc') return a.readiness - b.readiness;
      if (sortBy === 'critical') return b.criticalSubjects - a.criticalSubjects || b.hardGateBlockers - a.hardGateBlockers;
      if (sortBy === 'enrolled') return b.enrolled - a.enrolled;
      return b.dblImpactDays - a.dblImpactDays || b.criticalSubjects - a.criticalSubjects || a.readiness - b.readiness;
    });

  $: totalPages = Math.max(1, Math.ceil(filteredSites.length / pageSize));
  $: if (currentPage > totalPages) currentPage = 1;
  $: pagedSites = filteredSites.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  $: activeFilterCount =
    (countryFilter !== 'all' ? 1 : 0) +
    (riskFilter !== 'all' ? 1 : 0) +
    (readinessBand !== 'all' ? 1 : 0) +
    (quickFilter !== 'all' ? 1 : 0) +
    (searchQuery.trim() ? 1 : 0);

  function resetAllFilters() {
    countryFilter = 'all';
    riskFilter = 'all';
    readinessBand = 'all';
    quickFilter = 'all';
    searchQuery = '';
    sortBy = 'impact';
    currentPage = 1;
  }

  $: distBuckets = [
    { label: '≥ 90%\n(Highly Ready)', count: normalizedSites.filter((s) => s.readiness >= 90).length, color: '#10b981' },
    { label: '70–89%\n(Monitor)', count: normalizedSites.filter((s) => s.readiness >= 70 && s.readiness < 90).length, color: '#f59e0b' },
    { label: '50–69%\n(At Risk)', count: normalizedSites.filter((s) => s.readiness >= 50 && s.readiness < 70).length, color: '#f97316' },
    { label: '< 50%\n(High Risk)', count: normalizedSites.filter((s) => s.readiness < 50).length, color: '#ef4444' },
  ];

  $: maxBucket = Math.max(1, ...distBuckets.map((b) => b.count));

  function riskBadge(risk: string): string {
    if (risk === 'On track') return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    if (risk === 'High risk') return 'bg-rose-50 text-rose-700 border-rose-200';
    return 'bg-amber-50 text-amber-700 border-amber-200';
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
          {V3_STUDY_META.protocol} <span class="text-slate-300 font-normal">|</span> Sites & Countries
        </h1>
        <span class="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
          At Risk
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

  <!-- 6 KPI Strip -->
  <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
    <div class="bg-white rounded-xl border border-slate-200/80 p-3.5 shadow-xs">
      <div class="text-[11px] text-slate-500">Total Sites</div>
      <div class="mt-1 flex items-baseline gap-1.5">
        <span class="text-2xl font-bold text-slate-900">18</span>
        <span class="text-xs text-slate-400">6 countries</span>
      </div>
    </div>
    <div class="bg-white rounded-xl border border-slate-200/80 p-3.5 shadow-xs">
      <div class="text-[11px] text-slate-500">Sites On Track</div>
      <div class="mt-1 flex items-baseline gap-1.5">
        <span class="text-2xl font-bold text-slate-900">11</span>
        <span class="text-xs font-semibold text-emerald-600">61%</span>
      </div>
    </div>
    <div class="bg-white rounded-xl border border-slate-200/80 p-3.5 shadow-xs">
      <div class="text-[11px] text-slate-500">At Risk Sites</div>
      <div class="mt-1 flex items-baseline gap-1.5">
        <span class="text-2xl font-bold text-slate-900">5</span>
        <span class="text-xs font-semibold text-amber-600">28%</span>
      </div>
    </div>
    <div class="bg-white rounded-xl border border-slate-200/80 p-3.5 shadow-xs">
      <div class="text-[11px] text-slate-500">High Risk Sites</div>
      <div class="mt-1 flex items-baseline gap-1.5">
        <span class="text-2xl font-bold text-slate-900">2</span>
        <span class="text-xs font-semibold text-rose-600">11%</span>
      </div>
    </div>
    <div class="bg-white rounded-xl border border-slate-200/80 p-3.5 shadow-xs">
      <div class="text-[11px] text-slate-500">Total Subjects</div>
      <div class="mt-1 text-2xl font-bold text-slate-900">220</div>
    </div>
    <div class="bg-white rounded-xl border border-slate-200/80 p-3.5 shadow-xs">
      <div class="text-[11px] text-slate-500">Subjects Not Lock Ready</div>
      <div class="mt-1 flex items-baseline gap-1.5">
        <span class="text-2xl font-bold text-slate-900">48</span>
        <span class="text-xs font-semibold text-rose-600">22%</span>
      </div>
    </div>
  </div>

  <!-- Filters + Content -->
  <div class="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
    <!-- Left Filter Sidebar -->
    <aside class="lg:col-span-3 bg-white rounded-xl border border-slate-200/80 p-4 shadow-xs space-y-3.5">
      <div class="flex items-center justify-between pb-2 border-b border-slate-100">
        <div class="flex items-center gap-1.5">
          <SlidersHorizontal size={13} class="text-slate-500" />
          <h2 class="text-xs font-bold text-slate-900 uppercase tracking-wider">Filters</h2>
          {#if activeFilterCount > 0}
            <span class="px-1.5 py-0.5 rounded-full bg-blue-600 text-white text-[10px] font-bold">{activeFilterCount}</span>
          {/if}
        </div>
        <button
          type="button"
          on:click={resetAllFilters}
          class="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:underline cursor-pointer"
        >
          <RotateCcw size={11} /> Reset
        </button>
      </div>

      <div>
        <label for="sc-search" class="block text-[11px] font-semibold text-slate-600 mb-1">Search Site / PI / Driver</label>
        <div class="relative">
          <Search size={12} class="absolute left-2.5 top-2.5 text-slate-400" />
          <input
            id="sc-search"
            type="text"
            bind:value={searchQuery}
            on:input={() => (currentPage = 1)}
            placeholder="e.g. 104, 317, Boston..."
            class="w-full pl-7 pr-2.5 py-1.5 text-xs border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:outline-hidden focus:border-blue-500"
          />
        </div>
      </div>

      <div class="grid grid-cols-1 gap-2.5">
        <div>
          <label for="sc-country" class="block text-[11px] font-semibold text-slate-600 mb-1">Country</label>
          <select id="sc-country" bind:value={countryFilter} on:change={() => (currentPage = 1)} class="w-full text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white">
            <option value="all">All Countries ({V3_COUNTRY_SUMMARY.length})</option>
            {#each V3_COUNTRY_SUMMARY as c}
              <option value={c.country}>{c.flag} {c.country} ({c.sites})</option>
            {/each}
          </select>
        </div>

        <div>
          <label for="sc-risk" class="block text-[11px] font-semibold text-slate-600 mb-1">Risk Level</label>
          <select id="sc-risk" bind:value={riskFilter} on:change={() => (currentPage = 1)} class="w-full text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white">
            <option value="all">All Risk Levels</option>
            <option value="High risk">High risk</option>
            <option value="At risk">At risk</option>
            <option value="On track">On track</option>
          </select>
        </div>

        <div>
          <label for="sc-band" class="block text-[11px] font-semibold text-slate-600 mb-1">Readiness Band</label>
          <select id="sc-band" bind:value={readinessBand} on:change={() => (currentPage = 1)} class="w-full text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white">
            <option value="all">All Readiness Levels</option>
            <option value="under70">Below 70% (Critical)</option>
            <option value="70to84">70% – 84% (Monitor)</option>
            <option value="85plus">85%+ (Ready)</option>
          </select>
        </div>
      </div>

      <!-- Quick Filter Chips -->
      <div class="pt-2 border-t border-slate-100 space-y-1.5">
        <div class="text-[11px] font-bold text-slate-700">Quick Filters</div>
        <div class="flex flex-wrap gap-1.5">
          {#each [
            { id: 'all', label: `All (${normalizedSites.length})` },
            { id: 'dbl_delay', label: `DBL Delay (${normalizedSites.filter((s) => s.dblImpactDays > 0).length})` },
            { id: 'hard_gates', label: `Hard Gates (${normalizedSites.filter((s) => s.hardGateBlockers > 0).length})` },
            { id: 'low_readiness', label: `< 75% Ready (${normalizedSites.filter((s) => s.readiness < 75).length})` },
          ] as qf}
            <button
              type="button"
              on:click={() => { quickFilter = qf.id as any; currentPage = 1; }}
              class="px-2 py-1 rounded-md text-[11px] font-medium border transition-colors cursor-pointer {quickFilter === qf.id ? 'bg-blue-50 border-blue-300 text-blue-700 font-semibold' : 'bg-slate-50 border-slate-200/80 text-slate-600 hover:bg-slate-100'}"
            >
              {qf.label}
            </button>
          {/each}
        </div>
      </div>

      <!-- Country Quick Cards -->
      <div class="pt-2 border-t border-slate-100 space-y-1.5">
        <div class="text-[11px] font-bold text-slate-700">Country Risk Summary</div>
        {#each V3_COUNTRY_SUMMARY as c}
          <button
            type="button"
            on:click={() => { countryFilter = countryFilter === c.country ? 'all' : c.country; currentPage = 1; }}
            class="w-full text-left p-2 rounded-lg border transition-colors cursor-pointer {countryFilter === c.country ? 'border-blue-300 bg-blue-50/70' : 'border-slate-200/70 hover:bg-slate-50'}"
          >
            <div class="flex items-center justify-between text-xs">
              <span class="font-semibold text-slate-800">{c.flag} {c.country}</span>
              <span class="font-bold {c.readiness < 70 ? 'text-rose-600' : c.readiness < 80 ? 'text-amber-600' : 'text-emerald-600'}">{c.readiness}%</span>
            </div>
            <div class="flex items-center justify-between text-[10px] text-slate-500 mt-0.5">
              <span>{c.sites} sites · {c.subjectsNotReady} subj not ready</span>
              <span>{c.forecastDays > 0 ? `+${c.forecastDays}d` : '0d'}</span>
            </div>
          </button>
        {/each}
      </div>
    </aside>

    <!-- Main Right Area -->
    <div class="lg:col-span-9 space-y-4">
      <div class="grid grid-cols-1 md:grid-cols-12 gap-4">
        <!-- Site Readiness Distribution -->
        <div class="md:col-span-6 bg-white rounded-xl border border-slate-200/80 p-4 shadow-xs">
          <h3 class="text-xs font-bold text-slate-900 mb-3">Site Readiness Distribution</h3>
          <div class="grid grid-cols-4 gap-3 items-end h-36 pt-4">
            {#each distBuckets as b}
              <div class="flex flex-col items-center h-full justify-end">
                <span class="text-xs font-bold text-slate-800 mb-1">{b.count}</span>
                <div
                  class="w-10 rounded-t-md transition-all"
                  style="height: {Math.max(12, (b.count / maxBucket) * 84)}px; background: {b.color};"
                ></div>
                <div class="text-[10px] text-slate-500 text-center mt-1.5 whitespace-pre-line leading-tight">{b.label}</div>
              </div>
            {/each}
          </div>
        </div>

        <!-- Top 5 Sites by DB Lock Impact -->
        <div class="md:col-span-6 bg-white rounded-xl border border-slate-200/80 p-4 shadow-xs">
          <div class="flex items-center justify-between mb-2.5">
            <h3 class="text-xs font-bold text-slate-900">Top 5 Sites by DB Lock Impact</h3>
            <span class="text-[11px] text-slate-400">Ranked by DBL impact</span>
          </div>
          <table class="w-full text-xs">
            <thead>
              <tr class="text-left text-[11px] text-slate-400 border-b border-slate-100">
                <th class="pb-1.5 font-medium">Site ID</th>
                <th class="pb-1.5 font-medium">Country</th>
                <th class="pb-1.5 font-medium text-right">Readiness</th>
                <th class="pb-1.5 font-medium text-right">Crit Subj</th>
                <th class="pb-1.5 font-medium text-right">DBL Impact</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              {#each normalizedSites.slice(0, 5) as s}
                <tr class="hover:bg-blue-50/40 cursor-pointer" on:click={() => onSelectSite(s.id)}>
                  <td class="py-2 font-mono font-bold text-blue-700">{s.id}</td>
                  <td class="py-2 text-slate-700">{s.country}</td>
                  <td class="py-2 text-right font-semibold text-slate-900">{s.readiness}%</td>
                  <td class="py-2 text-right text-slate-700">{s.criticalSubjects}</td>
                  <td class="py-2 text-right font-bold {s.dblImpactDays >= 2 ? 'text-rose-600' : s.dblImpactDays > 0 ? 'text-amber-600' : 'text-slate-500'}">
                    {s.dblImpactDays > 0 ? `+${s.dblImpactDays} days` : '0 days'}
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      </div>

      <!-- Site Details Table with Pagination -->
      <div class="bg-white rounded-xl border border-slate-200/80 p-4 shadow-xs">
        <div class="flex flex-wrap items-center justify-between gap-2 mb-3">
          <div>
            <h3 class="text-xs font-bold text-slate-900">Site Details · {filteredSites.length} matching sites</h3>
            <span class="text-[11px] text-slate-400">Click any site to open Site Intervention Workspace</span>
          </div>
          <div class="flex items-center gap-2 text-xs">
            <label for="sc-sort" class="text-[11px] text-slate-500">Sort:</label>
            <select id="sc-sort" bind:value={sortBy} on:change={() => (currentPage = 1)} class="text-xs border border-slate-200 rounded-lg px-2 py-1 bg-white">
              <option value="impact">DBL Impact</option>
              <option value="readiness_asc">Readiness (Low → High)</option>
              <option value="critical">Critical Subjects</option>
              <option value="enrolled">Enrolled Subjects</option>
            </select>
            <select bind:value={pageSize} on:change={() => (currentPage = 1)} class="text-xs border border-slate-200 rounded-lg px-2 py-1 bg-white">
              <option value={6}>6 / page</option>
              <option value={10}>10 / page</option>
              <option value={18}>All (18)</option>
            </select>
          </div>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full text-xs">
            <thead>
              <tr class="text-left text-[11px] text-slate-400 border-b border-slate-100">
                <th class="pb-2 font-medium">Site ID</th>
                <th class="pb-2 font-medium">Site Name</th>
                <th class="pb-2 font-medium">Country</th>
                <th class="pb-2 font-medium text-right">Enrolled</th>
                <th class="pb-2 font-medium text-right">Site Readiness</th>
                <th class="pb-2 font-medium">Risk Level</th>
                <th class="pb-2 font-medium">Key Issues / Primary Driver</th>
                <th class="pb-2 font-medium">Est. Site Ready</th>
                <th class="pb-2 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              {#each pagedSites as s}
                <tr class="hover:bg-blue-50/40 cursor-pointer" on:click={() => onSelectSite(s.id)}>
                  <td class="py-2.5 font-mono font-bold text-blue-700">{s.id}</td>
                  <td class="py-2.5 font-medium text-slate-800">{s.name}</td>
                  <td class="py-2.5 text-slate-600">{s.country}</td>
                  <td class="py-2.5 text-right text-slate-600">{s.enrolled}</td>
                  <td class="py-2.5 text-right font-bold text-slate-900">{s.readiness}%</td>
                  <td class="py-2.5">
                    <span class="px-2 py-0.5 rounded-full text-[11px] font-medium border {riskBadge(s.riskLevel)}">
                      {s.riskLevel}
                    </span>
                  </td>
                  <td class="py-2.5 text-slate-600">{s.primaryDriver}</td>
                  <td class="py-2.5 text-slate-600">{s.estReadyDate}</td>
                  <td class="py-2.5 text-right">
                    <span class="inline-flex items-center gap-0.5 text-blue-600 font-semibold">
                      View <ChevronRight size={13} />
                    </span>
                  </td>
                </tr>
              {:else}
                <tr>
                  <td colspan="9" class="py-8 text-center text-xs text-slate-400">
                    No sites match the current filters.
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>

        <!-- Pagination Bar -->
        <div class="flex flex-wrap items-center justify-between gap-2 pt-3 mt-3 border-t border-slate-100 text-xs">
          <span class="text-slate-500">
            Showing {filteredSites.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, filteredSites.length)} of {filteredSites.length} sites · Page {currentPage} of {totalPages}
          </span>
          <div class="flex items-center gap-1.5">
            <button
              type="button"
              disabled={currentPage === 1}
              on:click={() => (currentPage = Math.max(1, currentPage - 1))}
              class="inline-flex items-center gap-1 px-2.5 py-1 rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-medium disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <ChevronLeft size={13} /> Previous
            </button>
            {#each Array.from({ length: totalPages }, (_, i) => i + 1) as p}
              <button
                type="button"
                on:click={() => (currentPage = p)}
                class="w-7 h-7 rounded-md text-xs font-semibold border cursor-pointer {currentPage === p ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}"
              >
                {p}
              </button>
            {/each}
            <button
              type="button"
              disabled={currentPage === totalPages}
              on:click={() => (currentPage = Math.min(totalPages, currentPage + 1))}
              class="inline-flex items-center gap-1 px-2.5 py-1 rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-medium disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              Next <ChevronRight size={13} />
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
