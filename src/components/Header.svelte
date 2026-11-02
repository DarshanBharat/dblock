<script lang="ts">
  import {
    Database,
    Search,
    Bell,
    ShieldCheck,
    Activity,
    Layers,
    LayoutDashboard,
    MapPin,
    CheckSquare,
    CheckCircle2,
    Sliders,
    TrendingUp,
    FolderKanban,
    ChevronDown,
    X,
    ExternalLink,
    AlertTriangle,
    RotateCcw
  } from '@lucide/svelte';

  export let study: any;
  export let activeTab: string;
  export let onSelectTab: (tab: string) => void;
  export let onOpenTrustCentre: () => void;
  export let onOpenDataHealth: () => void;
  export let onResetDemo: () => void;

  let showNotifications = false;
  let showSearchInput = false;
  let searchHeader = '';

  const navItems = [
    { id: 'portfolio', label: 'Portfolio', icon: FolderKanban },
    { id: 'command_centre', label: 'Overview', icon: LayoutDashboard },
    { id: 'risk_matrix', label: 'Sites & Risks', icon: MapPin },
    { id: 'digital_twin', label: 'Readiness', icon: CheckSquare },
    { id: 'action_workbench', label: 'Actions', icon: CheckCircle2 },
    { id: 'simulator', label: 'Scenarios', icon: Sliders },
    { id: 'forecast_scenarios', label: 'Forecast', icon: TrendingUp }
  ];

  const notifications = [
    { id: 1, title: 'Overdue LabCorp ctDNA feed', time: '10m ago', type: 'critical', desc: 'Batch #LXB-8921 checksum failure reported at Site 104.' },
    { id: 2, title: '2 new SAE discrepancies detected', time: '45m ago', type: 'critical', desc: 'Rave EDC vs Argus Safety discordance for Subj 104-003 and 104-012.' },
    { id: 3, title: 'Readiness model refreshed', time: '2h ago', type: 'info', desc: 'Study readiness updated to 72/100 (+5 points vs last week).' }
  ];
</script>

<header class="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs">
  <div class="max-w-[1440px] mx-auto px-4 sm:px-6 flex items-center justify-between h-16 gap-4">
    
    <!-- Left: Brand Logo & Subtitle -->
    <div
      class="flex items-center space-x-3 cursor-pointer shrink-0"
      on:click={() => onSelectTab('command_centre')}
    >
      <div class="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-700 to-blue-500 text-white flex items-center justify-center shadow-xs">
        <Database size={19} class="stroke-[2.2]" />
      </div>
      <div>
        <div class="flex items-center space-x-1.5">
          <strong class="text-base font-extrabold tracking-tight text-slate-900 leading-tight">
            DBLock <span class="text-blue-600">AI</span>
          </strong>
        </div>
        <small class="text-[10px] text-slate-500 font-medium block leading-none">
          Predict. Prioritise. Accelerate DBL.
        </small>
      </div>
    </div>

    <!-- Center: Horizontal Navigation Tabs (matching all screenshots) -->
    <nav class="hidden md:flex items-center space-x-1 sm:space-x-2 overflow-x-auto h-full" aria-label="Main navigation">
      {#each navItems as item}
        {@const Icon = item.icon}
        <button
          on:click={() => onSelectTab(item.id)}
          class="relative h-full px-3 py-2 flex items-center space-x-1.5 text-xs font-bold transition-colors cursor-pointer border-b-2 {activeTab === item.id ? 'text-blue-600 border-blue-600 font-extrabold' : 'text-slate-600 border-transparent hover:text-slate-900 hover:border-slate-300'}"
        >
          <Icon size={14} class={activeTab === item.id ? 'text-blue-600 stroke-[2.4]' : 'text-slate-400'} />
          <span>{item.label}</span>
        </button>
      {/each}
    </nav>

    <!-- Right: Global Actions & User Capsule -->
    <div class="flex items-center space-x-3 shrink-0">
      
      <!-- Trust Centre Link -->
      <button
        on:click={onOpenTrustCentre}
        class="hidden lg:flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:text-blue-700 hover:bg-blue-50 transition-colors border border-transparent hover:border-blue-200 cursor-pointer"
        title="Open Trust Centre & Explainable Model Governance"
      >
        <ShieldCheck size={15} class="text-blue-600" />
        <span>Trust Centre</span>
      </button>

      <!-- Data Feed Health Status Pill -->
      <button
        on:click={onOpenDataHealth}
        class="hidden sm:flex items-center space-x-1.5 px-2 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 transition-colors cursor-pointer"
        title="LabCorp Central Lab feed is 4 days overdue"
      >
        <span class="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
        <span>Feeds (1 Attention)</span>
      </button>

      <!-- Search icon toggle -->
      <div class="relative">
        <button
          on:click={() => showSearchInput = !showSearchInput}
          class="p-2 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-100 transition-colors"
          aria-label="Search"
        >
          <Search size={16} />
        </button>
        {#if showSearchInput}
          <div class="absolute right-0 top-11 w-64 bg-white border border-slate-200 rounded-lg shadow-lg p-2 z-50">
            <input
              type="text"
              bind:value={searchHeader}
              placeholder="Search studies, sites, queries..."
              class="w-full text-xs bg-slate-50 border border-slate-200 rounded-md py-1.5 px-2.5 text-slate-800 focus:outline-hidden focus:border-blue-500"
              autoFocus
            />
          </div>
        {/if}
      </div>

      <!-- Bell Notifications Popover Toggle -->
      <div class="relative">
        <button
          on:click={() => showNotifications = !showNotifications}
          class="relative p-2 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-100 transition-colors"
          aria-label="Notifications"
        >
          <Bell size={16} />
          <span class="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white"></span>
        </button>

        {#if showNotifications}
          <div class="absolute right-0 top-11 w-80 bg-white border border-slate-200 rounded-xl shadow-xl p-3 z-50 space-y-2">
            <div class="flex items-center justify-between pb-2 border-b border-slate-100">
              <span class="text-xs font-bold text-slate-900">Live Clinical Alerts</span>
              <span class="text-[10px] text-blue-600 font-bold bg-blue-50 px-1.5 py-0.5 rounded">3 New</span>
            </div>

            <div class="space-y-1.5 max-h-72 overflow-y-auto text-xs">
              {#each notifications as notif}
                <div class="p-2 rounded-lg bg-slate-50 hover:bg-blue-50/50 transition-colors border border-slate-100">
                  <div class="flex items-center justify-between">
                    <span class="font-bold text-slate-900">{notif.title}</span>
                    <span class="text-[10px] text-slate-400">{notif.time}</span>
                  </div>
                  <p class="text-[11px] text-slate-600 mt-0.5 leading-snug">{notif.desc}</p>
                </div>
              {/each}
            </div>

            <div class="pt-2 border-t border-slate-100 text-center">
              <button
                on:click={() => { showNotifications = false; onSelectTab('action_workbench'); }}
                class="text-xs text-blue-600 font-bold hover:underline"
              >
                Review in Action Workbench &rarr;
              </button>
            </div>
          </div>
        {/if}
      </div>

      <!-- User Profile Capsule (Matching Sarah Smith / Study Data Lead) -->
      <div class="flex items-center space-x-2.5 pl-2 border-l border-slate-200">
        <div class="w-8 h-8 rounded-full bg-gradient-to-tr from-slate-900 to-blue-950 text-white flex items-center justify-center font-bold text-xs shadow-xs">
          SS
        </div>
        <div class="hidden sm:block text-left">
          <strong class="text-xs font-bold text-slate-900 block leading-tight">Sarah Smith</strong>
          <small class="text-[10px] text-slate-500 font-medium block leading-none">Study Data Lead</small>
        </div>
      </div>

    </div>

  </div>

  <!-- Mobile Navigation Bar -->
  <div class="md:hidden flex items-center space-x-2 px-4 py-2 bg-slate-50 border-t border-slate-200 overflow-x-auto text-xs">
    {#each navItems as item}
      <button
        on:click={() => onSelectTab(item.id)}
        class="px-2.5 py-1 rounded-md font-semibold whitespace-nowrap {activeTab === item.id ? 'bg-blue-600 text-white' : 'text-slate-600'}"
      >
        {item.label}
      </button>
    {/each}
  </div>
</header>
