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
    MapPin,
    PauseCircle
  } from '@lucide/svelte';

  export let onSelectTab: (tab: string) => void;
  export let sites: any[] = [];
  export let onSelectSite: ((id: string) => void) | undefined = undefined;

  // Focused default view mode: 'table' (does not repeat geographic risk map from Sites & Risks unless toggled)
  let viewMode: 'table' | 'split' | 'map' = 'table';
  let selectedCountry: string = 'all';

  // Filter state
  let priorityFilter = 'all';
  let ownerFilter = 'all';
  let domainFilter = 'all';
  let statusFilter = 'all';
  let searchQuery = '';

  // Selected Action Drawer state (DO NOT REMOVE FOR NOW per red note)
  let selectedActionId: string | null = 'ACT-001';
  let drawerTab = 'details'; // 'details' | 'evidence' | 'subjects' | 'history'

  // Decision states for the 5 buttons: Accept recommendation | Modify | Assign to another owner | Defer | Reject with reason
  let isModifying = false;
  let isReassigning = false;
  let isDeferring = false;
  let isRejecting = false;
  let editOwner = '';
  let editDate = '';
  let deferDate = '2026-11-08';
  let deferNote = 'Deferred pending site coordinator availability';
  let rejectReason = '';
  let showEmailPreview = false;

  const availableOwners = [
    'Dr. Sarah Lin (Safety Lead)',
    'Jean-Pierre Dupuis (Vendor Ops)',
    'Marcus Campbell (Site 104 CRA)',
    'Elena Rostova (Lead CDM)',
    'Priya Nair (Coding Specialist)',
    'Tom Becker (TMF Lead)'
  ];

  $: selectedAction = $workflow.actions.find(a => a.id === selectedActionId) || $workflow.actions[0];

  function openDrawer(actionId: string) {
    selectedActionId = actionId;
    drawerTab = 'details';
    isModifying = false;
    isReassigning = false;
    isDeferring = false;
    isRejecting = false;
    showEmailPreview = false;
  }

  function closeDrawer() {
    selectedActionId = null;
  }

  // 1. Accept recommendation
  function acceptRecommendation(act: DemoAction) {
    updateAction(act.id, { status: 'Accepted' }, `Accepted recommendation ${act.id} (${act.title}) assigned to ${act.owner}`);
  }

  // 2. Modify
  function startModify(act: DemoAction) {
    isModifying = true;
    isReassigning = false;
    isDeferring = false;
    isRejecting = false;
    editOwner = act.owner;
    editDate = act.dueDate;
  }

  function saveModify(act: DemoAction) {
    if (!editOwner.trim() || !editDate) return;
    updateAction(act.id, { owner: editOwner.trim(), dueDate: editDate, status: 'Accepted' }, `Modified ${act.id}: Owner set to ${editOwner.trim()}, Target date ${editDate}`);
    isModifying = false;
  }

  // 3. Assign to another owner
  function startReassign(act: DemoAction) {
    isReassigning = true;
    isModifying = false;
    isDeferring = false;
    isRejecting = false;
    editOwner = act.owner;
  }

  function saveReassign(act: DemoAction) {
    if (!editOwner.trim()) return;
    updateAction(act.id, { owner: editOwner.trim(), status: 'Accepted' }, `Reassigned ${act.id} to new owner: ${editOwner.trim()}`);
    isReassigning = false;
  }

  // 4. Defer
  function startDefer() {
    isDeferring = true;
    isModifying = false;
    isReassigning = false;
    isRejecting = false;
  }

  function saveDefer(act: DemoAction) {
    updateAction(act.id, { status: 'Deferred', dueDate: deferDate, notes: deferNote }, `Deferred ${act.id} until ${deferDate}: ${deferNote}`);
    isDeferring = false;
  }

  // 5. Reject with reason
  function startReject() {
    isRejecting = true;
    isModifying = false;
    isReassigning = false;
    isDeferring = false;
  }

  function submitReject(act: DemoAction) {
    if (!rejectReason.trim()) return;
    updateAction(act.id, { status: 'Rejected', reason: rejectReason.trim() }, `Rejected ${act.id} with reason: ${rejectReason.trim()}`);
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
    if (status === 'Deferred') return 'bg-amber-50 text-amber-700 border-amber-200';
    if (status === 'Rejected') return 'bg-slate-100 text-slate-500 border-slate-200';
    return 'bg-blue-50 text-blue-700 border-blue-200';
  }
</script>

<div class="space-y-5">

  <!-- ========================================================================= -->
  <!-- HERO BANNER: ACTION DECISION WORKBENCH + RESPONSIBLE AI GOVERNANCE        -->
  <!-- ========================================================================= -->
  <div class="rounded-2xl bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950 text-white p-6 shadow-md border border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
    <div class="max-w-2xl">
      <span class="text-[10px] font-extrabold uppercase tracking-widest text-blue-300">
        6. ACTION DECISION WORKBENCH &middot; HUMAN-IN-THE-LOOP GOVERNANCE
      </span>
      <h1 class="text-2xl sm:text-3xl font-extrabold text-white mt-1 tracking-tight">
        Turn insights into human-approved actions.
      </h1>
      <p class="text-xs sm:text-sm text-slate-300 mt-1.5 leading-relaxed">
        Aligned directly with the study's leading potential delay drivers without repeating risk screens. Select any recommendation to <strong>Accept, Modify, Assign to another owner, Defer, or Reject with reason</strong>.
      </p>
    </div>

    <!-- Governance Requirement Callout (Exact Manager Wording from Image 2) -->
    <div class="shrink-0 p-4 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 max-w-md text-xs text-blue-100 space-y-1.5">
      <div class="flex items-center space-x-2 font-extrabold text-white">
        <Lock size={15} class="text-emerald-400 shrink-0" />
        <span>Governance Requirement &middot; Study Team Final Decision</span>
      </div>
      <p class="text-[11px] text-white font-semibold leading-relaxed">
        The study team makes the final decision. DBLock AI does not modify clinical data or send external communications without authorised human approval.
      </p>
    </div>
  </div>

  <!-- ========================================================================= -->
  <!-- TOP DELAY DRIVERS <-> ACTION ALIGNMENT STRIP (Image 2 Blue Requirement)   -->
  <!-- Keeps screen focused on driver-to-action alignment without repeating risk -->
  <!-- ========================================================================= -->
  <div class="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
    <div class="flex items-center justify-between mb-2.5">
      <span class="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
        Top Delay Drivers Aligned to Recommended Actions
      </span>
      <span class="text-[11px] text-slate-500">Click any driver card to open its linked action</span>
    </div>
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
      <button
        type="button"
        on:click={() => openDrawer('ACT-001')}
        class="p-3 rounded-xl border text-left transition-all cursor-pointer {selectedActionId === 'ACT-001' ? 'border-rose-500 bg-rose-50/40' : 'border-slate-200 hover:border-blue-300 bg-slate-50/50'}"
      >
        <div class="flex justify-between font-bold text-slate-900">
          <span>1. Safety Recon (35%)</span>
          <span class="text-emerald-600 font-mono">-3.0d</span>
        </div>
        <div class="text-[11px] text-slate-700 font-semibold mt-1">ACT-001: Resolve 2 SAE discrepancies (Site 104)</div>
      </button>

      <button
        type="button"
        on:click={() => openDrawer('ACT-002')}
        class="p-3 rounded-xl border text-left transition-all cursor-pointer {selectedActionId === 'ACT-002' ? 'border-rose-500 bg-rose-50/40' : 'border-slate-200 hover:border-blue-300 bg-slate-50/50'}"
      >
        <div class="flex justify-between font-bold text-slate-900">
          <span>2. Lab Transfer (30%)</span>
          <span class="text-emerald-600 font-mono">-1.8d</span>
        </div>
        <div class="text-[11px] text-slate-700 font-semibold mt-1">ACT-002: Escalate LabCorp ctDNA batch #LXB-8921</div>
      </button>

      <button
        type="button"
        on:click={() => openDrawer('ACT-003')}
        class="p-3 rounded-xl border text-left transition-all cursor-pointer {selectedActionId === 'ACT-003' ? 'border-amber-500 bg-amber-50/40' : 'border-slate-200 hover:border-blue-300 bg-slate-50/50'}"
      >
        <div class="flex justify-between font-bold text-slate-900">
          <span>3. Ageing Queries (22%)</span>
          <span class="text-emerald-600 font-mono">-1.2d</span>
        </div>
        <div class="text-[11px] text-slate-700 font-semibold mt-1">ACT-003: Resolve 5 RECIST endpoint queries (Site 317)</div>
      </button>

      <button
        type="button"
        on:click={() => openDrawer('ACT-006')}
        class="p-3 rounded-xl border text-left transition-all cursor-pointer {selectedActionId === 'ACT-006' ? 'border-blue-500 bg-blue-50/40' : 'border-slate-200 hover:border-blue-300 bg-slate-50/50'}"
      >
        <div class="flex justify-between font-bold text-slate-900">
          <span>4. PI Sign-offs (13%)</span>
          <span class="text-emerald-600 font-mono">-0.9d</span>
        </div>
        <div class="text-[11px] text-slate-700 font-semibold mt-1">ACT-006: Conduct PI batch sign-off session (Site 405)</div>
      </button>
    </div>
  </div>

  <!-- ========================================================================= -->
  <!-- ACTION TABLE & CONTROLS                                                   -->
  <!-- ========================================================================= -->
  <div class="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
    
    <!-- Filter bar -->
    <div class="p-4 sm:p-5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
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

      <div class="flex flex-wrap items-center gap-2 text-xs">
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
        </select>

        <div class="relative">
          <Search size={14} class="absolute left-2.5 top-2.5 text-slate-400" />
          <input
            type="text"
            bind:value={searchQuery}
            placeholder="Search actions, sites or owners..."
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
            <th class="py-3 px-3">Priority</th>
            <th class="py-3 px-4">Recommended Action</th>
            <th class="py-3 px-3">Aligned Delay Driver</th>
            <th class="py-3 px-3">Site / Scope</th>
            <th class="py-3 px-3">Assigned Owner</th>
            <th class="py-3 px-3">Target Date</th>
            <th class="py-3 px-3 text-right">Potential DBL Shift</th>
            <th class="py-3 px-3">Decision Status</th>
            <th class="py-3 px-3 text-right">Review</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100 font-medium text-slate-700">
          {#each filteredActions as action}
            <tr
              class="hover:bg-blue-50/40 transition-colors cursor-pointer group {selectedActionId === action.id ? 'bg-blue-50/20' : ''}"
              on:click={() => openDrawer(action.id)}
            >
              <td class="py-3.5 px-3">
                <span class="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border {getPriorityBadge(action.priority)}">
                  {action.priority}
                </span>
              </td>
              <td class="py-3.5 px-4 font-semibold text-slate-900">
                <div class="group-hover:text-blue-600 transition-colors">{action.title}</div>
                <div class="text-[10px] font-normal text-slate-400">{action.id}</div>
              </td>
              <td class="py-3.5 px-3 text-slate-600">
                {action.domain || 'Critical Path'}
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
                -{action.estImpactDays !== undefined ? `${action.estImpactDays.toFixed(1)}` : `${action.daysSaved.toFixed(1)}`}d
              </td>
              <td class="py-3.5 px-3">
                <span class="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border {getStatusBadge(action.status)}">
                  {action.status}
                </span>
              </td>
              <td class="py-3.5 px-3 text-right">
                <span class="text-blue-600 font-bold text-[11px] group-hover:underline">Decide &rarr;</span>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>

    <!-- Table footer -->
    <div class="p-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
      <div>
        Showing <strong class="text-slate-800">1&ndash;{filteredActions.length}</strong> of <strong class="text-slate-800">{countTotal}</strong> actions &middot; Study team makes the final decision
      </div>
      <button
        on:click={() => onSelectTab('simulator')}
        class="text-blue-600 font-bold hover:underline flex items-center space-x-1"
      >
        <span>Simulate combined impact in Scenarios</span>
        <ArrowRight size={13} />
      </button>
    </div>

  </div>

  <!-- ========================================================================= -->
  <!-- ACTION DETAIL DRAWER (Retained per Red Note, with all 5 Decision Buttons) -->
  <!-- ========================================================================= -->
  {#if selectedActionId && selectedAction}
    {@const act = selectedAction}
    <div class="fixed inset-0 z-50 flex justify-end">
      <div
        class="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity"
        on:click={closeDrawer}
        on:keydown={(e) => e.key === 'Escape' && closeDrawer()}
        role="button"
        tabindex="0"
        aria-label="Close action drawer backdrop"
      ></div>

      <aside class="relative w-full max-w-xl bg-white h-full shadow-2xl border-l border-slate-200 overflow-y-auto flex flex-col z-10">
        
        <!-- Drawer Header -->
        <div class="p-6 border-b border-slate-200 sticky top-0 bg-white/95 backdrop-blur-md z-10 flex items-start justify-between">
          <div>
            <div class="flex items-center space-x-2">
              <span class="px-2 py-0.5 rounded text-[10px] font-bold border {getPriorityBadge(act.priority)}">
                {act.priority}
              </span>
              <span class="text-xs font-bold text-slate-500">{act.id}</span>
              <span class="px-2 py-0.5 rounded text-[10px] font-bold border {getStatusBadge(act.status)}">
                {act.status}
              </span>
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

        <!-- 4 Drawer Tabs -->
        <div class="flex border-b border-slate-200 px-6 text-xs font-bold text-slate-600">
          <button
            on:click={() => drawerTab = 'details'}
            class="py-3 px-3 border-b-2 transition-colors {drawerTab === 'details' ? 'border-blue-600 text-blue-600 font-extrabold' : 'border-transparent hover:text-slate-900'}"
          >
            Details &amp; Decision
          </button>
          <button
            on:click={() => drawerTab = 'evidence'}
            class="py-3 px-3 border-b-2 transition-colors {drawerTab === 'evidence' ? 'border-blue-600 text-blue-600 font-extrabold' : 'border-transparent hover:text-slate-900'}"
          >
            Supporting Records
          </button>
          <button
            on:click={() => drawerTab = 'history'}
            class="py-3 px-3 border-b-2 transition-colors {drawerTab === 'history' ? 'border-blue-600 text-blue-600 font-extrabold' : 'border-transparent hover:text-slate-900'}"
          >
            Decision Audit Log ({$workflow.history.length})
          </button>
        </div>

        <!-- Drawer Body -->
        <div class="p-6 space-y-5 flex-1 text-xs text-slate-700">
          
          {#if drawerTab === 'details'}
            <div class="p-4 rounded-xl bg-blue-50/80 border border-blue-200 space-y-1.5">
              <div class="flex items-center space-x-1.5 text-blue-900 font-bold text-xs">
                <Sparkles size={15} class="text-blue-600" />
                <span>AI Recommendation</span>
              </div>
              <p class="text-xs text-blue-900 leading-relaxed font-medium">
                {act.recommendation || act.rationale}
              </p>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div class="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <span class="text-[10px] text-slate-400 font-bold uppercase block">Potential DBL Date Shift</span>
                <div class="text-2xl font-extrabold text-emerald-600 mt-0.5 num-tabular">
                  -{act.estImpactDays !== undefined ? `${act.estImpactDays.toFixed(1)} days` : `${act.daysSaved.toFixed(1)} days`}
                </div>
                <span class="text-[10px] text-slate-500">Moves potential DBL closer to 15 Dec target</span>
              </div>

              <div class="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <span class="text-[10px] text-slate-400 font-bold uppercase block">Confidence</span>
                <div class="text-base font-extrabold text-slate-900 mt-1 flex items-center space-x-1.5">
                  <CheckCircle2 size={16} class="text-emerald-500" />
                  <span>{act.confidence || 'High'}</span>
                </div>
                <span class="text-[10px] text-slate-500">Based on 48 historical oncology studies</span>
              </div>
            </div>

            <div class="border border-slate-200 rounded-xl p-4 bg-slate-50/50 space-y-3">
              <div class="flex items-center justify-between">
                <div>
                  <span class="text-[10px] uppercase font-bold text-slate-400 block">Assigned Owner</span>
                  <div class="text-xs font-bold text-slate-900 mt-0.5 flex items-center space-x-1.5">
                    <UserCheck size={14} class="text-blue-600" />
                    <span>{act.owner}</span>
                  </div>
                </div>
                <button on:click={() => startReassign(act)} class="text-xs text-blue-600 hover:text-blue-800 font-bold cursor-pointer">
                  Assign to another owner
                </button>
              </div>

              <div class="flex items-center justify-between pt-2 border-t border-slate-200/80">
                <div>
                  <span class="text-[10px] uppercase font-bold text-slate-400 block">Target Due Date</span>
                  <div class="font-mono text-xs font-bold text-slate-900 mt-0.5">{act.dueDate}</div>
                </div>
                <button on:click={() => startModify(act)} class="text-xs text-blue-600 hover:text-blue-800 font-bold cursor-pointer">
                  Modify
                </button>
              </div>

              <div class="pt-2 border-t border-slate-200/80">
                <span class="text-[10px] uppercase font-bold text-slate-400 block">Affected Items &amp; Rationale</span>
                <div class="text-xs font-semibold text-slate-800 mt-0.5">{act.affectedItems || '2 records'}</div>
                <p class="text-xs text-slate-600 mt-1 leading-relaxed">{act.rationale}</p>
              </div>
            </div>

            <!-- Proposed Communication (Requires Human Approval) -->
            <div class="p-4 rounded-xl border border-blue-200 bg-blue-50/50 space-y-2">
              <div class="flex items-center justify-between">
                <div class="flex items-center space-x-1.5 text-xs font-bold text-blue-900">
                  <Mail size={15} class="text-blue-600" />
                  <span>Proposed external communication (Requires human approval)</span>
                </div>
                <button
                  on:click={() => showEmailPreview = !showEmailPreview}
                  class="text-xs text-blue-600 hover:text-blue-800 font-bold cursor-pointer"
                >
                  {showEmailPreview ? 'Hide draft' : 'Preview draft'}
                </button>
              </div>
              <p class="text-[11px] text-blue-800">
                No communication is sent until authorised by the study team.
              </p>
              {#if showEmailPreview}
                <div class="mt-2 p-3 rounded-lg bg-white border border-blue-200 text-slate-700 text-[11px] space-y-1 font-mono">
                  <div><strong>To:</strong> {act.owner}</div>
                  <div><strong>Subject:</strong> [Human-Approved Action] {act.id}: {act.title}</div>
                  <div class="pt-1.5 border-t border-slate-100 text-slate-600 font-sans">
                    Please execute {act.title} ({act.affectedItems || 'critical-path items'}) by {act.dueDate} to support the 15 December 2026 target DBL.
                  </div>
                </div>
              {/if}
            </div>

            <!-- Interactive Forms for Modify, Assign to another owner, Defer, and Reject with reason -->
            {#if isModifying}
              <div class="p-4 rounded-xl bg-amber-50 border border-amber-200 space-y-3">
                <div class="text-xs font-bold text-amber-900">Modify Action Parameters</div>
                <div class="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <label for="mod-owner" class="block text-[10px] font-bold text-slate-500 uppercase">Owner</label>
                    <input id="mod-owner" type="text" bind:value={editOwner} class="w-full mt-1 p-2 bg-white border border-slate-300 rounded-md text-slate-800" />
                  </div>
                  <div>
                    <label for="mod-date" class="block text-[10px] font-bold text-slate-500 uppercase">Due Date</label>
                    <input id="mod-date" type="date" bind:value={editDate} class="w-full mt-1 p-2 bg-white border border-slate-300 rounded-md text-slate-800" />
                  </div>
                </div>
                <div class="flex space-x-2">
                  <button on:click={() => saveModify(act)} class="px-3 py-1.5 bg-blue-600 text-white rounded-md font-bold text-xs">Save Modification</button>
                  <button on:click={() => isModifying = false} class="px-3 py-1.5 bg-slate-200 text-slate-700 rounded-md font-semibold text-xs">Cancel</button>
                </div>
              </div>
            {/if}

            {#if isReassigning}
              <div class="p-4 rounded-xl bg-indigo-50 border border-indigo-200 space-y-3">
                <div class="text-xs font-bold text-indigo-900">Assign to Another Owner</div>
                <div>
                  <label for="reassign-select" class="block text-[10px] font-bold text-slate-500 uppercase">Select New Owner</label>
                  <select id="reassign-select" bind:value={editOwner} class="w-full mt-1 p-2 bg-white border border-slate-300 rounded-md text-xs text-slate-800">
                    {#each availableOwners as own}
                      <option value={own}>{own}</option>
                    {/each}
                  </select>
                </div>
                <div class="flex space-x-2">
                  <button on:click={() => saveReassign(act)} class="px-3 py-1.5 bg-indigo-600 text-white rounded-md font-bold text-xs">Confirm Owner Assignment</button>
                  <button on:click={() => isReassigning = false} class="px-3 py-1.5 bg-slate-200 text-slate-700 rounded-md font-semibold text-xs">Cancel</button>
                </div>
              </div>
            {/if}

            {#if isDeferring}
              <div class="p-4 rounded-xl bg-amber-50 border border-amber-200 space-y-3">
                <div class="text-xs font-bold text-amber-900">Defer Recommendation</div>
                <div class="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <label for="defer-date" class="block text-[10px] font-bold text-slate-500 uppercase">Defer Until Date</label>
                    <input id="defer-date" type="date" bind:value={deferDate} class="w-full mt-1 p-2 bg-white border border-slate-300 rounded-md text-slate-800" />
                  </div>
                  <div>
                    <label for="defer-note" class="block text-[10px] font-bold text-slate-500 uppercase">Deferral Note</label>
                    <input id="defer-note" type="text" bind:value={deferNote} class="w-full mt-1 p-2 bg-white border border-slate-300 rounded-md text-slate-800" />
                  </div>
                </div>
                <div class="flex space-x-2">
                  <button on:click={() => saveDefer(act)} class="px-3 py-1.5 bg-amber-600 text-white rounded-md font-bold text-xs">Confirm Deferral</button>
                  <button on:click={() => isDeferring = false} class="px-3 py-1.5 bg-slate-200 text-slate-700 rounded-md font-semibold text-xs">Cancel</button>
                </div>
              </div>
            {/if}

            {#if isRejecting}
              <div class="p-4 rounded-xl bg-rose-50 border border-rose-200 space-y-3">
                <div class="text-xs font-bold text-rose-900">Reject with Reason (Required for Audit Log)</div>
                <textarea
                  bind:value={rejectReason}
                  placeholder="Enter the clinical, operational, or data management reason for rejecting this recommendation..."
                  class="w-full p-2 bg-white border border-rose-300 rounded-md text-xs text-slate-800 h-20"
                ></textarea>
                <div class="flex space-x-2">
                  <button disabled={!rejectReason.trim()} on:click={() => submitReject(act)} class="px-3 py-1.5 bg-rose-600 text-white rounded-md font-bold text-xs disabled:opacity-40">Confirm Rejection with Reason</button>
                  <button on:click={() => isRejecting = false} class="px-3 py-1.5 bg-slate-200 text-slate-700 rounded-md font-semibold text-xs">Cancel</button>
                </div>
              </div>
            {/if}

          {:else if drawerTab === 'evidence'}
            <div class="space-y-3">
              <h3 class="text-xs font-bold text-slate-900 uppercase tracking-wider">Traceable Source Records</h3>
              <div class="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-1.5">
                <div class="font-bold text-slate-900">Affected Items: {act.affectedItems || 'SAE-REC-104-01, SAE-REC-104-02'}</div>
                <div class="text-[11px] text-slate-600">Source: Medidata Rave EDC, Oracle Argus Safety, LabCorp API</div>
                <div class="text-[10px] text-slate-400 font-mono">Data refreshed: 31 October 2026, 08:00 UTC</div>
              </div>
            </div>
          {:else}
            <div class="space-y-2.5">
              <h3 class="text-xs font-bold text-slate-900 uppercase tracking-wider">Human Governance &amp; Decision Log</h3>
              {#each $workflow.history as item}
                <div class="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <div class="flex justify-between text-[10px] text-slate-400 font-mono">
                    <span>{item.when}</span>
                    <span class="text-emerald-700 font-bold">Human-Authorised</span>
                  </div>
                  <p class="text-slate-800 font-medium mt-1">{item.message}</p>
                </div>
              {/each}
            </div>
          {/if}

        </div>

        <!-- Drawer Footer: ALL 5 REQUIRED DECISION BUTTONS + GOVERNANCE MESSAGE (Image 2) -->
        <div class="p-5 bg-slate-50 border-t border-slate-200 sticky bottom-0 space-y-3">
          <div class="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
            Study Team Decision Controls (All 5 Governance Actions)
          </div>

          <div class="flex flex-wrap gap-2">
            <button
              type="button"
              on:click={() => acceptRecommendation(act)}
              class="px-3 py-2 rounded-lg bg-blue-600 text-white font-bold text-xs hover:bg-blue-700 transition-colors shadow-xs cursor-pointer"
            >
              Accept recommendation
            </button>
            <button
              type="button"
              on:click={() => startModify(act)}
              class="px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-800 font-semibold text-xs hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Modify
            </button>
            <button
              type="button"
              on:click={() => startReassign(act)}
              class="px-3 py-2 rounded-lg border border-slate-300 bg-white text-indigo-700 font-semibold text-xs hover:bg-indigo-50 transition-colors cursor-pointer"
            >
              Assign to another owner
            </button>
            <button
              type="button"
              on:click={() => startDefer()}
              class="px-3 py-2 rounded-lg border border-amber-300 bg-amber-50 text-amber-800 font-semibold text-xs hover:bg-amber-100 transition-colors cursor-pointer"
            >
              Defer
            </button>
            <button
              type="button"
              on:click={() => startReject()}
              class="px-3 py-2 rounded-lg border border-rose-300 bg-white text-rose-600 font-semibold text-xs hover:bg-rose-50 transition-colors cursor-pointer"
            >
              Reject with reason
            </button>
          </div>

          <!-- Exact Governance Requirement Wording from Image 2 -->
          <div class="flex items-start space-x-2 text-[11px] text-slate-600 bg-white p-2.5 rounded-lg border border-slate-200">
            <Lock size={13} class="shrink-0 mt-0.5 text-blue-600" />
            <p class="leading-snug">
              <strong>The study team makes the final decision.</strong> DBLock AI does not modify clinical data or send external communications without authorised human approval.
            </p>
          </div>
        </div>

      </aside>
    </div>
  {/if}

</div>
