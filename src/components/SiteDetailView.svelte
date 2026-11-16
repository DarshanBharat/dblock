<script lang="ts">
  import {
    ArrowLeft,
    AlertTriangle,
    ShieldAlert,
    CheckCircle2,
    Clock,
    FileSpreadsheet,
    FlaskConical,
    Activity,
    ChevronRight,
    Search,
    User,
    Building2,
    Calendar,
    ExternalLink,
    FileText,
    ArrowRight,
    Server,
    Layers
  } from '@lucide/svelte';

  export let site: any;
  export let subjects: any[];
  export let saeDiscrepancies: any[];
  export let queriesDetail: any[];
  export let labBatches: any[];
  export let onBackToSites: () => void;
  export let onSelectSubject: (subjectId: string) => void;
  export let onSelectTab: (tab: string) => void;

  // Sub-tab state for Site page (Matches Seema's study-level drill-down + Clean-Patient Subject Tracker + Vendor Evidence)
  let activeSubTab: 'subjects' | 'queries' | 'sae' | 'lab' | 'overview' = 'subjects';
  let queryFilter: 'all' | 'endpoint_critical' | 'non_critical' = 'all';

  // Site-specific filtered lists
  $: siteSubjects = subjects.filter(s => s.siteId === site.id);
  $: siteSaes = saeDiscrepancies.filter(s => s.siteId === site.id);
  // Include all outstanding queries (both endpoint-critical and non-critical) per Image 10 Blue requirement
  $: siteQueries = [
    ...queriesDetail.filter(q => q.siteId === site.id),
    ...(site.id === '104'
      ? [
          {
            id: 'QRY-104-118',
            siteId: '104',
            subjectId: 'SUBJ-104-021',
            form: 'CM-02 (Concomitant Meds)',
            field: 'CM_DOSE_UNIT',
            queryText: 'Clarify concomitant dexamethasone prophylaxis dose unit (mg vs mL) for Cycle 3.',
            ageDays: 7,
            isCriticalPath: false,
            isPrimaryEndpoint: false,
            status: 'Open (Routine)',
            actionRequired: 'Site coordinator data entry clarification'
          },
          {
            id: 'QRY-104-124',
            siteId: '104',
            subjectId: 'SUBJ-104-019',
            form: 'VS-01 (Vital Signs)',
            field: 'SYS_BP_VAL',
            queryText: 'Cycle 5 pre-infusion blood pressure reading missing timestamp.',
            ageDays: 5,
            isCriticalPath: false,
            isPrimaryEndpoint: false,
            status: 'Open (Routine)',
            actionRequired: 'Verify nursing flowsheet timestamp'
          }
        ]
      : [])
  ];
  $: filteredQueries = siteQueries.filter(q => {
    if (queryFilter === 'endpoint_critical') return q.isPrimaryEndpoint;
    if (queryFilter === 'non_critical') return !q.isPrimaryEndpoint;
    return true;
  });
  $: siteLabs = labBatches.filter(l => l.sitesAffected.includes(site.id));

  // Study-level readiness parameters applied to this site (Image 9 Blue requirement)
  $: siteSeemaCategories = [
    {
      id: 'edc_cleaning',
      label: 'EDC data cleaning (Entry & SDV/SDR)',
      pct: site.id === '104' ? 84 : 91,
      targetTab: 'subjects' as const,
      summary: 'Missing pages, SDV/SDR verification & form completeness'
    },
    {
      id: 'query_resolution',
      label: 'Query resolution (All & Endpoint-Critical)',
      pct: site.id === '104' ? 68 : 74,
      targetTab: 'queries' as const,
      summary: `${siteQueries.length} open queries shown (${siteQueries.filter(q => q.isPrimaryEndpoint).length} endpoint-critical flagged)`
    },
    {
      id: 'external_recon',
      label: 'External data reconciliation (Vendor)',
      pct: site.id === '104' ? 52 : 86,
      targetTab: 'lab' as const,
      summary: `${siteLabs.length} vendor transfer batch(es) affecting site`
    },
    {
      id: 'medical_coding',
      label: 'Medical coding (MedDRA & WHODrug)',
      pct: site.id === '104' ? 88 : 92,
      targetTab: 'subjects' as const,
      summary: 'Automated dictionary coding & manual review terms'
    },
    {
      id: 'site_signoffs',
      label: 'Site sign-offs (PI e-Signatures)',
      pct: site.id === '104' ? 75 : 89,
      targetTab: 'subjects' as const,
      summary: 'Investigator electronic casebook signatures'
    },
    {
      id: 'safety_recon',
      label: 'Safety reconciliation (Rave vs Argus)',
      pct: site.id === '104' ? 55 : 100,
      targetTab: 'sae' as const,
      summary: `${siteSaes.length} unresolved SAE discrepancy case(s)`
    }
  ];

  // Subject search
  let subjectSearch = '';
  $: filteredSiteSubjects = siteSubjects.filter(s =>
    s.id.toLowerCase().includes(subjectSearch.toLowerCase()) ||
    s.initials.toLowerCase().includes(subjectSearch.toLowerCase()) ||
    s.cohort.toLowerCase().includes(subjectSearch.toLowerCase())
  );
</script>

<div class="space-y-6">

  <!-- ========================================================================= -->
  <!-- BREADCRUMB & BACK NAVIGATION (Level 1 Study -> Country -> Level 2 Site)   -->
  <!-- ========================================================================= -->
  <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
    <div class="flex items-center space-x-2 text-xs flex-wrap">
      <button
        type="button"
        on:click={onBackToSites}
        class="inline-flex items-center text-blue-600 hover:text-blue-800 font-bold cursor-pointer"
      >
        <ArrowLeft class="w-3.5 h-3.5 mr-1" />
        <span>Back to Sites &amp; Risks</span>
      </button>
      <span class="text-slate-300">/</span>
      <span class="text-slate-500 font-semibold">Study CA-209-301</span>
      <span class="text-slate-300">/</span>
      <span class="text-slate-600 font-semibold">{site.country} ({site.countryCode})</span>
      <span class="text-slate-300">/</span>
      <span class="font-extrabold text-slate-900">{site.code}: {site.name}</span>
    </div>

    <div class="flex items-center space-x-2 text-xs">
      <span class="text-slate-500">Sources:</span>
      <span class="font-mono bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200">
        {site.traceability.sourceSystem}
      </span>
      <span class="text-slate-500">&middot; Refreshed:</span>
      <span class="text-slate-700 font-semibold">31 Oct 2026, 08:00 UTC</span>
    </div>
  </div>

  <!-- ========================================================================= -->
  <!-- HERO SITE CARD & ALIGNED 35/30/22/13 CONTRIBUTIONS (No Risk Prob Figure)  -->
  <!-- ========================================================================= -->
  <div class="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-5">
    <div class="flex flex-col lg:flex-row lg:items-start justify-between gap-5 pb-5 border-b border-slate-200/80">
      
      <div class="space-y-1.5 max-w-xl">
        <div class="flex items-center space-x-2.5">
          <span class="text-xs font-mono font-bold px-2 py-0.5 rounded bg-rose-600 text-white">
            {site.code}
          </span>
          <span class="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200">
            {site.riskLevel} Risk
          </span>
          <span class="text-xs text-slate-500">{site.city}, {site.country}</span>
        </div>

        <h1 class="text-xl font-extrabold text-slate-900 tracking-tight">
          {site.name} &ndash; Site &amp; Subject Clean-Patient Tracker
        </h1>
        <p class="text-xs text-slate-600">
          Every site drill-down parameter below matches the study-level Readiness categories. Click any parameter card or tab to inspect subject- and record-level evidence.
        </p>
      </div>

      <!-- 3 Key Numerical Metrics (Unexplained Delay Probability removed per Image 13 & 14) -->
      <div class="grid grid-cols-3 gap-3 shrink-0">
        <div class="bg-slate-50 rounded-lg p-3 border border-slate-200 text-center">
          <div class="text-[10px] font-bold text-slate-500 uppercase">Site Readiness</div>
          <div class="text-xl font-extrabold text-slate-900 num-tabular">{site.readinessScore}/100</div>
          <div class="text-[10px] text-slate-500">Study-aligned parameters</div>
        </div>

        <div class="bg-slate-50 rounded-lg p-3 border border-slate-200 text-center">
          <div class="text-[10px] font-bold text-slate-500 uppercase">Potential Impact</div>
          <div class="text-xl font-extrabold text-rose-600 num-tabular">{site.forecastImpactDays}d</div>
          <div class="text-[10px] text-slate-500">on DBL critical path</div>
        </div>

        <div class="bg-slate-50 rounded-lg p-3 border border-slate-200 text-center">
          <div class="text-[10px] font-bold text-slate-500 uppercase">Enrolled Subjects</div>
          <div class="text-xl font-extrabold text-slate-900 num-tabular">{site.enrolledSubjects}</div>
          <div class="text-[10px] text-rose-600 font-semibold">{site.openItems} open items</div>
        </div>
      </div>

    </div>

    <!-- Aligned Factor Contributions (35% / 30% / 22% / 13% with Derivation per Image 14 Blue) -->
    <div>
      <div class="flex flex-col sm:flex-row sm:items-center justify-between text-xs mb-3">
        <div>
          <span class="font-bold text-slate-900">Why at Risk? &ndash; Aligned Factor Contributions (35% / 30% / 22% / 13%)</span>
          <span class="text-slate-500 ml-1">&middot; Quantified contribution to Site {site.id}'s {site.forecastImpactDays}-day potential DBL impact</span>
        </div>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <div class="p-3 bg-rose-50/50 rounded-lg border border-rose-200">
          <div class="flex items-center justify-between text-xs mb-1">
            <span class="font-bold text-slate-900">Safety Reconciliation</span>
            <span class="font-extrabold text-rose-700">{site.breakdown.safetyReconciliation}%</span>
          </div>
          <div class="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
            <div class="h-full bg-rose-600" style="width: {site.breakdown.safetyReconciliation}%"></div>
          </div>
          <div class="mt-1.5 text-[11px] text-slate-600">2 SAE freeze blockers (2.1d / 6.0d)</div>
        </div>

        <div class="p-3 bg-amber-50/50 rounded-lg border border-amber-200">
          <div class="flex items-center justify-between text-xs mb-1">
            <span class="font-bold text-slate-900">Laboratory Transfer</span>
            <span class="font-extrabold text-amber-700">{site.breakdown.labTransferDelay}%</span>
          </div>
          <div class="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
            <div class="h-full bg-amber-600" style="width: {site.breakdown.labTransferDelay}%"></div>
          </div>
          <div class="mt-1.5 text-[11px] text-slate-600">ctDNA batch #LXB-8921 overdue 4d (1.8d / 6.0d)</div>
        </div>

        <div class="p-3 bg-orange-50/50 rounded-lg border border-orange-200">
          <div class="flex items-center justify-between text-xs mb-1">
            <span class="font-bold text-slate-900">Ageing Queries</span>
            <span class="font-extrabold text-orange-700">{site.breakdown.ageingQueries}%</span>
          </div>
          <div class="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
            <div class="h-full bg-orange-600" style="width: {site.breakdown.ageingQueries}%"></div>
          </div>
          <div class="mt-1.5 text-[11px] text-slate-600">14 queries &gt;14d, 5 endpoint-crit (1.3d / 6.0d)</div>
        </div>

        <div class="p-3 bg-blue-50/50 rounded-lg border border-blue-200">
          <div class="flex items-center justify-between text-xs mb-1">
            <span class="font-bold text-slate-900">Sign-off Status</span>
            <span class="font-extrabold text-blue-700">{site.breakdown.signOffStatus}%</span>
          </div>
          <div class="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
            <div class="h-full bg-blue-600" style="width: {site.breakdown.signOffStatus}%"></div>
          </div>
          <div class="mt-1.5 text-[11px] text-slate-600">12 PI signatures pending (0.8d / 6.0d)</div>
        </div>
      </div>
    </div>

    <!-- ======================================================================= -->
    <!-- SITE DRILL-DOWN PARAMETERS MATCHING SEEMA'S STUDY-LEVEL CATEGORIES      -->
    <!-- (Image 9 Blue Requirement: Click any category to drill down)            -->
    <!-- ======================================================================= -->
    <div class="pt-4 border-t border-slate-100">
      <div class="flex items-center justify-between mb-2.5">
        <span class="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
          Site Readiness by Category (Matches Study-Level Drill-Down Parameters &ndash; Click to Inspect)
        </span>
      </div>
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
        {#each siteSeemaCategories as cat}
          <button
            type="button"
            on:click={() => activeSubTab = cat.targetTab}
            class="p-3 rounded-xl border border-slate-200 hover:border-blue-400 bg-slate-50/60 hover:bg-blue-50/40 text-left transition-all cursor-pointer"
          >
            <div class="flex items-center justify-between font-bold text-slate-900">
              <span>{cat.label}</span>
              <span class="font-extrabold {cat.pct < 70 ? 'text-rose-600' : cat.pct < 85 ? 'text-amber-600' : 'text-emerald-700'}">{cat.pct}%</span>
            </div>
            <div class="w-full bg-slate-200 rounded-full h-1.5 my-1.5">
              <div class="h-full rounded-full {cat.pct < 70 ? 'bg-rose-500' : cat.pct < 85 ? 'bg-amber-500' : 'bg-emerald-500'}" style="width: {cat.pct}%"></div>
            </div>
            <div class="text-[10px] text-slate-500 flex items-center justify-between">
              <span>{cat.summary}</span>
              <span class="text-blue-600 font-bold">Inspect &rarr;</span>
            </div>
          </button>
        {/each}
      </div>
    </div>
  </div>

  <!-- ========================================================================= -->
  <!-- SITE SUB-NAVIGATION TABS (Level 3 Subject Health & Level 4 Record Views)  -->
  <!-- ========================================================================= -->
  <div class="border-b border-slate-200 bg-white px-4 rounded-t-xl">
    <nav class="flex space-x-5 text-xs font-bold overflow-x-auto">
      <button
        type="button"
        on:click={() => activeSubTab = 'subjects'}
        class="py-3 border-b-2 transition-colors inline-flex items-center space-x-1.5 cursor-pointer {
          activeSubTab === 'subjects' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'
        }"
      >
        <span>Level 3: Subject Health View (Clean-Patient Tracker)</span>
        <span class="px-1.5 py-0.5 rounded-full text-[10px] bg-blue-100 text-blue-800">{siteSubjects.length}</span>
      </button>

      <button
        type="button"
        on:click={() => activeSubTab = 'queries'}
        class="py-3 border-b-2 transition-colors inline-flex items-center space-x-1.5 cursor-pointer {
          activeSubTab === 'queries' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'
        }"
      >
        <span>Level 4: All Outstanding Queries (Endpoint-Critical Flagged)</span>
        <span class="px-1.5 py-0.5 rounded-full text-[10px] bg-amber-100 text-amber-800 font-bold">{siteQueries.length}</span>
      </button>

      <button
        type="button"
        on:click={() => activeSubTab = 'sae'}
        class="py-3 border-b-2 transition-colors inline-flex items-center space-x-1.5 cursor-pointer {
          activeSubTab === 'sae' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'
        }"
      >
        <span>Level 4: SAE Discrepancies</span>
        <span class="px-1.5 py-0.5 rounded-full text-[10px] bg-rose-100 text-rose-700 font-bold">{siteSaes.length}</span>
      </button>

      <button
        type="button"
        on:click={() => activeSubTab = 'lab'}
        class="py-3 border-b-2 transition-colors inline-flex items-center space-x-1.5 cursor-pointer {
          activeSubTab === 'lab' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'
        }"
      >
        <span>Level 4: External Vendor Transfers</span>
        <span class="px-1.5 py-0.5 rounded-full text-[10px] bg-amber-100 text-amber-700 font-bold">{siteLabs.length}</span>
      </button>
    </nav>
  </div>

  <!-- ========================================================================= -->
  <!-- SUB-TAB 1: LEVEL 3 SUBJECT HEALTH VIEW (CLEAN-PATIENT TRACKER) (Img 12)   -->
  <!-- ========================================================================= -->
  {#if activeSubTab === 'subjects'}
    <div class="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 class="text-sm font-extrabold text-slate-900">
            Level 3: Subject Health View (Clean-Patient Tracker) at {site.code}
          </h3>
          <p class="text-xs text-slate-500">
            Shows subject cleanliness across Missing Pages, Queries (All vs Endpoint-Critical), SDV/SDR, PI Signature, SAE, Coding, and Vendor Items. Click any subject to inspect Level 4 eCRF records.
          </p>
        </div>

        <div class="relative">
          <Search class="w-3.5 h-3.5 text-slate-600 absolute left-2.5 top-2.5" />
          <input
            type="text"
            placeholder="Search subject ID or cohort..."
            bind:value={subjectSearch}
            class="pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-md focus:outline-hidden focus:border-blue-500 w-52"
          />
        </div>
      </div>

      <div class="overflow-x-auto">
        <table class="min-w-full text-xs text-left divide-y divide-slate-200">
          <thead class="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
            <tr>
              <th class="py-2.5 px-3">Subject ID</th>
              <th class="py-2.5 px-2 text-center">Queries (All / Endpoint-Crit)</th>
              <th class="py-2.5 px-2 text-center">Missing Page / SDV</th>
              <th class="py-2.5 px-2 text-center">PI Signature</th>
              <th class="py-2.5 px-2 text-center">SAE Recon</th>
              <th class="py-2.5 px-2 text-center">Coding / Vendor</th>
              <th class="py-2.5 px-2 text-center">Clean Status</th>
              <th class="py-2.5 px-3 text-right">Level 4 Record View</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 font-medium">
            {#each filteredSiteSubjects as subj}
              <tr class="hover:bg-slate-50 transition-colors {subj.riskLevel === 'Critical' ? 'bg-rose-50/20' : ''}">
                <td class="py-3 px-3">
                  <div class="font-bold text-slate-900">{subj.id} ({subj.initials})</div>
                  <div class="text-[10px] text-slate-500">{subj.cohort} &middot; {subj.status}</div>
                </td>
                <!-- Queries (All outstanding vs Endpoint-Critical flagged separately) -->
                <td class="py-3 px-2 text-center">
                  <span class="font-bold text-slate-900">{subj.openQueries} open</span>
                  {#if subj.criticalQueries > 0}
                    <span class="text-[10px] text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200 font-bold block mt-0.5">
                      {subj.criticalQueries} endpoint-critical
                    </span>
                  {:else}
                    <span class="text-[10px] text-slate-500 block mt-0.5">
                      0 endpoint-critical ({subj.openQueries} routine)
                    </span>
                  {/if}
                </td>
                <!-- Missing Page / SDV -->
                <td class="py-3 px-2 text-center">
                  {#if subj.id === 'SUBJ-104-012'}
                    <span class="px-2 py-0.5 rounded bg-rose-100 text-rose-800 text-[10px] font-bold">Form DD-01 Missing</span>
                  {:else if subj.criticalQueries > 0}
                    <span class="px-2 py-0.5 rounded bg-amber-100 text-amber-800 text-[10px] font-bold">SDV Pending</span>
                  {:else}
                    <span class="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">100% Verified</span>
                  {/if}
                </td>
                <!-- PI Signature -->
                <td class="py-3 px-2 text-center">
                  {#if subj.riskLevel === 'Critical' || subj.riskLevel === 'High'}
                    <span class="px-2 py-0.5 rounded bg-amber-100 text-amber-800 text-[10px] font-bold">Pending PI Sign</span>
                  {:else}
                    <span class="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">Signed</span>
                  {/if}
                </td>
                <!-- SAE Recon -->
                <td class="py-3 px-2 text-center">
                  {#if subj.hasSaeDiscrepancy}
                    <span class="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                      SAE Discrepant
                    </span>
                  {:else}
                    <span class="text-emerald-700 font-bold text-[10px]">Clean</span>
                  {/if}
                </td>
                <!-- Coding / Vendor -->
                <td class="py-3 px-2 text-center">
                  {#if subj.id === 'SUBJ-104-019'}
                    <span class="px-2 py-0.5 rounded bg-rose-100 text-rose-800 text-[10px] font-bold">Lab Batch #LXB-8921</span>
                  {:else}
                    <span class="text-emerald-700 font-bold text-[10px]">Reconciled</span>
                  {/if}
                </td>
                <!-- Clean Status -->
                <td class="py-3 px-2 text-center">
                  <span class="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold {
                    subj.riskLevel === 'Critical' ? 'bg-rose-50 text-rose-700 border border-rose-200' : subj.riskLevel === 'High' ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  }">
                    {subj.riskLevel === 'Low' ? 'Non-Critical Only' : `${subj.riskLevel} Blocker`}
                  </span>
                </td>
                <td class="py-3 px-3 text-right">
                  <button
                    type="button"
                    on:click={() => onSelectSubject(subj.id)}
                    class="inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors border border-blue-200 cursor-pointer"
                  >
                    <span>Inspect Subject</span>
                    <ChevronRight class="w-3 h-3 ml-0.5" />
                  </button>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    </div>

  <!-- ========================================================================= -->
  <!-- SUB-TAB 2: ALL OUTSTANDING QUERIES (ENDPOINT-CRITICAL HIGHLIGHTED)        -->
  <!-- (Image 10 Blue Requirement)                                               -->
  <!-- ========================================================================= -->
  {:else if activeSubTab === 'queries'}
    <div class="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 class="text-sm font-extrabold text-slate-900">
            All Outstanding Queries at {site.code} ({siteQueries.length})
          </h3>
          <p class="text-xs text-slate-500">
            All outstanding queries are shown because any unresolved query can affect DBL; endpoint-critical queries are highlighted separately.
          </p>
        </div>

        <div class="flex items-center space-x-1.5 text-xs">
          <button
            type="button"
            on:click={() => queryFilter = 'all'}
            class="px-2.5 py-1 rounded-lg font-bold cursor-pointer {queryFilter === 'all' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700'}"
          >
            All Outstanding ({siteQueries.length})
          </button>
          <button
            type="button"
            on:click={() => queryFilter = 'endpoint_critical'}
            class="px-2.5 py-1 rounded-lg font-bold cursor-pointer {queryFilter === 'endpoint_critical' ? 'bg-rose-600 text-white' : 'bg-rose-50 text-rose-700 border border-rose-200'}"
          >
            Endpoint-Critical ({siteQueries.filter(q => q.isPrimaryEndpoint).length})
          </button>
          <button
            type="button"
            on:click={() => queryFilter = 'non_critical'}
            class="px-2.5 py-1 rounded-lg font-bold cursor-pointer {queryFilter === 'non_critical' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-700'}"
          >
            Non-Endpoint / Routine ({siteQueries.filter(q => !q.isPrimaryEndpoint).length})
          </button>
        </div>
      </div>

      <div class="overflow-x-auto">
        <table class="min-w-full text-xs text-left divide-y divide-slate-200">
          <thead class="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
            <tr>
              <th class="py-2.5 px-3">Query ID &amp; Subject</th>
              <th class="py-2.5 px-3">Classification</th>
              <th class="py-2.5 px-3">Form &amp; Target Field</th>
              <th class="py-2.5 px-3">Discrepancy Details</th>
              <th class="py-2.5 px-3 text-center">Age (Days)</th>
              <th class="py-2.5 px-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 font-medium">
            {#each filteredQueries as q}
              <tr class="hover:bg-slate-50 transition-colors">
                <td class="py-3 px-3">
                  <div class="font-bold text-slate-900 font-mono">{q.id}</div>
                  <div class="text-[11px] text-blue-600 font-semibold">{q.subjectId}</div>
                </td>
                <td class="py-3 px-3">
                  {#if q.isPrimaryEndpoint}
                    <span class="px-2 py-0.5 rounded bg-rose-100 text-rose-800 border border-rose-200 text-[10px] font-bold">
                      Endpoint-Critical
                    </span>
                  {:else}
                    <span class="px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 text-[10px] font-semibold">
                      Other Outstanding (Affects DBL)
                    </span>
                  {/if}
                </td>
                <td class="py-3 px-3">
                  <div class="text-slate-800 font-semibold">{q.form}</div>
                  <div class="font-mono text-[10px] text-slate-500">{q.field}</div>
                </td>
                <td class="py-3 px-3 text-slate-700 max-w-xs">{q.queryText}</td>
                <td class="py-3 px-3 text-center num-tabular font-bold {q.ageDays >= 14 ? 'text-rose-600' : 'text-slate-800'}">
                  {q.ageDays}d
                </td>
                <td class="py-3 px-3 text-right">
                  <button
                    type="button"
                    on:click={() => onSelectSubject(q.subjectId)}
                    class="text-blue-600 hover:text-blue-800 font-semibold text-xs inline-flex items-center cursor-pointer"
                  >
                    <span>View Form</span>
                    <ChevronRight class="w-3 h-3 ml-0.5" />
                  </button>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    </div>

  <!-- ========================================================================= -->
  <!-- SUB-TAB 3: SAE RECONCILIATION DISCREPANCIES                               -->
  <!-- ========================================================================= -->
  {:else if activeSubTab === 'sae'}
    <div class="space-y-4">
      {#each siteSaes as sae}
        <div class="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
            <div>
              <div class="flex items-center space-x-2">
                <span class="font-mono text-xs font-bold bg-slate-100 px-2 py-0.5 rounded text-slate-800">{sae.id}</span>
                <span class="text-xs font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">{sae.criticality}</span>
                <span class="text-xs text-slate-500">Subject: <strong class="text-slate-900">{sae.subjectId}</strong></span>
              </div>
              <h4 class="text-base font-bold text-slate-900 mt-1">{sae.eventTerm}</h4>
            </div>
            <div class="text-right">
              <div class="text-xs font-bold text-rose-600">Delay Impact: +{sae.delayImpact}</div>
              <div class="text-[11px] text-slate-500">Open for {sae.daysOpen} days &middot; Refreshed 31 Oct 08:00 UTC</div>
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div class="p-3 bg-slate-50 rounded border border-slate-200 space-y-1">
              <span class="font-bold text-slate-700 uppercase text-[10px] block">Medidata Rave EDC Record:</span>
              <p class="text-slate-800 font-medium">{sae.raveStatus}</p>
            </div>
            <div class="p-3 bg-amber-50/50 rounded border border-amber-200 space-y-1">
              <span class="font-bold text-amber-800 uppercase text-[10px] block">Oracle Argus Safety Record:</span>
              <p class="text-slate-800 font-medium">{sae.argusStatus}</p>
            </div>
          </div>
        </div>
      {/each}
    </div>

  <!-- ========================================================================= -->
  <!-- SUB-TAB 4: EXTERNAL LAB & VENDOR TRANSFERS                                -->
  <!-- ========================================================================= -->
  {:else if activeSubTab === 'lab'}
    <div class="space-y-4">
      {#each siteLabs as lab}
        <div class="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3 text-xs">
          <div class="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <span class="font-mono font-bold text-slate-900 text-sm">{lab.id}</span>
              <span class="ml-2 font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">{lab.status}</span>
              <h4 class="text-sm font-bold text-slate-800 mt-1">{lab.vendor} &ndash; {lab.assayType}</h4>
            </div>
            <div class="text-right">
              <span class="text-rose-600 font-bold">Due: {lab.dueDate} ({lab.overdueDays}d late)</span>
              <span class="text-slate-500 block">{lab.samplesCount} samples pending</span>
            </div>
          </div>

          <div class="p-3 bg-slate-50 rounded border border-slate-200 space-y-1">
            <span class="text-slate-500 font-semibold uppercase text-[10px]">Automated Vendor Feed Obstacle:</span>
            <p class="text-slate-700">{lab.technicalDetails}</p>
          </div>
        </div>
      {/each}
    </div>
  {/if}

</div>
