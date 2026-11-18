<script lang="ts">
  import { ShieldCheck, CheckCircle2, Lock, X, Download, Layers } from '@lucide/svelte';
  import { workflow } from '../lib/workflow';

  export let show: boolean;
  export let onClose: () => void;
  export let governance: any;

  function exportAuditTrail() {
    const csvContent = "data:text/csv;charset=utf-8," 
      + "Timestamp,PredictionID,RecordID,Actor,Decision,RejectionOrApprovalReason,System,Hash\n"
      + "2026-10-31 08:00:14 UTC," + governance.predictionId + ",SAE-REC-104-01,Model v0.1.4,Recommendation Generated,35% Safety Recon Weight (2.1d shift),DBLock AI Decision Engine," + governance.hashVerification.slice(0, 16) + "\n"
      + "2026-10-31 08:02:10 UTC," + governance.predictionId + ",LXB-8921,Automated Validator,Late Transfer Flagged,SHA-256 Checksum Failed (48 ctDNA samples),LabCorp SFTP API," + governance.hashVerification.slice(16, 32) + "\n"
      + "2026-10-31 08:12:00 UTC," + governance.predictionId + ",ACT-001,Dr. Sarah Lin (Safety Lead),Accepted Recommendation,Approved joint CRA/PV reconciliation call,DBLock Governance," + governance.hashVerification.slice(32, 48) + "\n"
      + "2026-10-31 08:18:00 UTC," + governance.predictionId + ",ACT-009,Elena Rostova (Lead CDM),Rejected with Reason,Routine demographic queries covered by scheduled batch script,DBLock Governance," + governance.hashVerification.slice(48, 64) + "\n";
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `DBLock_Audit_Trail_${governance.predictionId}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  const level4GovernanceRecords = [
    {
      recordId: 'SAE-REC-104-01 / ACT-001',
      sourceRecord: 'Subj 104-003 Form AE-02 vs Argus Case #PV-2026-9812',
      reviewer: 'Dr. Sarah Lin (Safety Lead)',
      decision: 'Accepted recommendation',
      reason: 'Confirmed critical-path blocker for safety database freeze; teleconference scheduled.',
      timestamp: '31 Oct 2026, 08:12 UTC'
    },
    {
      recordId: 'LXB-8921 / ACT-002',
      sourceRecord: 'LabCorp ctDNA Batch #LXB-8921 (48 samples)',
      reviewer: 'Jean-Pierre Dupuis (Vendor Ops)',
      decision: 'Accepted recommendation',
      reason: 'Vendor SLA escalation initiated for re-export of checksum-verified FASTQ package.',
      timestamp: '31 Oct 2026, 08:15 UTC'
    },
    {
      recordId: 'QRY-104-089 / ACT-003',
      sourceRecord: 'Subj 104-003 Form TU-01 RECIST sum diameter query',
      reviewer: 'Marcus Campbell (Site 104 CRA)',
      decision: 'Modified due date',
      reason: 'Aligned with Charité and Boston radiology sub-investigator availability on Nov 03.',
      timestamp: '31 Oct 2026, 08:20 UTC'
    },
    {
      recordId: 'QRY-208-112 / ACT-009',
      sourceRecord: 'Site 208 non-critical ConMed trade name queries (38 items)',
      reviewer: 'Elena Rostova (Lead CDM)',
      decision: 'Rejected with reason',
      reason: 'Rejected automated escalation: non-critical ConMed queries already scheduled for routine dictionary batch closure.',
      timestamp: '31 Oct 2026, 08:25 UTC'
    }
  ];
</script>

{#if show}
  <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
    <div class="relative w-full max-w-4xl bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
      
      <!-- Modal Header (Exact Manager Suggested Label from Image 6) -->
      <div class="px-6 py-4 bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white flex items-center justify-between">
        <div class="flex items-center space-x-3">
          <div class="w-10 h-10 rounded-lg bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-300">
            <ShieldCheck size={22} />
          </div>
          <div>
            <div class="flex items-center space-x-2">
              <span class="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded bg-blue-500/30 text-blue-200 border border-blue-400/30">
                Prediction Traceability
              </span>
              <span class="text-xs text-blue-300">21 CFR Part 11 Compliant</span>
            </div>
            <h2 class="text-lg font-extrabold text-white mt-0.5">
              Trust Centre: How DBLock AI reached this recommendation
            </h2>
          </div>
        </div>
        <button
          class="text-slate-300 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors"
          on:click={onClose}
          aria-label="Close Trust Centre"
        >
          <X size={20} />
        </button>
      </div>

      <!-- Modal Body -->
      <div class="p-6 overflow-y-auto space-y-6 text-xs text-slate-700">
        
        <!-- Governance Callout -->
        <div class="p-4 rounded-xl bg-blue-50 border border-blue-200 flex items-start space-x-3">
          <Lock size={18} class="text-blue-600 shrink-0 mt-0.5" />
          <div>
            <div class="font-extrabold text-blue-900 text-xs uppercase tracking-wide">
              Connected to Actual Prediction &amp; Human Decision Authority
            </div>
            <p class="text-xs text-blue-900 mt-1 leading-relaxed">
              <strong>The study team makes the final decision. DBLock AI does not modify clinical data or send external communications without authorised human approval.</strong> Every score and recommendation is connected below from Prediction ID down to source records and human review logs.
            </p>
          </div>
        </div>

        <div class="space-y-2">
          <div class="text-[10px] font-extrabold uppercase tracking-wider text-blue-700">
            Prediction ID &rarr; Model or Rule Version
          </div>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div class="p-3 rounded-lg bg-slate-50 border border-slate-200">
              <span class="text-[10px] uppercase font-bold text-slate-400">Prediction Run ID</span>
              <div class="font-mono text-xs font-bold text-slate-900 mt-0.5">{governance.predictionId}</div>
              <div class="text-[10px] text-slate-500 mt-0.5">Study CA-209-301 (Readiness 72/100 | Potential DBL 21 Dec)</div>
            </div>
            <div class="p-3 rounded-lg bg-slate-50 border border-slate-200">
              <span class="text-[10px] uppercase font-bold text-slate-400">Model &amp; Rule Version</span>
              <div class="text-xs font-bold text-emerald-800 mt-0.5 font-mono">{governance.modelVersion}</div>
              <div class="text-[10px] text-slate-500 mt-0.5">Critical-Path Dependency Rule Engine v2.4</div>
            </div>
            <div class="p-3 rounded-lg bg-slate-50 border border-slate-200">
              <span class="text-[10px] uppercase font-bold text-slate-400">Extract &amp; Prediction Timestamp</span>
              <div class="font-mono text-xs font-bold text-slate-900 mt-0.5">31 October 2026, 08:00 UTC</div>
              <div class="text-[10px] text-slate-500 mt-0.5 truncate" title={governance.hashVerification}>Hash: {governance.hashVerification.slice(0, 24)}...</div>
            </div>
          </div>
        </div>

        <div class="space-y-2">
          <div class="text-[10px] font-extrabold uppercase tracking-wider text-blue-700">
            Prediction &rarr; Factors Used &amp; Weights &rarr; Source Systems &amp; Refresh Times
          </div>
          <div class="border border-slate-200 rounded-xl overflow-hidden">
            <table class="min-w-full divide-y divide-slate-200 text-xs">
              <thead class="bg-slate-50 text-slate-500 uppercase font-bold text-[10px]">
                <tr>
                  <th class="px-4 py-2.5 text-left">Factor Used</th>
                  <th class="px-3 py-2.5 text-right">Factor Weight</th>
                  <th class="px-3 py-2.5 text-right">Potential DBL Shift</th>
                  <th class="px-4 py-2.5 text-left">Source Systems</th>
                  <th class="px-3 py-2.5 text-right">Last Refresh Time</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100 font-medium">
                <tr class="hover:bg-slate-50/50">
                  <td class="px-4 py-2.5 font-bold text-slate-900">Safety Reconciliation Discrepancies</td>
                  <td class="px-3 py-2.5 text-right font-extrabold text-rose-600">35%</td>
                  <td class="px-3 py-2.5 text-right font-mono text-slate-800">+2.1 days</td>
                  <td class="px-4 py-2.5 text-slate-600">Oracle Argus Safety &harr; Medidata Rave EDC</td>
                  <td class="px-3 py-2.5 text-right font-mono text-[11px] text-slate-500">31 Oct 2026, 07:45 UTC</td>
                </tr>
                <tr class="hover:bg-slate-50/50">
                  <td class="px-4 py-2.5 font-bold text-slate-900">Central Laboratory Transfer Delay</td>
                  <td class="px-3 py-2.5 text-right font-extrabold text-amber-600">30%</td>
                  <td class="px-3 py-2.5 text-right font-mono text-slate-800">+1.8 days</td>
                  <td class="px-4 py-2.5 text-slate-600">LabCorp Bioanalytical SFTP API</td>
                  <td class="px-3 py-2.5 text-right font-mono text-[11px] text-rose-600 font-bold">27 Oct 2026 (4d stale)</td>
                </tr>
                <tr class="hover:bg-slate-50/50">
                  <td class="px-4 py-2.5 font-bold text-slate-900">Ageing Queries (&gt;14d, Endpoint-Critical Flagged)</td>
                  <td class="px-3 py-2.5 text-right font-extrabold text-orange-600">22%</td>
                  <td class="px-3 py-2.5 text-right font-mono text-slate-800">+1.3 days</td>
                  <td class="px-4 py-2.5 text-slate-600">Medidata Rave EDC &amp; BioClinica ICR</td>
                  <td class="px-3 py-2.5 text-right font-mono text-[11px] text-slate-500">31 Oct 2026, 08:00 UTC</td>
                </tr>
                <tr class="hover:bg-slate-50/50">
                  <td class="px-4 py-2.5 font-bold text-slate-900">Investigator e-Signature Sign-off Status</td>
                  <td class="px-3 py-2.5 text-right font-extrabold text-blue-600">13%</td>
                  <td class="px-3 py-2.5 text-right font-mono text-slate-800">+0.8 days</td>
                  <td class="px-4 py-2.5 text-slate-600">Medidata Rave e-Signature &amp; Veeva eTMF</td>
                  <td class="px-3 py-2.5 text-right font-mono text-[11px] text-slate-500">31 Oct 2026, 08:00 UTC</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div class="space-y-2">
          <div class="flex items-center justify-between">
            <span class="text-[10px] font-extrabold uppercase tracking-wider text-blue-700">
              Source Records, Human Reviewer, Decision &amp; Rejection Reason, Action History
            </span>
            <button
              on:click={exportAuditTrail}
              class="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 transition-colors shadow-xs cursor-pointer"
            >
              <Download size={13} />
              <span>Export 21 CFR Part 11 Audit CSV</span>
            </button>
          </div>

          <div class="border border-slate-200 rounded-xl overflow-hidden">
            <table class="min-w-full divide-y divide-slate-200 text-xs">
              <thead class="bg-slate-50 text-slate-500 uppercase font-bold text-[10px]">
                <tr>
                  <th class="px-3 py-2.5 text-left">Record &amp; Action ID</th>
                  <th class="px-3 py-2.5 text-left">Source Record</th>
                  <th class="px-3 py-2.5 text-left">Human Reviewer</th>
                  <th class="px-3 py-2.5 text-left">Decision</th>
                  <th class="px-3 py-2.5 text-left">Approval / Rejection Reason &amp; Timestamp</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100 font-medium">
                {#each level4GovernanceRecords as rec}
                  <tr class="hover:bg-slate-50">
                    <td class="px-3 py-2.5 font-mono font-bold text-slate-900 whitespace-nowrap">{rec.recordId}</td>
                    <td class="px-3 py-2.5 text-slate-700">{rec.sourceRecord}</td>
                    <td class="px-3 py-2.5 font-semibold text-slate-900 whitespace-nowrap">{rec.reviewer}</td>
                    <td class="px-3 py-2.5 whitespace-nowrap">
                      <span class="px-2 py-0.5 rounded text-[10px] font-bold {rec.decision.includes('Rejected') ? 'bg-rose-100 text-rose-800' : rec.decision.includes('Modified') ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'}">
                        {rec.decision}
                      </span>
                    </td>
                    <td class="px-3 py-2.5 text-[11px] text-slate-600">
                      <div>{rec.reason}</div>
                      <div class="text-[10px] font-mono text-slate-400 mt-0.5">{rec.timestamp}</div>
                    </td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      <!-- Modal Footer -->
      <div class="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
        <span class="text-xs text-slate-500">
          Governance Authority: {governance.humanDecisionAuthority}
        </span>
        <button
          on:click={onClose}
          class="px-4 py-2 rounded-lg bg-slate-200 text-slate-800 font-semibold text-xs hover:bg-slate-300 transition-colors cursor-pointer"
        >
          Close
        </button>
      </div>

    </div>
  </div>
{/if}
