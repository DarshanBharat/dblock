<script lang="ts">
  import {
    ArrowLeft,
    AlertTriangle,
    TrendingUp,
    TrendingDown,
    Info,
    CheckCircle2,
    ChevronRight,
    FileText,
    SlidersHorizontal,
    RotateCcw
  } from '@lucide/svelte';
  import {
    V3_STUDY_META,
    V3_OVERVIEW_TREND,
    V3_OVERVIEW_INSIGHTS,
    V3_DOMAINS,
    V3_COUNTRY_SUMMARY,
    V3_ACTIONS,
    V3_SITES
  } from '../data/v3Data';
  import dblockData from '../data/dblock_data.json';
  import RealWorldMap from './RealWorldMap.svelte';

  export let onSelectTab: (tab: string) => void;
  export let onSelectDomain: (domainId: string) => void;
  export let onSelectCountry: (country: string) => void = () => onSelectTab('sites_countries');

  const v2SitesById = new Map<string, any>(((dblockData as any).sites || []).map((s: any) => [String(s.id), s]));
  const countryCoords: Record<string, { lat: number; lng: number; code: string }> = {
    'United States': { lat: 42.36, lng: -71.06, code: 'US' },
    'Germany': { lat: 52.52, lng: 13.4, code: 'DE' },
    'South Korea': { lat: 37.56, lng: 126.97, code: 'KR' },
    'France': { lat: 48.85, lng: 2.35, code: 'FR' },
    'Japan': { lat: 35.68, lng: 139.69, code: 'JP' },
    'United Kingdom': { lat: 51.5, lng: -0.12, code: 'UK' },
  };

  const mappedSitesForMap = V3_SITES.map((s, idx) => {
    const v2 = v2SitesById.get(s.id);
    const fallback = countryCoords[s.country] || { lat: 40 + idx, lng: 0, code: 'US' };
    const openItems = Math.max(4, Math.round((100 - s.readiness) * 0.9) + s.hardGateBlockers * 3);
    return {
      id: s.id,
      code: `Site ${s.id}`,
      name: s.name,
      city: v2?.city || s.name.split('–')[1]?.trim() || s.country,
      country: s.country,
      countryCode: v2?.countryCode || fallback.code,
      lat: v2?.lat ?? fallback.lat + (idx % 3) * 0.6,
      lng: v2?.lng ?? fallback.lng + (idx % 3) * 0.6,
      openItems,
      forecastImpactDays: s.dblImpactDays > 0 ? `+${s.dblImpactDays}d` : '0d',
      riskLevel: s.riskLevel === 'High risk' ? 'Critical' : s.riskLevel === 'At risk' ? 'High' : 'Low',
      riskProbability: Math.min(95, Math.max(10, 100 - s.readiness + s.hardGateBlockers * 6)),
      keyRiskDrivers: s.primaryDriver,
    };
  });

  // Readiness Weightage Configurator State
  let showWeightConfig = false;
  const DEFAULT_WEIGHTS: Record<string, number> = {
    edc: 20,
    queries: 15,
    external: 20,
    safety: 15,
    coding: 8,
    pi_sig: 10,
    deviations: 6,
    sdv: 6,
  };
  let domainWeights: Record<string, number> = { ...DEFAULT_WEIGHTS };

  $: totalWeight = Object.values(domainWeights).reduce((sum, w) => sum + w, 0);
  $: weightedReadinessRaw =
    totalWeight > 0
      ? V3_DOMAINS.reduce((sum, d) => sum + d.readiness * (domainWeights[d.id] ?? 0), 0) / totalWeight
      : V3_STUDY_META.overallReadiness;
  $: defaultWeightedRaw =
    V3_DOMAINS.reduce((sum, d) => sum + d.readiness * (DEFAULT_WEIGHTS[d.id] ?? 0), 0) / 100;
  // Anchor default weights to V3_STUDY_META.overallReadiness (72%) and reflect delta dynamically
  $: computedReadiness = Math.max(
    0,
    Math.min(100, Math.round(V3_STUDY_META.overallReadiness + (weightedReadinessRaw - defaultWeightedRaw)))
  );
  $: computedGap = computedReadiness - V3_STUDY_META.expectedReadiness;
  $: isCustomWeights = V3_DOMAINS.some((d) => domainWeights[d.id] !== DEFAULT_WEIGHTS[d.id]);

  function resetWeights() {
    domainWeights = { ...DEFAULT_WEIGHTS };
  }

  function applyPreset(preset: 'balanced' | 'safety_ext' | 'edc_query') {
    if (preset === 'balanced') {
      domainWeights = { ...DEFAULT_WEIGHTS };
    } else if (preset === 'safety_ext') {
      domainWeights = { edc: 10, queries: 10, external: 30, safety: 25, coding: 5, pi_sig: 10, deviations: 5, sdv: 5 };
    } else {
      domainWeights = { edc: 30, queries: 25, external: 10, safety: 10, coding: 8, pi_sig: 7, deviations: 5, sdv: 5 };
    }
  }

  function normalizeWeights() {
    if (totalWeight <= 0) {
      resetWeights();
      return;
    }
    const next: Record<string, number> = {};
    let running = 0;
    const keys = V3_DOMAINS.map((d) => d.id);
    keys.forEach((k, i) => {
      if (i === keys.length - 1) {
        next[k] = Math.max(0, 100 - running);
      } else {
        const val = Math.round(((domainWeights[k] ?? 0) / totalWeight) * 100);
        next[k] = val;
        running += val;
      }
    });
    domainWeights = next;
  }

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
        <div class="flex flex-wrap items-center gap-2">
          <button
            type="button"
            on:click={() => (showWeightConfig = !showWeightConfig)}
            class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold cursor-pointer transition-colors {showWeightConfig || isCustomWeights ? 'border-blue-300 bg-blue-50 text-blue-700' : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'}"
          >
            <SlidersHorizontal size={13} />
            <span>{showWeightConfig ? 'Hide Weightage Config' : 'Configure Readiness Weights'}</span>
            {#if isCustomWeights}
              <span class="px-1.5 py-0.5 rounded bg-blue-600 text-white text-[9px] font-bold">Custom</span>
            {/if}
          </button>
          <button
            type="button"
            on:click={() => onSelectTab('actions_sim')}
            class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 cursor-pointer"
          >
            <FileText size={13} /> Generate Executive Report
          </button>
        </div>
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

  <!-- 5 Executive KPI Cards with Drill-Down Buttons -->
  <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
    <!-- Card 1: Overall Study Readiness -->
    <div class="bg-white rounded-xl border border-slate-200/80 p-4 shadow-xs flex flex-col justify-between">
      <div>
        <div class="flex items-center justify-between gap-1">
          <div class="text-xs font-medium text-slate-500">Overall Study Readiness</div>
          {#if isCustomWeights}
            <span class="px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 text-[9px] font-bold">Weighted</span>
          {/if}
        </div>
        <div class="mt-1.5 flex items-baseline gap-2">
          <span class="text-3xl font-bold text-slate-900">{computedReadiness}%</span>
          <div class="text-[11px] leading-tight">
            <div class="font-semibold {computedGap >= 0 ? 'text-emerald-600' : 'text-rose-600'}">
              {computedGap >= 0 ? `+${computedGap}` : computedGap}% vs expected
            </div>
            <div class="text-slate-400">Expected today: {V3_STUDY_META.expectedReadiness}%</div>
          </div>
        </div>
        <div class="mt-3 h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
          <div class="h-full bg-amber-500 rounded-full transition-all" style="width: {computedReadiness}%"></div>
        </div>
        <div class="mt-2 text-[11px] text-slate-500">
          {V3_STUDY_META.lockReadySubjects} / {V3_STUDY_META.enrolledSubjects} subjects lock-ready
        </div>
      </div>
      <div class="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between gap-2">
        <button
          type="button"
          on:click={() => (showWeightConfig = !showWeightConfig)}
          class="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 hover:text-blue-600 cursor-pointer"
        >
          <SlidersHorizontal size={11} /> Weights
        </button>
        <button
          type="button"
          on:click={() => onSelectTab('clinical_domains')}
          class="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:text-blue-800 cursor-pointer"
        >
          Drill into Domains <ChevronRight size={12} />
        </button>
      </div>
    </div>

    <!-- Card 2: Predicted DBL Date (P80) -->
    <div class="bg-white rounded-xl border border-slate-200/80 p-4 shadow-xs flex flex-col justify-between">
      <div>
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
      <div class="mt-3 pt-2.5 border-t border-slate-100">
        <button
          type="button"
          on:click={() => onSelectTab('actions_sim')}
          class="w-full inline-flex items-center justify-between text-[11px] font-semibold text-blue-600 hover:text-blue-800 cursor-pointer"
        >
          <span>Simulate DBL Recovery</span>
          <ChevronRight size={12} />
        </button>
      </div>
    </div>

    <!-- Card 3: Probability of Meeting DBL -->
    <div class="bg-white rounded-xl border border-slate-200/80 p-4 shadow-xs flex flex-col justify-between">
      <div>
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
      <div class="mt-3 pt-2.5 border-t border-slate-100">
        <button
          type="button"
          on:click={() => onSelectTab('actions_sim')}
          class="w-full inline-flex items-center justify-between text-[11px] font-semibold text-blue-600 hover:text-blue-800 cursor-pointer"
        >
          <span>View Forecast &amp; Drivers</span>
          <ChevronRight size={12} />
        </button>
      </div>
    </div>

    <!-- Card 4: Hard-Gate Blockers -->
    <div class="bg-white rounded-xl border border-slate-200/80 p-4 shadow-xs flex flex-col justify-between">
      <div>
        <div class="text-xs font-medium text-slate-500">Hard-Gate Blockers</div>
        <div class="mt-1.5 flex items-baseline gap-2">
          <span class="text-3xl font-bold text-slate-900">{V3_STUDY_META.hardGateBlockers}</span>
          <span class="text-xs font-semibold text-rose-600">+2 vs last week</span>
        </div>
        <div class="mt-4 text-[11px] text-slate-500">
          2 SAEs · 2 Labs · 3 Queries · 1 PI Signature
        </div>
      </div>
      <div class="mt-3 pt-2.5 border-t border-slate-100">
        <button
          type="button"
          on:click={() => onSelectDomain('external')}
          class="w-full inline-flex items-center justify-between text-[11px] font-semibold text-blue-600 hover:text-blue-800 cursor-pointer"
        >
          <span>Inspect Critical Blockers</span>
          <ChevronRight size={12} />
        </button>
      </div>
    </div>

    <!-- Card 5: High-Risk Sites -->
    <div class="bg-white rounded-xl border border-slate-200/80 p-4 shadow-xs flex flex-col justify-between">
      <div>
        <div class="text-xs font-medium text-slate-500">High-Risk Sites</div>
        <div class="mt-1.5 flex items-baseline gap-2">
          <span class="text-3xl font-bold text-slate-900">{V3_STUDY_META.highRiskSites}</span>
          <span class="text-lg text-slate-400 font-semibold">/ {V3_STUDY_META.totalSites}</span>
        </div>
        <div class="mt-4 text-[11px] text-slate-500">
          Site 104 (US), Site 317 (DE), Site 405 (KR)
        </div>
      </div>
      <div class="mt-3 pt-2.5 border-t border-slate-100">
        <button
          type="button"
          on:click={() => onSelectTab('sites_countries')}
          class="w-full inline-flex items-center justify-between text-[11px] font-semibold text-blue-600 hover:text-blue-800 cursor-pointer"
        >
          <span>Drill into High-Risk Sites</span>
          <ChevronRight size={12} />
        </button>
      </div>
    </div>
  </div>

  <!-- Collapsible Readiness Score Weightage Configurator -->
  {#if showWeightConfig}
    <div class="bg-white rounded-xl border border-blue-200 shadow-xs p-5 space-y-4">
      <div class="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div>
          <div class="flex items-center gap-2">
            <SlidersHorizontal size={15} class="text-blue-600" />
            <h2 class="text-sm font-bold text-slate-900">Readiness Score Weightage Configurator</h2>
            <span class="px-2 py-0.5 rounded-full text-[11px] font-bold {totalWeight === 100 ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'}">
              Total Weight: {totalWeight}%
            </span>
          </div>
          <p class="text-xs text-slate-500 mt-0.5">
            Adjust domain weightages to model study-specific lock priorities. Overall Study Readiness recalculates live (<span class="font-bold text-slate-800">{computedReadiness}%</span>).
          </p>
        </div>

        <div class="flex flex-wrap items-center gap-2">
          <button
            type="button"
            on:click={() => applyPreset('balanced')}
            class="px-2.5 py-1 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-[11px] font-semibold text-slate-700 cursor-pointer"
          >
            Balanced (Default)
          </button>
          <button
            type="button"
            on:click={() => applyPreset('safety_ext')}
            class="px-2.5 py-1 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-[11px] font-semibold text-slate-700 cursor-pointer"
          >
            Safety &amp; External Heavy
          </button>
          <button
            type="button"
            on:click={() => applyPreset('edc_query')}
            class="px-2.5 py-1 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-[11px] font-semibold text-slate-700 cursor-pointer"
          >
            EDC &amp; Query Heavy
          </button>
          {#if totalWeight !== 100}
            <button
              type="button"
              on:click={normalizeWeights}
              class="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-semibold cursor-pointer"
            >
              Normalize to 100%
            </button>
          {/if}
          <button
            type="button"
            on:click={resetWeights}
            class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-200 text-[11px] font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
          >
            <RotateCcw size={11} /> Reset
          </button>
        </div>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {#each V3_DOMAINS as dom}
          {@const w = domainWeights[dom.id] ?? 0}
          <div class="rounded-lg border border-slate-200/80 bg-slate-50/50 p-3 space-y-2">
            <div class="flex items-center justify-between gap-2 text-xs">
              <span class="font-semibold text-slate-800 truncate">{dom.name}</span>
              <span class="font-mono font-bold text-blue-700 shrink-0">{w}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="50"
              step="1"
              bind:value={domainWeights[dom.id]}
              class="w-full accent-blue-600 cursor-pointer"
              aria-label="{dom.name} weightage"
            />
            <div class="flex items-center justify-between text-[10px] text-slate-500">
              <span>Domain score: <strong class="text-slate-700">{dom.readiness}%</strong></span>
              <span>Contrib: <strong class="text-slate-700">{totalWeight > 0 ? Math.round((dom.readiness * w) / totalWeight) : 0} pts</strong></span>
            </div>
          </div>
        {/each}
      </div>
    </div>
  {/if}

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

  <!-- Row 3: Countries and Sites (Map on the Left + Table on the Right) -->
  <div class="bg-white rounded-xl border border-slate-200/80 p-4 shadow-xs space-y-3">
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-sm font-bold text-slate-900">Countries and Sites</h2>
        <p class="text-[11px] text-slate-400">Interactive global site readiness map alongside country-level DBL impact</p>
      </div>
      <button
        type="button"
        on:click={() => onSelectTab('sites_countries')}
        class="text-xs font-semibold text-blue-600 hover:text-blue-700 inline-flex items-center gap-0.5 cursor-pointer"
      >
        View All 18 Sites <ChevronRight size={13} />
      </button>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
      <!-- Map on the Left -->
      <div class="lg:col-span-6 h-[290px] rounded-lg overflow-hidden border border-slate-200">
        <RealWorldMap
          sites={mappedSitesForMap}
          onSelectSite={(site) => onSelectCountry(site.country)}
        />
      </div>

      <!-- Table on the Right -->
      <div class="lg:col-span-6 overflow-x-auto flex flex-col justify-center">
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

  <!-- Row 4: Readiness by Clinical Domain + Top Risks and Next Best Actions -->
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
            {#each V3_ACTIONS.slice(0, 6) as act}
              <tr class="hover:bg-slate-50/70">
                <td class="py-2.5 font-medium text-slate-800">{act.title}</td>
                <td class="py-2.5 font-semibold text-rose-600 whitespace-nowrap">+{Math.abs(act.estDblImpactDays)} days</td>
                <td class="py-2.5 text-slate-600">{act.owner}</td>
                <td class="py-2.5 text-slate-600 whitespace-nowrap">{act.dueDate}</td>
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
</div>
