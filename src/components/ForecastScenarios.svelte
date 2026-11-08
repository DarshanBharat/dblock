<script lang="ts">
  import {
    workflow,
    dateAfter
  } from '../lib/workflow';
  import {
    Calendar,
    AlertTriangle,
    CheckCircle2,
    Clock,
    Sparkles,
    Check,
    Compass,
    Sliders,
    Activity
  } from '@lucide/svelte';

  export let study: any;
  export let forecastScenarios: any[];
  export let closedLoopOutcomes: any[];
  export let onSelectTab: (tab: string) => void;

  // Selected scenario view
  let selectedScenarioId = 'most_likely';

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
  <div class="rounded-2xl bg-gradient-to-r from-[#0d1b3e] via-[#10224d] to-[#122b68] text-white p-6 shadow-md border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
    <div class="max-w-xl z-10">
      <span class="text-[10px] font-extrabold uppercase tracking-widest text-blue-300">
        EVIDENCE-BASED FORECASTING &amp; CLOSED-LOOP LEARNING
      </span>
      <h1 class="text-2xl sm:text-3xl font-extrabold text-white mt-1 tracking-tight">
        DBL Forecast &amp; Scenario Intelligence
      </h1>
      <p class="text-xs sm:text-sm text-slate-300 mt-1.5 leading-relaxed">
        Avoid single-date guesswork. Evidence-based DBL date forecasting with confidence intervals, scenario modeling, and closed-loop learning.
      </p>
    </div>

    <!-- Right: Curved Trajectory Graphic with Glowing Indicator -->
    <div class="relative z-10 flex flex-col items-end text-right">
      <div class="text-xs text-blue-200">Continuous self-calibration.</div>
      <div class="text-xs font-bold text-white mt-0.5">Empowering human-governed trial milestones.</div>
      <svg class="w-64 h-12 mt-2 overflow-visible" viewBox="0 0 240 40">
        <path
          d="M 10 35 C 70 35, 120 15, 210 10"
          fill="none"
          stroke="rgba(96, 165, 250, 0.6)"
          stroke-width="2.5"
          stroke-linecap="round"
        />
        <circle cx="210" cy="10" r="5" fill="#38bdf8" />
        <circle cx="210" cy="10" r="10" fill="#38bdf8" opacity="0.3" class="animate-ping" />
      </svg>
    </div>

    <!-- Decorative glow -->
    <div class="absolute -right-10 -bottom-10 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
  </div>

  <!-- ========================================================================= -->
  <!-- TOP 3 KPI CARDS (Icons on LEFT matching Design System)                    -->
  <!-- ========================================================================= -->
  <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
    
    <!-- Current forecast DBL date -->
    <div class="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex items-center space-x-3.5">
      <div class="w-11 h-11 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
        <Calendar size={22} />
      </div>
      <div>
        <div class="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Current forecast DBL date</div>
        <div class="text-2xl font-extrabold text-slate-900 mt-0.5 num-tabular">
          {study.forecastDbl}
          <span class="text-xs font-bold text-rose-600 ml-1.5">(+6 days vs. plan)</span>
        </div>
        <div class="text-[11px] text-slate-400 mt-0.5">Confidence: Moderate (18&ndash;22 Dec)</div>
      </div>
    </div>

    <!-- Planned Target DBL -->
    <div class="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex items-center space-x-3.5">
      <div class="w-11 h-11 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
        <Clock size={22} />
      </div>
      <div>
        <div class="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Planned Target DBL</div>
        <div class="text-2xl font-extrabold text-slate-900 mt-0.5 num-tabular">
          {study.plannedDbl}
        </div>
        <div class="text-[11px] text-slate-500 mt-0.5">Baseline protocol target &middot; LSLV: 2026-11-30</div>
      </div>
    </div>

    <!-- Potential Delay Avoided -->
    <div class="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex items-center space-x-3.5">
      <div class="w-11 h-11 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
        <CheckCircle2 size={22} />
      </div>
      <div>
        <div class="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Potential Delay Avoided</div>
        <div class="text-2xl font-extrabold text-emerald-600 mt-0.5 num-tabular">
          4 &ndash; 5 days
        </div>
        <div class="text-xs font-bold text-emerald-700 mt-0.5">
          With top 2 interventions executed
        </div>
      </div>
    </div>

  </div>

  <!-- ========================================================================= -->
  <!-- SCENARIO TIMELINE COMPARISON GANTT & SELECTION                            -->
  <!-- ========================================================================= -->
  <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
    
    <!-- Left: Timeline Comparison Chart (7 Cols) -->
    <div class="lg:col-span-7 bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-sm font-bold text-slate-900">Multi-Scenario Timeline Comparison</h2>
          <p class="text-[11px] text-slate-500 mt-0.5">
            Range of lock trajectories based on operational execution speed and vendor adherence.
          </p>
        </div>
        <button
          type="button"
          on:click={() => onSelectTab('simulator')}
          class="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center space-x-1 cursor-pointer"
        >
          <Sliders size={13} />
          <span>Open Simulator &rarr;</span>
        </button>
      </div>

      <!-- SVG Scenario Comparison Timeline Chart -->
      <div class="bg-slate-50 rounded-xl border border-slate-200 p-4 relative">
        <svg viewBox="0 0 420 160" class="w-full h-auto overflow-visible text-[10px]">
          <!-- Planned DBL Vertical Dashed Line (2026-12-15) -->
          <line x1="110" y1="10" x2="110" y2="125" stroke="#94a3b8" stroke-width="1.8" stroke-dasharray="3,3" />

          <!-- Scenario 1: Best Case (Dec 16) -->
          <text x="10" y="24" fill="#065f46" font-weight="700" font-size="9">Best case scenario</text>
          <line x1="110" y1="21" x2="150" y2="21" stroke="#059669" stroke-width="3" stroke-linecap="round" />
          <circle cx="150" cy="21" r="5" fill="#059669" />
          <text x="165" y="24" fill="#065f46" font-family="monospace" font-weight="700" font-size="9">2026-12-16 (+1d)</text>

          <!-- Scenario 2: Most Likely (Dec 19) -->
          <text x="10" y="54" fill="#1e40af" font-weight="700" font-size="9">Most likely scenario</text>
          <line x1="110" y1="51" x2="230" y2="51" stroke="#2563eb" stroke-width="3.5" stroke-linecap="round" />
          <circle cx="230" cy="51" r="5.5" fill="#2563eb" />
          <text x="245" y="54" fill="#1e40af" font-family="monospace" font-weight="700" font-size="9">2026-12-19 (+4d)</text>

          <!-- Scenario 3: Current Baseline (Dec 21) -->
          <text x="10" y="84" fill="#64748b" font-weight="600" font-size="9">Current trajectory</text>
          <line x1="110" y1="81" x2="290" y2="81" stroke="#64748b" stroke-width="2.5" stroke-linecap="round" />
          <circle cx="290" cy="81" r="4.5" fill="#64748b" />
          <text x="305" y="84" fill="#475569" font-family="monospace" font-weight="700" font-size="9">2026-12-21 (+6d)</text>

          <!-- Scenario 4: At-Risk Path (Dec 23) -->
          <text x="10" y="114" fill="#9f1239" font-weight="700" font-size="9">At-risk scenario</text>
          <line x1="110" y1="111" x2="350" y2="111" stroke="#f43f5e" stroke-width="3" stroke-linecap="round" />
          <circle cx="350" cy="111" r="5" fill="#f43f5e" />
          <text x="360" y="114" fill="#9f1239" font-family="monospace" font-weight="700" font-size="9">2026-12-23 (+8d)</text>

          <!-- Planned DBL Text Label -->
          <text x="110" y="140" fill="#1e293b" font-weight="800" font-size="9" text-anchor="middle">Planned Target DBL</text>
          <text x="110" y="152" fill="#64748b" font-family="monospace" font-weight="700" font-size="8.5" text-anchor="middle">2026-12-15</text>
        </svg>
      </div>

      <div class="text-[11px] text-slate-500 flex items-center justify-between pt-1">
        <span>Variance spread: <strong>+1 day</strong> (Best case) to <strong>+8 days</strong> (At risk)</span>
        <span class="text-blue-600 font-semibold">Continuous Bayesian Calibration</span>
      </div>
    </div>

    <!-- Right: Core Assumptions Cards (5 Cols) -->
    <div class="lg:col-span-5 bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3.5">
      <div>
        <h2 class="text-sm font-bold text-slate-900">Scenario Assumptions Matrix</h2>
        <p class="text-[11px] text-slate-500 mt-0.5">
          Operational prerequisites defining each predictive trajectory.
        </p>
      </div>

      <div class="space-y-2.5 text-xs">
        <!-- Best Case Card -->
        <div class="p-3 rounded-lg border border-emerald-200 bg-emerald-50/40 space-y-1">
          <div class="flex items-center justify-between">
            <span class="font-bold text-emerald-900">Best Case (16 December)</span>
            <span class="px-2 py-0.2 rounded font-bold text-[10px] bg-emerald-100 text-emerald-800">20% Prob</span>
          </div>
          <p class="text-[11px] text-emerald-950/80 leading-relaxed">
            Critical safety discrepancies resolved within 48h; LabCorp delivers checksum-verified binary batch by 2026-11-01; query closure exceeds 12/day.
          </p>
        </div>

        <!-- Most Likely Card -->
        <div class="p-3 rounded-lg border border-blue-200 bg-blue-50/40 space-y-1">
          <div class="flex items-center justify-between">
            <span class="font-bold text-blue-900">Most Likely (19 December)</span>
            <span class="px-2 py-0.2 rounded font-bold text-[10px] bg-blue-100 text-blue-800">55% Prob</span>
          </div>
          <p class="text-[11px] text-blue-950/80 leading-relaxed">
            Safety unfreezing completed after medical review call; central lab transfer resolved in 72h; routine query velocity maintains historical average.
          </p>
        </div>

        <!-- At Risk Card -->
        <div class="p-3 rounded-lg border border-rose-200 bg-rose-50/40 space-y-1">
          <div class="flex items-center justify-between">
            <span class="font-bold text-rose-900">At Risk (23 December)</span>
            <span class="px-2 py-0.2 rounded font-bold text-[10px] bg-rose-100 text-rose-800">25% Prob</span>
          </div>
          <p class="text-[11px] text-rose-950/80 leading-relaxed">
            Vendor transfer requires secondary sample assay re-run; investigator signature delay at Seoul and Boston extends beyond LSLV cut-off.
          </p>
        </div>
      </div>
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
          DBLock AI closes the decision loop by tracking whether implemented actions actually changed predicted outcomes.
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

    <!-- Complete Decision Loop Schematic: Detect -> Explain -> Recommend -> Simulate -> Act -> Learn -->
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
