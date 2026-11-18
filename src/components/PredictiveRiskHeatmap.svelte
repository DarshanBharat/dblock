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
  export let activeRole: string = 'all';

  // View mode: 'map' | 'chart' | 'table' | 'vendors'
  let viewMode = 'map';
  let viewByMetric = 'impact';
  let selectedCountry = 'all';
  let selectedSiteId = 'all';
  let riskTierFilter = 'all';
  let impactFilter = 'all';
  let driverFilter = 'all';
  let criticalityFilter = 'all';
  let searchQuery = '';
  let showRiskBasisInfo = false;

  // Sync global Workstream/Role filter (#2) to site driver filter
  $: if (activeRole === 'safety') {
    driverFilter = 'safety';
  } else if (activeRole === 'vendor') {
    driverFilter = 'lab';
  } else if (activeRole === 'cdm') {
    driverFilter = 'queries';
  } else if (activeRole === 'cra_site') {
    driverFilter = 'signoff';
  } else if (activeRole === 'all' || activeRole === 'my_queue') {
    driverFilter = 'all';
  }

  // Automated Multi-Vendor View state
  let selectedVendorId = 'VND-LABCORP';

  const automatedVendors = [
    {
      id: 'VND-LABCORP',
      name: 'LabCorp Bioanalytical (Central Lab)',
      feedType: 'SFTP + HL7/FHIR API · SDTM.LB',
      status: 'Late Transfer (+4d)',
      statusColor: 'rose',
      cleanlinessAutoScore: 64,
      totalTransfers: 18,
      lateTransfersCount: 1,
      outstandingIssuesCount: 3,
      lastAutomatedSync: '31 Oct 2026, 08:00 UTC',
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
      feedType: 'DICOM Portal API · SDTM.TU / TR',
      status: 'Adjudication Pending',
      statusColor: 'amber',
      cleanlinessAutoScore: 82,
      totalTransfers: 24,
      lateTransfersCount: 1,
      outstandingIssuesCount: 2,
      lastAutomatedSync: '31 Oct 2026, 07:30 UTC',
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
      name: 'Oracle Argus Safety (PV Gateway)',
      feedType: 'E2B(R3) Safety Gateway · SDTM.AE / CE',
      status: '2 Critical Discrepancies',
      statusColor: 'rose',
      cleanlinessAutoScore: 80,
      totalTransfers: 30,
      lateTransfersCount: 0,
      outstandingIssuesCount: 2,
      lastAutomatedSync: '31 Oct 2026, 07:45 UTC',
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
      name: 'Eurofins Central Lab (Chemistry)',
      feedType: 'CDISC LB REST Feed · SDTM.LB',
      status: 'QA Review (+1d)',
      statusColor: 'amber',
      cleanlinessAutoScore: 91,
      totalTransfers: 32,
      lateTransfersCount: 1,
      outstandingIssuesCount: 1,
      lastAutomatedSync: '31 Oct 2026, 06:00 UTC',
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
      name: 'Signant Health (eCOA / PRO)',
      feedType: 'Cloud Sync API · SDTM.QS',
      status: 'Healthy (95% Sync)',
      statusColor: 'emerald',
      cleanlinessAutoScore: 95,
      totalTransfers: 45,
      lateTransfersCount: 0,
      outstandingIssuesCount: 1,
      lastAutomatedSync: '31 Oct 2026, 06:30 UTC',
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

  function getSiteQueryMetrics(site: any) {
    if (site.id === '104') return { totalQueries: 14, endpointCritical: 5, nonCritical: 9 };
    if (site.id === '208') return { totalQueries: 38, endpointCritical: 0, nonCritical: 38 };
    if (site.id === '317') return { totalQueries: 7, endpointCritical: 5, nonCritical: 2 };
    if (site.id === '405') return { totalQueries: 9, endpointCritical: 2, nonCritical: 7 };
    const total = Math.max(2, Math.round((site.openItems || 8) * 0.7));
    const crit = Math.min(total, site.criticalOpenItems || 0);
    return { totalQueries: total, endpointCritical: crit, nonCritical: total - crit };
  }

  function getSiteReadinessParams(site: any) {
    if (site.id === '104') {
      return [
        { label: 'EDC Data Entry & SDV', pct: 84, detail: '40/48 subjects clean entry; Form DD-01 & TU-01 pending' },
        { label: 'Query Resolution', pct: 68, detail: '14 open queries >14d (5 RECIST endpoint-critical, 9 routine)' },
        { label: 'External Vendor Reconciliation', pct: 52, detail: 'LabCorp ctDNA batch #LXB-8921 (48 samples) 4d overdue' },
        { label: 'Medical Coding (MedDRA / WHODrug)', pct: 88, detail: '2 Grade 3 CRS secondary terms awaiting medical review' },
        { label: 'Investigator e-Signatures (21 CFR 11)', pct: 83, detail: '40/48 signed; 8 completed casebooks awaiting PI sign-off' },
        { label: 'Safety Reconciliation (Rave vs Argus)', pct: 55, detail: '2 unresolved SAE discrepancies blocking safety freeze' }
      ];
    }
    if (site.id === '208') {
      return [
        { label: 'EDC Data Entry & SDV', pct: 91, detail: '33/36 subjects verified' },
        { label: 'Query Resolution', pct: 74, detail: '38 open queries (0 primary-endpoint; 38 routine/admin)' },
        { label: 'External Vendor Reconciliation', pct: 86, detail: 'Eurofins batch #LXB-8940 in final QA review' },
        { label: 'Medical Coding (MedDRA / WHODrug)', pct: 92, detail: 'ConMed trade names under routine review' },
        { label: 'Investigator e-Signatures (21 CFR 11)', pct: 89, detail: '32/36 casebooks signed' },
        { label: 'Safety Reconciliation (Rave vs Argus)', pct: 100, detail: 'Zero SAE discrepancies' }
      ];
    }
    if (site.id === '405') {
      return [
        { label: 'EDC Data Entry & SDV', pct: 88, detail: '14/16 subjects verified' },
        { label: 'Query Resolution', pct: 82, detail: '9 open queries (2 endpoint-critical)' },
        { label: 'External Vendor Reconciliation', pct: 85, detail: 'Eurofins chemistry calibration check in progress' },
        { label: 'Medical Coding (MedDRA / WHODrug)', pct: 94, detail: 'All oncology ConMeds coded' },
        { label: 'Investigator e-Signatures (21 CFR 11)', pct: 63, detail: '10/16 signed; 6 completed casebooks awaiting PI sign-off' },
        { label: 'Safety Reconciliation (Rave vs Argus)', pct: 100, detail: 'Zero SAE discrepancies' }
      ];
    }
    const base = site.readinessScore || 80;
    return [
      { label: 'EDC Data Entry & SDV', pct: Math.min(99, base + 6), detail: 'Automated EDC completeness check' },
      { label: 'Query Resolution', pct: base, detail: 'All open queries tracked; endpoint-critical flagged' },
      { label: 'External Vendor Reconciliation', pct: Math.max(55, base - 5), detail: 'Automated vendor transfer status' },
      { label: 'Medical Coding (MedDRA / WHODrug)', pct: Math.min(98, base + 8), detail: 'MedDRA 27.0 & WHODrug C3 coding status' },
      { label: 'Investigator e-Signatures (21 CFR 11)', pct: Math.max(60, base - 3), detail: 'PI electronic signature completion' },
      { label: 'Safety Reconciliation (Rave vs Argus)', pct: Math.min(100, base + 4), detail: 'Rave-Argus SAE alignment' }
    ];
  }

  function getSiteFactorDerivations(site: any) {
    if (site.id === '104') {
      return [
        {
          id: 'safety',
          name: 'Safety reconciliation discrepancies',
          pct: 35,
          color: 'rose',
          derivation: '2 unresolved SAE cases (SAE-REC-104-01 & SAE-REC-104-02) gating global safety freeze = 2.1d of 6.0d critical-path impact (35%).'
        },
        {
          id: 'lab',
          name: 'Laboratory transfer delay (Vendor)',
          pct: 30,
          color: 'amber',
          derivation: 'Overdue LabCorp ctDNA batch #LXB-8921 (48 samples, 4d past SLA due to SHA-256 checksum error) = 1.8d of 6.0d impact (30%).'
        },
        {
          id: 'queries',
          name: 'Ageing queries (14 total; 5 endpoint-critical)',
          pct: 22,
          color: 'orange',
          derivation: '14 queries aged >14d (5 primary-endpoint RECIST queries weighted 2.0x + 9 routine queries weighted 0.5x) = 1.3d of 6.0d impact (22%).'
        },
        {
          id: 'signoff',
          name: 'Investigator e-Signature backlog',
          pct: 13,
          color: 'blue',
          derivation: '8 completed subject casebooks at Site 104 awaiting PI e-signature (of 18 study-wide) = 0.8d of 6.0d impact (13%).'
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
        derivation: 'Rave-Argus SAE reconciliation status and pharmacovigilance freeze dependency weight.'
      },
      {
        id: 'lab',
        name: 'Laboratory & external vendor transfers',
        pct: b.labTransferDelay || 20,
        color: 'amber',
        derivation: 'External vendor batch SLA variance and specimen reconciliation completeness.'
      },
      {
        id: 'queries',
        name: 'Outstanding queries (All & Endpoint-Critical)',
        pct: b.ageingQueries || 50,
        color: 'orange',
        derivation: 'Total open query volume divided by site daily closure velocity, with endpoint-critical queries weighted 2.0x.'
      },
      {
        id: 'signoff',
        name: 'Investigator e-Signature status',
        pct: b.signOffStatus || 20,
        color: 'blue',
        derivation: 'Unsigned completed subject eCRF casebooks vs historical PI signing cadence.'
      }
    ];
  }

  $: countriesList = Array.from(new Set(sites.map(s => s.country))).sort();

  $: siteOptionsForFilter = sites
    .filter(s => selectedCountry === 'all' || s.country === selectedCountry)
    .sort((a, b) => Number(a.id) - Number(b.id));

  $: if (selectedSiteId !== 'all' && !siteOptionsForFilter.some(s => s.id === selectedSiteId)) {
    selectedSiteId = 'all';
  }

  $: hasActiveTableFilters =
    selectedCountry !== 'all' ||
    selectedSiteId !== 'all' ||
    riskTierFilter !== 'all' ||
    impactFilter !== 'all' ||
    driverFilter !== 'all' ||
    criticalityFilter !== 'all' ||
    searchQuery.trim() !== '';

  function resetTableFilters() {
    selectedCountry = 'all';
    selectedSiteId = 'all';
    riskTierFilter = 'all';
    impactFilter = 'all';
    driverFilter = 'all';
    criticalityFilter = 'all';
    searchQuery = '';
  }

  $: filteredSites = sites.filter(s => {
    if (selectedCountry !== 'all' && s.country !== selectedCountry) return false;
    if (selectedSiteId !== 'all' && s.id !== selectedSiteId) return false;
    if (riskTierFilter === 'critical' && s.riskLevel !== 'Critical') return false;
    if (riskTierFilter === 'high' && s.riskLevel !== 'High') return false;
    if (riskTierFilter === 'medium' && s.riskLevel !== 'Medium') return false;
    if (riskTierFilter === 'low' && s.riskLevel !== 'Low') return false;

    if (impactFilter === 'high' && (s.maxDelayDays || 0) < 3) return false;
    if (impactFilter === 'moderate' && ((s.maxDelayDays || 0) < 1 || (s.maxDelayDays || 0) >= 3)) return false;
    if (impactFilter === 'low' && (s.maxDelayDays || 0) >= 1) return false;

    if (driverFilter !== 'all') {
      const driversText = [
        ...(s.keyRiskDrivers || []),
        ...(s.reasons || [])
      ].join(' ').toLowerCase();
      if (driverFilter === 'safety' && !driversText.includes('sae') && !driversText.includes('safety')) return false;
      if (driverFilter === 'lab' && !driversText.includes('lab') && !driversText.includes('transfer')) return false;
      if (driverFilter === 'queries' && !driversText.includes('quer') && !driversText.includes('edc')) return false;
      if (driverFilter === 'signoff' && !driversText.includes('sign')) return false;
    }

    if (criticalityFilter === 'critical_items' && (s.criticalOpenItems || 0) <= 0) return false;
    if (criticalityFilter === 'endpoint_queries' && getSiteQueryMetrics(s).endpointCritical <= 0) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return s.id.toLowerCase().includes(q) ||
        s.name.toLowerCase().includes(q) ||
        s.country.toLowerCase().includes(q) ||
        s.city.toLowerCase().includes(q);
    }
    return true;
  });

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
    if (level === 'Critical') return 'bg-rose-50 text-rose-700 border-rose-200/80';
    if (level === 'High') return 'bg-amber-50 text-amber-700 border-amber-200/80';
    if (level === 'Medium') return 'bg-orange-50 text-orange-700 border-orange-200/80';
    return 'bg-emerald-50 text-emerald-700 border-emerald-200/80';
  }
</script>

<div class="space-y-5">

  <!-- ========================================================================= -->
  <!-- PAGE HEADER + VIEW CONTROLS                                               -->
  <!-- ========================================================================= -->
  <div class="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
    <div>
      <div class="flex items-center gap-2 text-xs font-medium text-slate-500 mb-1">
        <span>CA-209-301</span>
        <span>&middot;</span>
        <span>12 Active Sites across {countriesList.length} Countries</span>
      </div>
      <h1 class="text-2xl font-bold tracking-tight text-slate-900 font-display">
        Site &amp; Vendor Risk Intelligence
      </h1>
    </div>

    <div class="flex flex-wrap items-center gap-3 shrink-0">
      <button
        type="button"
        on:click={() => showRiskBasisInfo = !showRiskBasisInfo}
        class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 bg-white border border-slate-200/80 hover:text-slate-900 cursor-pointer"
      >
        <Info size={13} class="text-slate-400" />
        <span>Risk Tier Thresholds</span>
      </button>

      <div class="flex items-center gap-2 text-xs text-slate-600">
        <span class="text-slate-400 font-medium">Sort</span>
        <select
          bind:value={viewByMetric}
          class="bg-white border border-slate-200/80 rounded-lg py-1.5 px-2.5 text-xs font-semibold text-slate-800 focus:outline-hidden focus:border-blue-500"
        >
          <option value="impact">Critical-Path Impact (Days)</option>
          <option value="critical_path">Critical Blocker Count</option>
          <option value="volume">Total Open Items</option>
          <option value="weekly_change">7-Day Velocity</option>
        </select>
      </div>

      <div class="db-segmented">
        <button
          type="button"
          on:click={() => viewMode = 'map'}
          class="db-segmented-btn flex items-center gap-1.5 {viewMode === 'map' ? 'db-segmented-btn-active' : ''}"
        >
          <MapPin size={13} />
          <span>Map</span>
        </button>
        <button
          type="button"
          on:click={() => viewMode = 'chart'}
          class="db-segmented-btn flex items-center gap-1.5 {viewMode === 'chart' ? 'db-segmented-btn-active' : ''}"
        >
          <BarChart3 size={13} />
          <span>Quadrant</span>
        </button>
        <button
          type="button"
          on:click={() => viewMode = 'table'}
          class="db-segmented-btn flex items-center gap-1.5 {viewMode === 'table' ? 'db-segmented-btn-active' : ''}"
        >
          <Table size={13} />
          <span>Table</span>
        </button>
        <button
          type="button"
          on:click={() => viewMode = 'vendors'}
          class="db-segmented-btn flex items-center gap-1.5 {viewMode === 'vendors' ? 'db-segmented-btn-active' : ''}"
        >
          <Server size={13} />
          <span>Vendors (5)</span>
        </button>
      </div>
    </div>
  </div>

  {#if showRiskBasisInfo}
    <div class="db-card p-4 grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
      <div class="p-3 rounded-xl bg-rose-50/50 border border-rose-200/60">
        <span class="font-bold text-rose-800 block">Critical Tier</span>
        <span class="text-[11px] text-rose-700">&ge;5.0d critical-path impact or active safety freeze blocker</span>
      </div>
      <div class="p-3 rounded-xl bg-amber-50/50 border border-amber-200/60">
        <span class="font-bold text-amber-800 block">High Tier</span>
        <span class="text-[11px] text-amber-700">3.0–4.9d critical-path impact or overdue vendor transfer</span>
      </div>
      <div class="p-3 rounded-xl bg-orange-50/50 border border-orange-200/60">
        <span class="font-bold text-orange-800 block">Medium Tier</span>
        <span class="text-[11px] text-orange-700">1.0–2.9d critical-path impact or ageing routine queries</span>
      </div>
      <div class="p-3 rounded-xl bg-emerald-50/50 border border-emerald-200/60">
        <span class="font-bold text-emerald-800 block">Low Tier</span>
        <span class="text-[11px] text-emerald-700">&lt;1.0d impact and zero primary-endpoint blockers</span>
      </div>
    </div>
  {/if}

  <!-- Country Filter Pill Strip -->
  <div class="flex items-center justify-between gap-3 flex-wrap">
    <div class="flex items-center gap-1.5 flex-wrap text-xs">
      <button
        type="button"
        on:click={() => selectedCountry = 'all'}
        class="px-3 py-1.5 rounded-full font-semibold transition-all cursor-pointer {selectedCountry === 'all' ? 'bg-slate-900 text-white' : 'bg-white text-slate-600 border border-slate-200/80 hover:text-slate-900'}"
      >
        All Countries ({sites.length})
      </button>
      {#each countriesList as ctry}
        {@const ctrySites = sites.filter(s => s.country === ctry)}
        <button
          type="button"
          on:click={() => selectedCountry = ctry}
          class="px-3 py-1.5 rounded-full font-medium transition-all cursor-pointer {selectedCountry === ctry ? 'bg-slate-900 text-white font-semibold' : 'bg-white text-slate-600 border border-slate-200/80 hover:text-slate-900'}"
        >
          {ctry} ({ctrySites.length})
        </button>
      {/each}
    </div>
  </div>

  <!-- ========================================================================= -->
  <!-- AUTOMATED MULTI-VENDOR VIEW                                               -->
  <!-- ========================================================================= -->
  {#if viewMode === 'vendors'}
    <div class="db-card p-6 space-y-5">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100">
        <div>
          <h3 class="text-base font-bold text-slate-900">
            External Data Vendor Feeds &amp; Reconciliation Gate
          </h3>
          <p class="text-xs text-slate-500 mt-0.5">
            Direct SFTP, HL7/FHIR, and E2B(R3) telemetry ahead of the 05 Dec Vendor Transfer Lock gate
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
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-5">
      <!-- World Map Container (2 Cols) -->
      <div class="lg:col-span-2 db-card p-5 flex flex-col justify-between">
        <div>
          <div class="flex items-center justify-between mb-3">
            <div>
              <h3 class="text-sm font-bold text-slate-900">Global Site Distribution ({filteredSites.length} sites)</h3>
              <p class="text-[11px] text-slate-500">Select a site marker to inspect critical-path blockers</p>
            </div>
            <button
              type="button"
              on:click={() => openSiteDrawer(sites.find(s => s.id === '104') || sites[0])}
              class="text-blue-600 hover:text-blue-800 text-xs font-semibold cursor-pointer"
            >
              Inspect Site 104 &rarr;
            </button>
          </div>

          <RealWorldMap
            sites={filteredSites}
            activeSiteId={activeSite?.id}
            onSelectSite={openSiteDrawer}
          />
        </div>
      </div>

      <!-- Quick Vendor & Query Summary Panel beside Map -->
      <div class="db-card p-5 flex flex-col justify-between space-y-4">
        <div>
          <h3 class="text-sm font-bold text-slate-900 mb-3">Study Query &amp; Vendor Telemetry</h3>

          <div class="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70 space-y-2.5 text-xs mb-4">
            <div class="font-semibold text-slate-700 flex items-center justify-between">
              <span>Outstanding Queries</span>
              <span class="font-mono font-bold text-sm text-slate-900">68 open</span>
            </div>
            <div class="grid grid-cols-2 gap-2">
              <div class="p-2.5 bg-white rounded-lg border border-rose-200/70">
                <span class="text-[10px] text-rose-700 font-semibold uppercase block">Endpoint-Critical</span>
                <strong class="text-sm font-bold text-rose-600">14 queries</strong>
                <span class="text-[10px] text-slate-500 block">RECIST / Primary PFS</span>
              </div>
              <div class="p-2.5 bg-white rounded-lg border border-slate-200/70">
                <span class="text-[10px] text-slate-600 font-semibold uppercase block">Routine</span>
                <strong class="text-sm font-bold text-slate-800">54 queries</strong>
                <span class="text-[10px] text-slate-500 block">AE / ConMed / Demo</span>
              </div>
            </div>
          </div>

          <div class="space-y-2">
            <div class="flex items-center justify-between text-xs font-semibold text-slate-800">
              <span>Vendor Feed Health</span>
              <button
                type="button"
                on:click={() => viewMode = 'vendors'}
                class="text-blue-600 hover:underline text-[11px] cursor-pointer"
              >
                All 5 Vendors &rarr;
              </button>
            </div>
            {#each automatedVendors.slice(0, 3) as vnd}
              <div class="p-2.5 rounded-xl bg-slate-50/80 border border-slate-200/60 flex items-center justify-between text-xs">
                <div>
                  <div class="font-semibold text-slate-900">{vnd.name}</div>
                  <div class="text-[10px] text-slate-500">{vnd.lateTransfersCount} late &middot; {vnd.outstandingIssuesCount} open issues</div>
                </div>
                <span class="px-2 py-0.5 rounded-md text-[10px] font-bold {vnd.statusColor === 'rose' ? 'bg-rose-50 text-rose-700' : 'bg-amber-50 text-amber-700'}">
                  {vnd.cleanlinessAutoScore}%
                </span>
              </div>
            {/each}
          </div>
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
  <!-- SITE TABLE VIEW                                                           -->
  <!-- ========================================================================= -->
  <div class="db-card overflow-hidden">
    
    <!-- Filter Chips & Search Bar -->
    <div class="p-4 sm:p-5 border-b border-slate-100 space-y-3">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div class="flex items-center space-x-1.5 overflow-x-auto text-xs">
          <button
            on:click={() => riskTierFilter = 'all'}
            class="px-3 py-1.5 rounded-full font-semibold transition-all cursor-pointer {riskTierFilter === 'all' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}"
          >
            All sites ({filteredSites.length})
          </button>
          <button
            on:click={() => riskTierFilter = 'critical'}
            class="px-3 py-1.5 rounded-full font-semibold transition-all cursor-pointer {riskTierFilter === 'critical' ? 'bg-rose-600 text-white' : 'bg-rose-50 text-rose-700 hover:bg-rose-100'}"
          >
            Critical ({sites.filter(s => s.riskLevel === 'Critical').length})
          </button>
          <button
            on:click={() => riskTierFilter = 'high'}
            class="px-3 py-1.5 rounded-full font-semibold transition-all cursor-pointer {riskTierFilter === 'high' ? 'bg-amber-600 text-white' : 'bg-amber-50 text-amber-700 hover:bg-amber-100'}"
          >
            High ({sites.filter(s => s.riskLevel === 'High').length})
          </button>
          <button
            on:click={() => riskTierFilter = 'medium'}
            class="px-3 py-1.5 rounded-full font-semibold transition-all cursor-pointer {riskTierFilter === 'medium' ? 'bg-orange-500 text-white' : 'bg-orange-50 text-orange-700 hover:bg-orange-100'}"
          >
            Medium ({sites.filter(s => s.riskLevel === 'Medium').length})
          </button>
          <button
            on:click={() => riskTierFilter = 'low'}
            class="px-3 py-1.5 rounded-full font-semibold transition-all cursor-pointer {riskTierFilter === 'low' ? 'bg-emerald-600 text-white' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'}"
          >
            Low ({sites.filter(s => s.riskLevel === 'Low').length})
          </button>
        </div>

        <div class="flex items-center space-x-2.5 self-end sm:self-center">
          {#if hasActiveTableFilters}
            <button
              type="button"
              on:click={resetTableFilters}
              class="text-[11px] font-semibold text-blue-600 hover:text-blue-800 px-2 py-1 rounded hover:bg-blue-50 transition-colors cursor-pointer"
            >
              Clear filters
            </button>
          {/if}
          <div class="relative">
            <Search size={14} class="absolute left-2.5 top-2.5 text-slate-400" />
            <input
              type="text"
              bind:value={searchQuery}
              placeholder="Search site, country or ID"
              class="text-xs bg-slate-50 border border-slate-200/80 rounded-lg py-1.5 pl-8 pr-3 text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-blue-500 w-52"
            />
          </div>
        </div>
      </div>

      <!-- Structured Table Column Filters -->
      <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 pt-3 border-t border-slate-100">
        <div>
          <label for="table-country-filter" class="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">Country</label>
          <select
            id="table-country-filter"
            bind:value={selectedCountry}
            class="w-full text-xs bg-slate-50 border border-slate-200/80 rounded-lg py-1.5 px-2 text-slate-800"
          >
            <option value="all">All countries ({countriesList.length})</option>
            {#each countriesList as ctry}
              <option value={ctry}>{ctry}</option>
            {/each}
          </select>
        </div>

        <div>
          <label for="table-site-filter" class="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">Site</label>
          <select
            id="table-site-filter"
            bind:value={selectedSiteId}
            class="w-full text-xs bg-slate-50 border border-slate-200/80 rounded-lg py-1.5 px-2 text-slate-800"
          >
            <option value="all">All sites ({siteOptionsForFilter.length})</option>
            {#each siteOptionsForFilter as st}
              <option value={st.id}>Site {st.id} – {st.name}</option>
            {/each}
          </select>
        </div>

        <div>
          <label for="table-risk-filter" class="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">Risk Level</label>
          <select
            id="table-risk-filter"
            bind:value={riskTierFilter}
            class="w-full text-xs bg-slate-50 border border-slate-200/80 rounded-lg py-1.5 px-2 text-slate-800"
          >
            <option value="all">All risk levels</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>

        <div>
          <label for="table-impact-filter" class="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">DBL Impact</label>
          <select
            id="table-impact-filter"
            bind:value={impactFilter}
            class="w-full text-xs bg-slate-50 border border-slate-200/80 rounded-lg py-1.5 px-2 text-slate-800"
          >
            <option value="all">All impacts</option>
            <option value="high">High (3+ days)</option>
            <option value="moderate">Moderate (1–3 days)</option>
            <option value="low">Low (&lt;1 day)</option>
          </select>
        </div>

        <div>
          <label for="table-driver-filter" class="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">Risk Driver</label>
          <select
            id="table-driver-filter"
            bind:value={driverFilter}
            class="w-full text-xs bg-slate-50 border border-slate-200/80 rounded-lg py-1.5 px-2 text-slate-800"
          >
            <option value="all">All drivers</option>
            <option value="safety">Safety / SAE</option>
            <option value="lab">Lab Transfer</option>
            <option value="queries">Open Queries / EDC</option>
            <option value="signoff">Investigator Sign-offs</option>
          </select>
        </div>

        <div>
          <label for="table-criticality-filter" class="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">Criticality</label>
          <select
            id="table-criticality-filter"
            bind:value={criticalityFilter}
            class="w-full text-xs bg-slate-50 border border-slate-200/80 rounded-lg py-1.5 px-2 text-slate-800"
          >
            <option value="all">All items</option>
            <option value="critical_items">Has critical open items</option>
            <option value="endpoint_queries">Endpoint-critical queries &gt; 0</option>
          </select>
        </div>
      </div>
    </div>

    <!-- The Site Table -->
    <div class="overflow-x-auto">
      <table class="w-full text-left border-collapse text-xs">
        <thead>
          <tr class="bg-slate-50/70 text-slate-500 border-b border-slate-200/80 text-[10px] font-semibold uppercase tracking-wider">
            <th class="py-3 px-4">Site ID &amp; Name</th>
            <th class="py-3 px-2">Country</th>
            <th class="py-3 px-3 text-center">Open Items</th>
            <th class="py-3 px-3 text-center">Queries (Total / Critical)</th>
            <th class="py-3 px-3 text-center">DBL Impact</th>
            <th class="py-3 px-3">Risk Tier</th>
            <th class="py-3 px-3">Primary Drivers</th>
            <th class="py-3 px-3 text-right">Inspect</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100 font-medium text-slate-700">
          {#each sortedSites as site}
            {@const qMetrics = getSiteQueryMetrics(site)}
            <tr
              class="hover:bg-slate-50/80 transition-colors cursor-pointer group"
              on:click={() => openSiteDrawer(site)}
            >
              <td class="py-3.5 px-4">
                <div class="font-semibold text-slate-900 group-hover:text-blue-600">{site.code}: {site.name}</div>
                <div class="text-[11px] text-slate-500">Readiness {site.readinessScore}% &middot; {site.enrolledSubjects} subjects</div>
              </td>
              <td class="py-3.5 px-2 text-slate-700">
                {site.country} ({site.countryCode})
              </td>
              <td class="py-3.5 px-3 text-center font-semibold text-slate-800 num-tabular">
                {site.openItems}
              </td>
              <td class="py-3.5 px-3 text-center">
                <div class="font-semibold text-slate-900 num-tabular">{qMetrics.totalQueries} open</div>
                {#if qMetrics.endpointCritical > 0}
                  <span class="inline-block px-1.5 py-0.5 rounded bg-rose-50 text-rose-700 text-[10px] font-semibold mt-0.5">
                    {qMetrics.endpointCritical} endpoint-critical
                  </span>
                {:else}
                  <span class="text-[10px] text-slate-400 mt-0.5 block">0 endpoint-critical</span>
                {/if}
              </td>
              <td class="py-3.5 px-3 text-center font-semibold font-mono num-tabular {site.maxDelayDays >= 5 ? 'text-rose-600' : site.maxDelayDays >= 3 ? 'text-amber-600' : 'text-slate-700'}">
                {site.forecastImpactDays}d
              </td>
              <td class="py-3.5 px-3">
                <span class="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold border {getRiskBadge(site.riskLevel)}">
                  {site.riskLevel}
                </span>
              </td>
              <td class="py-3.5 px-3 text-slate-600 truncate max-w-[180px]">
                {site.keyRiskDrivers}
              </td>
              <td class="py-3.5 px-3 whitespace-nowrap text-right">
                <div class="flex items-center justify-end space-x-1.5">
                  <button
                    type="button"
                    on:click|stopPropagation={() => openSiteDrawer(site)}
                    class="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 font-semibold text-[11px] cursor-pointer"
                  >
                    Breakdown
                  </button>
                  <button
                    type="button"
                    on:click|stopPropagation={() => onSelectSite(site.id)}
                    class="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 font-semibold text-[11px] cursor-pointer"
                  >
                    Casebooks &rarr;
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
  <!-- RISK EXPLANATION AND EVIDENCE DRAWER (SLIDE-OVER)                         -->
  <!-- ========================================================================= -->
  {#if activeSite}
    {@const siteFactors = getSiteFactorDerivations(activeSite)}
    {@const siteReadinessParams = getSiteReadinessParams(activeSite)}
    {@const siteQueryStats = getSiteQueryMetrics(activeSite)}
    <div class="fixed inset-0 z-50 flex justify-end">
      <div
        class="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
        on:click={closeDrawer}
        on:keydown={(e) => e.key === 'Escape' && closeDrawer()}
        role="button"
        tabindex="0"
        aria-label="Close risk drawer backdrop"
      ></div>

      <aside class="relative w-full max-w-2xl bg-white h-full shadow-2xl border-l border-slate-200 overflow-y-auto flex flex-col z-10">
        
        <div class="p-6 border-b border-slate-200/80 sticky top-0 bg-white/95 backdrop-blur-md z-10 flex items-start justify-between">
          <div>
            <div class="flex items-center space-x-2">
              <span class="text-xs font-semibold text-slate-500">Site {activeSite.id} Risk &amp; Evidence</span>
              <span class="px-2 py-0.5 rounded-md text-[10px] font-semibold border {getRiskBadge(activeSite.riskLevel)}">
                {activeSite.riskLevel} Risk
              </span>
            </div>
            <h2 class="text-xl font-bold text-slate-900 mt-1">
              {activeSite.name}
            </h2>
            <p class="text-xs text-slate-500">
              {activeSite.city}, {activeSite.country} &middot; {activeSite.enrolledSubjects} enrolled subjects
            </p>
            <button
              type="button"
              on:click={() => {
                const siteId = activeSite.id;
                closeDrawer();
                onSelectSite(siteId);
              }}
              class="mt-2 inline-flex items-center space-x-1 text-xs font-semibold text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
            >
              <span>Open Full Site Casebook Tracker &rarr;</span>
            </button>
          </div>

          <button
            on:click={closeDrawer}
            class="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label="Close drawer"
          >
            <X size={20} />
          </button>
        </div>

        <div class="grid grid-cols-3 gap-3 p-4 bg-slate-50/70 border-b border-slate-200/80 text-center">
          <div class="p-2.5 bg-white rounded-xl border border-slate-200/70">
            <span class="text-[10px] text-slate-400 uppercase font-semibold block">Site Readiness</span>
            <strong class="text-sm font-bold text-slate-900">{activeSite.readinessScore}%</strong>
          </div>
          <div class="p-2.5 bg-white rounded-xl border border-slate-200/70">
            <span class="text-[10px] text-slate-400 uppercase font-semibold block">DBL Impact</span>
            <strong class="text-sm font-bold text-rose-600">{activeSite.forecastImpactDays}d</strong>
          </div>
          <div class="p-2.5 bg-white rounded-xl border border-slate-200/70">
            <span class="text-[10px] text-slate-400 uppercase font-semibold block">Open Queries</span>
            <strong class="text-sm font-bold text-slate-900">{siteQueryStats.totalQueries} ({siteQueryStats.endpointCritical} critical)</strong>
          </div>
        </div>

        <div class="flex border-b border-slate-200/80 px-6 text-xs font-semibold text-slate-600 bg-white">
          <button
            on:click={() => drawerTab = 'why'}
            class="py-3 px-3 border-b-2 transition-colors cursor-pointer {drawerTab === 'why' ? 'border-blue-600 text-blue-600' : 'border-transparent hover:text-slate-900'}"
          >
            Delay Drivers
          </button>
          <button
            on:click={() => drawerTab = 'evidence'}
            class="py-3 px-3 border-b-2 transition-colors cursor-pointer {drawerTab === 'evidence' ? 'border-blue-600 text-blue-600' : 'border-transparent hover:text-slate-900'}"
          >
            Source Records
          </button>
          <button
            on:click={() => drawerTab = 'vendors'}
            class="py-3 px-3 border-b-2 transition-colors cursor-pointer {drawerTab === 'vendors' ? 'border-blue-600 text-blue-600' : 'border-transparent hover:text-slate-900'}"
          >
            Vendor Feeds
          </button>
        </div>

        <div class="p-6 space-y-6 flex-1 text-xs text-slate-700">
          
          {#if drawerTab === 'why'}
            <div>
              <div class="flex items-center justify-between mb-3">
                <h3 class="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Critical-Path Contribution Breakdown
                </h3>
                <span class="text-[11px] text-slate-500 font-medium">
                  Total: {activeSite.forecastImpactDays}d impact
                </span>
              </div>

              <div class="space-y-3">
                {#each siteFactors as factor}
                  <div class="p-3.5 rounded-xl border border-slate-200/80 bg-slate-50/50 space-y-1.5">
                    <div class="flex justify-between font-semibold text-slate-900 text-xs">
                      <span>{factor.name}</span>
                      <span class="font-bold {factor.color === 'rose' ? 'text-rose-600' : factor.color === 'amber' ? 'text-amber-600' : factor.color === 'orange' ? 'text-orange-600' : 'text-blue-600'}">
                        {factor.pct}%
                      </span>
                    </div>
                    <div class="w-full bg-slate-200/80 rounded-full h-1.5">
                      <div
                        class="h-full rounded-full {factor.color === 'rose' ? 'bg-rose-500' : factor.color === 'amber' ? 'bg-amber-500' : factor.color === 'orange' ? 'bg-orange-500' : 'bg-blue-600'}"
                        style="width: {factor.pct}%"
                      ></div>
                    </div>
                    <p class="text-[11px] text-slate-600 leading-relaxed pt-0.5">
                      {factor.derivation}
                    </p>
                  </div>
                {/each}
              </div>
            </div>

            <div class="pt-4 border-t border-slate-200/80 space-y-2.5">
              <h4 class="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Site Readiness Dimensions
              </h4>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {#each siteReadinessParams as sp}
                  <div class="p-3 rounded-xl border border-slate-200/80 bg-white">
                    <div class="flex items-center justify-between font-semibold text-slate-900 text-[11px]">
                      <span>{sp.label}</span>
                      <span class="{sp.pct < 70 ? 'text-rose-600' : sp.pct < 85 ? 'text-amber-600' : 'text-emerald-700'}">{sp.pct}%</span>
                    </div>
                    <div class="w-full bg-slate-100 rounded-full h-1.5 my-1.5">
                      <div class="h-full rounded-full {sp.pct < 70 ? 'bg-rose-500' : sp.pct < 85 ? 'bg-amber-500' : 'bg-emerald-500'}" style="width: {sp.pct}%"></div>
                    </div>
                    <div class="text-[10px] text-slate-500">{sp.detail}</div>
                  </div>
                {/each}
              </div>
            </div>

          {:else if drawerTab === 'evidence'}
            <div class="space-y-4">
              <div class="flex items-center justify-between">
                <h3 class="text-sm font-bold text-slate-900">
                  Traceable Source Records · Site {activeSite.id}
                </h3>
                <span class="text-[10px] text-slate-500 font-mono">31 Oct 2026, 08:00 UTC</span>
              </div>

              <div class="border border-slate-200/80 rounded-xl overflow-hidden">
                <table class="w-full text-left border-collapse text-xs">
                  <thead class="bg-slate-50 text-slate-500 uppercase text-[10px] font-semibold border-b border-slate-200">
                    <tr>
                      <th class="py-2.5 px-3">Record ID</th>
                      <th class="py-2.5 px-2">System</th>
                      <th class="py-2.5 px-3">Evidence Detail</th>
                      <th class="py-2.5 px-2">Status</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-slate-100 font-medium">
                    <tr>
                      <td class="py-2.5 px-3">
                        <div class="font-mono font-bold text-slate-900">SAE-REC-104-01</div>
                        <div class="text-[10px] text-rose-600 font-semibold">SDTM.AE</div>
                      </td>
                      <td class="py-2.5 px-2 text-slate-600">Argus &harr; Rave</td>
                      <td class="py-2.5 px-3">
                        <div class="font-semibold text-slate-900">Subj 104-003 Grade 3 CRS Onset Discordance</div>
                        <div class="text-[10px] text-slate-500">Ball in Court: Medical Monitor / PV</div>
                      </td>
                      <td class="py-2.5 px-2">
                        <span class="px-2 py-0.5 rounded bg-rose-50 text-rose-700 text-[10px] font-semibold block text-center">Discrepant (12d)</span>
                      </td>
                    </tr>
                    <tr>
                      <td class="py-2.5 px-3">
                        <div class="font-mono font-bold text-slate-900">LXB-8921</div>
                        <div class="text-[10px] text-amber-600 font-semibold">SDTM.LB</div>
                      </td>
                      <td class="py-2.5 px-2 text-slate-600">LabCorp SFTP</td>
                      <td class="py-2.5 px-3">
                        <div class="font-semibold text-slate-900">48 ctDNA NGS samples failed SHA-256 checksum</div>
                        <div class="text-[10px] text-slate-500">Ball in Court: LabCorp Vendor QA</div>
                      </td>
                      <td class="py-2.5 px-2">
                        <span class="px-2 py-0.5 rounded bg-rose-50 text-rose-700 text-[10px] font-semibold block text-center">Overdue (4d)</span>
                      </td>
                    </tr>
                    <tr>
                      <td class="py-2.5 px-3">
                        <div class="font-mono font-bold text-slate-900">QRY-104-089</div>
                        <div class="text-[10px] text-orange-600 font-semibold">SDTM.TU</div>
                      </td>
                      <td class="py-2.5 px-2 text-slate-600">Rave EDC</td>
                      <td class="py-2.5 px-3">
                        <div class="font-semibold text-slate-900">Subj 104-003 Form TU-01 RECIST sum diameter mismatch</div>
                        <div class="text-[10px] text-slate-500">Ball in Court: Site Coordinator</div>
                      </td>
                      <td class="py-2.5 px-2">
                        <span class="px-2 py-0.5 rounded bg-amber-50 text-amber-700 text-[10px] font-semibold block text-center">Open (16d)</span>
                      </td>
                    </tr>
                    <tr>
                      <td class="py-2.5 px-3">
                        <div class="font-mono font-bold text-slate-900">SIG-104-C4C6</div>
                        <div class="text-[10px] text-blue-600 font-semibold">21 CFR 11</div>
                      </td>
                      <td class="py-2.5 px-2 text-slate-600">Rave e-Sign</td>
                      <td class="py-2.5 px-3">
                        <div class="font-semibold text-slate-900">8 completed subject casebooks awaiting PI sign-off</div>
                        <div class="text-[10px] text-slate-500">Ball in Court: Principal Investigator</div>
                      </td>
                      <td class="py-2.5 px-2">
                        <span class="px-2 py-0.5 rounded bg-blue-50 text-blue-700 text-[10px] font-semibold block text-center">Pending (8d)</span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

          {:else}
            <div class="space-y-4">
              <div>
                <h3 class="text-sm font-bold text-slate-900">
                  Vendor Feeds Affecting Site {activeSite.id}
                </h3>
                <p class="text-[11px] text-slate-500">
                  Direct SFTP / HL7 / E2B(R3) ingestion status.
                </p>
              </div>

              <div class="space-y-3">
                {#each automatedVendors as vnd}
                  <div class="p-3.5 rounded-xl border border-slate-200/80 bg-slate-50/50 space-y-2">
                    <div class="flex items-center justify-between">
                      <div>
                        <strong class="font-semibold text-slate-900 text-xs">{vnd.name}</strong>
                        <span class="text-[10px] text-slate-500 block">{vnd.feedType}</span>
                      </div>
                      <span class="px-2 py-0.5 rounded-md text-[10px] font-semibold {vnd.statusColor === 'rose' ? 'bg-rose-50 text-rose-700' : vnd.statusColor === 'amber' ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'}">
                        {vnd.cleanlinessAutoScore}% Clean
                      </span>
                    </div>

                    <div class="space-y-1.5 pt-1">
                      {#each vnd.transfersAndIssues as ti}
                        <div class="p-2.5 bg-white rounded-lg border border-slate-200/70 flex items-start justify-between gap-2 text-[11px]">
                          <div>
                            <span class="font-mono font-bold text-slate-900">{ti.id}</span>
                            <span class="font-medium text-slate-800 ml-1">&middot; {ti.type}</span>
                            <div class="text-[10px] text-slate-500 mt-0.5">
                              Site {ti.siteId} &middot; Due {ti.dueDate} &middot; {ti.recordCount}
                            </div>
                          </div>
                          <span class="px-1.5 py-0.5 rounded bg-rose-50 text-rose-700 font-semibold text-[10px] shrink-0">
                            +{ti.daysLate}d
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
