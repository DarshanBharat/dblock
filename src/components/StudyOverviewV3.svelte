<script lang="ts">
  import {
    ArrowLeft,
    AlertTriangle,
    TrendingUp,
    TrendingDown,
    Info,
    CheckCircle2,
    ChevronRight,
    FileText
  } from '@lucide/svelte';
  import {
    V3_STUDY_META,
    V3_OVERVIEW_TREND,
    V3_OVERVIEW_INSIGHTS,
    V3_DOMAINS,
    V3_COUNTRY_SUMMARY,
    V3_ACTIONS
  } from '../data/v3Data';

  export let onSelectTab: (tab: string) => void;
  export let onSelectDomain: (domainId: string) => void;
  export let onSelectCountry: (country: string) => void = () => onSelectTab('sites_countries');

  // SVG chart geometry for Readiness Trend and Forecast
  const W = 580;
  const H = 190;
  const PAD_L = 36;
  const PAD_R = 16;
  const PAD_T = 16;
  const PAD_B = 34;
  const plotW = W - PAD_L - PAD_R;
  const plotH = H - PAD_T - PAD_B;

  const xPos = (idx: number) => PAD_L + (idx / (V3_OVERVIEW_TREND.length - 1)) * plotW;
  const yPos = (val: number) => PAD_T + ((100 - val) / 100) * plotH;

  function buildPolyline(key: 'actual' | 'expected' | 'forecast'): string {
    return V3_OVERVIEW_TREND.map((pt, i) => {
      const v = pt[key];
      return v !== null ? `${xPos(i)},${yPos(v)}` : null;
    })
      .filter(Boolean)
      .join(' ');
  }

  const actualLine = buildPolyline('actual');
  const expectedLine = buildPolyline('expected');
  const forecastLine = buildPolyline('forecast');

  function badgeClass(status: string): string {
    if (status === 'On track') return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    if (status === 'High risk') return 'bg-rose-50 text-rose-700 border-rose-200';
    return 'bg-amber-50 text-amber-700 border-amber-200';
  }

  function dotColor(status: string): string {
    if (status === 'On track') return 'bg-emerald-500';
    if (status === 'High risk') return 'bg-rose-500';
    return 'bg-amber-500';
  }
</script>

<div class="space-y-5">
  <!-- Back & Top Study Banner -->
  <div class="bg-white rounded-xl border border-slate-200/80 shadow-xs p-4 sm:p-5">
    <div class="flex flex-wrap items-start justify-between gap-3 pb-3 border-b border-slate-100">
      <div>
        <button
          type="button"
          on:click={() => onSelectTab('portfolio')}
          class="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-blue-600 mb-1.5 cursor-pointer"
        >
          <ArrowLeft size={13} /> Back to Portfolio
        </button>
        <div class="flex flex-wrap items-center gap-2.5">
          <h1 class="text-xl font-bold text-slate-900 tracking-tight">
            {V3_STUDY_META.protocol} <span class="text-slate-300 font-normal">|</span> Study Overview
          </h1>
          <span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <span class="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
            At Risk
          </span>
        </div>
        <p class="text-xs text-slate-500 mt-1">{V3_STUDY_META.title}</p>
      </div>
      <div class="flex flex-col items-end gap-1.5">
        <button
          type="button"
          on:click={() => onSelectTab('actions_sim')}
          class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 cursor-pointer"
        >
          <FileText size={13} /> Generate Executive Report
        </button>
        <span class="text-[11px] text-slate-400">Last refreshed: {V3_STUDY_META.lastRefreshed}</span>
      </div>
    </div>

    <!-- Protocol Metadata Strip -->
    <div class="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 pt-3 text-xs">
      <div>
        <div class="text-[11px] text-slate-400">Therapeutic Area</div>
        <div class="font-semibold text-slate-800">{V3_STUDY_META.therapeuticArea}</div>
      </div>
      <div>
        <div class="text-[11px] text-slate-400">Phase</div>
        <div class="font-semibold text-slate-800">{V3_STUDY_META.phase}</div>
      </div>
      <div>
        <div class="text-[11px] text-slate-400">Regions</div>
        <div class="font-semibold text-slate-800">{V3_STUDY_META.regions}</div>
      </div>
      <div>
        <div class="text-[11px] text-slate-400">Enrolled Subjects</div>
        <div class="font-semibold text-slate-800">{V3_STUDY_META.enrolledSubjects}</div>
      </div>
      <div>
        <div class="text-[11px] text-slate-400">Last Subject Last Visit (LSLV)</div>
        <div class="font-semibold text-slate-800">{V3_STUDY_META.lslvDate}</div>
      </div>
      <div>
        <div class="text-[11px] text-slate-400">Target DBL</div>
        <div class="font-semibold text-slate-800">{V3_STUDY_META.targetDbl}</div>
      </div>
      <div>
        <div class="text-[11px] text-slate-400">Predicted DBL (P80)</div>
        <div class="font-bold text-rose-600">{V3_STUDY_META.predictedDbl} (+{V3_STUDY_META.delayDays}d)</div>
      </div>
      <div>
        <div class="text-[11px] text-slate-400">Probability of meeting DBL</div>
        <div class="font-bold text-rose-600">{V3_STUDY_META.probMeetingDbl}%</div>
      </div>
    </div>
  </div>

  <!-- 5 Executive KPI Cards -->
  <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
    <div class="bg-white rounded-xl border border-slate-200/80 p-4 shadow-xs">
      <div class="text-xs font-medium text-slate-500">Overall Study Readiness</div>
      <div class="mt-1.5 flex items-baseline gap-2">
        <span class="text-3xl font-bold text-slate-900">{V3_STUDY_META.overallReadiness}%</span>
        <div class="text-[11px] leading-tight">
          <div class="font-semibold text-rose-600">{V3_STUDY_META.readinessGap}% vs expected</div>
          <div class="text-slate-400">Expected today: {V3_STUDY_META.expectedReadiness}%</div>
        </div>
      </div>
      <div class="mt-3 h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
        <div class="h-full bg-amber-500 rounded-full" style="width: {V3_STUDY_META.overallReadiness}%"></div>
      </div>
      <div class="mt-2 text-[11px] text-slate-500">
        {V3_STUDY_META.lockReadySubjects} / {V3_STUDY_META.enrolledSubjects} subjects lock-ready
      </div>
    </div>

    <div class="bg-white rounded-xl border border-slate-200/80 p-4 shadow-xs">
      <div class="text-xs font-medium text-slate-500">Predicted DBL Date (P80)</div>
      <div class="mt-1.5 flex items-baseline gap-2">
        <span class="text-2xl font-bold text-slate-900">{V3_STUDY_META.predictedDbl}</span>
        <span class="text-xs font-bold text-rose-600">+{V3_STUDY_META.delayDays} days</span>
      </div>
      <div class="mt-2.5 text-[11px] text-slate-500">Target DBL: {V3_STUDY_META.targetDbl}</div>
      <div class="mt-1 text-[11px] text-slate-500">
        Confidence: <span class="font-semibold text-slate-700">{V3_STUDY_META.confidence}</span> · P50: 19 Dec · P90: 23 Dec
      </div>
    </div>

    <div class="bg-white rounded-xl border border-slate-200/80 p-4 shadow-xs">
      <div class="text-xs font-medium text-slate-500">Probability of Meeting DBL</div>
      <div class="mt-1.5 flex items-baseline gap-2">
        <span class="text-3xl font-bold text-slate-900">{V3_STUDY_META.probMeetingDbl}%</span>
      </div>
      <div class="mt-3 h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
        <div class="h-full bg-rose-500 rounded-full" style="width: {V3_STUDY_META.probMeetingDbl}%"></div>
      </div>
      <div class="mt-2 text-[11px] text-slate-500">
        Velocity: {V3_STUDY_META.currentVelocity} (req {V3_STUDY_META.requiredVelocity})
      </div>
    </div>

    <div class="bg-white rounded-xl border border-slate-200/80 p-4 shadow-xs">
      <div class="text-xs font-medium text-slate-500">Hard-Gate Blockers</div>
      <div class="mt-1.5 flex items-baseline gap-2">
        <span class="text-3xl font-bold text-slate-900">{V3_STUDY_META.hardGateBlockers}</span>
        <span class="text-xs font-semibold text-rose-600">+2 vs last week</span>
      </div>
      <div class="mt-4 text-[11px] text-slate-500">
        2 SAEs · 2 Labs · 3 Queries · 1 PI Signature
      </div>
    </div>

    <div class="bg-white rounded-xl border border-slate-200/80 p-4 shadow-xs">
      <div class="text-xs font-medium text-slate-500">High-Risk Sites</div>
      <div class="mt-1.5 flex items-baseline gap-2">
        <span class="text-3xl font-bold text-slate-900">{V3_STUDY_META.highRiskSites}</span>
        <span class="text-lg text-slate-400 font-semibold">/ {V3_STUDY_META.totalSites}</span>
      </div>
      <div class="mt-4 text-[11px] text-slate-500">
        Site 104 (US), Site 317 (DE), Site 405 (KR)
      </div>
    </div>
  </div>

  <!-- Row 2: Readiness Trend & Forecast + Key Insights -->
  <div class="grid grid-cols-1 lg:grid-cols-12 gap-4">
    <div class="lg:col-span-7 bg-white rounded-xl border border-slate-200/80 p-4 shadow-xs">
      <div class="flex flex-wrap items-center justify-between gap-2 mb-3">
        <h2 class="text-sm font-bold text-slate-900">Readiness Trend and Forecast</h2>
        <div class="flex items-center gap-4 text-[11px] text-slate-600">
          <span class="inline-flex items-center gap-1.5"><span class="w-2.5 h-0.5 bg-blue-600 inline-block"></span> Actual Readiness</span>
          <span class="inline-flex items-center gap-1.5"><span class="w-3 h-0.5 border-t-2 border-dashed border-slate-400 inline-block"></span> Expected Readiness</span>
          <span class="inline-flex items-center gap-1.5"><span class="w-3 h-0.5 border-t-2 border-dashed border-emerald-500 inline-block"></span> Forecast Readiness (P80)</span>
        </div>
      </div>

      <svg viewBox="0 0 {W} {H}" class="w-full h-auto overflow-visible" aria-label="Readiness Trend and Forecast">
        {#each [0, 20, 40, 60, 80, 100] as tick}
          <line x1={PAD_L} y1={yPos(tick)} x2={W - PAD_R} y2={yPos(tick)} stroke="#e2e8f0" stroke-width="1" />
          <text x={PAD_L - 6} y={yPos(tick) + 3} text-anchor="end" font-size="9" fill="#94a3b8">{tick}%</text>
        {/each}

        <!-- Today marker -->
        <line x1={xPos(2)} y1={PAD_T} x2={xPos(2)} y2={H - PAD_B} stroke="#cbd5e1" stroke-dasharray="3 3" />
        <text x={xPos(2)} y={PAD_T - 4} text-anchor="middle" font-size="8.5" fill="#64748b" font-weight="600">Today · 31 Oct</text>

        <polyline fill="none" stroke="#94a3b8" stroke-width="2" stroke-dasharray="4 4" points={expectedLine} />
        <polyline fill="none" stroke="#10b981" stroke-width="2" stroke-dasharray="4 3" points={forecastLine} />
        <polyline fill="none" stroke="#2563eb" stroke-width="2.5" points={actualLine} />

        {#each V3_OVERVIEW_TREND as pt, i}
          {#if pt.actual !== null}
            <circle cx={xPos(i)} cy={yPos(pt.actual)} r="3.5" fill="#2563eb" stroke="#fff" stroke-width="1.5" />
            <text x={xPos(i)} y={yPos(pt.actual) - 7} text-anchor="middle" font-size="9" font-weight="700" fill="#1e293b">{pt.actual}%</text>
          {/if}
          {#if pt.forecast !== null && pt.actual === null}
            <circle cx={xPos(i)} cy={yPos(pt.forecast)} r="3" fill="#10b981" stroke="#fff" stroke-width="1.2" />
            <text x={xPos(i)} y={yPos(pt.forecast) - 6} text-anchor="middle" font-size="8.5" font-weight="600" fill="#047857">{pt.forecast}%</text>
          {/if}
          {#each pt.label.split('\n') as line, lineIdx}
            <text x={xPos(i)} y={H - PAD_B + 12 + lineIdx * 10} text-anchor="middle" font-size="8.5" fill="#64748b">{line}</text>
          {/each}
        {/each}
      </svg>
    </div>

    <div class="lg:col-span-5 bg-white rounded-xl border border-slate-200/80 p-4 shadow-xs flex flex-col justify-between">
      <div>
        <div class="flex items-center justify-between mb-3">
          <h2 class="text-sm font-bold text-slate-900">Key Insights</h2>
          <button
            type="button"
            on:click={() => onSelectTab('actions_sim')}
            class="text-xs font-semibold text-blue-600 hover:text-blue-700 inline-flex items-center gap-0.5 cursor-pointer"
          >
            View All Insights <ChevronRight size={13} />
          </button>
        </div>
        <div class="space-y-3">
          {#each V3_OVERVIEW_INSIGHTS as ins}
            <div class="flex items-start gap-2.5 text-xs">
              {#if ins.type === 'critical'}
                <span class="w-5 h-5 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center shrink-0 mt-0.5"><AlertTriangle size={12} /></span>
              {:else if ins.type === 'warning'}
                <span class="w-5 h-5 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center shrink-0 mt-0.5"><TrendingDown size={12} /></span>
              {:else if ins.type === 'info'}
                <span class="w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 mt-0.5"><Info size={12} /></span>
              {:else}
                <span class="w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5"><CheckCircle2 size={12} /></span>
              {/if}
              <div>
                <div class="font-semibold text-slate-800">{ins.title}</div>
                <div class="text-slate-500 text-[11px] mt-0.5">{ins.detail}</div>
              </div>
            </div>
          {/each}
        </div>
      </div>
    </div>
  </div>

  <!-- Row 3: Readiness by Clinical Domain + Countries and Sites -->
  <div class="grid grid-cols-1 lg:grid-cols-12 gap-4">
    <div class="lg:col-span-6 bg-white rounded-xl border border-slate-200/80 p-4 shadow-xs">
      <div class="flex items-center justify-between mb-3">
        <h2 class="text-sm font-bold text-slate-900">Readiness by Clinical Domain</h2>
        <span class="text-[11px] text-slate-400">Click any domain to drill down</span>
      </div>
      <div class="overflow-x-auto">
        <table class="w-full text-xs">
          <thead>
            <tr class="text-left text-[11px] text-slate-400 border-b border-slate-100">
              <th class="pb-2 font-medium">Domain</th>
              <th class="pb-2 font-medium text-right">Readiness</th>
              <th class="pb-2 font-medium text-right">Expected</th>
              <th class="pb-2 font-medium text-right">Variance</th>
              <th class="pb-2 font-medium text-right">Status</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            {#each V3_DOMAINS as dom}
              <tr
                class="hover:bg-blue-50/50 transition-colors cursor-pointer"
                on:click={() => onSelectDomain(dom.id)}
              >
                <td class="py-2.5 font-medium text-slate-800">{dom.name}</td>
                <td class="py-2.5 text-right">
                  <div class="inline-flex items-center gap-2">
                    <div class="w-16 h-1.5 rounded-full bg-slate-100 overflow-hidden hidden sm:block">
                      <div
                        class="h-full rounded-full {dom.status === 'On track' ? 'bg-emerald-500' : dom.status === 'High risk' ? 'bg-rose-500' : 'bg-amber-500'}"
                        style="width: {dom.readiness}%"
                      ></div>
                    </div>
                    <span class="font-bold text-slate-900">{dom.readiness}%</span>
                  </div>
                </td>
                <td class="py-2.5 text-right text-slate-500">{dom.expected}%</td>
                <td class="py-2.5 text-right font-semibold {dom.variance <= -10 ? 'text-rose-600' : dom.variance < 0 ? 'text-amber-600' : 'text-emerald-600'}">
                  {dom.variance}%
                </td>
                <td class="py-2.5 text-right">
                  <span class="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full border {badgeClass(dom.status)}">
                    <span class="w-1.5 h-1.5 rounded-full {dotColor(dom.status)}"></span>
                    {dom.status}
                  </span>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    </div>

    <div class="lg:col-span-6 bg-white rounded-xl border border-slate-200/80 p-4 shadow-xs">
      <div class="flex items-center justify-between mb-3">
        <h2 class="text-sm font-bold text-slate-900">Countries and Sites</h2>
        <button
          type="button"
          on:click={() => onSelectTab('sites_countries')}
          class="text-xs font-semibold text-blue-600 hover:text-blue-700 inline-flex items-center gap-0.5 cursor-pointer"
        >
          View Site Heatmap <ChevronRight size={13} />
        </button>
      </div>
      <div class="overflow-x-auto">
        <table class="w-full text-xs">
          <thead>
            <tr class="text-left text-[11px] text-slate-400 border-b border-slate-100">
              <th class="pb-2 font-medium">Country</th>
              <th class="pb-2 font-medium text-right">Sites</th>
              <th class="pb-2 font-medium text-right">Readiness</th>
              <th class="pb-2 font-medium text-right">High-Risk Sites</th>
              <th class="pb-2 font-medium text-right">DBL Impact</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            {#each V3_COUNTRY_SUMMARY as c}
              <tr class="hover:bg-blue-50/40 cursor-pointer" on:click={() => onSelectCountry(c.country)}>
                <td class="py-2.5 font-medium text-slate-800">{c.flag} {c.country}</td>
                <td class="py-2.5 text-right text-slate-600">{c.sites}</td>
                <td class="py-2.5 text-right font-bold {c.readiness < 70 ? 'text-rose-600' : c.readiness < 80 ? 'text-amber-600' : 'text-emerald-600'}">
                  {c.readiness}%
                </td>
                <td class="py-2.5 text-right">
                  <span class="font-semibold {c.highRiskSites > 0 ? 'text-rose-600' : 'text-slate-500'}">{c.highRiskSites}</span>
                </td>
                <td class="py-2.5 text-right font-semibold {c.forecastDays > 0 ? 'text-rose-600' : 'text-slate-500'}">
                  {c.forecastDays > 0 ? `+${c.forecastDays}d` : '0d'}
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    </div>
  </div>

  <!-- Row 4: Top Risks and Next Best Actions -->
  <div class="bg-white rounded-xl border border-slate-200/80 p-4 shadow-xs">
    <div class="flex items-center justify-between mb-3">
      <h2 class="text-sm font-bold text-slate-900">Top Risks and Next Best Actions</h2>
      <button
        type="button"
        on:click={() => onSelectTab('actions_sim')}
        class="text-xs font-semibold text-blue-600 hover:text-blue-700 inline-flex items-center gap-0.5 cursor-pointer"
      >
        View All Actions <ChevronRight size={13} />
      </button>
    </div>
    <div class="overflow-x-auto">
      <table class="w-full text-xs">
        <thead>
          <tr class="text-left text-[11px] text-slate-400 border-b border-slate-100">
            <th class="pb-2 font-medium">Risk / Issue</th>
            <th class="pb-2 font-medium">Impact on DBL</th>
            <th class="pb-2 font-medium">Owner</th>
            <th class="pb-2 font-medium">Target Date</th>
            <th class="pb-2 font-medium">Status</th>
            <th class="pb-2 font-medium text-right">Action</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100">
          {#each V3_ACTIONS.slice(0, 4) as act}
            <tr class="hover:bg-slate-50/70">
              <td class="py-2.5 font-medium text-slate-800">{act.title}</td>
              <td class="py-2.5 font-semibold text-rose-600">+{Math.abs(act.estDblImpactDays)} days</td>
              <td class="py-2.5 text-slate-600">{act.owner}</td>
              <td class="py-2.5 text-slate-600">{act.dueDate}</td>
              <td class="py-2.5">
                <span class="px-2 py-0.5 rounded-md text-[11px] font-medium {act.status === 'In Progress' ? 'bg-amber-50 text-amber-700' : 'bg-rose-50 text-rose-700'}">
                  {act.status}
                </span>
              </td>
              <td class="py-2.5 text-right">
                <button
                  type="button"
                  on:click={() => onSelectTab('actions_sim')}
                  class="text-blue-600 hover:text-blue-800 font-semibold cursor-pointer"
                >
                  {act.actionLabel}
                </button>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  </div>
</div>
