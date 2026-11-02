<script lang="ts">
  import { ShieldCheck, FileCheck, CheckCircle2, Lock, X, ExternalLink, Download } from '@lucide/svelte';

  export let show: boolean;
  export let onClose: () => void;
  export let governance: any;

  function exportAuditTrail() {
    const csvContent = "data:text/csv;charset=utf-8," 
      + "Timestamp,Event,Actor,System,Details,Hash\n"
      + "2026-10-31 08:00:14 UTC,Prediction Generated,Model v0.1.4,DBLock AI Decision Engine,Predicted +6 days delay for CA-209-301," + governance.hashVerification.slice(0, 16) + "\n"
      + "2026-10-31 08:02:10 UTC,Data Ingestion Check,Automated Validator,LabCorp API,Checksum failed on batch #LXB-8921," + governance.hashVerification.slice(16, 32) + "\n"
      + "2026-10-31 08:05:40 UTC,Human Review,Dr. Sarah Lin (Safety Lead),DBLock Workbench,Reviewed SAE-104-003 and SAE-104-012," + governance.hashVerification.slice(32, 48) + "\n"
      + "2026-10-31 08:12:00 UTC,Action Approved,Dr. Sarah Lin,DBLock Governance,Approved action ACT-001 (Resolve SAE discrepancies)," + governance.hashVerification.slice(48, 64) + "\n";
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `DBLock_Audit_Trail_${governance.predictionId}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
</script>

{#if show}
  <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
    <div class="relative w-full max-w-3xl bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
      
      <!-- Modal Header -->
      <div class="px-6 py-4 bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white flex items-center justify-between">
        <div class="flex items-center space-x-3">
          <div class="w-10 h-10 rounded-lg bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-300">
            <ShieldCheck size={22} />
          </div>
          <div>
            <div class="flex items-center space-x-2">
              <span class="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded bg-blue-500/30 text-blue-200 border border-blue-400/30">
                Explainability &amp; Governance
              </span>
              <span class="text-xs text-blue-300">21 CFR Part 11 Compliant</span>
            </div>
            <h2 class="text-lg font-bold text-white mt-0.5">Trust Centre &middot; Model Traceability</h2>
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
      <div class="p-6 overflow-y-auto space-y-6 text-sm text-slate-700">
        
        <!-- Summary Callout -->
        <div class="p-4 rounded-lg bg-blue-50 border border-blue-200 flex items-start space-x-3">
          <Lock size={18} class="text-blue-600 shrink-0 mt-0.5" />
          <div>
            <div class="font-bold text-blue-900 text-xs uppercase tracking-wide">Human-Governed Clinical AI</div>
            <p class="text-xs text-blue-800 mt-1 leading-relaxed">
              {governance.disclaimer} Every score, critical-path blocker, and recommended intervention is fully traceable to immutable source extracts and explainable rules.
            </p>
          </div>
        </div>

        <!-- Metadata Grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="p-3.5 rounded-lg bg-slate-50 border border-slate-200">
            <span class="text-[10px] uppercase font-bold text-slate-400">Prediction Run ID</span>
            <div class="font-mono text-xs font-semibold text-slate-800 mt-1">{governance.predictionId}</div>
          </div>
          <div class="p-3.5 rounded-lg bg-slate-50 border border-slate-200">
            <span class="text-[10px] uppercase font-bold text-slate-400">Timestamp</span>
            <div class="font-mono text-xs font-semibold text-slate-800 mt-1">{governance.timestamp}</div>
          </div>
          <div class="p-3.5 rounded-lg bg-slate-50 border border-slate-200">
            <span class="text-[10px] uppercase font-bold text-slate-400">Model Engine Version</span>
            <div class="text-xs font-semibold text-slate-800 mt-1 flex items-center space-x-2">
              <span class="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-mono text-[11px] font-bold">
                {governance.modelVersion}
              </span>
              <span class="text-slate-500 text-[11px]">(Hybrid Rule-Probabilistic)</span>
            </div>
          </div>
          <div class="p-3.5 rounded-lg bg-slate-50 border border-slate-200">
            <span class="text-[10px] uppercase font-bold text-slate-400">Cryptographic State Hash</span>
            <div class="font-mono text-[11px] text-slate-600 truncate mt-1" title={governance.hashVerification}>
              {governance.hashVerification}
            </div>
          </div>
        </div>

        <!-- Decision Engine Logic Breakdown -->
        <div>
          <h3 class="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2.5">
            Model Weighting &amp; Factor Contribution Matrix
          </h3>
          <div class="border border-slate-200 rounded-lg overflow-hidden">
            <table class="min-w-full divide-y divide-slate-200 text-xs">
              <thead class="bg-slate-50 text-slate-500 uppercase font-semibold text-[10px]">
                <tr>
                  <th class="px-4 py-2.5 text-left">Factor Name</th>
                  <th class="px-4 py-2.5 text-left">Input System</th>
                  <th class="px-4 py-2.5 text-right">Model Weight</th>
                  <th class="px-4 py-2.5 text-right">Delay Contribution</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                <tr class="hover:bg-slate-50/50">
                  <td class="px-4 py-2.5 font-medium text-slate-900">Safety Reconciliation Discrepancies</td>
                  <td class="px-4 py-2.5 text-slate-600">Oracle Argus &harr; Medidata Rave</td>
                  <td class="px-4 py-2.5 text-right font-bold text-rose-600">35%</td>
                  <td class="px-4 py-2.5 text-right font-mono text-slate-700">2.1 days</td>
                </tr>
                <tr class="hover:bg-slate-50/50">
                  <td class="px-4 py-2.5 font-medium text-slate-900">Overdue Central Laboratory Transfer</td>
                  <td class="px-4 py-2.5 text-slate-600">LabCorp Vendor Feed API</td>
                  <td class="px-4 py-2.5 text-right font-bold text-amber-600">30%</td>
                  <td class="px-4 py-2.5 text-right font-mono text-slate-700">1.8 days</td>
                </tr>
                <tr class="hover:bg-slate-50/50">
                  <td class="px-4 py-2.5 font-medium text-slate-900">Ageing Primary Endpoint Queries (&gt;14d)</td>
                  <td class="px-4 py-2.5 text-slate-600">Medidata Rave EDC</td>
                  <td class="px-4 py-2.5 text-right font-bold text-blue-600">22%</td>
                  <td class="px-4 py-2.5 text-right font-mono text-slate-700">1.3 days</td>
                </tr>
                <tr class="hover:bg-slate-50/50">
                  <td class="px-4 py-2.5 font-medium text-slate-900">Investigator e-Signature Sign-off Status</td>
                  <td class="px-4 py-2.5 text-slate-600">Medidata Rave &amp; Veeva eTMF</td>
                  <td class="px-4 py-2.5 text-right font-bold text-slate-600">13%</td>
                  <td class="px-4 py-2.5 text-right font-mono text-slate-700">0.8 days</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Electronic Signature & Audit Trail Verification -->
        <div class="p-4 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-between">
          <div class="flex items-center space-x-3">
            <CheckCircle2 size={20} class="text-emerald-600 shrink-0" />
            <div>
              <div class="text-xs font-bold text-emerald-900">GxP Audit Trail Logging Active</div>
              <div class="text-[11px] text-emerald-700 mt-0.5">
                All recommendations, human approvals, modifications, and rejections are cryptographically recorded with timestamps.
              </div>
            </div>
          </div>
          <button
            on:click={exportAuditTrail}
            class="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 text-white font-semibold text-xs hover:bg-emerald-700 transition-colors shadow-xs"
          >
            <Download size={14} />
            <span>Export Audit Log</span>
          </button>
        </div>

      </div>

      <!-- Modal Footer -->
      <div class="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
        <span class="text-xs text-slate-500">
          Governance Authority: {governance.humanDecisionAuthority}
        </span>
        <button
          on:click={onClose}
          class="px-4 py-2 rounded-lg bg-slate-200 text-slate-800 font-semibold text-xs hover:bg-slate-300 transition-colors"
        >
          Close Trust Centre
        </button>
      </div>

    </div>
  </div>
{/if}
