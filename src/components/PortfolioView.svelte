<script lang="ts">
  import {
    Search,
    SlidersHorizontal,
    Table,
    LayoutGrid,
    ArrowRight,
    TrendingUp,
    TrendingDown,
    FolderKanban,
    CheckCircle2,
    AlertTriangle,
    ShieldAlert,
    Lightbulb,
    ChevronRight,
    ChevronDown,
    Globe2,
    Calendar,
    Sparkles
  } from '@lucide/svelte';

  export let portfolioStudies: any[];
  export let onSelectStudy: (studyId: string) => void;

  // Filter state
  let selectedSponsor = 'all';
  let selectedTherapeuticArea = 'all';
  let selectedPhase = 'all';
  let selectedStatus = 'active';
  let selectedMilestone = 'dbl';
  let selectedRegion = 'all';
  let showOnTrack = true;
  let showAtRisk = true;
  let showHighRisk = true;
  let searchQuery = '';
  let sortBy = 'dbl_earliest';
  let viewLayout = 'table';
  let currentPage = 1;
  const pageSize = 8;

  function clearAllFilters() {
    selectedSponsor = 'all';
    selectedTherapeuticArea = 'all';
    selectedPhase = 'all';
    selectedStatus = 'active';
    selectedMilestone = 'dbl';
    selectedRegion = 'all';
    showOnTrack = true;
    showAtRisk = true;
    showHighRisk = true;
    searchQuery = '';
    currentPage = 1;
  }

  // Reactive filtering
  $: filteredStudies = portfolioStudies.filter(s => {
    // Risk status filter
    if (s.status === 'On track' && !showOnTrack) return false;
    if (s.status === 'At risk' && !showAtRisk) return false;
    if (s.status === 'High risk' && !showHighRisk) return false;

    // TA filter
    if (selectedTherapeuticArea !== 'all' && s.therapeuticArea.toLowerCase() !== selectedTherapeuticArea.toLowerCase()) return false;
    // Phase filter
    if (selectedPhase !== 'all' && !s.phase.toLowerCase().includes(selectedPhase.toLowerCase())) return false;
    // Region filter
    if (selectedRegion !== 'all' && !s.region.toLowerCase().includes(selectedRegion.toLowerCase())) return false;

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match = s.id.toLowerCase().includes(q) ||
        s.name.toLowerCase().includes(q) ||
        s.indication.toLowerCase().includes(q) ||
        s.therapeuticArea.toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  // Sort
  $: sortedStudies = [...filteredStudies].sort((a, b) => {
    if (sortBy === 'dbl_earliest') {
      return new Date(a.forecastDbl).getTime() - new Date(b.forecastDbl).getTime();
    }
    if (sortBy === 'readiness_asc') {
      return a.readinessScore - b.readinessScore;
    }
    if (sortBy === 'delay_desc') {
      return b.delayDays - a.delayDays;
    }
    return 0;
  });

  $: paginatedStudies = sortedStudies.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  $: totalPages = Math.ceil(sortedStudies.length / pageSize) || 1;

  function getReadinessPill(score: number) {
    if (score < 70) return 'bg-rose-100 text-rose-800 border-rose-200';
    if (score < 90) return 'bg-amber-100 text-amber-800 border-amber-200';
    return 'bg-emerald-100 text-emerald-800 border-emerald-200';
  }

  function getStatusBadge(status: string) {
    if (status === 'High risk') return 'bg-rose-50 text-rose-700 border-rose-200';
    if (status === 'At risk') return 'bg-amber-50 text-amber-700 border-amber-200';
    return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  }

  function getSparklinePoints(trend: number[]) {
    if (!trend || trend.length < 2) return '';
    const min = Math.min(...trend) - 5;
    const max = Math.max(...trend) + 5;
    const range = max - min || 1;
    const width = 60;
    const height = 18;
    return trend.map((val, idx) => {
      const x = (idx / (trend.length - 1)) * width;
      const y = height - ((val - min) / range) * height;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(' ');
  }
</script>

<div class="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
  
  <!-- ========================================================================= -->
  <!-- LEFT COLUMN: FILTERS SIDEBAR                                              -->
  <!-- ========================================================================= -->
  <aside class="lg:col-span-1 bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-5">
    <div class="flex items-center justify-between pb-3 border-b border-slate-100">
      <h3 class="font-bold text-slate-900 text-sm flex items-center space-x-2">
        <SlidersHorizontal size={16} class="text-blue-600" />
        <span>Filters</span>
      </h3>
      <button
        on:click={clearAllFilters}
        class="text-xs text-blue-600 hover:text-blue-800 font-semibold cursor-pointer"
      >
        Clear all
      </button>
    </div>

    <!-- Sponsor Filter -->
    <div class="space-y-1.5">
      <label class="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Sponsor</label>
      <div class="relative">
        <select
          bind:value={selectedSponsor}
          class="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg py-2 px-2.5 text-slate-800 appearance-none focus:outline-hidden focus:border-blue-500"
        >
          <option value="all">All sponsors</option>
          <option value="global_biopharma">Global Biopharma Inc.</option>
          <option value="partner_alliance">Oncology Partner Alliance</option>
        </select>
        <ChevronDown size={14} class="absolute right-2.5 top-2.5 text-slate-400 pointer-events-none" />
      </div>
    </div>

    <!-- Therapeutic Area Filter -->
    <div class="space-y-1.5">
      <label class="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Therapeutic area</label>
      <div class="relative">
        <select
          bind:value={selectedTherapeuticArea}
          class="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg py-2 px-2.5 text-slate-800 appearance-none focus:outline-hidden focus:border-blue-500"
        >
          <option value="all">All therapeutic areas</option>
          <option value="oncology">Oncology</option>
          <option value="cardiovascular">Cardiovascular</option>
          <option value="immunology">Immunology</option>
          <option value="neurology">Neurology</option>
          <option value="rare disease">Rare Disease</option>
          <option value="gastroenterology">Gastroenterology</option>
          <option value="vaccines">Vaccines</option>
          <option value="metabolic">Metabolic</option>
        </select>
        <ChevronDown size={14} class="absolute right-2.5 top-2.5 text-slate-400 pointer-events-none" />
      </div>
    </div>

    <!-- Phase Filter -->
    <div class="space-y-1.5">
      <label class="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Phase</label>
      <div class="relative">
        <select
          bind:value={selectedPhase}
          class="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg py-2 px-2.5 text-slate-800 appearance-none focus:outline-hidden focus:border-blue-500"
        >
          <option value="all">All phases</option>
          <option value="phase ii">Phase II</option>
          <option value="phase iii">Phase III</option>
          <option value="phase i/ii">Phase I/II</option>
        </select>
        <ChevronDown size={14} class="absolute right-2.5 top-2.5 text-slate-400 pointer-events-none" />
      </div>
    </div>

    <!-- Study Status Filter -->
    <div class="space-y-1.5">
      <label class="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Study status</label>
      <div class="relative">
        <select
          bind:value={selectedStatus}
          class="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg py-2 px-2.5 text-slate-800 appearance-none focus:outline-hidden focus:border-blue-500"
        >
          <option value="active">Active</option>
          <option value="all">All statuses</option>
          <option value="locked">Locked</option>
        </select>
        <ChevronDown size={14} class="absolute right-2.5 top-2.5 text-slate-400 pointer-events-none" />
      </div>
    </div>

    <!-- Milestone Focus -->
    <div class="space-y-1.5">
      <label class="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Milestone focus</label>
      <div class="relative">
        <select
          bind:value={selectedMilestone}
          class="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg py-2 px-2.5 text-slate-800 appearance-none focus:outline-hidden focus:border-blue-500"
        >
          <option value="dbl">Database lock</option>
          <option value="lslv">Last Subject Last Visit</option>
          <option value="csr">Clinical Study Report</option>
        </select>
        <ChevronDown size={14} class="absolute right-2.5 top-2.5 text-slate-400 pointer-events-none" />
      </div>
    </div>

    <!-- Region Filter -->
    <div class="space-y-1.5">
      <label class="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Region</label>
      <div class="relative">
        <select
          bind:value={selectedRegion}
          class="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg py-2 px-2.5 text-slate-800 appearance-none focus:outline-hidden focus:border-blue-500"
        >
          <option value="all">All regions</option>
          <option value="global">Global</option>
          <option value="us">US / North America</option>
          <option value="eu">Europe</option>
          <option value="apac">APAC</option>
        </select>
        <ChevronDown size={14} class="absolute right-2.5 top-2.5 text-slate-400 pointer-events-none" />
      </div>
    </div>

    <!-- Risk Category Checkboxes -->
    <div class="space-y-2 pt-2 border-t border-slate-100">
      <label class="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Risk category</label>
      <div class="space-y-2 text-xs text-slate-700">
        <label class="flex items-center justify-between cursor-pointer group">
          <div class="flex items-center space-x-2">
            <input
              type="checkbox"
              bind:checked={showOnTrack}
              class="rounded text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
            />
            <span class="group-hover:text-slate-900 font-medium">On track (&ge; 90)</span>
          </div>
          <span class="text-xs text-slate-400 font-semibold">4</span>
        </label>
        <label class="flex items-center justify-between cursor-pointer group">
          <div class="flex items-center space-x-2">
            <input
              type="checkbox"
              bind:checked={showAtRisk}
              class="rounded text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
            />
            <span class="group-hover:text-slate-900 font-medium">At risk (70–89)</span>
          </div>
          <span class="text-xs text-slate-400 font-semibold">5</span>
        </label>
        <label class="flex items-center justify-between cursor-pointer group">
          <div class="flex items-center space-x-2">
            <input
              type="checkbox"
              bind:checked={showHighRisk}
              class="rounded text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
            />
            <span class="group-hover:text-slate-900 font-medium">High risk (&lt; 70)</span>
          </div>
          <span class="text-xs text-slate-400 font-semibold">3</span>
        </label>
      </div>
    </div>

    <!-- Search Box -->
    <div class="space-y-1.5 pt-2 border-t border-slate-100">
      <label class="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Search</label>
      <div class="relative">
        <Search size={14} class="absolute left-2.5 top-2.5 text-slate-400" />
        <input
          type="text"
          bind:value={searchQuery}
          placeholder="Study ID, indication or keyword"
          class="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg py-2 pl-8 pr-2.5 text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-blue-500"
        />
      </div>
    </div>

    <!-- Tip Card -->
    <div class="p-3.5 rounded-lg bg-blue-50/70 border border-blue-200/80 text-xs text-blue-900 flex items-start space-x-2.5">
      <Lightbulb size={16} class="text-blue-600 shrink-0 mt-0.5" />
      <div>
        <strong class="font-bold block text-[11px] text-blue-950 uppercase tracking-wide">Tip</strong>
        <p class="text-[11px] text-blue-800 mt-0.5 leading-relaxed">
          Focus on at-risk and high-risk studies to take early action and prevent DBL delays.
        </p>
      </div>
    </div>

  </aside>

  <!-- ========================================================================= -->
  <!-- RIGHT COLUMN: MAIN PORTFOLIO CONTENT                                      -->
  <!-- ========================================================================= -->
  <div class="lg:col-span-3 space-y-5">
    
    <!-- Hero Banner with Globe Graphic -->
    <div class="relative rounded-2xl bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950 text-white p-6 sm:p-7 overflow-hidden shadow-md border border-slate-800">
      <!-- Background subtle decorative network lines -->
      <div class="absolute -right-10 -bottom-10 w-72 h-72 rounded-full bg-blue-500/10 blur-2xl pointer-events-none"></div>
      <div class="absolute right-12 top-1/2 -translate-y-1/2 hidden md:block opacity-25 pointer-events-none">
        <Globe2 size={180} class="text-blue-300 stroke-[1]" />
      </div>

      <div class="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div class="max-w-xl">
          <div class="text-[10px] font-extrabold uppercase tracking-widest text-blue-300 flex items-center space-x-2">
            <span>A UNIFIED VIEW. A MORE PREDICTABLE TOMORROW.</span>
          </div>
          <h1 class="text-2xl sm:text-3xl font-extrabold text-white mt-1.5 tracking-tight">
            Study portfolio, greater confidence.
          </h1>
          <p class="text-xs sm:text-sm text-slate-300 mt-2 leading-relaxed">
            Monitor database lock readiness across your studies, prioritise attention and take action early.
          </p>
        </div>

        <div class="shrink-0 p-4 rounded-xl bg-white/10 backdrop-blur-md border border-white/15 max-w-xs text-xs text-blue-100">
          <div class="flex items-center space-x-2 font-semibold text-white mb-1">
            <Sparkles size={15} class="text-amber-400" />
            <span>DBLock AI Advantage</span>
          </div>
          <p class="text-[11px] text-blue-200/90 leading-relaxed">
            Turning data into a faster, more predictable path to patients.
          </p>
        </div>
      </div>
    </div>

    <!-- 4 KPI Metrics Row -->
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
      
      <!-- Total Studies -->
      <div class="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex items-center space-x-3.5">
        <div class="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
          <FolderKanban size={20} />
        </div>
        <div>
          <div class="text-2xl font-extrabold text-slate-900 num-tabular">12</div>
          <div class="text-xs font-semibold text-slate-600">Total studies</div>
          <div class="text-[10px] text-slate-400">Across 4 therapeutic areas</div>
        </div>
      </div>

      <!-- On Track -->
      <div class="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex items-center space-x-3.5">
        <div class="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
          <CheckCircle2 size={20} />
        </div>
        <div>
          <div class="text-2xl font-extrabold text-slate-900 num-tabular">4</div>
          <div class="text-xs font-semibold text-slate-600">On track</div>
          <div class="text-[10px] text-slate-400">&ge; 90 readiness score</div>
        </div>
      </div>

      <!-- At Risk -->
      <div class="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex items-center space-x-3.5">
        <div class="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
          <AlertTriangle size={20} />
        </div>
        <div>
          <div class="text-2xl font-extrabold text-slate-900 num-tabular">5</div>
          <div class="text-xs font-semibold text-slate-600">At risk</div>
          <div class="text-[10px] text-slate-400">Readiness 70–89</div>
        </div>
      </div>

      <!-- High Risk -->
      <div class="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex items-center space-x-3.5">
        <div class="w-10 h-10 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
          <ShieldAlert size={20} />
        </div>
        <div>
          <div class="text-2xl font-extrabold text-slate-900 num-tabular">3</div>
          <div class="text-xs font-semibold text-slate-600">High risk</div>
          <div class="text-[10px] text-slate-400">Readiness &lt; 70</div>
        </div>
      </div>

    </div>

    <!-- Main Study Portfolio Table Panel -->
    <div class="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
      
      <!-- Toolbar -->
      <div class="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 class="text-base font-bold text-slate-900">Study portfolio</h2>
          <p class="text-xs text-slate-500 mt-0.5">
            Select a study to explore readiness, risks and recommended actions.
          </p>
        </div>

        <div class="flex items-center space-x-3 self-end sm:self-center">
          <!-- Sort dropdown -->
          <div class="flex items-center space-x-1.5 text-xs text-slate-600">
            <span class="text-slate-400">Sort by:</span>
            <select
              bind:value={sortBy}
              class="bg-slate-50 border border-slate-200 rounded-lg py-1.5 px-2 text-xs font-medium text-slate-800 focus:outline-hidden"
            >
              <option value="dbl_earliest">DBL date (earliest)</option>
              <option value="delay_desc">Forecast delay (highest)</option>
              <option value="readiness_asc">Readiness (lowest first)</option>
            </select>
          </div>

          <!-- View Toggle -->
          <div class="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
            <button
              on:click={() => viewLayout = 'table'}
              class="px-2.5 py-1 rounded-md text-xs font-semibold flex items-center space-x-1 transition-all {viewLayout === 'table' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'}"
            >
              <Table size={13} />
              <span>Table</span>
            </button>
            <button
              on:click={() => viewLayout = 'cards'}
              class="px-2.5 py-1 rounded-md text-xs font-semibold flex items-center space-x-1 transition-all {viewLayout === 'cards' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'}"
            >
              <LayoutGrid size={13} />
              <span>Cards</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Table Layout -->
      {#if viewLayout === 'table'}
        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse text-xs">
            <thead>
              <tr class="bg-slate-50/80 text-slate-500 border-b border-slate-200 text-[10px] font-bold uppercase tracking-wider">
                <th class="py-3 px-4">Study ID</th>
                <th class="py-3 px-3">Indication</th>
                <th class="py-3 px-2">Phase</th>
                <th class="py-3 px-3">Region</th>
                <th class="py-3 px-3">Planned LSLV</th>
                <th class="py-3 px-3">Planned DBL</th>
                <th class="py-3 px-3">Forecast DBL</th>
                <th class="py-3 px-3 text-center">Readiness</th>
                <th class="py-3 px-2 text-center">Critical Blockers</th>
                <th class="py-3 px-3 text-center">High-risk Sites</th>
                <th class="py-3 px-3">Trend (last 4w)</th>
                <th class="py-3 px-3">Status</th>
                <th class="py-3 px-3 text-right"></th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 font-medium text-slate-700">
              {#each paginatedStudies as study}
                <tr
                  class="hover:bg-blue-50/40 transition-colors cursor-pointer group {study.id === 'CA-209-301' ? 'bg-blue-50/20' : ''}"
                  on:click={() => onSelectStudy(study.id)}
                >
                  <!-- Study ID & Title -->
                  <td class="py-3.5 px-4 font-bold text-slate-900 whitespace-nowrap">
                    <div class="flex items-center space-x-2">
                      <span class="w-1 h-8 rounded-full {study.status === 'High risk' ? 'bg-rose-500' : study.status === 'At risk' ? 'bg-amber-500' : 'bg-emerald-500'}"></span>
                      <div>
                        <span class="group-hover:text-blue-600 transition-colors">{study.id}</span>
                        <div class="text-[11px] font-normal text-slate-400">{study.therapeuticArea}</div>
                      </div>
                    </div>
                  </td>

                  <!-- Indication -->
                  <td class="py-3.5 px-3 text-slate-800 font-semibold">{study.indication}</td>

                  <!-- Phase -->
                  <td class="py-3.5 px-2 text-slate-600">{study.phaseShort}</td>

                  <!-- Region -->
                  <td class="py-3.5 px-3 text-slate-600">{study.region}</td>

                  <!-- Planned LSLV -->
                  <td class="py-3.5 px-3 text-slate-600 font-mono text-[11px]">{study.plannedLslv}</td>

                  <!-- Planned DBL -->
                  <td class="py-3.5 px-3 text-slate-600 font-mono text-[11px]">{study.plannedDbl}</td>

                  <!-- Forecast DBL with Variance Badge -->
                  <td class="py-3.5 px-3 whitespace-nowrap">
                    <div class="font-mono text-[11px] font-bold text-slate-900">{study.forecastDbl}</div>
                    {#if study.delayDays > 0}
                      <span class="inline-block text-[10px] font-bold text-rose-600">
                        (+{study.delayDays}d)
                      </span>
                    {:else}
                      <span class="inline-block text-[10px] font-bold text-emerald-600">
                        (0d)
                      </span>
                    {/if}
                  </td>

                  <!-- Readiness Score Pill -->
                  <td class="py-3.5 px-3 text-center">
                    <span class="inline-flex items-center justify-center px-2 py-0.5 rounded-md font-bold text-xs border num-tabular {getReadinessPill(study.readinessScore)}">
                      {study.readinessScore}
                    </span>
                  </td>

                  <!-- Critical Blockers -->
                  <td class="py-3.5 px-2 text-center font-bold {study.criticalBlockers > 5 ? 'text-rose-600' : study.criticalBlockers > 0 ? 'text-amber-600' : 'text-slate-600'}">
                    {study.criticalBlockers}
                  </td>

                  <!-- High Risk Sites -->
                  <td class="py-3.5 px-3 text-center font-medium text-slate-600">
                    {study.highRiskSites}
                  </td>

                  <!-- Sparkline SVG -->
                  <td class="py-3.5 px-3">
                    <svg class="w-16 h-5 overflow-visible" viewBox="0 0 60 18">
                      <polyline
                        fill="none"
                        stroke={study.status === 'High risk' ? '#f43f5e' : study.status === 'At risk' ? '#f59e0b' : '#10b981'}
                        stroke-width="1.8"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        points={getSparklinePoints(study.trend)}
                      />
                    </svg>
                  </td>

                  <!-- Status Badge -->
                  <td class="py-3.5 px-3 whitespace-nowrap">
                    <span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border {getStatusBadge(study.status)}">
                      {study.status}
                    </span>
                  </td>

                  <!-- Arrow CTA -->
                  <td class="py-3.5 px-3 text-right">
                    <button
                      class="text-slate-400 group-hover:text-blue-600 transition-colors p-1 rounded-md hover:bg-blue-50"
                      aria-label="Open study {study.id}"
                    >
                      <ArrowRight size={15} />
                    </button>
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      {:else}
        <!-- Cards Grid View -->
        <div class="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
          {#each paginatedStudies as study}
            <div
              class="p-4 rounded-xl border border-slate-200 hover:border-blue-400 hover:shadow-md transition-all cursor-pointer bg-white group flex flex-col justify-between"
              on:click={() => onSelectStudy(study.id)}
            >
              <div>
                <div class="flex items-center justify-between mb-2">
                  <span class="font-extrabold text-sm text-slate-900 group-hover:text-blue-600 transition-colors">
                    {study.id}
                  </span>
                  <span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border {getStatusBadge(study.status)}">
                    {study.status}
                  </span>
                </div>
                <div class="text-xs font-semibold text-slate-800">{study.name}</div>
                <div class="text-[11px] text-slate-500 mt-0.5">{study.indication} &middot; {study.phase} &middot; {study.region}</div>

                <div class="grid grid-cols-3 gap-2 my-3 p-2.5 rounded-lg bg-slate-50 border border-slate-100 text-center">
                  <div>
                    <span class="text-[10px] text-slate-400 uppercase font-semibold block">Readiness</span>
                    <strong class="text-xs font-bold {study.readinessScore < 70 ? 'text-rose-600' : study.readinessScore < 90 ? 'text-amber-600' : 'text-emerald-600'}">
                      {study.readinessScore}/100
                    </strong>
                  </div>
                  <div>
                    <span class="text-[10px] text-slate-400 uppercase font-semibold block">Forecast DBL</span>
                    <strong class="text-xs font-bold text-slate-800">{study.forecastDbl}</strong>
                  </div>
                  <div>
                    <span class="text-[10px] text-slate-400 uppercase font-semibold block">Delay</span>
                    <strong class="text-xs font-bold {study.delayDays > 0 ? 'text-rose-600' : 'text-emerald-600'}">
                      {study.delayDays > 0 ? `+${study.delayDays}d` : '0d'}
                    </strong>
                  </div>
                </div>
              </div>

              <div class="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                <span class="text-slate-500 text-[11px]">{study.criticalBlockers} blockers &middot; {study.highRiskSites} sites</span>
                <span class="text-blue-600 font-bold flex items-center space-x-1 group-hover:translate-x-1 transition-transform">
                  <span>Open Study</span>
                  <ArrowRight size={13} />
                </span>
              </div>
            </div>
          {/each}
        </div>
      {/if}

      <!-- Pagination Footer -->
      <div class="px-5 py-3.5 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-xs text-slate-600">
        <div>
          Showing <span class="font-bold text-slate-800">1–{Math.min(paginatedStudies.length, pageSize)}</span> of <span class="font-bold text-slate-800">{sortedStudies.length}</span> studies
        </div>

        <div class="flex items-center space-x-1.5">
          <button
            disabled={currentPage === 1}
            on:click={() => currentPage = Math.max(1, currentPage - 1)}
            class="px-2.5 py-1 rounded-md border border-slate-200 bg-white font-semibold hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Prev
          </button>
          {#each Array(totalPages) as _, idx}
            <button
              on:click={() => currentPage = idx + 1}
              class="w-7 h-7 rounded-md font-bold text-xs transition-colors {currentPage === idx + 1 ? 'bg-blue-600 text-white' : 'border border-slate-200 bg-white hover:bg-slate-50 text-slate-700'}"
            >
              {idx + 1}
            </button>
          {/each}
          <button
            disabled={currentPage === totalPages}
            on:click={() => currentPage = Math.min(totalPages, currentPage + 1)}
            class="px-2.5 py-1 rounded-md border border-slate-200 bg-white font-semibold hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      </div>

    </div>

  </div>

</div>
