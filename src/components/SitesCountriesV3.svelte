<script lang="ts">
  import { ArrowLeft, Search, RotateCcw, ChevronRight } from '@lucide/svelte';
  import { V3_STUDY_META, V3_COUNTRY_SUMMARY } from '../data/v3Data';

  export let sites: any[] = [];
  export let onSelectTab: (tab: string) => void;
  export let onSelectSite: (siteId: string) => void;

  let countryFilter = 'all';
  let riskFilter = 'all';
  let searchQuery = '';

  function normalizeSite(s: any) {
    const readiness = s.readinessScore ?? s.readiness ?? 75;
    const riskLevel =
      readiness < 60
        ? 'High risk'
        : readiness < 80
        ? 'At risk'
        : 'On track';
    const criticalSubjects = s.criticalSubjects ?? Math.max(0, Math.round(((100 - readiness) / 100) * (s.enrolledSubjects ?? 20) * 0.4));
    const dblImpact =
      s.dblImpactDays ?? (readiness < 60 ? 3 : readiness < 75 ? 2 : readiness < 85 ? 1 : 0);
    return {
      id: s.id,
      name: s.name,
      country: s.country,
      enrolled: s.enrolledSubjects ?? 24,
      completed: s.completedSubjects ?? Math.max(10, (s.enrolledSubjects ?? 24) - 4),
      readiness,
      riskLevel,
      criticalSubjects,
      dblImpact,
      primaryDriver:
        s.primaryDriver ??
        (readiness < 60
          ? 'Pending lab data, 10 critical queries'
          : readiness < 80
          ? '6 PI signatures, 4 data entry'
          : '1 routine query'),
      lastActivity: s.lastActivity ?? '28 Oct 2026',
      estReadyDate: s.estReadyDate ?? (dblImpact > 0 ? '14 Dec 2026' : '08 Dec 2026'),
    };
  }

  // Rank sites by DBL impact first (per PDF page 6/22), not readiness % alone
  $: normalizedSites = sites
    .map(normalizeSite)
    .sort((a, b) => b.dblImpact - a.dblImpact || b.criticalSubjects - a.criticalSubjects || a.readiness - b.readiness);

  $: filteredSites = normalizedSites.filter((s) => {
    const q = searchQuery.trim().toLowerCase();
    const matchSearch =
      !q ||
      s.id.toLowerCase().includes(q) ||
      s.name.toLowerCase().includes(q) ||
      s.country.toLowerCase().includes(q);
    const matchCountry = countryFilter === 'all' || s.country === countryFilter;
    const matchRisk = riskFilter === 'all' || s.riskLevel === riskFilter;
    return matchSearch && matchCountry && matchRisk;
  });

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
      <div class="flex items-center justify-between">
        <h2 class="text-xs font-bold text-slate-900 uppercase tracking-wider">Filters</h2>
        <button
          type="button"
          on:click={() => { countryFilter = 'all'; riskFilter = 'all'; searchQuery = ''; }}
          class="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:underline cursor-pointer"
        >
          <RotateCcw size={11} /> Reset
        </button>
      </div>
      <div>
        <label for="sc-country" class="block text-[11px] font-medium text-slate-500 mb-1">Country</label>
        <select id="sc-country" bind:value={countryFilter} class="w-full text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white">
          <option value="all">All Countries</option>
          {#each V3_COUNTRY_SUMMARY as c}
            <option value={c.country}>{c.country}</option>
          {/each}
        </select>
      </div>
      <div>
        <label for="sc-risk" class="block text-[11px] font-medium text-slate-500 mb-1">Risk Level</label>
        <select id="sc-risk" bind:value={riskFilter} class="w-full text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white">
          <option value="all">All</option>
          <option value="High risk">High risk</option>
          <option value="At risk">At risk</option>
          <option value="On track">On track</option>
        </select>
      </div>
      <div>
        <label for="sc-search" class="block text-[11px] font-medium text-slate-500 mb-1">Search Site ID / Name</label>
        <div class="relative">
          <Search size={12} class="absolute left-2.5 top-2.5 text-slate-400" />
          <input
            id="sc-search"
            type="text"
            bind:value={searchQuery}
            placeholder="e.g. 104, 317, Boston..."
            class="w-full pl-7 pr-2.5 py-1.5 text-xs border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:outline-hidden focus:border-blue-500"
          />
        </div>
      </div>

      <!-- Country Quick Cards -->
      <div class="pt-2 border-t border-slate-100 space-y-2">
        <div class="text-[11px] font-bold text-slate-700">Country Risk Summary</div>
        {#each V3_COUNTRY_SUMMARY as c}
          <button
            type="button"
            on:click={() => (countryFilter = countryFilter === c.country ? 'all' : c.country)}
            class="w-full text-left p-2.5 rounded-lg border transition-colors cursor-pointer {countryFilter === c.country ? 'border-blue-300 bg-blue-50/70' : 'border-slate-200/70 hover:bg-slate-50'}"
          >
            <div class="flex items-center justify-between text-xs">
              <span class="font-semibold text-slate-800">{c.flag} {c.country}</span>
              <span class="font-bold {c.readiness < 70 ? 'text-rose-600' : c.readiness < 80 ? 'text-amber-600' : 'text-emerald-600'}">{c.readiness}%</span>
            </div>
            <div class="flex items-center justify-between text-[10px] text-slate-500 mt-1">
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
                  <td class="py-2 text-right font-bold {s.dblImpact >= 2 ? 'text-rose-600' : s.dblImpact > 0 ? 'text-amber-600' : 'text-slate-500'}">
                    {s.dblImpact > 0 ? `+${s.dblImpact} days` : '0 days'}
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      </div>

      <!-- Site Details Table -->
      <div class="bg-white rounded-xl border border-slate-200/80 p-4 shadow-xs">
        <div class="flex items-center justify-between mb-3">
          <h3 class="text-xs font-bold text-slate-900">Site Details (All Countries) · {filteredSites.length} sites</h3>
          <span class="text-[11px] text-slate-400">Click any site to open Site Intervention Workspace</span>
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
              {#each filteredSites as s}
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
              {/each}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</div>
