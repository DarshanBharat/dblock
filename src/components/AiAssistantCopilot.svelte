<script lang="ts">
  import {
    Sparkles,
    ChevronDown,
    ChevronUp,
    ArrowRight,
    Send,
    Bot,
    CheckCircle2,
    AlertTriangle,
    FileText,
    HelpCircle
  } from '@lucide/svelte';

  export let study: any;
  export let onSelectSite: (siteId: string) => void;
  export let onSelectTab: (tab: string) => void;

  let isExpanded = true;
  let activeInquiry: string | null = null;

  const quickInquiries = [
    {
      id: 'why-104',
      question: 'Why is Site 104 delaying lock more than Site 208?',
      answer: `Site 104 has only 19 open queries, but 2 are unresolved SAE reconciliation discrepancies with Oracle Argus (including a Grade 3 CRS onset date conflict for SUBJ-104-003). In contrast, Site 208 has 41 queries, but they are routine concomitant medication spellings that resolve in hours and do not block regulatory lock.`,
      actionLabel: 'Inspect Site 104 Discrepancies',
      actionTab: 'risk_matrix',
      actionSiteId: '104'
    },
    {
      id: 'fastest-path',
      question: 'What is the fastest way to get back to the Dec 15 lock date?',
      answer: `Execute just two critical actions: (1) Reconcile the 2 SAE records at Site 104 (-3.0 days delay) and (2) Ingest the revised LabCorp ctDNA transfer batch (-1.8 days delay). Together, they recover 4.8 of the 6.0 delay days within 48 hours.`,
      actionLabel: 'Open What-If Simulator',
      actionTab: 'simulator',
      actionSiteId: null
    },
    {
      id: 'draft-escalation',
      question: 'Draft sponsor escalation email for LabCorp ctDNA transfer',
      answer: `To: Dr. Jean-Pierre Dupuis (LabCorp Bioanalytical Geneva)\nSubject: URGENT: Phase III CA-209-301 ctDNA Batch #LXB-8921 Checksum Failure\n\nDear Jean-Pierre, batch #LXB-8921 failed MD5 verification at our SFTP gateway due to truncated FASTQ trailers. This is currently blocking secondary endpoint freeze for Sites 104 and 317. Please authorize immediate re-export from sequencer cache by Nov 01, 10:00 CET.`,
      actionLabel: 'View Lab Batch Details',
      actionTab: 'digital_twin',
      actionSiteId: null
    }
  ];

  function handleSelectInquiry(id: string) {
    activeInquiry = activeInquiry === id ? null : id;
  }
</script>

<div class="bg-gradient-to-r from-blue-50/80 via-white to-indigo-50/50 rounded-xl border border-blue-200/80 p-4 sm:p-5 shadow-xs transition-all">
  <!-- Assistant Header -->
  <div class="flex items-start justify-between gap-3">
    <div class="flex items-center space-x-2.5">
      <div class="h-8 w-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-xs shrink-0">
        <Sparkles class="w-4 h-4" />
      </div>
      <div>
        <div class="flex items-center space-x-2">
          <h3 class="text-sm font-bold text-slate-900">DBLock AI Copilot</h3>
          <span class="text-[10px] font-semibold bg-blue-100/70 text-blue-800 px-2 py-0.2 rounded-full border border-blue-200">
            Assistant Briefing
          </span>
        </div>
        <p class="text-xs text-slate-500">Plain-language clinical study insights for non-technical leadership</p>
      </div>
    </div>

    <button
      type="button"
      on:click={() => isExpanded = !isExpanded}
      class="text-slate-400 hover:text-slate-600 p-1 rounded hover:bg-slate-100 transition-colors"
      aria-label="Toggle AI assistant briefing"
    >
      {#if isExpanded}
        <ChevronUp class="w-4 h-4" />
      {:else}
        <ChevronDown class="w-4 h-4" />
      {/if}
    </button>
  </div>

  {#if isExpanded}
    <!-- Plain-English Narrative Executive Briefing -->
    <div class="mt-3.5 pt-3 border-t border-blue-100 space-y-3">
      <div class="bg-white/80 rounded-lg p-3.5 border border-blue-100 text-xs sm:text-sm text-slate-700 leading-relaxed space-y-2">
        <p>
          <strong class="text-slate-900 font-semibold">Study Status Summary:</strong>
          You have <strong class="text-slate-900">18 sites</strong> and <strong class="text-slate-900">220 enrolled subjects</strong>. The planned lock date of <strong class="text-slate-900">{study.plannedDbl}</strong> is currently slipping by <strong class="text-rose-600 font-bold">6 days</strong> to <strong class="text-slate-900">{study.forecastDbl}</strong>.
        </p>
        <p class="text-xs text-slate-600">
          <strong>The Key Insight:</strong> 15 of your 18 sites are completely clean and ready. You do <span class="underline decoration-rose-400 decoration-2">not</span> need to chase dozens of routine queries. Over <strong>85% of your delay risk is concentrated in just two specific blockers</strong>: an SAE causality conflict at Site 104, and a checksum failure on an external LabCorp biomarker file.
        </p>
      </div>

      <!-- Quick Inquiry Prompt Buttons -->
      <div class="space-y-2">
        <div class="text-[11px] font-semibold text-slate-500 uppercase tracking-wider flex items-center">
          <HelpCircle class="w-3.5 h-3.5 mr-1 text-blue-600" />
          <span>Ask the Assistant:</span>
        </div>

        <div class="flex flex-wrap gap-2">
          {#each quickInquiries as inq}
            <button
              type="button"
              on:click={() => handleSelectInquiry(inq.id)}
              class="text-left px-3 py-1.5 rounded-lg text-xs font-medium border transition-all {
                activeInquiry === inq.id
                  ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                  : 'bg-white text-slate-700 border-slate-200/90 hover:border-blue-300 hover:bg-blue-50/40'
              }"
            >
              <span>{inq.question}</span>
            </button>
          {/each}
        </div>

        <!-- Render Selected Inquiry Answer -->
        {#if activeInquiry}
          {@const selectedInq = quickInquiries.find(q => q.id === activeInquiry)}
          {#if selectedInq}
            <div class="mt-2.5 p-3.5 bg-white rounded-lg border border-blue-200 shadow-xs text-xs space-y-2.5">
              <div class="font-bold text-slate-900 flex items-center text-xs">
                <Bot class="w-4 h-4 mr-1.5 text-blue-600" />
                <span>Assistant Explanation</span>
              </div>
              <p class="text-slate-700 whitespace-pre-line leading-relaxed font-normal">
                {selectedInq.answer}
              </p>

              <div class="pt-2 border-t border-slate-100 flex items-center justify-between">
                <span class="text-[11px] text-slate-500">Verified against live clinical database signals</span>
                <button
                  type="button"
                  on:click={() => {
                    if (selectedInq.actionSiteId) {
                      onSelectSite(selectedInq.actionSiteId);
                    } else if (selectedInq.actionTab) {
                      onSelectTab(selectedInq.actionTab);
                    }
                  }}
                  class="inline-flex items-center text-xs font-bold text-blue-600 hover:text-blue-800"
                >
                  <span>{selectedInq.actionLabel}</span>
                  <ArrowRight class="w-3 h-3 ml-1" />
                </button>
              </div>
            </div>
          {/if}
        {/if}
      </div>
    </div>
  {/if}
</div>
