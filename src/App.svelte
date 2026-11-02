<script lang="ts">
  import dblockData from './data/dblock_data.json';
  import Header from './components/Header.svelte';
  import TrustCentreModal from './components/TrustCentreModal.svelte';
  import DataHealthModal from './components/DataHealthModal.svelte';
  import PortfolioView from './components/PortfolioView.svelte';
  import ExecutiveCommandCentre from './components/ExecutiveCommandCentre.svelte';
  import ReadinessDigitalTwin from './components/ReadinessDigitalTwin.svelte';
  import PredictiveRiskHeatmap from './components/PredictiveRiskHeatmap.svelte';
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
  let activeTab = 'command_centre';

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

  // Initialize live workflow store
  initialize(actions);

  // Selected site object for deep drill-down
  let selectedSiteId: string | null = null;

  function handleSelectTab(tab: string) {
    activeTab = tab;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function handleSelectStudy(studyId: string) {
    currentStudyId = studyId;
    activeTab = 'command_centre';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function handleSelectSite(siteId: string) {
    activeTab = 'risk_matrix';
    selectedSiteId = siteId;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

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
          text: 'Your study is 72% ready for DBL. Focusing on 3 critical actions could avoid ~6 days of delay.',
          actionLabel: 'View recommended actions',
          targetTab: 'action_workbench'
        };
      case 'risk_matrix':
        return {
          text: 'Site 104 has fewer open items than Site 208, but a greater estimated DBL impact due to SAE reconciliation and lab transfer delays.',
          actionLabel: 'See details',
          targetTab: 'risk_matrix'
        };
      case 'digital_twin':
        return {
          text: 'While overall readiness has improved by 9 points since Week -8, recent delays in laboratory transfer and new SAE discrepancies have increased the forecast delay by 3 days.',
          actionLabel: 'Prioritise key actions',
          targetTab: 'action_workbench'
        };
      case 'action_workbench':
        return {
          text: 'Addressing the top 3 recommended actions could reduce the forecast delay by 4–6 days.',
          actionLabel: 'Run scenario in Simulator',
          targetTab: 'simulator'
        };
      case 'simulator':
        return {
          text: 'Resolving SAE discrepancies and expediting lab data transfer could bring the forecast lock date 4–6 days earlier, with moderate confidence.',
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

<div class="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-blue-100 selection:text-blue-900">
  
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
        onSelectStudy={handleSelectStudy}
      />
    {:else}
      <!-- Study Workspace Layout: Left Sidebar + Study Main View -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        <!-- =================================================================== -->
        <!-- LEFT STUDY CONTEXT SIDEBAR (Matching Screenshots 2, 3, 5, 6, 8)     -->
        <!-- =================================================================== -->
        <aside class="lg:col-span-2 hidden lg:flex flex-col space-y-5 sticky top-20">
          
          <!-- Study Switcher Card -->
          <div class="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
            <div class="flex items-center justify-between text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              <span>Study</span>
              <button
                on:click={() => handleSelectTab('portfolio')}
                class="text-blue-600 hover:text-blue-800 font-bold capitalize cursor-pointer text-xs"
              >
                Change
              </button>
            </div>

            <!-- Current Protocol Selector -->
            <button
              on:click={() => handleSelectTab('portfolio')}
              class="w-full mt-2 p-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-left flex items-center justify-between text-xs font-bold text-slate-900 transition-colors"
            >
              <span>{study.protocol}</span>
              <ChevronDown size={14} class="text-slate-500" />
            </button>

            <div class="text-[11px] text-slate-500 mt-2 font-medium">
              {study.therapeuticArea} &middot; Phase III &middot; Global
            </div>
          </div>

          <!-- Left Vertical Navigation Links -->
          <div class="bg-white rounded-xl border border-slate-200 p-2 shadow-xs space-y-1">
            {#each studyNavLinks as nav}
              {@const Icon = nav.icon}
              <button
                on:click={() => handleSelectTab(nav.id)}
                class="w-full flex items-center space-x-2.5 px-3 py-2.5 rounded-lg text-xs font-bold transition-all text-left {activeTab === nav.id ? 'bg-blue-50 text-blue-700 font-extrabold' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}"
              >
                <Icon size={16} class={activeTab === nav.id ? 'text-blue-600' : 'text-slate-400'} />
                <span>{nav.label}</span>
              </button>
            {/each}
          </div>

          <!-- Left AI Insight Card -->
          <div class="bg-gradient-to-br from-blue-50 to-indigo-50/80 rounded-xl border border-blue-200/90 p-4 shadow-xs space-y-2">
            <div class="flex items-center space-x-1.5 text-blue-900 font-bold text-xs">
              <Sparkles size={14} class="text-blue-600" />
              <span>AI Insight</span>
            </div>
            <p class="text-[11px] text-blue-900/90 leading-relaxed font-medium">
              {currentAiInsight.text}
            </p>
            <button
              on:click={() => handleSelectTab(currentAiInsight.targetTab)}
              class="text-[11px] font-bold text-blue-700 hover:text-blue-900 hover:underline flex items-center space-x-1 pt-1"
            >
              <span>{currentAiInsight.actionLabel}</span>
              <ArrowRight size={12} />
            </button>
          </div>

        </aside>

        <!-- =================================================================== -->
        <!-- STUDY MAIN CONTENT VIEW                                             -->
        <!-- =================================================================== -->
        <div class="lg:col-span-10 min-w-0">
          
          {#if activeTab === 'command_centre'}
            <!-- Screen 2: Study Command Centre / Overview -->
            <ExecutiveCommandCentre
              {study}
              {actions}
              {timelineSnapshots}
              onSelectTab={handleSelectTab}
              onSelectSite={handleSelectSite}
            />

          {:else if activeTab === 'risk_matrix'}
            <!-- Screen 3 & 4: Predictive Risk Heatmap, Map & Evidence Drawer -->
            <PredictiveRiskHeatmap
              {sites}
              {subjects}
              {dimensions}
              onSelectSite={handleSelectSite}
              onSelectTab={handleSelectTab}
            />

          {:else if activeTab === 'digital_twin'}
            <!-- Screen 5: Dynamic Readiness Digital Twin with Time Scrubber -->
            <ReadinessDigitalTwin
              {dimensions}
              {timelineSnapshots}
              onSelectTab={handleSelectTab}
              onSelectSite={handleSelectSite}
            />

          {:else if activeTab === 'action_workbench'}
            <!-- Screen 6: Action Decision Workbench with 12 Actions & Detail Drawer -->
            <ActionWorkbench
              onSelectTab={handleSelectTab}
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
          AI Trust Centre &amp; Governance
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
