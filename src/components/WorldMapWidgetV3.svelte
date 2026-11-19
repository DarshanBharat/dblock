<script lang="ts">
  import { V3_COUNTRY_SUMMARY } from '../data/v3Data';

  export let onSelectCountry: (country: string) => void = () => {};

  type CountrySummary = (typeof V3_COUNTRY_SUMMARY)[number];

  let hoveredCountry: CountrySummary | null = null;

  // Map projection: equirectangular cropped to [-180..180] lon, [82..-58] lat -> 800x360
  const W = 800;
  const H = 360;

  function projX(lon: number): number {
    return ((lon + 180) / 360) * W;
  }

  function projY(lat: number): number {
    return ((82 - lat) / 140) * H;
  }

  function getCountryStatus(c: CountrySummary): 'High risk' | 'At risk' | 'On track' {
    if (c.highRiskSites > 0 && c.readiness < 70) return 'High risk';
    if (c.highRiskSites > 0 || c.atRiskSites > 0) return 'At risk';
    return 'On track';
  }

  function pinColors(status: 'High risk' | 'At risk' | 'On track') {
    if (status === 'High risk') {
      return {
        fill: '#e11d48',
        stroke: '#fff1f2',
        ring: '#fda4af',
        badgeBg: 'bg-rose-50 text-rose-700 border-rose-200',
      };
    }
    if (status === 'At risk') {
      return {
        fill: '#d97706',
        stroke: '#fffbeb',
        ring: '#fcd34d',
        badgeBg: 'bg-amber-50 text-amber-700 border-amber-200',
      };
    }
    return {
      fill: '#059669',
      stroke: '#ecfdf5',
      ring: '#6ee7b7',
      badgeBg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    };
  }

  // Subtle label offsets so nearby European pins (Spain, France, Germany) never overlap
  const labelOffset: Record<string, { dx: number; dy: number; anchor: 'start' | 'middle' | 'end' }> = {
    'United States': { dx: 0, dy: 16, anchor: 'middle' },
    'Canada': { dx: 0, dy: -12, anchor: 'middle' },
    'Spain': { dx: -12, dy: 14, anchor: 'end' },
    'France': { dx: -10, dy: -10, anchor: 'end' },
    'Germany': { dx: 12, dy: -8, anchor: 'start' },
    'South Korea': { dx: -10, dy: -10, anchor: 'end' },
    'Australia': { dx: 0, dy: 16, anchor: 'middle' },
  };

  const shortCode: Record<string, string> = {
    'United States': 'US',
    'Canada': 'CA',
    'Spain': 'ES',
    'France': 'FR',
    'Germany': 'DE',
    'South Korea': 'KR',
    'Australia': 'AU',
  };

  $: totalSites = V3_COUNTRY_SUMMARY.reduce((s, c) => s + c.sites, 0);
</script>

<div class="relative w-full h-full min-h-[280px] bg-gradient-to-b from-slate-50 to-slate-100/80 rounded-lg border border-slate-200/90 overflow-hidden select-none flex flex-col justify-between">
  <!-- Top-left Summary Pill -->
  <div class="absolute top-2.5 left-2.5 z-10 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/90 backdrop-blur-xs border border-slate-200/80 shadow-2xs text-[11px] font-semibold text-slate-700">
    <span class="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
    <span>{V3_COUNTRY_SUMMARY.length} Countries · {totalSites} Sites</span>
  </div>

  <!-- SVG World Map -->
  <svg
    viewBox="0 0 {W} {H}"
    class="w-full h-full block"
    preserveAspectRatio="xMidYMid meet"
    role="img"
    aria-label="Global site readiness map"
  >
    <!-- Subtle Graticule Lines -->
    <g stroke="#e2e8f0" stroke-width="0.7" stroke-dasharray="3 3">
      <line x1="0" y1={projY(60)} x2={W} y2={projY(60)} />
      <line x1="0" y1={projY(30)} x2={W} y2={projY(30)} />
      <line x1="0" y1={projY(0)} x2={W} y2={projY(0)} />
      <line x1="0" y1={projY(-30)} x2={W} y2={projY(-30)} />
      <line x1={projX(-120)} y1="0" x2={projX(-120)} y2={H} />
      <line x1={projX(-60)} y1="0" x2={projX(-60)} y2={H} />
      <line x1={projX(0)} y1="0" x2={projX(0)} y2={H} />
      <line x1={projX(60)} y1="0" x2={projX(60)} y2={H} />
      <line x1={projX(120)} y1="0" x2={projX(120)} y2={H} />
    </g>

    <!-- Continent Silhouettes -->
    <g fill="#dbe4ee" stroke="#cbd5e1" stroke-width="1" stroke-linejoin="round">
      <!-- North America -->
      <path d="M 31 44 L 65 34 L 100 31 L 148 28 L 200 51 L 245 58 L 276 77 L 251 95 L 222 147 L 208 134 L 184 144 L 200 172 L 227 190 L 214 192 L 186 168 L 156 152 L 146 132 L 124 108 L 122 85 L 92 66 L 52 58 Z" />
      <!-- Greenland -->
      <path d="M 284 57 L 328 42 L 356 15 L 300 3 L 249 15 L 265 40 Z" />
      <!-- South America -->
      <path d="M 227 190 L 262 185 L 298 205 L 322 226 L 316 254 L 304 270 L 278 308 L 249 352 L 236 319 L 234 272 L 220 224 Z" />
      <!-- Europe + Asia -->
      <path d="M 380 116 L 380 100 L 391 87 L 404 79 L 418 72 L 411 57 L 440 31 L 467 31 L 533 31 L 633 15 L 735 28 L 789 41 L 760 77 L 732 82 L 705 94 L 687 121 L 680 113 L 671 131 L 653 154 L 640 180 L 629 206 L 616 170 L 596 154 L 571 190 L 551 152 L 533 154 L 498 177 L 478 136 L 462 105 L 451 113 L 440 108 L 427 98 L 414 104 L 407 103 L 394 116 Z" />
      <!-- United Kingdom & Ireland -->
      <path d="M 387 62 L 398 64 L 402 80 L 389 82 Z" />
      <!-- Africa -->
      <path d="M 387 118 L 422 116 L 471 131 L 492 162 L 513 180 L 489 216 L 478 260 L 462 296 L 440 298 L 427 249 L 420 211 L 396 202 L 368 188 L 362 172 L 367 139 Z" />
      <!-- Madagascar -->
      <path d="M 498 250 L 508 248 L 504 280 L 494 278 Z" />
      <!-- Japan -->
      <path d="M 691 129 L 709 105 L 722 98 L 713 113 L 700 129 Z" />
      <!-- Indonesia / SE Islands -->
      <path d="M 622 214 L 654 218 L 664 226 L 632 224 Z" />
      <!-- Australia -->
      <path d="M 653 267 L 689 242 L 716 239 L 740 283 L 727 309 L 702 301 L 672 298 L 656 298 Z" />
      <!-- New Zealand -->
      <path d="M 762 302 L 772 296 L 766 322 L 756 320 Z" />
    </g>

    <!-- Country Pins -->
    {#each V3_COUNTRY_SUMMARY as c}
      {@const cx = projX(c.lon)}
      {@const cy = projY(c.lat)}
      {@const status = getCountryStatus(c)}
      {@const colors = pinColors(status)}
      {@const off = labelOffset[c.country] || { dx: 0, dy: 16, anchor: 'middle' }}
      {@const isHovered = hoveredCountry?.country === c.country}
      <!-- svelte-ignore a11y_click_events_have_key_events -->
      <!-- svelte-ignore a11y_no_static_element_interactions -->
      <g
        class="cursor-pointer transition-transform"
        on:mouseenter={() => (hoveredCountry = c)}
        on:mouseleave={() => (hoveredCountry = null)}
        on:click={() => onSelectCountry(c.country)}
      >
        <!-- Pulse ring for High-risk countries -->
        {#if status === 'High risk'}
          <circle cx={cx} cy={cy} r="13" fill={colors.ring} opacity="0.35">
            <animate attributeName="r" values="8;16;8" dur="2.2s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.5;0.1;0.5" dur="2.2s" repeatCount="indefinite" />
          </circle>
        {/if}

        <!-- Outer halo on hover -->
        <circle
          cx={cx}
          cy={cy}
          r={isHovered ? 11 : 8.5}
          fill={colors.ring}
          opacity={isHovered ? 0.55 : 0.3}
        />

        <!-- Main Pin -->
        <circle
          cx={cx}
          cy={cy}
          r={isHovered ? 6.5 : 5.5}
          fill={colors.fill}
          stroke={colors.stroke}
          stroke-width="1.8"
        />

        <!-- Compact Country + Readiness Tag -->
        <text
          x={cx + off.dx}
          y={cy + off.dy}
          text-anchor={off.anchor}
          font-size="9.5"
          font-weight="700"
          fill="#1e293b"
          stroke="#ffffff"
          stroke-width="2.5"
          paint-order="stroke"
        >
          {shortCode[c.country] || c.country} {c.readiness}%
        </text>
      </g>
    {/each}
  </svg>

  <!-- Hover Tooltip -->
  {#if hoveredCountry}
    {@const hStatus = getCountryStatus(hoveredCountry)}
    {@const hColors = pinColors(hStatus)}
    <div class="absolute top-2.5 right-2.5 z-20 w-56 rounded-lg bg-white/95 backdrop-blur-xs border border-slate-200 shadow-md p-2.5 text-[11px] pointer-events-none">
      <div class="flex items-center justify-between gap-2 pb-1.5 border-b border-slate-100">
        <span class="font-bold text-slate-900">{hoveredCountry.flag} {hoveredCountry.country}</span>
        <span class="px-1.5 py-0.5 rounded-full border text-[10px] font-semibold {hColors.badgeBg}">
          {hStatus}
        </span>
      </div>
      <div class="grid grid-cols-2 gap-y-1 gap-x-2 mt-1.5 text-slate-600">
        <div>Sites: <span class="font-bold text-slate-900">{hoveredCountry.sites}</span></div>
        <div>Readiness: <span class="font-bold text-slate-900">{hoveredCountry.readiness}%</span></div>
        <div>High-Risk: <span class="font-bold {hoveredCountry.highRiskSites > 0 ? 'text-rose-600' : 'text-slate-700'}">{hoveredCountry.highRiskSites}</span></div>
        <div>DBL Impact: <span class="font-bold {hoveredCountry.forecastDays > 0 ? 'text-rose-600' : 'text-emerald-600'}">{hoveredCountry.forecastDays > 0 ? `+${hoveredCountry.forecastDays}d` : '0d'}</span></div>
      </div>
      <div class="mt-1.5 text-[10px] text-slate-500 truncate">
        Driver: <span class="font-medium text-slate-700">{hoveredCountry.driver}</span>
      </div>
      <div class="mt-1 text-[10px] font-semibold text-blue-600">Click pin to filter sites →</div>
    </div>
  {/if}

  <!-- Bottom Legend -->
  <div class="absolute bottom-2 left-2.5 z-10 flex items-center gap-3 px-2.5 py-1 rounded-md bg-white/90 backdrop-blur-xs border border-slate-200/80 text-[10px] font-medium text-slate-600">
    <span class="inline-flex items-center gap-1"><span class="w-2 h-2 rounded-full bg-emerald-600"></span> On track</span>
    <span class="inline-flex items-center gap-1"><span class="w-2 h-2 rounded-full bg-amber-600"></span> At risk</span>
    <span class="inline-flex items-center gap-1"><span class="w-2 h-2 rounded-full bg-rose-600"></span> High risk</span>
  </div>
</div>
