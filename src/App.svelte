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

  // Study left nav links
  const studyNavLinks = [
    { id: 'command_centre', label: 'Overview', icon: LayoutDashboard },
    { id: 'risk_matrix', label: 'Sites & Risks', icon: MapPin },
    { id: 'digital_twin', label: 'Readiness', icon: CheckSquare },
    { id: 'action_workbench', label: 'Actions', icon: CheckCircle2 },
    { id: 'simulator', label: 'Scenarios', icon: Sliders },
    { id: 'forecast_scenarios', label: 'Forecast', icon: TrendingUp }
  ];

  function getAiInsightText(tab: string) {
    switch (tab) {
      case 'command_centre':
        return {
          text: 'Your study is 72% ready for DBL (158/220 clean subjects). Focusing on 3 critical actions could bring Potential DBL 4–6 days closer to the 15 Dec target.',
          actionLabel: 'View recommended actions',
          targetTab: 'action_workbench'
        };
      case 'risk_matrix':
        return {
          text: 'Site 104 has fewer open items (19) than Site 208 (41), but a greater potential DBL impact (5–7d) due to SAE reconciliation (35%) and lab transfer delays (30%).',
          actionLabel: 'See details',
          targetTab: 'risk_matrix'
        };
      case 'digital_twin':
        return {
          text: 'Readiness is calculated across 5 weighted components (EDC 30%, External 25%, Site 20%, CDM 15%, Cross-functional 10%). Click any category to inspect subject & record derivation.',
          actionLabel: 'Prioritise key actions',
          targetTab: 'action_workbench'
        };
      case 'action_workbench':
        return {
          text: 'Addressing the top 3 recommended actions could reduce the potential DBL delay by 4–6 days.',
          actionLabel: 'Run scenario in Simulator',
          targetTab: 'simulator'
        };
      case 'simulator':
        return {
          text: 'Resolving SAE discrepancies and expediting lab data transfer could bring the potential DBL date 4–6 days earlier, with moderate confidence.',
          actionLabel: 'Confirm in Action Workbench',
          targetTab: 'action_workbench'
        };
      case 'forecast_scenarios':
        return {
          text: 'Closed-loop learning captures that vendor SLA escalation protocol saved +0.2 days more than baseline estimation.',
          actionLabel: 'Explore scenarios',
          targetTab: 'simulator'
        };
      default:
        return {
          text: 'DBLock AI continuously calculates explainable DBL readiness signals.',
          actionLabel: 'Open Overview',
          targetTab: 'command_centre'
        };
    }
  }

  $: currentAiInsight = getAiInsightText(activeTab);
</script>

<div class="min-h-screen bg-[#f4f6f9] text-slate-900 flex flex-col font-sans selection:bg-blue-100 selection:text-blue-900">
  
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
  <main class="flex-1 max-w-[1440px] w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">
    
    {#if activeTab === 'portfolio'}
      <!-- Screen 1: Full Portfolio View (Entry Point before opening Study CA-209-301) -->
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
      <!-- Study Workspace Layout: Left Sidebar (240px) + Study Main View -->
      <div class="flex flex-col lg:flex-row gap-6 items-start">
        
        <!-- =================================================================== -->
        <!-- LEFT STUDY CONTEXT SIDEBAR                                          -->
        <!-- =================================================================== -->
        <aside class="lg:w-60 shrink-0 hidden lg:flex flex-col space-y-4 sticky top-20">
          
          <!-- Study Switcher Card -->
          <div class="db-card p-4">
            <div class="flex items-center justify-between text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              <span>Active Study</span>
              <button
                type="button"
                on:click={() => handleSelectTab('portfolio')}
                class="text-blue-600 hover:text-blue-700 font-semibold capitalize cursor-pointer text-[11px]"
              >
                All studies
              </button>
            </div>

            <!-- Current Protocol Selector -->
            <button
              type="button"
              on:click={() => handleSelectTab('portfolio')}
              class="w-full mt-2.5 px-3 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200/80 rounded-xl text-left flex items-center justify-between text-xs font-bold text-slate-900 transition-colors cursor-pointer"
            >
              <span class="font-mono">{study.protocol}</span>
              <ChevronDown size={14} class="text-slate-400" />
            </button>

            <div class="text-[11px] text-slate-500 mt-2.5 font-medium">
              {study.therapeuticArea} &middot; Phase III &middot; Global
            </div>
          </div>

          <!-- Left Vertical Navigation Links -->
          <div class="db-card p-2 space-y-0.5">
            {#each studyNavLinks as nav}
              {@const Icon = nav.icon}
              <button
                type="button"
                on:click={() => handleSelectTab(nav.id)}
                class="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-[13px] font-semibold transition-all text-left cursor-pointer {activeTab === nav.id ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}"
              >
                <Icon size={15} class={activeTab === nav.id ? 'text-blue-600' : 'text-slate-400'} />
                <span>{nav.label}</span>
              </button>
            {/each}
          </div>

          <!-- Left AI Insight Card -->
          <div class="db-card p-4 space-y-2.5 border-l-4 border-l-blue-600">
            <div class="flex items-center gap-1.5 text-slate-900 font-semibold text-xs">
              <Sparkles size={14} class="text-blue-600" />
              <span>AI Insight</span>
            </div>
            <p class="text-xs text-slate-600 leading-relaxed">
              {currentAiInsight.text}
            </p>
            <button
              type="button"
              on:click={() => handleSelectTab(currentAiInsight.targetTab)}
              class="text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline flex items-center gap-1 pt-0.5 cursor-pointer"
            >
              <span>{currentAiInsight.actionLabel}</span>
              <ArrowRight size={12} />
            </button>
          </div>

        </aside>

        <!-- =================================================================== -->
        <!-- STUDY MAIN CONTENT VIEW                                             -->
        <!-- =================================================================== -->
        <div class="flex-1 min-w-0 w-full">
          
          {#if activeTab === 'command_centre'}
            <!-- Screen 2: Study Command Centre / Overview -->
            <ExecutiveCommandCentre
              {study}
              {actions}
              {timelineSnapshots}
              {sites}
              {subjects}
              {saeDiscrepancies}
              {labBatches}
              {queriesDetail}
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
              <!-- Screen 3 & 4: Predictive Risk Heatmap, Real Map & Evidence Drawer -->
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
            <!-- Screen 5: Readiness Tab with Traceability, 5-Component Weightage & 4-Level Drill-Down -->
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
            <!-- Screen 6: Action Decision Workbench with 12 Actions & Detail Drawer -->
            <ActionWorkbench
              {sites}
              onSelectTab={handleSelectTab}
              onSelectSite={handleSelectSite}
            />

          {:else if activeTab === 'simulator'}
            <!-- Screen 7: What-If Intervention Simulator with 3 Columns -->
            <WhatIfSimulator
              {interventions}
              {study}
              onSelectTab={handleSelectTab}
            />

          {:else if activeTab === 'forecast_scenarios'}
            <!-- Screen 8: Forecast & Action-to-Outcome Closed-Loop Learning -->
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
