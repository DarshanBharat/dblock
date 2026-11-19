<script lang="ts">
  import { X, ChevronLeft, ChevronRight, ExternalLink, AlertTriangle, Info } from '@lucide/svelte';
  import type { V3SubjectRow } from '../data/v3Data';

  export let subject: V3SubjectRow;
  export let subjectIndex: number;
  export let totalSubjects: number;
  export let onClose: () => void;
  export let onPrev: () => void;
  export let onNext: () => void;
  export let onOpenActions: () => void;

  let activeSubTab: 'overview' | 'domains' | 'open_items' = 'overview';
</script>

<div class="fixed inset-0 z-50 flex justify-end bg-slate-900/35 backdrop-blur-[1px]" role="dialog" aria-modal="true" aria-label="Subject Details">
  <div class="w-full max-w-2xl bg-white h-full shadow-2xl border-l border-slate-200 flex flex-col overflow-hidden">
    <!-- Top Drawer Header -->
    <div class="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
      <div class="flex items-center gap-2 text-xs font-semibold text-slate-500">
        <span>Subject Details</span>
      </div>
      <div class="flex items-center gap-2">
        <button type="button" on:click={onPrev} class="p-1 rounded hover:bg-slate-200 text-slate-600 cursor-pointer" aria-label="Previous subject">
          <ChevronLeft size={15} />
        </button>
        <span class="text-xs text-slate-600 font-medium">{subjectIndex + 1} of {totalSubjects} subjects</span>
        <button type="button" on:click={onNext} class="p-1 rounded hover:bg-slate-200 text-slate-600 cursor-pointer" aria-label="Next subject">
          <ChevronRight size={15} />
        </button>
        <button type="button" on:click={onClose} class="ml-2 p-1 rounded hover:bg-slate-200 text-slate-600 cursor-pointer" aria-label="Close drawer">
          <X size={16} />
        </button>
      </div>
    </div>

    <!-- Scrollable Body -->
    <div class="flex-1 overflow-y-auto p-5 space-y-4">
      <!-- Subject Title & Metadata -->
      <div class="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div class="flex items-center gap-2.5">
            <h2 class="text-lg font-bold text-slate-900 font-mono">{subject.id}</h2>
            <span class="px-2.5 py-0.5 rounded-full text-xs font-semibold {subject.classification === 'Hard Blocked' ? 'bg-rose-50 text-rose-700 border border-rose-200' : subject.classification === 'Action Required' ? 'bg-orange-50 text-orange-700 border border-orange-200' : subject.classification === 'Conditionally Ready' ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'}">
              {subject.classification}
            </span>
          </div>
          <div class="text-[11px] text-slate-500 mt-1">
            Site {subject.siteId} · {subject.country} · Current Status: <span class="font-semibold text-slate-700">{subject.status}</span> · Randomization {subject.keyInfo.randomization} · {subject.keyInfo.arm}
          </div>
        </div>
        <button
          type="button"
          on:click={onOpenActions}
          class="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
        >
          Open in Source System <ExternalLink size={12} />
        </button>
      </div>

      <!-- 4 KPI Tiles -->
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div class="rounded-lg border border-slate-200 p-3">
          <div class="text-[11px] text-slate-500">Subject Readiness</div>
          <div class="text-2xl font-bold text-slate-900 mt-0.5">{subject.readiness}%</div>
          <div class="mt-1.5 h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
            <div class="h-full rounded-full {subject.readiness >= 90 ? 'bg-emerald-500' : subject.readiness >= 70 ? 'bg-amber-500' : 'bg-rose-500'}" style="width:{subject.readiness}%"></div>
          </div>
        </div>
        <div class="rounded-lg border border-slate-200 p-3">
          <div class="text-[11px] text-slate-500">Key Open Items</div>
          <div class="text-2xl font-bold text-slate-900 mt-0.5">{subject.openItems.length}</div>
          <div class="text-[11px] text-slate-500 mt-1">
            {subject.openItems.filter((i) => i.severity === 'Critical').length} critical · {subject.openItems.filter((i) => i.severity === 'Routine').length} routine
          </div>
        </div>
        <div class="rounded-lg border border-slate-200 p-3">
          <div class="text-[11px] text-slate-500">Days Since Last Activity</div>
          <div class="text-2xl font-bold text-slate-900 mt-0.5">{subject.daysOpen}</div>
          <div class="text-[11px] text-slate-500 mt-1">Last: {subject.lastActivity}</div>
        </div>
        <div class="rounded-lg border border-slate-200 p-3">
          <div class="text-[11px] text-slate-500">Subject Lock Eligibility</div>
          <div class="text-sm font-bold mt-1.5 {subject.classification === 'Lock Ready' ? 'text-emerald-600' : 'text-rose-600'}">
            {subject.classification === 'Lock Ready' ? 'Eligible to Freeze' : 'Not Eligible'}
          </div>
          <div class="text-[11px] text-slate-500 mt-1">{subject.classification === 'Lock Ready' ? 'Ready for freeze' : 'Critical items pending'}</div>
        </div>
      </div>

      <!-- Sub-tabs -->
      <div class="flex items-center gap-4 border-b border-slate-200 text-xs font-semibold">
        <button type="button" on:click={() => (activeSubTab = 'overview')} class="pb-2 border-b-2 cursor-pointer {activeSubTab === 'overview' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500'}">Overview</button>
        <button type="button" on:click={() => (activeSubTab = 'domains')} class="pb-2 border-b-2 cursor-pointer {activeSubTab === 'domains' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500'}">Domain Readiness</button>
        <button type="button" on:click={() => (activeSubTab = 'open_items')} class="pb-2 border-b-2 cursor-pointer {activeSubTab === 'open_items' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500'}">Open Items ({subject.openItems.length})</button>
      </div>

      {#if activeSubTab === 'overview' || activeSubTab === 'domains'}
        <!-- Subject Timeline + Key Info -->
        {#if activeSubTab === 'overview'}
          <div class="grid grid-cols-1 sm:grid-cols-12 gap-3">
            <div class="sm:col-span-7 rounded-lg border border-slate-200 p-3">
              <div class="text-xs font-bold text-slate-900 mb-3">Subject Timeline</div>
              <div class="grid grid-cols-6 gap-1 text-center">
                {#each subject.timeline as step}
                  <div class="flex flex-col items-center">
                    <span class="w-3.5 h-3.5 rounded-full {step.state === 'completed' ? 'bg-emerald-500' : step.state === 'in_progress' ? 'bg-amber-400' : step.state === 'missed' ? 'bg-rose-500' : 'bg-slate-300'}"></span>
                    <span class="text-[10px] font-semibold text-slate-800 mt-1.5 leading-tight">{step.label}</span>
                    <span class="text-[9px] text-slate-400 mt-0.5">{step.date}</span>
                  </div>
                {/each}
              </div>
            </div>
            <div class="sm:col-span-5 rounded-lg border border-slate-200 p-3 text-[11px] space-y-1">
              <div class="text-xs font-bold text-slate-900 mb-1.5">Key Information</div>
              <div class="flex justify-between"><span class="text-slate-500">Age / Sex</span><span class="font-medium text-slate-800">{subject.keyInfo.ageSex}</span></div>
              <div class="flex justify-between"><span class="text-slate-500">Investigator</span><span class="font-medium text-slate-800">{subject.keyInfo.investigator}</span></div>
              <div class="flex justify-between"><span class="text-slate-500">Enrolment Date</span><span class="font-medium text-slate-800">{subject.keyInfo.enrolmentDate}</span></div>
              <div class="flex justify-between"><span class="text-slate-500">Analysis Set</span><span class="font-medium text-slate-800">{subject.keyInfo.analysisSet}</span></div>
            </div>
          </div>
        {/if}

        <!-- Domain Readiness for This Subject -->
        <div class="rounded-lg border border-slate-200 p-3">
          <div class="text-xs font-bold text-slate-900 mb-2">Domain Readiness for This Subject</div>
          <table class="w-full text-xs">
            <thead>
              <tr class="text-left text-[11px] text-slate-400 border-b border-slate-100">
                <th class="pb-1.5 font-medium">Domain</th>
                <th class="pb-1.5 font-medium">Status</th>
                <th class="pb-1.5 font-medium">Details</th>
                <th class="pb-1.5 font-medium text-right">Completion</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              {#each subject.domainBreakdown as row}
                <tr>
                  <td class="py-1.5 font-medium text-slate-800">{row.domain}</td>
                  <td class="py-1.5">
                    <span class="px-1.5 py-0.5 rounded text-[10px] font-semibold {row.status === 'Complete' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}">
                      {row.status}
                    </span>
                  </td>
                  <td class="py-1.5 text-slate-600">{row.details}</td>
                  <td class="py-1.5 text-right font-bold text-slate-900">{row.completion}%</td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      {/if}

      {#if activeSubTab === 'overview' || activeSubTab === 'open_items'}
        <!-- Open Items Summary -->
        <div class="rounded-lg border border-slate-200 p-3">
          <div class="text-xs font-bold text-slate-900 mb-2">Open Items Summary</div>
          {#if subject.openItems.length === 0}
            <p class="text-xs text-emerald-700">No open items. Subject is clean and eligible for freeze.</p>
          {:else}
            <table class="w-full text-xs">
              <thead>
                <tr class="text-left text-[11px] text-slate-400 border-b border-slate-100">
                  <th class="pb-1.5 font-medium">Category</th>
                  <th class="pb-1.5 font-medium">Record ID</th>
                  <th class="pb-1.5 font-medium">Issue</th>
                  <th class="pb-1.5 font-medium">Severity</th>
                  <th class="pb-1.5 font-medium text-right">Days Open</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                {#each subject.openItems as item}
                  <tr>
                    <td class="py-1.5 font-medium text-slate-800">{item.category}</td>
                    <td class="py-1.5 font-mono text-slate-600">{item.id}</td>
                    <td class="py-1.5 text-slate-700">{item.issue}</td>
                    <td class="py-1.5">
                      <span class="px-1.5 py-0.5 rounded text-[10px] font-semibold {item.severity === 'Critical' ? 'bg-rose-50 text-rose-700' : 'bg-slate-100 text-slate-700'}">
                        {item.severity}
                      </span>
                    </td>
                    <td class="py-1.5 text-right font-semibold text-slate-800">{item.daysOpen}</td>
                  </tr>
                {/each}
              </tbody>
            </table>
          {/if}
        </div>
      {/if}

      <!-- Risks & Impact + Next Best Actions -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div class="rounded-lg border border-slate-200 p-3 space-y-2">
          <div class="text-xs font-bold text-slate-900">Risks and Impact</div>
          {#if subject.risksAndImpact.length === 0}
            <p class="text-xs text-slate-500">No active DBL risks for this subject.</p>
          {:else}
            {#each subject.risksAndImpact as r}
              <div class="flex items-start gap-2 text-[11px]">
                {#if r.level === 'Critical'}
                  <AlertTriangle size={13} class="text-rose-600 shrink-0 mt-0.5" />
                {:else}
                  <Info size={13} class="text-amber-600 shrink-0 mt-0.5" />
                {/if}
                <span class="text-slate-700">{r.text}</span>
              </div>
            {/each}
          {/if}
        </div>

        <div class="rounded-lg border border-slate-200 p-3 space-y-2">
          <div class="text-xs font-bold text-slate-900">Next Best Actions</div>
          {#if subject.nextBestActions.length === 0}
            <p class="text-xs text-slate-500">Ready for casebook freeze.</p>
          {:else}
            <div class="space-y-1.5">
              {#each subject.nextBestActions as a}
                <div class="flex items-center justify-between text-[11px] border-b border-slate-100 pb-1 last:border-0">
                  <div>
                    <div class="font-medium text-slate-800">{a.action}</div>
                    <div class="text-slate-400">{a.owner} · Due {a.targetDate}</div>
                  </div>
                  <span class="px-1.5 py-0.5 rounded text-[10px] font-semibold {a.status === 'In Progress' ? 'bg-amber-50 text-amber-700' : 'bg-rose-50 text-rose-700'}">
                    {a.status}
                  </span>
                </div>
              {/each}
            </div>
          {/if}
        </div>
      </div>
    </div>
  </div>
</div>
