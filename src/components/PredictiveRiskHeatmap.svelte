<script lang="ts">
  import RealWorldMap from './RealWorldMap.svelte';
  import RiskQuadrantChart from './RiskQuadrantChart.svelte';
  import {
    ArrowRight,
    Search,
    MapPin,
    BarChart3,
    Table,
    Download,
    AlertTriangle,
    CheckCircle2,
    Clock,
    Building2,
    FileText,
    Filter,
    ShieldAlert,
    ExternalLink,
    X,
    Sparkles,
    ChevronRight,
    ChevronDown,
    Info,
    Layers,
    Server,
    Users
  } from '@lucide/svelte';

  export let sites: any[];
  export let subjects: any[];
  export let dimensions: any[];
  export let saeDiscrepancies: any[] = [];
  export let labBatches: any[] = [];
  export let queriesDetail: any[] = [];
  export let onSelectSite: (id: string) => void;
  export let onSelectSubject: (subjectId: string, siteId: string) => void = () => {};
  export let onSelectTab: (tab: string) => void;

  // View mode: 'map' | 'chart' | 'table' | 'vendors'
  let viewMode = 'map';
  // Ranking criteria per Image 12 Level 2: impact | probability | critical_path | volume | weekly_change
  let viewByMetric = 'impact';
  // Global filter drill-down Level 1: Study -> Country -> Site (Image 10 & 12)
  let selectedCountry = 'all';
  let riskTierFilter = 'all';
  let searchQuery = '';
  let showRiskBasisInfo = false;

  // Automated Multi-Vendor View state (Image 11 & 12)
  let selectedVendorId = 'VND-LABCORP';

  const automatedVendors = [
    {
      id: 'VND-LABCORP',
      name: 'LabCorp Bioanalytical (Central Lab)',
      feedType: 'Automated SFTP + HL7/FHIR API (No manual input)',
      status: 'Late Transfer (Overdue 4d)',
      statusColor: 'rose',
      cleanlinessAutoScore: 64,
      totalTransfers: 18,
      lateTransfersCount: 1,
      outstandingIssuesCount: 3,
      lastAutomatedSync: '31 October 2026, 08:00 UTC',
      transfersAndIssues: [
        {
          id: 'LXB-8921',
          studyId: 'CA-209-301',
          siteId: '104 & 317',
          type: 'Late Transfer Batch (ctDNA NGS Panel)',
          dueDate: '2026-10-27',
          daysLate: 4,
          recordCount: '48 sample records',
          ruleApplied: 'SHA-256 Checksum & SLA Transfer Gate',
          status: 'Overdue – Checksum Failed'
        },
        {
          id: 'ISS-LAB-104-02',
          studyId: 'CA-209-301',
          siteId: '104',
          type: 'Missing Accession Barcode Reconciliation',
          dueDate: '2026-10-29',
          daysLate: 2,
          recordCount: '2 subject specimen records (SUBJ-104-019)',
          ruleApplied: 'EDC-to-LIMS Specimen Match Rule',
          status: 'Open Discrepancy'
        }
      ]
    },
    {
      id: 'VND-BIOCLINICA',
      name: 'BioClinica Central Imaging (BICR)',
      feedType: 'Automated DICOM Portal API (No manual input)',
      status: 'Adjudication Pending',
      statusColor: 'amber',
      cleanlinessAutoScore: 82,
      totalTransfers: 24,
      lateTransfersCount: 1,
      outstandingIssuesCount: 2,
      lastAutomatedSync: '31 October 2026, 07:30 UTC',
      transfersAndIssues: [
        {
          id: 'IMG-44-BICR',
          studyId: 'CA-209-301',
          siteId: '317',
          type: 'Independent Radiologist Tie-Breaker Read',
          dueDate: '2026-10-29',
          daysLate: 2,
          recordCount: '5 RECIST 1.1 target lesion scans',
          ruleApplied: 'BICR Dual-Reader Concordance Rule',
          status: '2 Days Late'
        },
        {
          id: 'QRY-317-044',
          studyId: 'CA-209-301',
          siteId: '317',
          type: 'Thoracic CT 5mm Slice Thickness Deviation',
          dueDate: '2026-10-25',
          daysLate: 6,
          recordCount: '1 subject scan (SUBJ-317-005)',
          ruleApplied: 'Imaging Charter Acquisition Spec',
          status: 'Open Vendor Query'
        }
      ]
    },
    {
      id: 'VND-ARGUS',
      name: 'Oracle Argus Safety (PV Reconciliation)',
      feedType: 'Automated E2B(R3) Safety Gateway (No manual input)',
      status: '2 Critical Discrepancies',
      statusColor: 'rose',
      cleanlinessAutoScore: 80,
      totalTransfers: 30,
      lateTransfersCount: 0,
      outstandingIssuesCount: 2,
      lastAutomatedSync: '31 October 2026, 07:45 UTC',
      transfersAndIssues: [
        {
          id: 'SAE-REC-104-01',
          studyId: 'CA-209-301',
          siteId: '104',
          type: 'SAE Onset & Causality Mismatch (Subj 104-003)',
          dueDate: '2026-10-19',
          daysLate: 12,
          recordCount: '1 SAE case (Grade 3 CRS)',
          ruleApplied: '21 CFR 312.32 Rave-Argus 48h Concordance',
          status: 'Critical Freeze Blocker'
        },
        {
          id: 'SAE-REC-104-02',
          studyId: 'CA-209-301',
          siteId: '104',
          type: 'Fatal Sepsis Narrative Unlinked in EDC (Subj 104-012)',
          dueDate: '2026-10-22',
          daysLate: 9,
          recordCount: '1 Fatal SUSAR case',
          ruleApplied: 'Death Form DD-01 Source Match Rule',
          status: 'Critical Freeze Blocker'
        }
      ]
    },
    {
      id: 'VND-EUROFINS',
      name: 'Eurofins Central Lab (Serum Chemistry)',
      feedType: 'Automated CDISC LB REST Feed (No manual input)',
      status: 'QA Review (1d Late)',
      statusColor: 'amber',
      cleanlinessAutoScore: 91,
      totalTransfers: 32,
      lateTransfersCount: 1,
      outstandingIssuesCount: 1,
      lastAutomatedSync: '31 October 2026, 06:00 UTC',
      transfersAndIssues: [
        {
          id: 'LXB-8940',
          studyId: 'CA-209-301',
          siteId: '208 & 405',
          type: 'High-Sensitivity Chemistry Batch Calibration Check',
          dueDate: '2026-10-30',
          daysLate: 1,
          recordCount: '112 lab records',
          ruleApplied: 'Automated Reference Range & Drift Check',
          status: '1 Day Late'
        }
      ]
    },
    {
      id: 'VND-SIGNANT',
      name: 'Signant Health (eCOA / Patient Diaries)',
      feedType: 'Automated Cloud Sync API (No manual input)',
      status: 'Healthy (95% Sync)',
      statusColor: 'emerald',
      cleanlinessAutoScore: 95,
      totalTransfers: 45,
      lateTransfersCount: 0,
      outstandingIssuesCount: 1,
      lastAutomatedSync: '31 October 2026, 06:30 UTC',
      transfersAndIssues: [
        {
          id: 'ECOA-233-SYNC',
          studyId: 'CA-209-301',
          siteId: '233',
          type: 'Patient eDiary Cycle 6 Device Sync Lag',
          dueDate: '2026-10-29',
          daysLate: 2,
          recordCount: '4 subject diary records',
          ruleApplied: 'PRO Compliance Window Check',
          status: 'Minor Issue'
        }
      ]
    }
  ];

  $: activeVendor = automatedVendors.find(v => v.id === selectedVendorId) || automatedVendors[0];

  // =========================================================================
  // SCREEN 4: RISK EXPLANATION & EVIDENCE DRAWER STATE (Image 12, 13, 14, 15)
  // Simplified per manager instruction:
  // - Removed unexplained risk-probability figure from drawer header
  // - Removed recommended-actions/intervention tab from drawer
  // - Aligned Site 104 percentages to 35% / 30% / 22% / 13% with explicit derivation
  // - Added Vendor drill-down as a source of evidence
  // =========================================================================
  let activeSite: any = null;
  let drawerTab: 'why' | 'evidence' | 'vendors' = 'why';
  let selectedFactorForEvidence = 'all';

  function openSiteDrawer(site: any) {
    activeSite = site;
    drawerTab = 'why';
    selectedFactorForEvidence = 'all';
  }

  function closeDrawer() {
    activeSite = null;
  }

  // Compute query breakdown for each site (All outstanding queries vs Endpoint-critical queries)
  function getSiteQueryMetrics(site: any) {
    if (site.id === '104') return { totalQueries: 14, endpointCritical: 5, nonCritical: 9 };
    if (site.id === '208') return { totalQueries: 38, endpointCritical: 0, nonCritical: 38 };
    if (site.id === '317') return { totalQueries: 7, endpointCritical: 5, nonCritical: 2 };
    if (site.id === '405') return { totalQueries: 9, endpointCritical: 2, nonCritical: 7 };
    const total = Math.max(2, Math.round((site.openItems || 8) * 0.7));
    const crit = Math.min(total, site.criticalOpenItems || 0);
    return { totalQueries: total, endpointCritical: crit, nonCritical: total - crit };
  }

  // Study-level readiness parameters applied to every site (Image 9 Blue requirement)
  function getSiteSeemaReadinessParams(site: any) {
    if (site.id === '104') {
      return [
        { label: 'EDC data cleaning (Data entry & SDV)', pct: 84, detail: '40/48 subjects clean entry; Form DD-01 & TU-01 pending' },
        { label: 'Query resolution (All & Endpoint-Critical)', pct: 68, detail: '14 open queries >14d (5 RECIST endpoint-critical, 9 routine)' },
        { label: 'External data reconciliation (Vendor feeds)', pct: 52, detail: 'LabCorp ctDNA batch #LXB-8921 (48 samples) 4d overdue' },
        { label: 'Medical coding (MedDRA / WHODrug)', pct: 88, detail: '2 Grade 3 CRS secondary terms awaiting medical review' },
        { label: 'Site sign-offs (PI e-Signatures)', pct: 75, detail: '36/48 signed; 12 completed casebooks awaiting PI sign-off' },
        { label: 'Safety reconciliation (Rave vs Argus)', pct: 55, detail: '2 unresolved SAE discrepancies blocking safety freeze' }
      ];
    }
    if (site.id === '208') {
      return [
        { label: 'EDC data cleaning (Data entry & SDV)', pct: 91, detail: '33/36 subjects verified' },
        { label: 'Query resolution (All & Endpoint-Critical)', pct: 74, detail: '38 open queries (0 primary-endpoint; 38 routine/admin)' },
        { label: 'External data reconciliation (Vendor feeds)', pct: 86, detail: 'Eurofins batch #LXB-8940 in final QA review' },
        { label: 'Medical coding (MedDRA / WHODrug)', pct: 92, detail: 'ConMed trade names under routine review' },
        { label: 'Site sign-offs (PI e-Signatures)', pct: 89, detail: '32/36 casebooks signed' },
        { label: 'Safety reconciliation (Rave vs Argus)', pct: 100, detail: 'Zero SAE discrepancies' }
      ];
    }
    const base = site.readinessScore || 80;
    return [
      { label: 'EDC data cleaning (Data entry & SDV)', pct: Math.min(99, base + 6), detail: 'Automated EDC completeness check' },
      { label: 'Query resolution (All & Endpoint-Critical)', pct: base, detail: 'All open queries tracked; endpoint-critical flagged' },
      { label: 'External data reconciliation (Vendor feeds)', pct: Math.max(55, base - 5), detail: 'Automated vendor transfer status' },
      { label: 'Medical coding (MedDRA / WHODrug)', pct: Math.min(98, base + 8), detail: 'MedDRA 27.0 & WHODrug C3 coding status' },
      { label: 'Site sign-offs (PI e-Signatures)', pct: Math.max(60, base - 3), detail: 'PI electronic signature completion' },
      { label: 'Safety reconciliation (Rave vs Argus)', pct: Math.min(100, base + 4), detail: 'Rave-Argus SAE alignment' }
    ];
  }

  // Aligned Factor Contributions for Drawer (Site 104 aligned to 35% / 30% / 22% / 13% per Image 14 Blue)
  function getSiteFactorDerivations(site: any) {
    if (site.id === '104') {
      return [
        {
          id: 'safety',
          name: 'Safety reconciliation discrepancies',
          pct: 35,
          color: 'rose',
          derivation: 'Derived from 2 unresolved SAE cases (SAE-REC-104-01 & SAE-REC-104-02) gating global safety freeze = 2.1 days of the 6.0-day critical-path impact (2.1 / 6.0 = 35%).'
        },
        {
          id: 'lab',
          name: 'Laboratory transfer delay (Vendor)',
          pct: 30,
          color: 'amber',
          derivation: 'Derived from overdue LabCorp ctDNA batch #LXB-8921 (48 samples, 4d past SLA due to SHA-256 checksum error) = 1.8 days of the 6.0-day impact (1.8 / 6.0 = 30%).'
        },
        {
          id: 'queries',
          name: 'Ageing queries (14 total; 5 endpoint-critical)',
          pct: 22,
          color: 'orange',
          derivation: 'Derived from 14 queries aged >14d (5 primary-endpoint RECIST queries weighted 2.0x + 9 non-critical queries weighted 0.5x) = 1.3 days of impact (1.3 / 6.0 = 22%).'
        },
        {
          id: 'signoff',
          name: 'Investigator sign-off status',
          pct: 13,
          color: 'blue',
          derivation: 'Derived from 12 completed subject casebooks awaiting PI electronic signature (estimated 0.8 days batch signing time / 6.0 days = 13%).'
        }
      ];
    }
    const b = site.breakdown || { safetyReconciliation: 20, labTransferDelay: 25, ageingQueries: 40, signOffStatus: 15 };
    return [
      {
        id: 'safety',
        name: 'Safety reconciliation discrepancies',
        pct: b.safetyReconciliation || 10,
        color: 'rose',
        derivation: 'Derived from Rave-Argus SAE reconciliation status and pharmacovigilance freeze dependency weight.'
      },
      {
        id: 'lab',
        name: 'Laboratory & external vendor transfers',
        pct: b.labTransferDelay || 20,
        color: 'amber',
        derivation: 'Derived from external vendor batch SLA variance and specimen reconciliation completeness.'
      },
      {
        id: 'queries',
        name: 'Outstanding queries (All & Endpoint-Critical)',
        pct: b.ageingQueries || 50,
        color: 'orange',
        derivation: 'Derived from total open query volume divided by site daily closure velocity, with endpoint-critical queries weighted 2.0x.'
      },
      {
        id: 'signoff',
        name: 'Investigator sign-off status',
        pct: b.signOffStatus || 20,
        color: 'blue',
        derivation: 'Derived from unsigned completed subject eCRF casebooks vs historical PI signing cadence.'
      }
    ];
  }

  // Distinct countries for Level 1 Study -> Country filter
  $: countriesList = Array.from(new Set(sites.map(s => s.country))).sort();

  // Filtered sites (Level 1 Country filter + Risk Tier + Search)
  $: filteredSites = sites.filter(s => {
    if (selectedCountry !== 'all' && s.country !== selectedCountry) return false;
    if (riskTierFilter === 'critical' && s.riskLevel !== 'Critical') return false;
    if (riskTierFilter === 'high' && s.riskLevel !== 'High') return false;
    if (riskTierFilter === 'medium' && s.riskLevel !== 'Medium') return false;
    if (riskTierFilter === 'low' && s.riskLevel !== 'Low') return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return s.id.toLowerCase().includes(q) ||
        s.name.toLowerCase().includes(q) ||
        s.country.toLowerCase().includes(q) ||
        s.city.toLowerCase().includes(q);
    }
    return true;
  });

  // Sort sites (Level 2 ranking: impact, probability, critical_path, volume, weekly_change)
  $: sortedSites = [...filteredSites].sort((a, b) => {
    if (viewByMetric === 'impact') {
      return b.maxDelayDays - a.maxDelayDays;
    }
    if (viewByMetric === 'probability') {
      return b.riskProbability - a.riskProbability;
    }
    if (viewByMetric === 'critical_path') {
      return (b.criticalOpenItems || 0) - (a.criticalOpenItems || 0);
    }
    if (viewByMetric === 'weekly_change') {
      const deltaA = a.trend ? a.trend[a.trend.length - 1] - a.trend[a.trend.length - 2] : 0;
      const deltaB = b.trend ? b.trend[b.trend.length - 1] - b.trend[b.trend.length - 2] : 0;
      return deltaA - deltaB;
    }
    return b.openItems - a.openItems;
  });

  function getRiskBadge(level: string) {
    if (level === 'Critical') return 'bg-rose-100 text-rose-800 border-rose-200';
    if (level === 'High') return 'bg-amber-100 text-amber-800 border-amber-200';
    if (level === 'Medium') return 'bg-orange-100 text-orange-800 border-orange-200';
    return 'bg-emerald-100 text-emerald-800 border-emerald-200';
  }

  function getSparklinePoints(trend: number[]) {
    if (!trend || trend.length < 2) return '';
    const min = Math.min(...trend) - 5;
    const max = Math.max(...trend) + 5;
    const range = max - min || 1;
    const width = 50;
    const height = 16;
    return trend.map((val, idx) => {
      const x = (idx / (trend.length - 1)) * width;
      const y = height - ((val - min) / range) * height;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(' ');
  }
</script>

<div class="space-y-5">

  <!-- ========================================================================= -->
  <!-- HERO BANNER: 3. SITES & RISKS + VENDOR VIEW                               -->
  <!-- ========================================================================= -->
  <div class="rounded-2xl bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950 text-white p-6 shadow-md border border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
    <div>
      <div class="flex items-center space-x-2">
        <span class="text-[10px] font-extrabold uppercase tracking-widest text-blue-300">
          3. SITES AND RISKS &middot; DECISION INTELLIGENCE DIFFERENTIATOR
        </span>
        <span class="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-200 border border-blue-400/30 text-[10px] font-bold">
          Configurable Prototype Thresholds
        </span>
      </div>
      <h1 class="text-2xl sm:text-3xl font-extrabold text-white mt-1 tracking-tight">
        Sites, Country Drill-Down &amp; Automated Vendor View
      </h1>
      <p class="text-xs sm:text-sm text-slate-300 mt-1.5 leading-relaxed max-w-2xl">
        <strong>The highest number of open items does not necessarily represent the greatest DBL risk:</strong> Site 104 has 19 open items but <strong>5–7 days</strong> potential impact, whereas Site 208 has 41 open items but only <strong>1–2 days</strong> impact.
      </p>
    </div>

    <!-- View Controls (Map | Chart | Table | Automated Vendor View) -->
    <div class="flex flex-wrap items-center gap-3 self-start lg:self-center">
      <div class="flex items-center space-x-1.5 text-xs text-slate-300">
        <span class="text-slate-400">Rank sites by:</span>
        <select
          bind:value={viewByMetric}
          class="bg-white/10 border border-white/20 rounded-lg py-1.5 px-2.5 text-xs font-semibold text-white focus:outline-hidden focus:bg-slate-800"
        >
          <option value="impact" class="text-slate-900">Potential DBL impact (days)</option>
          <option value="critical_path" class="text-slate-900">Critical-path dependency</option>
          <option value="probability" class="text-slate-900">Risk probability (%)</option>
          <option value="volume" class="text-slate-900">Open-item volume</option>
          <option value="weekly_change" class="text-slate-900">Change since last week</option>
        </select>
      </div>

      <div class="flex items-center bg-white/10 p-0.5 rounded-lg border border-white/20">
        <button
          on:click={() => viewMode = 'map'}
          class="px-2.5 py-1 rounded-md text-xs font-semibold flex items-center space-x-1 transition-all {viewMode === 'map' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:text-white'}"
        >
          <MapPin size={13} />
          <span>Map</span>
        </button>
        <button
          on:click={() => viewMode = 'chart'}
          class="px-2.5 py-1 rounded-md text-xs font-semibold flex items-center space-x-1 transition-all {viewMode === 'chart' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:text-white'}"
        >
          <BarChart3 size={13} />
          <span>Chart</span>
        </button>
        <button
          on:click={() => viewMode = 'table'}
          class="px-2.5 py-1 rounded-md text-xs font-semibold flex items-center space-x-1 transition-all {viewMode === 'table' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:text-white'}"
        >
          <Table size={13} />
          <span>Table</span>
        </button>
        <button
          on:click={() => viewMode = 'vendors'}
          class="px-2.5 py-1 rounded-md text-xs font-semibold flex items-center space-x-1 transition-all {viewMode === 'vendors' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:text-white'}"
        >
          <Server size={13} />
          <span>Vendor View (5)</span>
        </button>
      </div>
    </div>
  </div>

  <!-- ========================================================================= -->
  <!-- CONFIGURABLE PROTOTYPE RISK LABELS & BASIS DEFINITION (Image 10 Blue)     -->
  <!-- ========================================================================= -->
  <div class="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
      <div class="flex items-center space-x-2 text-xs">
        <Info size={16} class="text-blue-600 shrink-0" />
        <span class="font-bold text-slate-900">Basis for Risk Labels &amp; Configurable Prototype Thresholds</span>
        <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
          Illustrative Dummy Values Until Calculation Documented
        </span>
      </div>
      <button
        type="button"
        on:click={() => showRiskBasisInfo = !showRiskBasisInfo}
        class="text-xs font-bold text-blue-600 hover:text-blue-800 cursor-pointer"
      >
        {showRiskBasisInfo ? 'Hide calculation basis' : 'Show basis for each risk label'}
      </button>
    </div>

    {#if showRiskBasisInfo}
      <p class="text-[11px] text-slate-600 mt-2 leading-relaxed">
        <strong>Basis definition:</strong> Each site's risk tier is determined by the greater of its critical-path delay impact (estimated days added to study DBL based on unresolved SAE freeze blockers, overdue vendor transfers, and open queries divided by site closure velocity) or its Bayesian delay probability from historical oncology lock trajectories.
      </p>
    {/if}

    <div class="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-3 text-xs">
      <div class="p-2.5 rounded-lg bg-rose-50/70 border border-rose-200">
        <span class="font-extrabold text-rose-800 block">Critical</span>
        <span class="text-[11px] text-rose-700">&gt;80% probability or &gt;5-day impact</span>
      </div>
      <div class="p-2.5 rounded-lg bg-amber-50/70 border border-amber-200">
        <span class="font-extrabold text-amber-800 block">High</span>
        <span class="text-[11px] text-amber-700">60–80% probability or 3–5-day impact</span>
      </div>
      <div class="p-2.5 rounded-lg bg-orange-50/70 border border-orange-200">
        <span class="font-extrabold text-orange-800 block">Medium</span>
        <span class="text-[11px] text-orange-700">30–60% probability or 1–3-day impact</span>
      </div>
      <div class="p-2.5 rounded-lg bg-emerald-50/70 border border-emerald-200">
        <span class="font-extrabold text-emerald-800 block">Low</span>
        <span class="text-[11px] text-emerald-700">&lt;30% probability and &lt;1-day impact</span>
      </div>
    </div>
  </div>

  <!-- ========================================================================= -->
  <!-- GLOBAL FILTER DRILL-DOWN BAR: LEVEL 1 (STUDY -> COUNTRY -> SITE) (Img 10) -->
  <!-- ========================================================================= -->
  <div class="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
    <div class="flex items-center space-x-2 text-xs flex-wrap gap-y-1">
      <span class="text-[10px] font-extrabold uppercase tracking-wider text-blue-700 bg-blue-50 px-2 py-1 rounded border border-blue-200">
        Global Drill-Down
      </span>
      <span class="font-bold text-slate-800">Study CA-209-301</span>
      <ChevronRight size={14} class="text-slate-400" />
      <span class="text-slate-500 font-semibold">Country:</span>
      <div class="flex flex-wrap gap-1.5">
        <button
          type="button"
          on:click={() => selectedCountry = 'all'}
          class="px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer {selectedCountry === 'all' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}"
        >
          All Countries ({sites.length} sites)
        </button>
        {#each countriesList as ctry}
          {@const ctrySites = sites.filter(s => s.country === ctry)}
          <button
            type="button"
            on:click={() => selectedCountry = ctry}
            class="px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer {selectedCountry === ctry ? 'bg-blue-600 text-white font-bold' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}"
          >
            {ctry} ({ctrySites.length})
          </button>
        {/each}
      </div>
    </div>

    <div class="text-[11px] text-slate-500">
      Country filter drills immediately into site-level open items &amp; subjects
    </div>
  </div>

  <!-- ========================================================================= -->
  <!-- AUTOMATED MULTI-VENDOR VIEW (Image 11 & 12 Blue Requirement)              -->
  <!-- Vendor -> Study -> Site -> Transfer or Outstanding Issue                  -->
  <!-- ========================================================================= -->
  {#if viewMode === 'vendors'}
    <div class="bg-white rounded-xl border-2 border-blue-200 p-5 shadow-xs space-y-5">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
        <div>
          <div class="flex items-center space-x-2">
            <Server size={16} class="text-blue-600" />
            <h3 class="text-base font-extrabold text-slate-900">
              Automated Multi-Vendor View (Zero Manual Cleanliness Input)
            </h3>
            <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              Live API / SFTP Ingestion
            </span>
          </div>
          <p class="text-xs text-slate-500 mt-0.5">
            Drill-down path: <strong>Vendor &rarr; Study &rarr; Site &rarr; Transfer or Outstanding Issue (due date, days late, record count)</strong>
          </p>
        </div>
      </div>

      <!-- Vendor Selector Cards -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
        {#each automatedVendors as vnd}
          <button
            type="button"
            on:click={() => selectedVendorId = vnd.id}
            class="p-3.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between {selectedVendorId === vnd.id ? 'border-blue-600 bg-blue-50/50 ring-2 ring-blue-100' : 'border-slate-200 bg-white hover:border-blue-300'}"
          >
            <div>
              <div class="flex items-center justify-between">
                <span class="px-2 py-0.5 rounded text-[10px] font-bold {vnd.statusColor === 'rose' ? 'bg-rose-100 text-rose-800' : vnd.statusColor === 'amber' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'}">
                  {vnd.status}
                </span>
                <span class="font-extrabold text-slate-900">{vnd.cleanlinessAutoScore}%</span>
              </div>
              <div class="font-bold text-slate-900 mt-2 leading-snug">{vnd.name}</div>
              <div class="text-[10px] text-slate-500 mt-1">{vnd.feedType}</div>
            </div>
            <div class="mt-3 pt-2 border-t border-slate-100 flex justify-between text-[10px] text-slate-600 font-semibold">
              <span>{vnd.lateTransfersCount} late transfer(s)</span>
              <span>{vnd.outstandingIssuesCount} issue(s)</span>
            </div>
          </button>
        {/each}
      </div>

      <!-- Selected Vendor Drill-Down Table -->
      <div class="border border-slate-200 rounded-xl overflow-hidden">
        <div class="bg-slate-50 px-4 py-3 border-b border-slate-200 flex items-center justify-between text-xs">
          <div>
            <strong class="text-slate-900">{activeVendor.name}</strong>
            <span class="text-slate-500 ml-2">&middot; {activeVendor.feedType}</span>
          </div>
          <span class="font-mono text-[11px] text-slate-500">Last sync: {activeVendor.lastAutomatedSync}</span>
        </div>
        <table class="w-full text-left border-collapse text-xs">
          <thead>
            <tr class="bg-slate-50/60 text-slate-500 uppercase text-[10px] font-bold border-b border-slate-200">
              <th class="py-2.5 px-4">Transfer / Issue ID</th>
              <th class="py-2.5 px-3">Study &rarr; Affected Site</th>
              <th class="py-2.5 px-3">Transfer or Outstanding Issue</th>
              <th class="py-2.5 px-3">Due Date</th>
              <th class="py-2.5 px-3 text-center">Days Late</th>
              <th class="py-2.5 px-3">Record Count</th>
              <th class="py-2.5 px-3">Status</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 font-medium text-slate-700">
            {#each activeVendor.transfersAndIssues as item}
              <tr class="hover:bg-slate-50">
                <td class="py-3 px-4 font-mono font-bold text-slate-900">{item.id}</td>
                <td class="py-3 px-3 font-semibold text-blue-700">{item.studyId} &rarr; Site {item.siteId}</td>
                <td class="py-3 px-3">
                  <div class="font-bold text-slate-900">{item.type}</div>
                  <div class="text-[10px] text-slate-500">Rule: {item.ruleApplied}</div>
                </td>
                <td class="py-3 px-3 font-mono text-slate-600">{item.dueDate}</td>
                <td class="py-3 px-3 text-center font-bold text-rose-600">+{item.daysLate}d late</td>
                <td class="py-3 px-3 font-semibold text-slate-800">{item.recordCount}</td>
                <td class="py-3 px-3">
                  <span class="px-2 py-0.5 rounded bg-rose-100 text-rose-800 text-[10px] font-bold">{item.status}</span>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    </div>
  {:else if viewMode === 'map'}
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- World Map Container (2 Cols) -->
      <div class="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
        <div>
          <div class="flex flex-col sm:flex-row sm:items-center justify-between mb-3 gap-2">
            <div>
              <div class="flex items-center space-x-2">
                <h3 class="text-sm font-bold text-slate-900">Site risk by location ({filteredSites.length} sites)</h3>
                <span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  Real Global Map
                </span>
              </div>
              <p class="text-[11px] text-slate-500">Click any marker to open the Risk Explanation &amp; Evidence Drawer</p>
            </div>
          </div>

          <RealWorldMap
            sites={filteredSites}
            activeSiteId={activeSite?.id}
            onSelectSite={openSiteDrawer}
          />
        </div>

        <div class="mt-3 text-xs text-slate-500 flex items-center justify-between">
          <span>Click any site marker or row below to inspect 4-level site &amp; vendor evidence</span>
          <button
            type="button"
            on:click={() => openSiteDrawer(sites.find(s => s.id === '104') || sites[0])}
            class="text-blue-600 hover:text-blue-800 font-bold cursor-pointer"
          >
            Inspect Site 104 Drawer &rarr;
          </button>
        </div>
      </div>

      <!-- Quick Vendor & Query Summary Panel beside Map -->
      <div class="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between space-y-4">
        <div>
          <h3 class="text-sm font-bold text-slate-900 mb-1">All Queries vs Endpoint-Critical &amp; Vendors</h3>
          <p class="text-[11px] text-slate-500 mb-3">
            All outstanding queries can affect DBL; endpoint-critical queries are highlighted separately.
          </p>

          <div class="p-3 rounded-xl bg-amber-50/60 border border-amber-200 space-y-2 text-xs mb-3">
            <div class="font-bold text-amber-950 flex items-center justify-between">
              <span>Study-Wide Outstanding Queries</span>
              <span class="font-mono font-extrabold text-sm text-slate-900">68 total</span>
            </div>
            <div class="grid grid-cols-2 gap-2 pt-1">
              <div class="p-2 bg-white rounded border border-rose-200">
                <span class="text-[10px] text-rose-700 font-bold uppercase block">Endpoint-Critical</span>
                <strong class="text-sm font-extrabold text-rose-600">14 queries</strong>
                <span class="text-[10px] text-slate-500 block">RECIST / Primary PFS</span>
              </div>
              <div class="p-2 bg-white rounded border border-slate-200">
                <span class="text-[10px] text-slate-600 font-bold uppercase block">Other Outstanding</span>
                <strong class="text-sm font-extrabold text-slate-800">54 queries</strong>
                <span class="text-[10px] text-slate-500 block">AE / ConMed / Demographics</span>
              </div>
            </div>
          </div>

          <div class="space-y-2">
            <div class="flex items-center justify-between text-xs font-bold text-slate-800">
              <span>Automated Vendor Feeds</span>
              <button
                type="button"
                on:click={() => viewMode = 'vendors'}
                class="text-blue-600 hover:underline text-[11px] cursor-pointer"
              >
                Open Vendor View &rarr;
              </button>
            </div>
            {#each automatedVendors.slice(0, 3) as vnd}
              <div class="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                <div>
                  <div class="font-bold text-slate-900">{vnd.name}</div>
                  <div class="text-[10px] text-slate-500">{vnd.lateTransfersCount} late transfer &middot; {vnd.outstandingIssuesCount} open issues</div>
                </div>
                <span class="px-2 py-0.5 rounded text-[10px] font-bold {vnd.statusColor === 'rose' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'}">
                  {vnd.cleanlinessAutoScore}%
                </span>
              </div>
            {/each}
          </div>
        </div>

        <div class="pt-3 border-t border-slate-100 text-[11px] text-slate-500">
          Automated vendor feeds require zero manual cleanliness input.
        </div>
      </div>
    </div>
  {:else if viewMode === 'chart'}
    <RiskQuadrantChart
      sites={filteredSites}
      onSelectSite={(id) => {
        const s = sites.find(x => x.id === id);
        if (s) openSiteDrawer(s);
      }}
    />
  {/if}

  <!-- ========================================================================= -->
  <!-- SITE TABLE VIEW (With All Queries vs Endpoint-Critical & Seema Params)    -->
  <!-- ========================================================================= -->
  <div class="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
    
    <!-- Filter Chips & Search Bar -->
    <div class="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div class="flex items-center space-x-1.5 overflow-x-auto text-xs">
        <button
          on:click={() => riskTierFilter = 'all'}
          class="px-3 py-1.5 rounded-lg font-semibold transition-all {riskTierFilter === 'all' ? 'bg-blue-600 text-white shadow-xs' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}"
        >
          All sites ({filteredSites.length})
        </button>
        <button
          on:click={() => riskTierFilter = 'critical'}
          class="px-3 py-1.5 rounded-lg font-semibold transition-all {riskTierFilter === 'critical' ? 'bg-rose-600 text-white shadow-xs' : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'}"
        >
          Critical ({sites.filter(s => s.riskLevel === 'Critical').length})
        </button>
        <button
          on:click={() => riskTierFilter = 'high'}
          class="px-3 py-1.5 rounded-lg font-semibold transition-all {riskTierFilter === 'high' ? 'bg-amber-600 text-white shadow-xs' : 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200'}"
        >
          High ({sites.filter(s => s.riskLevel === 'High').length})
        </button>
        <button
          on:click={() => riskTierFilter = 'medium'}
          class="px-3 py-1.5 rounded-lg font-semibold transition-all {riskTierFilter === 'medium' ? 'bg-orange-500 text-white shadow-xs' : 'bg-orange-50 text-orange-700 hover:bg-orange-100 border border-orange-200'}"
        >
          Medium ({sites.filter(s => s.riskLevel === 'Medium').length})
        </button>
        <button
          on:click={() => riskTierFilter = 'low'}
          class="px-3 py-1.5 rounded-lg font-semibold transition-all {riskTierFilter === 'low' ? 'bg-emerald-600 text-white shadow-xs' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'}"
        >
          Low ({sites.filter(s => s.riskLevel === 'Low').length})
        </button>
      </div>

      <div class="flex items-center space-x-2.5 self-end sm:self-center">
        <div class="relative">
          <Search size={14} class="absolute left-2.5 top-2.5 text-slate-400" />
          <input
            type="text"
            bind:value={searchQuery}
            placeholder="Search site, country or site ID"
            class="text-xs bg-slate-50 border border-slate-200 rounded-lg py-1.5 pl-8 pr-3 text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-blue-500 w-52"
          />
        </div>
      </div>
    </div>

    <!-- The Site Table -->
    <div class="overflow-x-auto">
      <table class="w-full text-left border-collapse text-xs">
        <thead>
          <tr class="bg-slate-50/80 text-slate-500 border-b border-slate-200 text-[10px] font-bold uppercase tracking-wider">
            <th class="py-3 px-4">Site ID &amp; Name</th>
            <th class="py-3 px-2">Country</th>
            <th class="py-3 px-3 text-center">Open Items</th>
            <th class="py-3 px-3 text-center">Outstanding Queries (All vs Endpoint-Crit)</th>
            <th class="py-3 px-3 text-center">Potential DBL Impact</th>
            <th class="py-3 px-3">Risk Label</th>
            <th class="py-3 px-3">Leading Risk Drivers</th>
            <th class="py-3 px-3">Actions</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100 font-medium text-slate-700">
          {#each sortedSites as site}
            {@const qMetrics = getSiteQueryMetrics(site)}
            <tr
              class="hover:bg-blue-50/40 transition-colors cursor-pointer group {site.id === '104' ? 'bg-amber-50/20' : ''}"
              on:click={() => openSiteDrawer(site)}
            >
              <td class="py-3.5 px-4">
                <div class="font-bold text-slate-900 group-hover:text-blue-600">{site.code}: {site.name}</div>
                <div class="text-[10px] text-slate-400">Readiness: {site.readinessScore}/100 &middot; {site.enrolledSubjects} enrolled subjects</div>
              </td>
              <td class="py-3.5 px-2 text-slate-700 font-semibold">
                {site.country} ({site.countryCode})
              </td>
              <!-- Open items: Site 208 has 41, Site 104 has 19 -->
              <td class="py-3.5 px-3 text-center font-bold {site.id === '208' ? 'text-blue-700 font-extrabold' : 'text-slate-800'}">
                {site.openItems}
              </td>
              <!-- Query Indicator: All outstanding queries + Endpoint-critical highlighted separately (Image 10 Blue) -->
              <td class="py-3.5 px-3 text-center">
                <div class="font-bold text-slate-900">{qMetrics.totalQueries} total open</div>
                {#if qMetrics.endpointCritical > 0}
                  <span class="inline-block px-1.5 py-0.5 rounded bg-rose-100 text-rose-800 text-[10px] font-bold mt-0.5">
                    {qMetrics.endpointCritical} endpoint-critical
                  </span>
                {:else}
                  <span class="inline-block px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px] font-medium mt-0.5">
                    0 endpoint-critical ({qMetrics.nonCritical} routine)
                  </span>
                {/if}
              </td>
              <!-- Potential DBL impact -->
              <td class="py-3.5 px-3 text-center font-bold font-mono {site.maxDelayDays >= 5 ? 'text-rose-600 text-sm' : site.maxDelayDays >= 3 ? 'text-amber-600' : 'text-slate-700'}">
                {site.forecastImpactDays} days
              </td>
              <td class="py-3.5 px-3">
                <span class="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border {getRiskBadge(site.riskLevel)}">
                  {site.riskLevel}
                </span>
              </td>
              <td class="py-3.5 px-3 text-slate-600 truncate max-w-[170px]">
                {site.keyRiskDrivers}
              </td>
              <td class="py-3.5 px-3 whitespace-nowrap">
                <div class="flex items-center space-x-2">
                  <button
                    type="button"
                    on:click|stopPropagation={() => openSiteDrawer(site)}
                    class="px-2 py-1 rounded bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold text-[11px] border border-blue-200 cursor-pointer"
                  >
                    Risk Drawer
                  </button>
                  <button
                    type="button"
                    on:click|stopPropagation={() => onSelectSite(site.id)}
                    class="px-2 py-1 rounded bg-slate-100 text-slate-700 hover:bg-slate-200 font-bold text-[11px] cursor-pointer"
                  >
                    Site Drill-Down &rarr;
                  </button>
                </div>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  </div>

  <!-- ========================================================================= -->
  <!-- SCREEN 4: RISK EXPLANATION AND EVIDENCE DRAWER (SLIDE-OVER)               -->
  <!-- Updated per Manager Notes (Images 12, 13, 14, 15):                        -->
  <!-- 1. Removed unexplained risk-probability figure                            -->
  <!-- 2. Aligned Site 104 percentages to 35% / 30% / 22% / 13% + derivation     -->
  <!-- 3. Removed recommended-actions/intervention section; retained risks &     -->
  <!--    supporting evidence + Vendor drill-down                                -->
  <!-- ========================================================================= -->
  {#if activeSite}
    {@const siteFactors = getSiteFactorDerivations(activeSite)}
    {@const siteSeemaParams = getSiteSeemaReadinessParams(activeSite)}
    {@const siteQueryStats = getSiteQueryMetrics(activeSite)}
    <div class="fixed inset-0 z-50 flex justify-end">
      <!-- Backdrop -->
      <div
        class="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity"
        on:click={closeDrawer}
        on:keydown={(e) => e.key === 'Escape' && closeDrawer()}
        role="button"
        tabindex="0"
        aria-label="Close risk drawer backdrop"
      ></div>

      <!-- Drawer Panel -->
      <aside class="relative w-full max-w-2xl bg-white h-full shadow-2xl border-l border-slate-200 overflow-y-auto flex flex-col z-10">
        
        <!-- Drawer Header -->
        <div class="p-6 border-b border-slate-200 sticky top-0 bg-white/95 backdrop-blur-md z-10 flex items-start justify-between">
          <div>
            <div class="flex items-center space-x-2">
              <span class="text-xs font-bold text-blue-600 uppercase tracking-wider">4. Risk Explanation &amp; Evidence Drawer</span>
              <span class="px-2 py-0.5 rounded text-[10px] font-bold border {getRiskBadge(activeSite.riskLevel)}">
                {activeSite.riskLevel} risk
              </span>
            </div>
            <h2 class="text-xl font-extrabold text-slate-900 mt-1">
              Site {activeSite.id} &ndash; {activeSite.name}
            </h2>
            <p class="text-xs text-slate-500">
              {activeSite.city}, {activeSite.country} &middot; Enrolled subjects: {activeSite.enrolledSubjects}
            </p>
            <button
              type="button"
              on:click={() => {
                const siteId = activeSite.id;
                closeDrawer();
                onSelectSite(siteId);
              }}
              class="mt-2 inline-flex items-center space-x-1 text-xs font-bold text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
            >
              <span>Open full site &amp; subject clean-patient tracker &rarr;</span>
            </button>
          </div>

          <button
            on:click={closeDrawer}
            class="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
            aria-label="Close drawer"
          >
            <X size={20} />
          </button>
        </div>

        <!-- Level 1 Summary Row in Drawer (Unexplained Risk-Probability Figure Removed per Image 13 & 14) -->
        <div class="grid grid-cols-3 gap-3 p-4 bg-slate-50 border-b border-slate-200 text-center">
          <div class="p-2.5 bg-white rounded-lg border border-slate-200/80">
            <span class="text-[10px] text-slate-400 uppercase font-bold block">Site Readiness</span>
            <strong class="text-sm font-extrabold text-slate-900">{activeSite.readinessScore}/100</strong>
            <span class="text-[10px] text-slate-500 block">Matches study-level parameters</span>
          </div>
          <div class="p-2.5 bg-white rounded-lg border border-slate-200/80">
            <span class="text-[10px] text-slate-400 uppercase font-bold block">Potential DBL Impact</span>
            <strong class="text-sm font-extrabold text-rose-600">{activeSite.forecastImpactDays} days</strong>
            <span class="text-[10px] text-slate-500 block">Critical-path delay</span>
          </div>
          <div class="p-2.5 bg-white rounded-lg border border-slate-200/80">
            <span class="text-[10px] text-slate-400 uppercase font-bold block">Open Items &amp; Queries</span>
            <strong class="text-sm font-extrabold text-slate-900">{activeSite.openItems} items</strong>
            <span class="text-[10px] text-rose-600 font-bold block">{siteQueryStats.totalQueries} queries ({siteQueryStats.endpointCritical} endpoint-crit)</span>
          </div>
        </div>

        <!-- Drawer Tabs (Simplified: Why at risk? | Supporting evidence (Levels 3–4) | Vendor drill-down) -->
        <!-- Recommended-actions section removed from drawer per Image 14 Blue instruction -->
        <div class="flex border-b border-slate-200 px-6 text-xs font-bold text-slate-600 bg-white">
          <button
            on:click={() => drawerTab = 'why'}
            class="py-3 px-3 border-b-2 transition-colors cursor-pointer {drawerTab === 'why' ? 'border-blue-600 text-blue-600 font-extrabold' : 'border-transparent hover:text-slate-900'}"
          >
            1. Why at risk? (35/30/22/13 Aligned)
          </button>
          <button
            on:click={() => drawerTab = 'evidence'}
            class="py-3 px-3 border-b-2 transition-colors cursor-pointer {drawerTab === 'evidence' ? 'border-blue-600 text-blue-600 font-extrabold' : 'border-transparent hover:text-slate-900'}"
          >
            2. Supporting Evidence (Levels 3–4)
          </button>
          <button
            on:click={() => drawerTab = 'vendors'}
            class="py-3 px-3 border-b-2 transition-colors cursor-pointer {drawerTab === 'vendors' ? 'border-blue-600 text-blue-600 font-extrabold' : 'border-transparent hover:text-slate-900'}"
          >
            3. Vendor Drill-Down Evidence
          </button>
        </div>

        <!-- Drawer Tab Content -->
        <div class="p-6 space-y-6 flex-1 text-xs text-slate-700">
          
          {#if drawerTab === 'why'}
            <!-- Level 1 & Level 2: Risk Summary & Aligned Factor Contributions (35/30/22/13) with Derivations -->
            <div class="p-3.5 rounded-xl bg-blue-50/80 border border-blue-200 text-blue-950 space-y-1">
              <div class="text-[10px] font-extrabold uppercase tracking-wider text-blue-700">
                Level 1: Selected Site Risk Summary &amp; Reason the Site Matters
              </div>
              <p class="leading-relaxed">
                <strong>Site {activeSite.id} ({activeSite.name})</strong> has <strong>{activeSite.openItems} open items</strong> and is on the study critical path with a potential DBL impact of <strong>{activeSite.forecastImpactDays} days</strong>. Below are the aligned factor contributions and how each percentage is derived.
              </p>
            </div>

            <div>
              <div class="flex items-center justify-between mb-2">
                <h3 class="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
                  Level 2: Contributing Factors &amp; How Each Contribution is Derived
                </h3>
                <span class="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold">
                  Aligned: 35% / 30% / 22% / 13%
                </span>
              </div>

              <div class="space-y-3">
                {#each siteFactors as factor}
                  <div class="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 space-y-1.5">
                    <div class="flex justify-between font-bold text-slate-900 text-xs">
                      <span>{factor.name}</span>
                      <span class="font-extrabold {factor.color === 'rose' ? 'text-rose-600' : factor.color === 'amber' ? 'text-amber-600' : factor.color === 'orange' ? 'text-orange-600' : 'text-blue-600'}">
                        {factor.pct}%
                      </span>
                    </div>
                    <div class="w-full bg-slate-200 rounded-full h-2">
                      <div
                        class="h-full rounded-full {factor.color === 'rose' ? 'bg-rose-500' : factor.color === 'amber' ? 'bg-amber-500' : factor.color === 'orange' ? 'bg-orange-500' : 'bg-blue-600'}"
                        style="width: {factor.pct}%"
                      ></div>
                    </div>
                    <p class="text-[11px] text-slate-600 leading-relaxed pt-0.5">
                      <strong>Derivation:</strong> {factor.derivation}
                    </p>
                  </div>
                {/each}
              </div>
            </div>

            <!-- Site Readiness Parameters matching Seema's Study-Level Drill-Down (Image 9 Blue) -->
            <div class="pt-2 border-t border-slate-200 space-y-2.5">
              <h4 class="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
                Site-Level Readiness Parameters (Matching Study-Level Categories)
              </h4>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {#each siteSeemaParams as sp}
                  <div class="p-2.5 rounded-lg border border-slate-200 bg-white">
                    <div class="flex items-center justify-between font-bold text-slate-900 text-[11px]">
                      <span>{sp.label}</span>
                      <span class="{sp.pct < 70 ? 'text-rose-600' : sp.pct < 85 ? 'text-amber-600' : 'text-emerald-700'}">{sp.pct}%</span>
                    </div>
                    <div class="w-full bg-slate-100 rounded-full h-1.5 my-1">
                      <div class="h-full rounded-full {sp.pct < 70 ? 'bg-rose-500' : sp.pct < 85 ? 'bg-amber-500' : 'bg-emerald-500'}" style="width: {sp.pct}%"></div>
                    </div>
                    <div class="text-[10px] text-slate-500">{sp.detail}</div>
                  </div>
                {/each}
              </div>
            </div>

          {:else if drawerTab === 'evidence'}
            <!-- Level 3 (Factor -> Supporting Evidence) & Level 4 (Source Record ID, Extract Date, Rule Applied, Last Refresh) -->
            <div class="space-y-4">
              <div class="flex items-center justify-between">
                <div>
                  <span class="text-[10px] font-extrabold uppercase tracking-wider text-blue-600 block">
                    Levels 3 &amp; 4: Factor &rarr; Supporting Evidence &rarr; Source Record
                  </span>
                  <h3 class="text-sm font-bold text-slate-900">
                    Traceable Source Records for Site {activeSite.id}
                  </h3>
                </div>
                <span class="text-[10px] text-slate-500 font-mono">Last Refresh: 31 Oct 2026, 08:00 UTC</span>
              </div>

              <div class="border border-slate-200 rounded-xl overflow-hidden">
                <table class="w-full text-left border-collapse text-xs">
                  <thead class="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold border-b border-slate-200">
                    <tr>
                      <th class="py-2.5 px-3">Record ID &amp; Factor</th>
                      <th class="py-2.5 px-2">Source System</th>
                      <th class="py-2.5 px-3">Rule Applied &amp; Evidence Detail</th>
                      <th class="py-2.5 px-2">Status &amp; Extract</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-slate-100 font-medium">
                    <tr>
                      <td class="py-2.5 px-3">
                        <div class="font-mono font-bold text-slate-900">SAE-REC-104-01</div>
                        <div class="text-[10px] text-rose-600 font-bold">Safety Recon (35%)</div>
                      </td>
                      <td class="py-2.5 px-2 text-slate-600">Argus Safety &harr; Rave EDC</td>
                      <td class="py-2.5 px-3">
                        <div class="font-semibold text-slate-900">Subj 104-003 Grade 3 CRS Onset Discordance</div>
                        <div class="text-[10px] text-slate-500">Rule: 21-CFR-312.32 48h Onset &amp; Causality Match</div>
                      </td>
                      <td class="py-2.5 px-2">
                        <span class="px-1.5 py-0.5 rounded bg-rose-100 text-rose-800 text-[10px] font-bold block text-center">Discrepant (12d)</span>
                        <span class="text-[9px] text-slate-400 font-mono block mt-0.5">31 Oct 08:00 UTC</span>
                      </td>
                    </tr>
                    <tr>
                      <td class="py-2.5 px-3">
                        <div class="font-mono font-bold text-slate-900">LXB-8921</div>
                        <div class="text-[10px] text-amber-600 font-bold">Lab Transfer (30%)</div>
                      </td>
                      <td class="py-2.5 px-2 text-slate-600">LabCorp SFTP API</td>
                      <td class="py-2.5 px-3">
                        <div class="font-semibold text-slate-900">48 ctDNA NGS samples failed SHA-256 checksum</div>
                        <div class="text-[10px] text-slate-500">Rule: Automated Vendor Package Integrity Gate</div>
                      </td>
                      <td class="py-2.5 px-2">
                        <span class="px-1.5 py-0.5 rounded bg-rose-100 text-rose-800 text-[10px] font-bold block text-center">Overdue (4d)</span>
                        <span class="text-[9px] text-slate-400 font-mono block mt-0.5">31 Oct 08:00 UTC</span>
                      </td>
                    </tr>
                    <tr>
                      <td class="py-2.5 px-3">
                        <div class="font-mono font-bold text-slate-900">QRY-104-089</div>
                        <div class="text-[10px] text-orange-600 font-bold">Ageing Queries (22%)</div>
                      </td>
                      <td class="py-2.5 px-2 text-slate-600">Medidata Rave EDC</td>
                      <td class="py-2.5 px-3">
                        <div class="font-semibold text-slate-900">Subj 104-003 Form TU-01 RECIST sum diameter mismatch [Endpoint-Critical]</div>
                        <div class="text-[10px] text-slate-500">Rule: RECIST 1.1 Source Worksheet Reconciliation (+9 routine queries open)</div>
                      </td>
                      <td class="py-2.5 px-2">
                        <span class="px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 text-[10px] font-bold block text-center">Open (16d)</span>
                        <span class="text-[9px] text-slate-400 font-mono block mt-0.5">31 Oct 08:00 UTC</span>
                      </td>
                    </tr>
                    <tr>
                      <td class="py-2.5 px-3">
                        <div class="font-mono font-bold text-slate-900">SIG-104-C4C6</div>
                        <div class="text-[10px] text-blue-600 font-bold">PI Sign-off (13%)</div>
                      </td>
                      <td class="py-2.5 px-2 text-slate-600">Rave e-Signature</td>
                      <td class="py-2.5 px-3">
                        <div class="font-semibold text-slate-900">12 completed subject casebooks awaiting PI sign-off</div>
                        <div class="text-[10px] text-slate-500">Rule: ICH E6(R2) Investigator Casebook Attestation</div>
                      </td>
                      <td class="py-2.5 px-2">
                        <span class="px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 text-[10px] font-bold block text-center">Pending (8d)</span>
                        <span class="text-[9px] text-slate-400 font-mono block mt-0.5">31 Oct 08:00 UTC</span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

          {:else}
            <!-- Tab 3: Vendor Drill-Down (Outstanding Issues and Late Transfers per Vendor as a Source of Evidence) -->
            <div class="space-y-4">
              <div>
                <span class="text-[10px] font-extrabold uppercase tracking-wider text-blue-600 block">
                  Vendor Evidence Drill-Down (Image 14 &amp; 15 Blue)
                </span>
                <h3 class="text-sm font-bold text-slate-900 mt-0.5">
                  Vendor &rarr; Outstanding Issues &amp; Late Transfers Affecting Site {activeSite.id}
                </h3>
                <p class="text-[11px] text-slate-500">
                  Automated vendor metrics ingested without manual cleanliness input.
                </p>
              </div>

              <div class="space-y-3">
                {#each automatedVendors as vnd}
                  <div class="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2">
                    <div class="flex items-center justify-between">
                      <div>
                        <strong class="font-bold text-slate-900 text-xs">{vnd.name}</strong>
                        <span class="text-[10px] text-slate-500 block">{vnd.feedType}</span>
                      </div>
                      <span class="px-2 py-0.5 rounded text-[10px] font-bold {vnd.statusColor === 'rose' ? 'bg-rose-100 text-rose-800' : vnd.statusColor === 'amber' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'}">
                        Auto-Cleanliness: {vnd.cleanlinessAutoScore}%
                      </span>
                    </div>

                    <div class="space-y-1.5 pt-1">
                      {#each vnd.transfersAndIssues as ti}
                        <div class="p-2.5 bg-white rounded-lg border border-slate-200 flex items-start justify-between gap-2 text-[11px]">
                          <div>
                            <span class="font-mono font-bold text-slate-900">{ti.id}</span>
                            <span class="font-semibold text-slate-800 ml-1">&middot; {ti.type}</span>
                            <div class="text-[10px] text-slate-500 mt-0.5">
                              Site: {ti.siteId} &middot; Due: {ti.dueDate} &middot; Volume: {ti.recordCount}
                            </div>
                          </div>
                          <span class="px-1.5 py-0.5 rounded bg-rose-50 text-rose-700 font-bold text-[10px] shrink-0">
                            +{ti.daysLate}d late
                          </span>
                        </div>
                      {/each}
                    </div>
                  </div>
                {/each}
              </div>
            </div>
          {/if}

        </div>
      </aside>
    </div>
  {/if}

</div>
