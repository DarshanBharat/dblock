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
  $: siteReadinessCategories = [
    {
      id: 'edc_cleaning',
      impact: null,
      label: 'EDC Data Entry & SDV',
      pct: site.id === '104' ? 84 : site.id === '405' ? 88 : 91,
      targetTab: 'subjects' as const,
      summary: 'Missing pages, SDV/SDR verification & completeness'
    },
    {
      id: 'query_resolution',
      impact: site.breakdown.ageingQueries,
      driver: 'Ageing queries',
      label: 'Query Resolution',
      pct: site.id === '104' ? 68 : site.id === '405' ? 82 : 74,
      targetTab: 'queries' as const,
      summary: `${siteQueries.length} open queries (${siteQueries.filter(q => q.isPrimaryEndpoint).length} endpoint-critical)`
    },
    {
      id: 'external_recon',
      impact: site.breakdown.labTransferDelay,
      driver: 'Laboratory transfer',
      label: 'External Vendor Reconciliation',
      pct: site.id === '104' ? 52 : 86,
      targetTab: 'lab' as const,
      summary: `${siteLabs.length} vendor batch(es) affecting site`
    },
    {
      id: 'medical_coding',
      impact: null,
      label: 'Medical Coding (MedDRA / WHODrug)',
      pct: site.id === '104' ? 88 : 92,
      targetTab: 'subjects' as const,
      summary: 'Automated dictionary coding & medical review'
    },
    {
      id: 'site_signoffs',
      impact: site.breakdown.signOffStatus,
      driver: 'PI sign-off',
      label: 'Investigator e-Signatures (21 CFR 11)',
      pct: site.id === '104' ? 83 : site.id === '405' ? 63 : 89,
      targetTab: 'subjects' as const,
      summary: 'PI electronic casebook signatures'
    },
    {
      id: 'safety_recon',
      impact: site.breakdown.safetyReconciliation,
      driver: 'Safety reconciliation',
      label: 'Safety Reconciliation (Rave vs Argus)',
      pct: site.id === '104' ? 55 : 100,
      targetTab: 'sae' as const,
      summary: `${siteSaes.length} unresolved SAE discrepancy case(s)`
    }
  ];

  let subjectSearch = '';
</script>

<div class="space-y-6">

  <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 db-card p-3.5">
    <div class="flex items-center space-x-2 text-xs flex-wrap">
      <button
        type="button"
        on:click={onBackToSites}
        class="inline-flex items-center text-blue-600 hover:text-blue-800 font-semibold cursor-pointer"
      >
        <ArrowLeft class="w-3.5 h-3.5 mr-1" />
        <span>Back to Sites &amp; Risks</span>
      </button>
      <span class="text-slate-300">/</span>
      <span class="text-slate-500 font-medium">CA-209-301</span>
      <span class="text-slate-300">/</span>
      <span class="text-slate-600 font-medium">{site.country} ({site.countryCode})</span>
      <span class="text-slate-300">/</span>
      <span class="font-bold text-slate-900">{site.code}: {site.name}</span>
    </div>

    <div class="flex items-center space-x-2 text-xs">
      <span class="font-mono bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md">
        {site.traceability.sourceSystem}
      </span>
      <span class="text-slate-400">&middot;</span>
      <span class="text-slate-600 font-medium">31 Oct 2026, 08:00 UTC</span>
    </div>
  </div>

  <div class="db-card p-6 space-y-5">
    <div class="flex flex-col lg:flex-row lg:items-start justify-between gap-5 pb-5 border-b border-slate-100">
      
      <div class="space-y-1.5 max-w-xl">
        <div class="flex items-center space-x-2">
          <span class="text-xs font-mono font-bold px-2 py-0.5 rounded-md bg-rose-600 text-white">
            {site.code}
          </span>
          <span class="text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 border border-rose-200/80">
            {site.riskLevel} Risk
          </span>
          <span class="text-xs text-slate-500">{site.city}, {site.country}</span>
        </div>

        <h1 class="text-xl font-bold text-slate-900 tracking-tight">
          {site.name}
        </h1>
      </div>

      <div class="grid grid-cols-3 gap-3 shrink-0">
        <div class="bg-slate-50/80 rounded-xl p-3 border border-slate-200/70 text-center">
          <div class="text-[10px] font-semibold text-slate-500 uppercase">Site Readiness</div>
          <div class="text-xl font-bold text-slate-900 num-tabular">{site.readinessScore}%</div>
        </div>

        <div class="bg-slate-50/80 rounded-xl p-3 border border-slate-200/70 text-center">
          <div class="text-[10px] font-semibold text-slate-500 uppercase">DBL Impact</div>
          <div class="text-xl font-bold text-rose-600 num-tabular">{site.forecastImpactDays}d</div>
        </div>

        <div class="bg-slate-50/80 rounded-xl p-3 border border-slate-200/70 text-center">
          <div class="text-[10px] font-semibold text-slate-500 uppercase">Enrolled</div>
          <div class="text-xl font-bold text-slate-900 num-tabular">{site.enrolledSubjects}</div>
          <div class="text-[10px] text-rose-600 font-semibold">{site.openItems} open items</div>
        </div>
      </div>

    </div>

    <section aria-labelledby="site-readiness-heading">
      <h2 id="site-readiness-heading" class="text-sm font-bold text-slate-900 mb-3">Site Readiness &amp; Critical-Path Drivers</h2>
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
        {#each siteReadinessCategories as cat}
          <button
            type="button"
            on:click={() => {
              activeSubTab = cat.targetTab;
              trackerFilter = cat.id === 'site_signoffs' ? 'signoff' : 'all';
            }}
            class="p-3.5 rounded-xl border border-slate-200/80 hover:border-blue-400 bg-slate-50/50 hover:bg-blue-50/30 text-left transition-all cursor-pointer"
          >
            <div class="flex items-center justify-between font-semibold text-slate-900">
              <span>{cat.label}</span>
              <span class="font-bold {cat.pct < 70 ? 'text-rose-600' : cat.pct < 85 ? 'text-amber-600' : 'text-emerald-700'}">{cat.pct}%</span>
            </div>
            <div class="w-full bg-slate-200/80 rounded-full h-1.5 my-2">
              <div class="h-full rounded-full {cat.pct < 70 ? 'bg-rose-500' : cat.pct < 85 ? 'bg-amber-500' : 'bg-emerald-500'}" style="width: {cat.pct}%"></div>
            </div>
            {#if cat.impact != null}
              <div class="mb-1 text-[11px] font-semibold text-amber-800">
                {cat.driver} &middot; {cat.impact}% share &middot; {(site.forecastImpactDays * cat.impact / 100).toFixed(1)}d
              </div>
            {/if}
            <div class="text-[11px] text-slate-500 flex items-center justify-between gap-2">
              <span>{cat.summary}</span>
              <span class="text-blue-600 font-semibold">Inspect &rarr;</span>
            </div>
          </button>
        {/each}
      </div>
    </section>
  </div>

  <div class="db-segmented inline-flex">
    <button
      type="button"
      on:click={() => { activeSubTab = 'subjects'; trackerFilter = 'all'; }}
      class="db-segmented-btn {activeSubTab === 'subjects' ? 'db-segmented-btn-active' : ''}"
    >
      Clean Patient Tracker ({siteSubjects.length})
    </button>
    <button
      type="button"
      on:click={() => activeSubTab = 'queries'}
      class="db-segmented-btn {activeSubTab === 'queries' ? 'db-segmented-btn-active' : ''}"
    >
      Open Queries ({siteQueries.length})
    </button>
    <button
      type="button"
      on:click={() => activeSubTab = 'sae'}
      class="db-segmented-btn {activeSubTab === 'sae' ? 'db-segmented-btn-active' : ''}"
    >
      SAE Discrepancies ({siteSaes.length})
    </button>
    <button
      type="button"
      on:click={() => activeSubTab = 'lab'}
      class="db-segmented-btn {activeSubTab === 'lab' ? 'db-segmented-btn-active' : ''}"
    >
      Vendor Transfers ({siteLabs.length})
    </button>
  </div>

  {#if activeSubTab === 'subjects'}
    <div class="db-card p-5 space-y-4">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 class="text-base font-bold text-slate-900">Subject Casebook Cleaning Status</h2>
          <p class="text-xs text-slate-500">{site.code} &middot; {siteSubjects.length} tracked subjects in 30 Nov Cut-Off</p>
        </div>

        <div class="flex flex-wrap items-center gap-2">
          <div class="relative">
            <Search class="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            <input
              type="search"
              aria-label="Search by subject ID or cohort"
              placeholder="Subject ID or cohort"
              bind:value={subjectSearch}
              class="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200/80 rounded-lg w-48"
            />
          </div>
          <select bind:value={trackerFilter} aria-label="Filter by cleaning task" class="rounded-lg border border-slate-200/80 bg-slate-50 py-1.5 px-2.5 text-xs">
            <option value="all">All cleaning tasks</option>
            <option value="open">Subjects with open work</option>
            <option value="clean">Clean subjects</option>
            <option value="unfrozen">Awaiting freeze</option>
            <option value="forms">Open eCRF items</option>
            <option value="endpoint">Endpoint-critical queries</option>
            <option value="queries">Any open query</option>
            <option value="signoff">Pending PI sign-off</option>
          </select>
        </div>
      </div>

      {#if filteredSiteSubjects.length}
        <div class="overflow-x-auto">
          <table class="min-w-full text-xs text-left divide-y divide-slate-200">
            <thead class="bg-slate-50/70 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
              <tr>
                <th scope="col" class="p-3">Subject &amp; Disposition</th>
                <th scope="col" class="p-3">Status</th>
                <th scope="col" class="p-3">Ball in Court</th>
                <th scope="col" class="p-3">Open Queries</th>
                <th scope="col" class="p-3">Entry / SDV</th>
                <th scope="col" class="p-3">Reconciliation</th>
                <th scope="col" class="p-3">PI Sign-Off</th>
                <th scope="col" class="p-3">Freeze</th>
                <th scope="col" class="p-3 text-right">eCRF</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 align-top">
              {#each filteredSiteSubjects as row (row.subject.id)}
                <tr class="hover:bg-slate-50/80">
                  <th scope="row" class="p-3 font-semibold text-slate-900">
                    {row.subject.id}
                    <span class="block font-normal text-slate-500 text-[11px]">{row.subject.disposition || row.subject.cohort}</span>
                    {#if row.subject.cutOffScope}
                      <span class="inline-block mt-0.5 px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px] font-medium">{row.subject.cutOffScope}</span>
                    {/if}
                  </th>
                  <td class="p-3">
                    <span class="inline-block rounded-md px-2 py-0.5 font-semibold text-[11px] {row.hasOpenWork ? 'bg-amber-50 text-amber-800' : row.isClean ? 'bg-emerald-50 text-emerald-800' : 'bg-slate-100 text-slate-700'}">
                      {row.hasOpenWork ? 'Open items' : row.isClean ? 'Clean' : 'Unverified'}
                    </span>
                  </td>
                  <td class="p-3 text-slate-700 font-medium">
                    {row.subject.ballInCourt || (row.hasOpenWork ? 'Site Coordinator' : 'Complete')}
                  </td>
                  <td class="p-3">
                    <span class="font-semibold whitespace-nowrap">{row.openQueries} open</span>
                    {#if row.endpointQueries}
                      <span class="block font-semibold text-rose-700 text-[11px]">{row.endpointQueries} endpoint-critical</span>
                    {/if}
                  </td>
                  <td class="p-3 whitespace-nowrap">
                    {#if row.cleaning}
                      <div>Entry {row.cleaning.entered}/{row.cleaning.total}</div>
                      <div class="text-slate-500">SDV {row.cleaning.sdv}/{row.cleaning.total}</div>
                    {:else}
                      <span class="text-slate-400">&mdash;</span>
                    {/if}
                  </td>
                  <td class="p-3">
                    {#if row.cleaning}
                      <div class="whitespace-nowrap">Safety: {row.cleaning.safetyOpen}</div>
                      <div class="whitespace-nowrap text-slate-500">Vendor: {row.cleaning.vendorOpen}</div>
                    {:else if row.hasSafetyDiscrepancy}
                      <span class="font-semibold text-rose-700">SAE discrepancy</span>
                    {:else}
                      <span class="text-slate-400">Clean</span>
                    {/if}
                  </td>
                  <td class="p-3">{row.signoff?.status ?? (row.cleaning ? (row.cleaning.piSigned ? 'Signed' : 'Pending PI') : '—')}</td>
                  <td class="p-3 whitespace-nowrap">{row.cleaning ? (row.cleaning.frozen ? 'Frozen' : 'Not frozen') : '—'}</td>
                  <td class="p-3 text-right">
                    <button
                      type="button"
                      on:click={() => onSelectSubject(row.subject.id)}
                      class="inline-flex items-center whitespace-nowrap rounded-lg bg-blue-50 px-2.5 py-1 font-semibold text-blue-700 hover:bg-blue-100 cursor-pointer"
                    >
                      Inspect <ChevronRight class="ml-0.5 size-3" />
                    </button>
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      {:else}
        <p class="rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
          No subjects match the current search and filter.
        </p>
      {/if}
    </div>

  {:else if activeSubTab === 'queries'}
    <div class="db-card p-5 space-y-4">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 class="text-sm font-bold text-slate-900">
            Outstanding Queries · {site.code} ({siteQueries.length})
          </h3>
        </div>

        <div class="db-segmented">
          <button
            type="button"
            on:click={() => queryFilter = 'all'}
            class="db-segmented-btn {queryFilter === 'all' ? 'db-segmented-btn-active' : ''}"
          >
            All ({siteQueries.length})
          </button>
          <button
            type="button"
            on:click={() => queryFilter = 'endpoint_critical'}
            class="db-segmented-btn {queryFilter === 'endpoint_critical' ? 'db-segmented-btn-active' : ''}"
          >
            Endpoint-Critical ({siteQueries.filter(q => q.isPrimaryEndpoint).length})
          </button>
          <button
            type="button"
            on:click={() => queryFilter = 'non_critical'}
            class="db-segmented-btn {queryFilter === 'non_critical' ? 'db-segmented-btn-active' : ''}"
          >
            Routine ({siteQueries.filter(q => !q.isPrimaryEndpoint).length})
          </button>
        </div>
      </div>

      <div class="overflow-x-auto">
        <table class="min-w-full text-xs text-left divide-y divide-slate-200">
          <thead class="bg-slate-50/70 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
            <tr>
              <th class="py-2.5 px-3">Query ID &amp; Subject</th>
              <th class="py-2.5 px-3">Domain &amp; Tier</th>
              <th class="py-2.5 px-3">Ball in Court</th>
              <th class="py-2.5 px-3">Form &amp; Field</th>
              <th class="py-2.5 px-3">Discrepancy</th>
              <th class="py-2.5 px-3 text-center">Age</th>
              <th class="py-2.5 px-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 font-medium">
            {#each filteredQueries as q}
              <tr class="hover:bg-slate-50/80 transition-colors">
                <td class="py-3 px-3">
                  <div class="font-bold text-slate-900 font-mono">{q.id}</div>
                  <div class="text-[11px] text-blue-600 font-semibold">{q.subjectId}</div>
                </td>
                <td class="py-3 px-3">
                  {#if q.domainCode}
                    <span class="font-mono text-[10px] font-semibold text-slate-600 mr-1">{q.domainCode}</span>
                  {/if}
                  {#if q.isPrimaryEndpoint}
                    <span class="px-2 py-0.5 rounded bg-rose-50 text-rose-700 text-[10px] font-semibold">
                      Endpoint-Critical
                    </span>
                  {:else}
                    <span class="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-medium">
                      Routine
                    </span>
                  {/if}
                </td>
                <td class="py-3 px-3 text-slate-700 font-semibold">{q.ballInCourt || 'Site Coordinator'}</td>
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
                    <span>Form</span>
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
