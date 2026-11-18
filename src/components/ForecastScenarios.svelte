<script lang="ts">
  import {
    Calendar,
    AlertTriangle,
    CheckCircle2,
    Clock,
    Sparkles,
    Compass,
    Sliders,
    Activity,
    Layers,
    Info
  } from '@lucide/svelte';

  export let study: any;
  export let forecastScenarios: any[] = [];
  export let closedLoopOutcomes: any[];
  export let onSelectTab: (tab: string) => void;

  let selectedScenarioKey: 'best_case' | 'most_likely' | 'at_risk' = 'most_likely';

  const scenariosCatalog = {
    best_case: {
      key: 'best_case',
      name: 'Best Case Scenario (Earlier Completion)',
      targetDate: '15 December 2026 (Unchanged)',
      potentialDblDate: '14 December 2026',
      varianceLabel: '1 day earlier than target (-1d)',
      targetMeetingLikelihood: '78% likelihood of meeting 15 Dec target',
      color: 'emerald',
      assumptions: 'Critical interventions (SAE recon + LabCorp transfer) executed within 48 hours; zero new SAEs post-LSLV; query closure hits 12/day.',
      drivers: [
        {
          driver: 'Safety Reconciliation Accelerated',
          sitesOrVendors: 'Site 104 (Boston Medical Center) & Oracle Argus',
          items: 'SAE-REC-104-01 & SAE-REC-104-02 reconciled within 24h (-3.0d shift)'
        },
        {
          driver: 'Expedited LabCorp ctDNA Re-Export',
          sitesOrVendors: 'Vendor: LabCorp Bioanalytical Geneva (Sites 104 & 317)',
          items: 'Batch #LXB-8921 (48 samples) passes SHA-256 checksum on Nov 01 (-1.8d shift)'
        }
      ]
    },
    most_likely: {
      key: 'most_likely',
      name: 'Most Likely Scenario (With Planned Actions)',
      targetDate: '15 December 2026 (Unchanged)',
      potentialDblDate: '19 December 2026',
      varianceLabel: '4 days after target (+4d)',
      targetMeetingLikelihood: '55% scenario probability · 64% likelihood within 4 days of target',
      color: 'blue',
      assumptions: 'Safety unfreezing completed after joint medical review call; LabCorp transfer ingested in 72h; routine query velocity maintains baseline.',
      drivers: [
        {
          driver: 'Safety Reconciliation (35% weight)',
          sitesOrVendors: 'Site 104 (Boston) & Oracle Argus Safety',
          items: 'SAE-REC-104-01 (Subj 104-003 CRS) & SAE-REC-104-02 (Subj 104-012 Death Form DD-01)'
        },
        {
          driver: 'Central Laboratory Transfer (30% weight)',
          sitesOrVendors: 'Vendor: LabCorp Bioanalytical (Sites 104 & 317)',
          items: 'Batch #LXB-8921 (48 ctDNA NGS samples overdue 4d)'
        },
        {
          driver: 'Ageing Queries >14d (22% weight)',
          sitesOrVendors: 'Sites 104 & 317 & BioClinica Imaging',
          items: 'QRY-104-089 & QRY-317-044 (5 endpoint-critical RECIST queries + 9 routine)'
        }
      ]
    },
    at_risk: {
      key: 'at_risk',
      name: 'At-Risk Scenario (Unmitigated Drift)',
      targetDate: '15 December 2026 (Unchanged)',
      potentialDblDate: '23 December 2026',
      varianceLabel: '8 days after target (+8d)',
      targetMeetingLikelihood: '18% likelihood of meeting 15 Dec target without intervention',
      color: 'rose',
      assumptions: 'LabCorp transfer requires secondary wet-lab re-assay; PI sign-offs at Site 405 & Site 104 slip past LSLV window.',
      drivers: [
        {
          driver: 'Secondary Biomarker Re-Assay Delay',
          sitesOrVendors: 'Vendor: LabCorp Geneva & Eurofins Louisville',
          items: 'Batch #LXB-8921 & #LXB-8940 (160 total sample records)'
        },
        {
          driver: 'PI Electronic Signature Bottleneck',
          sitesOrVendors: 'Site 405 (Seoul) & Site 104 (Boston)',
          items: 'SIG-405-C4C6 (18 completed casebooks unsigned >14 days)'
        }
      ]
    }
  };

  $: activeScenario = scenariosCatalog[selectedScenarioKey];
</script>

<div class="space-y-6">

  <!-- ========================================================================= -->
  <!-- PAGE HEADER                                                               -->
  <!-- ========================================================================= -->
  <div class="flex flex-col sm:flex-row sm:items-end justify-between gap-3 pb-1">
    <div>
      <h1 class="text-2xl sm:text-[26px] font-bold tracking-tight text-slate-900 font-display">
        Forecast &amp; Scenarios
      </h1>
      <p class="text-sm text-slate-500 mt-1">
        Compare the unchanged Target DBL (15 Dec) against Potential DBL trajectories and target-meeting likelihood.
      </p>
    </div>
    <div class="px-3 py-1.5 rounded-xl bg-white border border-slate-200/90 text-xs font-semibold text-slate-700 shadow-2xs shrink-0 num-tabular">
      Target Likelihood: <span class="text-amber-600">28% baseline</span> &rarr; <span class="text-emerald-600">74% with actions</span>
    </div>
  </div>

  <!-- ========================================================================= -->
  <!-- TOP 3 KPI CARDS: TARGET DATE (UNCHANGED) | POTENTIAL DBL | LIKELIHOOD     -->
  <!-- (Image 4 Blue: Separate Target vs Forecast + Bijal Target Likelihood)     -->
  <!-- ========================================================================= -->
  <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
    
    <!-- 1. Agreed Target DBL Date (Unchanged) -->
    <div class="db-card p-5 flex items-center gap-4">
      <div class="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
        <Clock size={20} />
      </div>
      <div>
        <div class="text-xs font-semibold text-slate-500">Agreed Target DBL</div>
        <div class="text-xl font-bold text-slate-900 mt-1 num-tabular tracking-tight">
          15 Dec 2026
        </div>
        <div class="text-xs text-slate-500 mt-0.5">Unchanged &middot; LSLV 30 Nov 2026</div>
      </div>
    </div>

    <!-- 2. Potential DBL Date (Based on Current Progress) -->
    <div class="db-card p-5 flex items-center gap-4">
      <div class="w-11 h-11 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
        <Calendar size={20} />
      </div>
      <div>
        <div class="text-xs font-semibold text-slate-500">Potential DBL (Current)</div>
        <div class="text-xl font-bold text-slate-900 mt-1 num-tabular tracking-tight">
          21 Dec 2026
          <span class="text-xs font-semibold text-rose-600 ml-1">(+6d)</span>
        </div>
        <div class="text-xs text-slate-500 mt-0.5">Range: 18–22 Dec &middot; Moderate conf.</div>
      </div>
    </div>

    <!-- 3. Likelihood of Meeting Agreed Target Date -->
    <div class="db-card p-5 flex items-center gap-4">
      <div class="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
        <CheckCircle2 size={20} />
      </div>
      <div>
        <div class="text-xs font-semibold text-slate-500">Target-Meeting Likelihood</div>
        <div class="text-xl font-bold text-emerald-600 mt-1 num-tabular tracking-tight">
          28% &rarr; 74% <span class="text-xs font-medium text-slate-500">with actions</span>
        </div>
        <div class="text-xs text-slate-500 mt-0.5">
          Probability of locking by 15 Dec 2026
        </div>
      </div>
    </div>

  </div>

  <!-- ========================================================================= -->
  <!-- ========================================================================= -->
  <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
    
    <div class="lg:col-span-6 bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
      <div class="flex items-center justify-between">
        <div>
          <span class="text-[10px] font-extrabold uppercase tracking-wider text-blue-600 block">
            Target Date vs. Potential DBL Date Scenarios
          </span>
          <h2 class="text-sm font-bold text-slate-900">
            Select a Scenario (Flags Earlier Completion or Possible Delay)
          </h2>
        </div>
        <button
          type="button"
          on:click={() => onSelectTab('simulator')}
          class="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center space-x-1 cursor-pointer"
        >
          <Sliders size={13} />
          <span>Simulator &rarr;</span>
        </button>
      </div>

      <!-- SVG Scenario Comparison Timeline Chart (Includes Best Case 14 Dec = 1d earlier than 15 Dec target!) -->
      <div class="bg-slate-50 rounded-xl border border-slate-200 p-4 relative">
        <svg viewBox="0 0 420 160" class="w-full h-auto overflow-visible text-[10px]">
          <!-- Unchanged Target DBL Vertical Line (2026-12-15) -->
          <line x1="150" y1="10" x2="150" y2="125" stroke="#1e293b" stroke-width="2" stroke-dasharray="3,3" />

          <!-- Scenario 1: Best Case (14 Dec -> 1 day EARLIER than target!) -->
          <text x="8" y="24" fill="#065f46" font-weight="700" font-size="9">Best case (Earlier)</text>
          <line x1="125" y1="21" x2="150" y2="21" stroke="#059669" stroke-width="3" stroke-linecap="round" />
          <circle cx="125" cy="21" r="5" fill="#059669" />
          <text x="160" y="24" fill="#065f46" font-family="monospace" font-weight="700" font-size="9">14 Dec (1d earlier than target)</text>

          <!-- Scenario 2: Most Likely (19 Dec -> +4d) -->
          <text x="8" y="54" fill="#1e40af" font-weight="700" font-size="9">Most likely</text>
          <line x1="150" y1="51" x2="235" y2="51" stroke="#2563eb" stroke-width="3.5" stroke-linecap="round" />
          <circle cx="235" cy="51" r="5.5" fill="#2563eb" />
          <text x="248" y="54" fill="#1e40af" font-family="monospace" font-weight="700" font-size="9">19 Dec (+4d after target)</text>

          <!-- Scenario 3: Current Progress (21 Dec -> +6d) -->
          <text x="8" y="84" fill="#64748b" font-weight="600" font-size="9">Current progress</text>
          <line x1="150" y1="81" x2="285" y2="81" stroke="#64748b" stroke-width="2.5" stroke-linecap="round" />
          <circle cx="285" cy="81" r="4.5" fill="#64748b" />
          <text x="298" y="84" fill="#475569" font-family="monospace" font-weight="700" font-size="9">21 Dec (+6d after target)</text>

          <!-- Scenario 4: At-Risk Path (23 Dec -> +8d) -->
          <text x="8" y="114" fill="#9f1239" font-weight="700" font-size="9">At-risk scenario</text>
          <line x1="150" y1="111" x2="335" y2="111" stroke="#f43f5e" stroke-width="3" stroke-linecap="round" />
          <circle cx="335" cy="111" r="5" fill="#f43f5e" />
          <text x="345" y="114" fill="#9f1239" font-family="monospace" font-weight="700" font-size="9">23 Dec (+8d)</text>

          <!-- Target DBL Text Label -->
          <text x="150" y="140" fill="#1e293b" font-weight="800" font-size="9" text-anchor="middle">Agreed Target DBL (Unchanged)</text>
          <text x="150" y="152" fill="#475569" font-family="monospace" font-weight="700" font-size="8.5" text-anchor="middle">15 December 2026</text>
        </svg>
      </div>

      <!-- Scenario Selector Buttons -->
      <div class="grid grid-cols-3 gap-2.5 text-xs">
        <button
          type="button"
          on:click={() => selectedScenarioKey = 'best_case'}
          class="p-3 rounded-xl border text-left transition-all cursor-pointer {selectedScenarioKey === 'best_case' ? 'border-emerald-500 bg-emerald-50/60 ring-2 ring-emerald-100' : 'border-slate-200 hover:border-emerald-300'}"
        >
          <div class="font-extrabold text-emerald-900">Best Case</div>
          <div class="font-mono font-bold text-emerald-700 mt-0.5">14 Dec (-1d early)</div>
          <div class="text-[10px] text-slate-500 mt-0.5">78% target likelihood</div>
        </button>

        <button
          type="button"
          on:click={() => selectedScenarioKey = 'most_likely'}
          class="p-3 rounded-xl border text-left transition-all cursor-pointer {selectedScenarioKey === 'most_likely' ? 'border-blue-600 bg-blue-50/60 ring-2 ring-blue-100' : 'border-slate-200 hover:border-blue-300'}"
        >
          <div class="font-extrabold text-blue-900">Most Likely</div>
          <div class="font-mono font-bold text-blue-700 mt-0.5">19 Dec (+4d)</div>
          <div class="text-[10px] text-slate-500 mt-0.5">55% scenario prob</div>
        </button>

        <button
          type="button"
          on:click={() => selectedScenarioKey = 'at_risk'}
          class="p-3 rounded-xl border text-left transition-all cursor-pointer {selectedScenarioKey === 'at_risk' ? 'border-rose-500 bg-rose-50/60 ring-2 ring-rose-100' : 'border-slate-200 hover:border-rose-300'}"
        >
          <div class="font-extrabold text-rose-900">At Risk</div>
          <div class="font-mono font-bold text-rose-700 mt-0.5">23 Dec (+8d)</div>
          <div class="text-[10px] text-slate-500 mt-0.5">18% target likelihood</div>
        </button>
      </div>
    </div>

    <div class="lg:col-span-6 bg-white rounded-xl border-2 border-blue-200 p-5 shadow-xs space-y-4">
      <div>
        <span class="text-[10px] font-extrabold uppercase tracking-wider text-blue-600 block">
          Scenario &rarr; Assumptions &rarr; Delay Drivers &rarr; Sites/Vendors &rarr; Items
        </span>
        <div class="flex items-center justify-between mt-1">
          <h2 class="text-base font-extrabold text-slate-900">{activeScenario.name}</h2>
          <span class="px-2.5 py-0.5 rounded-full text-xs font-bold {activeScenario.color === 'emerald' ? 'bg-emerald-100 text-emerald-800' : activeScenario.color === 'blue' ? 'bg-blue-100 text-blue-800' : 'bg-rose-100 text-rose-800'}">
            {activeScenario.potentialDblDate} ({activeScenario.varianceLabel})
          </span>
        </div>
      </div>

      <div class="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5 text-xs">
        <div class="flex items-center justify-between">
          <strong class="text-slate-900 uppercase text-[10px] tracking-wider">Scenario Assumptions</strong>
          <span class="text-[11px] font-bold text-blue-700">{activeScenario.targetMeetingLikelihood}</span>
        </div>
        <p class="text-slate-700 leading-relaxed">{activeScenario.assumptions}</p>
      </div>

      <div class="space-y-2.5">
        <div class="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
          Delay Driver &rarr; Affected Sites or Vendors &rarr; Individual Open Items
        </div>
        {#each activeScenario.drivers as drv}
          <div class="p-3 rounded-xl border border-slate-200 bg-white space-y-1 text-xs">
            <div class="font-bold text-slate-900">{drv.driver}</div>
            <div class="text-[11px] text-blue-700 font-semibold">Sites / Vendors: {drv.sitesOrVendors}</div>
            <div class="text-[11px] text-slate-600 font-mono bg-slate-50 p-2 rounded border border-slate-100 mt-1">
              Individual Items: {drv.items}
            </div>
          </div>
        {/each}
      </div>
    </div>

  </div>

  <!-- ========================================================================= -->
  <!-- EXPECTED IMPACT -> LEARNING CAPTURED (Image 5 Blue Requirement)           -->
  <!-- ========================================================================= -->
  <div class="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden space-y-4 p-5">
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
      <div>
        <div class="flex items-center space-x-2">
          <span class="px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-extrabold text-[10px] uppercase tracking-wider">
            Closed-Loop Learning
          </span>
          <span class="text-xs text-slate-500">Intervention &rarr; Affected Records &rarr; Actual Outcome vs. Expected Impact &rarr; Learning Captured</span>
        </div>
        <h2 class="text-base font-bold text-slate-900 mt-1">
          Action-to-Outcome Verification &amp; Model Calibration
        </h2>
      </div>
    </div>

    <div class="overflow-x-auto">
      <table class="w-full text-left border-collapse text-xs">
        <thead>
          <tr class="bg-slate-50 text-slate-500 border-b border-slate-200 text-[10px] font-bold uppercase tracking-wider">
            <th class="py-3 px-3">Intervention &amp; Human Decision</th>
            <th class="py-3 px-3">Affected Source Records</th>
            <th class="py-3 px-2 text-center">Readiness &Delta;</th>
            <th class="py-3 px-2 text-center">Expected Impact</th>
            <th class="py-3 px-2 text-center">Actual Outcome</th>
            <th class="py-3 px-4">Learning Captured for Future Predictions</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100 font-medium text-slate-700">
          {#each closedLoopOutcomes as out, idx}
            <tr class="hover:bg-slate-50/70 transition-colors">
              <td class="py-3.5 px-3 font-semibold text-slate-900">
                <div>{out.intervention}</div>
                <div class="text-[10px] text-slate-500 font-normal">{out.humanDecision} &middot; {out.actionStatus}</div>
              </td>
              <td class="py-3.5 px-3 font-mono text-[11px] text-blue-700">
                {#if idx === 0}
                  SAE-REC-104-01, SAE-REC-104-02 (Site 104)
                {:else if idx === 1}
                  Batch #LXB-8921 (LabCorp 48 ctDNA samples)
                {:else if idx === 2}
                  QRY-317-044, QRY-104-089 (5 RECIST queries)
                {:else}
                  QRY-208-112 (+37 routine queries at Site 208)
                {/if}
              </td>
              <td class="py-3.5 px-2 text-center font-mono">
                {out.readinessBefore}% &rarr; <strong class="text-emerald-600">{out.readinessAfter}%</strong>
              </td>
              <td class="py-3.5 px-2 text-center font-mono font-bold text-slate-700">
                {out.expectedImpact}
              </td>
              <td class="py-3.5 px-2 text-center font-mono font-bold {out.statusBadge === 'exceeded' ? 'text-emerald-700' : out.statusBadge === 'partially_achieved' ? 'text-amber-700' : 'text-slate-500'}">
                {out.actualOutcome}
              </td>
              <td class="py-3.5 px-4 text-slate-600 leading-relaxed text-[11px] bg-slate-50/50 rounded">
                <div class="flex items-start space-x-1.5">
                  <Sparkles size={13} class="text-blue-600 shrink-0 mt-0.5" />
                  <span>{out.learning}</span>
                </div>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  </div>

</div>
