<script lang="ts">
  import {
    ArrowLeft,
    Search,
    RotateCcw,
    ChevronRight,
    ChevronLeft,
    SlidersHorizontal,
    Info,
    Download,
    MapPin,
    BarChart3,
    Server,
    ArrowUpDown,
    ArrowUp,
    ArrowDown,
    X,
    ShieldAlert,
    AlertTriangle,
    Clock,
    CheckCircle2,
    Filter,
  } from '@lucide/svelte';
  import { V3_STUDY_META, V3_COUNTRY_SUMMARY, V3_SITES, type V3SiteSpec } from '../data/v3Data';
  import WorldMapWidgetV3 from './WorldMapWidgetV3.svelte';

  export let countryFilter = 'all';
  export let onSelectTab: (tab: string) => void;
  export let onSelectSite: (siteId: string) => void;

  type VisualTab = 'map' | 'quadrant' | 'vendors';
  type SortCol =
    | 'id'
    | 'name'
    | 'country'
    | 'enrolled'
    | 'readiness'
    | 'riskLevel'
    | 'dblImpactDays'
    | 'lastActivity'
    | 'estReadyDate';
  type SortDir = 'asc' | 'desc';

  let visualTab: VisualTab = 'map';
  let regionFilter = 'all';
  let riskFilter = 'all';
  let readinessBand: 'all' | 'under50' | '50to69' | '70to89' | '90plus' = 'all';
  let domainDriverFilter = 'all';
  let quickFilter: 'all' | 'dbl_delay' | 'hard_gates' | 'low_readiness' = 'all';
  let searchQuery = '';
  let sortCol: SortCol = 'dblImpactDays';
  let sortDir: SortDir = 'desc';
  let currentPage = 1;
  let pageSize = 10;

  let showMethodologyModal = false;
  let hoveredDistIdx: number | null = null;
  let hoveredQuadrantId: string | null = '104';
  let quickDrawerSite: V3SiteSpec | null = null;
  let selectedVendorId = 'VND-LABCORP';

  const COUNTRY_REGION: Record<string, string> = {
    'United States': 'North America',
    Canada: 'North America',
    Germany: 'Europe',
    France: 'Europe',
    Spain: 'Europe',
    'South Korea': 'Asia-Pacific',
    Australia: 'Asia-Pacific',
  };

  // V2 Automated Vendor Feeds affecting Sites
  const VENDOR_FEEDS = [
    {
      id: 'VND-LABCORP',
      name: 'LabCorp Bioanalytical (Central Lab)',
      feedType: 'SFTP + HL7/FHIR · SDTM.LB',
      status: 'Late Transfer (+4d)',
      tone: 'rose',
      score: 64,
      affectedSites: ['104', '317'],
      summary: 'ctDNA NGS batch #LXB-8921 overdue by 4 days; 48 sample records pending checksum.',
      lastSync: '31 Oct 2026, 08:00 UTC',
    },
    {
      id: 'VND-BIOCLINICA',
      name: 'BioClinica Central Imaging (BICR)',
      feedType: 'DICOM Portal API · SDTM.TU/TR',
      status: 'Adjudication Pending',
      tone: 'amber',
      score: 82,
      affectedSites: ['405', '455', '317'],
      summary: '5 RECIST 1.1 target lesion tie-breaker reads & 4 Week-24 scans pending central read.',
      lastSync: '31 Oct 2026, 07:30 UTC',
    },
    {
      id: 'VND-ARGUS',
      name: 'Oracle Argus Safety (PV Gateway)',
      feedType: 'E2B(R3) Gateway · SDTM.AE/CE',
      status: '2 Critical Mismatches',
      tone: 'rose',
      score: 80,
      affectedSites: ['317', '405', '104'],
      summary: 'SAE outcome (Site 317) & seriousness (Site 405) discrepancies blocking freeze.',
      lastSync: '31 Oct 2026, 07:45 UTC',
    },
    {
      id: 'VND-SIGNANT',
      name: 'Signant Health (eCOA / ePRO)',
      feedType: 'Cloud Sync API · SDTM.QS',
      status: 'Sync Lag (KR)',
      tone: 'amber',
      score: 88,
      affectedSites: ['405', '233'],
      summary: '136 Day-180 & EOS assessments pending sync at Site 405 (Seoul).',
      lastSync: '31 Oct 2026, 06:30 UTC',
    },
  ];

  $: activeVendor = VENDOR_FEEDS.find((v) => v.id === selectedVendorId) || VENDOR_FEEDS[0];

  function getSiteDriverTags(s: V3SiteSpec): string[] {
    const txt = `${s.primaryDriver} ${s.riskDrivers.map((d) => d.title + ' ' + d.detail).join(' ')}`.toLowerCase();
    const tags: string[] = [];
    if (txt.includes('lab')) tags.push('lab');
    if (txt.includes('sae') || txt.includes('safety')) tags.push('safety');
    if (txt.includes('quer')) tags.push('queries');
    if (txt.includes('signature') || txt.includes('pi ')) tags.push('pi_sig');
    if (txt.includes('imaging') || txt.includes('ecoa') || txt.includes('sdv')) tags.push('imaging_sdv');
    return tags;
  }

  function getSiteQueryBreakdown(s: V3SiteSpec) {
    if (s.id === '104') return { total: 14, endpointCritical: 6, routine: 8 };
    if (s.id === '317') return { total: 12, endpointCritical: 10, routine: 2 };
    if (s.id === '405') return { total: 9, endpointCritical: 4, routine: 5 };
    if (s.id === '208') return { total: 18, endpointCritical: 2, routine: 16 };
    if (s.id === '344') return { total: 8, endpointCritical: 2, routine: 6 };
    return {
      total: Math.max(1, s.criticalSubjects * 2 + (s.readiness < 85 ? 4 : 1)),
      endpointCritical: s.criticalSubjects,
      routine: Math.max(1, s.criticalSubjects + (s.readiness < 85 ? 4 : 1)),
    };
  }

  function toggleSort(col: SortCol) {
    if (sortCol === col) {
      sortDir = sortDir === 'asc' ? 'desc' : 'asc';
    } else {
      sortCol = col;
      sortDir = ['dblImpactDays', 'enrolled', 'riskLevel'].includes(col) ? 'desc' : 'asc';
    }
    currentPage = 1;
  }

  // Ranked by DBL impact first (per PDF page 6 & 22), not readiness % alone
  const normalizedSites = [...V3_SITES].sort(
    (a, b) =>
      b.dblImpactDays - a.dblImpactDays ||
      b.hardGateBlockers - a.hardGateBlockers ||
      b.criticalSubjects - a.criticalSubjects ||
      a.readiness - b.readiness
  );

  // Live summary metrics from V3_SITES
  $: totalSitesCount = normalizedSites.length;
  $: onTrackCount = normalizedSites.filter((s) => s.riskLevel === 'On track').length;
  $: atRiskCount = normalizedSites.filter((s) => s.riskLevel === 'At risk').length;
  $: highRiskCount = normalizedSites.filter((s) => s.riskLevel === 'High risk').length;
  $: totalEnrolledCount = normalizedSites.reduce((sum, s) => sum + s.enrolled, 0);
  $: totalNotLockReady = V3_COUNTRY_SUMMARY.reduce((sum, c) => sum + c.subjectsNotReady, 0);

  $: filteredSites = normalizedSites
    .filter((s) => {
      const q = searchQuery.trim().toLowerCase();
      const matchSearch =
        !q ||
        s.id.toLowerCase().includes(q) ||
        s.name.toLowerCase().includes(q) ||
        s.country.toLowerCase().includes(q) ||
        s.piName.toLowerCase().includes(q) ||
        s.primaryDriver.toLowerCase().includes(q);
      const matchRegion = regionFilter === 'all' || COUNTRY_REGION[s.country] === regionFilter;
      const matchCountry = countryFilter === 'all' || s.country === countryFilter;
      const matchRisk = riskFilter === 'all' || s.riskLevel === riskFilter;
      const matchBand =
        readinessBand === 'all' ||
        (readinessBand === 'under50' && s.readiness < 50) ||
        (readinessBand === '50to69' && s.readiness >= 50 && s.readiness < 70) ||
        (readinessBand === '70to89' && s.readiness >= 70 && s.readiness < 90) ||
        (readinessBand === '90plus' && s.readiness >= 90);
      const matchDriver =
        domainDriverFilter === 'all' || getSiteDriverTags(s).includes(domainDriverFilter);
      const matchQuick =
        quickFilter === 'all' ||
        (quickFilter === 'dbl_delay' && s.dblImpactDays > 0) ||
        (quickFilter === 'hard_gates' && s.hardGateBlockers > 0) ||
        (quickFilter === 'low_readiness' && s.readiness < 75);
      return matchSearch && matchRegion && matchCountry && matchRisk && matchBand && matchDriver && matchQuick;
    })
    .sort((a, b) => {
      const dir = sortDir === 'asc' ? 1 : -1;
      const riskRank: Record<string, number> = { 'High risk': 3, 'At risk': 2, 'On track': 1 };
      let cmp = 0;
      switch (sortCol) {
        case 'id':
          cmp = a.id.localeCompare(b.id, undefined, { numeric: true });
          break;
        case 'name':
          cmp = a.name.localeCompare(b.name);
          break;
        case 'country':
          cmp = a.country.localeCompare(b.country);
          break;
        case 'enrolled':
          cmp = a.enrolled - b.enrolled;
          break;
        case 'readiness':
          cmp = a.readiness - b.readiness;
          break;
        case 'riskLevel':
          cmp = (riskRank[a.riskLevel] || 0) - (riskRank[b.riskLevel] || 0);
          break;
        case 'lastActivity':
          cmp = a.lastActivity.localeCompare(b.lastActivity);
          break;
        case 'estReadyDate':
          cmp = a.estReadyDate.localeCompare(b.estReadyDate);
          break;
        case 'dblImpactDays':
        default:
          cmp = a.dblImpactDays - b.dblImpactDays || a.hardGateBlockers - b.hardGateBlockers;
          break;
      }
      return cmp !== 0 ? cmp * dir : b.dblImpactDays - a.dblImpactDays || a.readiness - b.readiness;
    });

  $: totalPages = Math.max(1, Math.ceil(filteredSites.length / pageSize));
  $: if (currentPage > totalPages) currentPage = 1;
  $: pagedSites = filteredSites.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  $: activeFilterCount =
    (regionFilter !== 'all' ? 1 : 0) +
    (countryFilter !== 'all' ? 1 : 0) +
    (riskFilter !== 'all' ? 1 : 0) +
    (readinessBand !== 'all' ? 1 : 0) +
    (domainDriverFilter !== 'all' ? 1 : 0) +
    (quickFilter !== 'all' ? 1 : 0) +
    (searchQuery.trim() ? 1 : 0);

  function resetAllFilters() {
    regionFilter = 'all';
    countryFilter = 'all';
    riskFilter = 'all';
    readinessBand = 'all';
    domainDriverFilter = 'all';
    quickFilter = 'all';
    searchQuery = '';
    sortCol = 'dblImpactDays';
    sortDir = 'desc';
    currentPage = 1;
  }

  $: distBuckets = [
    {
      key: '90plus' as const,
      label: '≥ 90%',
      sub: 'Highly Ready',
      count: normalizedSites.filter((s) => s.readiness >= 90).length,
      color: '#10b981',
    },
    {
      key: '70to89' as const,
      label: '70–89%',
      sub: 'Monitor',
      count: normalizedSites.filter((s) => s.readiness >= 70 && s.readiness < 90).length,
      color: '#f59e0b',
    },
    {
      key: '50to69' as const,
      label: '50–69%',
      sub: 'At Risk',
      count: normalizedSites.filter((s) => s.readiness >= 50 && s.readiness < 70).length,
      color: '#f97316',
    },
    {
      key: 'under50' as const,
      label: '< 50%',
      sub: 'High Risk',
      count: normalizedSites.filter((s) => s.readiness < 50).length,
      color: '#ef4444',
    },
  ];

  $: maxBucket = Math.max(1, ...distBuckets.map((b) => b.count));

  // Risk Quadrant geometry (Volume/Critical Subjects vs DBL Delay)
  const QW = 480;
  const QH = 215;
  const QP = { top: 20, right: 20, bottom: 32, left: 38 };
  const QCW = QW - QP.left - QP.right;
  const QCH = QH - QP.top - QP.bottom;
  const qx = (vol: number) => QP.left + (Math.min(vol, 24) / 24) * QCW;
  const qy = (days: number) => QP.top + QCH - (Math.min(days, 4) / 4) * QCH;
  const qMidX = qx(12);
  const qMidY = qy(1.5);
  $: hoveredQuadrantSite = normalizedSites.find((s) => s.id === hoveredQuadrantId) || normalizedSites[0];

  function exportCsv() {
    const header = ['Site ID', 'Site Name', 'Country', 'PI', 'Completed', 'Enrolled', 'Readiness %', '7d Trend', 'Risk Level', 'Hard Gates', 'DBL Impact (d)', 'Primary Driver', 'Est Ready'];
    const rows = filteredSites.map((s) => [
      s.id,
      `"${s.name}"`,
      s.country,
      `"${s.piName}"`,
      s.completed,
      s.enrolled,
      s.readiness,
      s.trend7d,
      s.riskLevel,
      s.hardGateBlockers,
      s.dblImpactDays,
      `"${s.primaryDriver}"`,
      s.estReadyDate,
    ]);
    const csv = [header.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${V3_STUDY_META.protocol}_sites_countries.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function riskBadge(risk: string): string {
    if (risk === 'On track') return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    if (risk === 'High risk') return 'bg-rose-50 text-rose-700 border-rose-200';
    return 'bg-amber-50 text-amber-700 border-amber-200';
  }

  function dotColor(risk: string): string {
    if (risk === 'On track') return 'bg-emerald-500';
    if (risk === 'High risk') return 'bg-rose-500';
    return 'bg-amber-500';
  }
</script>

<div class="flex flex-col gap-2.5 lg:h-[calc(100vh-77px)] lg:overflow-hidden">
  <!-- Frozen Top Header -->
  <div class="shrink-0 bg-white rounded-xl border border-slate-200/80 px-3.5 py-2.5 shadow-xs flex flex-wrap items-center justify-between gap-2.5">
    <div>
      <button
        type="button"
        on:click={() => onSelectTab('command_centre')}
        class="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 hover:text-blue-600 mb-0.5 cursor-pointer"
      >
        <ArrowLeft size={12} /> Back to Study Overview
      </button>
      <div class="flex flex-wrap items-center gap-2">
        <h1 class="text-base font-bold text-slate-900 leading-tight">
          {V3_STUDY_META.protocol} <span class="text-slate-300 font-normal">|</span> Sites &amp; Countries
        </h1>
        <span class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
          <span class="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
          At Risk
        </span>
      </div>
      <p class="text-[11px] text-slate-500 mt-0.5">{V3_STUDY_META.title}</p>
    </div>

    <div class="flex flex-col items-end gap-1 text-right text-xs">
      <div class="flex items-center gap-2">
        <button
          type="button"
          on:click={() => (showMethodologyModal = !showMethodologyModal)}
          class="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 hover:text-blue-700 border border-slate-200 rounded-lg px-2 py-0.5 bg-slate-50/70 hover:bg-blue-50 cursor-pointer transition-colors"
        >
          <Info size={11} /> View Site Risk Methodology
        </button>
      </div>
      <div class="text-[11px]">
        Target DBL: <span class="font-semibold text-slate-800">{V3_STUDY_META.targetDbl}</span>
        <span class="mx-1.5 text-slate-300">|</span>
        Predicted DBL: <span class="font-bold text-rose-600">{V3_STUDY_META.predictedDbl} (+{V3_STUDY_META.delayDays}d)</span>
        <span class="mx-1.5 text-slate-300">|</span>
        <span class="text-[10px] text-slate-400">Last refreshed: {V3_STUDY_META.lastRefreshed}</span>
      </div>
    </div>
  </div>

  {#if showMethodologyModal}
    <div class="shrink-0 bg-blue-50/80 border border-blue-200 rounded-xl px-3.5 py-2.5 text-[11px] text-slate-700 flex flex-wrap items-center justify-between gap-2">
      <div class="space-y-0.5">
        <div class="font-bold text-blue-950">Hierarchical Site Readiness &amp; Hard-Gate Cap Methodology</div>
        <div>
          <strong>Site Readiness</strong> = 70% Subject Readiness (lock-population weighted) + 20% Site-Level Reconciliation/Monitoring + 10% Closure Readiness.
          <strong>Ranking:</strong> Sites are ranked by <em>DBL Impact Days → Hard-Gate Blockers → Critical Subjects</em> rather than readiness % alone.
        </div>
      </div>
      <button type="button" on:click={() => (showMethodologyModal = false)} class="p-1 text-slate-500 hover:text-slate-800 cursor-pointer">
        <X size={14} />
      </button>
    </div>
  {/if}

  <!-- Frozen Fitted Sidebar + Scrollable Right Workspace -->
  <div class="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-2.5 lg:overflow-hidden">
    <!-- Frozen Fitted Filter Sidebar -->
    <aside class="lg:col-span-3 lg:h-full lg:overflow-y-auto bg-white rounded-xl border border-slate-200/80 p-2.5 shadow-xs space-y-2.5">
      <div class="flex items-center justify-between pb-1.5 border-b border-slate-100">
        <div class="flex items-center gap-1.5">
          <SlidersHorizontal size={12} class="text-slate-500" />
          <h2 class="text-[11px] font-bold text-slate-900 uppercase tracking-wider">Filters</h2>
          {#if activeFilterCount > 0}
            <span class="px-1.5 py-0.2 rounded-full bg-blue-600 text-white text-[10px] font-bold">{activeFilterCount}</span>
          {/if}
        </div>
        <button
          type="button"
          on:click={resetAllFilters}
          class="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:underline cursor-pointer"
        >
          <RotateCcw size={10} /> Reset
        </button>
      </div>

      <div>
        <label for="sc-search" class="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Search Site / PI / Driver</label>
        <div class="relative">
          <Search size={12} class="absolute left-2.5 top-2 text-slate-400" />
          <input
            id="sc-search"
            type="text"
            bind:value={searchQuery}
            on:input={() => (currentPage = 1)}
            placeholder="e.g. 104, 317, Boston..."
            class="w-full pl-7 pr-6 py-1 text-xs border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:outline-hidden focus:border-blue-500"
          />
          {#if searchQuery}
            <button type="button" on:click={() => { searchQuery = ''; currentPage = 1; }} class="absolute right-2 top-2 text-slate-400 hover:text-slate-600 cursor-pointer">
              <X size={11} />
            </button>
          {/if}
        </div>
      </div>

      <div class="grid grid-cols-1 gap-2">
        <div>
          <label for="sc-region" class="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">Region</label>
          <select id="sc-region" bind:value={regionFilter} on:change={() => { countryFilter = 'all'; currentPage = 1; }} class="w-full text-xs border border-slate-200 rounded-lg px-2 py-1 bg-white">
            <option value="all">All Regions (3)</option>
            <option value="North America">North America</option>
            <option value="Europe">Europe</option>
            <option value="Asia-Pacific">Asia-Pacific</option>
          </select>
        </div>

        <div>
          <label for="sc-country" class="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">Country</label>
          <select id="sc-country" bind:value={countryFilter} on:change={() => (currentPage = 1)} class="w-full text-xs border border-slate-200 rounded-lg px-2 py-1 bg-white">
            <option value="all">All Countries ({V3_COUNTRY_SUMMARY.length})</option>
            {#each V3_COUNTRY_SUMMARY as c}
              <option value={c.country}>{c.flag} {c.country} ({c.sites})</option>
            {/each}
          </select>
        </div>

        <div>
          <label for="sc-risk" class="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">Site Status</label>
          <select id="sc-risk" bind:value={riskFilter} on:change={() => (currentPage = 1)} class="w-full text-xs border border-slate-200 rounded-lg px-2 py-1 bg-white">
            <option value="all">All Statuses</option>
            <option value="High risk">High risk ({highRiskCount})</option>
            <option value="At risk">At risk ({atRiskCount})</option>
            <option value="On track">On track ({onTrackCount})</option>
          </select>
        </div>

        <div>
          <label for="sc-band" class="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">Readiness Band</label>
          <select id="sc-band" bind:value={readinessBand} on:change={() => (currentPage = 1)} class="w-full text-xs border border-slate-200 rounded-lg px-2 py-1 bg-white">
            <option value="all">All Readiness Levels</option>
            <option value="under50">&lt; 50% (High Risk)</option>
            <option value="50to69">50% – 69% (At Risk)</option>
            <option value="70to89">70% – 89% (Monitor)</option>
            <option value="90plus">≥ 90% (Highly Ready)</option>
          </select>
        </div>

        <div>
          <label for="sc-driver" class="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">Clinical Domain (Impact Driver)</label>
          <select id="sc-driver" bind:value={domainDriverFilter} on:change={() => (currentPage = 1)} class="w-full text-xs border border-slate-200 rounded-lg px-2 py-1 bg-white">
            <option value="all">All Domains</option>
            <option value="lab">External Lab Reconciliation</option>
            <option value="safety">Safety / SAE Discrepancies</option>
            <option value="queries">Critical Queries</option>
            <option value="pi_sig">PI Signatures</option>
            <option value="imaging_sdv">Imaging / eCOA / SDV</option>
          </select>
        </div>
      </div>

      <!-- Quick Filters -->
      <div class="pt-1.5 border-t border-slate-100 space-y-1.5">
        <div class="text-[10px] font-bold uppercase tracking-wider text-slate-400">Quick Filters</div>
        <div class="flex flex-wrap gap-1">
          {#each [
            { id: 'all', label: `All (${totalSitesCount})` },
            { id: 'dbl_delay', label: `DBL Delay (${normalizedSites.filter((s) => s.dblImpactDays > 0).length})` },
            { id: 'hard_gates', label: `Hard Gates (${normalizedSites.filter((s) => s.hardGateBlockers > 0).length})` },
            { id: 'low_readiness', label: `< 75% (${normalizedSites.filter((s) => s.readiness < 75).length})` },
          ] as qf}
            <button
              type="button"
              on:click={() => { quickFilter = qf.id as any; currentPage = 1; }}
              class="px-2 py-0.5 rounded-md text-[11px] font-medium border transition-colors cursor-pointer {quickFilter === qf.id ? 'bg-blue-50 border-blue-300 text-blue-700 font-semibold' : 'bg-slate-50 border-slate-200/80 text-slate-600 hover:bg-slate-100'}"
            >
              {qf.label}
            </button>
          {/each}
        </div>
      </div>
    </aside>

    <!-- Scrollable Right Content -->
    <div class="lg:col-span-9 lg:h-full lg:overflow-y-auto lg:pr-0.5 space-y-2.5">
      <!-- 6 KPI Strip (Dynamic & Compact per PDF Page 37) -->
      <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
        <div class="bg-white rounded-xl border border-slate-200/80 p-2.5 shadow-xs">
          <div class="text-[10px] font-medium text-slate-500">Total Sites</div>
          <div class="mt-0.5 flex items-baseline gap-1.5">
            <span class="text-xl font-bold text-slate-900">{totalSitesCount}</span>
            <span class="text-[10px] text-slate-400">{V3_COUNTRY_SUMMARY.length} countries</span>
          </div>
        </div>
        <button
          type="button"
          on:click={() => { riskFilter = riskFilter === 'On track' ? 'all' : 'On track'; currentPage = 1; }}
          class="text-left bg-white rounded-xl border p-2.5 shadow-xs transition-colors cursor-pointer {riskFilter === 'On track' ? 'border-emerald-400 ring-1 ring-emerald-200' : 'border-slate-200/80 hover:border-emerald-300'}"
        >
          <div class="text-[10px] font-medium text-slate-500">Sites On Track</div>
          <div class="mt-0.5 flex items-baseline gap-1.5">
            <span class="text-xl font-bold text-slate-900">{onTrackCount}</span>
            <span class="text-[11px] font-semibold text-emerald-600">{Math.round((onTrackCount / totalSitesCount) * 100)}%</span>
          </div>
        </button>
        <button
          type="button"
          on:click={() => { riskFilter = riskFilter === 'At risk' ? 'all' : 'At risk'; currentPage = 1; }}
          class="text-left bg-white rounded-xl border p-2.5 shadow-xs transition-colors cursor-pointer {riskFilter === 'At risk' ? 'border-amber-400 ring-1 ring-amber-200' : 'border-slate-200/80 hover:border-amber-300'}"
        >
          <div class="text-[10px] font-medium text-slate-500">At Risk Sites</div>
          <div class="mt-0.5 flex items-baseline gap-1.5">
            <span class="text-xl font-bold text-slate-900">{atRiskCount}</span>
            <span class="text-[11px] font-semibold text-amber-600">{Math.round((atRiskCount / totalSitesCount) * 100)}%</span>
          </div>
        </button>
        <button
          type="button"
          on:click={() => { riskFilter = riskFilter === 'High risk' ? 'all' : 'High risk'; currentPage = 1; }}
          class="text-left bg-white rounded-xl border p-2.5 shadow-xs transition-colors cursor-pointer {riskFilter === 'High risk' ? 'border-rose-400 ring-1 ring-rose-200' : 'border-slate-200/80 hover:border-rose-300'}"
        >
          <div class="text-[10px] font-medium text-slate-500">High Risk Sites</div>
          <div class="mt-0.5 flex items-baseline gap-1.5">
            <span class="text-xl font-bold text-slate-900">{highRiskCount}</span>
            <span class="text-[11px] font-semibold text-rose-600">{Math.round((highRiskCount / totalSitesCount) * 100)}%</span>
          </div>
        </button>
        <div class="bg-white rounded-xl border border-slate-200/80 p-2.5 shadow-xs">
          <div class="text-[10px] font-medium text-slate-500">Total Subjects</div>
          <div class="mt-0.5 flex items-baseline gap-1.5">
            <span class="text-xl font-bold text-slate-900">{totalEnrolledCount}</span>
            <span class="text-[10px] text-slate-400">enrolled</span>
          </div>
        </div>
        <button
          type="button"
          on:click={() => { quickFilter = quickFilter === 'dbl_delay' ? 'all' : 'dbl_delay'; currentPage = 1; }}
          class="text-left bg-white rounded-xl border p-2.5 shadow-xs transition-colors cursor-pointer {quickFilter === 'dbl_delay' ? 'border-rose-400 ring-1 ring-rose-200' : 'border-slate-200/80 hover:border-rose-300'}"
        >
          <div class="text-[10px] font-medium text-slate-500">Not Lock Ready</div>
          <div class="mt-0.5 flex items-baseline gap-1.5">
            <span class="text-xl font-bold text-slate-900">{totalNotLockReady}</span>
            <span class="text-[11px] font-semibold text-rose-600">{Math.round((totalNotLockReady / totalEnrolledCount) * 100)}%</span>
          </div>
        </button>
      </div>

      <!-- Top Visual Row: PDF Map / V2 Risk Quadrant / V2 Vendor Feeds (Left) + Distribution & Top 5 (Right) -->
      <div class="grid grid-cols-1 xl:grid-cols-12 gap-2.5 items-stretch">
        <!-- Left (col-span-7): Map / Risk Quadrant / Vendor Feeds -->
        <div class="xl:col-span-7 bg-white rounded-xl border border-slate-200/80 p-3 shadow-xs flex flex-col justify-between">
          <div class="flex flex-wrap items-center justify-between gap-2 pb-2 mb-2 border-b border-slate-100">
            <div class="flex items-center gap-2">
              <h3 class="text-xs font-bold text-slate-900">
                {visualTab === 'map' ? 'Sites by Country' : visualTab === 'quadrant' ? 'Critical-Path Risk Quadrant' : 'External Vendor Feeds'}
              </h3>
              {#if countryFilter !== 'all' && visualTab === 'map'}
                <button
                  type="button"
                  on:click={() => { countryFilter = 'all'; currentPage = 1; }}
                  class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-blue-50 border border-blue-200 text-[10px] font-semibold text-blue-700 hover:bg-blue-100 cursor-pointer"
                >
                  {countryFilter} <X size={10} />
                </button>
              {/if}
            </div>
            <div class="inline-flex items-center rounded-lg bg-slate-100 p-0.5 text-[11px] font-semibold">
              <button
                type="button"
                on:click={() => (visualTab = 'map')}
                class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md cursor-pointer transition-colors {visualTab === 'map' ? 'bg-white text-blue-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'}"
              >
                <MapPin size={11} /> Map
              </button>
              <button
                type="button"
                on:click={() => (visualTab = 'quadrant')}
                class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md cursor-pointer transition-colors {visualTab === 'quadrant' ? 'bg-white text-blue-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'}"
              >
                <BarChart3 size={11} /> Risk Quadrant
              </button>
              <button
                type="button"
                on:click={() => (visualTab = 'vendors')}
                class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md cursor-pointer transition-colors {visualTab === 'vendors' ? 'bg-white text-blue-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'}"
              >
                <Server size={11} /> Vendor Feeds
              </button>
            </div>
          </div>

          {#if visualTab === 'map'}
            <WorldMapWidgetV3
              heightClass="h-[275px]"
              selectedCountry={countryFilter}
              onSelectCountry={(c) => { countryFilter = countryFilter === c ? 'all' : c; currentPage = 1; }}
              onSelectSite={(siteId) => onSelectSite(siteId)}
            />
          {:else if visualTab === 'quadrant'}
            <div class="space-y-2">
              <div class="flex items-center justify-between gap-2 text-[11px] bg-slate-50 rounded-lg px-2.5 py-1.5 border border-slate-200/80">
                <div class="truncate">
                  <span class="font-bold text-slate-900">Site {hoveredQuadrantSite.id}</span> · {hoveredQuadrantSite.name}
                  <span class="text-slate-500">({hoveredQuadrantSite.criticalSubjects} crit subj · {hoveredQuadrantSite.dblImpactDays}d DBL impact)</span>
                </div>
                <button
                  type="button"
                  on:click={() => (quickDrawerSite = hoveredQuadrantSite)}
                  class="shrink-0 font-semibold text-blue-600 hover:underline cursor-pointer"
                >
                  Why at risk? →
                </button>
              </div>
              <svg viewBox="0 0 {QW} {QH}" class="w-full h-auto select-none">
                <rect x={QP.left} y={QP.top} width={qMidX - QP.left} height={qMidY - QP.top} fill="#ffe4e6" fill-opacity="0.4" />
                <rect x={qMidX} y={QP.top} width={QW - QP.right - qMidX} height={qMidY - QP.top} fill="#fef3c7" fill-opacity="0.3" />
                <rect x={QP.left} y={qMidY} width={qMidX - QP.left} height={QP.top + QCH - qMidY} fill="#ecfdf5" fill-opacity="0.4" />
                <rect x={qMidX} y={qMidY} width={QW - QP.right - qMidX} height={QP.top + QCH - qMidY} fill="#f8fafc" />
                <line x1={qMidX} y1={QP.top} x2={qMidX} y2={QP.top + QCH} stroke="#cbd5e1" stroke-dasharray="3 3" />
                <line x1={QP.left} y1={qMidY} x2={QW - QP.right} y2={qMidY} stroke="#cbd5e1" stroke-dasharray="3 3" />
                <text x={QP.left + 6} y={QP.top + 12} font-size="8" font-weight="700" fill="#be123c">HIGH DELAY / CRITICAL PATH</text>
                <text x={QP.left + 6} y={QP.top + QCH - 6} font-size="8" font-weight="700" fill="#047857">STABLE LOCK ZONE</text>
                <text x={QW - QP.right - 6} y={QP.top + QCH - 6} text-anchor="end" font-size="8" font-weight="700" fill="#64748b">ROUTINE VOLUME</text>

                {#each [0, 1, 2, 3, 4] as d}
                  <line x1={QP.left} y1={qy(d)} x2={QW - QP.right} y2={qy(d)} stroke="#e2e8f0" stroke-width="0.7" />
                  <text x={QP.left - 5} y={qy(d) + 3} text-anchor="end" font-size="8" fill="#64748b">+{d}d</text>
                {/each}
                {#each [0, 6, 12, 18, 24] as v}
                  <text x={qx(v)} y={QH - 16} text-anchor="middle" font-size="8" fill="#64748b">{v}</text>
                {/each}
                <text x={QP.left + QCW / 2} y={QH - 4} text-anchor="middle" font-size="8.5" font-weight="700" fill="#475569">Enrolled / Affected Subjects →</text>

                {#each normalizedSites as site}
                  {@const cx = qx(site.enrolled)}
                  {@const cy = qy(site.dblImpactDays)}
                  {@const isHov = hoveredQuadrantId === site.id}
                  {@const col = site.riskLevel === 'High risk' ? '#e11d48' : site.riskLevel === 'At risk' ? '#d97706' : '#059669'}
                  <g
                    role="button"
                    tabindex="0"
                    class="cursor-pointer"
                    on:mouseenter={() => (hoveredQuadrantId = site.id)}
                    on:click={() => (quickDrawerSite = site)}
                    on:keydown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); quickDrawerSite = site; } }}
                  >
                    {#if site.riskLevel === 'High risk'}
                      <circle {cx} {cy} r="13" fill={col} opacity="0.16" />
                    {/if}
                    <circle {cx} {cy} r={isHov ? 9 : 7} fill={col} stroke="#fff" stroke-width="1.5" />
                    <text x={cx} y={cy + 2.5} text-anchor="middle" font-size="6.5" font-weight="700" fill="#fff">{site.id}</text>
                  </g>
                {/each}
              </svg>
            </div>
          {:else}
            <!-- V2 Automated Vendor Feeds -->
            <div class="space-y-2">
              <div class="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                {#each VENDOR_FEEDS as vf}
                  <button
                    type="button"
                    on:click={() => (selectedVendorId = vf.id)}
                    class="text-left p-2 rounded-lg border transition-colors cursor-pointer {selectedVendorId === vf.id ? 'border-blue-400 bg-blue-50/70' : 'border-slate-200 bg-slate-50/50 hover:bg-slate-50'}"
                  >
                    <div class="text-[11px] font-bold text-slate-900 truncate">{vf.name.split(' (')[0]}</div>
                    <div class="text-[10px] font-semibold mt-0.5 {vf.tone === 'rose' ? 'text-rose-600' : 'text-amber-600'}">{vf.status}</div>
                  </button>
                {/each}
              </div>
              <div class="rounded-lg border border-slate-200 bg-slate-50/60 p-3 space-y-2 text-xs">
                <div class="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div class="font-bold text-slate-900">{activeVendor.name}</div>
                    <div class="text-[10px] text-slate-500">{activeVendor.feedType} · Synced {activeVendor.lastSync}</div>
                  </div>
                  <span class="px-2 py-0.5 rounded-full text-[10px] font-bold border {activeVendor.tone === 'rose' ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-amber-50 text-amber-700 border-amber-200'}">
                    Cleanliness: {activeVendor.score}%
                  </span>
                </div>
                <p class="text-[11px] text-slate-700">{activeVendor.summary}</p>
                <div class="flex flex-wrap items-center gap-1.5 pt-1">
                  <span class="text-[10px] font-semibold text-slate-500">Affected Sites:</span>
                  {#each activeVendor.affectedSites as sid}
                    <button
                      type="button"
                      on:click={() => {
                        const found = normalizedSites.find((s) => s.id === sid);
                        if (found) quickDrawerSite = found;
                      }}
                      class="px-2 py-0.5 rounded bg-white border border-slate-200 hover:border-blue-400 text-[11px] font-mono font-bold text-blue-700 cursor-pointer"
                    >
                      Site {sid} →
                    </button>
                  {/each}
                </div>
              </div>
            </div>
          {/if}
        </div>

        <!-- Right (col-span-5): Interactive Readiness Distribution + Top 5 Sites by DB Lock Impact -->
        <div class="xl:col-span-5 flex flex-col gap-2.5">
          <!-- Interactive Site Readiness Distribution -->
          <div class="bg-white rounded-xl border border-slate-200/80 p-3 shadow-xs">
            <div class="flex items-center justify-between mb-1.5">
              <h3 class="text-xs font-bold text-slate-900">Site Readiness Distribution</h3>
              {#if readinessBand !== 'all'}
                <button
                  type="button"
                  on:click={() => { readinessBand = 'all'; currentPage = 1; }}
                  class="inline-flex items-center gap-1 text-[10px] font-semibold text-blue-600 hover:underline cursor-pointer"
                >
                  Clear band <X size={10} />
                </button>
              {:else}
                <span class="text-[10px] text-slate-400">Click bar to filter</span>
              {/if}
            </div>
            <div class="grid grid-cols-4 gap-2 items-end h-24 pt-2">
              {#each distBuckets as b, idx}
                {@const isSel = readinessBand === b.key}
                {@const isHov = hoveredDistIdx === idx}
                <button
                  type="button"
                  on:mouseenter={() => (hoveredDistIdx = idx)}
                  on:mouseleave={() => (hoveredDistIdx = null)}
                  on:click={() => { readinessBand = readinessBand === b.key ? 'all' : b.key; currentPage = 1; }}
                  class="flex flex-col items-center h-full justify-end rounded-lg px-1 py-1 transition-all cursor-pointer {isSel ? 'bg-blue-50/90 ring-1 ring-blue-300' : isHov ? 'bg-slate-50' : ''}"
                >
                  <span class="text-[11px] font-bold text-slate-900 mb-0.5">{b.count}</span>
                  <div
                    class="w-9 rounded-t-md transition-all duration-150 {isSel || isHov ? 'opacity-100 scale-x-105' : 'opacity-90'}"
                    style="height: {Math.max(8, (b.count / maxBucket) * 44)}px; background: {b.color};"
                  ></div>
                  <div class="text-[10px] font-semibold text-slate-700 leading-tight mt-1">{b.label}</div>
                  <div class="text-[9px] text-slate-400 leading-tight">{b.sub}</div>
                </button>
              {/each}
            </div>
          </div>

          <!-- Top 5 Sites by DB Lock Impact -->
          <div class="flex-1 bg-white rounded-xl border border-slate-200/80 p-3 shadow-xs">
            <div class="flex items-center justify-between mb-1.5">
              <h3 class="text-xs font-bold text-slate-900">Top 5 Sites by DB Lock Impact</h3>
              <span class="text-[10px] text-slate-400">Ranked by DBL impact</span>
            </div>
            <table class="w-full text-xs">
              <thead>
                <tr class="text-left text-[10px] uppercase tracking-wider text-slate-400 border-b border-slate-100">
                  <th class="pb-1 font-semibold">Site ID</th>
                  <th class="pb-1 font-semibold">Country</th>
                  <th class="pb-1 font-semibold text-right">Readiness</th>
                  <th class="pb-1 font-semibold text-right">Crit Subj</th>
                  <th class="pb-1 font-semibold text-right">DBL Impact</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                {#each normalizedSites.slice(0, 5) as s}
                  <tr class="hover:bg-blue-50/50 cursor-pointer" on:click={() => (quickDrawerSite = s)}>
                    <td class="py-1 font-mono font-bold text-blue-700">{s.id}</td>
                    <td class="py-1 text-slate-700">{s.country}</td>
                    <td class="py-1 text-right font-semibold text-slate-900">{s.readiness}%</td>
                    <td class="py-1 text-right text-slate-700">{s.criticalSubjects}</td>
                    <td class="py-1 text-right font-bold {s.dblImpactDays >= 2 ? 'text-rose-600' : s.dblImpactDays > 0 ? 'text-amber-600' : 'text-slate-500'}">
                      {s.dblImpactDays > 0 ? `+${s.dblImpactDays}d` : '0d'}
                    </td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Horizontal Country Risk Strip (PDF Page 37 & Page 6: Readiness, Trend, High-Risk Split, Blockers, Worst Site) -->
      <div class="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-7 gap-2">
        {#each V3_COUNTRY_SUMMARY as c}
          {@const isSelected = countryFilter === c.country}
          <button
            type="button"
            on:click={() => { countryFilter = isSelected ? 'all' : c.country; currentPage = 1; }}
            class="text-left bg-white rounded-xl border p-2.5 shadow-xs transition-all cursor-pointer {isSelected ? 'border-blue-400 bg-blue-50/60 ring-1 ring-blue-200' : 'border-slate-200/80 hover:border-slate-300 hover:bg-slate-50/60'}"
          >
            <div class="flex items-center justify-between gap-1 text-xs">
              <span class="font-bold text-slate-900 truncate">{c.flag} {c.country}</span>
              <span class="font-bold shrink-0 {c.readiness < 70 ? 'text-rose-600' : c.readiness < 80 ? 'text-amber-600' : 'text-emerald-600'}">{c.readiness}%</span>
            </div>
            <div class="flex items-center justify-between text-[10px] text-slate-500 mt-1">
              <span>{c.sites} sites · {c.highRiskSites > 0 ? `${c.highRiskSites} high` : `${c.onTrackSites} ok`}</span>
              <span class="font-semibold {c.forecastDays > 0 ? 'text-rose-600' : 'text-emerald-600'}">{c.forecastDays > 0 ? `+${c.forecastDays}d` : '0d'}</span>
            </div>
            <div class="text-[10px] text-slate-400 mt-0.5 truncate" title="{c.worstSite} · {c.driver}">
              {c.criticalBlockers} blockers · {c.worstSite}
            </div>
          </button>
        {/each}
      </div>

      <!-- Site Details Table with Top Filter Bar, Per-Column Sorting, Export, & Pagination -->
      <div class="bg-white rounded-xl border border-slate-200/80 p-3 shadow-xs space-y-2.5">
        <div class="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 class="text-xs font-bold text-slate-900">Site Details · {filteredSites.length} matching sites</h3>
            <span class="text-[10px] text-slate-400">Ranked by DB Lock impact · Click "Why?" for risk drivers or "Open →" for full intervention</span>
          </div>
          <div class="flex items-center gap-2 text-xs">
            <span class="hidden sm:inline-flex items-center gap-1 px-2 py-1 rounded-lg border border-slate-200/80 bg-slate-50 text-[10px] font-medium text-slate-500">
              <ArrowUpDown size={10} /> Click any column to sort
            </span>
            <button
              type="button"
              on:click={exportCsv}
              class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-[11px] font-semibold text-slate-700 cursor-pointer"
            >
              <Download size={11} /> Export
            </button>
          </div>
        </div>

        <!-- Compact Table Filter Bar -->
        <div class="rounded-lg bg-slate-50/90 border border-slate-200/80 p-2 flex flex-wrap items-center justify-between gap-2">
          <div class="flex flex-wrap items-center gap-1.5">
            <span class="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 mr-0.5">
              <Filter size={10} /> Status
            </span>
            {#each [
              { key: 'all', label: 'All', count: totalSitesCount, dot: '' },
              { key: 'High risk', label: 'High risk', count: highRiskCount, dot: 'bg-rose-500' },
              { key: 'At risk', label: 'At risk', count: atRiskCount, dot: 'bg-amber-500' },
              { key: 'On track', label: 'On track', count: onTrackCount, dot: 'bg-emerald-500' },
            ] as pill}
              <button
                type="button"
                on:click={() => { riskFilter = pill.key; currentPage = 1; }}
                class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border transition-all cursor-pointer {riskFilter === pill.key ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'}"
              >
                {#if pill.dot}
                  <span class="w-1.5 h-1.5 rounded-full {pill.dot}"></span>
                {/if}
                <span>{pill.label}</span>
                <span class="px-1 rounded-full text-[10px] font-bold {riskFilter === pill.key ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'}">{pill.count}</span>
              </button>
            {/each}
          </div>

          <div class="flex flex-wrap items-center gap-1.5">
            <select bind:value={pageSize} on:change={() => (currentPage = 1)} class="text-xs border border-slate-200 rounded-lg px-2 py-1 bg-white">
              <option value={6}>6 / page</option>
              <option value={10}>10 / page</option>
              <option value={18}>All (18)</option>
            </select>
            {#if activeFilterCount > 0}
              <button
                type="button"
                on:click={resetAllFilters}
                class="inline-flex items-center gap-1 px-2 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-[11px] font-semibold text-blue-600 cursor-pointer"
              >
                <RotateCcw size={10} /> Reset ({activeFilterCount})
              </button>
            {/if}
          </div>
        </div>

        <div class="rounded-lg border border-slate-200/80 overflow-x-auto">
          <table class="w-full text-xs">
            <thead class="bg-slate-50/90 border-b border-slate-200/80">
              <tr class="text-left text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                {#each [
                  { col: 'id' as SortCol, label: 'Site ID', align: 'left' },
                  { col: 'name' as SortCol, label: 'Site Name', align: 'left' },
                  { col: 'country' as SortCol, label: 'Country', align: 'left' },
                  { col: 'enrolled' as SortCol, label: 'Comp / Enr', align: 'right' },
                  { col: 'readiness' as SortCol, label: 'Readiness', align: 'right' },
                  { col: 'riskLevel' as SortCol, label: 'Risk Level', align: 'left' },
                ] as h}
                  <th class="px-2.5 py-2 {h.align === 'right' ? 'text-right' : 'text-left'}">
                    <button
                      type="button"
                      on:click={() => toggleSort(h.col)}
                      class="group inline-flex items-center gap-1 uppercase tracking-wider cursor-pointer {h.align === 'right' ? 'justify-end ml-auto' : ''} {sortCol === h.col ? 'text-blue-700 font-bold' : 'text-slate-500 hover:text-slate-800'}"
                    >
                      <span>{h.label}</span>
                      {#if sortCol === h.col}
                        {#if sortDir === 'asc'}<ArrowUp size={10} class="text-blue-600" />{:else}<ArrowDown size={10} class="text-blue-600" />{/if}
                      {:else}
                        <ArrowUpDown size={9} class="text-slate-300 group-hover:text-slate-500" />
                      {/if}
                    </button>
                  </th>
                {/each}
                <th class="px-2.5 py-2">Key Issues / Primary Driver</th>
                {#each [
                  { col: 'dblImpactDays' as SortCol, label: 'DBL Impact', align: 'right' },
                  { col: 'lastActivity' as SortCol, label: 'Last Activity', align: 'left' },
                  { col: 'estReadyDate' as SortCol, label: 'Est. Ready', align: 'left' },
                ] as h}
                  <th class="px-2.5 py-2 {h.align === 'right' ? 'text-right' : 'text-left'}">
                    <button
                      type="button"
                      on:click={() => toggleSort(h.col)}
                      class="group inline-flex items-center gap-1 uppercase tracking-wider cursor-pointer {h.align === 'right' ? 'justify-end ml-auto' : ''} {sortCol === h.col ? 'text-blue-700 font-bold' : 'text-slate-500 hover:text-slate-800'}"
                    >
                      <span>{h.label}</span>
                      {#if sortCol === h.col}
                        {#if sortDir === 'asc'}<ArrowUp size={10} class="text-blue-600" />{:else}<ArrowDown size={10} class="text-blue-600" />{/if}
                      {:else}
                        <ArrowUpDown size={9} class="text-slate-300 group-hover:text-slate-500" />
                      {/if}
                    </button>
                  </th>
                {/each}
                <th class="px-2.5 py-2 text-right">Action</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 bg-white">
              {#each pagedSites as s}
                <tr class="hover:bg-blue-50/40 transition-colors cursor-pointer" on:click={() => onSelectSite(s.id)}>
                  <td class="px-2.5 py-2 font-mono font-bold text-blue-700 whitespace-nowrap">{s.id}</td>
                  <td class="px-2.5 py-2 font-medium text-slate-800 whitespace-nowrap">
                    <div>{s.name}</div>
                    <div class="text-[10px] text-slate-400 font-normal">{s.piName}</div>
                  </td>
                  <td class="px-2.5 py-2 text-slate-600 whitespace-nowrap">{s.country}</td>
                  <td class="px-2.5 py-2 text-right whitespace-nowrap text-slate-600">
                    <span class="font-semibold text-slate-800">{s.completed}</span><span class="text-slate-400"> / {s.enrolled}</span>
                  </td>
                  <td class="px-2.5 py-2 text-right whitespace-nowrap">
                    <div class="inline-flex items-center gap-1.5">
                      <div class="w-12 h-1.5 rounded-full bg-slate-100 overflow-hidden hidden sm:block">
                        <div
                          class="h-full rounded-full {s.riskLevel === 'On track' ? 'bg-emerald-500' : s.riskLevel === 'High risk' ? 'bg-rose-500' : 'bg-amber-500'}"
                          style="width: {s.readiness}%"
                        ></div>
                      </div>
                      <span class="font-bold text-slate-900">{s.readiness}%</span>
                      <span class="text-[10px] font-semibold {s.trend7d < 0 ? 'text-rose-600' : 'text-emerald-600'}">
                        ({s.trend7d >= 0 ? `+${s.trend7d}` : s.trend7d})
                      </span>
                    </div>
                  </td>
                  <td class="px-2.5 py-2 whitespace-nowrap">
                    <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border {riskBadge(s.riskLevel)}">
                      <span class="w-1.5 h-1.5 rounded-full {dotColor(s.riskLevel)}"></span>
                      {s.riskLevel}
                    </span>
                  </td>
                  <td class="px-2.5 py-2 text-slate-600 max-w-[240px]">
                    <div class="truncate" title={s.primaryDriver}>{s.primaryDriver}</div>
                    {#if s.hardGateBlockers > 0}
                      <span class="inline-block mt-0.5 px-1.5 py-0.2 rounded bg-rose-50 text-rose-700 border border-rose-200 text-[9px] font-bold">
                        {s.hardGateBlockers} Hard Gate{s.hardGateBlockers > 1 ? 's' : ''}
                      </span>
                    {/if}
                  </td>
                  <td class="px-2.5 py-2 text-right font-bold whitespace-nowrap {s.dblImpactDays >= 2 ? 'text-rose-600' : s.dblImpactDays > 0 ? 'text-amber-600' : 'text-slate-400'}">
                    {s.dblImpactDays > 0 ? `+${s.dblImpactDays}d` : '0d'}
                  </td>
                  <td class="px-2.5 py-2 text-slate-600 whitespace-nowrap">{s.lastActivity}</td>
                  <td class="px-2.5 py-2 text-slate-600 whitespace-nowrap">{s.estReadyDate}</td>
                  <td class="px-2.5 py-2 text-right whitespace-nowrap" on:click|stopPropagation>
                    <div class="inline-flex items-center gap-1.5">
                      <button
                        type="button"
                        on:click={() => (quickDrawerSite = s)}
                        class="px-2 py-0.5 rounded border border-slate-200 bg-slate-50 hover:bg-blue-50 hover:border-blue-300 text-[10px] font-semibold text-slate-700 hover:text-blue-700 cursor-pointer"
                      >
                        Why?
                      </button>
                      <button
                        type="button"
                        on:click={() => onSelectSite(s.id)}
                        class="inline-flex items-center gap-0.5 text-blue-600 hover:text-blue-800 font-semibold cursor-pointer"
                      >
                        Open <ChevronRight size={12} />
                      </button>
                    </div>
                  </td>
                </tr>
              {:else}
                <tr>
                  <td colspan="11" class="py-8 text-center text-xs text-slate-400">
                    No sites match the current filters.
                    <button type="button" on:click={resetAllFilters} class="ml-1.5 text-blue-600 font-semibold hover:underline cursor-pointer">Reset filters</button>
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>

        <!-- Pagination Bar -->
        <div class="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs">
          <span class="text-slate-500">
            Showing {filteredSites.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, filteredSites.length)} of {filteredSites.length} sites · Page {currentPage} of {totalPages}
          </span>
          <div class="flex items-center gap-1.5">
            <button
              type="button"
              disabled={currentPage === 1}
              on:click={() => (currentPage = Math.max(1, currentPage - 1))}
              class="inline-flex items-center gap-1 px-2.5 py-1 rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-medium disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <ChevronLeft size={13} /> Previous
            </button>
            {#each Array.from({ length: totalPages }, (_, i) => i + 1) as p}
              <button
                type="button"
                on:click={() => (currentPage = p)}
                class="w-7 h-7 rounded-md text-xs font-semibold border cursor-pointer {currentPage === p ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}"
              >
                {p}
              </button>
            {/each}
            <button
              type="button"
              disabled={currentPage === totalPages}
              on:click={() => (currentPage = Math.min(totalPages, currentPage + 1))}
              class="inline-flex items-center gap-1 px-2.5 py-1 rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-medium disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              Next <ChevronRight size={13} />
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>

<!-- V2-Inspired Quick "Why Is This Site at Risk?" Side Drawer -->
{#if quickDrawerSite}
  {@const qb = getSiteQueryBreakdown(quickDrawerSite)}
  <div class="fixed inset-0 z-50 flex justify-end">
    <div
      class="fixed inset-0 bg-slate-900/40 backdrop-blur-xs"
      role="presentation"
      on:click={() => (quickDrawerSite = null)}
    ></div>
    <div class="relative z-10 w-full max-w-md bg-white h-full shadow-2xl border-l border-slate-200 flex flex-col">
      <div class="p-4 border-b border-slate-200 flex items-start justify-between gap-3">
        <div>
          <div class="flex items-center gap-2">
            <span class="px-2 py-0.5 rounded bg-slate-100 font-mono text-xs font-bold text-slate-800">Site {quickDrawerSite.id}</span>
            <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border {riskBadge(quickDrawerSite.riskLevel)}">
              <span class="w-1.5 h-1.5 rounded-full {dotColor(quickDrawerSite.riskLevel)}"></span>
              {quickDrawerSite.riskLevel}
            </span>
          </div>
          <h3 class="text-sm font-bold text-slate-900 mt-1">{quickDrawerSite.name}</h3>
          <p class="text-[11px] text-slate-500">{quickDrawerSite.country} · PI: {quickDrawerSite.piName}</p>
        </div>
        <button
          type="button"
          on:click={() => (quickDrawerSite = null)}
          class="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
          aria-label="Close drawer"
        >
          <X size={16} />
        </button>
      </div>

      <div class="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
        <div class="grid grid-cols-3 gap-2">
          <div class="rounded-lg border border-slate-200 p-2.5 bg-slate-50/60">
            <div class="text-[10px] text-slate-500">Readiness</div>
            <div class="text-lg font-bold text-slate-900">{quickDrawerSite.readiness}%</div>
            <div class="text-[10px] text-slate-400">Exp: {quickDrawerSite.expectedReadiness}%</div>
          </div>
          <div class="rounded-lg border border-slate-200 p-2.5 bg-slate-50/60">
            <div class="text-[10px] text-slate-500">DBL Impact</div>
            <div class="text-lg font-bold {quickDrawerSite.dblImpactDays > 0 ? 'text-rose-600' : 'text-emerald-600'}">
              {quickDrawerSite.dblImpactDays > 0 ? `+${quickDrawerSite.dblImpactDays}d` : '0d'}
            </div>
            <div class="text-[10px] text-slate-400">7d: {quickDrawerSite.trend7d >= 0 ? `+${quickDrawerSite.trend7d}` : quickDrawerSite.trend7d} pts</div>
          </div>
          <div class="rounded-lg border border-slate-200 p-2.5 bg-slate-50/60">
            <div class="text-[10px] text-slate-500">Est. Ready</div>
            <div class="text-sm font-bold text-slate-900 mt-0.5">{quickDrawerSite.estReadyDate}</div>
            <div class="text-[10px] text-slate-400">Req: {quickDrawerSite.requiredReadyDate}</div>
          </div>
        </div>

        <!-- V2 Endpoint vs Routine Query Split -->
        <div class="rounded-lg border border-slate-200 p-3 space-y-2">
          <div class="flex items-center justify-between font-bold text-slate-800">
            <span>Query &amp; Critical-Path Breakdown</span>
            <span class="text-[11px] font-semibold text-slate-500">{qb.total} open</span>
          </div>
          <div class="grid grid-cols-2 gap-2 text-[11px]">
            <div class="rounded bg-rose-50 border border-rose-200 px-2.5 py-1.5">
              <div class="text-rose-700 font-semibold">Endpoint-Critical</div>
              <div class="text-base font-bold text-rose-900">{qb.endpointCritical}</div>
            </div>
            <div class="rounded bg-slate-50 border border-slate-200 px-2.5 py-1.5">
              <div class="text-slate-600 font-semibold">Routine / Non-Critical</div>
              <div class="text-base font-bold text-slate-800">{qb.routine}</div>
            </div>
          </div>
        </div>

        <!-- Why Is This Site at Risk? -->
        <div class="space-y-2">
          <div class="font-bold text-slate-900 flex items-center gap-1.5">
            <ShieldAlert size={13} class="text-rose-600" />
            <span>Why is Site {quickDrawerSite.id} at risk?</span>
          </div>
          {#if quickDrawerSite.riskDrivers.length > 0}
            {#each quickDrawerSite.riskDrivers as drv}
              <div class="rounded-lg border p-2.5 {drv.hardGate ? 'border-rose-200 bg-rose-50/40' : 'border-amber-200 bg-amber-50/30'}">
                <div class="flex items-start justify-between gap-2">
                  <div class="font-semibold text-slate-900">{drv.title}</div>
                  {#if drv.impactDays > 0}
                    <span class="shrink-0 font-bold text-rose-600">+{drv.impactDays}d</span>
                  {/if}
                </div>
                <div class="text-[11px] text-slate-600 mt-0.5">{drv.detail}</div>
                {#if drv.hardGate}
                  <span class="inline-block mt-1 px-1.5 py-0.2 rounded bg-rose-100 text-rose-800 text-[9px] font-bold uppercase">Hard-Gate Blocker</span>
                {/if}
              </div>
            {/each}
          {:else}
            <div class="rounded-lg border border-emerald-200 bg-emerald-50/50 p-3 text-emerald-800 flex items-center gap-2">
              <CheckCircle2 size={14} />
              <span>No critical-path blockers. {quickDrawerSite.primaryDriver}.</span>
            </div>
          {/if}
        </div>
      </div>

      <div class="p-3.5 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-2">
        <button
          type="button"
          on:click={() => (quickDrawerSite = null)}
          class="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-100 cursor-pointer"
        >
          Close
        </button>
        <button
          type="button"
          on:click={() => {
            const id = quickDrawerSite?.id;
            quickDrawerSite = null;
            if (id) onSelectSite(id);
          }}
          class="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold cursor-pointer"
        >
          <span>Open Full Site Intervention Workspace</span>
          <ChevronRight size={13} />
        </button>
      </div>
    </div>
  </div>
{/if}
