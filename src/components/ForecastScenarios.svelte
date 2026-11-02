<script lang="ts">
  import {
    workflow,
    dateAfter
  } from '../lib/workflow';
  import {
    ArrowRight,
    Calendar,
    AlertTriangle,
    CheckCircle2,
    Clock,
    TrendingUp,
    Sparkles,
    ShieldCheck,
    LineChart,
    BrainCircuit,
    RefreshCw,
    Activity,
    Info,
    Check
  } from '@lucide/svelte';

  export let study: any;
  export let forecastScenarios: any[];
  export let closedLoopOutcomes: any[];
  export let onSelectTab: (tab: string) => void;

  // Selected scenario view
  let selectedScenario = 'most_likely';

  // Completed user actions from the live workflow store
  $: userCompletedActions = $workflow.actions.filter(a => a.status === 'Completed');
  $: userAcceptedActions = $workflow.actions.filter(a => a.status === 'Accepted');

  // Calibration metrics
  const calibrationMetrics = {
    accuracy: '91.4%',
    maeDays: '1.2 days',
    brierScore: '0.082',
    studiesTrained: '48 Phase II/III oncology trials'
  };
</script>

<div class="space-y-6">

  <!-- ========================================================================= -->
  <!-- HERO BANNER: FORECAST & CLOSED-LOOP OUTCOME LEARNING                      -->
  <!-- ========================================================================= -->
  <div class="rounded-2xl bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950 text-white p-6 shadow-md border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-6">
    <div class="max-w-2xl">
      <span class="text-[10px] font-extrabold uppercase tracking-widest text-blue-300">
        EVIDENCE-BASED FORECASTING &amp; CLOSED-LOOP LEARNING
      </span>
      <h1 class="text-2xl sm:text-3xl font-extrabold text-white mt-1 tracking-tight">
        DBL Forecast &amp; Action-to-Outcome Learning
      </h1>
      <p class="text-xs sm:text-sm text-slate-300 mt-1.5 leading-relaxed">
        Evidence-based DBL date forecasting with continuous feedback loop: predict &rarr; explain &rarr; recommend &rarr; act &rarr; measure &rarr; learn.
      </p>
    </div>

    <div class="shrink-0 p-4 rounded-xl bg-white/10 backdrop-blur-md border border-white/15 max-w-xs text-xs text-blue-100">
      <div class="flex items-center space-x-2 font-semibold text-white mb-1">
        <BrainCircuit size={15} class="text-blue-300" />
        <span>Self-Calibrating Engine</span>
      </div>
      <p class="text-[11px] text-blue-200/90 leading-relaxed">
        Comparing predicted impact with actual outcomes to refine future recommendations.
      </p>
    </div>
  </div>

  <!-- ========================================================================= -->
  <!-- SCENARIOS KPI COMPARISON ROW                                              -->
  <!-- ========================================================================= -->
  <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
    
    <!-- Planned Lock -->
    <div class="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
      <span class="text-[10px] uppercase font-bold text-slate-400 block">Planned Target DBL</span>
      <div class="text-2xl font-extrabold text-slate-900 mt-1 num-tabular">{study.plannedDbl}</div>
      <div class="text-xs text-slate-500 mt-0.5">Original milestone protocol date</div>
      <div class="text-[11px] text-blue-600 font-semibold mt-1">Target baseline</div>
    </div>

    <!-- Baseline Forecast -->
    <div class="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
      <span class="text-[10px] uppercase font-bold text-slate-400 block">Current AI Baseline</span>
      <div class="text-2xl font-extrabold text-rose-600 mt-1 num-tabular">{study.forecastDbl}</div>
      <div class="text-xs font-bold text-rose-600 mt-0.5">+{study.delayDays} days vs. planned</div>
      <div class="text-[11px] text-slate-500 mt-1">Range: {study.confidenceInterval.replace('2026', '')}</div>
    </div>

    <!-- Post-Intervention Simulated -->
    <div class="bg-white rounded-xl border border-blue-300 p-4 shadow-xs bg-blue-50/20 ring-1 ring-blue-300">
      <span class="text-[10px] uppercase font-bold text-blue-900 block">Post-Intervention Forecast</span>
      <div class="text-2xl font-extrabold text-blue-700 mt-1 num-tabular">2026-12-17</div>
      <div class="text-xs font-bold text-emerald-600 mt-0.5">4 days delay avoided</div>
      <div class="text-[11px] text-blue-800 mt-1">With 2 critical interventions executed</div>
    </div>

    <!-- Best Case Scenario -->
    <div class="bg-white rounded-xl border border-emerald-200 p-4 shadow-xs bg-emerald-50/20">
      <span class="text-[10px] uppercase font-bold text-emerald-900 block">Best-Case Path</span>
      <div class="text-2xl font-extrabold text-emerald-700 mt-1 num-tabular">2026-12-16</div>
      <div class="text-xs font-bold text-emerald-600 mt-0.5">+1 day variance</div>
      <div class="text-[11px] text-emerald-800 mt-1">If all actions complete in 48h</div>
    </div>

  </div>

  <!-- ========================================================================= -->
  <!-- SCENARIO MODELING & ASSUMPTIONS TABLE                                     -->
  <!-- ========================================================================= -->
  <div class="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
    <div class="p-5 border-b border-slate-100 flex items-center justify-between">
      <div>
        <h3 class="text-sm font-bold text-slate-900">Multi-Scenario Forecast Matrix</h3>
        <p class="text-[11px] text-slate-500 mt-0.5">
          Avoids single-date determinism by explicitly modeling velocity and dependency assumptions.
        </p>
      </div>

      <button
        on:click={() => onSelectTab('simulator')}
        class="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center space-x-1"
      >
        <span>Build custom scenario in Simulator</span>
        <ArrowRight size={13} />
      </button>
    </div>

    <div class="overflow-x-auto">
      <table class="w-full text-left border-collapse text-xs">
        <thead>
          <tr class="bg-slate-50 text-slate-500 border-b border-slate-200 text-[10px] font-bold uppercase tracking-wider">
            <th class="py-3 px-4">Scenario</th>
            <th class="py-3 px-3">Forecast Date</th>
            <th class="py-3 px-3">Delay vs. Plan</th>
            <th class="py-3 px-3">Probability</th>
            <th class="py-3 px-4">Core Model Assumptions</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100 text-slate-700 font-medium">
          <tr class="hover:bg-emerald-50/30 transition-colors">
            <td class="py-3.5 px-4 font-bold text-emerald-800 flex items-center space-x-2">
              <span class="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
              <span>Best Case</span>
            </td>
            <td class="py-3.5 px-3 font-mono font-bold text-slate-900">2026-12-16</td>
            <td class="py-3.5 px-3 font-bold text-emerald-600">+1 day</td>
            <td class="py-3.5 px-3 text-slate-600">20%</td>
            <td class="py-3.5 px-4 text-slate-600 leading-relaxed">
              Critical safety discrepancies resolved within 48h; LabCorp delivers checksum-verified binary batch by 2026-11-01; query closure exceeds 12/day.
            </td>
          </tr>
          <tr class="hover:bg-blue-50/30 transition-colors bg-blue-50/10">
            <td class="py-3.5 px-4 font-bold text-blue-800 flex items-center space-x-2">
              <span class="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
              <span>Most Likely (Current Velocity)</span>
            </td>
            <td class="py-3.5 px-3 font-mono font-bold text-blue-900">2026-12-19</td>
            <td class="py-3.5 px-3 font-bold text-amber-600">+4 days</td>
            <td class="py-3.5 px-3 font-bold text-slate-900">55%</td>
            <td class="py-3.5 px-4 text-slate-600 leading-relaxed">
              Safety unfreezing completed after medical review call; central lab transfer resolved in 72h; routine query velocity maintains historical average.
            </td>
          </tr>
          <tr class="hover:bg-rose-50/30 transition-colors">
            <td class="py-3.5 px-4 font-bold text-rose-800 flex items-center space-x-2">
              <span class="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
              <span>At Risk (Unresolved Blocker)</span>
            </td>
            <td class="py-3.5 px-3 font-mono font-bold text-rose-700">2026-12-23</td>
            <td class="py-3.5 px-3 font-bold text-rose-700">+8 days</td>
            <td class="py-3.5 px-3 text-slate-600">25%</td>
            <td class="py-3.5 px-4 text-slate-600 leading-relaxed">
              Vendor transfer requires secondary sample assay re-run; investigator signature delay at Seoul and Boston extends beyond LSLV cut-off.
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>

  <!-- ========================================================================= -->
  <!-- SIGNATURE DIFFERENTIATOR: ACTION-TO-OUTCOME CLOSED LOOP LEARNING TABLE   -->
  <!-- ========================================================================= -->
  <div class="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden space-y-4 p-5">
    
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
      <div>
        <div class="flex items-center space-x-2">
          <span class="px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-extrabold text-[10px] uppercase tracking-wider">
            Signature Differentiator
          </span>
          <span class="text-xs text-slate-500">Closed-Loop AI Decision Engine</span>
        </div>
        <h2 class="text-base font-bold text-slate-900 mt-1">
          Did the intervention make the expected difference?
        </h2>
        <p class="text-xs text-slate-500 mt-0.5">
          DBLock AI closes the loop by comparing predicted impacts with observed outcomes to update underlying Bayesian velocity parameters.
        </p>
      </div>

      <div class="flex items-center space-x-2 self-start sm:self-center">
        <span class="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center space-x-1">
          <CheckCircle2 size={13} />
          <span>Continuous Model Learning Active</span>
        </span>
      </div>
    </div>

    <!-- Closed-Loop Outcome Table -->
    <div class="overflow-x-auto">
      <table class="w-full text-left border-collapse text-xs">
        <thead>
          <tr class="bg-slate-50 text-slate-500 border-b border-slate-200 text-[10px] font-bold uppercase tracking-wider">
            <th class="py-3 px-3">Recommendation Issued</th>
            <th class="py-3 px-3">Human Decision</th>
            <th class="py-3 px-2 text-center">Status</th>
            <th class="py-3 px-2 text-center">Readiness &Delta;</th>
            <th class="py-3 px-2 text-center">Expected Impact</th>
            <th class="py-3 px-2 text-center">Actual Outcome</th>
            <th class="py-3 px-4">Learning Captured for Future Predictions</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100 font-medium text-slate-700">
          {#each closedLoopOutcomes as out}
            <tr class="hover:bg-slate-50/70 transition-colors">
              <td class="py-3.5 px-3 font-semibold text-slate-900">
                <div>{out.intervention}</div>
                <div class="text-[10px] text-slate-400 font-normal">{out.category} &middot; {out.recommendedDate}</div>
              </td>
              <td class="py-3.5 px-3 text-slate-700">
                {out.humanDecision}
              </td>
              <td class="py-3.5 px-2 text-center">
                <span class="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold {out.actionStatus === 'Completed' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'}">
                  {out.actionStatus}
                </span>
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

    <!-- Complete Decision Loop Schematic -->
    <div class="pt-4 border-t border-slate-100">
      <div class="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2.5">
        Complete Clinical Decision Loop
      </div>
      <div class="grid grid-cols-2 sm:grid-cols-6 gap-2 text-center text-xs">
        <div class="p-2.5 rounded-lg bg-blue-50 border border-blue-200">
          <div class="text-[10px] font-bold text-blue-600 uppercase">Step 1</div>
          <div class="font-bold text-blue-950 mt-0.5">Detect Risk</div>
          <div class="text-[10px] text-blue-800 mt-0.5">Continuous signals</div>
        </div>
        <div class="p-2.5 rounded-lg bg-blue-50 border border-blue-200">
          <div class="text-[10px] font-bold text-blue-600 uppercase">Step 2</div>
          <div class="font-bold text-blue-950 mt-0.5">Explain Cause</div>
          <div class="text-[10px] text-blue-800 mt-0.5">Critical-path factors</div>
        </div>
        <div class="p-2.5 rounded-lg bg-blue-50 border border-blue-200">
          <div class="text-[10px] font-bold text-blue-600 uppercase">Step 3</div>
          <div class="font-bold text-blue-950 mt-0.5">Recommend</div>
          <div class="text-[10px] text-blue-800 mt-0.5">Owner &amp; due date</div>
        </div>
        <div class="p-2.5 rounded-lg bg-blue-50 border border-blue-200">
          <div class="text-[10px] font-bold text-blue-600 uppercase">Step 4</div>
          <div class="font-bold text-blue-950 mt-0.5">Simulate</div>
          <div class="text-[10px] text-blue-800 mt-0.5">What-if impact</div>
        </div>
        <div class="p-2.5 rounded-lg bg-blue-50 border border-blue-200">
          <div class="text-[10px] font-bold text-blue-600 uppercase">Step 5</div>
          <div class="font-bold text-blue-950 mt-0.5">Act &amp; Approve</div>
          <div class="text-[10px] text-blue-800 mt-0.5">Human governance</div>
        </div>
        <div class="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200">
          <div class="text-[10px] font-bold text-emerald-600 uppercase">Step 6</div>
          <div class="font-bold text-emerald-950 mt-0.5">Measure &amp; Learn</div>
          <div class="text-[10px] text-emerald-800 mt-0.5">Closed loop updates</div>
        </div>
      </div>
    </div>

  </div>

  <!-- ========================================================================= -->
  <!-- MODEL CALIBRATION & ENGINE ACCURACY METRICS                               -->
  <!-- ========================================================================= -->
  <div class="grid grid-cols-1 sm:grid-cols-4 gap-4">
    <div class="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
      <span class="text-[10px] uppercase font-bold text-slate-400 block">Historical Model Accuracy</span>
      <div class="text-2xl font-extrabold text-blue-700 mt-1 num-tabular">{calibrationMetrics.accuracy}</div>
      <div class="text-[11px] text-slate-500 mt-0.5">DBL lock date accuracy &plusmn;2d</div>
    </div>

    <div class="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
      <span class="text-[10px] uppercase font-bold text-slate-400 block">Mean Absolute Error (MAE)</span>
      <div class="text-2xl font-extrabold text-emerald-700 mt-1 num-tabular">{calibrationMetrics.maeDays}</div>
      <div class="text-[11px] text-slate-500 mt-0.5">Average prediction error margin</div>
    </div>

    <div class="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
      <span class="text-[10px] uppercase font-bold text-slate-400 block">Brier Calibration Score</span>
      <div class="text-2xl font-extrabold text-slate-900 mt-1 num-tabular">{calibrationMetrics.brierScore}</div>
      <div class="text-[11px] text-emerald-600 font-semibold mt-0.5">High probabilistic calibration</div>
    </div>

    <div class="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
      <span class="text-[10px] uppercase font-bold text-slate-400 block">Training Benchmark</span>
      <div class="text-sm font-bold text-slate-800 mt-1">{calibrationMetrics.studiesTrained}</div>
      <div class="text-[10px] text-slate-400 mt-0.5">Supervised learning prior weights</div>
    </div>
  </div>

  <!-- Footnote -->
  <div class="text-[11px] text-slate-400 flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-slate-200">
    <div>
      Data refreshed: 2026-10-31 08:00 UTC &middot; Sources: EDC, Safety, Central Lab, eCOA, Coding, IRT
    </div>
    <div class="font-medium text-slate-500">
      DBLock AI &middot; Clinical Data Science Workbench
    </div>
  </div>

</div>
