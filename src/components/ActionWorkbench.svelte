<script lang="ts">
  import ActionCountryMap from './ActionCountryMap.svelte';
  import {
    workflow,
    updateAction,
    mapping,
    type DemoAction
  } from '../lib/workflow';
  import {
    ArrowRight,
    Search,
    AlertTriangle,
    CheckCircle2,
    Clock,
    ShieldAlert,
    ChevronDown,
    X,
    Sparkles,
    Mail,
    UserCheck,
    FileText,
    History,
    Lock,
    Edit3,
    Check,
    Ban,
    ExternalLink,
    Globe,
    Map,
    MapPin
  } from '@lucide/svelte';

  export let onSelectTab: (tab: string) => void;
  export let sites: any[] = [];
  export let onSelectSite: ((id: string) => void) | undefined = undefined;

  // View mode: 'split' (shows Country Map on top + Table below) | 'table' | 'map'
  let viewMode: 'split' | 'table' | 'map' = 'split';
  let selectedCountry: string = 'all';

  const siteGeoMap: Record<string, { lat: number; lng: number; city: string; country: string; countryCode: string; flag: string }> = {
    'Site 104': { lat: 42.3601, lng: -71.0589, city: 'Boston', country: 'United States', countryCode: 'US', flag: '🇺🇸' },
    'Site 208': { lat: 41.8781, lng: -87.6298, city: 'Chicago', country: 'United States', countryCode: 'US', flag: '🇺🇸' },
    'Site 317': { lat: 52.5200, lng: 13.4050, city: 'Berlin', country: 'Germany', countryCode: 'DE', flag: '🇩🇪' },
    'Site 405': { lat: 37.5665, lng: 126.9780, city: 'Seoul', country: 'South Korea', countryCode: 'KR', flag: '🇰🇷' },
    'Site 502': { lat: -37.8136, lng: 144.9631, city: 'Melbourne', country: 'Australia', countryCode: 'AU', flag: '🇦🇺' },
    'Site 608': { lat: 43.6532, lng: -79.3832, city: 'Toronto', country: 'Canada', countryCode: 'CA', flag: '🇨🇦' },
    'Site 722': { lat: 48.8566, lng: 2.3522, city: 'Paris', country: 'France', countryCode: 'FR', flag: '🇫🇷' },
    'Site 815': { lat: 40.4168, lng: -3.7038, city: 'Madrid', country: 'Spain', countryCode: 'ES', flag: '🇪🇸' }
  };

  function getActionGeo(action: any) {
    const key = action.site || action.scope;
    if (key && siteGeoMap[key]) {
      return siteGeoMap[key];
    }
    if (key && key.includes('Multiple')) {
      return { lat: 45, lng: 10, city: 'Multiple Centers', country: 'US / DE / KR', countryCode: 'MULTI', flag: '🌐' };
    }
    return { lat: 0, lng: 0, city: 'Study-wide', country: 'Global', countryCode: 'GLOBAL', flag: '🌐' };
  }

  // Filter state
  let priorityFilter = 'all'; // 'all' | 'critical' | 'high' | 'medium' | 'low'
  let ownerFilter = 'all';
  let domainFilter = 'all';
  let statusFilter = 'all';
  let searchQuery = '';

  // Selected Action Drawer state
  let selectedActionId: string | null = 'ACT-001';
  let drawerTab = 'details'; // 'details' | 'evidence' | 'subjects' | 'history'

  // Modification modal/state
  let isModifying = false;
  let editOwner = '';
  let editDate = '';
  let rejectReason = '';
  let isRejecting = false;
  let showEmailPreview = false;

  $: selectedAction = $workflow.actions.find(a => a.id === selectedActionId) || $workflow.actions[0];

  function openDrawer(actionId: string) {
    selectedActionId = actionId;
    drawerTab = 'details';
    isModifying = false;
    isRejecting = false;
    showEmailPreview = false;
  }

  function closeDrawer() {
    selectedActionId = null;
  }

  function approveAction(act: DemoAction) {
    updateAction(act.id, { status: 'Accepted' }, `Approved and assigned ${act.id} to ${act.owner}`);
  }

  function startModify(act: DemoAction) {
    isModifying = true;
    editOwner = act.owner;
    editDate = act.dueDate;
  }

  function saveModify(act: DemoAction) {
    if (!editOwner.trim() || !editDate) return;
    updateAction(act.id, { owner: editOwner.trim(), dueDate: editDate, status: 'Accepted' }, `Modified and assigned ${act.id}: Owner set to ${editOwner.trim()}, Target date ${editDate}`);
    isModifying = false;
  }

  function submitReject(act: DemoAction) {
    if (!rejectReason.trim()) return;
    updateAction(act.id, { status: 'Rejected', reason: rejectReason.trim() }, `Rejected ${act.id}: ${rejectReason.trim()}`);
    isRejecting = false;
    rejectReason = '';
  }

  // Reactive filtering
  $: filteredActions = $workflow.actions.filter(a => {
    if (priorityFilter === 'critical' && a.priority !== 'Critical') return false;
    if (priorityFilter === 'high' && a.priority !== 'High') return false;
    if (priorityFilter === 'medium' && a.priority !== 'Medium') return false;
    if (priorityFilter === 'low' && a.priority !== 'Low') return false;

    if (ownerFilter !== 'all' && !a.owner.toLowerCase().includes(ownerFilter.toLowerCase())) return false;
    if (domainFilter !== 'all' && a.domain !== domainFilter) return false;
    if (statusFilter !== 'all' && a.status !== statusFilter) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return a.id.toLowerCase().includes(q) ||
        a.title.toLowerCase().includes(q) ||
        a.owner.toLowerCase().includes(q) ||
        (a.site && a.site.toLowerCase().includes(q));
    }
    return true;
  });

  // KPI Counters
  $: countTotal = $workflow.actions.length;
  $: countCritical = $workflow.actions.filter(a => a.priority === 'Critical').length;
  $: countHigh = $workflow.actions.filter(a => a.priority === 'High').length;
  $: countMedium = $workflow.actions.filter(a => a.priority === 'Medium').length;
  $: countLow = $workflow.actions.filter(a => a.priority === 'Low').length;

  function getPriorityBadge(priority: string) {
    if (priority === 'Critical') return 'bg-rose-100 text-rose-800 border-rose-200';
    if (priority === 'High') return 'bg-amber-100 text-amber-800 border-amber-200';
    if (priority === 'Medium') return 'bg-blue-100 text-blue-800 border-blue-200';
    return 'bg-emerald-100 text-emerald-800 border-emerald-200';
  }

  function getStatusBadge(status: string) {
    if (status === 'Accepted' || status === 'Completed') return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    if (status === 'Under review') return 'bg-amber-50 text-amber-700 border-amber-200';
    if (status === 'Rejected') return 'bg-slate-100 text-slate-500 border-slate-200';
    if (status === 'Not started') return 'bg-slate-50 text-slate-600 border-slate-200';
    return 'bg-blue-50 text-blue-700 border-blue-200';
  }
</script>

<div class="space-y-6">

  <!-- ========================================================================= -->
  <!-- HERO BANNER: ACTION DECISION WORKBENCH                                    -->
  <!-- ========================================================================= -->
  <div class="rounded-2xl bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950 text-white p-6 shadow-md border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-6">
    <div class="max-w-xl">
      <span class="text-[10px] font-extrabold uppercase tracking-widest text-blue-300">
        ACTION DECISION WORKBENCH
      </span>
      <h1 class="text-2xl sm:text-3xl font-extrabold text-white mt-1 tracking-tight">
        Turn insights into action.
      </h1>
      <p class="text-xs sm:text-sm text-slate-300 mt-1.5 leading-relaxed">
        Review AI-recommended actions, assess the impact, assign owners and track progress &mdash; with human approval.
      </p>
    </div>

    <!-- 4 Value Pills -->
    <div class="grid grid-cols-2 gap-2 text-xs shrink-0 max-w-sm">
      <div class="flex items-center space-x-1.5 text-blue-200 bg-white/10 px-2.5 py-1.5 rounded-lg border border-white/15">
        <CheckCircle2 size={13} class="text-blue-400 shrink-0" />
        <span class="text-[11px] font-medium">Prioritised by DBL impact</span>
      </div>
      <div class="flex items-center space-x-1.5 text-blue-200 bg-white/10 px-2.5 py-1.5 rounded-lg border border-white/15">
        <CheckCircle2 size={13} class="text-blue-400 shrink-0" />
        <span class="text-[11px] font-medium">Evidence-based recommendations</span>
      </div>
      <div class="flex items-center space-x-1.5 text-blue-200 bg-white/10 px-2.5 py-1.5 rounded-lg border border-white/15">
        <CheckCircle2 size={13} class="text-blue-400 shrink-0" />
        <span class="text-[11px] font-medium">Human-governed execution</span>
      </div>
      <div class="flex items-center space-x-1.5 text-blue-200 bg-white/10 px-2.5 py-1.5 rounded-lg border border-white/15">
        <CheckCircle2 size={13} class="text-blue-400 shrink-0" />
        <span class="text-[11px] font-medium">Track outcomes and learn</span>
      </div>
    </div>
  </div>

  <!-- ========================================================================= -->
  <!-- 5 SUMMARY METRIC CARDS ROW                                                -->
  <!-- ========================================================================= -->
  <div class="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
    
    <!-- Total Recommended Actions -->
    <div class="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
      <div class="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Recommended</div>
      <div class="text-2xl font-extrabold text-slate-900 mt-1 num-tabular">{countTotal}</div>
      <div class="text-[10px] text-slate-400 mt-0.5">Recommended actions</div>
    </div>

    <!-- Critical -->
    <div
      on:click={() => priorityFilter = priorityFilter === 'critical' ? 'all' : 'critical'}
      class="bg-white rounded-xl border p-4 shadow-xs cursor-pointer transition-all {priorityFilter === 'critical' ? 'border-rose-500 ring-2 ring-rose-200' : 'border-slate-200 hover:border-rose-300'}"
    >
      <div class="flex items-center justify-between text-[11px] font-bold text-rose-700 uppercase tracking-wider">
        <span>Critical</span>
        <ShieldAlert size={14} class="text-rose-500" />
      </div>
      <div class="text-2xl font-extrabold text-rose-700 mt-1 num-tabular">{countCritical}</div>
      <div class="text-[10px] text-slate-500 mt-0.5">Potential to delay DBL &gt; 3 days</div>
    </div>

    <!-- High -->
    <div
      on:click={() => priorityFilter = priorityFilter === 'high' ? 'all' : 'high'}
      class="bg-white rounded-xl border p-4 shadow-xs cursor-pointer transition-all {priorityFilter === 'high' ? 'border-amber-500 ring-2 ring-amber-200' : 'border-slate-200 hover:border-amber-300'}"
    >
      <div class="flex items-center justify-between text-[11px] font-bold text-amber-700 uppercase tracking-wider">
        <span>High</span>
        <AlertTriangle size={14} class="text-amber-500" />
      </div>
      <div class="text-2xl font-extrabold text-amber-700 mt-1 num-tabular">{countHigh}</div>
      <div class="text-[10px] text-slate-500 mt-0.5">3&ndash;5 days impact</div>
    </div>

    <!-- Medium -->
    <div
      on:click={() => priorityFilter = priorityFilter === 'medium' ? 'all' : 'medium'}
      class="bg-white rounded-xl border p-4 shadow-xs cursor-pointer transition-all {priorityFilter === 'medium' ? 'border-blue-500 ring-2 ring-blue-200' : 'border-slate-200 hover:border-blue-300'}"
    >
      <div class="flex items-center justify-between text-[11px] font-bold text-blue-700 uppercase tracking-wider">
        <span>Medium</span>
        <Clock size={14} class="text-blue-500" />
      </div>
      <div class="text-2xl font-extrabold text-blue-700 mt-1 num-tabular">{countMedium}</div>
      <div class="text-[10px] text-slate-500 mt-0.5">1&ndash;3 days impact</div>
    </div>

    <!-- Low -->
    <div
      on:click={() => priorityFilter = priorityFilter === 'low' ? 'all' : 'low'}
      class="bg-white rounded-xl border p-4 shadow-xs cursor-pointer transition-all {priorityFilter === 'low' ? 'border-emerald-500 ring-2 ring-emerald-200' : 'border-slate-200 hover:border-emerald-300'}"
    >
      <div class="flex items-center justify-between text-[11px] font-bold text-emerald-700 uppercase tracking-wider">
        <span>Low</span>
        <CheckCircle2 size={14} class="text-emerald-500" />
      </div>
      <div class="text-2xl font-extrabold text-emerald-700 mt-1 num-tabular">{countLow}</div>
      <div class="text-[10px] text-slate-500 mt-0.5">&lt; 1 day impact</div>
    </div>

  </div>

  <!-- ========================================================================= -->
  <!-- COUNTRY & GEOGRAPHIC ACTION DISTRIBUTION                                  -->
  <!-- ========================================================================= -->
  <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
    <div class="flex items-center space-x-2.5">
      <div class="p-2 rounded-lg bg-blue-50 text-blue-600">
        <Globe size={18} />
      </div>
      <div>
        <div class="flex items-center space-x-2">
          <h3 class="text-xs font-bold text-slate-900">Action Geographic Distribution (Country Map)</h3>
          <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
            Live Country View
          </span>
        </div>
        <p class="text-[11px] text-slate-500">
          Interactive global map of critical and high-priority study actions across 6 countries
        </p>
      </div>
    </div>

    <!-- Toggle: Country Map & Table (Split) | Map Only | Table Only -->
    <div class="flex items-center space-x-1 bg-slate-100 p-1 rounded-lg text-xs font-semibold shrink-0">
      <button
        type="button"
        on:click={() => viewMode = 'split'}
        class="px-2.5 py-1.5 rounded-md transition-all flex items-center space-x-1.5 cursor-pointer {viewMode === 'split' ? 'bg-white text-blue-700 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'}"
        title="Display both Country Map and Action Table"
      >
        <Map size={13} />
        <span>Country Map &amp; Table</span>
      </button>

      <button
        type="button"
        on:click={() => viewMode = 'map'}
        class="px-2.5 py-1.5 rounded-md transition-all flex items-center space-x-1.5 cursor-pointer {viewMode === 'map' ? 'bg-white text-blue-700 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'}"
        title="Expand full country map"
      >
        <Globe size={13} />
        <span>Map Only</span>
      </button>

      <button
        type="button"
        on:click={() => viewMode = 'table'}
        class="px-2.5 py-1.5 rounded-md transition-all flex items-center space-x-1.5 cursor-pointer {viewMode === 'table' ? 'bg-white text-blue-700 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'}"
        title="Display action table only"
      >
        <FileText size={13} />
        <span>Table Only</span>
      </button>
    </div>
  </div>

  <!-- Country Map View (Active in Split or Map mode) -->
  {#if viewMode === 'split' || viewMode === 'map'}
    <div class="transition-all duration-300">
      <ActionCountryMap
        actions={$workflow.actions}
        {sites}
        bind:selectedCountry
        {selectedActionId}
        onSelectCountry={(c) => selectedCountry = c}
        onSelectAction={(id) => openDrawer(id)}
      />
    </div>
  {/if}

  <!-- ========================================================================= -->
  <!-- ACTION TABLE & CONTROLS                                                   -->
  <!-- ========================================================================= -->
  <div class="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
    
    <!-- Filter bar -->
    <div class="p-4 sm:p-5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
      
      <!-- Filter Chips -->
      <div class="flex items-center space-x-1.5 overflow-x-auto text-xs">
        <button
          on:click={() => priorityFilter = 'all'}
          class="px-3 py-1.5 rounded-lg font-semibold transition-all {priorityFilter === 'all' ? 'bg-blue-600 text-white shadow-xs' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}"
        >
          All ({countTotal})
        </button>
        <button
          on:click={() => priorityFilter = 'critical'}
          class="px-3 py-1.5 rounded-lg font-semibold transition-all {priorityFilter === 'critical' ? 'bg-rose-600 text-white shadow-xs' : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'}"
        >
          Critical ({countCritical})
        </button>
        <button
          on:click={() => priorityFilter = 'high'}
          class="px-3 py-1.5 rounded-lg font-semibold transition-all {priorityFilter === 'high' ? 'bg-amber-600 text-white shadow-xs' : 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200'}"
        >
          High ({countHigh})
        </button>
        <button
          on:click={() => priorityFilter = 'medium'}
          class="px-3 py-1.5 rounded-lg font-semibold transition-all {priorityFilter === 'medium' ? 'bg-blue-600 text-white shadow-xs' : 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200'}"
        >
          Medium ({countMedium})
        </button>
        <button
          on:click={() => priorityFilter = 'low'}
          class="px-3 py-1.5 rounded-lg font-semibold transition-all {priorityFilter === 'low' ? 'bg-emerald-600 text-white shadow-xs' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'}"
        >
          Low ({countLow})
        </button>
      </div>

      <!-- Dropdown Selectors & Search -->
      <div class="flex flex-wrap items-center gap-2 text-xs">
        <!-- Owners -->
        <select
          bind:value={ownerFilter}
          class="bg-slate-50 border border-slate-200 rounded-lg py-1.5 px-2 text-slate-700 font-medium focus:outline-hidden"
        >
          <option value="all">All owners</option>
          <option value="sarah">Dr. Sarah Lin</option>
          <option value="dupuis">Jean-Pierre Dupuis</option>
          <option value="campbell">Marcus Campbell</option>
          <option value="rostova">Elena Rostova</option>
          <option value="nair">Priya Nair</option>
          <option value="becker">Tom Becker</option>
        </select>

        <!-- Domains -->
        <select
          bind:value={domainFilter}
          class="bg-slate-50 border border-slate-200 rounded-lg py-1.5 px-2 text-slate-700 font-medium focus:outline-hidden"
        >
          <option value="all">All data domains</option>
          <option value="Safety reconciliation">Safety reconciliation</option>
          <option value="External laboratory">External laboratory</option>
          <option value="EDC / Queries">EDC / Queries</option>
          <option value="Medical coding">Medical coding</option>
          <option value="Site sign-offs">Site sign-offs</option>
          <option value="eCOA / Imaging">eCOA / Imaging</option>
        </select>

        <!-- Search -->
        <div class="relative">
          <Search size={14} class="absolute left-2.5 top-2.5 text-slate-400" />
          <input
            type="text"
            bind:value={searchQuery}
            placeholder="Search actions, sites or keywords..."
            class="text-xs bg-slate-50 border border-slate-200 rounded-lg py-1.5 pl-8 pr-3 text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-blue-500 w-48"
          />
        </div>
      </div>

    </div>

    <!-- Table Content -->
    <div class="overflow-x-auto">
      <table class="w-full text-left border-collapse text-xs">
        <thead>
          <tr class="bg-slate-50/80 text-slate-500 border-b border-slate-200 text-[10px] font-bold uppercase tracking-wider">
            <th class="py-3 px-3 w-8">
              <input type="checkbox" class="rounded text-blue-600 focus:ring-blue-500" />
            </th>
            <th class="py-3 px-3">Priority</th>
            <th class="py-3 px-4">Action</th>
            <th class="py-3 px-3">Site / Scope</th>
            <th class="py-3 px-3">Owner</th>
            <th class="py-3 px-3">Due date</th>
            <th class="py-3 px-3 text-right">Est. Impact (days)</th>
            <th class="py-3 px-3">Status</th>
            <th class="py-3 px-3 text-right"></th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100 font-medium text-slate-700">
          {#each filteredActions as action}
            <tr
              class="hover:bg-blue-50/40 transition-colors cursor-pointer group {selectedActionId === action.id ? 'bg-blue-50/20' : ''}"
              on:click={() => openDrawer(action.id)}
            >
              <td class="py-3.5 px-3">
                <input
                  type="checkbox"
                  class="rounded text-blue-600 focus:ring-blue-500"
                  on:click|stopPropagation
                />
              </td>
              <td class="py-3.5 px-3">
                <span class="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border {getPriorityBadge(action.priority)}">
                  {action.priority}
                </span>
              </td>
              <td class="py-3.5 px-4 font-semibold text-slate-900">
                <div class="group-hover:text-blue-600 transition-colors">{action.title}</div>
                <div class="text-[10px] font-normal text-slate-400">{action.id}</div>
              </td>
              <td class="py-3.5 px-3 text-slate-700 font-medium">
                {action.site || action.scope}
              </td>
              <td class="py-3.5 px-3 text-slate-700">
                {action.owner}
              </td>
              <td class="py-3.5 px-3 font-mono text-[11px] text-slate-600">
                {action.dueDate}
              </td>
              <td class="py-3.5 px-3 text-right font-extrabold text-emerald-600 font-mono text-xs">
                {action.estImpactDays !== undefined ? `${action.estImpactDays.toFixed(1)}` : `${action.daysSaved.toFixed(1)}`}
              </td>
              <td class="py-3.5 px-3">
                <span class="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border {getStatusBadge(action.status)}">
                  {action.status}
                </span>
              </td>
              <td class="py-3.5 px-3 text-right">
                <ArrowRight size={14} class="text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all inline-block" />
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>

    <!-- Table footer -->
    <div class="p-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
      <div>
        Showing <strong class="text-slate-800">1&ndash;{filteredActions.length}</strong> of <strong class="text-slate-800">{countTotal}</strong> actions
      </div>
      <button
        on:click={() => onSelectTab('simulator')}
        class="text-blue-600 font-bold hover:underline flex items-center space-x-1"
      >
        <span>Test scenario in What-if Simulator</span>
        <ArrowRight size={13} />
      </button>
    </div>

  </div>

  <!-- ========================================================================= -->
  <!-- ACTION DETAIL DRAWER (MATCHING SCREENSHOT 6 & 7)                          -->
  <!-- ========================================================================= -->
  {#if selectedActionId && selectedAction}
    {@const act = selectedAction}
    <div class="fixed inset-0 z-50 flex justify-end">
      <!-- Backdrop -->
      <div
        class="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity"
        on:click={closeDrawer}
      ></div>

      <!-- Drawer Content -->
      <aside class="relative w-full max-w-xl bg-white h-full shadow-2xl border-l border-slate-200 overflow-y-auto flex flex-col z-10">
        
        <!-- Drawer Header -->
        <div class="p-6 border-b border-slate-200 bg-slate-50/70 sticky top-0 bg-white/95 backdrop-blur-md z-10 flex items-start justify-between">
          <div>
            <div class="flex items-center space-x-2">
              <span class="px-2 py-0.5 rounded text-[10px] font-bold border {getPriorityBadge(act.priority)}">
                {act.priority}
              </span>
              <span class="text-xs font-bold text-slate-500">{act.id}</span>
            </div>
            <h2 class="text-xl font-extrabold text-slate-900 mt-1">
              {act.title}
            </h2>
          </div>

          <button
            on:click={closeDrawer}
            class="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
            aria-label="Close action drawer"
          >
            <X size={20} />
          </button>
        </div>

        <!-- 4 Drawer Tabs: Details | Evidence | Subjects | History -->
        <div class="flex border-b border-slate-200 px-6 text-xs font-bold text-slate-600">
          <button
            on:click={() => drawerTab = 'details'}
            class="py-3 px-3 border-b-2 transition-colors {drawerTab === 'details' ? 'border-blue-600 text-blue-600 font-extrabold' : 'border-transparent hover:text-slate-900'}"
          >
            Details
          </button>
          <button
            on:click={() => drawerTab = 'evidence'}
            class="py-3 px-3 border-b-2 transition-colors {drawerTab === 'evidence' ? 'border-blue-600 text-blue-600 font-extrabold' : 'border-transparent hover:text-slate-900'}"
          >
            Evidence
          </button>
          <button
            on:click={() => drawerTab = 'subjects'}
            class="py-3 px-3 border-b-2 transition-colors {drawerTab === 'subjects' ? 'border-blue-600 text-blue-600 font-extrabold' : 'border-transparent hover:text-slate-900'}"
          >
            Subjects (2)
          </button>
          <button
            on:click={() => drawerTab = 'history'}
            class="py-3 px-3 border-b-2 transition-colors {drawerTab === 'history' ? 'border-blue-600 text-blue-600 font-extrabold' : 'border-transparent hover:text-slate-900'}"
          >
            History
          </button>
        </div>

        <!-- Drawer Body -->
        <div class="p-6 space-y-6 flex-1 text-xs text-slate-700">
          
          {#if drawerTab === 'details'}
            
            <!-- AI Recommendation Card -->
            <div class="p-4 rounded-xl bg-blue-50/80 border border-blue-200 space-y-2">
              <div class="flex items-center space-x-1.5 text-blue-900 font-bold text-xs">
                <Sparkles size={15} class="text-blue-600" />
                <span>AI Recommendation</span>
              </div>
              <p class="text-xs text-blue-900 leading-relaxed font-medium">
                {act.recommendation || act.rationale}
              </p>
            </div>

            <!-- Expected Impact & Confidence -->
            <div class="grid grid-cols-2 gap-4">
              <div class="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <span class="text-[10px] text-slate-400 font-bold uppercase block">Expected impact</span>
                <div class="text-2xl font-extrabold text-emerald-600 mt-0.5 num-tabular">
                  {act.estImpactDays !== undefined ? `${act.estImpactDays.toFixed(1)} days` : `${act.daysSaved.toFixed(1)} days`}
                </div>
                <span class="text-[10px] text-slate-500">(reduction in forecast delay)</span>
              </div>

              <div class="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <span class="text-[10px] text-slate-400 font-bold uppercase block">Confidence</span>
                <div class="text-base font-extrabold text-slate-900 mt-1 flex items-center space-x-1.5">
                  <CheckCircle2 size={16} class="text-emerald-500" />
                  <span>{act.confidence || 'High'}</span>
                </div>
                <span class="text-[10px] text-slate-500">Based on historical study priors</span>
              </div>
            </div>

            <!-- Metadata Key-Value List with [Change] / [View] links -->
            <div class="border border-slate-200 rounded-xl p-4 bg-slate-50/50 space-y-3.5">
              
              <!-- Owner -->
              <div class="flex items-center justify-between">
                <div>
                  <span class="text-[10px] uppercase font-bold text-slate-400 block">Owner</span>
                  <div class="text-xs font-bold text-slate-900 mt-0.5 flex items-center space-x-1.5">
                    <UserCheck size={14} class="text-blue-600" />
                    <span>{act.owner}</span>
                  </div>
                </div>
                <button
                  on:click={() => startModify(act)}
                  class="text-xs text-blue-600 hover:text-blue-800 font-bold"
                >
                  Change
                </button>
              </div>

              <!-- Target Date -->
              <div class="flex items-center justify-between pt-2 border-t border-slate-200/80">
                <div>
                  <span class="text-[10px] uppercase font-bold text-slate-400 block">Target date</span>
                  <div class="font-mono text-xs font-bold text-slate-900 mt-0.5">{act.dueDate}</div>
                </div>
                <button
                  on:click={() => startModify(act)}
                  class="text-xs text-blue-600 hover:text-blue-800 font-bold"
                >
                  Change
                </button>
              </div>

              <!-- Affected Items -->
              <div class="flex items-center justify-between pt-2 border-t border-slate-200/80">
                <div>
                  <span class="text-[10px] uppercase font-bold text-slate-400 block">Affected items</span>
                  <div class="text-xs font-semibold text-slate-800 mt-0.5">{act.affectedItems || '2 records'}</div>
                </div>
                <button
                  on:click={() => drawerTab = 'evidence'}
                  class="text-xs text-blue-600 hover:text-blue-800 font-bold"
                >
                  View
                </button>
              </div>

              <!-- Dependencies -->
              <div class="pt-2 border-t border-slate-200/80">
                <span class="text-[10px] uppercase font-bold text-slate-400 block">Dependencies</span>
                <div class="text-xs font-medium text-slate-700 mt-0.5">{act.dependencies || 'None'}</div>
              </div>

              <!-- Rationale -->
              <div class="pt-2 border-t border-slate-200/80">
                <span class="text-[10px] uppercase font-bold text-slate-400 block">Rationale</span>
                <p class="text-xs text-slate-700 mt-0.5 leading-relaxed">{act.rationale}</p>
                <button
                  on:click={() => drawerTab = 'evidence'}
                  class="text-[11px] text-blue-600 hover:text-blue-800 font-bold mt-1 inline-block"
                >
                  View model logic &rarr;
                </button>
              </div>

            </div>

            <!-- Proposed Communication (Preview Email) -->
            <div class="p-4 rounded-xl border border-blue-200 bg-blue-50/50 space-y-2">
              <div class="flex items-center justify-between">
                <div class="flex items-center space-x-1.5 text-xs font-bold text-blue-900">
                  <Mail size={15} class="text-blue-600" />
                  <span>Proposed communication (for approval)</span>
                </div>
                <button
                  on:click={() => showEmailPreview = !showEmailPreview}
                  class="text-xs text-blue-600 hover:text-blue-800 font-bold cursor-pointer"
                >
                  {showEmailPreview ? 'Hide preview' : 'Preview'}
                </button>
              </div>

              <p class="text-xs text-blue-800">
                Draft email to Safety team and site with list of outstanding items.
              </p>

              {#if showEmailPreview}
                <div class="mt-2.5 p-3 rounded-lg bg-white border border-blue-200 text-slate-700 text-[11px] space-y-1.5 font-mono">
                  <div><strong>To:</strong> sarah.lin@biopharma.org, PI-boston@bmc.edu</div>
                  <div><strong>Subject:</strong> [CRITICAL] Urgent SAE Reconciliation &ndash; Study CA-209-301 Site 104</div>
                  <div class="pt-2 border-t border-slate-100 text-slate-600 font-sans">
                    Dear Dr. Lin and Boston Clinical Operations,<br/><br/>
                    Our DBLock decision engine has detected 2 open SAE discordances (Subjects 104-003 and 104-012) currently blocking the planned pharmacovigilance safety freeze on 2026-11-02.<br/><br/>
                    Please review the discharge summary attachments and confirm whether onset dates can be reconciled in Rave EDC today.
                  </div>
                </div>
              {/if}
            </div>

            <!-- In-Drawer Modify / Reject Form -->
            {#if isModifying}
              <div class="p-4 rounded-xl bg-amber-50 border border-amber-200 space-y-3">
                <div class="text-xs font-bold text-amber-900">Modify Recommendation Assignment</div>
                <div class="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <label class="block text-[10px] font-bold text-slate-500 uppercase">Assigned Owner</label>
                    <input
                      type="text"
                      bind:value={editOwner}
                      class="w-full mt-1 p-2 bg-white border border-slate-300 rounded-md text-slate-800"
                    />
                  </div>
                  <div>
                    <label class="block text-[10px] font-bold text-slate-500 uppercase">Target Due Date</label>
                    <input
                      type="date"
                      bind:value={editDate}
                      class="w-full mt-1 p-2 bg-white border border-slate-300 rounded-md text-slate-800"
                    />
                  </div>
                </div>
                <div class="flex items-center space-x-2 pt-2">
                  <button
                    on:click={() => saveModify(act)}
                    class="px-3 py-1.5 bg-blue-600 text-white rounded-md font-bold text-xs hover:bg-blue-700"
                  >
                    Confirm &amp; Assign
                  </button>
                  <button
                    on:click={() => isModifying = false}
                    class="px-3 py-1.5 bg-slate-200 text-slate-700 rounded-md font-semibold text-xs hover:bg-slate-300"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            {/if}

            {#if isRejecting}
              <div class="p-4 rounded-xl bg-rose-50 border border-rose-200 space-y-3">
                <div class="text-xs font-bold text-rose-900">Record Rejection Rationale</div>
                <textarea
                  bind:value={rejectReason}
                  placeholder="State the scientific, medical or operational reason for not executing this recommendation..."
                  class="w-full p-2 bg-white border border-rose-300 rounded-md text-xs text-slate-800 h-20"
                ></textarea>
                <div class="flex items-center space-x-2">
                  <button
                    disabled={!rejectReason.trim()}
                    on:click={() => submitReject(act)}
                    class="px-3 py-1.5 bg-rose-600 text-white rounded-md font-bold text-xs hover:bg-rose-700 disabled:opacity-40"
                  >
                    Confirm Rejection
                  </button>
                  <button
                    on:click={() => isRejecting = false}
                    class="px-3 py-1.5 bg-slate-200 text-slate-700 rounded-md font-semibold text-xs hover:bg-slate-300"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            {/if}

          {:else if drawerTab === 'evidence'}
            <!-- Evidence Tab -->
            <div class="space-y-4">
              <h3 class="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Reconciliation Discrepancy Records
              </h3>

              <div class="border border-slate-200 rounded-xl overflow-hidden text-xs">
                <div class="p-3 bg-slate-50 font-bold border-b border-slate-200 text-slate-800 flex justify-between">
                  <span>Subject 104-003 &middot; Case #2026-088</span>
                  <span class="text-rose-600">Seriousness: Hospitalization</span>
                </div>
                <div class="p-3.5 space-y-2 bg-white">
                  <div class="grid grid-cols-2 gap-2 text-[11px]">
                    <div><strong>Rave EDC:</strong> Febrile Neutropenia (Grade 3)</div>
                    <div><strong>Argus Safety:</strong> Sepsis / Septic Shock</div>
                  </div>
                  <div class="grid grid-cols-2 gap-2 text-[11px]">
                    <div><strong>EDC Onset:</strong> 2026-10-18</div>
                    <div><strong>Argus Onset:</strong> 2026-10-14</div>
                  </div>
                  <div class="text-[10px] text-slate-500 pt-1 border-t border-slate-100">
                    Discordance prevents unblinding and medical safety sign-off.
                  </div>
                </div>
              </div>

              <div class="border border-slate-200 rounded-xl overflow-hidden text-xs">
                <div class="p-3 bg-slate-50 font-bold border-b border-slate-200 text-slate-800 flex justify-between">
                  <span>Subject 104-012 &middot; Case #2026-089</span>
                  <span class="text-rose-600">Seriousness: Fatal</span>
                </div>
                <div class="p-3.5 space-y-2 bg-white">
                  <div class="grid grid-cols-2 gap-2 text-[11px]">
                    <div><strong>Rave EDC:</strong> Disease Progression (Primary Cause)</div>
                    <div><strong>Argus Safety:</strong> Acute Cardiac Arrest</div>
                  </div>
                  <div class="text-[10px] text-slate-500 pt-1 border-t border-slate-100">
                    Death narrative pending final hospital autopsy report reconciliation.
                  </div>
                </div>
              </div>
            </div>

          {:else if drawerTab === 'subjects'}
            <!-- Subjects Tab -->
            <div class="space-y-3">
              <div class="p-4 rounded-xl border border-slate-200 bg-white space-y-2">
                <div class="flex justify-between items-center">
                  <span class="font-extrabold text-slate-900 text-xs">Subject 104-003</span>
                  <span class="px-2 py-0.5 rounded bg-rose-100 text-rose-800 text-[10px] font-bold">High Risk</span>
                </div>
                <div class="text-xs text-slate-600">Cohort 2 &middot; 2nd Line NSCLC &middot; Age: 64 &middot; Enrolled: 2024-03-12</div>
                <div class="p-2 bg-slate-50 rounded text-[11px] text-slate-700 space-y-1">
                  <div>&bull; 1 open SAE reconciliation discrepancy</div>
                  <div>&bull; 2 primary RECIST queries open for &gt;18 days</div>
                </div>
              </div>

              <div class="p-4 rounded-xl border border-slate-200 bg-white space-y-2">
                <div class="flex justify-between items-center">
                  <span class="font-extrabold text-slate-900 text-xs">Subject 104-012</span>
                  <span class="px-2 py-0.5 rounded bg-rose-100 text-rose-800 text-[10px] font-bold">Critical Risk</span>
                </div>
                <div class="text-xs text-slate-600">Cohort 1 &middot; 2nd Line NSCLC &middot; Age: 71 &middot; Enrolled: 2024-02-04</div>
                <div class="p-2 bg-slate-50 rounded text-[11px] text-slate-700 space-y-1">
                  <div>&bull; Unresolved death narrative discordance</div>
                  <div>&bull; Central lab ctDNA specimen accession verification pending</div>
                </div>
              </div>
            </div>

          {:else}
            <!-- History Tab -->
            <div class="space-y-3">
              <h3 class="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Audit Trail &middot; Governance Log
              </h3>
              {#if $workflow.history.length}
                <div class="space-y-2 text-xs">
                  {#each $workflow.history as item}
                    <div class="p-3 bg-slate-50 rounded-lg border border-slate-200">
                      <div class="flex justify-between text-[10px] text-slate-400 font-mono">
                        <span>{item.when}</span>
                        <span class="text-emerald-700 font-bold">GxP Verified</span>
                      </div>
                      <p class="text-slate-800 font-medium mt-1">{item.message}</p>
                    </div>
                  {/each}
                </div>
              {:else}
                <div class="text-slate-400 text-xs">No user actions recorded yet in this session.</div>
              {/if}
            </div>

          {/if}

        </div>

        <!-- Drawer Action Footer (Buttons matching Screenshot 6) -->
        <div class="p-5 bg-slate-50 border-t border-slate-200 sticky bottom-0 space-y-3">
          
          <div class="flex items-center space-x-2">
            {#if act.status === 'Accepted'}
              <div class="flex-1 py-2.5 px-4 rounded-lg bg-emerald-600 text-white font-bold text-xs flex items-center justify-center space-x-1.5 shadow-xs">
                <Check size={16} />
                <span>Assigned to {act.owner}</span>
              </div>
            {:else if act.status === 'Rejected'}
              <div class="flex-1 py-2.5 px-4 rounded-lg bg-slate-400 text-white font-bold text-xs flex items-center justify-center space-x-1.5 shadow-xs">
                <Ban size={16} />
                <span>Recommendation Rejected</span>
              </div>
            {:else}
              <button
                on:click={() => approveAction(act)}
                class="flex-1 py-2.5 px-4 rounded-lg bg-blue-600 text-white font-bold text-xs hover:bg-blue-700 transition-colors shadow-xs flex items-center justify-center space-x-1.5"
              >
                <span>Approve and assign</span>
              </button>
              <button
                on:click={() => startModify(act)}
                class="py-2.5 px-4 rounded-lg border border-slate-300 bg-white text-slate-700 font-semibold text-xs hover:bg-slate-50 transition-colors"
              >
                Modify
              </button>
              <button
                on:click={() => isRejecting = true}
                class="py-2.5 px-4 rounded-lg border border-slate-300 bg-white text-rose-600 font-semibold text-xs hover:bg-rose-50 transition-colors"
              >
                Reject
              </button>
            {/if}
          </div>

          <!-- Governance Disclaimer Note -->
          <div class="flex items-start space-x-2 text-[10px] text-slate-400">
            <Lock size={12} class="shrink-0 mt-0.5 text-slate-400" />
            <p>
              Human approval required. DBLock AI does not modify clinical data or send external communications without authorization.
            </p>
          </div>

        </div>

      </aside>
    </div>
  {/if}

</div>
