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
    ArrowRight
  } from '@lucide/svelte';

  export let site: any;
  export let subjects: any[];
  export let saeDiscrepancies: any[];
  export let queriesDetail: any[];
  export let labBatches: any[];
  export let onBackToSites: () => void;
  export let onSelectSubject: (subjectId: string) => void;
  export let onSelectTab: (tab: string) => void;

  // Internal sub-tab state for Site page
  let activeSubTab: 'overview' | 'subjects' | 'sae' | 'queries' | 'lab' | 'signoffs' = 'overview';

  // Site-specific filtered lists
  $: siteSubjects = subjects.filter(s => s.siteId === site.id);
  $: siteSaes = saeDiscrepancies.filter(s => s.siteId === site.id);
  $: siteQueries = queriesDetail.filter(q => q.siteId === site.id);
  $: siteLabs = labBatches.filter(l => l.sitesAffected.includes(site.id));

  // Subject search
  let subjectSearch = '';
  $: filteredSiteSubjects = siteSubjects.filter(s =>
    s.id.toLowerCase().includes(subjectSearch.toLowerCase()) ||
    s.initials.toLowerCase().includes(subjectSearch.toLowerCase()) ||
    s.cohort.toLowerCase().includes(subjectSearch.toLowerCase())
  );
</script>

<div class="space-y-6">
  <section class="panel site-orientation"><p class="eyebrow">SITE INVESTIGATION</p><h2 class="minor-title">Understand and act on site risk</h2><p class="page-intro">Review the main drivers, then explore the available sample subjects, safety issues, queries and lab records below.</p><div class="button-row"><button class="subtle-button" on:click={() => {activeSubTab='subjects'; document.getElementById('site-details')?.scrollIntoView({behavior:'smooth'});}}>Explore subjects</button><button class="subtle-button" on:click={() => {activeSubTab='queries'; document.getElementById('site-details')?.scrollIntoView({behavior:'smooth'});}}>Review queries</button><button class="primary-dark" on:click={() => onSelectTab('action_workbench')}>Review actions →</button></div></section>

  <!-- ========================================================================= -->
  <!-- BREADCRUMB & BACK NAVIGATION                                              -->
  <!-- ========================================================================= -->
  <div class="flex items-center justify-between">
    <div class="flex items-center space-x-2 text-xs">
      <button
        type="button"
        on:click={onBackToSites}
        class="inline-flex items-center text-slate-500 hover:text-slate-900 font-medium"
      >
        <ArrowLeft class="w-3.5 h-3.5 mr-1" />
        <span>Predictive Risk Matrix</span>
      </button>
      <span class="text-slate-300">/</span>
      <span class="font-bold text-slate-900">{site.code}: {site.name}</span>
    </div>

    <div class="flex items-center space-x-2 text-xs">
      <span class="text-slate-500">Source:</span>
      <span class="font-mono bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200">
        {site.traceability.sourceSystem.split('/')[0]}
      </span>
      <span class="text-slate-500">&middot; Extract:</span>
      <span class="text-slate-700 font-semibold">{site.traceability.extractDate.split(' ')[0]}</span>
    </div>
  </div>

  <!-- ========================================================================= -->
  <!-- HERO SITE EXECUTIVE CARD & SHAP EXPLANATION BREAKDOWN                      -->
  <!-- ========================================================================= -->
  <div class="bg-white rounded-lg border border-slate-200/90 p-5 shadow-xs">
    <div class="flex flex-col lg:flex-row lg:items-start justify-between gap-5 pb-5 border-b border-slate-200/80">
      
      <!-- Site Identifiers -->
      <div class="space-y-1.5 max-w-xl">
        <div class="flex items-center space-x-2.5">
          <span class="text-xs font-mono font-bold px-2 py-0.5 rounded bg-rose-600 text-white">
            {site.code}
          </span>
          <span class="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200">
            {site.priority} Priority Blocker
          </span>
          <span class="text-xs text-slate-500">{site.country} &middot; {site.city}</span>
        </div>

        <h1 class="text-xl font-extrabold text-slate-900 tracking-tight">
          {site.name}
        </h1>
        <p class="text-xs text-slate-600">
          Institution: <strong>{site.institution}</strong> &middot; PI: <strong>{site.pi}</strong> &middot; CRA: <strong>{site.cra}</strong>
        </p>
      </div>

      <!-- Key Numerical Predictions -->
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 shrink-0">
        <div class="bg-slate-50 rounded-md p-2.5 border border-slate-200 text-center">
          <div class="text-[10px] font-semibold text-slate-500 uppercase">Delay Probability</div>
          <div class="text-xl font-extrabold text-rose-600 num-tabular">{site.riskProbability}%</div>
          <div class="text-[10px] text-slate-500">Bayesian model</div>
        </div>

        <div class="bg-slate-50 rounded-md p-2.5 border border-slate-200 text-center">
          <div class="text-[10px] font-semibold text-slate-500 uppercase">Forecast Delay</div>
          <div class="text-xl font-extrabold text-rose-600 num-tabular">{site.forecastImpactDays}</div>
          <div class="text-[10px] text-slate-500">on critical path</div>
        </div>

        <div class="bg-slate-50 rounded-md p-2.5 border border-slate-200 text-center">
          <div class="text-[10px] font-semibold text-slate-500 uppercase">Readiness Score</div>
          <div class="text-xl font-extrabold text-slate-900 num-tabular">{site.readinessScore}%</div>
          <div class="text-[10px] text-rose-600 font-semibold">-33 pts vs target</div>
        </div>

        <div class="bg-slate-50 rounded-md p-2.5 border border-slate-200 text-center">
          <div class="text-[10px] font-semibold text-slate-500 uppercase">Active Subjects</div>
          <div class="text-xl font-extrabold text-slate-900 num-tabular">{site.activeSubjects}</div>
          <div class="text-[10px] text-slate-500">{site.criticalBlockers} critical</div>
        </div>
      </div>

    </div>

    <!-- Explainability Section: Factor Contribution Decomposition (SHAP weights) -->
    <div class="pt-4">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between text-xs mb-3">
        <div>
          <span class="font-bold text-slate-900">Explainable Model Attribution (Why this risk was generated)</span>
          <span class="text-slate-500 ml-1">&middot; Quantified contribution to site's {site.forecastImpactDays} delay</span>
        </div>
        <span class="text-slate-500 text-[11px]">Model: {site.traceability.ruleModelFactor}</span>
      </div>

      <!-- Progress bars grid -->
      <div class="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <div class="p-3 bg-rose-50/50 rounded-md border border-rose-200">
          <div class="flex items-center justify-between text-xs mb-1">
            <span class="font-bold text-slate-900">Safety Reconciliation</span>
            <span class="font-extrabold text-rose-700">{site.breakdown.safetyReconciliation}%</span>
          </div>
          <div class="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
            <div class="h-full bg-rose-600" style="width: {site.breakdown.safetyReconciliation}%"></div>
          </div>
          <div class="mt-1.5 text-[11px] text-slate-600">2 unresolved SAE discrepancies</div>
        </div>

        <div class="p-3 bg-amber-50/50 rounded-md border border-amber-200">
          <div class="flex items-center justify-between text-xs mb-1">
            <span class="font-bold text-slate-900">Laboratory Transfer</span>
            <span class="font-extrabold text-amber-700">{site.breakdown.labTransferDelay}%</span>
          </div>
          <div class="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
            <div class="h-full bg-amber-600" style="width: {site.breakdown.labTransferDelay}%"></div>
          </div>
          <div class="mt-1.5 text-[11px] text-slate-600">ctDNA batch overdue 4 days</div>
        </div>

        <div class="p-3 bg-orange-50/50 rounded-md border border-orange-200">
          <div class="flex items-center justify-between text-xs mb-1">
            <span class="font-bold text-slate-900">Ageing Queries</span>
            <span class="font-extrabold text-orange-700">{site.breakdown.ageingQueries}%</span>
          </div>
          <div class="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
            <div class="h-full bg-orange-600" style="width: {site.breakdown.ageingQueries}%"></div>
          </div>
          <div class="mt-1.5 text-[11px] text-slate-600">14 critical queries &gt;14 days</div>
        </div>

        <div class="p-3 bg-blue-50/50 rounded-md border border-blue-200">
          <div class="flex items-center justify-between text-xs mb-1">
            <span class="font-bold text-slate-900">Sign-off Status</span>
            <span class="font-extrabold text-blue-700">{site.breakdown.signOffStatus}%</span>
          </div>
          <div class="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
            <div class="h-full bg-blue-600" style="width: {site.breakdown.signOffStatus}%"></div>
          </div>
          <div class="mt-1.5 text-[11px] text-slate-600">6 PI signatures pending</div>
        </div>
      </div>
    </div>
  </div>

  <!-- ========================================================================= -->
  <!-- SITE SUB-NAVIGATION TABS (DRILL-DOWN CHANNELS)                            -->
  <!-- ========================================================================= -->
  <div class="border-b border-slate-200">
    <nav class="flex space-x-4 text-xs font-semibold">
      <button
        type="button"
        on:click={() => activeSubTab = 'overview'}
        class="py-2.5 border-b-2 transition-colors {
          activeSubTab === 'overview' ? 'border-slate-900 text-slate-900' : 'border-transparent text-slate-500 hover:text-slate-700'
        }"
      >
        Overview &amp; Sample traceability
      </button>

      <button
        type="button"
        on:click={() => activeSubTab = 'subjects'}
        class="py-2.5 border-b-2 transition-colors inline-flex items-center space-x-1.5 {
          activeSubTab === 'subjects' ? 'border-slate-900 text-slate-900' : 'border-transparent text-slate-500 hover:text-slate-700'
        }"
      >
        <span>Enrolled Subjects</span>
        <span class="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-100 text-slate-700">{siteSubjects.length}</span>
      </button>

      <button
        type="button"
        on:click={() => activeSubTab = 'sae'}
        class="py-2.5 border-b-2 transition-colors inline-flex items-center space-x-1.5 {
          activeSubTab === 'sae' ? 'border-slate-900 text-slate-900' : 'border-transparent text-slate-500 hover:text-slate-700'
        }"
      >
        <span>SAE Discrepancies</span>
        <span class="px-1.5 py-0.2 rounded-full text-[10px] bg-rose-100 text-rose-700 font-bold">{siteSaes.length}</span>
      </button>

      <button
        type="button"
        on:click={() => activeSubTab = 'queries'}
        class="py-2.5 border-b-2 transition-colors inline-flex items-center space-x-1.5 {
          activeSubTab === 'queries' ? 'border-slate-900 text-slate-900' : 'border-transparent text-slate-500 hover:text-slate-700'
        }"
      >
        <span>Critical Queries</span>
        <span class="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-100 text-amber-700 font-bold">{siteQueries.length}</span>
      </button>

      <button
        type="button"
        on:click={() => activeSubTab = 'lab'}
        class="py-2.5 border-b-2 transition-colors inline-flex items-center space-x-1.5 {
          activeSubTab === 'lab' ? 'border-slate-900 text-slate-900' : 'border-transparent text-slate-500 hover:text-slate-700'
        }"
      >
        <span>External Lab Batches</span>
        <span class="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-100 text-amber-700 font-bold">{siteLabs.length}</span>
      </button>
    </nav>
  </div>

  <!-- ========================================================================= -->
  <div id="site-details"></div>
  <!-- SUB-TAB 1: OVERVIEW & GXP TRACEABILITY                                     -->
  <!-- ========================================================================= -->
  {#if activeSubTab === 'overview'}
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      
      <!-- Left: Specific Root Causes Generated -->
      <div class="bg-white rounded-lg border border-slate-200 p-5 shadow-xs space-y-4">
        <div>
          <h3 class="text-sm font-bold text-slate-900">Specific Root Causes Generating Lock Risk</h3>
          <p class="text-xs text-slate-500">Factors and source references are illustrative sample data</p>
        </div>

        <ul class="space-y-3">
          {#each site.reasons as reason, idx}
            <li class="flex items-start space-x-3 text-xs">
              <span class="h-5 w-5 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center font-bold shrink-0 mt-0.5">
                {idx + 1}
              </span>
              <div class="text-slate-800 leading-relaxed font-medium">
                {reason}
              </div>
            </li>
          {/each}
        </ul>

        <div class="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
          <span class="text-slate-500">Closure Velocity: <strong class="text-slate-800">{site.closureVelocity}</strong></span>
          <button
            type="button"
            on:click={() => onSelectTab('action_workbench')}
            class="text-blue-600 hover:text-blue-800 font-semibold inline-flex items-center"
          >
            <span>Generate CRA Action Plan</span>
            <ArrowRight class="w-3.5 h-3.5 ml-1" />
          </button>
        </div>
      </div>

      <!-- Right: Regulated Sample traceability Panel -->
      <div class="bg-white rounded-lg border border-slate-200 p-5 shadow-xs space-y-4">
        <div>
          <h3 class="text-sm font-bold text-slate-900">Example source traceability</h3>
          <p class="text-xs text-slate-500">Audit lineage distinguishing explainable intelligence from a black box</p>
        </div>

        <div class="space-y-3 text-xs">
          <div class="p-3 bg-slate-50 rounded border border-slate-200">
            <span class="text-slate-500 block text-[11px] font-semibold uppercase">Source Systems:</span>
            <span class="font-mono text-slate-800 font-bold">{site.traceability.sourceSystem}</span>
          </div>

          <div class="p-3 bg-slate-50 rounded border border-slate-200">
            <span class="text-slate-500 block text-[11px] font-semibold uppercase">Data Extract Timestamp:</span>
            <span class="font-mono text-slate-800 font-bold">{site.traceability.extractDate}</span>
          </div>

          <div class="p-3 bg-slate-50 rounded border border-slate-200">
            <span class="text-slate-500 block text-[11px] font-semibold uppercase">Sample refresh:</span>
            <span class="text-slate-800 font-medium">{site.traceability.refreshCycle}</span>
          </div>

          <div class="p-3 bg-slate-50 rounded border border-slate-200">
            <span class="text-slate-500 block text-[11px] font-semibold uppercase">Validation &amp; Integrity Confidence:</span>
            <span class="text-emerald-700 font-bold">{site.traceability.dataTrustScore}</span>
          </div>
        </div>
      </div>

    </div>

  <!-- ========================================================================= -->
  <!-- SUB-TAB 2: ENROLLED SUBJECTS ROSTER (DEEP DRILL-DOWN CAPABILITY)          -->
  <!-- ========================================================================= -->
  {:else if activeSubTab === 'subjects'}
    <div class="bg-white rounded-lg border border-slate-200 p-5 shadow-xs space-y-4">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 class="text-sm font-bold text-slate-900">Enrolled Subjects at {site.code}</h3>
          <p class="text-xs text-slate-500">
            Click any subject to open the deep subject-level eCRF, RECIST tumor scan, and adverse event investigation.
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

      <!-- Subject Table -->
      <div class="overflow-x-auto">
        <table class="min-w-full text-xs text-left divide-y divide-slate-200">
          <thead class="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
            <tr>
              <th class="py-2.5 px-3">Subject ID &amp; Demographics</th>
              <th class="py-2.5 px-3">Cohort &amp; Status</th>
              <th class="py-2.5 px-3 text-center">Open Queries</th>
              <th class="py-2.5 px-3 text-center">Delay Contribution</th>
              <th class="py-2.5 px-3 text-center">Safety Discrepancy</th>
              <th class="py-2.5 px-3 text-center">Risk Level</th>
              <th class="py-2.5 px-3 text-right">Deep Drill-Down</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 font-medium">
            {#each filteredSiteSubjects as subj}
              <tr class="hover:bg-slate-50 transition-colors {subj.riskLevel === 'Critical' ? 'bg-rose-50/20' : ''}">
                <td class="py-3 px-3">
                  <div class="font-bold text-slate-900">{subj.id}</div>
                  <div class="text-[11px] text-slate-500">{subj.initials} &middot; {subj.sex}, {subj.age} yrs</div>
                </td>
                <td class="py-3 px-3">
                  <div class="text-slate-800">{subj.cohort}</div>
                  <div class="text-[11px] text-slate-500">{subj.status}</div>
                </td>
                <td class="py-3 px-3 text-center num-tabular">
                  <span class="font-bold text-slate-900">{subj.openQueries}</span>
                  <span class="text-[10px] text-slate-500 block">({subj.criticalQueries} critical)</span>
                </td>
                <td class="py-3 px-3 text-center num-tabular font-bold {subj.delayContributionDays >= 2 ? 'text-rose-600' : 'text-slate-700'}">
                  +{subj.delayContributionDays}d
                </td>
                <td class="py-3 px-3 text-center">
                  {#if subj.hasSaeDiscrepancy}
                    <span class="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                      SAE Unmatched
                    </span>
                  {:else}
                    <span class="text-slate-400 text-xs">&mdash;</span>
                  {/if}
                </td>
                <td class="py-3 px-3 text-center">
                  <span class="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold {
                    subj.riskLevel === 'Critical' ? 'bg-rose-50 text-rose-700 border border-rose-200' : subj.riskLevel === 'High' ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-slate-50 text-slate-700 border border-slate-200'
                  }">
                    {subj.riskLevel}
                  </span>
                </td>
                <td class="py-3 px-3 text-right">
                  <button
                    type="button"
                    on:click={() => onSelectSubject(subj.id)}
                    class="inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors border border-blue-200"
                  >
                    <span>Investigate Subject</span>
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
  <!-- SUB-TAB 3: SAE RECONCILIATION DISCREPANCIES (SIDE-BY-SIDE RAVE VS ARGUS) -->
  <!-- ========================================================================= -->
  {:else if activeSubTab === 'sae'}
    <div class="space-y-4">
      <div class="bg-rose-50 border border-rose-200 rounded-lg p-4 text-xs">
        <div class="flex items-center space-x-2">
          <ShieldAlert class="w-4 h-4 text-rose-700" />
          <span class="font-bold text-rose-900 text-sm">Critical Pharmacovigilance Freeze Blockers</span>
        </div>
        <p class="text-rose-800 mt-1">
          Under ICH E6(R2) and 21 CFR Part 312, a clinical study database cannot be locked while serious adverse events (SAEs) remain discrepant between clinical EDC (Rave) and safety surveillance (Argus).
        </p>
      </div>

      {#each siteSaes as sae}
        <div class="bg-white rounded-lg border border-slate-200 p-5 shadow-xs space-y-4">
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
              <div class="text-[11px] text-slate-500">Open for {sae.daysOpen} days</div>
            </div>
          </div>

          <!-- Side-by-Side Comparison -->
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

          <!-- Resolution Guidance -->
          <div class="p-3 bg-blue-50/60 rounded border border-blue-200 text-xs space-y-1">
            <span class="font-bold text-blue-900 uppercase text-[10px]">AI-Recommended Regulatory Resolution:</span>
            <p class="text-blue-800">{sae.suggestedAction}</p>
          </div>

          <div class="flex items-center justify-between text-xs pt-1">
            <span class="text-slate-500">Assigned PV Lead: <strong class="text-slate-800">{sae.lead}</strong></span>
            <button
              type="button"
              on:click={() => onSelectSubject(sae.subjectId)}
              class="text-blue-600 hover:text-blue-800 font-semibold inline-flex items-center"
            >
              <span>Examine Subject {sae.subjectId} eCRF Forms</span>
              <ChevronRight class="w-3.5 h-3.5 ml-0.5" />
            </button>
          </div>
        </div>
      {/each}
    </div>

  <!-- ========================================================================= -->
  <!-- SUB-TAB 4: CRITICAL QUERIES (RECIST 1.1 ENDPOINT)                         -->
  <!-- ========================================================================= -->
  {:else if activeSubTab === 'queries'}
    <div class="bg-white rounded-lg border border-slate-200 p-5 shadow-xs space-y-4">
      <div class="flex items-center justify-between">
        <div>
          <h3 class="text-sm font-bold text-slate-900">Critical Queries on DBL Path ({siteQueries.length})</h3>
          <p class="text-xs text-slate-500">Queries affecting primary efficacy endpoints or regulatory freeze forms</p>
        </div>
      </div>

      <div class="overflow-x-auto">
        <table class="min-w-full text-xs text-left divide-y divide-slate-200">
          <thead class="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
            <tr>
              <th class="py-2.5 px-3">Query ID &amp; Subject</th>
              <th class="py-2.5 px-3">Form &amp; Target Field</th>
              <th class="py-2.5 px-3">Discrepancy Details</th>
              <th class="py-2.5 px-3 text-center">Age (Days)</th>
              <th class="py-2.5 px-3 text-center">Status</th>
              <th class="py-2.5 px-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 font-medium">
            {#each siteQueries as q}
              <tr class="hover:bg-slate-50 transition-colors">
                <td class="py-3 px-3">
                  <div class="font-bold text-slate-900 font-mono">{q.id}</div>
                  <div class="text-[11px] text-blue-600 font-semibold">{q.subjectId}</div>
                </td>
                <td class="py-3 px-3">
                  <div class="text-slate-800 font-semibold">{q.form}</div>
                  <div class="font-mono text-[10px] text-slate-500">{q.field}</div>
                </td>
                <td class="py-3 px-3 text-slate-700 max-w-xs">{q.queryText}</td>
                <td class="py-3 px-3 text-center num-tabular font-bold {q.ageDays >= 14 ? 'text-rose-600' : 'text-slate-800'}">
                  {q.ageDays}d
                </td>
                <td class="py-3 px-3 text-center">
                  <span class="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold {
                    q.isCriticalPath ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-slate-50 text-slate-700 border border-slate-200'
                  }">
                    {q.status}
                  </span>
                </td>
                <td class="py-3 px-3 text-right">
                  <button
                    type="button"
                    on:click={() => onSelectSubject(q.subjectId)}
                    class="text-blue-600 hover:text-blue-800 font-semibold text-xs inline-flex items-center"
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
  <!-- SUB-TAB 5: EXTERNAL LAB BATCH                                             -->
  <!-- ========================================================================= -->
  {:else if activeSubTab === 'lab'}
    <div class="space-y-4">
      {#each siteLabs as lab}
        <div class="bg-white rounded-lg border border-slate-200 p-5 shadow-xs space-y-3 text-xs">
          <div class="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <span class="font-mono font-bold text-slate-900 text-sm">{lab.id}</span>
              <span class="ml-2 font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">{lab.status}</span>
              <h4 class="text-sm font-bold text-slate-800 mt-1">{lab.assayType}</h4>
            </div>
            <div class="text-right">
              <span class="text-rose-600 font-bold">+{lab.delayImpact} Delay</span>
              <span class="text-slate-500 block">{lab.samplesCount} samples pending</span>
            </div>
          </div>

          <div class="p-3 bg-slate-50 rounded border border-slate-200 space-y-1">
            <span class="text-slate-500 font-semibold uppercase text-[10px]">Technical Obstacle:</span>
            <p class="text-slate-700">{lab.technicalDetails}</p>
          </div>

          <div class="p-3 bg-emerald-50 rounded border border-emerald-200 space-y-1">
            <span class="text-emerald-800 font-semibold uppercase text-[10px]">Resolution Timeline:</span>
            <p class="text-emerald-900">{lab.resolutionPath}</p>
          </div>
        </div>
      {/each}
    </div>
  {/if}

</div>
