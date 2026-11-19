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
  import StudyOverviewV3 from './components/StudyOverviewV3.svelte';
  import ClinicalDomainDrilldownV3 from './components/ClinicalDomainDrilldownV3.svelte';
  import SitesCountriesV3 from './components/SitesCountriesV3.svelte';
  import SubjectsV3 from './components/SubjectsV3.svelte';
  import ActionsSimulationV3 from './components/ActionsSimulationV3.svelte';
  import PortfolioViewV3 from './components/PortfolioViewV3.svelte';
  import SiteInterventionV3 from './components/SiteInterventionV3.svelte';
  import AiAssistantCopilot from './components/AiAssistantCopilot.svelte';

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
    RotateCcw,
    Database
  } from '@lucide/svelte';

  // Active top-level tab
  let activeTab = 'portfolio';

  // Deep readiness category & domain drilldown state
  let selectedReadinessCategory: string | null = null;
  let openWeightConfigOnLoad = false;
  let selectedDomainId: string = 'edc';
  let selectedCountryFilter: string = 'all';

  // Modals / Copilot state
  let showDataHealth = false;
  let showCopilot = false;

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
        activeTab = 'clinical_domains';
        selectedDomainId = 'safety';
        return;
      }
      if ([
        'portfolio',
        'command_centre',
        'clinical_domains',
        'sites_countries',
        'subjects',
        'actions_sim',
        'risk_matrix',
        'digital_twin',
        'action_workbench',
        'simulator',
        'forecast_scenarios'
      ].includes(h)) {
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
    if (tab === 'risk_matrix' || tab === 'sites_countries') {
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

  function handleSelectDomain(domainId: string) {
    selectedDomainId = domainId;
    handleSelectTab('clinical_domains');
  }

  function handleSelectCountry(country: string) {
    selectedCountryFilter = country;
    selectedSiteId = null;
    handleSelectTab('sites_countries');
  }

  function handleSelectStudy(studyId: string) {
    currentStudyId = studyId;
    activeTab = 'command_centre';
    try { window.location.hash = 'command_centre'; } catch (e) {}
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function handleSelectSite(siteId: string) {
    activeTab = 'sites_countries';
    selectedSiteId = siteId;
    selectedSubjectId = null;
    try { window.location.hash = 'sites_countries'; } catch (e) {}
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
</script>

<div class="min-h-screen bg-[#f5f5f7] text-slate-900 flex flex-col font-sans selection:bg-blue-100 selection:text-blue-900">
  
  <!-- Unified Top Header Bar -->
  <Header {activeTab} onSelectTab={handleSelectTab} />

  <!-- Main View Container -->
  <main class="flex-1 max-w-[1440px] w-full mx-auto px-4 sm:px-6 py-6">
    
    {#if activeTab === 'portfolio'}
      <!-- Screen 1: Full Portfolio View -->
      <PortfolioViewV3
        onSelectStudy={handleSelectStudy}
      />
    {:else}
      <!-- Full-Width Operational Study Workspace -->
      <div class="space-y-4">

        <!-- Persistent Study Context & 5-Step Investigative Flow Bar -->
        <div class="bg-white rounded-xl border border-slate-200/80 px-4 py-2.5 shadow-2xs flex flex-wrap items-center justify-between gap-3 text-xs">
          <div class="flex flex-wrap items-center gap-1.5">
            <button type="button" on:click={() => handleSelectTab('portfolio')} class="text-slate-500 hover:text-blue-600 font-medium cursor-pointer">
              Portfolio
            </button>
            <span class="text-slate-300">/</span>
            <button type="button" on:click={() => handleSelectTab('command_centre')} class="font-bold text-slate-900 hover:text-blue-600 cursor-pointer">
              {currentStudyId}
            </button>
            {#if selectedSiteId && activeTab === 'sites_countries'}
              <span class="text-slate-300">/</span>
              <span class="font-semibold text-blue-700">Site {selectedSiteId}</span>
            {/if}
            <span class="hidden sm:inline-block ml-2 px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200 text-[11px] font-semibold">
              72% Ready (-8%) · P80 DBL 21 Dec (+6d)
            </span>
          </div>

          <div class="flex flex-wrap items-center gap-2">
            <nav class="flex flex-wrap items-center gap-1" aria-label="Study investigation flow">
              {#each [
                { id: 'command_centre', step: '1. Overview' },
                { id: 'clinical_domains', step: '2. Domains' },
                { id: 'sites_countries', step: '3. Sites' },
                { id: 'subjects', step: '4. Subjects' },
                { id: 'actions_sim', step: '5. Actions & Sim' },
              ] as flowStep, i}
                {#if i > 0}
                  <ArrowRight size={11} class="text-slate-300 hidden sm:inline" />
                {/if}
                <button
                  type="button"
                  on:click={() => handleSelectTab(flowStep.id)}
                  class="px-2.5 py-1 rounded-md font-semibold transition-colors cursor-pointer {activeTab === flowStep.id ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'}"
                >
                  {flowStep.step}
                </button>
              {/each}
            </nav>

            <div class="hidden md:flex items-center gap-1.5 pl-2 border-l border-slate-200">
              <button
                type="button"
                on:click={() => (showDataHealth = true)}
                class="inline-flex items-center gap-1 px-2 py-1 rounded-md border border-amber-200 bg-amber-50/80 text-amber-800 hover:bg-amber-100 font-semibold cursor-pointer"
                title="View EDC, Argus, LabCorp & eCOA connector health"
              >
                <Database size={11} /> Data Health
              </button>
              <button
                type="button"
                on:click={() => (showCopilot = !showCopilot)}
                class="inline-flex items-center gap-1 px-2 py-1 rounded-md border font-semibold cursor-pointer transition-colors {showCopilot ? 'bg-indigo-600 text-white border-indigo-600' : 'border-indigo-200 bg-indigo-50/70 text-indigo-700 hover:bg-indigo-100'}"
                title="Toggle AI DBLock Copilot"
              >
                <Sparkles size={11} /> AI Copilot
              </button>
            </div>
          </div>
        </div>

        {#if showCopilot}
          <AiAssistantCopilot
            {study}
            onSelectSite={handleSelectSite}
            onSelectTab={handleSelectTab}
          />
        {/if}

        <!-- ================================================================= -->
        <!-- STUDY MAIN CONTENT VIEW (Full Width)                              -->
        <!-- ================================================================= -->
        <div class="min-w-0 w-full">
          
          {#if activeTab === 'command_centre'}
            <StudyOverviewV3
              onSelectTab={handleSelectTab}
              onSelectDomain={handleSelectDomain}
              onSelectCountry={handleSelectCountry}
            />

          {:else if activeTab === 'clinical_domains'}
            <ClinicalDomainDrilldownV3
              bind:selectedDomainId
              onSelectTab={handleSelectTab}
              onSelectSite={handleSelectSite}
            />

          {:else if activeTab === 'sites_countries'}
            {#if selectedSiteId}
              <SiteInterventionV3
                siteId={selectedSiteId}
                onBackToSites={handleBackToSites}
                onSelectTab={handleSelectTab}
              />
            {:else}
              <SitesCountriesV3
                bind:countryFilter={selectedCountryFilter}
                onSelectTab={handleSelectTab}
                onSelectSite={handleSelectSite}
              />
            {/if}

          {:else if activeTab === 'subjects'}
            <SubjectsV3
              onSelectTab={handleSelectTab}
            />

          {:else if activeTab === 'actions_sim'}
            <ActionsSimulationV3
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
              onSelectTab={handleSelectTab}
              onSelectSite={handleSelectSite}
            />

          {:else if activeTab === 'action_workbench'}
            <ActionWorkbench
              {sites}
              onSelectTab={handleSelectTab}
              onSelectSite={handleSelectSite}
            />

          {:else if activeTab === 'simulator'}
            <WhatIfSimulator
              {interventions}
              {study}
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
