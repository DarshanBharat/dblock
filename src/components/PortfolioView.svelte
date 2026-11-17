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
    Sparkles,
    Info,
    Layers,
    Database,
    Users,
    FileText
  } from '@lucide/svelte';

  export let portfolioStudies: any[];
  export let sites: any[] = [];
  export let subjects: any[] = [];
  export let saeDiscrepancies: any[] = [];
  export let labBatches: any[] = [];
  export let queriesDetail: any[] = [];
  export let onSelectStudy: (studyId: string) => void;
  export let onSelectSite: (siteId: string) => void = () => {};

  // =========================================================================
  // FILTER STATE (Following manager's updated flow):
  // 1. Therapeutic area first
  // 2. Searchable Study ID filter (scales to hundreds/thousands of studies)
  // 3. Selectable Milestone list (protocol amendments, submissions, safety, LSLV, DBL)
  // =========================================================================
  let selectedTherapeuticArea = 'all';
  let studyIdSearch = '';
  let selectedStudyIdDropdown = 'all';
  let showStudyDropdown = false;

  // Selectable milestone list (multi-select)
  let selectedMilestones: string[] = ['dbl', 'lslv', 'protocol_amendments', 'submissions', 'safety_milestones'];
  const milestoneOptions = [
    { id: 'dbl', label: 'Database Lock (DBL)' },
    { id: 'lslv', label: 'Last Subject Last Visit (LSLV)' },
    { id: 'protocol_amendments', label: 'Protocol Amendments' },
    { id: 'submissions', label: 'Regulatory Submissions' },
    { id: 'safety_milestones', label: 'Safety Milestones / DMC' }
  ];

  let selectedSponsor = 'all';
  let selectedPhase = 'all';
  let selectedCountry = 'all';
  let selectedRiskDirection = 'all'; // 'all' | 'Improving' | 'Worsening'

  $: availableCountries = Array.from(
    new Set(portfolioStudies.flatMap((s: any) => s.countries || []))
  ).sort();

  function formatStudyCountries(countries?: string[]): string {
    if (!countries || countries.length === 0) return 'Global';
    if (countries.length <= 2) return countries.join(', ');
    return `${countries.slice(0, 2).join(', ')} +${countries.length - 2}`;
  }
  let showOnTrack = true;
  let showAtRisk = true;
  let showHighRisk = true;
  let sortBy = 'dbl_earliest';
  let viewLayout = 'table'; // 'table' | 'cards'
  let currentPage = 1;
  const pageSize = 8;

  // Show/hide calculation methodology panel
  let showCalcDefinitions = false;

  // Interactive 4-Level Portfolio Drill-Down State (Image 4 Blue)
  let showDrillDownExplorer = true;
  let drillStudyId = 'CA-209-301';
  let drillMilestone = 'DBL (Target: 15 Dec 2026 | Potential: 21 Dec 2026)';
  let selectedBlockerId = 'BLK-SAE-104';
  let selectedDrillCountry = 'United States (US)';
  let selectedDrillSiteId = '104';
  let selectedDrillSubjectId = 'SUBJ-104-003';

  const criticalBlockersCatalog = [
    {
      id: 'BLK-SAE-104',
      milestone: 'DBL',
      title: '2 Unresolved SAE Reconciliation Discrepancies',
      domain: 'Safety Reconciliation',
      impactDays: '+2.1 days',
      country: 'United States (US)',
      siteId: '104',
      siteName: 'Site 104 – Boston Medical Center',
      subjectIds: ['SUBJ-104-003', 'SUBJ-104-012'],
      records: [
        {
          recordId: 'SAE-REC-104-01',
          type: 'SAE Discrepancy (Grade 3 CRS Onset Discordance)',
          subjectId: 'SUBJ-104-003',
          sourceSystem: 'Oracle Argus Safety ↔ Medidata Rave EDC',
          age: '12 days',
          lastRefresh: '31 October 2026, 08:00 UTC',
          criticality: 'Critical Blocker'
        },
        {
          recordId: 'SAE-REC-104-02',
          type: 'SAE Discrepancy (Fatal Sepsis Narrative Pending)',
          subjectId: 'SUBJ-104-012',
          sourceSystem: 'Oracle Argus Safety ↔ Medidata Rave Form DD-01',
          age: '9 days',
          lastRefresh: '31 October 2026, 08:00 UTC',
          criticality: 'Critical Blocker'
        }
      ]
    },
    {
      id: 'BLK-LAB-104',
      milestone: 'DBL',
      title: 'Overdue Central Lab ctDNA Transfer (#LXB-8921)',
      domain: 'External Lab Transfer',
      impactDays: '+1.8 days',
      country: 'United States (US) & Germany (DE)',
      siteId: '104',
      siteName: 'Site 104 – Boston Medical Center & Site 317 – Charité Berlin',
      subjectIds: ['SUBJ-104-019', 'SUBJ-317-005'],
      records: [
        {
          recordId: 'LXB-8921',
          type: 'Lab Transfer Batch (48 ctDNA NGS samples – SHA-256 Checksum Failed)',
          subjectId: 'SUBJ-104-019',
          sourceSystem: 'LabCorp Bioanalytical SFTP API',
          age: '4 days overdue (Due 27 Oct 2026)',
          lastRefresh: '31 October 2026, 08:00 UTC',
          criticality: 'Critical Blocker'
        }
      ]
    },
    {
      id: 'BLK-QRY-317',
      milestone: 'DBL / LSLV',
      title: '14 Ageing Queries >14 Days (5 Endpoint-Critical RECIST)',
      domain: 'EDC Query Resolution',
      impactDays: '+1.3 days',
      country: 'Germany (DE) & United States (US)',
      siteId: '317',
      siteName: 'Site 317 – Charité Berlin & Site 104 – Boston',
      subjectIds: ['SUBJ-317-005', 'SUBJ-104-003'],
      records: [
        {
          recordId: 'QRY-104-089',
          type: 'Endpoint-Critical Query (TU-01 Target Lesion Sum Diameter 28mm vs 36mm)',
          subjectId: 'SUBJ-104-003',
          sourceSystem: 'Medidata Rave EDC v8.2',
          age: '16 days',
          lastRefresh: '31 October 2026, 08:00 UTC',
          criticality: 'Endpoint-Critical'
        },
        {
          recordId: 'QRY-317-044',
          type: 'Endpoint-Critical Query (TU-01 Thoracic CT 5mm Slice Thickness Deviation)',
          subjectId: 'SUBJ-317-005',
          sourceSystem: 'Medidata Rave EDC / BioClinica ICR',
          age: '12 days',
          lastRefresh: '31 October 2026, 08:00 UTC',
          criticality: 'Endpoint-Critical'
        }
      ]
    },
    {
      id: 'BLK-SIG-405',
      milestone: 'DBL',
      title: '18 Pending Principal Investigator e-Signatures',
      domain: 'Site Sign-offs',
      impactDays: '+0.8 days',
      country: 'South Korea (KR)',
      siteId: '405',
      siteName: 'Site 405 – Seoul National University Hospital',
      subjectIds: ['SUBJ-104-003'],
      records: [
        {
          recordId: 'SIG-405-C4C6',
          type: 'PI Electronic Casebook Sign-off (18 completed subject casebooks)',
          subjectId: 'SUBJ-104-003',
          sourceSystem: 'Medidata Rave e-Signature & Veeva eTMF',
          age: '11 days',
          lastRefresh: '31 October 2026, 08:00 UTC',
          criticality: 'Critical Blocker'
        }
      ]
    }
  ];

  $: activeBlocker = criticalBlockersCatalog.find(b => b.id === selectedBlockerId) || criticalBlockersCatalog[0];

  function toggleMilestone(id: string) {
    if (selectedMilestones.includes(id)) {
      if (selectedMilestones.length > 1) {
        selectedMilestones = selectedMilestones.filter(m => m !== id);
      }
    } else {
      selectedMilestones = [...selectedMilestones, id];
    }
    currentPage = 1;
  }

  function clearAllFilters() {
    selectedTherapeuticArea = 'all';
    studyIdSearch = '';
    selectedStudyIdDropdown = 'all';
    selectedMilestones = ['dbl', 'lslv', 'protocol_amendments', 'submissions', 'safety_milestones'];
    selectedSponsor = 'all';
    selectedPhase = 'all';
    selectedCountry = 'all';
    selectedRiskDirection = 'all';
    showOnTrack = true;
    showAtRisk = true;
    showHighRisk = true;
    currentPage = 1;
  }

  // Available studies in selected TA for the searchable Study ID filter
  $: taFilteredStudiesForIdList = portfolioStudies.filter(s =>
    selectedTherapeuticArea === 'all' || s.therapeuticArea.toLowerCase() === selectedTherapeuticArea.toLowerCase()
  );

  // Reactive filtering
  $: filteredStudies = portfolioStudies.filter(s => {
    // 1. Therapeutic area first
    if (selectedTherapeuticArea !== 'all' && s.therapeuticArea.toLowerCase() !== selectedTherapeuticArea.toLowerCase()) return false;

    // 2. Searchable Study ID filter
    if (selectedStudyIdDropdown !== 'all' && s.id !== selectedStudyIdDropdown) return false;
    if (studyIdSearch.trim()) {
      const q = studyIdSearch.toLowerCase();
      const match = s.id.toLowerCase().includes(q) ||
        s.name.toLowerCase().includes(q) ||
        s.indication.toLowerCase().includes(q) ||
        s.therapeuticArea.toLowerCase().includes(q);
      if (!match) return false;
    }

    // 3. Selectable Milestone list filter
    if (s.milestones && s.milestones.length > 0) {
      const hasMatchingMilestone = s.milestones.some((m: string) => selectedMilestones.includes(m));
      if (!hasMatchingMilestone) return false;
    }

    // 4. Sponsor filter
    if (selectedSponsor !== 'all' && s.sponsor && s.sponsor !== selectedSponsor) return false;

    // 5. Risk status & Risk direction filter
    if (s.status === 'On track' && !showOnTrack) return false;
    if (s.status === 'At risk' && !showAtRisk) return false;
    if (s.status === 'High risk' && !showHighRisk) return false;
    if (selectedRiskDirection !== 'all' && s.riskDirection !== selectedRiskDirection) return false;

    // 6. Phase & Country filter
    if (selectedPhase !== 'all' && !s.phase.toLowerCase().includes(selectedPhase.toLowerCase())) return false;
    if (selectedCountry !== 'all' && !(s.countries || []).some((c: string) => c.toLowerCase() === selectedCountry.toLowerCase())) return false;

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
  $: featuredCa209 = portfolioStudies.find(s => s.id === 'CA-209-301') || portfolioStudies[0];

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

<div class="space-y-5">

  <!-- ========================================================================= -->
  <!-- PROTOTYPE METRIC DEFINITIONS & SUPPORTING DATA CALLOUT (Image 1 Blue)      -->
  <!-- ========================================================================= -->
  <div class="bg-blue-50/90 border border-blue-200 rounded-xl p-4 shadow-xs">
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div class="flex items-start space-x-3">
        <Info size={18} class="text-blue-600 shrink-0 mt-0.5" />
        <div class="text-xs text-blue-950">
          <div class="flex items-center space-x-2 flex-wrap">
            <strong class="font-extrabold uppercase tracking-wider text-[11px] text-blue-900">
              Prototype Metric Basis &amp; Dummy-Value Governance Notice
            </strong>
            <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-300">
              Entry Point Screen 1 &middot; Illustrative Prototype Values
            </span>
          </div>
          <p class="text-[11px] text-blue-800 mt-1 leading-relaxed">
            All scores, probabilities, risk categories, and potential DBL figures shown are illustrative dummy values. Every metric is paired below with its exact calculation formula and supporting source data (EDC, Safety, Central Lab, eCOA, Coding, IRT).
          </p>
        </div>
      </div>
      <button
        type="button"
        on:click={() => showCalcDefinitions = !showCalcDefinitions}
        class="shrink-0 px-3 py-1.5 rounded-lg bg-white text-blue-700 hover:bg-blue-100 border border-blue-300 font-bold text-xs transition-colors cursor-pointer"
      >
        {showCalcDefinitions ? 'Hide calculation definitions' : 'How metrics are calculated & supported'}
      </button>
    </div>

    {#if showCalcDefinitions}
      <div class="mt-4 pt-3 border-t border-blue-200/80 grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
        <div class="bg-white p-3 rounded-lg border border-blue-100">
          <div class="font-bold text-slate-900">1. DBL Readiness Score (72/100)</div>
          <p class="text-[11px] text-slate-600 mt-1 leading-relaxed">
            <strong>Calculation:</strong> Share of enrolled subjects without outstanding issues (<code>158 / 220 = 71.8%</code>), weighted across 5 components (EDC 30%, External 25%, Site 20%, CDM 15%, Cross-functional 10%), with critical items penalized <code>2.0x</code> vs non-critical <code>0.5x</code>.
          </p>
          <div class="text-[10px] text-blue-700 font-semibold mt-1">Supported by: Rave EDC, Argus, LabCorp, eCOA, Coder</div>
        </div>
        <div class="bg-white p-3 rounded-lg border border-blue-100">
          <div class="font-bold text-slate-900">2. Potential DBL vs Target Date</div>
          <p class="text-[11px] text-slate-600 mt-1 leading-relaxed">
            <strong>Calculation:</strong> Target DBL date is held unchanged (<code>15 Dec 2026</code>). Potential DBL date (<code>21 Dec 2026</code>) projects critical-path blocker burn-down velocity and vendor SLAs, flagging either a <strong>delay (+6d)</strong> or an <strong>earlier completion (-3d)</strong>.
          </p>
          <div class="text-[10px] text-blue-700 font-semibold mt-1">Supported by: Historical site closure velocity &amp; SLA feeds</div>
        </div>
        <div class="bg-white p-3 rounded-lg border border-blue-100">
          <div class="font-bold text-slate-900">3. Configurable Risk Categories</div>
          <p class="text-[11px] text-slate-600 mt-1 leading-relaxed">
            <strong>Thresholds (Prototype):</strong><br/>
            &bull; <strong>Critical:</strong> &gt;80% prob or &gt;5d impact<br/>
            &bull; <strong>High:</strong> 60–80% prob or 3–5d impact<br/>
            &bull; <strong>Medium:</strong> 30–60% prob or 1–3d impact<br/>
            &bull; <strong>Low:</strong> &lt;30% prob and &lt;1d impact
          </p>
          <div class="text-[10px] text-blue-700 font-semibold mt-1">Supported by: Monte Carlo critical-path simulation</div>
        </div>
        <div class="bg-white p-3 rounded-lg border border-blue-100">
          <div class="font-bold text-slate-900">4. Critical Blockers &amp; Direction</div>
          <p class="text-[11px] text-slate-600 mt-1 leading-relaxed">
            <strong>Calculation:</strong> Count of unresolved items directly gating safety freeze, primary endpoint lock, or PI sign-off. Direction compares current week potential DBL variance against W-1 snapshot.
          </p>
          <div class="text-[10px] text-blue-700 font-semibold mt-1">Supported by: Weekly W-8 to W0 audit snapshots</div>
        </div>
      </div>
    {/if}
  </div>

  <div class="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
    
    <!-- ========================================================================= -->
    <!-- LEFT COLUMN: FILTERS SIDEBAR (Therapeutic Area -> Searchable Study ID)    -->
    <!-- ========================================================================= -->
    <aside class="lg:col-span-1 bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
      <div class="flex items-center justify-between pb-3 border-b border-slate-100">
        <div>
          <h3 class="font-bold text-slate-900 text-sm flex items-center space-x-2">
            <SlidersHorizontal size={16} class="text-blue-600" />
            <span>Portfolio Filters</span>
          </h3>
          <p class="text-[10px] text-slate-400 mt-0.5">Step 1: TA &rarr; Step 2: Searchable Study ID</p>
        </div>
        <button
          on:click={clearAllFilters}
          class="text-xs text-blue-600 hover:text-blue-800 font-semibold cursor-pointer"
        >
          Clear all
        </button>
      </div>

      <!-- STEP 1: Therapeutic Area Filter First (Image 3 Blue) -->
      <div class="space-y-1.5 p-2.5 rounded-lg bg-blue-50/50 border border-blue-100">
        <div class="flex items-center justify-between">
          <label for="ta-filter" class="text-[11px] font-extrabold text-blue-900 uppercase tracking-wider block">
            1. Therapeutic area
          </label>
          <span class="text-[10px] font-bold text-blue-600">Primary Filter</span>
        </div>
        <div class="relative">
          <select
            id="ta-filter"
            bind:value={selectedTherapeuticArea}
            on:change={() => { selectedStudyIdDropdown = 'all'; currentPage = 1; }}
            class="w-full text-xs bg-white border border-blue-200 rounded-lg py-2 px-2.5 text-slate-900 font-semibold appearance-none focus:outline-hidden focus:border-blue-500"
          >
            <option value="all">All therapeutic areas (1,240 studies)</option>
            <option value="oncology">Oncology (410 studies &middot; 3 active DBL)</option>
            <option value="cardiovascular">Cardiovascular (185 studies &middot; 1 active DBL)</option>
            <option value="immunology">Immunology (160 studies &middot; 1 active DBL)</option>
            <option value="neurology">Neurology (120 studies &middot; 1 active DBL)</option>
            <option value="rare disease">Rare Disease (95 studies &middot; 1 active DBL)</option>
            <option value="gastroenterology">Gastroenterology (80 studies &middot; 1 active DBL)</option>
            <option value="vaccines">Vaccines (75 studies &middot; 1 active DBL)</option>
            <option value="metabolic">Metabolic (65 studies &middot; 1 active DBL)</option>
            <option value="respiratory">Respiratory (30 studies &middot; 1 active DBL)</option>
            <option value="hematology">Hematology (20 studies &middot; 1 active DBL)</option>
          </select>
          <ChevronDown size={14} class="absolute right-2.5 top-2.5 text-slate-500 pointer-events-none" />
        </div>
      </div>

      <!-- STEP 2: Searchable Study ID Filter (Scales to hundreds/thousands) (Image 3 Blue) -->
      <div class="space-y-2 p-2.5 rounded-lg bg-blue-50/50 border border-blue-100">
        <div class="flex items-center justify-between">
          <label for="study-id-search" class="text-[11px] font-extrabold text-blue-900 uppercase tracking-wider block">
            2. Searchable Study ID
          </label>
          <span class="text-[10px] text-slate-500 font-medium">{taFilteredStudiesForIdList.length} in window</span>
        </div>

        <div class="relative">
          <Search size={13} class="absolute left-2.5 top-2.5 text-slate-400" />
          <input
            id="study-id-search"
            type="text"
            bind:value={studyIdSearch}
            on:focus={() => showStudyDropdown = true}
            on:blur={() => setTimeout(() => showStudyDropdown = false, 180)}
            placeholder="Type Study ID (e.g. CA-209-301)..."
            class="w-full text-xs bg-white border border-blue-200 rounded-lg py-2 pl-8 pr-2.5 text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-blue-500 font-medium"
          />
          {#if showStudyDropdown}
            <div class="absolute left-0 right-0 top-10 bg-white border border-slate-200 rounded-lg shadow-lg max-h-48 overflow-y-auto z-30 divide-y divide-slate-100 text-xs">
              <button
                type="button"
                on:mousedown={() => { selectedStudyIdDropdown = 'all'; studyIdSearch = ''; }}
                class="w-full text-left px-3 py-2 hover:bg-blue-50 font-semibold text-blue-700"
              >
                Show all matching studies ({taFilteredStudiesForIdList.length})
              </button>
              {#each taFilteredStudiesForIdList as st}
                <button
                  type="button"
                  on:mousedown={() => { selectedStudyIdDropdown = st.id; studyIdSearch = st.id; }}
                  class="w-full text-left px-3 py-2 hover:bg-blue-50 flex items-center justify-between"
                >
                  <div>
                    <span class="font-bold text-slate-900">{st.id}</span>
                    <span class="text-[11px] text-slate-500 ml-1">&middot; {st.indication}</span>
                  </div>
                  <span class="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">{st.readinessScore}/100</span>
                </button>
              {/each}
            </div>
          {/if}
        </div>
        <p class="text-[10px] text-slate-500 leading-tight">
          Typeahead indexed for 1,000+ global study protocols after Therapeutic Area selection.
        </p>
      </div>

      <!-- STEP 3: Selectable Milestone List (Image 3 Red note) -->
      <div class="space-y-2 pt-2 border-t border-slate-100">
        <div class="flex items-center justify-between">
          <span class="text-[11px] font-bold text-slate-600 uppercase tracking-wider block">
            3. Milestone Filter (Selectable List)
          </span>
          <span class="text-[9px] px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 font-semibold">
            Configurable
          </span>
        </div>
        <div class="space-y-1.5 text-xs text-slate-700 bg-slate-50 p-2.5 rounded-lg border border-slate-200/80">
          {#each milestoneOptions as mOpt}
            <label class="flex items-center space-x-2 cursor-pointer hover:text-slate-900">
              <input
                type="checkbox"
                checked={selectedMilestones.includes(mOpt.id)}
                on:change={() => toggleMilestone(mOpt.id)}
                class="rounded text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
              />
              <span class="text-[11px] font-medium">{mOpt.label}</span>
            </label>
          {/each}
          <div class="text-[10px] text-slate-400 pt-1 border-t border-slate-200/60">
            Includes protocol amendments, regulatory submissions &amp; safety milestones (Seema &amp; Bijal to confirm final list).
          </div>
        </div>
      </div>

      <!-- Risk Category & Direction of Risk -->
      <div class="space-y-2 pt-2 border-t border-slate-100">
        <span class="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Risk Category &amp; Direction</span>
        <div class="space-y-1.5 text-xs text-slate-700">
          <label class="flex items-center justify-between cursor-pointer group">
            <div class="flex items-center space-x-2">
              <input type="checkbox" bind:checked={showOnTrack} class="rounded text-blue-600 focus:ring-blue-500 w-3.5 h-3.5" />
              <span class="group-hover:text-slate-900 font-medium">On track (&ge; 90)</span>
            </div>
            <span class="text-xs text-slate-400 font-semibold">4</span>
          </label>
          <label class="flex items-center justify-between cursor-pointer group">
            <div class="flex items-center space-x-2">
              <input type="checkbox" bind:checked={showAtRisk} class="rounded text-blue-600 focus:ring-blue-500 w-3.5 h-3.5" />
              <span class="group-hover:text-slate-900 font-medium">At risk (70–89)</span>
            </div>
            <span class="text-xs text-slate-400 font-semibold">5</span>
          </label>
          <label class="flex items-center justify-between cursor-pointer group">
            <div class="flex items-center space-x-2">
              <input type="checkbox" bind:checked={showHighRisk} class="rounded text-blue-600 focus:ring-blue-500 w-3.5 h-3.5" />
              <span class="group-hover:text-slate-900 font-medium">High risk (&lt; 70)</span>
            </div>
            <span class="text-xs text-slate-400 font-semibold">3</span>
          </label>
        </div>

        <div class="pt-1.5">
          <label for="risk-dir-select" class="text-[10px] font-bold text-slate-400 uppercase block mb-1">Direction of risk</label>
          <select
            id="risk-dir-select"
            bind:value={selectedRiskDirection}
            class="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg py-1.5 px-2.5 text-slate-800"
          >
            <option value="all">All directions (Improving &amp; Worsening)</option>
            <option value="Improving">Improving risk trajectory</option>
            <option value="Worsening">Worsening risk trajectory</option>
          </select>
        </div>
      </div>

      <!-- Sponsor, Phase & Country Filters -->
      <div class="grid grid-cols-1 gap-2.5 pt-2 border-t border-slate-100">
        <div>
          <label for="sponsor-filter" class="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Sponsor</label>
          <select
            id="sponsor-filter"
            bind:value={selectedSponsor}
            class="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg py-1.5 px-2.5 text-slate-800"
          >
            <option value="all">All sponsors</option>
            <option value="global_biopharma">Global Biopharma Inc.</option>
            <option value="partner_alliance">Oncology Partner Alliance</option>
          </select>
        </div>

        <div class="grid grid-cols-2 gap-2">
          <div>
            <label for="phase-filter" class="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Phase</label>
            <select
              id="phase-filter"
              bind:value={selectedPhase}
              class="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg py-1.5 px-2 text-slate-800"
            >
              <option value="all">All</option>
              <option value="phase ii">Phase II</option>
              <option value="phase iii">Phase III</option>
              <option value="phase i/ii">Phase I/II</option>
            </select>
          </div>
          <div>
            <label for="country-filter" class="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Country</label>
            <select
              id="country-filter"
              bind:value={selectedCountry}
              class="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg py-1.5 px-2 text-slate-800"
            >
              <option value="all">All countries</option>
              {#each availableCountries as country}
                <option value={country}>{country}</option>
              {/each}
            </select>
          </div>
        </div>
      </div>

    </aside>

    <!-- ========================================================================= -->
    <!-- RIGHT COLUMN: MAIN PORTFOLIO CONTENT                                      -->
    <!-- ========================================================================= -->
    <div class="lg:col-span-3 space-y-5">
      
      <!-- Hero Banner + Featured Example Study Card (CA-209-301) (Image 3 Spec) -->
      <div class="relative rounded-2xl bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950 text-white p-6 overflow-hidden shadow-md border border-slate-800">
        <div class="absolute -right-10 -bottom-10 w-72 h-72 rounded-full bg-blue-500/10 blur-2xl pointer-events-none"></div>

        <div class="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          <div class="lg:col-span-7">
            <div class="text-[10px] font-extrabold uppercase tracking-widest text-blue-300 flex items-center space-x-2">
              <span>1. STUDY PORTFOLIO AND SELECTION &middot; ENTRY POINT</span>
            </div>
            <h1 class="text-2xl sm:text-3xl font-extrabold text-white mt-1.5 tracking-tight">
              Study portfolio, greater confidence.
            </h1>
            <p class="text-xs sm:text-sm text-slate-300 mt-2 leading-relaxed">
              Monitor studies approaching LSLV or DBL. Target DBL dates are shown unchanged alongside the <strong>Potential DBL date (based on current progress)</strong> to flag either a possible delay or an earlier completion.
            </p>
            <div class="mt-4 flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                on:click={() => onSelectStudy('CA-209-301')}
                class="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center space-x-1.5 shadow-sm transition-colors cursor-pointer"
              >
                <span>Open Study CA-209-301 Overview</span>
                <ArrowRight size={14} />
              </button>
              <button
                type="button"
                on:click={() => showDrillDownExplorer = !showDrillDownExplorer}
                class="px-3.5 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-blue-100 border border-white/20 font-semibold text-xs transition-colors cursor-pointer"
              >
                {showDrillDownExplorer ? 'Hide 4-Level Portfolio Drill-Down' : 'Explore 4-Level Portfolio Drill-Down'}
              </button>
            </div>
          </div>

          <!-- Featured Example Study Card: Study CA-209-301 (Exact Manager Spec from Image 3) -->
          <div
            class="lg:col-span-5 p-4 rounded-xl bg-white text-slate-900 border-2 border-blue-400 shadow-lg cursor-pointer hover:border-blue-300 transition-all"
            on:click={() => onSelectStudy('CA-209-301')}
            on:keydown={(e) => e.key === 'Enter' && onSelectStudy('CA-209-301')}
            role="button"
            tabindex="0"
          >
            <div class="flex items-center justify-between border-b border-slate-100 pb-2 mb-2.5">
              <div>
                <span class="text-[10px] font-extrabold uppercase tracking-wider text-blue-600 block">Featured Study Card</span>
                <h3 class="text-base font-extrabold text-slate-900">Study CA-209-301</h3>
              </div>
              <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                Oncology &middot; Phase III
              </span>
            </div>

            <ul class="space-y-1.5 text-xs text-slate-700">
              <li class="flex items-center justify-between">
                <span class="text-slate-500">Planned DBL (Target unchanged):</span>
                <strong class="font-bold text-slate-900">15 December 2026</strong>
              </li>
              <li class="flex items-center justify-between bg-blue-50/80 px-2 py-1 rounded border border-blue-100">
                <span class="text-blue-900 font-semibold">Potential DBL date (current progress):</span>
                <strong class="font-extrabold text-rose-600">21 December 2026 (+6d)</strong>
              </li>
              <li class="flex items-center justify-between pt-0.5">
                <span class="text-slate-500">Readiness (Clean-subject share):</span>
                <div class="text-right">
                  <strong class="font-extrabold text-slate-900">72/100</strong>
                  <span class="text-[10px] text-slate-500 block">158/220 clean &middot; 18 crit / 44 non-crit</span>
                </div>
              </li>
              <li class="flex items-center justify-between">
                <span class="text-slate-500">Critical blockers:</span>
                <strong class="font-bold text-rose-600">8</strong>
              </li>
              <li class="flex items-center justify-between">
                <span class="text-slate-500">High-risk sites:</span>
                <strong class="font-bold text-slate-900">3 of 18</strong>
              </li>
              <li class="flex items-center justify-between">
                <span class="text-slate-500">Trend:</span>
                <strong class="font-bold text-emerald-600 flex items-center space-x-1">
                  <TrendingUp size={12} />
                  <span>Improved by 1 day this week</span>
                </strong>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <!-- ===================================================================== -->
      <!-- MAIN STUDY PORTFOLIO TABLE / CARDS PANEL                              -->
      <!-- ===================================================================== -->
      <div class="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        
        <!-- Toolbar -->
        <div class="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div class="flex items-center space-x-2">
              <h2 class="text-base font-bold text-slate-900">Study portfolio ({sortedStudies.length} studies)</h2>
              <span class="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                Readiness = Clean Enrolled Subjects Share (Critical vs Non-Critical Weighted)
              </span>
            </div>
            <p class="text-xs text-slate-500 mt-0.5">
              Target DBL date is kept distinct from Potential DBL date (flags both delays and earlier completions).
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
                <option value="dbl_earliest">Potential DBL date (earliest)</option>
                <option value="delay_desc">Potential delay vs target (highest)</option>
                <option value="readiness_asc">Readiness score (lowest first)</option>
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
                <span>Study Cards</span>
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
                  <th class="py-3 px-4">Study ID &amp; TA</th>
                  <th class="py-3 px-2">Indication &amp; Phase</th>
                  <th class="py-3 px-2">Planned LSLV</th>
                  <th class="py-3 px-3">Target DBL (Unchanged)</th>
                  <th class="py-3 px-3">Potential DBL (Current Progress)</th>
                  <th class="py-3 px-3 text-center">Readiness &amp; Clean Subjects</th>
                  <th class="py-3 px-2 text-center">Critical Blockers</th>
                  <th class="py-3 px-2 text-center">High-Risk Sites</th>
                  <th class="py-3 px-3">Direction of Risk &amp; Trend</th>
                  <th class="py-3 px-3 text-right"></th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100 font-medium text-slate-700">
                {#each paginatedStudies as study}
                  <tr
                    class="hover:bg-blue-50/40 transition-colors cursor-pointer group {study.id === 'CA-209-301' ? 'bg-blue-50/30' : ''}"
                    on:click={() => onSelectStudy(study.id)}
                  >
                    <!-- Study ID & TA -->
                    <td class="py-3.5 px-4 font-bold text-slate-900 whitespace-nowrap">
                      <div class="flex items-center space-x-2">
                        <span class="w-1 h-9 rounded-full {study.status === 'High risk' ? 'bg-rose-500' : study.status === 'At risk' ? 'bg-amber-500' : 'bg-emerald-500'}"></span>
                        <div>
                          <span class="group-hover:text-blue-600 transition-colors">{study.id}</span>
                          <div class="text-[11px] font-normal text-slate-400" title={(study.countries || []).join(', ')}>{study.therapeuticArea} &middot; {formatStudyCountries(study.countries)}</div>
                        </div>
                      </div>
                    </td>

                    <!-- Indication & Phase -->
                    <td class="py-3.5 px-2">
                      <div class="text-slate-800 font-semibold">{study.indication}</div>
                      <div class="text-[10px] text-slate-400">{study.phase}</div>
                    </td>

                    <!-- Planned LSLV -->
                    <td class="py-3.5 px-2 text-slate-600 font-mono text-[11px] whitespace-nowrap">{study.plannedLslv}</td>

                    <!-- Target DBL (Unchanged) -->
                    <td class="py-3.5 px-3 whitespace-nowrap">
                      <div class="font-mono text-[11px] font-semibold text-slate-800">{study.plannedDblFormatted || study.plannedDbl}</div>
                      <span class="text-[10px] text-slate-400">Target unchanged</span>
                    </td>

                    <!-- Potential DBL Date vs Target Date (Flags delay or earlier completion) -->
                    <td class="py-3.5 px-3 whitespace-nowrap">
                      <div class="font-mono text-[11px] font-bold text-slate-900">{study.forecastDblFormatted || study.forecastDbl}</div>
                      {#if study.delayDays > 0}
                        <span class="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200 mt-0.5">
                          +{study.delayDays}d delay vs target
                        </span>
                      {:else if study.delayDays < 0}
                        <span class="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 mt-0.5">
                          {Math.abs(study.delayDays)}d earlier than target
                        </span>
                      {:else}
                        <span class="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 mt-0.5">
                          On target date (0d)
                        </span>
                      {/if}
                    </td>

                    <!-- Readiness as share of enrolled subjects without outstanding issues (Crit vs Non-Crit) -->
                    <td class="py-3.5 px-3 text-center">
                      <div class="flex flex-col items-center">
                        <span class="inline-flex items-center justify-center px-2 py-0.5 rounded-md font-bold text-xs border num-tabular {getReadinessPill(study.readinessScore)}">
                          {study.readinessScore}/100
                        </span>
                        {#if study.enrolledSubjects}
                          <span class="text-[10px] text-slate-600 font-semibold mt-1">
                            {study.cleanSubjects}/{study.enrolledSubjects} clean ({Math.round((study.cleanSubjects / study.enrolledSubjects) * 100)}%)
                          </span>
                          <span class="text-[9px] text-slate-400">
                            {study.criticalSubjects} crit &middot; {study.nonCriticalSubjects} non-crit
                          </span>
                        {/if}
                      </div>
                    </td>

                    <!-- Critical Blockers -->
                    <td class="py-3.5 px-2 text-center font-bold {study.criticalBlockers > 5 ? 'text-rose-600' : study.criticalBlockers > 0 ? 'text-amber-600' : 'text-slate-600'}">
                      {study.criticalBlockers}
                    </td>

                    <!-- High Risk Sites -->
                    <td class="py-3.5 px-2 text-center font-medium text-slate-600 whitespace-nowrap">
                      {study.highRiskSites}
                    </td>

                    <!-- Direction of Risk & Weekly Trend -->
                    <td class="py-3.5 px-3">
                      <div class="flex items-center space-x-1.5">
                        <span class="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold {study.riskDirection === 'Worsening' ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'}">
                          {study.riskDirection || 'Improving'}
                        </span>
                        <span class="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-bold border {getStatusBadge(study.status)}">
                          {study.status}
                        </span>
                      </div>
                      <div class="text-[10px] text-slate-500 mt-1">{study.weeklyTrendText || 'Improved by 1 day this week'}</div>
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
          <!-- Cards Grid View (Matches Image 3 Example Study Card layout) -->
          <div class="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
            {#each paginatedStudies as study}
              <div
                class="p-4 rounded-xl border {study.id === 'CA-209-301' ? 'border-blue-400 bg-blue-50/10' : 'border-slate-200 bg-white'} hover:border-blue-400 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
                on:click={() => onSelectStudy(study.id)}
                on:keydown={(e) => e.key === 'Enter' && onSelectStudy(study.id)}
                role="button"
                tabindex="0"
              >
                <div>
                  <div class="flex items-center justify-between mb-1.5">
                    <span class="font-extrabold text-sm text-slate-900 group-hover:text-blue-600 transition-colors">
                      Study {study.id}
                    </span>
                    <div class="flex items-center space-x-1.5">
                      <span class="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold {study.riskDirection === 'Worsening' ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'}">
                        {study.riskDirection || 'Improving'}
                      </span>
                      <span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border {getStatusBadge(study.status)}">
                        {study.status}
                      </span>
                    </div>
                  </div>
                  <div class="text-xs font-semibold text-slate-800">{study.name} &middot; {study.indication}</div>
                  <div class="text-[11px] text-slate-500 mt-0.5" title={(study.countries || []).join(', ')}>{study.therapeuticArea} &middot; {study.phase} &middot; {formatStudyCountries(study.countries)}</div>

                  <ul class="mt-3 space-y-1.5 text-xs bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <li class="flex justify-between">
                      <span class="text-slate-500">Planned DBL (Target unchanged):</span>
                      <strong class="text-slate-900">{study.plannedDblFormatted || study.plannedDbl}</strong>
                    </li>
                    <li class="flex justify-between">
                      <span class="text-blue-800 font-semibold">Potential DBL date (current progress):</span>
                      <strong class="{study.delayDays > 0 ? 'text-rose-600' : study.delayDays < 0 ? 'text-emerald-600' : 'text-slate-900'}">
                        {study.forecastDblFormatted || study.forecastDbl}
                        ({study.delayDays > 0 ? `+${study.delayDays}d delay` : study.delayDays < 0 ? `${Math.abs(study.delayDays)}d early` : 'On target'})
                      </strong>
                    </li>
                    <li class="flex justify-between">
                      <span class="text-slate-500">Readiness:</span>
                      <strong class="text-slate-900">
                        {study.readinessScore}/100
                        {#if study.enrolledSubjects}
                          <span class="text-[10px] font-normal text-slate-500">({study.cleanSubjects}/{study.enrolledSubjects} clean subjects)</span>
                        {/if}
                      </strong>
                    </li>
                    <li class="flex justify-between">
                      <span class="text-slate-500">Critical blockers:</span>
                      <strong class="text-rose-600">{study.criticalBlockers}</strong>
                    </li>
                    <li class="flex justify-between">
                      <span class="text-slate-500">High-risk sites:</span>
                      <strong class="text-slate-900">{study.highRiskSites}</strong>
                    </li>
                    <li class="flex justify-between">
                      <span class="text-slate-500">Trend:</span>
                      <strong class="{study.riskDirection === 'Worsening' ? 'text-rose-600' : 'text-emerald-600'}">{study.weeklyTrendText}</strong>
                    </li>
                  </ul>
                </div>

                <div class="flex items-center justify-between pt-3 mt-2 border-t border-slate-100 text-xs">
                  <span class="text-slate-400 text-[10px]">Planned LSLV: {study.plannedLslv}</span>
                  <span class="text-blue-600 font-bold flex items-center space-x-1 group-hover:translate-x-1 transition-transform">
                    <span>Open Study Overview</span>
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
            Showing <span class="font-bold text-slate-800">1–{Math.min(paginatedStudies.length, pageSize)}</span> of <span class="font-bold text-slate-800">{sortedStudies.length}</span> DBL-window studies
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

      <!-- ===================================================================== -->
      <!-- 4-LEVEL PORTFOLIO DRILL-DOWN EXPLORER (Image 4 Blue Spec)             -->
      <!-- Level 1: Portfolio -> Therapeutic area -> searchable Study ID         -->
      <!-- Level 2: Study card -> milestone (LSLV, DBL) -> critical blockers     -->
      <!-- Level 3: Blocker -> affected country -> site -> subject               -->
      <!-- Level 4 (record): query, SAE, lab transfer or sign-off item           -->
      <!-- ===================================================================== -->
      {#if showDrillDownExplorer}
        <div class="bg-white rounded-xl border-2 border-blue-200 p-5 shadow-xs space-y-4">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
            <div>
              <div class="flex items-center space-x-2">
                <Layers size={16} class="text-blue-600" />
                <h3 class="text-sm font-extrabold text-slate-900">
                  Interactive 4-Level Portfolio Traceability Drill-Down
                </h3>
                <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                  Level 1 &rarr; Level 2 &rarr; Level 3 &rarr; Level 4 (Source Record)
                </span>
              </div>
              <p class="text-[11px] text-slate-500 mt-0.5">
                Trace directly from Portfolio selection down to individual queries, SAE discrepancies, lab transfers, and sign-off records.
              </p>
            </div>
            <button
              type="button"
              on:click={() => onSelectStudy('CA-209-301')}
              class="px-3 py-1.5 rounded-lg bg-blue-600 text-white font-bold text-xs hover:bg-blue-700 transition-colors shrink-0 cursor-pointer"
            >
              Open Full Study CA-209-301 &rarr;
            </button>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
            <!-- LEVEL 1 -->
            <div class="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <div class="text-[10px] font-extrabold uppercase tracking-wider text-blue-700">
                Level 1: Portfolio &rarr; TA &rarr; Study ID
              </div>
              <div class="p-2.5 bg-white rounded-lg border border-slate-200 space-y-1">
                <div class="text-[10px] text-slate-400 font-semibold">Therapeutic Area</div>
                <div class="font-bold text-slate-900">Oncology (Selected)</div>
                <div class="text-[10px] text-slate-400 font-semibold pt-1">Searchable Study ID</div>
                <div class="font-extrabold text-blue-700">CA-209-301 (ONCO-STAR 301)</div>
                <div class="text-[10px] text-slate-500">Readiness: 72/100 (158/220 clean)</div>
              </div>
            </div>

            <!-- LEVEL 2 -->
            <div class="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <div class="text-[10px] font-extrabold uppercase tracking-wider text-blue-700">
                Level 2: Study Card &rarr; Milestone &rarr; Blockers
              </div>
              <div class="text-[11px] font-semibold text-slate-700">
                Milestone: <strong class="text-slate-900">DBL (Target: 15 Dec | Potential: 21 Dec)</strong>
              </div>
              <div class="space-y-1.5">
                {#each criticalBlockersCatalog as blk}
                  <button
                    type="button"
                    on:click={() => selectedBlockerId = blk.id}
                    class="w-full text-left p-2 rounded-lg border transition-all cursor-pointer {selectedBlockerId === blk.id ? 'bg-blue-600 text-white border-blue-600 font-bold shadow-xs' : 'bg-white text-slate-700 border-slate-200 hover:border-blue-300'}"
                  >
                    <div class="flex items-center justify-between text-[11px]">
                      <span class="truncate">{blk.domain}</span>
                      <span class="font-mono text-[10px] {selectedBlockerId === blk.id ? 'text-blue-100' : 'text-rose-600 font-bold'}">{blk.impactDays}</span>
                    </div>
                  </button>
                {/each}
              </div>
            </div>

            <!-- LEVEL 3 -->
            <div class="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <div class="text-[10px] font-extrabold uppercase tracking-wider text-blue-700">
                Level 3: Blocker &rarr; Country &rarr; Site &rarr; Subject
              </div>
              <div class="p-2.5 bg-white rounded-lg border border-slate-200 space-y-1.5">
                <div>
                  <span class="text-[10px] text-slate-400 uppercase font-bold block">Selected Blocker</span>
                  <strong class="text-slate-900 text-[11px]">{activeBlocker.title}</strong>
                </div>
                <div>
                  <span class="text-[10px] text-slate-400 uppercase font-bold block">Affected Country</span>
                  <span class="font-semibold text-slate-800">{activeBlocker.country}</span>
                </div>
                <div>
                  <span class="text-[10px] text-slate-400 uppercase font-bold block">Affected Site</span>
                  <button
                    type="button"
                    on:click={() => onSelectSite(activeBlocker.siteId)}
                    class="text-blue-600 hover:underline font-bold text-left cursor-pointer"
                  >
                    {activeBlocker.siteName} &rarr;
                  </button>
                </div>
                <div>
                  <span class="text-[10px] text-slate-400 uppercase font-bold block">Affected Subjects</span>
                  <div class="flex flex-wrap gap-1 mt-0.5">
                    {#each activeBlocker.subjectIds as sId}
                      <span class="px-1.5 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200 font-mono text-[10px] font-bold">
                        {sId}
                      </span>
                    {/each}
                  </div>
                </div>
              </div>
            </div>

            <!-- LEVEL 4 (RECORD) -->
            <div class="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <div class="text-[10px] font-extrabold uppercase tracking-wider text-blue-700">
                Level 4 (Record): Source, ID, Age &amp; Refresh
              </div>
              <div class="space-y-2">
                {#each activeBlocker.records as rec}
                  <div class="p-2.5 bg-white rounded-lg border border-slate-200 space-y-1">
                    <div class="flex items-center justify-between">
                      <span class="font-mono font-bold text-slate-900 text-[11px]">{rec.recordId}</span>
                      <span class="px-1.5 py-0.5 rounded bg-rose-100 text-rose-800 text-[9px] font-bold">{rec.criticality}</span>
                    </div>
                    <div class="text-[11px] font-semibold text-slate-800 leading-snug">{rec.type}</div>
                    <div class="text-[10px] text-slate-500"><strong>Subject:</strong> {rec.subjectId}</div>
                    <div class="text-[10px] text-slate-500"><strong>Source:</strong> {rec.sourceSystem}</div>
                    <div class="text-[10px] text-rose-600 font-semibold"><strong>Age:</strong> {rec.age}</div>
                    <div class="text-[10px] text-slate-400 font-mono"><strong>Refreshed:</strong> {rec.lastRefresh}</div>
                  </div>
                {/each}
              </div>
            </div>
          </div>
        </div>
      {/if}

    </div>

  </div>
</div>
