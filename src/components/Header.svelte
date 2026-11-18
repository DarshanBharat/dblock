<script lang="ts">
  import tcsLogo from '../assets/tcs-logo.svg';
  import {
    Search,
    LayoutDashboard,
    MapPin,
    CheckSquare,
    CheckCircle2,
    Sliders,
    FolderKanban
  } from '@lucide/svelte';

  export let activeTab: string;
  export let onSelectTab: (tab: string) => void;

  let showSearchInput = false;
  let searchHeader = '';

  const navItems = [
    { id: 'portfolio', label: 'Portfolio', icon: FolderKanban },
    { id: 'command_centre', label: 'Overview', icon: LayoutDashboard },
    { id: 'risk_matrix', label: 'Sites & Risks', icon: MapPin },
    { id: 'digital_twin', label: 'Readiness', icon: CheckSquare },
    { id: 'action_workbench', label: 'Actions', icon: CheckCircle2 },
    { id: 'simulator', label: 'Forecast & Sim', icon: Sliders, matchIds: ['simulator', 'forecast_scenarios'] }
  ];

  const quickLinks = [
    { label: 'Study Portfolio', sub: 'All active trials', tab: 'portfolio' },
    { label: 'Study CA-209-301 Overview', sub: 'Command centre & KPIs', tab: 'command_centre' },
    { label: 'Sites & Risks', sub: 'Site 104 (Critical), 317, 405', tab: 'risk_matrix' },
    { label: 'Readiness Traceability', sub: '158/220 clean subjects', tab: 'digital_twin' },
    { label: 'Action Workbench', sub: '12 recommended actions', tab: 'action_workbench' },
    { label: 'What-If Simulator', sub: 'Test DBL date shifts', tab: 'simulator' },
    { label: 'Forecast Scenarios', sub: 'Target-meeting likelihood', tab: 'forecast_scenarios' }
  ];

  $: filteredQuickLinks = searchHeader.trim()
    ? quickLinks.filter(q =>
        q.label.toLowerCase().includes(searchHeader.toLowerCase()) ||
        q.sub.toLowerCase().includes(searchHeader.toLowerCase())
      )
    : quickLinks;

  function switchVersion(target: 'v1' | 'V2') {
    const base = window.location.pathname.replace(/\/(v1|v2|V1|V2)(\/.*)?$/, '/');
    const normalizedBase = base.endsWith('/') ? base : `${base}/`;
    window.location.href = `${normalizedBase}${target}/${window.location.hash}`;
  }
</script>

<header class="bg-white/90 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-40">
  <div class="max-w-[1440px] mx-auto px-4 sm:px-6 flex items-center justify-between h-15 gap-4">

    <!-- Left: Brand Logo & Version Switcher -->
    <div class="flex items-center gap-3.5 shrink-0">
      <button
        type="button"
        class="flex items-center gap-2.5 cursor-pointer text-left group"
        on:click={() => onSelectTab('portfolio')}
      >
        <img src={tcsLogo} alt="Tata Consultancy Services" width="104" height="35" class="w-[88px] sm:w-[104px] h-auto rounded-md bg-slate-950" />
        <div>
          <strong class="text-[15px] font-bold tracking-tight text-slate-900 leading-none block font-display">
            DBLock <span class="text-blue-600">AI</span>
          </strong>
          <small class="text-[10px] text-slate-500 font-medium block leading-none mt-0.5">
            Database Lock Engine
          </small>
        </div>
      </button>

      <!-- Version Switcher -->
      <div class="hidden sm:inline-flex items-center rounded-lg bg-slate-100/90 p-0.5 border border-slate-200/80" role="group" aria-label="Version switcher">
        <button
          type="button"
          on:click={() => switchVersion('v1')}
          class="px-2 py-0.5 text-[11px] font-medium rounded-md text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
          title="Switch to v1 (Nov 8 snapshot)"
        >
          v1
        </button>
        <span
          class="px-2 py-0.5 text-[11px] font-semibold rounded-md bg-white text-blue-700 shadow-2xs"
          title="Currently viewing V2 (Latest)"
        >
          V2
        </span>
      </div>
    </div>

    <!-- Center: Primary Navigation Tabs -->
    <nav class="hidden md:flex items-center gap-1 overflow-x-auto h-full" aria-label="Main navigation">
      {#each navItems as item}
        {@const Icon = item.icon}
        {@const isActive = item.matchIds ? item.matchIds.includes(activeTab) : activeTab === item.id}
        <button
          type="button"
          on:click={() => onSelectTab(item.id)}
          class="relative h-full px-3 flex items-center gap-1.5 text-[13px] font-semibold transition-colors cursor-pointer border-b-2 whitespace-nowrap {isActive ? 'text-blue-600 border-blue-600' : 'text-slate-600 border-transparent hover:text-slate-900 hover:border-slate-300'}"
        >
          <Icon size={14} class={isActive ? 'text-blue-600 stroke-[2.3]' : 'text-slate-400'} />
          <span>{item.label}</span>
        </button>
      {/each}
    </nav>

    <!-- Right: Global Utilities & Profile -->
    <div class="flex items-center gap-2 shrink-0">

      <!-- Quick Jump Search -->
      <div class="relative">
        <button
          type="button"
          on:click={() => showSearchInput = !showSearchInput}
          class="p-2 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          aria-label="Quick search"
        >
          <Search size={16} />
        </button>
        {#if showSearchInput}
          <div class="absolute right-0 top-11 w-72 bg-white border border-slate-200 rounded-xl shadow-xl p-2.5 z-50 space-y-2">
            <input
              type="text"
              bind:value={searchHeader}
              placeholder="Jump to view or site (e.g. 104, Actions)..."
              class="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-slate-800 focus:outline-hidden focus:border-blue-500 focus:bg-white"
              autoFocus
            />
            <div class="max-h-56 overflow-y-auto divide-y divide-slate-100">
              {#each filteredQuickLinks as ql}
                <button
                  type="button"
                  on:click={() => { onSelectTab(ql.tab); showSearchInput = false; searchHeader = ''; }}
                  class="w-full text-left px-2.5 py-2 hover:bg-blue-50/70 rounded-lg transition-colors cursor-pointer"
                >
                  <div class="text-xs font-semibold text-slate-900">{ql.label}</div>
                  <div class="text-[11px] text-slate-500">{ql.sub}</div>
                </button>
              {/each}
            </div>
          </div>
        {/if}
      </div>

      <!-- User Profile -->
      <div class="flex items-center gap-2.5 pl-2.5 ml-0.5 border-l border-slate-200">
        <div class="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-semibold text-xs">
          SS
        </div>
        <div class="hidden xl:block text-left">
          <strong class="text-xs font-semibold text-slate-900 block leading-tight">Sarah Smith</strong>
          <small class="text-[11px] text-slate-500 block leading-none mt-0.5">Study Data Lead</small>
        </div>
      </div>

    </div>

  </div>

  <!-- Mobile Navigation Bar -->
  <div class="md:hidden flex items-center gap-1.5 px-4 py-2 bg-slate-50/90 border-t border-slate-200/80 overflow-x-auto text-xs">
    {#each navItems as item}
      <button
        type="button"
        on:click={() => onSelectTab(item.id)}
        class="px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition-colors {activeTab === item.id ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-200/60'}"
      >
        {item.label}
      </button>
    {/each}
  </div>
</header>
