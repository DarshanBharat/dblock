<script lang="ts">

  import dblockData from './data/dblock_data.json';

  import Header from './components/Header.svelte';
  import { initialize, resetDemo } from './lib/workflow';

  import Navigation from './components/Navigation.svelte';

  import ExecutiveCommandCentre from './components/ExecutiveCommandCentre.svelte';

  import ReadinessDigitalTwin from './components/ReadinessDigitalTwin.svelte';

  import PredictiveRiskHeatmap from './components/PredictiveRiskHeatmap.svelte';

  import SiteDetailView from './components/SiteDetailView.svelte';

  import SubjectDetailView from './components/SubjectDetailView.svelte';

  import ActionWorkbench from './components/ActionWorkbench.svelte';

  import WhatIfSimulator from './components/WhatIfSimulator.svelte';

  import ForecastScenarios from './components/ForecastScenarios.svelte';



  // Active top-level tab

  let activeTab = 'command_centre';



  // Deep drill-down state

  let selectedSiteId: string | null = null;

  let selectedSubjectId: string | null = null;



  // Destructure data from JSON

  const {

    study,

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

    closedLoopOutcomes

  } = dblockData;



  initialize(actions);

  // Selected site object

  $: selectedSite = selectedSiteId ? sites.find(s => s.id === selectedSiteId) : null;



  // Selected subject object

  $: selectedSubject = selectedSubjectId ? subjects.find(s => s.id === selectedSubjectId) : null;



  function handleSelectTab(tab: string) {

    activeTab = tab;

    // Clear sub-drilldowns when switching major functional tabs (except when navigating into risk_matrix)

    if (tab !== 'risk_matrix') {

      selectedSiteId = null;

      selectedSubjectId = null;

    }

    window.scrollTo({ top: 0, behavior: 'smooth' });

  }



  function handleSelectSite(siteId: string) {

    activeTab = 'risk_matrix';

    selectedSiteId = siteId;

    selectedSubjectId = null;

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

</script>



<div class="min-h-screen bg-slate-50 text-slate-900 flex flex-col">

  <!-- Top App Header -->

  <Header {study} />



  <!-- Navigation Tabs -->

  <Navigation

    {activeTab}

    onSelectTab={handleSelectTab}

  />



  <!-- Main View Container -->

  <main class="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">

    

    {#if activeTab === 'command_centre'}

      <ExecutiveCommandCentre

        {study}
        {actions}
        {timelineSnapshots}
        onSelectTab={handleSelectTab}

        onSelectSite={handleSelectSite}

      />



    {:else if activeTab === 'digital_twin'}

      <ReadinessDigitalTwin

        {dimensions}

        {timelineSnapshots}

        onSelectTab={handleSelectTab}

        onSelectSite={handleSelectSite}

      />



    {:else if activeTab === 'risk_matrix'}

      {#if selectedSubject}

        <!-- Deep Level 3: Subject Drill-Down View -->

        <SubjectDetailView

          subject={selectedSubject}

          onBackToSite={handleBackToSite}

          onSelectTab={handleSelectTab}

        />

      {:else if selectedSite}

        <!-- Deep Level 2: Site Drill-Down Dedicated Page -->

        <SiteDetailView

          site={selectedSite}

          {subjects}

          {saeDiscrepancies}

          {queriesDetail}

          {labBatches}

          onBackToSites={handleBackToSites}

          onSelectSubject={handleSelectSubject}

          onSelectTab={handleSelectTab}

        />

      {:else}

        <!-- Level 1: Predictive Risk Matrix -->

        <PredictiveRiskHeatmap

          {sites}
          {subjects}
          {dimensions}

          onSelectSite={handleSelectSite}

        />

      {/if}



    {:else if activeTab === 'action_workbench'}

      <ActionWorkbench

        onSelectTab={handleSelectTab}

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


        onSelectTab={handleSelectTab}

      />

    {/if}



  </main>



  <footer class="app-footer"><div><button class="text-link" on:click={() => resetDemo(actions)}>Reset demo</button> · <strong>Demo workspace</strong> · All study data and forecasts are illustrative. Changes are stored only in this browser and do not update a clinical system.</div></footer>

</div>

