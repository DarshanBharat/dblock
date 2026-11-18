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
      title: '18 Pending Principal Investigator 21 CFR Part 11 e-Signatures',
      domain: 'Site Sign-offs',
      impactDays: '+0.8 days',
      country: 'United States (US), South Korea (KR), Germany (DE)',
      siteId: '405',
      siteName: 'Site 405 – Seoul National Univ. (6), Site 104 – Boston (8), Site 317 – Berlin (4)',
      subjectIds: ['SUBJ-104-003', 'SUBJ-317-005'],
      records: [
        {
          recordId: 'SIG-405-DOA',
          type: 'PI Electronic Casebook Sign-off (6 completed casebooks at Site 405; 18 study-wide)',
          subjectId: 'Site 405 Cohort (6 clean casebooks)',
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
    if (selectedTherapeuticArea !== 'all' && s.therapeuticArea.toLowerCase() !== selectedTherapeuticArea.toLowerCase()) return false;
    if (selectedStudyIdDropdown !== 'all' && s.id !== selectedStudyIdDropdown) return false;
    if (studyIdSearch.trim()) {
      const q = studyIdSearch.toLowerCase();
      const match = s.id.toLowerCase().includes(q) ||
        s.name.toLowerCase().includes(q) ||
        s.indication.toLowerCase().includes(q) ||
        s.therapeuticArea.toLowerCase().includes(q);
      if (!match) return false;
    }
    if (s.milestones && s.milestones.length > 0) {
      const hasMatchingMilestone = s.milestones.some((m: string) => selectedMilestones.includes(m));
      if (!hasMatchingMilestone) return false;
    }
    if (selectedSponsor !== 'all' && s.sponsor && s.sponsor !== selectedSponsor) return false;
    if (s.status === 'On track' && !showOnTrack) return false;
    if (s.status === 'At risk' && !showAtRisk) return false;
    if (s.status === 'High risk' && !showHighRisk) return false;
    if (selectedRiskDirection !== 'all' && s.riskDirection !== selectedRiskDirection) return false;
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
  $: totalCriticalBlockers = filteredStudies.reduce((acc, s) => acc + (s.criticalBlockers || 0), 0);
  $: avgReadiness = filteredStudies.length
    ? Math.round(filteredStudies.reduce((acc, s) => acc + s.readinessScore, 0) / filteredStudies.length)
    : 0;
</script>

<div class="space-y-6">

  <!-- ========================================================================= -->
  <!-- PAGE HEADER                                                               -->
  <!-- ========================================================================= -->
  <div class="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
    <div>
      <h1 class="text-2xl sm:text-[28px] font-semibold tracking-tight text-slate-900 font-display">
        Clinical Study Portfolio
      </h1>
      <p class="text-sm text-slate-500 mt-1">
        Database lock readiness, target variance, and critical-path blockers across global clinical trials.
      </p>
    </div>
    <div class="flex items-center gap-2.5 shrink-0">
      <button
        type="button"
        on:click={() => showCalcDefinitions = !showCalcDefinitions}
        class="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200/80 font-medium text-xs shadow-2xs transition-colors cursor-pointer"
      >
        <Info size={14} class="text-slate-500" />
        <span>{showCalcDefinitions ? 'Hide Scoring Model' : 'Scoring Methodology'}</span>
      </button>
      <button
        type="button"
        on:click={() => onSelectStudy('CA-209-301')}
        class="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs shadow-xs transition-colors cursor-pointer"
      >
        <span>Open Study CA-209-301</span>
        <ArrowRight size={14} />
      </button>
    </div>
  </div>

  <!-- ========================================================================= -->
  <!-- TOP-LEVEL PORTFOLIO KPI STRIP (Clean Apple/Linear Metric Row)             -->
  <!-- ========================================================================= -->
  <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
    <div class="db-card p-5">
      <div class="text-xs font-medium text-slate-500">Active DBL Window Studies</div>
      <div class="mt-2 flex items-baseline gap-2">
        <span class="text-3xl font-semibold tracking-tight text-slate-900 num-tabular font-display">{filteredStudies.length}</span>
        <span class="text-xs text-slate-400">of 1,240 global protocols</span>
      </div>
    </div>
    <div class="db-card p-5">
      <div class="text-xs font-medium text-slate-500">Mean Portfolio Readiness</div>
      <div class="mt-2 flex items-baseline gap-2">
        <span class="text-3xl font-semibold tracking-tight text-slate-900 num-tabular font-display">{avgReadiness}%</span>
        <span class="text-xs text-emerald-600 font-medium">+2.4% vs W-1</span>
      </div>
    </div>
    <div class="db-card p-5">
      <div class="text-xs font-medium text-slate-500">Studies At Risk / Delayed</div>
      <div class="mt-2 flex items-baseline gap-2">
        <span class="text-3xl font-semibold tracking-tight text-slate-900 num-tabular font-display">
          {filteredStudies.filter(s => s.status !== 'On track').length}
        </span>
        <span class="text-xs text-amber-600 font-medium">
          {filteredStudies.filter(s => s.status === 'High risk').length} high risk (&gt;5d slip)
        </span>
      </div>
    </div>
    <div class="db-card p-5">
      <div class="text-xs font-medium text-slate-500">Open Hard-Gate Blockers</div>
      <div class="mt-2 flex items-baseline gap-2">
        <span class="text-3xl font-semibold tracking-tight text-rose-600 num-tabular font-display">{totalCriticalBlockers}</span>
        <span class="text-xs text-slate-500">8 on CA-209-301</span>
      </div>
    </div>
  </div>

  {#if showCalcDefinitions}
    <div class="db-card p-6 space-y-4">
      <div class="flex items-center justify-between border-b border-slate-100 pb-3">
        <div class="flex items-center gap-2">
          <Info size={16} class="text-blue-600" />
          <span class="text-sm font-semibold text-slate-900">Readiness Scoring &amp; Critical-Path Forecast Model</span>
        </div>
        <button
          type="button"
          on:click={() => showCalcDefinitions = false}
          class="text-xs font-medium text-slate-500 hover:text-slate-800 cursor-pointer"
        >
          Close
        </button>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
        <div class="p-4 rounded-xl bg-slate-50/70 border border-slate-200/60">
          <div class="font-semibold text-slate-900">1. Clean Subject Readiness (72%)</div>
          <p class="text-slate-600 mt-1.5 leading-relaxed">
            Share of enrolled subjects meeting all 6 lock criteria (<code>158 / 220 = 71.8%</code>), rolled up across EDC (30%), External Data (25%), Site Sign-offs (20%), CDM/Coding (15%), and Governance (10%).
          </p>
        </div>
        <div class="p-4 rounded-xl bg-slate-50/70 border border-slate-200/60">
          <div class="font-semibold text-slate-900">2. Target vs Forecast DBL</div>
          <p class="text-slate-600 mt-1.5 leading-relaxed">
            Protocol Target DBL (<code>15 Dec 2026</code>) remains fixed. Forecast DBL (<code>21 Dec 2026</code>) projects critical-path blocker resolution velocity and vendor SLA turnaround.
          </p>
        </div>
        <div class="p-4 rounded-xl bg-slate-50/70 border border-slate-200/60">
          <div class="font-semibold text-slate-900">3. Risk Classification Tiers</div>
          <p class="text-slate-600 mt-1.5 leading-relaxed">
            <strong>Critical:</strong> &gt;80% slip risk or &gt;5d impact<br/>
            <strong>High:</strong> 60–80% risk or 3–5d impact<br/>
            <strong>Medium:</strong> 30–60% risk or 1–3d impact<br/>
            <strong>Low:</strong> &lt;30% risk and &lt;1d impact
          </p>
        </div>
        <div class="p-4 rounded-xl bg-slate-50/70 border border-slate-200/60">
          <div class="font-semibold text-slate-900">4. Hard-Gate Blockers</div>
          <p class="text-slate-600 mt-1.5 leading-relaxed">
            Count of open records directly preventing safety database freeze (SDTM.AE/DD), primary endpoint lock (SDTM.TU), central lab lock, or 21 CFR Part 11 PI e-signature.
          </p>
        </div>
      </div>
    </div>
  {/if}

  <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
    
    <!-- ========================================================================= -->
    <!-- LEFT COLUMN: REFINED FILTERS RAIL (3 cols)                                -->
    <!-- ========================================================================= -->
    <aside class="lg:col-span-3 db-card p-5 space-y-5">
      <div class="flex items-center justify-between pb-3 border-b border-slate-100">
        <h3 class="font-semibold text-slate-900 text-sm flex items-center gap-2">
          <SlidersHorizontal size={15} class="text-slate-500" />
          <span>Filters</span>
        </h3>
        <button
          on:click={clearAllFilters}
          class="text-xs text-blue-600 hover:text-blue-800 font-medium cursor-pointer"
        >
          Reset
        </button>
      </div>

      <!-- Therapeutic Area -->
      <div class="space-y-1.5">
        <label for="ta-filter" class="text-xs font-medium text-slate-700 block">
          Therapeutic Area
        </label>
        <div class="relative">
          <select
            id="ta-filter"
            bind:value={selectedTherapeuticArea}
            on:change={() => { selectedStudyIdDropdown = 'all'; currentPage = 1; }}
            class="w-full text-xs bg-slate-50/80 border border-slate-200/90 rounded-xl py-2.5 px-3 text-slate-900 font-medium appearance-none focus:outline-hidden focus:border-blue-500 focus:bg-white transition-colors"
          >
            <option value="all">All Therapeutic Areas (12)</option>
            <option value="oncology">Oncology (3)</option>
            <option value="cardiovascular">Cardiovascular (1)</option>
            <option value="immunology">Immunology (1)</option>
            <option value="neurology">Neurology (1)</option>
            <option value="rare disease">Rare Disease (1)</option>
            <option value="gastroenterology">Gastroenterology (1)</option>
            <option value="vaccines">Vaccines (1)</option>
            <option value="metabolic">Metabolic (1)</option>
            <option value="respiratory">Respiratory (1)</option>
            <option value="hematology">Hematology (1)</option>
          </select>
          <ChevronDown size={14} class="absolute right-3 top-3 text-slate-400 pointer-events-none" />
        </div>
      </div>

      <!-- Study Protocol Search -->
      <div class="space-y-1.5">
        <div class="flex items-center justify-between">
          <label for="study-id-search" class="text-xs font-medium text-slate-700 block">
            Protocol / Study ID
          </label>
          <span class="text-[11px] text-slate-400 num-tabular">{taFilteredStudiesForIdList.length} available</span>
        </div>

        <div class="relative">
          <Search size={13} class="absolute left-3 top-2.5 text-slate-400" />
          <input
            id="study-id-search"
            type="text"
            bind:value={studyIdSearch}
            on:focus={() => showStudyDropdown = true}
            on:blur={() => setTimeout(() => showStudyDropdown = false, 180)}
            placeholder="Search protocol or indication..."
            class="w-full text-xs bg-slate-50/80 border border-slate-200/90 rounded-xl py-2 pl-8 pr-3 text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-blue-500 focus:bg-white transition-colors"
          />
          {#if showStudyDropdown}
            <div class="absolute left-0 right-0 top-10 bg-white border border-slate-200 rounded-xl shadow-lg max-h-52 overflow-y-auto z-30 divide-y divide-slate-100 text-xs">
              <button
                type="button"
                on:mousedown={() => { selectedStudyIdDropdown = 'all'; studyIdSearch = ''; }}
                class="w-full text-left px-3 py-2 hover:bg-slate-50 font-medium text-blue-600"
              >
                Show all matching studies ({taFilteredStudiesForIdList.length})
              </button>
              {#each taFilteredStudiesForIdList as st}
                <button
                  type="button"
                  on:mousedown={() => { selectedStudyIdDropdown = st.id; studyIdSearch = st.id; }}
                  class="w-full text-left px-3 py-2 hover:bg-slate-50 flex items-center justify-between"
                >
                  <div>
                    <span class="font-semibold text-slate-900 font-mono">{st.id}</span>
                    <span class="text-[11px] text-slate-500 ml-1">&middot; {st.indication}</span>
                  </div>
                  <span class="text-[11px] font-mono text-slate-500 num-tabular">{st.readinessScore}%</span>
                </button>
              {/each}
            </div>
          {/if}
        </div>
      </div>

      <!-- Milestone Scope -->
      <div class="space-y-2 pt-3 border-t border-slate-100">
        <span class="text-xs font-medium text-slate-700 block">
          Active Milestone Gates
        </span>
        <div class="space-y-1.5 text-xs text-slate-600">
          {#each milestoneOptions as mOpt}
            <label class="flex items-center gap-2.5 cursor-pointer hover:text-slate-900 py-0.5">
              <input
                type="checkbox"
                checked={selectedMilestones.includes(mOpt.id)}
                on:change={() => toggleMilestone(mOpt.id)}
                class="rounded text-slate-900 focus:ring-blue-500 w-3.5 h-3.5"
              />
              <span>{mOpt.label}</span>
            </label>
          {/each}
        </div>
      </div>

      <!-- Readiness Status & Trajectory -->
      <div class="space-y-2.5 pt-3 border-t border-slate-100">
        <span class="text-xs font-medium text-slate-700 block">Readiness Status</span>
        <div class="space-y-1.5 text-xs text-slate-600">
          <label class="flex items-center justify-between cursor-pointer hover:text-slate-900 py-0.5">
            <div class="flex items-center gap-2.5">
              <input type="checkbox" bind:checked={showOnTrack} class="rounded text-slate-900 focus:ring-blue-500 w-3.5 h-3.5" />
              <span class="flex items-center gap-1.5">
                <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span>On Track (&ge;90%)</span>
              </span>
            </div>
            <span class="text-xs text-slate-400 num-tabular">4</span>
          </label>
          <label class="flex items-center justify-between cursor-pointer hover:text-slate-900 py-0.5">
            <div class="flex items-center gap-2.5">
              <input type="checkbox" bind:checked={showAtRisk} class="rounded text-slate-900 focus:ring-blue-500 w-3.5 h-3.5" />
              <span class="flex items-center gap-1.5">
                <span class="w-2 h-2 rounded-full bg-amber-500"></span>
                <span>At Risk (70–89%)</span>
              </span>
            </div>
            <span class="text-xs text-slate-400 num-tabular">5</span>
          </label>
          <label class="flex items-center justify-between cursor-pointer hover:text-slate-900 py-0.5">
            <div class="flex items-center gap-2.5">
              <input type="checkbox" bind:checked={showHighRisk} class="rounded text-slate-900 focus:ring-blue-500 w-3.5 h-3.5" />
              <span class="flex items-center gap-1.5">
                <span class="w-2 h-2 rounded-full bg-rose-500"></span>
                <span>High Risk (&lt;70%)</span>
              </span>
            </div>
            <span class="text-xs text-slate-400 num-tabular">3</span>
          </label>
        </div>

        <div class="pt-1">
          <label for="risk-dir-select" class="text-xs font-medium text-slate-700 block mb-1.5">Weekly Trajectory</label>
          <select
            id="risk-dir-select"
            bind:value={selectedRiskDirection}
            class="w-full text-xs bg-slate-50/80 border border-slate-200/90 rounded-xl py-2 px-2.5 text-slate-800"
          >
            <option value="all">All Trajectories</option>
            <option value="Improving">Improving vs W-1</option>
            <option value="Worsening">Slipping vs W-1</option>
          </select>
        </div>
      </div>

      <!-- Phase & Country -->
      <div class="grid grid-cols-2 gap-2.5 pt-3 border-t border-slate-100">
        <div>
          <label for="phase-filter" class="text-xs font-medium text-slate-700 block mb-1">Phase</label>
          <select
            id="phase-filter"
            bind:value={selectedPhase}
            class="w-full text-xs bg-slate-50/80 border border-slate-200/90 rounded-xl py-2 px-2.5 text-slate-800"
          >
            <option value="all">All</option>
            <option value="phase ii">Phase II</option>
            <option value="phase iii">Phase III</option>
            <option value="phase i/ii">Phase I/II</option>
          </select>
        </div>
        <div>
          <label for="country-filter" class="text-xs font-medium text-slate-700 block mb-1">Country</label>
          <select
            id="country-filter"
            bind:value={selectedCountry}
            class="w-full text-xs bg-slate-50/80 border border-slate-200/90 rounded-xl py-2 px-2.5 text-slate-800"
          >
            <option value="all">All</option>
            {#each availableCountries as country}
              <option value={country}>{country}</option>
            {/each}
          </select>
        </div>
      </div>
    </aside>

    <!-- ========================================================================= -->
    <!-- RIGHT COLUMN: MAIN PORTFOLIO TABLE & CARDS (9 cols)                       -->
    <!-- ========================================================================= -->
    <div class="lg:col-span-9 space-y-5">

      <div class="db-card overflow-hidden">
        
        <!-- Clean Toolbar -->
        <div class="px-5 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div class="flex items-center gap-2.5">
            <h2 class="text-base font-semibold text-slate-900">Studies in Lock Window</h2>
            <span class="px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600 num-tabular">
              {sortedStudies.length}
            </span>
          </div>

          <div class="flex items-center gap-3 self-end sm:self-center">
            <div class="flex items-center gap-1.5 text-xs text-slate-500">
              <span>Sort:</span>
              <select
                bind:value={sortBy}
                class="bg-slate-50/90 border border-slate-200/80 rounded-lg py-1.5 px-2.5 text-xs font-medium text-slate-800 focus:outline-hidden"
              >
                <option value="dbl_earliest">Forecast DBL (Earliest)</option>
                <option value="delay_desc">Schedule Variance (Highest)</option>
                <option value="readiness_asc">Readiness Score (Lowest)</option>
              </select>
            </div>

            <div class="db-segmented">
              <button
                on:click={() => viewLayout = 'table'}
                class="db-segmented-btn flex items-center gap-1.5 {viewLayout === 'table' ? 'active' : ''}"
              >
                <Table size={13} />
                <span>Table</span>
              </button>
              <button
                on:click={() => viewLayout = 'cards'}
                class="db-segmented-btn flex items-center gap-1.5 {viewLayout === 'cards' ? 'active' : ''}"
              >
                <LayoutGrid size={13} />
                <span>Cards</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Table Layout -->
        {#if viewLayout === 'table'}
          <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse text-xs">
              <thead>
                <tr class="border-b border-slate-100 text-slate-400 text-[11px] font-medium">
                  <th class="py-3 pl-5 pr-3 font-medium">Study Protocol</th>
                  <th class="py-3 px-3 font-medium">Indication &amp; Phase</th>
                  <th class="py-3 px-3 font-medium">LSLV Cut-Off</th>
                  <th class="py-3 px-3 font-medium">Target DBL</th>
                  <th class="py-3 px-3 font-medium">Forecast DBL</th>
                  <th class="py-3 px-3 font-medium">Clean Patient Readiness</th>
                  <th class="py-3 px-2 text-center font-medium">Blockers</th>
                  <th class="py-3 px-2 text-center font-medium">High-Risk Sites</th>
                  <th class="py-3 px-3 font-medium">Status &amp; Velocity</th>
                  <th class="py-3 pl-2 pr-5 text-right font-medium"></th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100/90 text-slate-700">
                {#each paginatedStudies as study}
                  <tr
                    class="hover:bg-slate-50/80 transition-colors cursor-pointer group {study.id === 'CA-209-301' ? 'bg-blue-50/20' : ''}"
                    on:click={() => onSelectStudy(study.id)}
                  >
                    <!-- Protocol & TA -->
                    <td class="py-4 pl-5 pr-3 whitespace-nowrap">
                      <div class="flex items-center gap-2.5">
                        <span class="w-2 h-2 rounded-full shrink-0 {study.status === 'High risk' ? 'bg-rose-500' : study.status === 'At risk' ? 'bg-amber-500' : 'bg-emerald-500'}"></span>
                        <div>
                          <div class="font-semibold text-slate-900 font-mono group-hover:text-blue-600 transition-colors flex items-center gap-1.5">
                            <span>{study.id}</span>
                            {#if study.id === 'CA-209-301'}
                              <span class="text-[10px] font-sans font-medium px-1.5 py-0.2 rounded bg-blue-50 text-blue-700">Active</span>
                            {/if}
                          </div>
                          <div class="text-[11px] text-slate-400 mt-0.5" title={(study.countries || []).join(', ')}>
                            {study.therapeuticArea} &middot; {formatStudyCountries(study.countries)}
                          </div>
                        </div>
                      </div>
                    </td>

                    <!-- Indication & Phase -->
                    <td class="py-4 px-3">
                      <div class="text-slate-900 font-medium">{study.indication}</div>
                      <div class="text-[11px] text-slate-400 mt-0.5">{study.phase}</div>
                    </td>

                    <!-- LSLV -->
                    <td class="py-4 px-3 text-slate-600 font-mono text-[11px] num-tabular whitespace-nowrap">
                      {study.plannedLslv}
                    </td>

                    <!-- Target DBL -->
                    <td class="py-4 px-3 whitespace-nowrap">
                      <div class="font-mono text-[11px] font-medium text-slate-700 num-tabular">{study.plannedDbl}</div>
                    </td>

                    <!-- Forecast DBL -->
                    <td class="py-4 px-3 whitespace-nowrap">
                      <div class="flex items-center gap-2">
                        <span class="font-mono text-[11px] font-semibold text-slate-900 num-tabular">{study.forecastDbl}</span>
                        {#if study.delayDays > 0}
                          <span class="inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-semibold bg-rose-50 text-rose-700 num-tabular">
                            +{study.delayDays}d
                          </span>
                        {:else if study.delayDays < 0}
                          <span class="inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-50 text-emerald-700 num-tabular">
                            {study.delayDays}d
                          </span>
                        {:else}
                          <span class="inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-medium bg-slate-100 text-slate-600 num-tabular">
                            On target
                          </span>
                        {/if}
                      </div>
                    </td>

                    <!-- Clean Patient Readiness (Clean Progress Bar + Tabular Share) -->
                    <td class="py-4 px-3 min-w-[165px]">
                      <div class="flex items-center justify-between text-xs mb-1">
                        <span class="font-semibold text-slate-900 num-tabular">{study.readinessScore}%</span>
                        {#if study.enrolledSubjects}
                          <span class="text-[11px] text-slate-400 num-tabular">
                            {study.cleanSubjects}/{study.enrolledSubjects} clean
                          </span>
                        {/if}
                      </div>
                      <div class="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          class="h-full rounded-full {study.readinessScore < 70 ? 'bg-rose-500' : study.readinessScore < 90 ? 'bg-amber-500' : 'bg-emerald-500'}"
                          style="width: {study.readinessScore}%"
                        ></div>
                      </div>
                    </td>

                    <!-- Blockers -->
                    <td class="py-4 px-2 text-center num-tabular">
                      <span class="font-semibold {study.criticalBlockers > 5 ? 'text-rose-600' : study.criticalBlockers > 0 ? 'text-slate-800' : 'text-slate-400'}">
                        {study.criticalBlockers}
                      </span>
                    </td>

                    <!-- High-Risk Sites -->
                    <td class="py-4 px-2 text-center text-slate-600 num-tabular whitespace-nowrap">
                      {study.highRiskSites}
                    </td>

                    <!-- Status & Velocity -->
                    <td class="py-4 px-3 whitespace-nowrap">
                      <div class="flex items-center gap-1.5">
                        <span class="font-medium {study.status === 'High risk' ? 'text-rose-600' : study.status === 'At risk' ? 'text-amber-700' : 'text-emerald-700'}">
                          {study.status}
                        </span>
                        <span class="text-slate-300">&middot;</span>
                        <span class="text-[11px] {study.riskDirection === 'Worsening' ? 'text-rose-600' : 'text-slate-500'}">
                          {study.riskDirection || 'Improving'}
                        </span>
                      </div>
                      <div class="text-[11px] text-slate-400 mt-0.5">{study.weeklyTrendText}</div>
                    </td>

                    <!-- CTA -->
                    <td class="py-4 pl-2 pr-5 text-right">
                      <span class="inline-flex items-center justify-center w-7 h-7 rounded-lg text-slate-400 group-hover:text-slate-900 group-hover:bg-slate-100 transition-colors">
                        <ArrowRight size={14} />
                      </span>
                    </td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>
        {:else}
          <!-- Cards Grid View -->
          <div class="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
            {#each paginatedStudies as study}
              <div
                class="db-card-interactive p-5 cursor-pointer group flex flex-col justify-between {study.id === 'CA-209-301' ? 'ring-1 ring-blue-500/30' : ''}"
                on:click={() => onSelectStudy(study.id)}
                on:keydown={(e) => e.key === 'Enter' && onSelectStudy(study.id)}
                role="button"
                tabindex="0"
              >
                <div>
                  <div class="flex items-center justify-between mb-2">
                    <div class="flex items-center gap-2">
                      <span class="w-2 h-2 rounded-full {study.status === 'High risk' ? 'bg-rose-500' : study.status === 'At risk' ? 'bg-amber-500' : 'bg-emerald-500'}"></span>
                      <span class="font-mono font-semibold text-sm text-slate-900 group-hover:text-blue-600 transition-colors">
                        {study.id}
                      </span>
                    </div>
                    <span class="text-xs font-medium {study.status === 'High risk' ? 'text-rose-600' : study.status === 'At risk' ? 'text-amber-700' : 'text-emerald-700'}">
                      {study.status} &middot; {study.riskDirection}
                    </span>
                  </div>
                  <div class="text-sm font-semibold text-slate-900">{study.name} &mdash; {study.indication}</div>
                  <div class="text-xs text-slate-500 mt-0.5">{study.therapeuticArea} &middot; {study.phase} &middot; {formatStudyCountries(study.countries)}</div>

                  <!-- Clean Progress Bar -->
                  <div class="mt-4">
                    <div class="flex items-center justify-between text-xs mb-1.5">
                      <span class="text-slate-500">Clean Subject Readiness</span>
                      <span class="font-semibold text-slate-900 num-tabular">{study.readinessScore}% ({study.cleanSubjects}/{study.enrolledSubjects})</span>
                    </div>
                    <div class="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        class="h-full rounded-full {study.readinessScore < 70 ? 'bg-rose-500' : study.readinessScore < 90 ? 'bg-amber-500' : 'bg-emerald-500'}"
                        style="width: {study.readinessScore}%"
                      ></div>
                    </div>
                  </div>

                  <div class="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-slate-100 text-xs">
                    <div>
                      <div class="text-[11px] text-slate-400">Target DBL</div>
                      <div class="font-mono font-medium text-slate-800 mt-0.5 num-tabular">{study.plannedDbl}</div>
                    </div>
                    <div>
                      <div class="text-[11px] text-slate-400">Forecast DBL</div>
                      <div class="font-mono font-semibold {study.delayDays > 0 ? 'text-rose-600' : 'text-slate-900'} mt-0.5 num-tabular">
                        {study.forecastDbl} ({study.delayDays > 0 ? `+${study.delayDays}d` : `${study.delayDays}d`})
                      </div>
                    </div>
                    <div>
                      <div class="text-[11px] text-slate-400">Blockers / Sites</div>
                      <div class="font-medium text-slate-800 mt-0.5 num-tabular">{study.criticalBlockers} crit &middot; {study.highRiskSites}</div>
                    </div>
                  </div>
                </div>

                <div class="flex items-center justify-between pt-3 mt-3 border-t border-slate-100 text-xs">
                  <span class="text-slate-400 num-tabular">LSLV: {study.plannedLslv}</span>
                  <span class="text-slate-900 font-semibold flex items-center gap-1 group-hover:text-blue-600 transition-colors">
                    <span>Open Workspace</span>
                    <ArrowRight size={13} />
                  </span>
                </div>
              </div>
            {/each}
          </div>
        {/if}

        <!-- Pagination Footer -->
        <div class="px-5 py-3.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <div class="num-tabular">
            Showing <strong class="text-slate-800">1–{Math.min(paginatedStudies.length, pageSize)}</strong> of <strong class="text-slate-800">{sortedStudies.length}</strong> studies
          </div>

          <div class="flex items-center gap-1.5">
            <button
              disabled={currentPage === 1}
              on:click={() => currentPage = Math.max(1, currentPage - 1)}
              class="px-2.5 py-1 rounded-lg border border-slate-200/80 bg-white font-medium hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              Previous
            </button>
            {#each Array(totalPages) as _, idx}
              <button
                on:click={() => currentPage = idx + 1}
                class="w-7 h-7 rounded-lg font-semibold text-xs transition-colors cursor-pointer num-tabular {currentPage === idx + 1 ? 'bg-slate-900 text-white' : 'border border-slate-200/80 bg-white hover:bg-slate-50 text-slate-700'}"
              >
                {idx + 1}
              </button>
            {/each}
            <button
              disabled={currentPage === totalPages}
              on:click={() => currentPage = Math.min(totalPages, currentPage + 1)}
              class="px-2.5 py-1 rounded-lg border border-slate-200/80 bg-white font-medium hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              Next
            </button>
          </div>
        </div>

      </div>

      <!-- ===================================================================== -->
      <!-- CA-209-301 CRITICAL BLOCKER TRACEABILITY PREVIEW (Clean & Minimal)    -->
      <!-- ===================================================================== -->
      <div class="db-card p-5 space-y-4">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
          <div>
            <h3 class="text-sm font-semibold text-slate-900">
              CA-209-301 Critical-Path Blocker Preview
            </h3>
            <p class="text-xs text-slate-500 mt-0.5">
              Inspect the 4 primary drivers accounting for the +6d forecast variance before opening the study workspace.
            </p>
          </div>
          <div class="db-segmented self-start sm:self-auto">
            {#each criticalBlockersCatalog as blk}
              <button
                type="button"
                on:click={() => selectedBlockerId = blk.id}
                class="db-segmented-btn flex items-center gap-1.5 {selectedBlockerId === blk.id ? 'active' : ''}"
              >
                <span>{blk.domain}</span>
                <span class="text-[10px] font-mono text-rose-600 font-semibold num-tabular">{blk.impactDays}</span>
              </button>
            {/each}
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div class="p-4 rounded-xl bg-slate-50/70 border border-slate-200/60 space-y-2">
            <div class="text-[11px] font-medium text-slate-400">Blocker Summary</div>
            <div class="font-semibold text-slate-900 text-sm">{activeBlocker.title}</div>
            <div class="text-slate-600 pt-1">
              <span class="text-slate-400">Affected Site:</span>
              <button
                type="button"
                on:click={() => onSelectSite(activeBlocker.siteId)}
                class="text-blue-600 hover:underline font-medium ml-1 cursor-pointer"
              >
                {activeBlocker.siteName} &rarr;
              </button>
            </div>
            <div class="flex items-center gap-1.5 pt-1 flex-wrap">
              <span class="text-slate-400">Subjects:</span>
              {#each activeBlocker.subjectIds as sId}
                <span class="px-2 py-0.5 rounded-md bg-white border border-slate-200 font-mono text-[11px] font-medium text-slate-800">
                  {sId}
                </span>
              {/each}
            </div>
          </div>

          <div class="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
            {#each activeBlocker.records as rec}
              <div class="p-4 rounded-xl bg-slate-50/70 border border-slate-200/60 flex flex-col justify-between space-y-2">
                <div>
                  <div class="flex items-center justify-between">
                    <span class="font-mono font-semibold text-slate-900">{rec.recordId}</span>
                    <span class="text-[11px] font-medium text-rose-600 num-tabular">{rec.age}</span>
                  </div>
                  <div class="font-medium text-slate-800 mt-1 leading-snug">{rec.type}</div>
                </div>
                <div class="pt-2 border-t border-slate-200/60 text-[11px] text-slate-500 space-y-0.5">
                  <div>Source: <span class="text-slate-700 font-medium">{rec.sourceSystem}</span></div>
                  <div class="num-tabular">Synced: {rec.lastRefresh}</div>
                </div>
              </div>
            {/each}
          </div>
        </div>
      </div>

    </div>

  </div>
</div>
