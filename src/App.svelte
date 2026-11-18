<script lang="ts">
  import { onMount, tick } from 'svelte';
  import dblockData from './data/dblock_data.json';
  import { demoSubjects, demoQueries, additionalSnapshotQueries, supplementSnapshotSubject } from './data/cleanPatientDemo';
  import Header from './components/Header.svelte';
  import DataHealthModal from './components/DataHealthModal.svelte';
  import PortfolioView from './components/PortfolioView.svelte';
  import ExecutiveCommandCentre from './components/ExecutiveCommandCentre.svelte';
  import ReadinessDigitalTwin from './components/ReadinessDigitalTwin.svelte';
  import PredictiveRiskHeatmap from './components/PredictiveRiskHeatmap.svelte';
  import SiteDetailView from './components/SiteDetailView.svelte';
  import SubjectDetailView from './components/SubjectDetailView.svelte';
  import ActionWorkbench from './components/ActionWorkbench.svelte';
  import WhatIfSimulator from './components/WhatIfSimulator.svelte';
  import ForecastScenarios from './components/ForecastScenarios.svelte';

  import { workflow, initialize, resetDemo } from './lib/workflow';
  import {
    LayoutDashboard,
    MapPin,
    CheckSquare,
    CheckCircle2,
    Sliders,
    TrendingUp,
    Sparkles,
    ArrowRight,
    RotateCcw
  } from '@lucide/svelte';

  // Active top-level tab: 'portfolio' | 'command_centre' | 'risk_matrix' | 'digital_twin' | 'action_workbench' | 'simulator' | 'forecast_scenarios'
  // Screen 1 (Study Portfolio and Selection) is the entry point before opening Study CA-209-301
  let activeTab = 'portfolio';

  // Deep readiness category & weightage config state
  let selectedReadinessCategory: string | null = null;
  let openWeightConfigOnLoad = false;

  // Modals state
  let showDataHealth = false;

  // Selected Study ID (default: CA-209-301)
  let currentStudyId = 'CA-209-301';

  // Destructure data from JSON
  const {
    study,
    portfolioStudies,
    dimensions,
    timelineSnapshots,
    sites,
    subjects,
    saeDiscrepancies,
    labBatches,
    queriesDetail,
    actions,
    interventions,
    forecastScenarios,
    closedLoopOutcomes,
    dataHealth
  } = dblockData as any;

  const trackerSubjects = [...subjects.map(supplementSnapshotSubject), ...demoSubjects];
  const trackerQueries = [...queriesDetail, ...additionalSnapshotQueries, ...demoQueries];

  // Initialize live workflow store
  initialize(actions);

  // Selected site & subject objects for deep drill-down
  let selectedSiteId: string | null = null;
  let selectedSubjectId: string | null = null;

  onMount(() => {
    async function applyHash() {
      const h = window.location.hash.replace('#', '');
      if (h === 'sae-reconciliation') {
        activeTab = 'digital_twin';
        selectedReadinessCategory = 'safety_recon';
        openWeightConfigOnLoad = false;
        await tick();
        if (window.location.hash === '#sae-reconciliation') focusReadinessDetails('safety_recon');
        return;
      }
      if (['portfolio', 'command_centre', 'risk_matrix', 'digital_twin', 'action_workbench', 'simulator', 'forecast_scenarios'].includes(h)) {
        activeTab = h;
      }
    }
    applyHash();
    window.addEventListener('hashchange', applyHash);
    return () => window.removeEventListener('hashchange', applyHash);
  });

  function focusReadinessDetails(category: string) {
    const details = document.getElementById(category === 'safety_recon' ? 'sae-reconciliation-queue' : 'readiness-score-details');
    details?.focus({ preventScroll: true });
    details?.scrollIntoView({ block: 'start' });
  }

  async function handleSelectTab(tab: string, readinessCategory?: string, showWeightConfig?: boolean) {
    activeTab = tab;
    if (tab === 'digital_twin') {
      selectedReadinessCategory = readinessCategory ?? null;
      openWeightConfigOnLoad = showWeightConfig ?? false;
    }
    try { window.location.hash = tab; } catch (e) {}
    if (tab === 'risk_matrix') {
      selectedSiteId = null;
      selectedSubjectId = null;
    }
    if (tab === 'digital_twin' && readinessCategory && !showWeightConfig) {
      await tick();
      if (activeTab !== 'digital_twin' || selectedReadinessCategory !== readinessCategory) return;
      focusReadinessDetails(readinessCategory);
      return;
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function handleSelectStudy(studyId: string) {
    currentStudyId = studyId;
    activeTab = 'command_centre';
    try { window.location.hash = 'command_centre'; } catch (e) {}
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function handleSelectSite(siteId: string) {
    activeTab = 'risk_matrix';
    selectedSiteId = siteId;
    selectedSubjectId = null;
    try { window.location.hash = 'risk_matrix'; } catch (e) {}
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function handleBackToSites() {
    selectedSiteId = null;
    selectedSubjectId = null;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function handleSelectSubject(subjectId: string) {
    selectedSubjectId = subjectId;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function handleBackToSite() {
    selectedSubjectId = null;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // Reactive selection helpers
  $: currentSubject = selectedSubjectId ? trackerSubjects.find((s: any) => s.id === selectedSubjectId) : null;
  $: currentSite = selectedSiteId ? sites.find((s: any) => s.id === selectedSiteId) : null;

  // 5-Step Pre-DBL Hard Gate Sequence (Item C)
  const hardGates = [
    {
      id: 'lslv',
      name: 'LSLV Cut-Off',
      date: '30 Nov',
      status: 'on_track',
      metric: '220/220 Enrolled',
      roleFilter: 'all' as const
    },
    {
      id: 'vendor_lock',
      name: 'Vendor Transfer Lock',
      date: '05 Dec',
      status: 'blocked',
      metric: '1 Batch Blocked (#LXB-8921)',
      roleFilter: 'vendor' as const
    },
    {
      id: 'safety_freeze',
      name: 'Safety / SAE Freeze',
      date: '08 Dec',
      status: 'blocked',
      metric: '2 SAE Discordances',
      roleFilter: 'safety' as const
    },
    {
      id: 'coding_query_lock',
      name: 'Coding & Query Lock',
      date: '11 Dec',
      status: 'at_risk',
      metric: '14 Crit Queries · 12 Terms',
      roleFilter: 'cdm' as const
    },
    {
      id: 'pi_sign_dbl',
      name: 'PI e-Sign & Hard DBL',
      date: '15 Dec',
      status: 'delayed',
      metric: '18 Unsigned · Forecast 21 Dec (+6d)',
      roleFilter: 'cra_site' as const
    }
  ];

  // Role / Workstream operational filter (#2)
  let activeRole: 'all' | 'my_queue' | 'cra_site' | 'cdm' | 'safety' | 'vendor' = 'all';

  const roleQueues = [
    { id: 'all', label: 'All Workstreams', count: 8, desc: 'Full study view across all 6 data domains' },
    { id: 'my_queue', label: 'My Queue (Sarah)', count: 4, desc: 'Critical path decisions awaiting Study Data Lead sign-off' },
    { id: 'cra_site', label: 'CRA / Site Ops', count: 3, desc: 'SDV backlog, eCRF entry & 18 pending PI signatures (8 Site 104, 6 Site 405, 4 Site 317)' },
    { id: 'cdm', label: 'CDM & Coding', count: 3, desc: '14 critical RECIST queries >14d & 12 uncoded MedDRA 27.0 / WHODrug C3 terms' },
    { id: 'safety', label: 'Safety / PV', count: 2, desc: '2 Rave-vs-Argus SAE discrepancies at Site 104 blocking 08 Dec safety freeze' },
    { id: 'vendor', label: 'External Vendors', count: 2, desc: 'LabCorp ctDNA #LXB-8921 SHA-256 failure & Eurofins chemistry QA batch' }
  ] as const;

  $: activeRoleObj = roleQueues.find(r => r.id === activeRole) || roleQueues[0];
</script>

<div class="min-h-screen bg-[#f5f5f7] text-slate-900 flex flex-col font-sans selection:bg-blue-100 selection:text-blue-900">
  
  <!-- Unified Top Header Bar -->
  <Header
    {activeTab}
    workspaceLabel={activeRole === 'all' ? 'Workspace' : activeRoleObj.label}
    onSelectTab={handleSelectTab}
  >
    <div slot="workspace" class="p-4 sm:p-5">
      <div class="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <h2 id="study-workspace-heading" class="text-sm font-semibold text-slate-900">Study workspace</h2>
          <p class="mt-1 text-xs text-slate-600">
            {study.protocol} · {study.id} · {study.therapeuticArea} · Phase III
          </p>
        </div>
        <button
          type="button"
          popovertarget="study-workspace"
          popovertargetaction="hide"
          on:click={() => handleSelectTab('portfolio')}
          class="rounded-lg bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-200 cursor-pointer"
        >
          Switch study
        </button>
      </div>

      <div class="pt-4">
        <h3 id="workstreams-heading" class="text-xs font-semibold text-slate-900">Workstreams</h3>
        <div class="mt-2 grid grid-cols-2 gap-2" role="group" aria-labelledby="workstreams-heading">
          {#each roleQueues as queue (queue.id)}
            <button
              type="button"
              popovertarget="study-workspace"
              popovertargetaction="hide"
              aria-pressed={activeRole === queue.id}
              on:click={() => activeRole = queue.id}
              class="flex min-h-10 items-center justify-between gap-2 rounded-lg border px-2.5 py-2 text-left text-xs font-medium transition-colors cursor-pointer {activeRole === queue.id ? 'border-blue-200 bg-blue-50 text-blue-800' : 'border-slate-200 text-slate-700 hover:bg-slate-50'}"
            >
              <span>{queue.label}</span>
              <span class="num-tabular">{queue.count}</span>
            </button>
          {/each}
        </div>
        <p class="mt-2 text-xs text-slate-600">{activeRoleObj.desc}</p>
      </div>

      <div class="mt-4 border-t border-slate-100 pt-4">
        <h3 class="text-xs font-semibold text-slate-900">Database lock milestones</h3>
        <ul class="mt-2 divide-y divide-slate-100">
          {#each hardGates as gate (gate.id)}
            <li>
              <button
                type="button"
                popovertarget="study-workspace"
                popovertargetaction="hide"
                aria-pressed={activeRole === gate.roleFilter && gate.roleFilter !== 'all'}
                aria-label={`${gate.name}, ${gate.date}. ${gate.metric}`}
                on:click={() => activeRole = activeRole === gate.roleFilter ? 'all' : gate.roleFilter}
                class="grid w-full grid-cols-[1fr_auto] gap-x-2 gap-y-0.5 rounded-lg px-2 py-2 text-left text-xs hover:bg-slate-50 cursor-pointer"
              >
                <span class="font-medium text-slate-900">{gate.name}</span>
                <span class="num-tabular text-slate-500">{gate.date}</span>
                <span class="col-span-2 {gate.status === 'on_track' ? 'text-emerald-700' : gate.status === 'at_risk' ? 'text-amber-700' : 'text-rose-700'}">
                  {gate.metric}
                </span>
              </button>
            </li>
          {/each}
        </ul>
      </div>
      <dl class="mt-3 flex flex-wrap gap-x-4 gap-y-2 border-t border-slate-100 pt-3 text-xs">
        <div><dt class="text-slate-500">Clean patients</dt><dd class="font-semibold text-slate-900 num-tabular">158 / 220 (71.8%)</dd></div>
        <div><dt class="text-slate-500">Target DBL</dt><dd class="font-semibold text-slate-900 num-tabular">15 Dec 2026</dd></div>
        <div><dt class="text-slate-500">Forecast DBL</dt><dd class="font-semibold text-rose-700 num-tabular">21 Dec (+6d)</dd></div>
      </dl>
    </div>
  </Header>

  <!-- Main View Container -->
  <main class="flex-1 max-w-[1440px] w-full mx-auto px-4 sm:px-6 py-6">
    
    {#if activeTab === 'portfolio'}
      <!-- Screen 1: Full Portfolio View -->
      <PortfolioView
        {portfolioStudies}
        {sites}
        {subjects}
        {saeDiscrepancies}
        {labBatches}
        {queriesDetail}
        onSelectStudy={handleSelectStudy}
        onSelectSite={handleSelectSite}
      />
    {:else}
      <!-- Full-Width Operational Study Workspace -->
      <div class="space-y-5">

        <!-- ================================================================= -->
        <!-- UNIFIED FORECAST & SIMULATION MODE SWITCHER (#5)                  -->
        <!-- ================================================================= -->
        {#if activeTab === 'simulator' || activeTab === 'forecast_scenarios'}
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 db-card px-5 py-3">
            <div class="flex items-center gap-2.5 text-xs text-slate-600">
              <Sliders size={15} class="text-slate-700" />
              <span class="font-semibold text-slate-900 text-sm">Forecast &amp; Simulation</span>
              <span class="hidden md:inline text-slate-400">&middot;</span>
              <span class="hidden md:inline text-slate-500">Model operational interventions or compare trajectory confidence intervals</span>
            </div>
            <div class="db-segmented self-start sm:self-auto">
              <button
                type="button"
                on:click={() => handleSelectTab('simulator')}
                class="db-segmented-btn flex items-center gap-1.5 {activeTab === 'simulator' ? 'active' : ''}"
              >
                <Sliders size={13} />
                <span>Intervention Simulator</span>
              </button>
              <button
                type="button"
                on:click={() => handleSelectTab('forecast_scenarios')}
                class="db-segmented-btn flex items-center gap-1.5 {activeTab === 'forecast_scenarios' ? 'active' : ''}"
              >
                <TrendingUp size={13} />
                <span>Trajectory Scenarios</span>
              </button>
            </div>
          </div>
        {/if}

        <!-- ================================================================= -->
        <!-- STUDY MAIN CONTENT VIEW (Full Width)                              -->
        <!-- ================================================================= -->
        <div class="min-w-0 w-full">
          
          {#if activeTab === 'command_centre'}
            <ExecutiveCommandCentre
              {study}
              {actions}
              {timelineSnapshots}
              {sites}
              {subjects}
              {saeDiscrepancies}
              {labBatches}
              {queriesDetail}
              {activeRole}
              onSelectTab={handleSelectTab}
              onSelectSite={handleSelectSite}
            />

          {:else if activeTab === 'risk_matrix'}
            {#if currentSubject}
              <SubjectDetailView
                subject={currentSubject}
                queries={trackerQueries.filter(query => query.subjectId === currentSubject.id)}
                onBackToSite={handleBackToSite}
                onSelectTab={handleSelectTab}
              />
            {:else if currentSite}
              <SiteDetailView
                site={currentSite}
                subjects={trackerSubjects}
                {saeDiscrepancies}
                queriesDetail={trackerQueries}
                {labBatches}
                onBackToSites={handleBackToSites}
                onSelectSubject={handleSelectSubject}
                onSelectTab={handleSelectTab}
              />
            {:else}
              <PredictiveRiskHeatmap
                {sites}
                {subjects}
                {dimensions}
                {saeDiscrepancies}
                {labBatches}
                {queriesDetail}
                {activeRole}
                onSelectSite={handleSelectSite}
                onSelectSubject={(subjId, siteId) => {
                  selectedSiteId = siteId;
                  selectedSubjectId = subjId;
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                onSelectTab={handleSelectTab}
              />
            {/if}

          {:else if activeTab === 'digital_twin'}
            <ReadinessDigitalTwin
              {study}
              {dimensions}
              {timelineSnapshots}
              {sites}
              {subjects}
              {saeDiscrepancies}
              {labBatches}
              {queriesDetail}
              {selectedReadinessCategory}
              {openWeightConfigOnLoad}
              {activeRole}
              onSelectTab={handleSelectTab}
              onSelectSite={handleSelectSite}
            />

          {:else if activeTab === 'action_workbench'}
            <ActionWorkbench
              {sites}
              {activeRole}
              onSelectTab={handleSelectTab}
              onSelectSite={handleSelectSite}
            />

          {:else if activeTab === 'simulator'}
            <WhatIfSimulator
              {interventions}
              {study}
              {activeRole}
              onSelectTab={handleSelectTab}
            />

          {:else if activeTab === 'forecast_scenarios'}
            <ForecastScenarios
              {study}
              {forecastScenarios}
              {closedLoopOutcomes}
              onSelectTab={handleSelectTab}
            />
          {/if}

        </div>

      </div>
    {/if}

  </main>

  <!-- App Global Footer -->
  <footer class="bg-white border-t border-slate-200 mt-12 py-5 px-4 sm:px-6 text-xs text-slate-500">
    <div class="max-w-[1440px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
      <div class="flex items-center space-x-3">
        <button
          class="text-blue-600 hover:text-blue-800 font-semibold cursor-pointer flex items-center space-x-1"
          on:click={() => resetDemo(actions)}
        >
          <RotateCcw size={12} />
          <span>Reset demo state</span>
        </button>
        <span>&middot;</span>
        <button
          on:click={() => showDataHealth = true}
          class="hover:underline font-medium text-slate-600"
        >
          Integration Health Check
        </button>
      </div>

      <div class="text-slate-400 text-[11px] text-center sm:text-right">
        DBLock AI &middot; Clinical Data Science Workbench &middot; 21 CFR Part 11 Electronic Records Compliant
      </div>
    </div>
  </footer>

  <!-- Data Health Modal -->
  <DataHealthModal
    show={showDataHealth}
    onClose={() => showDataHealth = false}
    {dataHealth}
  />

</div>
