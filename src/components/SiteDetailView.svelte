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

  // Site evidence views
  let activeSubTab: 'subjects' | 'queries' | 'sae' | 'lab' = 'subjects';
  let queryFilter: 'all' | 'endpoint_critical' | 'non_critical' = 'all';

  // Site-specific filtered lists
  $: siteSubjects = subjects.filter(s => s.siteId === site.id);
  $: siteSaes = saeDiscrepancies.filter(s => s.siteId === site.id);
  $: siteQueries = queriesDetail.filter(q => q.siteId === site.id);
  $: filteredQueries = siteQueries.filter(q => {
    if (queryFilter === 'endpoint_critical') return q.isPrimaryEndpoint;
    if (queryFilter === 'non_critical') return !q.isPrimaryEndpoint;
    return true;
  });
  $: siteLabs = labBatches.filter(l => l.sitesAffected.includes(site.id));

  // Readiness and forecast impact use different denominators.
  let trackerFilter: 'all' | 'open' | 'clean' | 'unfrozen' | 'forms' | 'endpoint' | 'queries' | 'signoff' = 'all';

  function isPendingForm(form: { status: string }) {
    return !['Clean', 'Verified', 'Signed', 'Complete'].includes(form.status);
  }

  function isSignoff(form: { name: string }) {
    return /sign[- ]?off|signature/i.test(form.name);
  }

  $: trackerRows = siteSubjects.map(subject => {
    const forms = subject.forms ?? [];
    const evidence = siteQueries.filter(query => query.subjectId === subject.id);
    const openForms = forms.filter(isPendingForm);
    const openQueries = Math.max(subject.openQueries ?? 0, evidence.length);
    const cleaning = subject.cleaning;
    const hasSafetyDiscrepancy = subject.hasSaeDiscrepancy || siteSaes.some(record => record.subjectId === subject.id);
    return {
      subject,
      cleaning,
      openQueries,
      endpointQueries: Math.min(openQueries, Math.max(subject.criticalQueries ?? 0, evidence.filter(query => query.isPrimaryEndpoint).length)),
      pendingForms: openForms.filter((form: { name: string }) => !isSignoff(form)),
      signoff: openForms.find(isSignoff) ?? forms.find(isSignoff),
      pendingSignoff: openForms.some(isSignoff) || cleaning?.piSigned === false,
      verifiedForms: forms.filter((form: { status: string }) => form.status === 'Verified').length,
      formCount: forms.filter((form: { name: string }) => !isSignoff(form)).length,
      vendorItems: openForms.filter((form: { flag: string }) => form.flag === 'External Lab'),
      hasSafetyDiscrepancy,
      hasOpenWork: openQueries > 0 || openForms.length > 0 || hasSafetyDiscrepancy,
      isClean: !!cleaning && openQueries === 0 && openForms.length === 0 && !hasSafetyDiscrepancy
    };
  });

  $: filteredSiteSubjects = trackerRows.filter(row => {
    const search = subjectSearch.trim().toLowerCase();
    if (![row.subject.id, row.subject.cohort].some(value => value.toLowerCase().includes(search))) return false;
    if (trackerFilter === 'open') return row.hasOpenWork;
    if (trackerFilter === 'clean') return row.isClean;
    if (trackerFilter === 'unfrozen') return row.cleaning?.frozen === false;
    if (trackerFilter === 'forms') return row.pendingForms.length > 0;
    if (trackerFilter === 'endpoint') return row.endpointQueries > 0;
    if (trackerFilter === 'queries') return row.openQueries > 0;
    if (trackerFilter === 'signoff') return !!row.pendingSignoff;
    return true;
  }).sort((a, b) => b.endpointQueries - a.endpointQueries || b.openQueries - a.openQueries);
  $: siteSeemaCategories = [
    {
      id: 'edc_cleaning',
      impact: null,
      label: 'EDC data cleaning (Entry & SDV/SDR)',
      pct: site.id === '104' ? 84 : 91,
      targetTab: 'subjects' as const,
      summary: 'Missing pages, SDV/SDR verification & form completeness'
    },
    {
      id: 'query_resolution',
      impact: site.breakdown.ageingQueries,
      driver: 'Ageing queries',
      label: 'Query resolution (All & Endpoint-Critical)',
      pct: site.id === '104' ? 68 : 74,
      targetTab: 'queries' as const,
      summary: `${siteQueries.length} open queries shown (${siteQueries.filter(q => q.isPrimaryEndpoint).length} endpoint-critical flagged)`
    },
    {
      id: 'external_recon',
      impact: site.breakdown.labTransferDelay,
      driver: 'Laboratory transfer',
      label: 'External data reconciliation (Vendor)',
      pct: site.id === '104' ? 52 : 86,
      targetTab: 'lab' as const,
      summary: `${siteLabs.length} vendor transfer batch(es) affecting site`
    },
    {
      id: 'medical_coding',
      impact: null,
      label: 'Medical coding (MedDRA & WHODrug)',
      pct: site.id === '104' ? 88 : 92,
      targetTab: 'subjects' as const,
      summary: 'Automated dictionary coding & manual review terms'
    },
    {
      id: 'site_signoffs',
      impact: site.breakdown.signOffStatus,
      driver: 'PI sign-off',
      label: 'Site sign-offs (PI e-Signatures)',
      pct: site.id === '104' ? 75 : 89,
      targetTab: 'subjects' as const,
      summary: 'Investigator electronic casebook signatures'
    },
    {
      id: 'safety_recon',
      impact: site.breakdown.safetyReconciliation,
      driver: 'Safety reconciliation',
      label: 'Safety reconciliation (Rave vs Argus)',
      pct: site.id === '104' ? 55 : 100,
      targetTab: 'sae' as const,
      summary: `${siteSaes.length} unresolved SAE discrepancy case(s)`
    }
  ];

  let subjectSearch = '';
</script>

<div class="space-y-6">

  <!-- ========================================================================= -->
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
          {site.name}
        </h1>
        <p class="text-xs text-slate-600">
          Select a readiness category to review the supporting records.
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

    <section aria-labelledby="site-readiness-heading">
      <h2 id="site-readiness-heading" class="text-sm font-extrabold text-slate-900">Site readiness &amp; lock risk</h2>
      <p class="mt-1 mb-3 text-xs text-slate-500">Readiness shows progress within each category. Risk share shows each modeled driver's contribution to the {site.forecastImpactDays}-day forecast impact.</p>
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
        {#each siteSeemaCategories as cat}
          <button
            type="button"
            on:click={() => {
              activeSubTab = cat.targetTab;
              trackerFilter = cat.id === 'site_signoffs' ? 'signoff' : 'all';
            }}
            class="p-3 rounded-xl border border-slate-200 hover:border-blue-400 bg-slate-50/60 hover:bg-blue-50/40 text-left transition-all cursor-pointer"
          >
            <div class="flex items-center justify-between font-bold text-slate-900">
              <span>{cat.label}</span>
              <span class="font-extrabold {cat.pct < 70 ? 'text-rose-600' : cat.pct < 85 ? 'text-amber-600' : 'text-emerald-700'}">{cat.pct}% ready</span>
            </div>
            <div class="w-full bg-slate-200 rounded-full h-1.5 my-1.5">
              <div class="h-full rounded-full {cat.pct < 70 ? 'bg-rose-500' : cat.pct < 85 ? 'bg-amber-500' : 'bg-emerald-500'}" style="width: {cat.pct}%"></div>
            </div>
            {#if cat.impact != null}
              <div class="mb-1 text-[11px] font-semibold text-amber-800">
                {cat.driver} · {cat.impact}% risk share · {(site.forecastImpactDays * cat.impact / 100).toFixed(1)}d
              </div>
            {/if}
            <div class="text-[10px] text-slate-500 flex items-center justify-between gap-2">
              <span>{cat.summary}</span>
              <span class="text-blue-600 font-bold">Inspect &rarr;</span>
            </div>
          </button>
        {/each}
      </div>
      {#if site.breakdown.other > 0}
        <p class="mt-2 text-xs text-slate-500">Other modeled drivers account for {site.breakdown.other}% of forecast impact.</p>
      {/if}
    </section>
  </div>

  <!-- ========================================================================= -->
  <!-- ========================================================================= -->
  <div class="border-b border-slate-200 bg-white px-4 rounded-t-xl">
    <nav class="flex space-x-5 text-xs font-bold overflow-x-auto">
      <button
        type="button"
        on:click={() => { activeSubTab = 'subjects'; trackerFilter = 'all'; }}
        class="py-3 border-b-2 transition-colors inline-flex items-center space-x-1.5 cursor-pointer {
          activeSubTab === 'subjects' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'
        }"
      >
        <span>Clean Patient Tracker</span>
        <span class="px-1.5 py-0.5 rounded-full text-[10px] bg-blue-100 text-blue-800">{siteSubjects.length}</span>
      </button>

      <button
        type="button"
        on:click={() => activeSubTab = 'queries'}
        class="py-3 border-b-2 transition-colors inline-flex items-center space-x-1.5 cursor-pointer {
          activeSubTab === 'queries' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'
        }"
      >
        <span>All Outstanding Queries (Endpoint-Critical Flagged)</span>
        <span class="px-1.5 py-0.5 rounded-full text-[10px] bg-amber-100 text-amber-800 font-bold">{siteQueries.length}</span>
      </button>

      <button
        type="button"
        on:click={() => activeSubTab = 'sae'}
        class="py-3 border-b-2 transition-colors inline-flex items-center space-x-1.5 cursor-pointer {
          activeSubTab === 'sae' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'
        }"
      >
        <span>SAE Discrepancies</span>
        <span class="px-1.5 py-0.5 rounded-full text-[10px] bg-rose-100 text-rose-700 font-bold">{siteSaes.length}</span>
      </button>

      <button
        type="button"
        on:click={() => activeSubTab = 'lab'}
        class="py-3 border-b-2 transition-colors inline-flex items-center space-x-1.5 cursor-pointer {
          activeSubTab === 'lab' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'
        }"
      >
        <span>External Vendor Transfers</span>
        <span class="px-1.5 py-0.5 rounded-full text-[10px] bg-amber-100 text-amber-700 font-bold">{siteLabs.length}</span>
      </button>
    </nav>
  </div>

  <!-- ========================================================================= -->
  <!-- ========================================================================= -->
  {#if activeSubTab === 'subjects'}
    <div class="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
      <div>
        <h2 class="text-base font-extrabold text-slate-900">Clean Patient Tracker</h2>
        <p class="mt-1 text-xs text-slate-500">EDC data cleaning · {siteSubjects.length} demo subjects at {site.code}. Supplemented rows show demo progress for the listed forms.</p>
      </div>

      <div class="flex flex-wrap items-center gap-2">
        <div class="relative">
          <Search class="w-3.5 h-3.5 text-slate-600 absolute left-2.5 top-2.5" />
          <input
            type="search"
            aria-label="Search by subject ID or cohort"
            placeholder="Subject ID or cohort"
            bind:value={subjectSearch}
            class="pl-8 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-md w-52"
          />
        </div>
        <select bind:value={trackerFilter} aria-label="Filter by cleaning task" class="rounded-md border border-slate-200 bg-white p-2 text-xs">
          <option value="all">All cleaning tasks</option>
          <option value="open">Subjects with open work</option>
          <option value="clean">Clean subjects</option>
          <option value="unfrozen">Awaiting freeze</option>
          <option value="forms">Open eCRF items</option>
          <option value="endpoint">Endpoint-critical queries</option>
          <option value="queries">Any open query</option>
          <option value="signoff">Pending PI sign-off</option>
        </select>
        <span class="text-xs text-slate-500" aria-live="polite">{filteredSiteSubjects.length} of {siteSubjects.length} subjects</span>
      </div>

      {#if filteredSiteSubjects.length}
        <div class="overflow-x-auto">
          <table class="min-w-full text-xs text-left divide-y divide-slate-200">
            <thead class="bg-slate-50 text-slate-600 font-bold">
              <tr>
                <th scope="col" class="p-3">Subject</th>
                <th scope="col" class="p-3">Cleaning status</th>
                <th scope="col" class="p-3">Open queries</th>
                <th scope="col" class="p-3">Entry</th>
                <th scope="col" class="p-3">SDV / SDR</th>
                <th scope="col" class="p-3">Reconciliation</th>
                <th scope="col" class="p-3">Coding</th>
                <th scope="col" class="p-3">PI sign-off</th>
                <th scope="col" class="p-3">Freeze</th>
                <th scope="col" class="p-3">Records</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 align-top">
              {#each filteredSiteSubjects as row (row.subject.id)}
                <tr class="hover:bg-slate-50">
                  <th scope="row" class="p-3 font-semibold text-slate-900">
                    {row.subject.id}
                    <span class="block max-w-48 font-normal text-slate-500">{row.subject.syntheticSubject ? 'Synthetic demo' : row.subject.cohort}</span>
                    {#if !row.subject.syntheticSubject && row.cleaning}
                      <span class="block font-normal text-slate-500">Demo progress added</span>
                    {/if}
                  </th>
                  <td class="p-3">
                    <span class="inline-block rounded px-2 py-1 font-semibold {row.hasOpenWork ? 'bg-amber-50 text-amber-800' : row.isClean ? 'bg-emerald-50 text-emerald-800' : 'bg-slate-100 text-slate-700'}">
                      {row.hasOpenWork ? 'Open cleaning items' : row.isClean ? 'Clean' : 'Clean status unverified'}
                    </span>
                  </td>
                  <td class="p-3">
                    <span class="font-semibold whitespace-nowrap">{row.openQueries} open</span>
                    <span class="block text-slate-500">{row.openQueries - row.endpointQueries} routine</span>
                    {#if row.endpointQueries}
                      <span class="block font-bold text-rose-700">{row.endpointQueries} endpoint-critical</span>
                    {/if}
                  </td>
                  <td class="p-3">
                    {#if row.cleaning}
                      <span class="whitespace-nowrap">{row.cleaning.entered}/{row.cleaning.total} entered</span>
                      {#if row.cleaning.entered < row.cleaning.total}
                        <span class="block text-amber-800">{row.cleaning.total - row.cleaning.entered} missing</span>
                      {/if}
                    {:else}
                      Status unavailable
                    {/if}
                  </td>
                  <td class="p-3 whitespace-nowrap">
                    {#if row.cleaning}
                      <div>SDV {row.cleaning.sdv}/{row.cleaning.total}</div>
                      <div>SDR {row.cleaning.sdr}/{row.cleaning.total}</div>
                    {:else if row.verifiedForms}
                      {row.verifiedForms} of {row.formCount} listed forms marked verified
                    {:else}
                      Status unavailable
                    {/if}
                  </td>
                  <td class="p-3">
                    {#if row.cleaning}
                      <div class="whitespace-nowrap">Safety: {row.cleaning.safetyOpen} open</div>
                      <div class="whitespace-nowrap">Vendor: {row.cleaning.vendorOpen} open</div>
                    {:else}
                      {#if row.hasSafetyDiscrepancy}
                        <span class="block font-semibold text-rose-700">SAE discrepancy</span>
                      {/if}
                      {#each row.vendorItems as form}
                        <span class="block text-amber-800">{form.status}</span>
                      {/each}
                      {#if !row.hasSafetyDiscrepancy && !row.vendorItems.length}
                        <span class="text-slate-500">Status unavailable</span>
                      {/if}
                    {/if}
                  </td>
                  <td class="p-3 whitespace-nowrap">{row.cleaning ? `${row.cleaning.codingOpen} pending` : 'Status unavailable'}</td>
                  <td class="p-3">{row.signoff?.status ?? (row.cleaning ? (row.cleaning.piSigned ? 'Signed' : 'Pending PI signature') : 'Status unavailable')}</td>
                  <td class="p-3 whitespace-nowrap">{row.cleaning ? (row.cleaning.frozen ? 'Frozen' : 'Not frozen') : 'Status unavailable'}</td>
                  <td class="p-3">
                    <button
                      type="button"
                      on:click={() => onSelectSubject(row.subject.id)}
                      class="inline-flex items-center whitespace-nowrap rounded-md border border-blue-200 bg-blue-50 px-2.5 py-1.5 font-semibold text-blue-700 hover:bg-blue-100 cursor-pointer"
                    >
                      Inspect eCRF <ChevronRight class="ml-0.5 size-3" />
                    </button>
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      {:else}
        <p class="rounded-lg bg-slate-50 p-4 text-sm text-slate-600">
          {siteSubjects.length ? 'No subjects match the current search and filter.' : 'No subject records are available for this site in the demo snapshot.'}
        </p>
      {/if}
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
