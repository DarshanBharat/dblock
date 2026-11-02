<script lang="ts">
  import { Database, AlertTriangle, CheckCircle2, Clock, X, RefreshCw } from '@lucide/svelte';

  export let show: boolean;
  export let onClose: () => void;
  export let dataHealth: any[];

  let refreshing = false;
  function triggerRefresh() {
    refreshing = true;
    setTimeout(() => {
      refreshing = false;
    }, 1200);
  }
</script>

{#if show}
  <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
    <div class="relative w-full max-w-3xl bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
      
      <!-- Modal Header -->
      <div class="px-6 py-4 bg-gradient-to-r from-slate-900 via-slate-800 to-blue-950 text-white flex items-center justify-between">
        <div class="flex items-center space-x-3">
          <div class="w-10 h-10 rounded-lg bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-300">
            <Database size={22} />
          </div>
          <div>
            <div class="flex items-center space-x-2">
              <span class="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded bg-emerald-500/30 text-emerald-200 border border-emerald-400/30">
                Feed Health &amp; Ingestion
              </span>
              <span class="text-xs text-slate-300">6 Connected Feeds</span>
            </div>
            <h2 class="text-lg font-bold text-white mt-0.5">Clinical Data Source Health</h2>
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
      <div class="p-6 overflow-y-auto space-y-5 text-sm text-slate-700">
        
        <!-- Stale Feed Warning Banner if LabCorp is degraded -->
        <div class="p-4 rounded-lg bg-amber-50 border border-amber-200 flex items-start space-x-3">
          <AlertTriangle size={20} class="text-amber-600 shrink-0 mt-0.5" />
          <div>
            <div class="font-bold text-amber-900 text-xs uppercase tracking-wide">
              Central Laboratory Feed Latency Warning
            </div>
            <p class="text-xs text-amber-800 mt-1 leading-relaxed">
              LabCorp vendor transfer is <strong>90 hours stale</strong> (overdue by 4 days due to batch #LXB-8921 checksum failure). DBLock AI has automatically reduced model forecast confidence from <strong>High</strong> to <strong>Moderate</strong>.
            </p>
          </div>
        </div>

        <!-- Feed List -->
        <div class="space-y-3">
          {#each dataHealth as item}
            <div class="p-4 rounded-lg border transition-all {item.statusCode === 'degraded' ? 'bg-amber-50/40 border-amber-300 ring-1 ring-amber-300/50' : item.statusCode === 'warning' ? 'bg-slate-50 border-slate-300' : 'bg-white border-slate-200 hover:border-slate-300'}">
              <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div class="flex items-center space-x-3">
                  {#if item.statusCode === 'healthy'}
                    <span class="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-4 ring-emerald-100"></span>
                  {:else if item.statusCode === 'warning'}
                    <span class="w-2.5 h-2.5 rounded-full bg-amber-500 ring-4 ring-amber-100"></span>
                  {:else}
                    <span class="w-2.5 h-2.5 rounded-full bg-rose-500 ring-4 ring-rose-100 animate-pulse"></span>
                  {/if}
                  <div>
                    <div class="font-bold text-slate-900 text-sm flex items-center space-x-2">
                      <span>{item.source}</span>
                      <span class="text-xs font-normal text-slate-500">({item.type})</span>
                    </div>
                    <div class="text-xs text-slate-500 mt-0.5">
                      Last refresh: <span class="font-medium text-slate-700">{item.lastRefresh}</span> &middot; Latency: <span class="font-medium {item.statusCode === 'degraded' ? 'text-rose-600 font-bold' : 'text-slate-700'}">{item.latency}</span>
                    </div>
                  </div>
                </div>

                <div class="flex items-center space-x-3 self-end sm:self-center">
                  <div class="text-right">
                    <div class="text-xs font-semibold text-slate-700">{item.recordsProcessed}</div>
                    <div class="text-[11px] text-slate-500">Pipeline Quality: <strong class="{item.healthScore < 70 ? 'text-rose-600' : item.healthScore < 90 ? 'text-amber-600' : 'text-emerald-600'}">{item.healthScore}%</strong></div>
                  </div>
                  <span class="px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider {item.statusCode === 'healthy' ? 'bg-emerald-100 text-emerald-800' : item.statusCode === 'warning' ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'}">
                    {item.status}
                  </span>
                </div>
              </div>

              {#if item.warning}
                <div class="mt-2.5 pt-2.5 border-t border-slate-200/80 text-xs text-rose-700 flex items-center space-x-1.5 font-medium">
                  <AlertTriangle size={14} class="shrink-0" />
                  <span>{item.warning}</span>
                </div>
              {/if}
            </div>
          {/each}
        </div>

      </div>

      <!-- Modal Footer -->
      <div class="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
        <button
          on:click={triggerRefresh}
          class="inline-flex items-center space-x-1.5 text-xs text-blue-700 hover:text-blue-900 font-semibold cursor-pointer"
        >
          <RefreshCw size={14} class={refreshing ? 'animate-spin text-blue-600' : ''} />
          <span>{refreshing ? 'Testing connections...' : 'Refresh Integration Health Check'}</span>
        </button>
        <button
          on:click={onClose}
          class="px-4 py-2 rounded-lg bg-slate-200 text-slate-800 font-semibold text-xs hover:bg-slate-300 transition-colors"
        >
          Close
        </button>
      </div>

    </div>
  </div>
{/if}
