<script lang="ts">
  import {
    Activity,
    AlertTriangle,
    CheckCircle2,
    Clock,
    FileSpreadsheet,
    FlaskConical,
    ShieldAlert,
    ChevronRight,
    Sliders,
    ArrowUpRight,
    FileText,
    ArrowRight
  } from '@lucide/svelte';

  export let dimensions: any[];
  export let timelineSnapshots: any[];
  export let onSelectTab: (tab: string) => void;
  export let onSelectSite: (siteId: string) => void;

  // Selected time slider index (0 = Week -4, 4 = Current W0)
  let selectedWeekIndex = 4;
  let compareView = 'Chart';
  $: currentSnapshot = timelineSnapshots[selectedWeekIndex] || timelineSnapshots[4];

  // Selected dimension for evidence drill-down
  let selectedDimensionId = 'dim-safety';
  $: activeDimension = dimensions.find(d => d.id === selectedDimensionId) || dimensions[0];

  function getStatusBadge(status: string) {
    if (status === 'critical') return { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200', dot: 'bg-rose-500', label: 'Critical' };
    if (status === 'warning') return { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', dot: 'bg-amber-500', label: 'Attention' };
    return { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', dot: 'bg-emerald-500', label: 'On Track' };
  }
</script>

<div class="space-y-6">

  <!-- ========================================================================= -->
  <!-- DIFFERENTIATING FEATURE: INTERACTIVE TIME-SERIES SLIDER SCRUBBER          -->
  <!-- ========================================================================= -->
  <div class="bg-white rounded-lg border border-slate-200 p-5 shadow-xs">
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
      <div>
        <div class="flex items-center space-x-2">
          <span class="text-[11px] font-bold tracking-wider uppercase text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
            Differentiating Feature &middot; Dynamic Digital Twin
          </span>
          <span class="text-xs text-slate-500">Historical Model Progression</span>
        </div>
        <h2 class="text-base font-bold text-slate-900 mt-1">DBLock State Over Time &middot; Temporal Scrubber</h2>
        <p class="text-xs text-slate-500">
          Drag slider to inspect how readiness scores, critical-path blockers, and DBL forecast dates evolved over the past 4 weeks.
        </p>
      </div>

      <!-- Current selected snapshot capsule -->
      <div class="flex items-center space-x-4 bg-slate-50 rounded-md p-2.5 border border-slate-200">
        <div>
          <div class="text-[10px] font-semibold text-slate-500 uppercase">Selected View</div>
          <div class="text-xs font-bold text-slate-900">{currentSnapshot.weekLabel} ({currentSnapshot.date})</div>
        </div>
        <div class="h-6 w-px bg-slate-200"></div>
        <div>
          <div class="text-[10px] font-semibold text-slate-500 uppercase">Readiness</div>
          <div class="text-sm font-extrabold text-blue-600 num-tabular">{currentSnapshot.readinessScore}%</div>
        </div>
        <div class="h-6 w-px bg-slate-200"></div>
        <div>
          <div class="text-[10px] font-semibold text-slate-500 uppercase">Forecast DBL</div>
          <div class="text-xs font-bold text-slate-900 num-tabular">
            {currentSnapshot.forecastDate} <span class="text-rose-600">(+{currentSnapshot.delayDays}d)</span>
          </div>
        </div>
      </div>
    </div>

    <!-- The Interactive Slider Control -->
    <div class="space-y-2 pt-2">
      <input
        type="range"
        min="0"
        max="4"
        step="1"
        bind:value={selectedWeekIndex}
        class="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
      />

      <!-- Slider Tick Marks & Notes -->
      <div class="grid grid-cols-5 gap-1 pt-1 text-center">
        {#each timelineSnapshots as snap, idx}
          <button
            type="button"
            on:click={() => selectedWeekIndex = idx}
            class="text-left p-2 rounded transition-colors {
              selectedWeekIndex === idx ? 'bg-blue-50 border border-blue-200' : 'hover:bg-slate-50'
            }"
          >
            <div class="flex items-center justify-between text-xs">
              <span class="font-bold {selectedWeekIndex === idx ? 'text-blue-900' : 'text-slate-700'}">{snap.weekLabel}</span>
              <span class="text-[10px] font-semibold num-tabular {snap.delayDays >= 5 ? 'text-rose-600' : 'text-amber-600'}">+{snap.delayDays}d</span>
            </div>
            <div class="text-[11px] font-bold text-slate-900 num-tabular mt-0.5">{snap.readinessScore}% score</div>
            <div class="text-[10px] text-slate-500 mt-1 line-clamp-1">{snap.notes}</div>
          </button>
        {/each}
      </div>
    </div>
  </div>

  <section class="panel"><div class="section-heading"><div><p class="eyebrow">COMPARE READINESS</p><h2>Which areas are furthest from target?</h2><p>Current sample scores compared with each area's benchmark. Select a row to see its evidence below.</p></div><div class="workflow-tabs"><button class:chosen={compareView==='Chart'} on:click={() => compareView='Chart'}>Chart</button><button class:chosen={compareView==='Table'} on:click={() => compareView='Table'}>Table</button></div></div><div class="insight-banner"><strong>Insight:</strong> Safety reconciliation is {dimensions.find(d=>d.id==='dim-safety')?.score}% ready against a {dimensions.find(d=>d.id==='dim-safety')?.benchmark}% target in this sample.</div>{#if compareView==='Chart'}<div class="dimension-comparison">{#each dimensions as d}<button on:click={() => selectedDimensionId=d.id}><span><strong>{d.name}</strong><small>{d.score}% / {d.benchmark}% target</small></span><div class="dimension-track"><div style="width:{d.score}%"></div><i style="left:{d.benchmark}%" title="Target {d.benchmark}%"></i></div></button>{/each}</div>{:else}<div class="table-scroll"><table class="action-table"><thead><tr><th>Readiness area</th><th>Current</th><th>Target</th><th>Gap</th></tr></thead><tbody>{#each dimensions as d}<tr><td><button class="table-action" on:click={() => selectedDimensionId=d.id}>{d.name}</button></td><td>{d.score}%</td><td>{d.benchmark}%</td><td>{Math.max(0,d.benchmark-d.score)} points</td></tr>{/each}</tbody></table></div>{/if}<p class="footnote">The vertical marker indicates the sample target; details for the selected area appear below.</p></section>

  <!-- ========================================================================= -->
  <!-- THE 6 READINESS DIMENSION CARDS (GREEN, AMBER, RED)                       -->
  <!-- ========================================================================= -->
  <div>
    <div class="flex items-center justify-between mb-3">
      <div>
        <h3 class="text-sm font-bold text-slate-900">Current Readiness Dimensions</h3>
        <p class="text-xs text-slate-500">Click any dimension card below to inspect underlying sample evidence and discrepancies</p>
      </div>
      <div class="flex items-center space-x-3 text-xs">
        <span class="inline-flex items-center text-rose-700"><span class="w-2 h-2 rounded-full bg-rose-500 mr-1.5"></span> Critical (Safety Recon)</span>
        <span class="inline-flex items-center text-amber-700"><span class="w-2 h-2 rounded-full bg-amber-500 mr-1.5"></span> Warning (Lab, Queries)</span>
        <span class="inline-flex items-center text-emerald-700"><span class="w-2 h-2 rounded-full bg-emerald-500 mr-1.5"></span> On Track (Coding, EDC, SDV)</span>
      </div>
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {#each dimensions as dim}
        {@const badge = getStatusBadge(dim.status)}
        <button
          type="button"
          on:click={() => selectedDimensionId = dim.id}
          class="text-left bg-white rounded-lg border p-4 transition-all duration-200 relative group {
            selectedDimensionId === dim.id
              ? 'border-blue-600 shadow-sm ring-2 ring-blue-500/20'
              : 'border-slate-200/90 hover:border-slate-300 shadow-xs'
          }"
        >
          <!-- Top Row: Name and Status Badge -->
          <div class="flex items-start justify-between">
            <div>
              <h4 class="text-xs font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                {dim.name}
              </h4>
              <span class="text-[11px] text-slate-500">Benchmark: {dim.benchmark}%</span>
            </div>
            <span class="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold border {badge.bg} {badge.text} {badge.border}">
              <span class="w-1.5 h-1.5 rounded-full {badge.dot} mr-1.5"></span>
              {badge.label}
            </span>
          </div>

          <!-- Score & Progress Bar -->
          <div class="mt-3">
            <div class="flex items-baseline justify-between mb-1">
              <span class="text-2xl font-extrabold text-slate-900 num-tabular">{dim.score}%</span>
              <span class="text-xs font-semibold {dim.delta.includes('-') || dim.delta.includes('overdue') ? 'text-rose-600' : 'text-emerald-600'}">
                {dim.delta}
              </span>
            </div>

            <!-- Crisp Progress Track -->
            <div class="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
              <div
                class="h-full rounded-full transition-all duration-500 {
                  dim.status === 'critical' ? 'bg-rose-500' : dim.status === 'warning' ? 'bg-amber-500' : 'bg-emerald-500'
                }"
                style="width: {dim.score}%"
              ></div>
            </div>
          </div>

          <!-- Bottom Details -->
          <div class="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <span class="text-slate-600 font-medium truncate max-w-[170px]" title={dim.details}>
              {dim.evidenceCount}
            </span>
            <span class="text-blue-600 font-semibold group-hover:translate-x-0.5 transition-transform flex items-center">
              <span>Inspect</span>
              <ChevronRight class="w-3 h-3 ml-0.5" />
            </span>
          </div>
        </button>
      {/each}
    </div>
  </div>

  <!-- ========================================================================= -->
  <!-- EVIDENCE AUDIT DRAWER (SHOW EVIDENCE BEHIND THE SCORE)                    -->
  <!-- ========================================================================= -->
  <div class="bg-white rounded-lg border border-slate-200 p-5 shadow-xs">
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
      <div>
        <div class="flex items-center space-x-2">
          <span class="text-[11px] font-bold tracking-wider uppercase text-slate-500">Evidence Audit Trail</span>
          <span class="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold {getStatusBadge(activeDimension.status).bg} {getStatusBadge(activeDimension.status).text}">
            {activeDimension.name} &middot; Score {activeDimension.score}%
          </span>
        </div>
        <h3 class="text-base font-bold text-slate-900 mt-1">
          Detailed Clinical Deficit &amp; Evidence Rationale
        </h3>
      </div>

      <div class="flex items-center space-x-2">
        <button
          type="button"
          on:click={() => onSelectTab('action_workbench')}
          class="inline-flex items-center px-3 py-1.5 rounded-md bg-blue-600 text-white text-xs font-semibold hover:bg-blue-500 transition-colors shadow-xs"
        >
          <span>Intervene via Workbench</span>
          <ArrowRight class="w-3.5 h-3.5 ml-1" />
        </button>
      </div>
    </div>

    <!-- Evidence Content based on activeDimension -->
    <div class="mt-4 grid grid-cols-1 md:grid-cols-3 gap-5">
      
      <!-- Deficit Diagnosis -->
      <div class="md:col-span-2 space-y-3">
        <div class="p-3.5 bg-slate-50 rounded-md border border-slate-200">
          <h4 class="text-xs font-bold text-slate-900 uppercase tracking-wide">Diagnosis &amp; Root Cause</h4>
          <p class="mt-1 text-xs text-slate-700 leading-relaxed">
            {activeDimension.details}
          </p>
        </div>

        {#if activeDimension.id === 'dim-safety'}
          <div class="space-y-2">
            <h4 class="text-xs font-bold text-slate-900 uppercase tracking-wide">Unresolved Discrepancies on Critical Path</h4>
            
            <div class="p-3 rounded border border-rose-200 bg-rose-50/50 space-y-1">
              <div class="flex items-center justify-between text-xs">
                <span class="font-bold text-slate-900">SUBJ-104-003 &middot; Grade 3 Cytokine Release Syndrome</span>
                <span class="text-rose-700 font-semibold text-[11px]">3.0 Days Delay Impact</span>
              </div>
              <p class="text-[11px] text-slate-600">
                Discordant Onset Date: Rave eCRF logs Oct 12 (Related); Argus PV Case #PV-2026-9812 logs Oct 14 (Unrelated).
              </p>
              <button
                type="button"
                on:click={() => onSelectSite('104')}
                class="mt-1 text-xs font-semibold text-rose-700 hover:text-rose-900 inline-flex items-center"
              >
                <span>Drill into Site 104 Safety Case</span>
                <ChevronRight class="w-3 h-3 ml-1" />
              </button>
            </div>

            <div class="p-3 rounded border border-rose-200 bg-rose-50/50 space-y-1">
              <div class="flex items-center justify-between text-xs">
                <span class="font-bold text-slate-900">SUBJ-104-012 &middot; Fatal Neutropenic Sepsis</span>
                <span class="text-rose-700 font-semibold text-[11px]">2.2 Days Delay Impact</span>
              </div>
              <p class="text-[11px] text-slate-600">
                Argus 7-day SUSAR closed; Rave Form DD-01 missing certified hospice discharge note.
              </p>
            </div>
          </div>

        {:else if activeDimension.id === 'dim-lab'}
          <div class="space-y-2">
            <h4 class="text-xs font-bold text-slate-900 uppercase tracking-wide">Overdue External Data Batches</h4>
            <div class="p-3 rounded border border-amber-200 bg-amber-50/50 space-y-1">
              <div class="flex items-center justify-between text-xs">
                <span class="font-bold text-slate-900">Batch #LXB-8921 &middot; LabCorp Geneva (ctDNA NGS)</span>
                <span class="text-amber-700 font-semibold text-[11px]">4 Days Overdue &middot; 1.8d Delay Impact</span>
              </div>
              <p class="text-[11px] text-slate-600">
                SFTP Checksum failure on FASTQ trailer records. 48 samples across Sites 104 and 317 pending reconciliation.
              </p>
            </div>
          </div>

        {:else}
          <div class="p-3 rounded border border-slate-200 bg-slate-50 space-y-1">
            <div class="flex items-center justify-between text-xs">
              <span class="font-bold text-slate-900">Operational Summary</span>
              <span class="text-emerald-700 font-semibold text-[11px]">Governance Standard Met</span>
            </div>
            <p class="text-[11px] text-slate-600">
              Velocity burn-down rate is sufficient to reach 100% threshold before planned LSLV freeze date.
            </p>
          </div>
        {/if}
      </div>

      <!-- Governance Metadata Card -->
      <div class="bg-slate-50 rounded-md border border-slate-200 p-3.5 space-y-3 text-xs">
        <h4 class="font-bold text-slate-900 uppercase tracking-wide text-[11px]">Dimension Governance</h4>
        
        <div class="space-y-2">
          <div>
            <span class="text-slate-500 text-[11px] block">Designated Functional Owner:</span>
            <span class="font-semibold text-slate-800">{activeDimension.owner}</span>
          </div>

          <div>
            <span class="text-slate-500 text-[11px] block">Regulatory Standard:</span>
            <span class="font-semibold text-slate-800">ICH E6(R2) &middot; 21 CFR Part 312</span>
          </div>

          <div>
            <span class="text-slate-500 text-[11px] block">Model Factor Weight:</span>
            <span class="font-semibold text-slate-800">
              {activeDimension.id === 'dim-safety' ? '0.35 (Critical Path Multiplier 2.4x)' : activeDimension.id === 'dim-lab' ? '0.30' : '0.15'}
            </span>
          </div>

          <div>
            <span class="text-slate-500 text-[11px] block">Data Lineage:</span>
            <span class="font-semibold text-slate-800">Continuous ETL Pipeline &middot; MD5 Illustrative</span>
          </div>
        </div>

        <div class="pt-2 border-t border-slate-200">
          <button
            type="button"
            on:click={() => onSelectTab('risk_matrix')}
            class="text-blue-600 hover:text-blue-800 font-semibold text-xs inline-flex items-center"
          >
            <span>Cross-reference in Risk Matrix</span>
            <ChevronRight class="w-3.5 h-3.5 ml-0.5" />
          </button>
        </div>
      </div>

    </div>
  </div>

</div>
