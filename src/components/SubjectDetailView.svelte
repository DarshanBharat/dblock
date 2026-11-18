<script lang="ts">
  import {
    ArrowLeft,
    AlertTriangle,
    ShieldAlert,
    CheckCircle2,
    Clock,
    FileSpreadsheet,
    FlaskConical,
    Activity,
    ChevronRight,
    User,
    Calendar,
    FileText,
    Check,
    CheckSquare
  } from '@lucide/svelte';

  export let subject: any;
  export let queries: { id: string; form: string; queryText: string; ageDays: number; isPrimaryEndpoint: boolean; status: string; actionRequired: string }[] = [];
  export let onBackToSite: () => void;
  export let onSelectTab: (tab: string) => void;

  let resolvedForm: string | null = null;
</script>

<div class="space-y-6">

  <!-- ========================================================================= -->
  <!-- BREADCRUMB & BACK NAVIGATION                                              -->
  <!-- ========================================================================= -->
  <div class="flex items-center justify-between">
    <div class="flex items-center space-x-2 text-xs">
      <button
        type="button"
        on:click={onBackToSite}
        class="inline-flex items-center text-slate-500 hover:text-slate-900 font-medium"
      >
        <ArrowLeft class="w-3.5 h-3.5 mr-1" />
        <span>Site {subject.siteId}</span>
      </button>
      <span class="text-slate-300">/</span>
      <span class="font-bold text-slate-900">Subject {subject.id}</span>
    </div>

    <div class="flex items-center space-x-2 text-xs">
      <span class="text-slate-500">Cohort:</span>
      <span class="font-semibold text-slate-800">{subject.cohort}</span>
    </div>
  </div>

  <!-- ========================================================================= -->
  <!-- SUBJECT PROFILE HERO CARD                                                 -->
  <!-- ========================================================================= -->
  <div class="bg-white rounded-lg border border-slate-200/90 p-5 shadow-xs">
    <div class="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b border-slate-200/80">
      <div class="space-y-1">
        <div class="flex items-center space-x-2">
          <span class="font-mono text-sm font-bold bg-slate-900 text-white px-2.5 py-0.5 rounded">
            {subject.id}
          </span>
          <span class="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200">
            {subject.riskLevel} risk
          </span>
          <span class="text-xs text-slate-500">{subject.status}</span>
        </div>
        <h2 class="text-lg font-bold text-slate-900 mt-1">
          {subject.syntheticSubject ? 'Synthetic demo record' : subject.initials + ' · ' + subject.sex + ', ' + subject.age + ' yrs'} &middot; Site {subject.siteId}
        </h2>
        <p class="text-xs text-slate-600">
          Enrolled in {subject.cohort}
        </p>
      </div>

      <div class="flex items-center space-x-4 bg-slate-50 rounded-md p-3 border border-slate-200 text-center">
        {#if subject.delayContributionDays != null}
        <div>
          <div class="text-[10px] font-semibold text-slate-500 uppercase">Delay Contribution</div>
          <div class="text-xl font-extrabold text-rose-600 num-tabular">+{subject.delayContributionDays}d</div>
          <div class="text-[10px] text-slate-500">to study DBL</div>
        </div>
        <div class="h-8 w-px bg-slate-200"></div>
        {/if}
        <div>
          <div class="text-[10px] font-semibold text-slate-500 uppercase">Open Queries</div>
          <div class="text-xl font-extrabold text-slate-900 num-tabular">{subject.openQueries}</div>
          <div class="text-[10px] text-rose-600 font-semibold">{subject.criticalQueries} on critical path</div>
        </div>
      </div>
    </div>

    <!-- Active Blockers Summary -->
    <div class="pt-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
      {#if subject.saeSummary}
        <div class="p-3 bg-rose-50/70 rounded-md border border-rose-200 space-y-1">
          <span class="font-bold text-rose-900 uppercase text-[10px] flex items-center">
            <ShieldAlert class="w-3.5 h-3.5 mr-1 text-rose-700" />
            Safety Discrepancy Active
          </span>
          <p class="text-rose-800 font-medium">{subject.saeSummary}</p>
        </div>
      {/if}

      {#if subject.recistIssues}
      <div class="p-3 bg-amber-50/70 rounded-md border border-amber-200 space-y-1">
        <span class="font-bold text-amber-900 uppercase text-[10px] flex items-center">
          <AlertTriangle class="w-3.5 h-3.5 mr-1 text-amber-700" />
          Primary Endpoint Discrepancy
        </span>
        <p class="text-amber-800 font-medium">{subject.recistIssues}</p>
      </div>
      {/if}
    </div>
  </div>

  {#if subject.cleaning}
    {@const cleaning = subject.cleaning}
    <section class="rounded-lg border border-slate-200 bg-white p-5">
      <h3 class="text-sm font-bold text-slate-900">EDC cleaning and freeze</h3>
      {#if !subject.syntheticSubject}
        <p class="mt-1 text-xs text-slate-500">Supplemental demo progress for the listed forms.</p>
      {/if}
      <dl class="mt-3 grid grid-cols-2 gap-3 text-xs sm:grid-cols-4">
        <div><dt>Entry</dt><dd class="font-bold">{cleaning.entered}/{cleaning.total} forms</dd></div>
        <div><dt>SDV</dt><dd class="font-bold">{cleaning.sdv}/{cleaning.total} forms</dd></div>
        <div><dt>SDR</dt><dd class="font-bold">{cleaning.sdr}/{cleaning.total} forms</dd></div>
        <div><dt>Freeze</dt><dd class="font-bold">{cleaning.frozen ? 'Frozen' : 'Not frozen'}</dd></div>
        <div><dt>Safety reconciliation</dt><dd class="font-bold">{cleaning.safetyOpen} open</dd></div>
        <div><dt>Vendor reconciliation</dt><dd class="font-bold">{cleaning.vendorOpen} open</dd></div>
        <div><dt>Medical coding</dt><dd class="font-bold">{cleaning.codingOpen} pending</dd></div>
        <div><dt>PI sign-off</dt><dd class="font-bold">{cleaning.piSigned ? 'Signed' : 'Pending'}</dd></div>
      </dl>
    </section>
  {/if}

  <section class="rounded-lg border border-slate-200 bg-white p-5">
    <h3 class="text-sm font-bold text-slate-900">Open query records ({queries.length} listed)</h3>
    {#if queries.length}
      <ul class="mt-2 divide-y divide-slate-100 text-xs">
        {#each queries as query (query.id)}
          <li class="space-y-1 py-2">
            <div class="font-bold">{query.id} · {query.form} · {query.isPrimaryEndpoint ? 'Endpoint-critical' : 'Routine'}</div>
            <div>{query.queryText}</div>
            <div class="text-slate-600">{query.status} · {query.ageDays} days open · {query.actionRequired}</div>
          </li>
        {/each}
      </ul>
    {:else}
      <p class="mt-2 text-xs text-slate-500">No open query records in this snapshot for this subject.</p>
    {/if}
  </section>

  <!-- ========================================================================= -->
  <!-- eCRF FORMS & FREEZE STATUS                                                -->
  <!-- ========================================================================= -->
  <div class="bg-white rounded-lg border border-slate-200 p-5 shadow-xs space-y-4">
    <div class="flex items-center justify-between">
      <div>
        <h3 class="text-sm font-bold text-slate-900">eCRF Case Report Forms Status ({subject.forms.length})</h3>
        <p class="text-xs text-slate-500">Medidata Rave electronic forms pending clinical data manager and PI sign-off</p>
      </div>
    </div>

    <div class="overflow-x-auto">
      <table class="min-w-full text-xs text-left divide-y divide-slate-200">
        <thead class="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
          <tr>
            <th class="py-2.5 px-3">Form Name</th>
            <th class="py-2.5 px-3">Category Flag</th>
            <th class="py-2.5 px-3 text-center">Status</th>
            <th class="py-2.5 px-3 text-right">Action</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100 font-medium">
          {#each subject.forms as form}
            <tr class="hover:bg-slate-50 transition-colors">
              <td class="py-3 px-3 font-bold text-slate-900">{form.name}</td>
              <td class="py-3 px-3">
                <span class="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold {
                  form.flag.includes('Critical') ? 'bg-rose-50 text-rose-700 border border-rose-200' : form.flag.includes('Endpoint') ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-slate-50 text-slate-600 border border-slate-200'
                }">
                  {form.flag}
                </span>
              </td>
              <td class="py-3 px-3 text-center">
                {#if resolvedForm === form.name}
                  <span class="inline-flex items-center text-emerald-700 font-bold text-[11px]">
                    <Check class="w-3.5 h-3.5 mr-1" /> Reconciled
                  </span>
                {:else}
                  <span class="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold {
                    form.status.includes('Query') || form.status.includes('Discrepant') || form.status.includes('Blocked') ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'
                  }">
                    {form.status}
                  </span>
                {/if}
              </td>
              <td class="py-3 px-3 text-right">
                {#if !subject.syntheticSubject && form.status !== 'Clean' && form.status !== 'Illustrative' && resolvedForm !== form.name}
                  <button
                    type="button"
                    on:click={() => resolvedForm = form.name}
                    class="px-2.5 py-1 rounded bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs font-semibold border border-blue-200"
                  >
                    Quick Align Note
                  </button>
                {:else}
                  <span class="text-slate-400 text-xs">{subject.syntheticSubject ? 'Read only' : 'Ready'}</span>
                {/if}
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  </div>

  {#if subject.timeline?.length}
  <!-- ========================================================================= -->
  <!-- TIMELINE AUDIT HISTORY                                                    -->
  <!-- ========================================================================= -->
  <div class="bg-white rounded-lg border border-slate-200 p-5 shadow-xs space-y-3">
    <div class="flex items-center justify-between">
      <h3 class="text-sm font-bold text-slate-900">Event Audit Timeline for {subject.id}</h3>
      <button
        type="button"
        on:click={() => onSelectTab('action_workbench')}
        class="text-xs font-semibold text-blue-600 hover:text-blue-800 inline-flex items-center"
      >
        <span>Open Safety Escalation in Workbench</span>
        <ChevronRight class="w-3.5 h-3.5 ml-0.5" />
      </button>
    </div>
    <div class="space-y-2.5 text-xs pt-1">
      {#each subject.timeline as item}
        <div class="flex items-start space-x-3">
          <div class="font-mono text-slate-500 font-semibold shrink-0 w-24">{item.date}</div>
          <div class="h-2 w-2 rounded-full bg-blue-500 mt-1 shrink-0"></div>
          <div class="text-slate-700 font-medium">{item.event}</div>
        </div>
      {/each}
    </div>
  </div>

  {/if}
</div>
