<script lang="ts">
  import { onMount, tick } from 'svelte';
  import dblockData from './data/dblock_data.json';
  import { demoSubjects, demoQueries, additionalSnapshotQueries, supplementSnapshotSubject } from './data/cleanPatientDemo';
  import Header from './components/Header.svelte';
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
  import SubjectDetailV3 from './components/SubjectDetailV3.svelte';
  import DomainTargetSettingsModal from './components/DomainTargetSettingsModal.svelte';

  import { initialize } from './lib/workflow';

  // Active top-level tab
  let activeTab = 'portfolio';
  let showTargetSettings = false;

  // Deep readiness category & domain drilldown state
  let selectedReadinessCategory: string | null = null;
  let openWeightConfigOnLoad = false;
  let selectedDomainId: string = 'edc';
  let selectedCountryFilter: string = 'all';

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
    if (tab === 'risk_matrix' || tab === 'sites_countries' || tab === 'subjects' || tab === 'clinical_domains' || tab === 'actions_sim' || tab === 'command_centre' || tab === 'portfolio') {
      if (tab !== 'subjects' && tab !== 'clinical_domains') selectedSiteId = null;
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
  <Header {activeTab} onSelectTab={handleSelectTab} onOpenTargetSettings={() => (showTargetSettings = true)} />

  <!-- Main View Container -->
  <main class="flex-1 max-w-[1440px] w-full mx-auto px-4 sm:px-6 py-2">
    
    {#if activeTab === 'portfolio'}
      <!-- Screen 1: Full Portfolio View -->
      <PortfolioViewV3
        onSelectStudy={handleSelectStudy}
      />
    {:else}
      <!-- Full-Width Operational Study Workspace -->
      <div class="min-w-0 w-full">
          
          {#if activeTab === 'command_centre'}
            <StudyOverviewV3
              onSelectTab={handleSelectTab}
              onSelectDomain={handleSelectDomain}
              onSelectCountry={handleSelectCountry}
              onSelectSite={handleSelectSite}
            />

          {:else if activeTab === 'clinical_domains'}
            {#if selectedSubjectId}
              <SubjectDetailV3
                subjectId={selectedSubjectId}
                onBack={() => (selectedSubjectId = null)}
                onSelectSubject={handleSelectSubject}
                onSelectSite={handleSelectSite}
                onSelectDomain={handleSelectDomain}
                onSelectTab={handleSelectTab}
              />
            {:else}
              <ClinicalDomainDrilldownV3
                bind:selectedDomainId
                onSelectTab={handleSelectTab}
                onSelectSite={handleSelectSite}
                onSelectSubject={handleSelectSubject}
              />
            {/if}

          {:else if activeTab === 'sites_countries'}
            {#if selectedSubjectId}
              <SubjectDetailV3
                subjectId={selectedSubjectId}
                onBack={() => (selectedSubjectId = null)}
                onSelectSubject={handleSelectSubject}
                onSelectSite={handleSelectSite}
                onSelectDomain={handleSelectDomain}
                onSelectTab={handleSelectTab}
              />
            {:else if selectedSiteId}
              <SiteInterventionV3
                siteId={selectedSiteId}
                onBackToSites={handleBackToSites}
                onSelectTab={handleSelectTab}
                onSelectSubject={handleSelectSubject}
              />
            {:else}
              <SitesCountriesV3
                bind:countryFilter={selectedCountryFilter}
                onSelectTab={handleSelectTab}
                onSelectSite={handleSelectSite}
              />
            {/if}

          {:else if activeTab === 'subjects'}
            {#if selectedSubjectId}
              <SubjectDetailV3
                subjectId={selectedSubjectId}
                onBack={() => (selectedSubjectId = null)}
                onSelectSubject={handleSelectSubject}
                onSelectSite={handleSelectSite}
                onSelectDomain={handleSelectDomain}
                onSelectTab={handleSelectTab}
              />
            {:else}
              <SubjectsV3
                onSelectTab={handleSelectTab}
                onSelectSubject={handleSelectSubject}
              />
            {/if}

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
    {/if}

  </main>

  <DomainTargetSettingsModal bind:open={showTargetSettings} />

</div>
