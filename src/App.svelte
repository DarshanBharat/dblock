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

  // Role / Workstream operational filter (#2)
  let activeRole: 'all' | 'my_queue' | 'cra_site' | 'cdm' | 'safety' | 'vendor' = 'all';

  const roleQueues = [
    { id: 'all', label: 'All Workstreams', count: 8, desc: 'Full study view across all 6 data domains' },
    { id: 'my_queue', label: 'My Queue (Sarah)', count: 4, desc: 'Critical path decisions awaiting Study Data Lead sign-off' },
    { id: 'cra_site', label: 'CRA / Site Monitoring', count: 3, desc: 'SDV backlog, eCRF entry & 18 pending PI signatures (Sites 104, 317, 405)' },
    { id: 'cdm', label: 'CDM / Queries & Coding', count: 3, desc: '14 critical queries >14d & 12 uncoded MedDRA/WHODrug terms' },
    { id: 'safety', label: 'Safety / PV (SAE)', count: 2, desc: '2 Rave-vs-Argus SAE discrepancies at Site 104 blocking freeze' },
    { id: 'vendor', label: 'External Vendors', count: 2, desc: 'LabCorp ctDNA #LXB-8921 checksum failure & Eurofins QA batch' }
  ] as const;

  $: activeRoleObj = roleQueues.find(r => r.id === activeRole) || roleQueues[0];

  function getAiInsightText(tab: string) {
    switch (tab) {
      case 'command_centre':
        return {
          text: 'Study CA-209-301 is 72% ready (158/220 clean subjects). Resolving 3 critical blockers can shift Potential DBL 4–6 days closer to the 15 Dec target.',
          actionLabel: 'Open Action Workbench',
          targetTab: 'action_workbench'
        };
      case 'risk_matrix':
        return {
          text: 'Site 104 has fewer open items (19) than Site 208 (41), but a 5–7d DBL impact due to 2 SAE discrepancies and LabCorp ctDNA batch #LXB-8921.',
          actionLabel: 'Inspect Site 104',
          targetTab: 'risk_matrix'
        };
      case 'digital_twin':
        return {
          text: 'External data reconciliation (65%) and Site sign-offs (75%) are the lowest-scoring readiness components.',
          actionLabel: 'Prioritise actions',
          targetTab: 'action_workbench'
        };
      case 'action_workbench':
        return {
          text: 'Accepting the top 3 critical recommendations saves a combined ~4.8 days (after 0.82x overlap damping).',
          actionLabel: 'Simulate DBL shift',
          targetTab: 'simulator'
        };
      case 'simulator':
      case 'forecast_scenarios':
        return {
          text: 'Executing SAE reconciliation + LabCorp re-export increases 15 Dec target-meeting likelihood from 28% to 74%.',
          actionLabel: 'Confirm in Actions',
          targetTab: 'action_workbench'
        };
      default:
        return {
          text: 'DBLock AI continuously tracks record-level readiness across EDC, Safety, Lab, eCOA, and Coding.',
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
  <main class="flex-1 max-w-[1440px] w-full mx-auto px-4 sm:px-6 py-6">
    
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
      <!-- Full-Width Operational Study Workspace (No duplicate left nav!) -->
      <div class="space-y-5">

        <!-- ================================================================= -->
        <!-- STUDY CONTEXT + ROLE / WORKSTREAM FILTER BAR (#2 & #5)            -->
        <!-- ================================================================= -->
        <div class="db-card p-3.5 sm:px-5 sm:py-3.5 flex flex-col gap-3">
          
          <!-- Top Row: Active Study Switcher + Hard Gate Countdown Strip + AI Insight Pill -->
          <div class="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div class="flex items-center gap-3 flex-wrap">
              <button
                type="button"
                on:click={() => handleSelectTab('portfolio')}
                class="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200/80 text-xs font-bold text-slate-900 transition-colors cursor-pointer"
                title="Switch study in Portfolio"
              >
                <span class="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Study</span>
                <span class="font-mono text-blue-700">{study.protocol}</span>
                <ChevronDown size={13} class="text-slate-400" />
              </button>

              <div class="hidden sm:flex items-center gap-2 text-xs text-slate-600">
                <span class="font-medium text-slate-700">{study.therapeuticArea} &middot; Phase III</span>
                <span class="text-slate-300">|</span>
                <span class="num-tabular">LSLV: <strong class="text-slate-800">30 Nov</strong></span>
                <span class="text-slate-300">&rarr;</span>
                <span class="num-tabular">Target DBL: <strong class="text-slate-900">15 Dec</strong></span>
                <span class="text-slate-300">&rarr;</span>
                <span class="px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 border border-rose-200/70 font-semibold num-tabular text-[11px]">
                  Potential DBL: 21 Dec (+6d)
                </span>
              </div>
            </div>

            <!-- Compact Inline AI Insight + Action Link -->
            <div class="flex items-center gap-2 text-xs bg-blue-50/70 border border-blue-200/60 px-3 py-1.5 rounded-xl max-w-xl">
              <Sparkles size={13} class="text-blue-600 shrink-0" />
              <span class="text-slate-700 truncate">{currentAiInsight.text}</span>
              <button
                type="button"
                on:click={() => handleSelectTab(currentAiInsight.targetTab)}
                class="font-semibold text-blue-600 hover:text-blue-800 hover:underline shrink-0 inline-flex items-center gap-0.5 cursor-pointer"
              >
                <span>{currentAiInsight.actionLabel}</span>
                <ArrowRight size={11} />
              </button>
            </div>
          </div>

          <!-- Bottom Row: Role / Workstream Filter Pills (#2) -->
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div class="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              <span class="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mr-1 shrink-0">
                Workstream:
              </span>
              {#each roleQueues as rq}
                <button
                  type="button"
                  on:click={() => activeRole = rq.id}
                  class="px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 {activeRole === rq.id ? 'bg-slate-900 text-white shadow-2xs' : 'bg-slate-100/90 text-slate-600 hover:bg-slate-200/70 hover:text-slate-900'}"
                >
                  <span>{rq.label}</span>
                  <span class="px-1.5 py-0.2 rounded-full text-[10px] num-tabular {activeRole === rq.id ? 'bg-white/20 text-white' : 'bg-white text-slate-600'}">
                    {rq.count}
                  </span>
                </button>
              {/each}
            </div>

            {#if activeRole !== 'all'}
              <div class="flex items-center justify-between sm:justify-end gap-2 text-xs text-blue-700 bg-blue-50/80 px-2.5 py-1 rounded-lg border border-blue-200/60 shrink-0">
                <span class="font-medium">{activeRoleObj.desc}</span>
                <button
                  type="button"
                  on:click={() => activeRole = 'all'}
                  class="text-[11px] font-bold underline hover:text-blue-900 cursor-pointer ml-1"
                >
                  Reset
                </button>
              </div>
            {/if}
          </div>

        </div>

        <!-- ================================================================= -->
        <!-- UNIFIED FORECAST & SIMULATION MODE SWITCHER (#5)                  -->
        <!-- ================================================================= -->
        {#if activeTab === 'simulator' || activeTab === 'forecast_scenarios'}
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white rounded-xl border border-slate-200/90 px-4 py-2.5 shadow-2xs">
            <div class="flex items-center gap-2 text-xs text-slate-600">
              <Sliders size={14} class="text-blue-600" />
              <span class="font-semibold text-slate-900">Forecast &amp; Simulation Workspace</span>
              <span class="hidden md:inline text-slate-400">&mdash; Test interventions or compare Best / Most Likely / At-Risk trajectories</span>
            </div>
            <div class="inline-flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200/80 self-start sm:self-auto">
              <button
                type="button"
                on:click={() => handleSelectTab('simulator')}
                class="px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer {activeTab === 'simulator' ? 'bg-white text-blue-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'}"
              >
                <Sliders size={13} />
                <span>What-If Intervention Simulator</span>
              </button>
              <button
                type="button"
                on:click={() => handleSelectTab('forecast_scenarios')}
                class="px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer {activeTab === 'forecast_scenarios' ? 'bg-white text-blue-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'}"
              >
                <TrendingUp size={13} />
                <span>Forecast Scenarios &amp; Target Likelihood</span>
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
