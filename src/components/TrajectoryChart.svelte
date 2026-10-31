<script lang="ts">
  export let timelineSnapshots: any[];
  export let plannedDbl: string = '2026-12-15';

  // SVG Chart dimensions
  const width = 640;
  const height = 220;
  const padding = { top: 25, right: 35, bottom: 35, left: 45 };

  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  // Active hover point
  let hoveredIndex: number | null = 4; // Default to current week

  // Points for Readiness (0 to 100)
  // X values: 5 points evenly spaced
  const points = timelineSnapshots.map((snap, i) => {
    const x = padding.left + (i / (timelineSnapshots.length - 1)) * chartW;
    const yScore = padding.top + chartH - (snap.readinessScore / 100) * chartH;
    const yDelay = padding.top + chartH - (snap.delayDays / 10) * chartH;
    return { ...snap, x, yScore, yDelay, i };
  });

  // Generate SVG path for Readiness
  const scorePath = points.reduce((acc, p, i) => {
    return i === 0 ? `M ${p.x} ${p.yScore}` : `${acc} L ${p.x} ${p.yScore}`;
  }, '');

  // Generate SVG Area fill for Readiness
  const areaPath = `${scorePath} L ${points[points.length - 1].x} ${padding.top + chartH} L ${points[0].x} ${padding.top + chartH} Z`;

  // Delay curve path
  const delayPath = points.reduce((acc, p, i) => {
    return i === 0 ? `M ${p.x} ${p.yDelay}` : `${acc} L ${p.x} ${p.yDelay}`;
  }, '');

  // Target threshold line Y
  const targetY = padding.top + chartH - (95 / 100) * chartH;

  $: activePoint = hoveredIndex !== null ? points[hoveredIndex] : points[4];
</script>

<div class="bg-white rounded-xl border border-slate-200/90 p-4 sm:p-5 shadow-xs space-y-3">
  <!-- Chart Header & Legend -->
  <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
    <div>
      <div class="text-[10px] font-bold uppercase tracking-wider text-slate-500">
        Interactive Visual Trend &middot; Target: {plannedDbl}
      </div>
      <h3 class="text-sm font-bold text-slate-900 mt-0.5">
        DBL Readiness Score vs. Forecast Delay Trajectory
      </h3>
    </div>

    <!-- Chart Legend -->
    <div class="flex items-center space-x-4 text-xs">
      <div class="flex items-center space-x-1.5">
        <span class="w-3 h-1 bg-blue-600 rounded-full"></span>
        <span class="font-medium text-slate-700">Readiness Score (0–100%)</span>
      </div>
      <div class="flex items-center space-x-1.5">
        <span class="w-3 h-1 bg-rose-500 rounded-full"></span>
        <span class="font-medium text-slate-700">Forecast Delay (Days)</span>
      </div>
    </div>
  </div>

  <!-- SVG Chart Container -->
  <div class="relative w-full overflow-hidden">
    <svg
      viewBox="0 0 {width} {height}"
      class="w-full h-auto select-none"
    >
      <defs>
        <!-- Soft gradient for readiness area -->
        <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#3b82f6" stop-opacity="0.2" />
          <stop offset="100%" stop-color="#3b82f6" stop-opacity="0.0" />
        </linearGradient>
      </defs>

      <!-- Horizontal Grid Lines -->
      {#each [0, 25, 50, 75, 100] as gridVal}
        {@const y = padding.top + chartH - (gridVal / 100) * chartH}
        <line
          x1={padding.left}
          y1={y}
          x2={width - padding.right}
          y2={y}
          stroke="#f1f5f9"
          stroke-width="1"
        />
        <!-- Y-Axis Label (Left: Readiness %) -->
        <text
          x={padding.left - 8}
          y={y + 3.5}
          text-anchor="end"
          class="text-[9px] fill-slate-400 font-medium"
        >
          {gridVal}%
        </text>
      {/each}

      <!-- Target Milestone Line (95% GxP Threshold) -->
      <line
        x1={padding.left}
        y1={targetY}
        x2={width - padding.right}
        y2={targetY}
        stroke="#10b981"
        stroke-width="1.2"
        stroke-dasharray="4 3"
      />
      <text
        x={width - padding.right}
        y={targetY - 5}
        text-anchor="end"
        class="text-[9px] fill-emerald-600 font-bold"
      >
        Lock Target Threshold (95%)
      </text>

      <!-- Readiness Area Fill -->
      <path d={areaPath} fill="url(#scoreGradient)" />

      <!-- Readiness Score Curve -->
      <path
        d={scorePath}
        fill="none"
        stroke="#2563eb"
        stroke-width="2.5"
        stroke-linecap="round"
        stroke-linejoin="round"
      />

      <!-- Delay Days Curve -->
      <path
        d={delayPath}
        fill="none"
        stroke="#f43f5e"
        stroke-width="2"
        stroke-dasharray="3 3"
        stroke-linecap="round"
        stroke-linejoin="round"
      />

      <!-- Vertical Hover Guide Line -->
      {#if activePoint}
        <line
          x1={activePoint.x}
          y1={padding.top}
          x2={activePoint.x}
          y2={padding.top + chartH}
          stroke="#94a3b8"
          stroke-width="1"
          stroke-dasharray="2 2"
        />
      {/if}

      <!-- Interactive Data Dots -->
      {#each points as p, i}
        <!-- X Axis Tick Label -->
        <text
          x={p.x}
          y={height - 10}
          text-anchor="middle"
          class="text-[10px] {i === hoveredIndex ? 'fill-slate-900 font-bold' : 'fill-slate-500'}"
        >
          {p.weekLabel}
        </text>

        <!-- Delay Dot -->
        <circle
          role="presentation"
          cx={p.x}
          cy={p.yDelay}
          r={hoveredIndex === i ? 5 : 3.5}
          fill="#f43f5e"
          stroke="#ffffff"
          stroke-width="1.5"
          class="cursor-pointer transition-all"
          on:mouseenter={() => hoveredIndex = i}
        />

        <!-- Readiness Dot -->
        <circle
          role="presentation"
          cx={p.x}
          cy={p.yScore}
          r={hoveredIndex === i ? 6 : 4}
          fill="#2563eb"
          stroke="#ffffff"
          stroke-width="2"
          class="cursor-pointer transition-all"
          on:mouseenter={() => hoveredIndex = i}
        />
      {/each}
    </svg>
  </div>

  <!-- Dynamic Point Insight Tooltip / Callout -->
  {#if activePoint}
    <div class="p-3 bg-slate-50 rounded-lg border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
      <div class="flex items-center space-x-3">
        <span class="font-bold text-slate-900 text-xs px-2 py-0.5 rounded bg-white border border-slate-200 shadow-xs">
          {activePoint.weekLabel} ({activePoint.date})
        </span>
        <span class="text-blue-700 font-bold">
          Readiness: {activePoint.readinessScore}%
        </span>
        <span class="text-rose-600 font-bold">
          Delay: +{activePoint.delayDays} Days
        </span>
      </div>

      <div class="text-slate-600 text-[11px] font-medium italic">
        "{activePoint.notes}"
      </div>
    </div>
  {/if}
</div>
