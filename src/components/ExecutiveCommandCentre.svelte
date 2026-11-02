<script lang="ts">
  import {
    ArrowRight,
    Calendar,
    AlertTriangle,
    CheckCircle2,
    Clock,
    TrendingUp,
    ShieldAlert,
    HelpCircle,
    Compass,
    Sparkles,
    ChevronRight,
    Activity,
    Info
  } from '@lucide/svelte';

  export let study: any;
  export let actions: any[];
  export let timelineSnapshots: any[];
  export let onSelectTab: (tab: string) => void;
  export let onSelectSite: (id: string) => void;

  // Sparkline/Trend points for the dual-axis chart
  const weeks = ['Week -4', 'Week -3', 'Week -2', 'Week -1', 'Current'];
  const readinessPoints = [63, 66, 69, 71, 72];
  const delayPoints = [7, 5, 4, 3, 6];

  let hoveredPoint: number | null = null;
</script>

<div class="space-y-6">

  <!-- ========================================================================= -->
  <!-- HERO BANNER: STUDY COMMAND CENTRE                                         -->
  <!-- ========================================================================= -->
  <div class="relative rounded-2xl bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950 text-white p-6 sm:p-7 overflow-hidden shadow-md border border-slate-800">
    <div class="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
      <div class="max-w-xl">
        <div class="flex items-center space-x-2.5">
          <span class="text-[10px] font-extrabold uppercase tracking-widest text-blue-300">
            STUDY COMMAND CENTRE
          </span>
          <span class="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[10px] font-bold">
            Active
          </span>
        </div>
        <h1 class="text-2xl sm:text-3xl font-extrabold text-white mt-1.5 tracking-tight flex items-baseline space-x-3">
          <span>{study.protocol}</span>
          <span class="text-sm font-normal text-slate-300">Oncology &middot; Phase II &middot; Global</span>
        </h1>
        <p class="text-xs sm:text-sm text-slate-300 mt-2 leading-relaxed">
          Know what will delay database lock, why it matters and what to do next.
        </p>
      </div>

      <div class="shrink-0 p-4 rounded-xl bg-white/10 backdrop-blur-md border border-white/15 max-w-xs text-xs text-blue-100">
        <div class="flex items-center space-x-2 font-semibold text-white mb-1">
          <Sparkles size={15} class="text-blue-300" />
          <span>Milestone Acceleration</span>
        </div>
        <p class="text-[11px] text-blue-200/90 leading-relaxed">
          From data signals to a faster, more predictable future.
        </p>
      </div>
    </div>
  </div>

  <!-- ========================================================================= -->
  <!-- 4 TOP KPI CARDS                                                           -->
  <!-- ========================================================================= -->
  <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
    
    <!-- DBL Readiness Score Gauge -->
    <div class="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex items-center justify-between">
      <div>
        <div class="text-[11px] font-bold text-slate-500 uppercase tracking-wider">DBL Readiness Score</div>
        <div class="flex items-baseline space-x-2 mt-1">
          <span class="text-3xl font-extrabold text-slate-900 num-tabular">{study.overallReadinessScore}</span>
          <span class="text-sm text-slate-400 font-semibold">/100</span>
        </div>
        <div class="flex items-center space-x-1 mt-1 text-emerald-600 text-xs font-bold">
          <TrendingUp size={13} />
          <span>+5 vs. last week</span>
        </div>
      </div>

      <!-- Ring gauge -->
      <div class="relative w-16 h-16 shrink-0 flex items-center justify-center">
        <svg class="w-16 h-16 -rotate-90" viewBox="0 0 36 36">
          <circle cx="18" cy="18" r="14" fill="none" class="stroke-slate-100" stroke-width="3.5" />
          <circle
            cx="18" cy="18" r="14" fill="none"
            class="stroke-blue-600"
            stroke-width="3.5"
            stroke-dasharray="88"
            stroke-dashoffset={88 - (88 * study.overallReadinessScore / 100)}
            stroke-linecap="round"
          />
        </svg>
        <span class="absolute text-xs font-bold text-slate-700">{study.overallReadinessScore}%</span>
      </div>
    </div>

    <!-- Forecast DBL Date -->
    <div class="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
      <div class="flex items-center justify-between">
        <span class="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Forecast DBL Date</span>
        <Calendar size={15} class="text-blue-600" />
      </div>
      <div class="text-2xl font-extrabold text-slate-900 mt-1 num-tabular">
        {study.forecastDbl}
      </div>
      <div class="text-xs font-bold text-rose-600 mt-0.5">
        (+{study.delayDays} days vs. plan)
      </div>
      <div class="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
        <span>Range: {study.confidenceInterval.replace('2026', '')}</span>
        <span class="font-medium text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
          Moderate
        </span>
      </div>
    </div>

    <!-- Critical Blockers -->
    <div class="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
      <div class="flex items-center justify-between">
        <span class="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Critical Blockers</span>
        <AlertTriangle size={15} class="text-rose-500" />
      </div>
      <div class="text-3xl font-extrabold text-slate-900 mt-1 num-tabular">
        {study.criticalBlockersCount}
      </div>
      <div class="text-xs font-medium text-slate-600 mt-0.5">
        Issues on the DBL path
      </div>
      <div class="text-[11px] text-rose-600 font-bold mt-1">
        &uarr; +2 vs. last week
      </div>
    </div>

    <!-- Higher-risk Sites -->
    <div
      class="bg-white rounded-xl border border-slate-200 p-4 shadow-xs hover:border-blue-400 cursor-pointer transition-all group flex flex-col justify-between"
      on:click={() => onSelectTab('risk_matrix')}
    >
      <div>
        <div class="flex items-center justify-between">
          <span class="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Higher-risk Sites</span>
          <ChevronRight size={16} class="text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" />
        </div>
        <div class="text-3xl font-extrabold text-slate-900 mt-1 num-tabular">
          {study.highRiskSitesCount} <span class="text-sm font-semibold text-slate-400">of {study.totalSites}</span>
        </div>
      </div>
      <div class="text-xs font-semibold text-blue-600 group-hover:underline">
        Sites require closer attention &rarr;
      </div>
    </div>

  </div>

  <!-- ========================================================================= -->
  <!-- MIDDLE ROW: DBL TREND, DRIVERS OF DELAY, STUDY MILESTONES                 -->
  <!-- ========================================================================= -->
  <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
    
    <!-- DBL Readiness Trend (Interactive Dual Axis Chart) -->
    <div class="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
      <div>
        <div class="flex items-center justify-between mb-3">
          <div>
            <h3 class="text-sm font-bold text-slate-900">DBL Readiness Trend</h3>
            <p class="text-[11px] text-slate-500">Readiness score vs. Forecast delay over 4 weeks</p>
          </div>
          <div class="flex items-center space-x-3 text-[10px] font-semibold">
            <span class="flex items-center space-x-1 text-blue-700">
              <span class="w-2.5 h-2.5 rounded-full bg-blue-600 inline-block"></span>
              <span>Readiness</span>
            </span>
            <span class="flex items-center space-x-1 text-rose-600">
              <span class="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block"></span>
              <span>Delay (Days)</span>
            </span>
          </div>
        </div>

        <!-- SVG Line Chart -->
        <div class="relative w-full h-44 pt-2">
          <svg class="w-full h-full overflow-visible" viewBox="0 0 280 130">
            <!-- Grid lines -->
            <line x1="20" y1="15" x2="270" y2="15" stroke="#f1f5f9" stroke-dasharray="2" />
            <line x1="20" y1="50" x2="270" y2="50" stroke="#f1f5f9" stroke-dasharray="2" />
            <line x1="20" y1="85" x2="270" y2="85" stroke="#f1f5f9" stroke-dasharray="2" />
            <line x1="20" y1="115" x2="270" y2="115" stroke="#e2e8f0" />

            <!-- Y Axis Labels -->
            <text x="5" y="18" font-size="8" fill="#94a3b8">100%</text>
            <text x="5" y="53" font-size="8" fill="#94a3b8">75%</text>
            <text x="5" y="88" font-size="8" fill="#94a3b8">50%</text>
            <text x="5" y="118" font-size="8" fill="#94a3b8">0%</text>

            <!-- Delay Y Axis Labels (right) -->
            <text x="272" y="18" font-size="8" fill="#f43f5e">20d</text>
            <text x="272" y="53" font-size="8" fill="#f43f5e">15d</text>
            <text x="272" y="88" font-size="8" fill="#f43f5e">10d</text>
            <text x="272" y="118" font-size="8" fill="#f43f5e">0d</text>

            <!-- Readiness Blue Curve (points: 63, 66, 69, 71, 72) -->
            <!-- Formula: y = 115 - (score / 100 * 100) -->
            <!-- x coordinates: 35, 90, 145, 200, 255 -->
            <polyline
              fill="none"
              stroke="#2563eb"
              stroke-width="2.5"
              stroke-linecap="round"
              stroke-linejoin="round"
              points="35,52 90,49 145,46 200,44 255,43"
            />

            <!-- Forecast Delay Red Curve (points: 7d, 5d, 4d, 3d, 6d) -->
            <!-- Formula: y = 115 - (days / 20 * 100) -->
            <!-- 7d: 80, 5d: 90, 4d: 95, 3d: 100, 6d: 85 -->
            <polyline
              fill="none"
              stroke="#f43f5e"
              stroke-width="2.2"
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-dasharray="3 3"
              points="35,80 90,90 145,95 200,100 255,85"
            />

            <!-- Readiness dots -->
            {#each [52, 49, 46, 44, 43] as y, i}
              <circle
                cx={35 + i * 55}
                cy={y}
                r={i === 4 ? 4.5 : 3.5}
                class="fill-blue-600 stroke-white stroke-2 cursor-pointer hover:r-5 transition-all"
                on:mouseenter={() => hoveredPoint = i}
                on:mouseleave={() => hoveredPoint = null}
              />
            {/each}

            <!-- Delay dots -->
            {#each [80, 90, 95, 100, 85] as y, i}
              <circle
                cx={35 + i * 55}
                cy={y}
                r={i === 4 ? 4.5 : 3.5}
                class="fill-rose-500 stroke-white stroke-2 cursor-pointer hover:r-5 transition-all"
              />
            {/each}

            <!-- Current Labels -->
            <text x="245" y="36" font-size="10" font-weight="bold" fill="#1d4ed8">72%</text>
            <text x="248" y="78" font-size="10" font-weight="bold" fill="#e11d48">6d</text>
          </svg>
        </div>

        <!-- X Axis labels -->
        <div class="flex justify-between px-3 text-[10px] text-slate-500 mt-1 font-medium">
          {#each weeks as w}
            <span>{w}</span>
          {/each}
        </div>
      </div>

      <div class="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
        <span>Target: 95% before lock</span>
        <button
          on:click={() => onSelectTab('digital_twin')}
          class="text-blue-600 hover:text-blue-800 font-bold flex items-center space-x-1"
        >
          <span>Scrub timeline</span>
          <ArrowRight size={12} />
        </button>
      </div>
    </div>

    <!-- Top Drivers of Forecast Delay -->
    <div class="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
      <div>
        <div class="flex items-center justify-between mb-3">
          <h3 class="text-sm font-bold text-slate-900">Top Drivers of Forecast Delay</h3>
          <span class="text-[10px] text-slate-400 font-semibold uppercase">Relative impact</span>
        </div>

        <div class="space-y-3.5">
          {#each study.primaryDrivers as driver}
            <div>
              <div class="flex items-center justify-between text-xs font-semibold text-slate-800">
                <span class="truncate pr-2">{driver.factor}</span>
                <span class="font-bold {driver.weight >= 30 ? 'text-rose-600' : driver.weight >= 20 ? 'text-amber-600' : 'text-blue-600'}">
                  {driver.impact}
                </span>
              </div>
              <div class="w-full bg-slate-100 rounded-full h-2 mt-1.5 overflow-hidden">
                <div
                  class="h-full rounded-full transition-all duration-500 {driver.weight >= 35 ? 'bg-rose-500' : driver.weight >= 30 ? 'bg-amber-500' : driver.weight >= 20 ? 'bg-amber-400' : 'bg-blue-500'}"
                  style="width: {driver.weight}%"
                ></div>
              </div>
              <p class="text-[11px] text-slate-500 mt-1 line-clamp-1">
                {driver.summary}
              </p>
            </div>
          {/each}
        </div>
      </div>

      <div class="mt-4 pt-3 border-t border-slate-100">
        <button
          on:click={() => onSelectTab('digital_twin')}
          class="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center space-x-1"
        >
          <span>Explore domain evidence in Digital Twin</span>
          <ArrowRight size={13} />
        </button>
      </div>
    </div>

    <!-- Study Milestones Timeline -->
    <div class="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
      <div>
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-sm font-bold text-slate-900">Study Milestones</h3>
          <span class="text-[10px] text-slate-400 font-semibold uppercase">Timeline</span>
        </div>

        <!-- Vertical Milestones Steps -->
        <div class="relative pl-6 space-y-5 border-l-2 border-slate-200 ml-2">
          
          <!-- First Subject In (FSI) -->
          <div class="relative">
            <span class="absolute -left-[31px] top-0.5 w-4 h-4 rounded-full bg-emerald-500 ring-4 ring-white flex items-center justify-center text-white">
              <CheckCircle2 size={12} class="stroke-[3]" />
            </span>
            <div class="flex items-baseline justify-between text-xs">
              <span class="font-semibold text-slate-700">First Subject In (FSI)</span>
              <span class="font-mono text-slate-500 text-[11px]">2024-01-12</span>
            </div>
          </div>

          <!-- Last Subject Last Visit (LSLV) -->
          <div class="relative">
            <span class="absolute -left-[31px] top-0.5 w-4 h-4 rounded-full bg-emerald-500 ring-4 ring-white flex items-center justify-center text-white">
              <CheckCircle2 size={12} class="stroke-[3]" />
            </span>
            <div class="flex items-baseline justify-between text-xs">
              <span class="font-semibold text-slate-700">Last Subject Last Visit (LSLV)</span>
              <span class="font-mono text-slate-500 text-[11px]">{study.plannedLslv}</span>
            </div>
          </div>

          <!-- Target Database Lock -->
          <div class="relative">
            <span class="absolute -left-[31px] top-0.5 w-4 h-4 rounded-full bg-blue-600 ring-4 ring-blue-100 flex items-center justify-center text-white">
              <span class="w-1.5 h-1.5 rounded-full bg-white"></span>
            </span>
            <div class="flex items-baseline justify-between text-xs">
              <span class="font-bold text-blue-900">Target Database Lock</span>
              <span class="font-mono font-bold text-blue-900 text-[11px]">{study.plannedDbl}</span>
            </div>
          </div>

          <!-- Forecast Database Lock -->
          <div class="relative">
            <span class="absolute -left-[31px] top-0.5 w-4 h-4 rounded-full bg-rose-500 ring-4 ring-rose-100 flex items-center justify-center text-white">
              <Clock size={10} class="stroke-[2.5]" />
            </span>
            <div class="flex items-baseline justify-between text-xs">
              <span class="font-bold text-rose-700">Forecast Database Lock</span>
              <span class="font-mono font-bold text-rose-700 text-[11px]">{study.forecastDbl}</span>
            </div>
            <div class="text-[10px] text-rose-600 font-semibold mt-0.5">+6 days variance</div>
          </div>

          <!-- Topline Analysis (Target) -->
          <div class="relative">
            <span class="absolute -left-[31px] top-0.5 w-4 h-4 rounded-full bg-slate-300 ring-4 ring-white flex items-center justify-center text-slate-600">
              <span class="w-1.5 h-1.5 rounded-full bg-slate-500"></span>
            </span>
            <div class="flex items-baseline justify-between text-xs">
              <span class="font-normal text-slate-500">Topline Analysis (target)</span>
              <span class="font-mono text-slate-400 text-[11px]">2027-01-15</span>
            </div>
          </div>

        </div>
      </div>

      <div class="mt-4 pt-3 border-t border-slate-100 text-xs text-slate-500">
        Estimated lock window: <strong class="text-slate-800">{study.confidenceInterval}</strong>
      </div>
    </div>

  </div>

  <!-- ========================================================================= -->
  <!-- BOTTOM ROW: RECOMMENDED ACTIONS (WIDE) & RISK DISTRIBUTION DONUT          -->
  <!-- ========================================================================= -->
  <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
    
    <!-- Recommended Actions Table Preview (2 Cols Wide) -->
    <div class="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden flex flex-col justify-between">
      <div>
        <div class="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 class="text-sm font-bold text-slate-900">Recommended Actions</h3>
            <p class="text-[11px] text-slate-500">Prioritized by direct impact on DBL critical path</p>
          </div>
          <button
            on:click={() => onSelectTab('action_workbench')}
            class="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center space-x-1"
          >
            <span>View all</span>
            <ArrowRight size={13} />
          </button>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse text-xs">
            <thead>
              <tr class="bg-slate-50 text-slate-500 border-b border-slate-200 text-[10px] font-bold uppercase tracking-wider">
                <th class="py-2.5 px-4">Priority</th>
                <th class="py-2.5 px-3">Action</th>
                <th class="py-2.5 px-3">Owner</th>
                <th class="py-2.5 px-3">Due Date</th>
                <th class="py-2.5 px-3 text-right">Est. Impact</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 text-slate-700">
              {#each actions.slice(0, 3) as act}
                <tr
                  class="hover:bg-slate-50/70 transition-colors cursor-pointer"
                  on:click={() => onSelectTab('action_workbench')}
                >
                  <td class="py-3 px-4">
                    <span class="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold {act.priority === 'Critical' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'}">
                      {act.priority}
                    </span>
                  </td>
                  <td class="py-3 px-3 font-semibold text-slate-900">
                    <div>{act.action || act.title}</div>
                    <div class="text-[10px] text-slate-400 font-normal">{act.site || act.scope} &middot; {act.id}</div>
                  </td>
                  <td class="py-3 px-3 text-slate-600">{act.owner}</td>
                  <td class="py-3 px-3 font-mono text-slate-600 text-[11px]">{act.dueDate}</td>
                  <td class="py-3 px-3 text-right font-bold text-emerald-600 font-mono">
                    {act.delayImpact || `-${act.daysSaved} days`}
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      </div>

      <div class="p-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs">
        <span class="text-slate-500 text-[11px]">
          Addressing the top 3 critical actions could reduce forecast delay by <strong>4–6 days</strong>.
        </span>
        <button
          on:click={() => onSelectTab('action_workbench')}
          class="font-bold text-blue-600 hover:text-blue-800 text-xs flex items-center space-x-1"
        >
          <span>View all recommended actions</span>
          <ArrowRight size={13} />
        </button>
      </div>
    </div>

    <!-- Risk Distribution by Data Domain & Next Best Step -->
    <div class="space-y-4">
      
      <!-- Donut Chart Card -->
      <div class="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
        <h3 class="text-sm font-bold text-slate-900 mb-3">Risk Distribution by Data Domain</h3>

        <div class="flex items-center justify-between">
          <!-- Donut Graphic -->
          <div class="relative w-28 h-28 shrink-0 flex items-center justify-center">
            <svg class="w-28 h-28 -rotate-90" viewBox="0 0 36 36">
              <!-- Safety recon 28% -->
              <circle cx="18" cy="18" r="13" fill="none" class="stroke-blue-600" stroke-width="4.5" stroke-dasharray="24.6 63.4" stroke-dashoffset="0" />
              <!-- External lab 24% -->
              <circle cx="18" cy="18" r="13" fill="none" class="stroke-cyan-500" stroke-width="4.5" stroke-dasharray="21.1 66.9" stroke-dashoffset="-24.6" />
              <!-- EDC / queries 22% -->
              <circle cx="18" cy="18" r="13" fill="none" class="stroke-amber-500" stroke-width="4.5" stroke-dasharray="19.4 68.6" stroke-dashoffset="-45.7" />
              <!-- Medical coding 12% -->
              <circle cx="18" cy="18" r="13" fill="none" class="stroke-rose-500" stroke-width="4.5" stroke-dasharray="10.5 77.5" stroke-dashoffset="-65.1" />
              <!-- Sign-offs 8% -->
              <circle cx="18" cy="18" r="13" fill="none" class="stroke-indigo-700" stroke-width="4.5" stroke-dasharray="7 81" stroke-dashoffset="-75.6" />
              <!-- eCOA 6% -->
              <circle cx="18" cy="18" r="13" fill="none" class="stroke-sky-400" stroke-width="4.5" stroke-dasharray="5.4 82.6" stroke-dashoffset="-82.6" />
            </svg>
            <div class="absolute text-center">
              <span class="text-base font-extrabold text-slate-900 block leading-tight">42</span>
              <span class="text-[8px] uppercase tracking-wider text-slate-400 font-bold block">Open Items</span>
            </div>
          </div>

          <!-- Legend -->
          <div class="space-y-1.5 text-[11px] text-slate-600 font-medium pl-3">
            <div class="flex items-center space-x-1.5">
              <span class="w-2 h-2 rounded-full bg-blue-600 shrink-0"></span>
              <span class="truncate">Safety reconciliation</span>
              <span class="font-bold text-slate-800 ml-auto">28%</span>
            </div>
            <div class="flex items-center space-x-1.5">
              <span class="w-2 h-2 rounded-full bg-cyan-500 shrink-0"></span>
              <span class="truncate">External laboratory</span>
              <span class="font-bold text-slate-800 ml-auto">24%</span>
            </div>
            <div class="flex items-center space-x-1.5">
              <span class="w-2 h-2 rounded-full bg-amber-500 shrink-0"></span>
              <span class="truncate">EDC / Queries</span>
              <span class="font-bold text-slate-800 ml-auto">22%</span>
            </div>
            <div class="flex items-center space-x-1.5">
              <span class="w-2 h-2 rounded-full bg-rose-500 shrink-0"></span>
              <span class="truncate">Medical coding</span>
              <span class="font-bold text-slate-800 ml-auto">12%</span>
            </div>
            <div class="flex items-center space-x-1.5">
              <span class="w-2 h-2 rounded-full bg-indigo-700 shrink-0"></span>
              <span class="truncate">Site sign-offs</span>
              <span class="font-bold text-slate-800 ml-auto">8%</span>
            </div>
            <div class="flex items-center space-x-1.5">
              <span class="w-2 h-2 rounded-full bg-sky-400 shrink-0"></span>
              <span class="truncate">eCOA / Imaging</span>
              <span class="font-bold text-slate-800 ml-auto">6%</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Next Best Step Card -->
      <div class="bg-gradient-to-r from-blue-50 to-indigo-50/60 rounded-xl border border-blue-200 p-4 shadow-xs flex items-center justify-between gap-3">
        <div class="flex items-start space-x-2.5">
          <Compass size={18} class="text-blue-600 shrink-0 mt-0.5" />
          <div>
            <div class="text-[11px] font-bold text-blue-900 uppercase tracking-wide">Next Best Step</div>
            <p class="text-xs text-blue-800 mt-0.5 leading-snug">
              Review recommended actions and explore high-risk sites to reduce forecast delay.
            </p>
          </div>
        </div>
        <button
          on:click={() => onSelectTab('action_workbench')}
          class="shrink-0 px-3 py-1.5 rounded-lg bg-blue-600 text-white font-bold text-xs hover:bg-blue-700 transition-colors shadow-xs"
        >
          Go to Actions &rarr;
        </button>
      </div>

    </div>

  </div>

  <!-- Footnote provenance -->
  <div class="text-[11px] text-slate-400 flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-slate-200">
    <div>
      Data refreshed: 2026-10-31 08:00 UTC &middot; Sources: EDC, Safety, Central Lab, eCOA, Coding, IRT
    </div>
    <div class="font-medium text-slate-500">
      DBLock AI &middot; Clinical Data Science Workbench
    </div>
  </div>

</div>
