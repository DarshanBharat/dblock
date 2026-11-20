<script lang="ts">
  import tcsLogo from '../assets/tcs-logo.svg';
  import {
    LayoutDashboard,
    MapPin,
    CheckSquare,
    CheckCircle2,
    Sliders,
    FolderKanban,
    ChevronDown
  } from '@lucide/svelte';

  export let activeTab: string;
  export let onSelectTab: (tab: string) => void;

  const navItems = [
    { id: 'portfolio', label: 'Portfolio', icon: FolderKanban },
    { id: 'command_centre', label: 'Study Overview', icon: LayoutDashboard },
    { id: 'clinical_domains', label: 'Clinical Domains', icon: CheckSquare },
    { id: 'sites_countries', label: 'Sites & Countries', icon: MapPin, matchIds: ['sites_countries', 'risk_matrix'] },
    { id: 'subjects', label: 'Subjects', icon: CheckCircle2 },
    { id: 'actions_sim', label: 'Actions & Simulation', icon: Sliders, matchIds: ['actions_sim', 'action_workbench', 'simulator', 'forecast_scenarios'] }
  ];

  function switchVersion(event: Event) {
    const target = (event.currentTarget as HTMLSelectElement).value;
    const base = window.location.pathname.replace(/\/(v1|v2|v3|V1|V2|V3)(\/.*)?$/, '/');
    const normalizedBase = base.endsWith('/') ? base : `${base}/`;
    window.location.href = `${normalizedBase}${target}/${window.location.search}${window.location.hash}`;
  }
</script>

<header class="bg-white/90 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-40">
  <div class="max-w-[1440px] mx-auto px-4 sm:px-6 flex items-center justify-between h-15 gap-4">

    <!-- Left: Brand Logo & Version Switcher -->
    <div class="flex items-center gap-2 sm:gap-3.5 shrink-0">
      <button
        type="button"
        class="flex items-center gap-2.5 cursor-pointer text-left group"
        on:click={() => onSelectTab('portfolio')}
      >
        <img src={tcsLogo} alt="Tata Consultancy Services" width="104" height="35" class="w-[88px] max-[380px]:w-[64px] sm:w-[104px] h-auto rounded-md bg-white" />
        <div>
          <strong class="text-[15px] font-bold tracking-tight text-slate-900 leading-none block font-display">
            DBLock <span class="text-blue-600">AI</span>
          </strong>
          <small class="text-[10px] text-slate-500 font-medium block leading-none mt-0.5 max-[380px]:hidden">
            Accelerating Studies to Database Lock
          </small>
        </div>
      </button>

      <div class="relative">
        <select
          aria-label="Version"
          value="v3"
          on:change={switchVersion}
          class="appearance-none cursor-pointer rounded-lg border border-slate-200 bg-slate-100 py-1.5 pl-2 pr-6 text-xs font-semibold text-slate-700 focus-visible:outline-2 focus-visible:outline-blue-600"
        >
          <option value="v1">v1</option>
          <option value="V2">V2</option>
          <option value="v3">v3</option>
        </select>
        <ChevronDown size={12} class="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-slate-500" aria-hidden="true" />
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

    <div class="flex shrink-0 items-center gap-2.5" role="group" aria-label="Darshan Bharat, Consultant">
      <div class="flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 text-xs font-semibold text-white" aria-hidden="true">
        DB
      </div>
      <div class="hidden text-left xl:block" aria-hidden="true">
        <strong class="block text-xs font-semibold leading-tight text-slate-900">Darshan Bharat</strong>
        <small class="mt-0.5 block text-[11px] leading-none text-slate-500">Consultant</small>
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
