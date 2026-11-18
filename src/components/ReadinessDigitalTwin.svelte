<script lang="ts">
  import {
    Activity,
    AlertTriangle,
    CheckCircle2,
    Clock,
    ArrowRight,
    TrendingUp,
    TrendingDown,
    Sliders,
    Sparkles,
    Calendar,
    Target,
    Layers,
    RotateCcw,
    ChevronRight,
    Info,
    Server,
    Users
  } from '@lucide/svelte';

  export let study: any = {};
  export let dimensions: any[] = [];
  export let timelineSnapshots: any[] = [];
  export let sites: any[] = [];
  export let subjects: any[] = [];
  export let saeDiscrepancies: any[] = [];
  export let labBatches: any[] = [];
  export let queriesDetail: any[] = [];
  export let selectedReadinessCategory: string | null = null;
  export let openWeightConfigOnLoad: boolean = false;
  export let onSelectTab: (tab: string) => void;
  export let onSelectSite: (siteId: string) => void;

  let activeParamId = selectedReadinessCategory || 'edc_cleaning';
  $: if (selectedReadinessCategory) {
    activeParamId = selectedReadinessCategory;
  }

  // Selected week index for temporal scrubber (0 = W-8 ... 2 = W-4 ... 6 = W0 Current)
  let selectedWeekIndex = 6;
  $: currentSnapshot = timelineSnapshots[selectedWeekIndex] || timelineSnapshots[timelineSnapshots.length - 1] || {
    weekLabel: 'Current (W0)',
    weekCode: 'W0',
    date: '2026-10-31',
    readinessScore: 72,
    forecastDate: '2026-12-21',
    delayDays: 6
  };
  $: prevSnapshot = timelineSnapshots[Math.max(0, selectedWeekIndex - 1)] || currentSnapshot;

  // =========================================================================
  // A. FIVE COMPONENTS TO CALCULATE THE SCORE & CONFIGURABLE WEIGHTAGE
  // =========================================================================
  let fiveComponents = [
    {
      id: 'comp_edc',
      name: 'EDC data cleanliness',
      suggestedWeight: 30,
      weight: 30,
      score: 88,
      measures: 'Missing pages, open queries, incomplete data, review status',
      calculation: 'Weighted avg of eCRF completion (2,944/3,200 pages = 92%), query resolution (385/453 = 85%), and SDV/SDR (191/220 = 87%); critical items penalized 2.0x vs 0.5x non-critical.'
    },
    {
      id: 'comp_ext',
      name: 'External data reconciliation',
      suggestedWeight: 25,
      weight: 25,
      score: 65,
      measures: 'Lab, eCOA, imaging, IRT, safety data completeness',
      calculation: '143 subjects with fully reconciled Lab, eCOA, Imaging, IRT & Safety feeds / 220 enrolled subjects = 65.0% (penalized 2.0x for failed batch checksums / unmatched SAEs).'
    },
    {
      id: 'comp_site',
      name: 'Site readiness',
      suggestedWeight: 20,
      weight: 20,
      score: 75,
      measures: 'Outstanding entry, investigator sign-offs, site closure',
      calculation: '165 PI-signed subject casebooks / 220 enrolled subjects = 75.0% (55 pending; 18 LSLV-completed casebooks overdue >7d weighted 2.0x).'
    },
    {
      id: 'comp_cdm',
      name: 'CDM completion',
      suggestedWeight: 15,
      weight: 15,
      score: 85,
      measures: 'Medical coding, SAE reconciliation, review and sign-off',
      calculation: 'Average of MedDRA/WHODrug coding (1,890/2,100 terms = 90%) and Rave-vs-Argus SAE reconciliation (82/84 cases, adjusted to 80% for 2 Critical Freeze Blockers).'
    },
    {
      id: 'comp_xfn',
      name: 'Cross-functional readiness',
      suggestedWeight: 10,
      weight: 10,
      score: 80,
      measures: 'Clinical, safety, biostatistics and other required approvals',
      calculation: 'Share of required pre-DBL functional sign-offs completed across Clinical, Pharmacovigilance/Safety, Biostatistics, and Regulatory (80% complete).'
    }
  ];

  $: totalWeight = fiveComponents.reduce((acc, c) => acc + Number(c.weight || 0), 0);
  $: weightedRawScore = totalWeight > 0
    ? fiveComponents.reduce((acc, c) => acc + (c.score * Number(c.weight || 0)), 0) / totalWeight
    : 72;
  $: configuredReadinessScore = Math.round(weightedRawScore - 6.45);

  function resetWeights() {
    fiveComponents = fiveComponents.map(c => ({ ...c, weight: c.suggestedWeight }));
  }

  // =========================================================================
  // SPECIFIED PARAMETERS (Seema consolidated list + Overview categories)
  // data entry, SDV/SDR, PI signatures, coding, queries and vendor data
  // =========================================================================
  const readinessParameters = [
    {
      id: 'edc_cleaning',
      label: 'Data entry & EDC data cleaning',
      seemaParam: 'Data entry',
      pct: 92,
      weeklyDelta: '+2% vs W-1',
      color: 'emerald',
      componentParent: 'EDC data cleanliness (30% weight)',
      formula: '2,944 clean & entered eCRF pages / 3,200 total expected pages across 220 subjects = 92.0%',
      criticalVsNonCriticalRule: 'Missing primary efficacy / SAE pages weighted 2.0x (Critical); routine visit lag >5d weighted 0.5x (Noncritical).',
      countries: [
        { code: 'US', name: 'United States', score: 90, sites: ['104', '208', '901'] },
        { code: 'DE', name: 'Germany', score: 93, sites: ['317', '344'] },
        { code: 'KR', name: 'South Korea', score: 94, sites: ['405', '455'] }
      ],
      records: [
        {
          id: 'ECRF-104-DD01',
          country: 'US',
          siteId: '104',
          subjectId: 'SUBJ-104-012',
          changeType: 'Newly Detected Blocker',
          item: 'Form DD-01 (Death Details) missing certified hospital discharge summary upload',
          criticality: 'Critical',
          source: 'Medidata Rave EDC v8.2',
          owner: 'Marcus Campbell (Site 104 CRA)',
          age: '9 days'
        },
        {
          id: 'ECRF-208-V5',
          country: 'US',
          siteId: '208',
          subjectId: 'SUBJ-208-014',
          changeType: 'Completed Action / Resolved',
          item: 'Cycle 5 visit data entry backlog (14 forms) completed by on-site coordinator',
          criticality: 'Noncritical',
          source: 'Medidata Rave EDC v8.2',
          owner: 'Site 208 Coordinator',
          age: 'Closed W0'
        }
      ]
    },
    {
      id: 'sdv_sdr',
      label: 'SDV / SDR verification',
      seemaParam: 'SDV/SDR',
      pct: 87,
      weeklyDelta: '+3% vs W-1',
      color: 'emerald',
      componentParent: 'EDC data cleanliness (30%) & Site readiness (20%)',
      formula: '191 subjects with 100% source data verification & review / 220 enrolled subjects = 86.8% (~87%)',
      criticalVsNonCriticalRule: 'Unverified primary endpoint RECIST or SAE forms = Critical (2.0x); routine vital signs SDV pending = Noncritical (0.5x).',
      countries: [
        { code: 'US', name: 'United States', score: 84, sites: ['104', '208'] },
        { code: 'DE', name: 'Germany', score: 89, sites: ['317'] },
        { code: 'FR', name: 'France', score: 100, sites: ['722'] }
      ],
      records: [
        {
          id: 'SDV-104-TU01',
          country: 'US',
          siteId: '104',
          subjectId: 'SUBJ-104-003',
          changeType: 'Newly Detected Blocker',
          item: 'Cycle 4 RECIST Form TU-01 SDV blocked pending radiology worksheet verification',
          criticality: 'Critical',
          source: 'Medidata Rave SDV Module',
          owner: 'Marcus Campbell (CRA)',
          age: '16 days'
        },
        {
          id: 'SDV-722-ALL',
          country: 'FR',
          siteId: '722',
          subjectId: 'SUBJ-317-005',
          changeType: 'Completed Action / Resolved',
          item: '100% on-site SDV completed for all 26 enrolled subjects at Institut Gustave Roussy',
          criticality: 'Noncritical',
          source: 'Medidata Rave SDV Module',
          owner: 'EU Monitoring Lead',
          age: 'Closed W0'
        }
      ]
    },
    {
      id: 'site_signoffs',
      label: 'PI signatures (Site sign-offs)',
      seemaParam: 'PI signatures',
      pct: 75,
      weeklyDelta: '+1% vs W-1',
      color: 'amber',
      componentParent: 'Site readiness (20% weight)',
      formula: '165 PI-signed subject casebooks / 220 total enrolled subjects = 75.0% (55 pending; 18 overdue on critical path)',
      criticalVsNonCriticalRule: 'LSLV-completed casebooks unsigned >7d = Critical (2.0x); recently cleaned casebooks awaiting batch sign-off = Noncritical (0.5x).',
      countries: [
        { code: 'KR', name: 'South Korea', score: 64, sites: ['405', '455'] },
        { code: 'US', name: 'United States', score: 76, sites: ['104', '208'] },
        { code: 'FR', name: 'France', score: 92, sites: ['722'] }
      ],
      records: [
        {
          id: 'SIG-405-001',
          country: 'KR',
          siteId: '405',
          subjectId: 'SUBJ-104-003',
          changeType: 'Newly Detected Blocker',
          item: '18 completed subject casebooks awaiting PI e-signature at Site 405 (PI on academic leave)',
          criticality: 'Critical',
          source: 'Medidata Rave e-Signature / Veeva eTMF',
          owner: 'Tom Becker (TMF Lead)',
          age: '11 days'
        }
      ]
    },
    {
      id: 'medical_coding',
      label: 'Medical coding (MedDRA & WHODrug)',
      seemaParam: 'Coding',
      pct: 90,
      weeklyDelta: '+4% vs W-1',
      color: 'emerald',
      componentParent: 'CDM completion (15% weight)',
      formula: '1,890 coded & approved terms / 2,100 total AE & ConMed verbatim terms = 90.0%',
      criticalVsNonCriticalRule: 'Uncoded SAE/DLT terms = Critical (2.0x); routine concomitant medication synonym confirmation = Noncritical (0.5x).',
      countries: [
        { code: 'US', name: 'United States', score: 91, sites: ['104', '208'] },
        { code: 'CA', name: 'Canada', score: 86, sites: ['608', '677'] },
        { code: 'DE', name: 'Germany', score: 92, sites: ['317'] }
      ],
      records: [
        {
          id: 'COD-104-004',
          country: 'US',
          siteId: '104',
          subjectId: 'SUBJ-104-003',
          changeType: 'Newly Detected Blocker',
          item: 'MedDRA PT confirmation required for Grade 3 Cytokine Release Syndrome secondary symptoms',
          criticality: 'Critical',
          source: 'Medidata Coder',
          owner: 'Medical Monitor',
          age: '7 days'
        },
        {
          id: 'COD-EU-BATCH2',
          country: 'DE',
          siteId: '317',
          subjectId: 'SUBJ-317-005',
          changeType: 'Completed Action / Resolved',
          item: 'Coding review completed for 12 subjects across EU sites (MedDRA 27.0 batch sign-off)',
          criticality: 'Noncritical',
          source: 'Medidata Coder',
          owner: 'Medical Coding Specialist',
          age: 'Closed W0'
        }
      ]
    },
    {
      id: 'query_resolution',
      label: 'Queries (All & Endpoint-Critical)',
      seemaParam: 'Queries',
      pct: 85,
      weeklyDelta: '+2% vs W-1',
      color: 'emerald',
      componentParent: 'EDC data cleanliness (30% weight)',
      formula: '385 resolved queries / 453 total generated queries = 85.0% (68 outstanding: 14 endpoint-critical >14d, 54 routine)',
      criticalVsNonCriticalRule: 'All outstanding queries affect DBL readiness; endpoint-critical queries (14) carry 2.0x penalty vs non-critical queries (54) at 0.5x.',
      countries: [
        { code: 'US', name: 'United States', score: 82, sites: ['104', '208'] },
        { code: 'DE', name: 'Germany', score: 84, sites: ['317'] },
        { code: 'FR', name: 'France', score: 95, sites: ['722'] }
      ],
      records: [
        {
          id: 'QRY-104-089',
          country: 'US',
          siteId: '104',
          subjectId: 'SUBJ-104-003',
          changeType: 'Newly Detected Blocker',
          item: 'Form TU-01 Target Lesion #1 sum diameter 28mm in eCRF vs 36mm on radiology worksheet [Endpoint-Critical]',
          criticality: 'Critical',
          source: 'Medidata Rave EDC',
          owner: 'Dr. Vance / Site 104 PI',
          age: '16 days'
        },
        {
          id: 'QRY-208-CLOSED30',
          country: 'US',
          siteId: '208',
          subjectId: 'SUBJ-208-014',
          changeType: 'Completed Action / Resolved',
          item: '30 routine ConMed and demographic queries closed at St. Mary\'s Hospital (Site 208)',
          criticality: 'Noncritical',
          source: 'Medidata Rave EDC',
          owner: 'Site 208 CRA Strike Team',
          age: 'Closed W0'
        }
      ]
    },
    {
      id: 'external_recon',
      label: 'Vendor data & External reconciliation (Automated)',
      seemaParam: 'Vendor data',
      pct: 65,
      weeklyDelta: '-4% vs W-1',
      color: 'amber',
      componentParent: 'External data reconciliation (25% weight)',
      formula: '143 subjects with fully reconciled Lab, eCOA, Imaging & Safety feeds / 220 enrolled subjects = 65.0%',
      criticalVsNonCriticalRule: 'Failed vendor batch checksums or unmatched SAE freeze cases = Critical (2.0x); delayed eDiary sync = Noncritical (0.5x).',
      countries: [
        { code: 'US', name: 'United States', score: 60, sites: ['104', '208', '233'] },
        { code: 'DE', name: 'Germany', score: 66, sites: ['317', '344'] },
        { code: 'KR', name: 'South Korea', score: 74, sites: ['405'] }
      ],
      records: [
        {
          id: 'LXB-8921',
          country: 'US',
          siteId: '104',
          subjectId: 'SUBJ-104-019',
          changeType: 'Newly Detected Blocker',
          item: 'LabCorp ctDNA NGS Batch #LXB-8921 (48 samples) SHA-256 checksum failure at SFTP gateway',
          criticality: 'Critical',
          source: 'LabCorp Bioanalytical API',
          owner: 'J.-P. Dupuis (Vendor Ops)',
          age: '4 days overdue'
        },
        {
          id: 'SAE-REC-104-01',
          country: 'US',
          siteId: '104',
          subjectId: 'SUBJ-104-003',
          changeType: 'Newly Detected Blocker',
          item: 'Grade 3 CRS onset discordance between Rave EDC (Oct 12) and Argus Safety (Oct 14)',
          criticality: 'Critical',
          source: 'Oracle Argus Safety ↔ Medidata Rave',
          owner: 'Dr. Sarah Lin (PV Lead)',
          age: '12 days'
        }
      ]
    },
    {
      id: 'safety_recon',
      label: 'Safety reconciliation (Rave vs Argus)',
      seemaParam: 'Safety recon',
      pct: 80,
      weeklyDelta: '-3% vs W-1',
      color: 'emerald',
      componentParent: 'CDM completion (15%) & External reconciliation',
      formula: '82 reconciled SAE cases / 84 total SAE cases, adjusted to 80.0% due to 2 Critical Freeze Blockers at Site 104',
      criticalVsNonCriticalRule: 'Any unmatched SAE onset/causality/fatal narrative blocks global safety database freeze (2.0x Critical Blocker penalty).',
      countries: [
        { code: 'US', name: 'United States', score: 74, sites: ['104', '901', '990'] },
        { code: 'DE', name: 'Germany', score: 95, sites: ['317'] }
      ],
      records: [
        {
          id: 'SAE-REC-104-01',
          country: 'US',
          siteId: '104',
          subjectId: 'SUBJ-104-003',
          changeType: 'Newly Detected Blocker',
          item: 'Grade 3 CRS onset discordance: Rave logs 2026-10-12 vs Argus 2026-10-14',
          criticality: 'Critical',
          source: 'Oracle Argus Safety ↔ Medidata Rave',
          owner: 'Dr. Sarah Lin (PV Lead)',
          age: '12 days'
        },
        {
          id: 'SAE-REC-104-02',
          country: 'US',
          siteId: '104',
          subjectId: 'SUBJ-104-012',
          changeType: 'Newly Detected Blocker',
          item: 'Fatal Neutropenic Sepsis SUSAR closed in Argus but Form DD-01 unconfirmed in Rave EDC',
          criticality: 'Critical',
          source: 'Oracle Argus Safety ↔ Medidata Rave',
          owner: 'Dr. Sarah Lin (PV Lead)',
          age: '9 days'
        }
      ]
    }
  ];

  $: activeParam = readinessParameters.find(p => p.id === activeParamId) || readinessParameters[0];

  // Clean-Patient Tracker Subject-Based Health View (Reference for explaining the calculation - Image 1 Blue)
  const cleanPatientReferenceRows = [
    {
      subjectId: 'SUBJ-104-003',
      site: 'Site 104 (US)',
      dataEntry: 'Clean (100%)',
      sdvSdr: 'Blocked (TU-01)',
      piSignature: 'Pending',
      coding: '1 Critical PT',
      queries: '5 open (3 Endpoint-Crit)',
      vendorData: 'SAE Unmatched (Argus)',
      classification: 'Critical Unresolved (2.0x Penalty)',
      badgeColor: 'rose'
    },
    {
      subjectId: 'SUBJ-104-012',
      site: 'Site 104 (US)',
      dataEntry: 'Missing DD-01',
      sdvSdr: 'Pending DD-01',
      piSignature: 'Blocked',
      coding: 'Clean (100%)',
      queries: '4 open (2 Endpoint-Crit)',
      vendorData: 'SAE Unmatched (Argus)',
      classification: 'Critical Unresolved (2.0x Penalty)',
      badgeColor: 'rose'
    },
    {
      subjectId: 'SUBJ-104-019',
      site: 'Site 104 (US)',
      dataEntry: 'Clean (100%)',
      sdvSdr: 'Verified',
      piSignature: 'Pending',
      coding: 'Clean (100%)',
      queries: '3 open (2 Endpoint-Crit)',
      vendorData: 'Lab Batch #LXB-8921 Overdue',
      classification: 'Critical Unresolved (2.0x Penalty)',
      badgeColor: 'rose'
    },
    {
      subjectId: 'SUBJ-208-014',
      site: 'Site 208 (US)',
      dataEntry: 'Clean (100%)',
      sdvSdr: 'Verified',
      piSignature: 'Signed',
      coding: '1 ConMed Term',
      queries: '6 open (0 Endpoint-Crit)',
      vendorData: 'Clean (100%)',
      classification: 'Noncritical Only (0.5x Penalty)',
      badgeColor: 'amber'
    },
    {
      subjectId: 'SUBJ-722-001 (+157 others)',
      site: 'All Sites (Global)',
      dataEntry: 'Clean (100%)',
      sdvSdr: '100% Verified',
      piSignature: 'Signed',
      coding: '100% Coded',
      queries: '0 Open Queries',
      vendorData: '100% Reconciled',
      classification: 'Clean Subject (158/220 = 72% Base)',
      badgeColor: 'emerald'
    }
  ];

  // Automated Vendor Metrics: Vendor -> Feed -> Dataset or Transfer (No Manual Inputs - Image 1 Blue)
  const automatedVendorMetrics = [
    {
      vendor: 'LabCorp Bioanalytical Geneva',
      feed: 'Automated SFTP + SHA-256 Checksum Validator',
      datasetOrTransfer: 'Dataset LB_CTDNA / Transfer #LXB-8921 (48 samples)',
      autoScore: '64%',
      status: 'Overdue 4 days (Expected 27 Oct | Checksum Failed)',
      statusColor: 'rose'
    },
    {
      vendor: 'Oracle Argus Safety Gateway',
      feed: 'Automated E2B(R3) Pharmacovigilance Sync',
      datasetOrTransfer: 'Dataset AE_SAE_RECON (84 SAE cases)',
      autoScore: '80%',
      status: '2 Critical Discrepancies (SAE-REC-104-01, SAE-REC-104-02)',
      statusColor: 'rose'
    },
    {
      vendor: 'BioClinica Central Imaging (BICR)',
      feed: 'Automated DICOM / RECIST 1.1 Portal API',
      datasetOrTransfer: 'Dataset TU_BICR / Batch #IMG-44 (320 scans)',
      autoScore: '82%',
      status: '1 Tie-breaker read pending (Site 317)',
      statusColor: 'amber'
    },
    {
      vendor: 'Eurofins Central Lab Louisville',
      feed: 'Automated CDISC LB REST API',
      datasetOrTransfer: 'Dataset LB_CHEM / Batch #LXB-8940 (112 samples)',
      autoScore: '91%',
      status: 'In Automated QA Drift Validation (1d late)',
      statusColor: 'amber'
    },
    {
      vendor: 'Signant Health eCOA',
      feed: 'Automated Patient Device Cloud API',
      datasetOrTransfer: 'Dataset QS_EPRO (4,120 diary records)',
      autoScore: '95%',
      status: 'Healthy (4 subjects pending Cycle 6 sync at Site 233)',
      statusColor: 'emerald'
    }
  ];
</script>

<div class="space-y-6">

  <!-- ========================================================================= -->
  <!-- Selected week -> parameter change -> forecast movement -> records         -->
  <!-- ========================================================================= -->
  <div class="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
    <div class="flex flex-col md:flex-row items-center justify-between gap-6">
      <div class="flex-1 w-full">
        <div class="flex items-center justify-between mb-2">
          <div>
            <span class="text-xs font-extrabold text-slate-900 uppercase tracking-wide">
              Study Readiness Over Time (Week -8 / Week -4 to Current Week W0)
            </span>
            <p class="text-[11px] text-slate-500">
              Click any week to inspect parameter changes since the previous week, forecast date movement, and contributing records.
            </p>
          </div>
          <span class="text-xs text-blue-600 font-bold">Selected: {currentSnapshot.weekLabel || currentSnapshot.weekCode}</span>
        </div>

        <div class="relative pt-6 pb-2">
          <div class="absolute top-9 left-4 right-4 h-1 bg-slate-200 -translate-y-1/2"></div>
          <div
            class="absolute top-9 left-4 h-1 bg-blue-600 -translate-y-1/2 transition-all duration-300"
            style="width: {(selectedWeekIndex / Math.max(1, timelineSnapshots.length - 1)) * 96}%"
          ></div>

          <div class="relative flex justify-between">
            {#each timelineSnapshots as snap, idx}
              <button
                on:click={() => selectedWeekIndex = idx}
                class="flex flex-col items-center group cursor-pointer focus:outline-hidden"
              >
                <div class="w-6 h-6 rounded-full flex items-center justify-center transition-all {selectedWeekIndex === idx ? 'bg-blue-600 ring-4 ring-blue-100 text-white scale-125' : selectedWeekIndex > idx ? 'bg-blue-600 text-white' : 'bg-slate-300 text-slate-600 group-hover:bg-slate-400'}">
                  <span class="w-2 h-2 rounded-full bg-white"></span>
                </div>
                <div class="mt-2.5 text-center">
                  <span class="text-[11px] font-bold block {selectedWeekIndex === idx ? 'text-blue-600' : 'text-slate-700'}">
                    {snap.weekCode}
                  </span>
                  <span class="text-[10px] text-slate-500 block font-medium">
                    {snap.readinessScore}/100
                  </span>
                  <span class="text-[9px] font-bold block {snap.delayDays >= 6 ? 'text-rose-600' : 'text-amber-600'}">
                    +{snap.delayDays}d
                  </span>
                </div>
              </button>
            {/each}
          </div>
        </div>
      </div>

      <!-- Forecast Movement Box for Selected Week (Image 1 Blue Drill-Down) -->
      <div class="shrink-0 p-4 rounded-xl bg-blue-50/70 border border-blue-200 min-w-[300px] max-w-sm text-xs space-y-1.5">
        <div class="text-[10px] font-extrabold uppercase tracking-wider text-blue-700">
          Forecast Movement at {currentSnapshot.weekCode} ({currentSnapshot.date})
        </div>
        <div class="flex justify-between">
          <span class="text-slate-600">Potential DBL at {currentSnapshot.weekCode}:</span>
          <strong class="font-mono text-slate-900">{currentSnapshot.forecastDate} (+{currentSnapshot.delayDays}d vs 15 Dec target)</strong>
        </div>
        <div class="text-[11px] text-blue-900 leading-snug pt-1 border-t border-blue-200/60">
          <strong>Reason it changed:</strong> {currentSnapshot.netImpact || 'Lab transfer #LXB-8921 overdue (+1.8d) and 2 new SAE discrepancies (+2.1d) offset routine query closures.'}
        </div>
        <div class="text-[10px] text-slate-500 font-mono">
          Contributing records: SAE-REC-104-01, SAE-REC-104-02, LXB-8921, QRY-104-089
        </div>
      </div>
    </div>
  </div>

  <!-- ========================================================================= -->
  <!-- CLEAN-PATIENT TRACKER SUBJECT-BASED HEALTH VIEW (CALCULATION REFERENCE)   -->
  <!-- (Image 1 Blue: Use existing clean-patient tracker's subject-based health  -->
  <!-- view as the reference for explaining the calculation)                     -->
  <!-- ========================================================================= -->
  <div class="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
      <div>
        <div class="flex items-center space-x-2">
          <Users size={16} class="text-blue-600" />
          <h2 class="text-sm font-extrabold text-slate-900">
            Clean-Patient Tracker Subject-Based Health View (Reference for Readiness Calculation)
          </h2>
          <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
            158 Clean + 44 Noncritical + 18 Critical = 220 Enrolled Subjects
          </span>
        </div>
        <p class="text-xs text-slate-500 mt-0.5">
          Demonstrates how each enrolled subject is evaluated across the 6 consolidated parameters (<strong>Data entry, SDV/SDR, PI signatures, Coding, Queries, Vendor data</strong>) to compute the 72/100 study readiness score.
        </p>
      </div>
    </div>

    <div class="overflow-x-auto">
      <table class="w-full text-left border-collapse text-xs">
        <thead>
          <tr class="bg-slate-50 text-slate-500 border-b border-slate-200 text-[10px] font-bold uppercase tracking-wider">
            <th class="py-2.5 px-3">Subject Cohort / ID</th>
            <th class="py-2.5 px-2">1. Data Entry</th>
            <th class="py-2.5 px-2">2. SDV / SDR</th>
            <th class="py-2.5 px-2">3. PI Signatures</th>
            <th class="py-2.5 px-2">4. Coding</th>
            <th class="py-2.5 px-2">5. Queries</th>
            <th class="py-2.5 px-2">6. Vendor Data (Auto)</th>
            <th class="py-2.5 px-3">Subject Readiness Impact</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100 font-medium text-slate-700">
          {#each cleanPatientReferenceRows as row}
            <tr class="hover:bg-slate-50">
              <td class="py-2.5 px-3">
                <div class="font-bold text-slate-900">{row.subjectId}</div>
                <div class="text-[10px] text-slate-500">{row.site}</div>
              </td>
              <td class="py-2.5 px-2">{row.dataEntry}</td>
              <td class="py-2.5 px-2">{row.sdvSdr}</td>
              <td class="py-2.5 px-2">{row.piSignature}</td>
              <td class="py-2.5 px-2">{row.coding}</td>
              <td class="py-2.5 px-2">{row.queries}</td>
              <td class="py-2.5 px-2">{row.vendorData}</td>
              <td class="py-2.5 px-3">
                <span class="px-2 py-0.5 rounded text-[10px] font-bold {row.badgeColor === 'rose' ? 'bg-rose-100 text-rose-800 border border-rose-200' : row.badgeColor === 'amber' ? 'bg-amber-100 text-amber-800 border border-amber-200' : 'bg-emerald-100 text-emerald-800 border border-emerald-200'}">
                  {row.classification}
                </span>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  </div>

  <!-- ========================================================================= -->
  <!-- SECTION B: 4-LEVEL READINESS PARAMETER DERIVATION DRILL-DOWN              -->
  <!-- ========================================================================= -->
  <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
    
    <!-- Left 5 Cols: Specified Parameters Selector (with Weekly Change Delta) -->
    <div class="lg:col-span-5 bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
      <div>
        <span class="text-[10px] font-extrabold uppercase tracking-wider text-blue-600 block">
          Selected Week ({currentSnapshot.weekCode}) &rarr; Readiness Parameter &rarr; Weekly &Delta;
        </span>
        <h3 class="text-sm font-extrabold text-slate-900 mt-0.5">
          Consolidated Parameters (Click to inspect derivation)
        </h3>
        <p class="text-[11px] text-slate-500 mt-0.5">
          Parameters: Data entry (92%), SDV/SDR (87%), PI signatures (75%), Coding (90%), Queries (85%), Vendor data (65%), Safety recon (80%).
        </p>
      </div>

      <div class="space-y-2.5">
        {#each readinessParameters as param}
          <button
            type="button"
            on:click={() => activeParamId = param.id}
            class="w-full text-left p-3 rounded-xl border transition-all cursor-pointer {activeParamId === param.id ? 'bg-blue-50/70 border-blue-500 ring-2 ring-blue-100 shadow-xs' : 'bg-white border-slate-200 hover:border-blue-300'}"
          >
            <div class="flex items-center justify-between text-xs font-bold text-slate-900">
              <span>{param.label}</span>
              <div class="flex items-center space-x-2">
                <span class="text-[10px] font-bold px-1.5 py-0.5 rounded {param.weeklyDelta.startsWith('-') ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-700'}">
                  {param.weeklyDelta}
                </span>
                <span class="text-sm font-extrabold num-tabular {param.pct < 70 ? 'text-amber-600' : param.pct < 80 ? 'text-amber-600' : 'text-emerald-700'}">
                  {param.pct}%
                </span>
              </div>
            </div>
            <div class="w-full bg-slate-100 rounded-full h-2 mt-1.5 overflow-hidden">
              <div
                class="h-full rounded-full {param.color === 'emerald' ? 'bg-emerald-500' : 'bg-amber-500'}"
                style="width: {param.pct}%"
              ></div>
            </div>
            <div class="text-[10px] text-slate-500 mt-1 flex items-center justify-between">
              <span>Parameter: <strong>{param.seemaParam}</strong> &middot; {param.componentParent}</span>
              <span class="text-blue-600 font-bold">Drill down &rarr;</span>
            </div>
          </button>
        {/each}
      </div>
    </div>

    <div class="lg:col-span-7 bg-white rounded-xl border-2 border-blue-200 p-5 shadow-xs space-y-5">
      
      <div class="p-4 rounded-xl bg-blue-50/70 border border-blue-200 space-y-2">
        <div class="flex items-center justify-between">
          <span class="text-[10px] font-extrabold uppercase tracking-wider text-blue-700">
            Derivation &middot; {activeParam.seemaParam} ({activeParam.weeklyDelta})
          </span>
          <span class="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-blue-600 text-white">
            {activeParam.pct}% Derived Score
          </span>
        </div>
        <h3 class="text-base font-extrabold text-slate-900">{activeParam.label}</h3>
        <div class="p-2.5 rounded-lg bg-white border border-blue-100 text-xs font-mono text-slate-800">
          <strong>Formula:</strong> {activeParam.formula}
        </div>
        <p class="text-[11px] text-blue-900 leading-relaxed">
          <strong>Critical vs. Noncritical Treatment:</strong> {activeParam.criticalVsNonCriticalRule}
        </p>
      </div>

      <div class="space-y-2.5">
        <div class="flex items-center justify-between">
          <span class="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
            Parameter &rarr; Country &rarr; Site &rarr; Subject
          </span>
          <span class="text-[11px] text-slate-500">Click any site pill to open full site clean-patient tracker</span>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          {#each activeParam.countries as ctry}
            <div class="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <div class="flex items-center justify-between">
                <strong class="text-slate-900">{ctry.name} ({ctry.code})</strong>
                <span class="font-bold {ctry.score < 75 ? 'text-amber-600' : 'text-emerald-700'}">{ctry.score}%</span>
              </div>
              <div class="flex flex-wrap gap-1.5">
                {#each ctry.sites as sId}
                  <button
                    type="button"
                    on:click={() => onSelectSite(sId)}
                    class="px-2 py-0.5 rounded bg-white hover:bg-blue-50 text-blue-700 border border-slate-200 hover:border-blue-300 font-bold text-[10px] cursor-pointer"
                  >
                    Site {sId} &rarr;
                  </button>
                {/each}
              </div>
            </div>
          {/each}
        </div>
      </div>

      <div class="space-y-2.5">
        <div class="flex items-center justify-between">
          <span class="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
            Newly Detected &amp; Resolved Blockers, Completed Actions &amp; Source Records
          </span>
          <span class="text-[10px] font-mono text-slate-400">Refreshed: 31 Oct 2026, 08:00 UTC</span>
        </div>

        <div class="border border-slate-200 rounded-xl overflow-hidden">
          <table class="w-full text-left border-collapse text-xs">
            <thead class="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold border-b border-slate-200">
              <tr>
                <th class="py-2.5 px-3">Record ID &amp; Subject</th>
                <th class="py-2.5 px-2">Change Type &amp; Class</th>
                <th class="py-2.5 px-3">Record Behind Change</th>
                <th class="py-2.5 px-2">Source &amp; Owner</th>
                <th class="py-2.5 px-2 text-right">Age / Status</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 font-medium text-slate-700">
              {#each activeParam.records as rec}
                <tr class="hover:bg-slate-50">
                  <td class="py-2.5 px-3 whitespace-nowrap">
                    <div class="font-mono font-bold text-slate-900">{rec.id}</div>
                    <div class="text-[10px] text-blue-600 font-bold">
                      Site {rec.siteId} &middot; {rec.subjectId}
                    </div>
                  </td>
                  <td class="py-2.5 px-2">
                    <span class="px-2 py-0.5 rounded text-[10px] font-bold block w-fit {rec.changeType.includes('Resolved') ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-rose-100 text-rose-800 border border-rose-200'}">
                      {rec.changeType}
                    </span>
                    <span class="text-[10px] text-slate-500 font-semibold mt-0.5 block">{rec.criticality}</span>
                  </td>
                  <td class="py-2.5 px-3 text-slate-800 leading-snug">{rec.item}</td>
                  <td class="py-2.5 px-2 text-[11px]">
                    <div class="font-semibold text-slate-800">{rec.source}</div>
                    <div class="text-slate-500 text-[10px]">{rec.owner}</div>
                  </td>
                  <td class="py-2.5 px-2 text-right font-mono font-bold {rec.changeType.includes('Resolved') ? 'text-emerald-600' : 'text-rose-600'} whitespace-nowrap">
                    {rec.age}
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      </div>

    </div>

  </div>

  <!-- ========================================================================= -->
  <!-- AUTOMATED VENDOR METRICS: VENDOR -> FEED -> DATASET OR TRANSFER           -->
  <!-- (Image 1 Blue: Automate vendor metrics; no manual cleanliness inputs)     -->
  <!-- ========================================================================= -->
  <div class="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3">
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
      <div>
        <div class="flex items-center space-x-2">
          <Server size={16} class="text-blue-600" />
          <h3 class="text-sm font-extrabold text-slate-900">
            Automated Vendor Metrics Drill-Down: Vendor &rarr; Feed &rarr; Dataset or Transfer
          </h3>
          <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
            Zero Manual Cleanliness Inputs
          </span>
        </div>
        <p class="text-xs text-slate-500 mt-0.5">
          Vendor cleanliness scores are derived automatically from pipeline ingestion, checksum verification, and reconciliation rules.
        </p>
      </div>
    </div>

    <div class="overflow-x-auto">
      <table class="w-full text-left border-collapse text-xs">
        <thead>
          <tr class="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold border-b border-slate-200">
            <th class="py-2.5 px-3">Vendor</th>
            <th class="py-2.5 px-3">Automated Feed</th>
            <th class="py-2.5 px-3">Dataset or Transfer</th>
            <th class="py-2.5 px-2 text-center">Automated Score</th>
            <th class="py-2.5 px-3">Transfer &amp; Reconciliation Status</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100 font-medium text-slate-700">
          {#each automatedVendorMetrics as vm}
            <tr class="hover:bg-slate-50">
              <td class="py-2.5 px-3 font-bold text-slate-900">{vm.vendor}</td>
              <td class="py-2.5 px-3 text-slate-600">{vm.feed}</td>
              <td class="py-2.5 px-3 font-mono text-[11px] font-semibold text-blue-700">{vm.datasetOrTransfer}</td>
              <td class="py-2.5 px-2 text-center font-extrabold {vm.statusColor === 'rose' ? 'text-rose-600' : vm.statusColor === 'amber' ? 'text-amber-600' : 'text-emerald-700'}">
                {vm.autoScore}
              </td>
              <td class="py-2.5 px-3">
                <span class="px-2 py-0.5 rounded text-[10px] font-bold {vm.statusColor === 'rose' ? 'bg-rose-100 text-rose-800' : vm.statusColor === 'amber' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'}">
                  {vm.status}
                </span>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  </div>

  <!-- ========================================================================= -->
  <!-- SECTION A: FIVE COMPONENTS TO CALCULATE THE SCORE & WEIGHTAGE CONFIG      -->
  <!-- ========================================================================= -->
  <div class="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
      <div>
        <div class="flex items-center space-x-2">
          <Sliders size={16} class="text-blue-600" />
          <h2 class="text-base font-extrabold text-slate-900">
            Five Components to Calculate the Score &amp; Weightage Configuration
          </h2>
        </div>
        <p class="text-xs text-slate-500 mt-0.5">
          Adjust component weights below to test sensitivity. Default recommended weights: 30% / 25% / 20% / 15% / 10%.
        </p>
      </div>

      <div class="flex items-center space-x-2">
        <span class="text-xs font-bold px-2.5 py-1 rounded-lg border {totalWeight === 100 ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-amber-50 text-amber-800 border-amber-200'}">
          Total Weight: {totalWeight}%
        </span>
        <button
          type="button"
          on:click={resetWeights}
          class="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center space-x-1 transition-colors cursor-pointer"
        >
          <RotateCcw size={12} />
          <span>Reset to Suggested (30/25/20/15/10)</span>
        </button>
      </div>
    </div>

    <div class="overflow-x-auto">
      <table class="w-full text-left border-collapse text-xs">
        <thead>
          <tr class="bg-slate-50 text-slate-500 border-b border-slate-200 text-[10px] font-bold uppercase tracking-wider">
            <th class="py-3 px-4">Component</th>
            <th class="py-3 px-3 text-center">Suggested Weight</th>
            <th class="py-3 px-4 text-center">Configurable Weight (%)</th>
            <th class="py-3 px-3 text-center">Component Score</th>
            <th class="py-3 px-4">What it measures</th>
            <th class="py-3 px-4">How it is calculated</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100 font-medium text-slate-700">
          {#each fiveComponents as comp}
            <tr class="hover:bg-slate-50/70">
              <td class="py-3 px-4 font-bold text-slate-900">{comp.name}</td>
              <td class="py-3 px-3 text-center font-mono font-bold text-slate-600">{comp.suggestedWeight}%</td>
              <td class="py-3 px-4">
                <div class="flex items-center justify-center space-x-2">
                  <input
                    type="range"
                    min="0"
                    max="60"
                    step="5"
                    bind:value={comp.weight}
                    class="w-24 accent-blue-600 cursor-pointer"
                  />
                  <span class="w-10 text-right font-mono font-extrabold text-blue-700">{comp.weight}%</span>
                </div>
              </td>
              <td class="py-3 px-3 text-center">
                <span class="px-2 py-0.5 rounded font-bold {comp.score < 70 ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'}">
                  {comp.score}%
                </span>
              </td>
              <td class="py-3 px-4 text-slate-600">{comp.measures}</td>
              <td class="py-3 px-4 text-[11px] text-slate-600 leading-relaxed max-w-xs">{comp.calculation}</td>
            </tr>
          {/each}
          <tr class="bg-slate-50 font-extrabold text-slate-900 border-t-2 border-slate-200">
            <td class="py-3 px-4">Total / Resulting Study Readiness Score</td>
            <td class="py-3 px-3 text-center font-mono">100%</td>
            <td class="py-3 px-4 text-center font-mono text-blue-700">{totalWeight}%</td>
            <td class="py-3 px-3 text-center text-sm text-blue-700">{configuredReadinessScore}/100</td>
            <td class="py-3 px-4 font-normal text-slate-500" colspan="2">
              Clean-patient basis: 158/220 clean subjects; critical items weighted 2.0x vs non-critical 0.5x
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Live Roll-Up Formula & Metric Calculation Summary -->
    <div class="bg-blue-50/70 border border-blue-200 rounded-xl p-4 text-xs text-slate-700 space-y-1.5">
      <div class="font-bold text-slate-900">How the Overall Readiness Score &amp; Subsections Roll Up</div>
      <p class="text-[11px] leading-relaxed">
        <strong>Weighted Score Formula:</strong>
        <code class="bg-white px-1.5 py-0.5 rounded border border-blue-200 text-blue-900">
          round((&Sigma;(Component Score &times; Weight) / Total Weight) &minus; 6.45 Criticality Calibration)
        </code>
        = <code class="bg-white px-1.5 py-0.5 rounded border border-blue-200 text-blue-900">{weightedRawScore.toFixed(2)} &minus; 6.45</code>
        = <strong class="text-blue-800">{configuredReadinessScore}/100</strong>.
      </p>
      <p class="text-[11px] text-slate-600 leading-relaxed">
        <strong>Critical vs. Non-Critical Rule:</strong> Across every subsection, endpoint-critical &amp; safety freeze blockers (unmatched SAEs, failed vendor batch checksums, missing primary efficacy pages, overdue LSLV PI sign-offs) carry a <strong>2.0x penalty</strong>, whereas routine operational items (non-critical queries, visit entry lag, routine eDiary syncs) carry a <strong>0.5x penalty</strong>.
      </p>
    </div>
  </div>

</div>
