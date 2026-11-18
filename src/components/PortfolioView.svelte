<script lang="ts">
  import {
    Search,
    SlidersHorizontal,
    Table,
    LayoutGrid,
    ArrowRight,
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
  <!-- PAGE HEADER                                                               -->
  <!-- ========================================================================= -->
  <div class="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-1">
    <div>
      <h1 class="text-2xl sm:text-[28px] font-bold tracking-tight text-slate-900 font-display">
        Study Portfolio
      </h1>
      <p class="text-sm text-slate-500 mt-1">
        Monitor database lock readiness, target variance, and critical-path blockers across active studies.
      </p>
    </div>
    <div class="flex items-center gap-2.5 shrink-0">
      <button
        type="button"
        on:click={() => showCalcDefinitions = !showCalcDefinitions}
        class="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200/90 font-semibold text-xs shadow-2xs transition-colors cursor-pointer"
      >
        <Info size={14} class="text-blue-600" />
        <span>{showCalcDefinitions ? 'Hide Metric Definitions' : 'Metric Definitions & Formulas'}</span>
      </button>
      <button
        type="button"
        on:click={() => onSelectStudy('CA-209-301')}
        class="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-xs transition-colors cursor-pointer"
      >
        <span>Open Study CA-209-301</span>
        <ArrowRight size={14} />
      </button>
    </div>
  </div>

  {#if showCalcDefinitions}
    <div class="db-card p-5 space-y-4">
      <div class="flex items-center justify-between border-b border-slate-100 pb-3">
        <div class="flex items-center gap-2">
          <Info size={16} class="text-blue-600" />
          <span class="text-sm font-bold text-slate-900">Metric Basis &amp; Calculation Methodology</span>
          <span class="px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-600">
            Illustrative Prototype Values
          </span>
        </div>
        <button
          type="button"
          on:click={() => showCalcDefinitions = false}
          class="text-xs font-semibold text-slate-500 hover:text-slate-800 cursor-pointer"
        >
          Close
        </button>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
        <div class="bg-white p-3 rounded-lg border border-blue-100">
          <div class="font-bold text-slate-900">1. DBL Readiness Score (72/100)</div>
          <p class="text-[11px] text-slate-600 mt-1 leading-relaxed">
            <strong>Calculation:</strong> Clean enrolled subject share (<code>158/220 = 71.8%</code>), rolled up from 5 weighted subsections (<code>round(&Sigma;(Score&times;Weight)/100 &minus; 6.45)</code>) with critical blockers penalized <code>2.0x</code> vs non-critical <code>0.5x</code>:
          </p>
          <ul class="text-[10px] text-slate-600 mt-1 space-y-0.5 list-disc list-inside">
            <li><strong>EDC (30%):</strong> eCRF pages (92%), queries (85%), SDV/SDR (87%)</li>
            <li><strong>External (25%):</strong> Lab/eCOA/Imaging/Safety feeds (143/220 = 65%)</li>
            <li><strong>Site (20%):</strong> PI-signed casebooks (165/220 = 75%)</li>
            <li><strong>CDM (15%):</strong> Coding (90%) &amp; SAE recon (80%)</li>
            <li><strong>Cross-functional (10%):</strong> Clinical/PV/Biostats sign-offs (80%)</li>
          </ul>
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

      <!-- Full 5-Subsection Readiness Score Formula & Worked Example (Below the 4 Cards) -->
      <div class="mt-3 bg-white p-3.5 rounded-lg border border-blue-200 text-xs space-y-2">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div class="font-bold text-slate-900">
            Readiness Score Formula (5-Subsection Roll-Up &amp; Criticality Weighting)
          </div>
          <code class="text-[11px] bg-blue-50 text-blue-900 px-2 py-0.5 rounded border border-blue-200 font-mono">
            Readiness = round((&Sigma;(Score &times; Weight) / &Sigma;Weight) &minus; 6.45)
          </code>
        </div>
        <div class="text-[11px] text-slate-700 leading-relaxed">
          <strong>CA-209-301 Example:</strong>
          <code class="bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200 text-slate-800">
            round(((88&times;30 + 65&times;25 + 75&times;20 + 85&times;15 + 80&times;10) / 100) &minus; 6.45) = round(78.40 &minus; 6.45) = 72/100
          </code>
          <span class="text-slate-500 ml-1">(Matches 158/220 = 71.8% clean enrolled subjects; Critical blockers penalized <strong>2.0x</strong> vs Non-critical <strong>0.5x</strong>)</span>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-5 gap-2 pt-1 text-[10px] text-slate-600">
          <div class="bg-slate-50 p-2 rounded border border-slate-100">
            <div class="font-bold text-slate-800">1. EDC Cleanliness (30%)</div>
            <div>eCRF 2,944/3,200 (92%), Queries 385/453 (85%), SDV 191/220 (87%) &rarr; <strong>88%</strong></div>
          </div>
          <div class="bg-slate-50 p-2 rounded border border-slate-100">
            <div class="font-bold text-slate-800">2. External Recon (25%)</div>
            <div>143/220 subjects with reconciled Lab, eCOA, Imaging &amp; Safety &rarr; <strong>65%</strong></div>
          </div>
          <div class="bg-slate-50 p-2 rounded border border-slate-100">
            <div class="font-bold text-slate-800">3. Site Readiness (20%)</div>
            <div>165/220 PI-signed casebooks (18 overdue &gt;7d at 2.0x) &rarr; <strong>75%</strong></div>
          </div>
          <div class="bg-slate-50 p-2 rounded border border-slate-100">
            <div class="font-bold text-slate-800">4. CDM Completion (15%)</div>
            <div>Avg of Coding 1,890/2,100 (90%) &amp; SAE Recon 82/84 (adj. 80%) &rarr; <strong>85%</strong></div>
          </div>
          <div class="bg-slate-50 p-2 rounded border border-slate-100">
            <div class="font-bold text-slate-800">5. Cross-Functional (10%)</div>
            <div>Clinical, PV/Safety, Biostats &amp; Regulatory sign-offs (4/5) &rarr; <strong>80%</strong></div>
          </div>
        </div>
      </div>
    </div>
  {/if}

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
                  Study milestones, blockers, and source records
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
            <div class="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <div class="text-[10px] font-extrabold uppercase tracking-wider text-blue-700">
                Portfolio &rarr; TA &rarr; Study ID
              </div>
              <div class="p-2.5 bg-white rounded-lg border border-slate-200 space-y-1">
                <div class="text-[10px] text-slate-400 font-semibold">Therapeutic Area</div>
                <div class="font-bold text-slate-900">Oncology (Selected)</div>
                <div class="text-[10px] text-slate-400 font-semibold pt-1">Searchable Study ID</div>
                <div class="font-extrabold text-blue-700">CA-209-301 (ONCO-STAR 301)</div>
                <div class="text-[10px] text-slate-500">Readiness: 72/100 (158/220 clean)</div>
              </div>
            </div>

            <div class="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <div class="text-[10px] font-extrabold uppercase tracking-wider text-blue-700">
                Study Card &rarr; Milestone &rarr; Blockers
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

            <div class="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <div class="text-[10px] font-extrabold uppercase tracking-wider text-blue-700">
                Blocker &rarr; Country &rarr; Site &rarr; Subject
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

            <div class="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <div class="text-[10px] font-extrabold uppercase tracking-wider text-blue-700">
                Source, ID, Age &amp; Refresh
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
