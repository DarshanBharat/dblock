<script lang="ts">
  export let sites: any[];
  export let onSelectSite: (siteId: string) => void;

  // Chart dimensions
  const width = 640;
  const height = 300;
  const padding = { top: 30, right: 35, bottom: 45, left: 50 };

  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  // Scales
  // X: Volume 0 to 50
  // Y: Delay 0 to 8 days
  const maxVolume = 50;
  const maxDelay = 8;

  function getX(volume: number) {
    return padding.left + (Math.min(volume, maxVolume) / maxVolume) * chartW;
  }

  function getY(delay: number) {
    return padding.top + chartH - (Math.min(delay, maxDelay) / maxDelay) * chartH;
  }

  // Selected or hovered site
  let hoveredSiteId: string | null = '104';
  $: activeSite = sites.find(s => s.id === hoveredSiteId) || sites[0];

  // Midpoints for 4 quadrants
  const midX = padding.left + (25 / maxVolume) * chartW;
  const midY = padding.top + chartH - (3.5 / maxDelay) * chartH;
</script>

<div class="bg-white rounded-xl border border-slate-200/90 p-4 sm:p-5 shadow-xs space-y-4">
  
  <!-- Header & Insight Note -->
  <div class="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
    <div>
      <div class="text-[10px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 inline-block mb-1">
        Visual Intelligence &middot; Quadrant Scatter Plot
      </div>
      <h3 class="text-sm font-bold text-slate-900">
        Clinical Risk Matrix: Critical Path Impact vs. Issue Volume
      </h3>
      <p class="text-xs text-slate-500 max-w-xl">
        Non-technical visual insight: Sites in the <strong>top-left red quadrant</strong> have few queries but high critical path danger. Sites in the <strong>bottom-right</strong> have high volume but zero lock danger.
      </p>
    </div>

    <!-- Active Site Quick Inspector Capsule -->
    {#if activeSite}
      <div class="shrink-0 bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-right">
        <div class="font-bold text-slate-900">{activeSite.code} &middot; {activeSite.name}</div>
        <div class="text-[11px] text-slate-600">
          <strong class="text-rose-600">{activeSite.forecastImpactDays} delay</strong> &middot; {activeSite.openItems} items
        </div>
        <button
          type="button"
          on:click={() => onSelectSite(activeSite.id)}
          class="mt-1 text-[11px] font-bold text-blue-600 hover:text-blue-800 underline"
        >
          Drill into {activeSite.code} &rarr;
        </button>
      </div>
    {/if}
  </div>

  <!-- SVG Scatter Plot -->
  <div class="relative w-full overflow-hidden">
    <svg viewBox="0 0 {width} {height}" class="w-full h-auto select-none">
      
      <!-- Quadrant Background Tints -->
      <!-- Top-Left: High Impact, Low Volume (CRITICAL PATH BOTTLENECK) -->
      <rect
        x={padding.left}
        y={padding.top}
        width={midX - padding.left}
        height={midY - padding.top}
        fill="#ffe4e6"
        fill-opacity="0.35"
      />
      <!-- Top-Right: High Impact, High Volume -->
      <rect
        x={midX}
        y={padding.top}
        width={width - padding.right - midX}
        height={midY - padding.top}
        fill="#fef3c7"
        fill-opacity="0.25"
      />
      <!-- Bottom-Right: Low Impact, High Volume (ROUTINE VOLUME) -->
      <rect
        x={midX}
        y={midY}
        width={width - padding.right - midX}
        height={padding.top + chartH - midY}
        fill="#f8fafc"
        fill-opacity="0.8"
      />
      <!-- Bottom-Left: Low Impact, Low Volume (STABLE) -->
      <rect
        x={padding.left}
        y={midY}
        width={midX - padding.left}
        height={padding.top + chartH - midY}
        fill="#ecfdf5"
        fill-opacity="0.4"
      />

      <!-- Quadrant Watermark Labels -->
      <text
        x={padding.left + 10}
        y={padding.top + 20}
        class="text-[10px] font-bold fill-rose-700/80 uppercase tracking-wider"
      >
        Danger Zone: High Delay, Low Volume
      </text>

      <text
        x={width - padding.right - 10}
        y={padding.top + chartH - 12}
        text-anchor="end"
        class="text-[10px] font-bold fill-slate-400 uppercase tracking-wider"
      >
        Routine Volume Zone: High Volume, Low Delay
      </text>

      <text
        x={padding.left + 10}
        y={padding.top + chartH - 12}
        class="text-[10px] font-bold fill-emerald-700/70 uppercase tracking-wider"
      >
        Stable Lock Zone
      </text>

      <!-- Quadrant Divider Lines -->
      <line
        x1={midX}
        y1={padding.top}
        x2={midX}
        y2={padding.top + chartH}
        stroke="#cbd5e1"
        stroke-width="1"
        stroke-dasharray="3 3"
      />
      <line
        x1={padding.left}
        y1={midY}
        x2={width - padding.right}
        y2={midY}
        stroke="#cbd5e1"
        stroke-width="1"
        stroke-dasharray="3 3"
      />

      <!-- Y Axis Grid & Labels (Delay Days: 0 to 8) -->
      {#each [0, 2, 4, 6, 8] as delayVal}
        {@const y = getY(delayVal)}
        <line
          x1={padding.left}
          y1={y}
          x2={width - padding.right}
          y2={y}
          stroke="#f1f5f9"
          stroke-width="1"
        />
        <text
          x={padding.left - 8}
          y={y + 3.5}
          text-anchor="end"
          class="text-[9px] fill-slate-500 font-medium"
        >
          {delayVal}d
        </text>
      {/each}

      <!-- X Axis Labels (Volume: 0 to 50 items) -->
      {#each [0, 10, 20, 30, 40, 50] as volVal}
        {@const x = getX(volVal)}
        <text
          x={x}
          y={height - 25}
          text-anchor="middle"
          class="text-[9px] fill-slate-500 font-medium"
        >
          {volVal}
        </text>
      {/each}

      <!-- Axis Titles -->
      <text
        x={padding.left + chartW / 2}
        y={height - 8}
        text-anchor="middle"
        class="text-[10px] fill-slate-600 font-bold"
      >
        Open Items / Query Volume &rarr;
      </text>

      <text
        x={14}
        y={padding.top + chartH / 2}
        text-anchor="middle"
        transform="rotate(-90 14 {padding.top + chartH / 2})"
        class="text-[10px] fill-slate-600 font-bold"
      >
        &larr; Critical Path Delay (Days)
      </text>

      <!-- Site Scatter Bubbles -->
      {#each sites as site}
        {@const avgDelay = (site.minDelayDays + site.maxDelayDays) / 2}
        {@const cx = getX(site.openItems)}
        {@const cy = getY(avgDelay)}
        {@const isHovered = hoveredSiteId === site.id}
        {@const isCritical = site.priority === 'Critical'}
        {@const isHigh = site.priority === 'High'}

        <g
          role="button"
          tabindex="0"
          aria-label="{site.code}: {site.openItems} items, {site.forecastImpactDays} delay"
          class="cursor-pointer transition-all outline-hidden"
          on:mouseenter={() => hoveredSiteId = site.id}
          on:click={() => onSelectSite(site.id)}
          on:keydown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelectSite(site.id); } }}
        >
          <!-- Pulsing halo for Site 104 -->
          {#if site.id === '104'}
            <circle
              {cx}
              {cy}
              r="18"
              fill="#f43f5e"
              opacity="0.2"
              class="animate-pulse"
            />
          {/if}

          <!-- Outer Bubble -->
          <circle
            {cx}
            {cy}
            r={isHovered ? 14 : isCritical ? 11 : isHigh ? 9 : 7}
            fill={isCritical ? '#e11d48' : isHigh ? '#f59e0b' : site.openItems > 30 ? '#3b82f6' : '#10b981'}
            stroke="#ffffff"
            stroke-width="2"
            class="shadow-sm transition-all duration-150"
          />

          <!-- Label beside bubble -->
          <text
            x={cx + (site.openItems > 35 ? -14 : 14)}
            y={cy + 3.5}
            text-anchor={site.openItems > 35 ? 'end' : 'start'}
            class="text-[10px] font-extrabold {isCritical ? 'fill-rose-700' : isHovered ? 'fill-slate-900' : 'fill-slate-700'}"
          >
            {site.code} ({site.forecastImpactDays})
          </text>
        </g>
      {/each}

    </svg>
  </div>

  <!-- Non-Technical Callout Footer -->
  <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 text-xs">
    <div class="p-3 rounded-lg bg-rose-50/70 border border-rose-200 space-y-1">
      <div class="font-bold text-rose-900 flex items-center">
        <span class="w-2 h-2 rounded-full bg-rose-600 mr-1.5"></span>
        <span>Site 104 &middot; 19 queries &middot; 5–7 Days Delay</span>
      </div>
      <p class="text-[11px] text-rose-800">
        Low issue count, but high danger: 2 SAE discrepancies on the primary safety critical path.
      </p>
    </div>

    <div class="p-3 rounded-lg bg-blue-50/70 border border-blue-200 space-y-1">
      <div class="font-bold text-blue-900 flex items-center">
        <span class="w-2 h-2 rounded-full bg-blue-600 mr-1.5"></span>
        <span>Site 208 &middot; 41 queries &middot; 1–2 Days Delay</span>
      </div>
      <p class="text-[11px] text-blue-800">
        High issue volume, but safe: Routine concomitant medication spelling checks that resolve quickly.
      </p>
    </div>
  </div>

</div>
