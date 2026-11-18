<script lang="ts">
  import { Database, AlertTriangle, CheckCircle2, Clock, X, RefreshCw, Server, Layers } from '@lucide/svelte';

  export let show: boolean;
  export let onClose: () => void;
  export let dataHealth: any[] = [];

  let refreshing = false;
  let selectedFeedId = 'FEED-LAB';

  function triggerRefresh() {
    refreshing = true;
    setTimeout(() => {
      refreshing = false;
    }, 800);
  }

  const automatedFeedsAndVendors = [
    {
      id: 'FEED-LAB',
      level1Domain: 'Central Lab',
      vendorName: 'LabCorp Bioanalytical Geneva (Vendor 1 of 2)',
      automatedStatus: 'Late Transfer / Checksum Failed',
      statusCode: 'degraded',
      outstandingIssues: 3,
      lateTransfers: 1,
      datasetOrTransfer: 'Dataset LB_CTDNA / Transfer Package #LXB-8921',
      missingOrStaleVars: 'LBORRES (ctDNA VAF %), LBDTC (Cycle 4–6 specimen timestamps stale >90h); SHA-256 FASTQ trailer truncated',
      qualityWarning: 'Automated MD5/SHA-256 integrity gate rejected package LXB8921_ctDNA_C4C6_v1.tar.gz.',
      confidenceImpact: 'Reduces study forecast confidence from High to Moderate (widens potential DBL range to 18–22 Dec).',
      records: [
        {
          loadId: 'LOAD-LXB-8921-01',
          type: 'Failed SFTP Load / Late Transfer',
          expectedDate: '2026-10-27 08:00 UTC',
          receivedDate: 'Pending re-export (ETA 2026-11-01)',
          recordCount: '48 ctDNA sample records (Sites 104 & 317)',
          lastSuccessfulRefresh: '2026-10-27 14:00 UTC'
        }
      ]
    },
    {
      id: 'FEED-LAB-EUROFINS',
      level1Domain: 'Central Lab',
      vendorName: 'Eurofins Central Lab Louisville (Vendor 2 of 2)',
      automatedStatus: 'Automated QA Review (1d Late)',
      statusCode: 'warning',
      outstandingIssues: 1,
      lateTransfers: 1,
      datasetOrTransfer: 'Dataset LB_CHEM / Batch #LXB-8940',
      missingOrStaleVars: 'LBSTAT calibration drift flag on 2 alkaline phosphatase records',
      qualityWarning: 'Automated reference-range check flagged minor assay drift; awaiting automated QA release.',
      confidenceImpact: 'Minor impact (+0.4d variance); does not downgrade overall forecast confidence tier.',
      records: [
        {
          loadId: 'LOAD-LXB-8940-01',
          type: 'Late Transfer in QA Hold',
          expectedDate: '2026-10-30 12:00 UTC',
          receivedDate: '2026-10-31 06:00 UTC (18h late)',
          recordCount: '112 chemistry sample records (Sites 208 & 405)',
          lastSuccessfulRefresh: '2026-10-31 06:00 UTC'
        }
      ]
    },
    {
      id: 'FEED-SAFETY',
      level1Domain: 'Safety',
      vendorName: 'Oracle Argus Safety Gateway',
      automatedStatus: 'Healthy Feed (2 Recon Discrepancies)',
      statusCode: 'healthy',
      outstandingIssues: 2,
      lateTransfers: 0,
      datasetOrTransfer: 'Dataset AE_SAE_RECON / E2B(R3) Sync #ARG-9812',
      missingOrStaleVars: 'AESTDTC onset mismatch (Subj 104-003); DTHCAUS autopsy narrative unlinked in Rave Form DD-01 (Subj 104-012)',
      qualityWarning: 'Feed pipeline is healthy (30m latency), but automated cross-system rule flagged 2 critical SAE freeze discrepancies.',
      confidenceImpact: 'High impact on critical path (+2.1d potential DBL shift if unresolved before safety freeze).',
      records: [
        {
          loadId: 'SYNC-ARG-20261031',
          type: 'Automated E2B(R3) Reconciliation Extract',
          expectedDate: '2026-10-31 07:45 UTC',
          receivedDate: '2026-10-31 07:45 UTC (On time)',
          recordCount: '84 SAE cases (2 discrepant at Site 104)',
          lastSuccessfulRefresh: '2026-10-31 07:45 UTC'
        }
      ]
    },
    {
      id: 'FEED-IMAGING',
      level1Domain: 'Imaging',
      vendorName: 'BioClinica Central Imaging (BICR)',
      automatedStatus: 'Warning (1 Tie-Breaker Pending)',
      statusCode: 'warning',
      outstandingIssues: 2,
      lateTransfers: 1,
      datasetOrTransfer: 'Dataset TU_BICR / Batch #IMG-44',
      missingOrStaleVars: 'TUORRES slice thickness deviation (5mm vs 2.5mm spec for Subj 317-005); adjudication variable pending',
      qualityWarning: '1 independent radiologist tie-breaker read overdue by 2 days at Site 317.',
      confidenceImpact: 'Moderate impact on primary PFS endpoint query closure velocity.',
      records: [
        {
          loadId: 'LOAD-IMG-44',
          type: 'DICOM RECIST 1.1 Transfer',
          expectedDate: '2026-10-29 18:00 UTC',
          receivedDate: '2026-10-30 22:00 UTC',
          recordCount: '320 tumor scan records (5 pending adjudication)',
          lastSuccessfulRefresh: '2026-10-30 22:00 UTC'
        }
      ]
    },
    {
      id: 'FEED-ECOA',
      level1Domain: 'eCOA',
      vendorName: 'Signant Health Patient Cloud',
      automatedStatus: 'Healthy (Automated Sync)',
      statusCode: 'healthy',
      outstandingIssues: 1,
      lateTransfers: 0,
      datasetOrTransfer: 'Dataset QS_EPRO / Daily Sync #SIG-1031',
      missingOrStaleVars: '4 patient diary syncs pending handheld cellular upload at Site 233',
      qualityWarning: 'No pipeline errors; 95% automated device compliance.',
      confidenceImpact: 'Negligible impact on DBL forecast confidence.',
      records: [
        {
          loadId: 'LOAD-SIG-1031',
          type: 'Automated Cloud API Sync',
          expectedDate: '2026-10-31 06:30 UTC',
          receivedDate: '2026-10-31 06:30 UTC (On time)',
          recordCount: '4,120 e-diary records',
          lastSuccessfulRefresh: '2026-10-31 06:30 UTC'
        }
      ]
    },
    {
      id: 'FEED-EDC',
      level1Domain: 'EDC',
      vendorName: 'Medidata Rave EDC & Coder',
      automatedStatus: 'Healthy (Real-Time API)',
      statusCode: 'healthy',
      outstandingIssues: 0,
      lateTransfers: 0,
      datasetOrTransfer: 'Dataset Clinical_ODM_v8.2 & MedDRA_27.0',
      missingOrStaleVars: 'None (All ODM clinical views current within 15 mins)',
      qualityWarning: 'Zero ingestion failures.',
      confidenceImpact: 'Provides high-reliability baseline for subject-level cleanliness.',
      records: [
        {
          loadId: 'ODM-RAVE-20261031-0800',
          type: 'Automated ODM Clinical Extract',
          expectedDate: '2026-10-31 08:00 UTC',
          receivedDate: '2026-10-31 08:00 UTC (On time)',
          recordCount: '142,850 eCRF records & 1,890 coded terms',
          lastSuccessfulRefresh: '2026-10-31 08:00 UTC'
        }
      ]
    }
  ];

  $: activeFeed = automatedFeedsAndVendors.find(f => f.id === selectedFeedId) || automatedFeedsAndVendors[0];
</script>

{#if show}
  <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
    <div class="relative w-full max-w-4xl bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
      
      <!-- Modal Header -->
      <div class="px-6 py-4 bg-gradient-to-r from-slate-900 via-slate-800 to-blue-950 text-white flex items-center justify-between">
        <div class="flex items-center space-x-3">
          <div class="w-10 h-10 rounded-lg bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-300">
            <Database size={22} />
          </div>
          <div>
            <div class="flex items-center space-x-2">
              <span class="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded bg-emerald-500/30 text-emerald-200 border border-emerald-400/30">
                Automated Multi-Vendor Feed Drill-Down
              </span>
              <span class="text-xs text-slate-300">Zero Manual Cleanliness Inputs</span>
            </div>
            <h2 class="text-lg font-bold text-white mt-0.5">
              Automated Vendor Feed Status, Outstanding Issues &amp; Late Transfers
            </h2>
          </div>
        </div>
        <button
          class="text-slate-300 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors"
          on:click={onClose}
          aria-label="Close Data Health"
        >
          <X size={20} />
        </button>
      </div>

      <!-- Modal Body -->
      <div class="p-6 overflow-y-auto space-y-5 text-xs text-slate-700">
        
        <div class="space-y-2">
          <div class="text-[10px] font-extrabold uppercase tracking-wider text-blue-700">
            Feed Status (EDC, Safety, Central Lab, eCOA, Imaging) &rarr; Vendor (Shown Separately) &rarr; Dataset or Transfer
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {#each automatedFeedsAndVendors as item}
              <button
                type="button"
                on:click={() => selectedFeedId = item.id}
                class="p-3 rounded-xl border text-left transition-all cursor-pointer {selectedFeedId === item.id ? 'border-blue-600 bg-blue-50/50 ring-2 ring-blue-100' : 'border-slate-200 bg-white hover:border-blue-300'}"
              >
                <div class="flex items-center justify-between">
                  <span class="px-2 py-0.5 rounded text-[10px] font-bold uppercase {item.statusCode === 'healthy' ? 'bg-emerald-100 text-emerald-800' : item.statusCode === 'warning' ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'}">
                    {item.level1Domain}
                  </span>
                  <span class="text-[10px] font-bold {item.lateTransfers > 0 ? 'text-rose-600' : 'text-emerald-700'}">
                    {item.lateTransfers} late &middot; {item.outstandingIssues} issues
                  </span>
                </div>
                <div class="font-bold text-slate-900 mt-1.5">{item.vendorName}</div>
                <div class="text-[10px] text-slate-500 mt-0.5 truncate">{item.datasetOrTransfer}</div>
              </button>
            {/each}
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <div class="text-[10px] font-extrabold uppercase tracking-wider text-blue-700">
              Dataset &rarr; Missing/Stale Variables &amp; Data-Quality Warnings
            </div>
            <div class="font-bold text-slate-900">{activeFeed.vendorName} &middot; {activeFeed.datasetOrTransfer}</div>
            <div class="text-[11px] text-slate-700">
              <strong>Missing / Stale Variables:</strong> {activeFeed.missingOrStaleVars}
            </div>
            <div class="text-[11px] text-rose-700 font-medium">
              <strong>Quality Warning:</strong> {activeFeed.qualityWarning}
            </div>
          </div>

          <div class="p-4 rounded-xl bg-amber-50/70 border border-amber-200 space-y-2">
            <div class="text-[10px] font-extrabold uppercase tracking-wider text-amber-900">
              Impact: Effect of Gap on Forecast Confidence
            </div>
            <div class="font-bold text-amber-950">Automated Forecast Confidence Adjustment</div>
            <p class="text-[11px] text-amber-900 leading-relaxed">
              {activeFeed.confidenceImpact}
            </p>
          </div>
        </div>

        <div class="space-y-2">
          <div class="text-[10px] font-extrabold uppercase tracking-wider text-blue-700">
            Individual Late Transfer or Failed Load (Expected vs. Received Date, Record Count &amp; Last Successful Refresh)
          </div>
          <div class="border border-slate-200 rounded-xl overflow-hidden">
            <table class="min-w-full divide-y divide-slate-200 text-xs">
              <thead class="bg-slate-50 text-slate-500 uppercase font-bold text-[10px]">
                <tr>
                  <th class="px-3 py-2.5 text-left">Load / Transfer ID</th>
                  <th class="px-3 py-2.5 text-left">Load Type</th>
                  <th class="px-3 py-2.5 text-left">Expected Date</th>
                  <th class="px-3 py-2.5 text-left">Received Date</th>
                  <th class="px-3 py-2.5 text-left">Record Count</th>
                  <th class="px-3 py-2.5 text-right">Last Successful Refresh</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100 font-medium">
                {#each activeFeed.records as rec}
                  <tr>
                    <td class="px-3 py-2.5 font-mono font-bold text-slate-900">{rec.loadId}</td>
                    <td class="px-3 py-2.5 text-slate-700">{rec.type}</td>
                    <td class="px-3 py-2.5 font-mono text-slate-600">{rec.expectedDate}</td>
                    <td class="px-3 py-2.5 font-mono font-bold {rec.receivedDate.includes('Pending') || rec.receivedDate.includes('late') ? 'text-rose-600' : 'text-emerald-700'}">{rec.receivedDate}</td>
                    <td class="px-3 py-2.5 font-semibold text-slate-800">{rec.recordCount}</td>
                    <td class="px-3 py-2.5 text-right font-mono text-slate-500">{rec.lastSuccessfulRefresh}</td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      <!-- Modal Footer -->
      <div class="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
        <button
          on:click={triggerRefresh}
          class="inline-flex items-center space-x-1.5 text-xs text-blue-700 hover:text-blue-900 font-semibold cursor-pointer"
        >
          <RefreshCw size={14} class={refreshing ? 'animate-spin text-blue-600' : ''} />
          <span>{refreshing ? 'Syncing automated vendor feeds...' : 'Trigger Automated Vendor Feed Sync'}</span>
        </button>
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
