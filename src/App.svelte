<script lang="ts">
  import { onMount } from 'svelte';
  import dblockData from './data/dblock_data.json';
  import { demoSubjects, demoQueries, additionalSnapshotQueries, supplementSnapshotSubject } from './data/cleanPatientDemo';
  import Header from './components/Header.svelte';
  import TrustCentreModal from './components/TrustCentreModal.svelte';
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
    ChevronDown,
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
  let showTrustCentre = false;
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
    dataHealth,
    governance
  } = dblockData as any;

  const trackerSubjects = [...subjects.map(supplementSnapshotSubject), ...demoSubjects];
  const trackerQueries = [...queriesDetail, ...additionalSnapshotQueries, ...demoQueries];

  // Initialize live workflow store
  initialize(actions);

  // Selected site & subject objects for deep drill-down
  let selectedSiteId: string | null = null;
  let selectedSubjectId: string | null = null;

  onMount(() => {
    function applyHash() {
      const h = window.location.hash.replace('#', '');
      if (['portfolio', 'command_centre', 'risk_matrix', 'digital_twin', 'action_workbench', 'simulator', 'forecast_scenarios'].includes(h)) {
        activeTab = h;
      }
    }
    applyHash();
    window.addEventListener('hashchange', applyHash);
    return () => window.removeEventListener('hashchange', applyHash);
  });

  function handleSelectTab(tab: string, readinessCategory?: string, showWeightConfig?: boolean) {
    activeTab = tab;
    if (readinessCategory !== undefined) {
      selectedReadinessCategory = readinessCategory;
    }
    if (showWeightConfig !== undefined) {
      openWeightConfigOnLoad = showWeightConfig;
    }
    try { window.location.hash = tab; } catch (e) {}
    if (tab === 'risk_matrix') {
      selectedSiteId = null;
      selectedSubjectId = null;
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
      step: 1,
      id: 'lslv',
      name: 'LSLV Cut-Off',
      date: '30 Nov',
      status: 'on_track',
      metric: '220/220 Enrolled',
      roleFilter: 'all' as const
    },
    {
      step: 2,
      id: 'vendor_lock',
      name: 'Vendor Transfer Lock',
      date: '05 Dec',
      status: 'blocked',
      metric: '1 Batch Blocked (#LXB-8921)',
      roleFilter: 'vendor' as const
    },
    {
      step: 3,
      id: 'safety_freeze',
      name: 'Safety / SAE Freeze',
      date: '08 Dec',
      status: 'blocked',
      metric: '2 SAE Discordances',
      roleFilter: 'safety' as const
    },
    {
      step: 4,
      id: 'coding_query_lock',
      name: 'Coding & Query Lock',
      date: '11 Dec',
      status: 'at_risk',
      metric: '14 Crit Queries · 12 Terms',
      roleFilter: 'cdm' as const
    },
    {
      step: 5,
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
    {study}
    {activeTab}
    onSelectTab={handleSelectTab}
    onOpenTrustCentre={() => showTrustCentre = true}
    onOpenDataHealth={() => showDataHealth = true}
    onResetDemo={() => resetDemo(actions)}
  />

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
        <!-- STUDY CONTEXT + 5-STEP HARD GATE SEQUENCE + WORKSTREAM FILTER     -->
        <!-- ================================================================= -->
        <div class="db-card p-4 sm:px-5 sm:py-4 flex flex-col gap-3.5">
          
          <!-- Row 1: Study Switcher + 5-Step Sequential Hard Gate Pipeline -->
          <div class="flex flex-col xl:flex-row xl:items-center justify-between gap-3 border-b border-slate-100 pb-3.5">
            <div class="flex items-center gap-3 shrink-0">
              <button
                type="button"
                on:click={() => handleSelectTab('portfolio')}
                class="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100/90 hover:bg-slate-200/70 text-xs font-semibold text-slate-900 transition-colors cursor-pointer"
                title="Switch study in Portfolio"
              >
                <span class="font-mono font-bold text-slate-900">{study.protocol}</span>
                <span class="text-slate-400">&middot;</span>
                <span class="text-slate-600">{study.id}</span>
                <ChevronDown size={13} class="text-slate-400" />
              </button>
              <div class="hidden sm:flex items-center gap-2 text-xs text-slate-500">
                <span>{study.therapeuticArea} &middot; Phase III</span>
                <span class="text-slate-300">|</span>
                <span class="num-tabular">30 Nov Cut-Off</span>
              </div>
            </div>

            <!-- 5-Step Hard Gate Sequence Strip (Item C) -->
            <div class="grid grid-cols-2 sm:grid-cols-5 gap-1.5 flex-1 max-w-4xl">
              {#each hardGates as gate}
                <button
                  type="button"
                  on:click={() => activeRole = activeRole === gate.roleFilter && gate.roleFilter !== 'all' ? 'all' : gate.roleFilter}
                  class="group text-left px-2.5 py-1.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between {activeRole === gate.roleFilter && gate.roleFilter !== 'all' ? 'bg-slate-900 text-white border-slate-900 shadow-xs' : 'bg-slate-50/70 hover:bg-slate-100/80 border-slate-200/70 text-slate-800'}"
                  title="Filter workspace to {gate.name}"
                >
                  <div class="flex items-center justify-between gap-1 w-full">
                    <span class="text-[10px] font-semibold tracking-tight flex items-center gap-1.5 {activeRole === gate.roleFilter && gate.roleFilter !== 'all' ? 'text-slate-300' : 'text-slate-500'}">
                      <span class="w-1.5 h-1.5 rounded-full shrink-0 {gate.status === 'on_track' ? 'bg-emerald-500' : gate.status === 'at_risk' ? 'bg-amber-500' : 'bg-rose-500'}"></span>
                      <span class="truncate">{gate.step}. {gate.name}</span>
                    </span>
                    <span class="text-[10px] font-mono font-semibold num-tabular shrink-0 {activeRole === gate.roleFilter && gate.roleFilter !== 'all' ? 'text-white' : 'text-slate-700'}">{gate.date}</span>
                  </div>
                  <div class="text-[11px] font-medium truncate mt-0.5 num-tabular {activeRole === gate.roleFilter && gate.roleFilter !== 'all' ? 'text-slate-200' : gate.status === 'on_track' ? 'text-emerald-700' : gate.status === 'at_risk' ? 'text-amber-700' : 'text-rose-600'}">
                    {gate.metric}
                  </div>
                </button>
              {/each}
            </div>
          </div>

          <!-- Row 2: Role / Workstream Segmented Filter Pills (#2) -->
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div class="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              <span class="text-[11px] font-medium text-slate-400 mr-1 shrink-0">
                Queue:
              </span>
              <div class="db-segmented">
                {#each roleQueues as rq}
                  <button
                    type="button"
                    on:click={() => activeRole = rq.id}
                    class="db-segmented-btn flex items-center gap-1.5 {activeRole === rq.id ? 'active' : ''}"
                  >
                    <span>{rq.label}</span>
                    <span class="text-[10px] num-tabular {activeRole === rq.id ? 'text-blue-600 font-bold' : 'text-slate-400'}">
                      {rq.count}
                    </span>
                  </button>
                {/each}
              </div>
            </div>

            {#if activeRole !== 'all'}
              <div class="flex items-center justify-between sm:justify-end gap-2 text-xs text-slate-700 bg-slate-100/80 px-3 py-1 rounded-lg shrink-0">
                <span>{activeRoleObj.desc}</span>
                <button
                  type="button"
                  on:click={() => activeRole = 'all'}
                  class="text-[11px] font-semibold text-blue-600 hover:text-blue-800 cursor-pointer ml-1.5"
                >
                  Clear
                </button>
              </div>
            {:else}
              <div class="hidden lg:flex items-center gap-2 text-xs text-slate-500 shrink-0">
                <span>Clean Patient Tracker: <strong class="text-slate-800 num-tabular">158 / 220 (71.8%)</strong></span>
                <span class="text-slate-300">&middot;</span>
                <span>Target DBL: <strong class="text-slate-800 num-tabular">15 Dec 2026</strong></span>
                <span class="text-slate-300">&middot;</span>
                <span class="text-rose-600 font-semibold num-tabular">Forecast: 21 Dec (+6d)</span>
              </div>
            {/if}
          </div>

        </div>

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
          on:click={() => showTrustCentre = true}
          class="hover:underline font-medium text-slate-600"
        >
          Trust Centre: How DBLock AI reached this recommendation
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

  <!-- Trust Centre Modal -->
  <TrustCentreModal
    show={showTrustCentre}
    onClose={() => showTrustCentre = false}
    {governance}
  />

  <!-- Data Health Modal -->
  <DataHealthModal
    show={showDataHealth}
    onClose={() => showDataHealth = false}
    {dataHealth}
  />

</div>
