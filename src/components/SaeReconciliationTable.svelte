<script lang="ts">
  import { ChevronDown, ChevronRight } from '@lucide/svelte';

  type Discrepancy = {
    id: string;
    siteId: string;
    siteName: string;
    subjectId: string;
    eventTerm: string;
    discrepancyType: string;
    criticality: string;
    daysOpen: number;
    delayImpact: string;
    ballInCourt: string;
    lead: string;
    suggestedAction: string;
    raveStatus: string;
    argusStatus: string;
    auditTrail: string;
    reconciliationStatus?: string;
    resolutionNote?: string;
    fieldDifferences?: { field: string; rave: string; argus: string }[];
  };

  export let cases: Discrepancy[];
  export let siteScoped = false;

  let siteFilter = '';
  let ownerFilter = '';
  let statusFilter = 'open';
  let expandedCaseId: string | null = null;

  const isBlocker = (record: Discrepancy) => record.criticality === 'Critical Path Blocker';

  $: rows = cases.map(record => ({
    ...record,
    status: record.reconciliationStatus ?? 'Open',
    open: record.reconciliationStatus !== 'Resolved'
  }));
  $: siteOptions = Array.from(new Map(rows.map(row => [row.siteId, row.siteName])));
  $: ownerOptions = [...new Set(rows.map(row => row.ballInCourt))].sort();
  $: statusOptions = [...new Set(rows.map(row => row.status))].sort();

  $: scopedRows = rows.filter(row =>
    (!siteFilter || row.siteId === siteFilter) && (!ownerFilter || row.ballInCourt === ownerFilter)
  );
  $: openRows = scopedRows.filter(row => row.open);
  $: blockerCount = openRows.filter(isBlocker).length;
  $: oldestOpen = openRows.reduce((oldest, row) => Math.max(oldest, row.daysOpen), 0);
  $: visibleRows = scopedRows.filter(row => {
    if (statusFilter === 'open') return row.open;
    return !statusFilter || row.status === statusFilter;
  }).sort((a, b) =>
    Number(b.open && isBlocker(b)) - Number(a.open && isBlocker(a)) ||
    Number(b.open) - Number(a.open) ||
    b.daysOpen - a.daysOpen ||
    a.id.localeCompare(b.id)
  );

  $: if (!visibleRows.some(row => row.id === expandedCaseId)) expandedCaseId = null;
</script>

<section id="sae-reconciliation-queue" aria-labelledby="sae-reconciliation-heading" tabindex="-1" class="db-card min-w-0 scroll-mt-32 p-4 sm:p-6">
  <div class="flex flex-wrap items-start justify-between gap-3">
    <div>
      <h3 id="sae-reconciliation-heading" class="text-base font-semibold text-slate-900">SAE reconciliation</h3>
      <p class="mt-1 text-xs text-slate-500">Rave EDC and Argus Safety discrepancies · {siteScoped ? 'Site' : 'Study'} demo snapshot</p>
    </div>
    <dl class="flex flex-wrap gap-x-5 gap-y-2 text-xs" aria-live="polite">
      <div>
        <dt class="text-slate-500">Open discrepancies</dt>
        <dd class="mt-0.5 text-lg font-semibold text-slate-900 num-tabular">{openRows.length}</dd>
      </div>
      <div>
        <dt class="text-slate-500">Lock blockers</dt>
        <dd class="mt-0.5 text-lg font-semibold num-tabular {blockerCount ? 'text-rose-700' : 'text-slate-900'}">{blockerCount}</dd>
      </div>
      <div>
        <dt class="text-slate-500">Oldest open case</dt>
        <dd class="mt-0.5 text-lg font-semibold text-slate-900 num-tabular">{openRows.length ? `${oldestOpen}d` : '—'}</dd>
      </div>
    </dl>
  </div>

  {#if cases.length}
    <div class="my-4 flex flex-wrap gap-3 text-xs">
      {#if !siteScoped}
        <div class="flex flex-col gap-1 font-medium text-slate-700">
          <label for="sae-filter-site">Site</label>
          <select id="sae-filter-site" bind:value={siteFilter} class="max-w-64 rounded-lg border border-slate-200 bg-white px-2 py-2">
            <option value="">All sites</option>
            {#each siteOptions as [id, name] (id)}
              <option value={id}>{name}</option>
            {/each}
          </select>
        </div>
      {/if}
      <div class="flex flex-col gap-1 font-medium text-slate-700">
        <label for="sae-filter-owner">Owner</label>
        <select id="sae-filter-owner" bind:value={ownerFilter} class="max-w-64 rounded-lg border border-slate-200 bg-white px-2 py-2">
          <option value="">All owners</option>
          {#each ownerOptions as owner (owner)}
            <option value={owner}>{owner}</option>
          {/each}
        </select>
      </div>
      <div class="flex flex-col gap-1 font-medium text-slate-700">
        <label for="sae-filter-status">Reconciliation status</label>
        <select id="sae-filter-status" bind:value={statusFilter} class="rounded-lg border border-slate-200 bg-white px-2 py-2">
          <option value="open">Open cases</option>
          <option value="">All statuses</option>
          {#each statusOptions.filter(status => status !== 'Open') as status (status)}
            <option value={status}>{status}</option>
          {/each}
        </select>
      </div>
    </div>

  {/if}

    <!-- svelte-ignore a11y_no_noninteractive_tabindex (Keyboard users can focus and scroll the table horizontally.) -->
    <div class="mt-4 overflow-x-auto rounded-xl border border-slate-200" role="region" aria-label="SAE case table" tabindex="0">
      <table class="w-full text-left text-xs {visibleRows.length ? 'min-w-[780px]' : ''}">
        <thead class="border-b border-slate-200 bg-slate-50 text-slate-600">
          <tr>
            <th scope="col" class="p-3 font-semibold">Case / subject</th>
            <th scope="col" class="p-3 font-semibold">Discrepancy</th>
            <th scope="col" class="p-3 font-semibold">Status / lock impact</th>
            <th scope="col" class="whitespace-nowrap p-3 text-right font-semibold">Days open</th>
            <th scope="col" class="p-3 font-semibold">Current owner</th>
            <th scope="col" class="p-3 font-semibold">Next action</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100 text-slate-700">
          {#each visibleRows as row (row.id)}
            <tr class="align-top hover:bg-slate-50/70">
              <th scope="row" class="p-3">
                <button
                  type="button"
                  class="flex items-center gap-1 whitespace-nowrap text-left font-mono font-semibold text-blue-700 hover:underline"
                  aria-expanded={expandedCaseId === row.id}
                  aria-controls={expandedCaseId === row.id ? `sae-evidence-${row.id}` : undefined}
                  onclick={() => expandedCaseId = expandedCaseId === row.id ? null : row.id}
                >
                  {#if expandedCaseId === row.id}<ChevronDown size={14} />{:else}<ChevronRight size={14} />{/if}
                  {row.id}
                </button>
                <span class="mt-1 block whitespace-nowrap font-normal text-slate-500">{row.subjectId} · Site {row.siteId}</span>
              </th>
              <td class="p-3">
                <div class="font-semibold text-slate-900">{row.eventTerm}</div>
                <div class="mt-1 text-slate-600">{row.discrepancyType}</div>
              </td>
              <td class="p-3">
                <span class="font-medium">{row.status}</span>
                {#if row.open}
                  <span class="mt-1 block w-fit rounded-md px-1.5 py-0.5 font-semibold {isBlocker(row) ? 'bg-rose-50 text-rose-700' : 'bg-slate-100 text-slate-700'}">
                    {isBlocker(row) ? 'Lock blocker' : row.criticality}
                  </span>
                {/if}
              </td>
              <td class="p-3 text-right font-medium num-tabular">{row.daysOpen}</td>
              <td class="p-3 font-medium">{row.ballInCourt}</td>
              <td class="p-3 leading-relaxed">{row.suggestedAction}</td>
            </tr>
            {#if expandedCaseId === row.id}
              <tr id={`sae-evidence-${row.id}`} class="bg-slate-50/70">
                <td colspan="6" class="space-y-3 p-4">
                  <h4 class="font-semibold text-slate-900">Source comparison</h4>
                  <table class="w-full table-fixed text-left" aria-label={`Source comparison for ${row.id}`}>
                    <thead class="border-b border-slate-200 text-slate-500">
                      <tr><th scope="col" class="w-1/5 p-2">Field</th><th scope="col" class="p-2">Rave EDC</th><th scope="col" class="p-2">Argus Safety</th></tr>
                    </thead>
                    <tbody class="divide-y divide-slate-200">
                      {#each row.fieldDifferences ?? [] as difference}
                        <tr class="align-top">
                          <th scope="row" class="p-2 font-semibold text-slate-900">{difference.field}</th>
                          <td class="p-2">{difference.rave}</td>
                          <td class="p-2">{difference.argus}</td>
                        </tr>
                      {/each}
                      <tr class="align-top">
                        <th scope="row" class="p-2 font-semibold text-slate-900">Source record</th>
                        <td class="p-2">{row.raveStatus}</td>
                        <td class="p-2">{row.argusStatus}</td>
                      </tr>
                    </tbody>
                  </table>
                  <dl class="grid grid-cols-3 gap-3 border-t border-slate-200 pt-3">
                    <div class="col-span-2"><dt class="font-semibold text-slate-900">Audit evidence</dt><dd class="mt-1 leading-relaxed">{row.auditTrail}</dd></div>
                    <div><dt class="font-semibold text-slate-900">Safety lead</dt><dd class="mt-1">{row.lead}</dd></div>
                    {#if row.open && row.delayImpact}
                      <div><dt class="font-semibold text-slate-900">Estimated case delay</dt><dd class="mt-1">{row.delayImpact}</dd></div>
                    {/if}
                    {#if row.resolutionNote}
                      <div class="col-span-2"><dt class="font-semibold text-slate-900">Resolution note</dt><dd class="mt-1">{row.resolutionNote}</dd></div>
                    {/if}
                  </dl>
                </td>
              </tr>
            {/if}
          {:else}
            <tr>
              <td colspan="6" class="p-3 text-sm text-slate-600">
                {cases.length ? 'No discrepancies match these filters.' : `No SAE discrepancies are recorded for this ${siteScoped ? 'site' : 'study'} in the demo snapshot.`}
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>

  {#if siteScoped}
    <a href="#sae-reconciliation" class="mt-4 inline-block text-xs font-semibold text-blue-700 hover:underline">
      View study-wide SAE reconciliation &rarr;
    </a>
  {/if}
</section>
