<script lang="ts">
  import {
    Activity,
    AlertTriangle,
    CheckCircle2,
    Clock,
    ArrowRight,
    TrendingUp,
    TrendingDown,
    Sliders,
    Sparkles,
    Calendar,
    Target
  } from '@lucide/svelte';

  export let dimensions: any[];
  export let timelineSnapshots: any[];
  export let onSelectTab: (tab: string) => void;
  export let onSelectSite: (siteId: string) => void;

  // Selected week index (0 = W-8, 1 = W-6, 2 = W-4, 3 = W-3, 4 = W-2, 5 = W-1, 6 = W0)
  let selectedWeekIndex = 6;
  $: currentSnapshot = timelineSnapshots[selectedWeekIndex] || timelineSnapshots[timelineSnapshots.length - 1];

  // Domain readiness values for current view
  const domainReadiness = [
    { name: 'Safety reconciliation', score: 68, target: 98, color: 'rose' },
    { name: 'External data readiness', score: 76, target: 99, color: 'amber' },
    { name: 'Query resolution', score: 82, target: 95, color: 'blue' },
    { name: 'SDV / SDR & Sign-offs', score: 87, target: 100, color: 'blue' },
    { name: 'Medical coding', score: 91, target: 98, color: 'blue' },
    { name: 'eCOA / Imaging', score: 79, target: 95, color: 'sky' }
  ];

  // Historical forecast timeline points for Gantt chart
  const evolutionRows = [
    { label: 'W-8', date: '2027-01-02', delay: '+12d', start: 65, width: 30, point: 80 },
    { label: 'W-6', date: '2026-12-30', delay: '+9d', start: 58, width: 28, point: 72 },
    { label: 'W-4', date: '2026-12-28', delay: '+7d', start: 50, width: 25, point: 62 },
    { label: 'W-3', date: '2026-12-26', delay: '+5d', start: 42, width: 22, point: 53 },
    { label: 'W-2', date: '2026-12-25', delay: '+4d', start: 38, width: 20, point: 48 },
    { label: 'W-1', date: '2026-12-24', delay: '+3d', start: 34, width: 18, point: 43 },
    { label: 'W0', date: '2026-12-21', delay: '+6d', start: 38, width: 22, point: 49 }
  ];
</script>

<div class="space-y-6">

  <!-- ========================================================================= -->
  <!-- HERO BANNER: DYNAMIC READINESS DIGITAL TWIN                               -->
  <!-- ========================================================================= -->
  <div class="rounded-2xl bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950 text-white p-6 shadow-md border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
    <div class="max-w-2xl">
      <span class="text-[10px] font-extrabold uppercase tracking-widest text-blue-300">
        DYNAMIC READINESS DIGITAL TWIN
      </span>
      <h1 class="text-2xl sm:text-3xl font-extrabold text-white mt-1 tracking-tight">
        How is our study progressing towards database lock?
      </h1>
      <p class="text-xs sm:text-sm text-slate-300 mt-1.5 leading-relaxed">
        Explore how readiness, critical-path blockers and forecast dates evolve over time, and what is driving the changes.
      </p>
    </div>

    <div class="shrink-0 p-4 rounded-xl bg-white/10 backdrop-blur-md border border-white/15 max-w-xs text-xs text-blue-100">
      <div class="flex items-center space-x-2 font-semibold text-white mb-1">
        <Sparkles size={15} class="text-blue-300" />
        <span>Continuous Readiness Model</span>
      </div>
      <p class="text-[11px] text-blue-200/90 leading-relaxed">
        A living model of your study's lock readiness. See the past. Act in the present. Shape the future.
      </p>
    </div>
  </div>

  <!-- ========================================================================= -->
  <!-- TEMPORAL SCRUBBER CONTROL                                                 -->
  <!-- ========================================================================= -->
  <div class="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col md:flex-row items-center justify-between gap-6">
    
    <!-- Timeline Track & Nodes -->
    <div class="flex-1 w-full">
      <div class="flex items-center justify-between mb-2">
        <span class="text-xs font-bold text-slate-700 uppercase tracking-wide">Select a time point</span>
        <span class="text-xs text-blue-600 font-semibold">Click any week to scrub the model state</span>
      </div>

      <!-- Scrubber track -->
      <div class="relative pt-6 pb-4">
        <!-- Connecting line -->
        <div class="absolute top-9 left-4 right-4 h-1 bg-slate-200 -translate-y-1/2"></div>
        <!-- Active highlighted portion -->
        <div
          class="absolute top-9 left-4 h-1 bg-blue-600 -translate-y-1/2 transition-all duration-300"
          style="width: {(selectedWeekIndex / (timelineSnapshots.length - 1)) * 96}%"
        ></div>

        <div class="relative flex justify-between">
          {#each timelineSnapshots as snap, idx}
            <button
              on:click={() => selectedWeekIndex = idx}
              class="flex flex-col items-center group cursor-pointer focus:outline-hidden"
            >
              <!-- Node circle -->
              <div class="w-6 h-6 rounded-full flex items-center justify-center transition-all {selectedWeekIndex === idx ? 'bg-blue-600 ring-4 ring-blue-100 text-white scale-125' : selectedWeekIndex > idx ? 'bg-blue-600 text-white' : 'bg-slate-300 text-slate-600 group-hover:bg-slate-400'}">
                <span class="w-2 h-2 rounded-full bg-white"></span>
              </div>

              <!-- Label -->
              <div class="mt-2.5 text-center">
                <span class="text-[11px] font-bold block transition-colors {selectedWeekIndex === idx ? 'text-blue-600' : 'text-slate-700 group-hover:text-slate-900'}">
                  {snap.weekCode}
                </span>
                <span class="text-[10px] text-slate-500 block font-medium">
                  {snap.readinessScore}%
                </span>
                <span class="text-[9px] font-bold block {snap.delayDays >= 6 ? 'text-rose-600' : 'text-amber-600'}">
                  +{snap.delayDays}d
                </span>
              </div>
            </button>
          {/each}
        </div>
      </div>
    </div>

    <!-- Selected snapshot badge card -->
    <div class="shrink-0 p-4 rounded-xl bg-slate-50 border border-slate-200 text-center min-w-[200px]">
      <div class="text-[10px] font-bold uppercase tracking-wider text-slate-400">Current View</div>
      <div class="text-sm font-extrabold text-slate-900 mt-0.5">
        {currentSnapshot.date} ({currentSnapshot.weekCode})
      </div>
      <div class="text-[10px] text-slate-500 mt-1">
        Data refreshed: 2026-10-31 08:00 UTC
      </div>
    </div>

  </div>

  <!-- ========================================================================= -->
  <!-- MIDDLE ROW: READINESS SCORE CHART, DOMAIN BARS, OVERALL STATUS RING        -->
  <!-- ========================================================================= -->
  <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
    
    <!-- Readiness score over time -->
    <div class="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
      <div>
        <div class="flex items-center justify-between mb-3">
          <h3 class="text-sm font-bold text-slate-900">Readiness score over time</h3>
          <div class="flex items-center space-x-2 text-[10px] font-semibold">
            <span class="flex items-center space-x-1 text-blue-700">
              <span class="w-2 h-2 rounded-full bg-blue-600"></span>
              <span>Readiness</span>
            </span>
            <span class="flex items-center space-x-1 text-rose-600">
              <span class="w-2 h-2 rounded-full bg-rose-500"></span>
              <span>Forecast delay (Days)</span>
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

            <text x="5" y="18" font-size="8" fill="#94a3b8">100%</text>
            <text x="5" y="53" font-size="8" fill="#94a3b8">75%</text>
            <text x="5" y="88" font-size="8" fill="#94a3b8">50%</text>
            <text x="5" y="118" font-size="8" fill="#94a3b8">0%</text>

            <text x="272" y="18" font-size="8" fill="#f43f5e">20</text>
            <text x="272" y="53" font-size="8" fill="#f43f5e">15</text>
            <text x="272" y="88" font-size="8" fill="#f43f5e">10</text>
            <text x="272" y="118" font-size="8" fill="#f43f5e">0</text>

            <!-- Blue readiness line (54, 59, 63, 66, 69, 71, 72) -->
            <!-- y = 115 - (score / 100 * 100) -->
            <!-- x coordinates: 25, 65, 105, 145, 185, 225, 265 -->
            <polyline
              fill="none"
              stroke="#2563eb"
              stroke-width="2.2"
              stroke-linecap="round"
              stroke-linejoin="round"
              points="25,61 65,56 105,52 145,49 185,46 225,44 265,43"
            />

            <!-- Red forecast delay line (12, 9, 7, 5, 4, 3, 6) -->
            <!-- y = 115 - (days / 20 * 100) -->
            <polyline
              fill="none"
              stroke="#f43f5e"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-dasharray="3 3"
              points="25,55 65,70 105,80 145,90 185,95 225,100 265,85"
            />

            <!-- Current Node highlight -->
            <circle cx="265" cy="43" r="4.5" class="fill-blue-600 stroke-white stroke-2" />
            <circle cx="265" cy="85" r="4.5" class="fill-rose-500 stroke-white stroke-2" />

            <text x="255" y="36" font-size="10" font-weight="bold" fill="#1d4ed8">72%</text>
            <text x="258" y="79" font-size="10" font-weight="bold" fill="#e11d48">6d</text>
          </svg>
        </div>

        <div class="flex justify-between px-2 text-[10px] text-slate-500 mt-1 font-medium">
          <span>W-8</span>
          <span>W-6</span>
          <span>W-4</span>
          <span>W-3</span>
          <span>W-2</span>
          <span>W-1</span>
          <span>W0</span>
        </div>
      </div>

      <div class="mt-3 pt-3 border-t border-slate-100 text-[11px] text-slate-500">
        Overall score has improved +18 points since baseline W-8.
      </div>
    </div>

    <!-- Readiness by domain (Current vs Target) -->
    <div class="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
      <div>
        <div class="flex items-center justify-between mb-3">
          <h3 class="text-sm font-bold text-slate-900">Readiness by domain</h3>
          <div class="flex items-center space-x-2 text-[10px] font-semibold">
            <span class="flex items-center space-x-1 text-blue-600">
              <span class="w-2.5 h-1.5 bg-blue-600 rounded-xs"></span>
              <span>Current</span>
            </span>
            <span class="flex items-center space-x-1 text-slate-400">
              <span class="w-2.5 h-1.5 bg-slate-200 rounded-xs"></span>
              <span>Target</span>
            </span>
          </div>
        </div>

        <div class="space-y-3.5">
          {#each domainReadiness as dom}
            <div>
              <div class="flex justify-between text-xs font-semibold text-slate-800">
                <span>{dom.name}</span>
                <span class="text-slate-600">
                  <strong class="{dom.score < 70 ? 'text-rose-600' : dom.score < 80 ? 'text-amber-600' : 'text-blue-600'}">{dom.score}%</strong> / {dom.target}%
                </span>
              </div>
              <div class="w-full bg-slate-100 rounded-full h-2 mt-1.5 relative overflow-hidden">
                <div
                  class="h-full rounded-full {dom.color === 'rose' ? 'bg-rose-500' : dom.color === 'amber' ? 'bg-amber-500' : 'bg-blue-600'}"
                  style="width: {dom.score}%"
                ></div>
                <!-- Target tick marker -->
                <div
                  class="absolute top-0 bottom-0 w-0.5 bg-slate-700"
                  style="left: {dom.target}%"
                  title="Target: {dom.target}%"
                ></div>
              </div>
            </div>
          {/each}
        </div>
      </div>

      <div class="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-500 flex justify-between">
        <span>Target: 95% minimum for lock readiness</span>
        <button on:click={() => onSelectTab('risk_matrix')} class="text-blue-600 font-bold hover:underline">
          View site evidence &rarr;
        </button>
      </div>
    </div>

    <!-- Overall Status Gauge Ring -->
    <div class="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col items-center justify-between text-center">
      <div class="w-full text-left">
        <h3 class="text-sm font-bold text-slate-900">Overall status</h3>
        <p class="text-[11px] text-slate-500">Benchmark comparison</p>
      </div>

      <!-- Big Ring -->
      <div class="relative w-36 h-36 my-2 flex items-center justify-center">
        <svg class="w-36 h-36 -rotate-90" viewBox="0 0 36 36">
          <circle cx="18" cy="18" r="14" fill="none" class="stroke-slate-100" stroke-width="3" />
          <circle
            cx="18" cy="18" r="14" fill="none"
            class="stroke-blue-600"
            stroke-width="3"
            stroke-dasharray="88"
            stroke-dashoffset={88 - (88 * currentSnapshot.readinessScore / 100)}
            stroke-linecap="round"
          />
        </svg>
        <div class="absolute text-center">
          <span class="text-3xl font-extrabold text-slate-900 block leading-tight num-tabular">
            {currentSnapshot.readinessScore}<span class="text-base text-slate-400 font-normal">/100</span>
          </span>
          <span class="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200 inline-block mt-1">
            On track with attention
          </span>
        </div>
      </div>

      <div class="space-y-1 w-full pt-3 border-t border-slate-100 text-xs">
        <div class="flex justify-between text-slate-600">
          <span>Target before lock:</span>
          <strong class="text-slate-900">95/100</strong>
        </div>
        <div class="flex justify-between text-slate-600">
          <span>Gap to target:</span>
          <strong class="text-rose-600">{95 - currentSnapshot.readinessScore} points</strong>
        </div>
      </div>
    </div>

  </div>

  <!-- ========================================================================= -->
  <!-- LOWER ROW: WHAT CHANGED AT THIS TIME POINT? & FORECAST DBL EVOLUTION      -->
  <!-- ========================================================================= -->
  <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
    
    <!-- What changed at this time point? -->
    <div class="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
      <div>
        <h3 class="text-sm font-bold text-slate-900">What changed at this time point?</h3>
        <p class="text-[11px] text-slate-500 mb-4">
          Key events, new risks and resolutions compared to previous week (W-1 &rarr; W0).
        </p>

        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
          
          <!-- New / Worsened Card -->
          <div class="p-3.5 rounded-xl bg-rose-50/70 border border-rose-200 space-y-2">
            <div class="flex items-center justify-between text-xs font-bold text-rose-900">
              <span>New / Worsened</span>
              <span class="w-5 h-5 rounded-full bg-rose-600 text-white flex items-center justify-center text-[10px]">4</span>
            </div>
            <ul class="text-[11px] text-rose-800 space-y-1.5 leading-snug">
              <li class="flex items-start space-x-1.5">
                <span class="text-rose-600 font-bold">&uarr;</span>
                <span>Lab transfer delayed (Site 104)</span>
              </li>
              <li class="flex items-start space-x-1.5">
                <span class="text-rose-600 font-bold">&uarr;</span>
                <span>2 new SAE reconciliation discrepancies</span>
              </li>
              <li class="flex items-start space-x-1.5">
                <span class="text-rose-600 font-bold">&uarr;</span>
                <span>Increase in ageing primary endpoint queries</span>
              </li>
              <li class="flex items-start space-x-1.5">
                <span class="text-rose-600 font-bold">&uarr;</span>
                <span>Sign-off pending at 3 sites</span>
              </li>
            </ul>
          </div>

          <!-- Resolved / Improved Card -->
          <div class="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200 space-y-2">
            <div class="flex items-center justify-between text-xs font-bold text-emerald-900">
              <span>Resolved / Improved</span>
              <span class="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px]">2</span>
            </div>
            <ul class="text-[11px] text-emerald-800 space-y-1.5 leading-snug">
              <li class="flex items-start space-x-1.5">
                <span class="text-emerald-600 font-bold">&darr;</span>
                <span>30 routine queries closed at St. Mary's Hospital</span>
              </li>
              <li class="flex items-start space-x-1.5">
                <span class="text-emerald-600 font-bold">&darr;</span>
                <span>Coding review completed for 12 subjects</span>
              </li>
            </ul>
          </div>

          <!-- Net Impact Card -->
          <div class="p-3.5 rounded-xl bg-blue-50/70 border border-blue-200 space-y-2 flex flex-col justify-between">
            <div>
              <span class="text-xs font-bold text-blue-900 block">Net impact on forecast</span>
              <div class="text-2xl font-extrabold text-rose-600 mt-1 num-tabular">+3 days</div>
            </div>
            <p class="text-[11px] text-blue-800 leading-snug">
              Delay increased from +3d to +6d due to lab transfer and SAE issues.
            </p>
          </div>

        </div>
      </div>

      <div class="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-500">
        Snapshot delta captures changes between refreshed operational signals.
      </div>
    </div>

    <!-- Forecast DBL date evolution Gantt -->
    <div class="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
      <div>
        <div class="flex items-center justify-between mb-2">
          <h3 class="text-sm font-bold text-slate-900">Forecast DBL date evolution</h3>
          <div class="flex items-center space-x-3 text-[10px]">
            <span class="flex items-center space-x-1 text-slate-500">
              <span class="w-3 h-1.5 bg-slate-200 rounded-xs"></span>
              <span>Forecast range</span>
            </span>
            <span class="flex items-center space-x-1 text-blue-600 font-bold">
              <span class="w-2 h-2 rounded-full bg-blue-600"></span>
              <span>Most likely date</span>
            </span>
            <span class="flex items-center space-x-1 text-slate-700 font-bold">
              <span class="w-2 h-0.5 bg-slate-800"></span>
              <span>Planned DBL</span>
            </span>
          </div>
        </div>

        <div class="space-y-2 mt-4 text-xs font-medium">
          {#each evolutionRows as row}
            <div class="flex items-center text-slate-700">
              <span class="w-10 text-[11px] font-bold text-slate-500 shrink-0">{row.label}</span>
              
              <!-- Gantt bar container -->
              <div class="flex-1 relative h-5 flex items-center mx-2">
                <!-- Planned line marker -->
                <div class="absolute left-[30%] top-0 bottom-0 w-0.5 bg-slate-800 z-10"></div>

                <!-- Range bar -->
                <div
                  class="absolute h-2.5 rounded-full bg-blue-100 border border-blue-200"
                  style="left: {row.start}%; width: {row.width}%"
                ></div>

                <!-- Most likely dot -->
                <div
                  class="absolute w-3.5 h-3.5 rounded-full {row.label === 'W0' ? 'bg-rose-500 ring-2 ring-white' : 'bg-blue-600'} -translate-x-1/2 z-20"
                  style="left: {row.point}%"
                ></div>
              </div>

              <div class="w-28 text-right font-mono text-[11px] text-slate-800 whitespace-nowrap">
                {row.date} <span class="{row.delay === '+6d' ? 'text-rose-600 font-bold' : 'text-slate-500'}">({row.delay})</span>
              </div>
            </div>
          {/each}
        </div>
      </div>

      <div class="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
        <span>Planned DBL: <strong>2026-12-15</strong></span>
        <span>Current forecast: <strong class="text-rose-600">2026-12-21 (+6d)</strong></span>
      </div>
    </div>

  </div>

  <!-- ========================================================================= -->
  <!-- BOTTOM AI INSIGHT BANNER                                                  -->
  <!-- ========================================================================= -->
  <div class="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
    <div class="flex items-start space-x-3">
      <Sparkles size={20} class="text-blue-600 shrink-0 mt-0.5" />
      <p class="text-xs text-blue-900 leading-relaxed">
        <strong>AI Insight:</strong> While overall readiness has improved by 9 points since Week -8, recent delays in laboratory transfer and new SAE discrepancies have increased the forecast delay by 3 days. Prioritising these items could avoid <strong>4–6 days of delay</strong>.
      </p>
    </div>

    <button
      on:click={() => onSelectTab('action_workbench')}
      class="shrink-0 px-4 py-2 rounded-lg bg-blue-600 text-white font-bold text-xs hover:bg-blue-700 transition-colors shadow-xs flex items-center space-x-1.5"
    >
      <span>Explore recommended actions</span>
      <ArrowRight size={14} />
    </button>
  </div>

  <!-- Footnote -->
  <div class="text-[11px] text-slate-400 flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-slate-200">
    <div>
      Sources: EDC, Safety, Central Lab, eCOA, Imaging, Coding, IRT &middot; Model version: v0.1 (prototype)
    </div>
    <div class="font-medium text-slate-500">
      DBLock AI &middot; Clinical Data Science Workbench
    </div>
  </div>

</div>
