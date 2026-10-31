<script lang="ts">
  import TrajectoryChart from './TrajectoryChart.svelte';
  import { ArrowRight, AlertTriangle, CalendarDays, CheckCircle2, CircleHelp, BarChart3 } from '@lucide/svelte';
  export let study: any;
  export let actions: any[];
  export let timelineSnapshots: any[];
  export let onSelectTab: (tab: string) => void;
  export let onSelectSite: (id: string) => void;
  let selectedQuestion = 'delay';
  let trendView = 'Chart';
  const questions = [
    { id: 'delay', label: 'Why is the lock delayed?' },
    { id: 'first', label: 'What should I do first?' },
    { id: 'sites', label: 'Which site needs attention?' },
    { id: 'readiness', label: 'What does readiness mean?' }
  ];
</script>

<div class="space-y-7">
  <section class="overview-hero">
    <div class="hero-copy">
      <p class="eyebrow">STUDY OVERVIEW <span> / {study.protocol}</span></p>
      <h1>Your study, at a glance.</h1>
      <p class="hero-description">See what could delay database lock, who needs to act, and where to focus next.</p>
      <div class="hero-actions">
        <button class="primary-button" on:click={() => onSelectTab('action_workbench')}>Review recommended actions <ArrowRight size={17}/></button>
        <button class="secondary-button" on:click={() => onSelectTab('risk_matrix')}>Explore sites</button>
      </div>
    </div>
    <div class="hero-status">
      <div class="status-top"><span class="status-dot"></span> NEEDS ATTENTION</div>
      <div class="hero-number">{study.overallReadinessScore}<span>/100</span></div>
      <div class="status-label">Overall readiness score</div>
      <div class="progress-track"><div style="width: {study.overallReadinessScore}%"></div></div>
      <p>Target: {study.targetReadinessScore}/100 before lock</p>
    </div>
  </section>

  <section aria-label="Study summary" class="summary-grid">
    <div class="summary-card"><div class="summary-icon coral"><CalendarDays size={19}/></div><div><p>Forecast lock date</p><strong>{study.forecastDbl}</strong><small>{study.delayDays} days after the planned {study.plannedDbl}</small></div></div>
    <div class="summary-card"><div class="summary-icon amber"><AlertTriangle size={19}/></div><div><p>Critical blockers</p><strong>{study.criticalBlockersCount}</strong><small>Issues that need the team's attention</small></div></div>
    <div class="summary-card"><div class="summary-icon blue"><BarChart3 size={19}/></div><div><p>Higher-risk sites</p><strong>{study.highRiskSitesCount} <em>of {study.totalSites}</em></strong><small>Sites to review more closely</small></div></div>
  </section>

  <div class="dashboard-grid">
    <section class="panel priorities">
      <div class="section-heading"><div><p class="eyebrow">START HERE</p><h2>What needs attention</h2><p>Recommended next steps based on the sample study data.</p></div><button class="text-link" on:click={() => onSelectTab('action_workbench')}>All actions <ArrowRight size={15}/></button></div>
      <div class="priority-list">
        {#each actions.slice(0, 3) as action, index}
          <div class="priority-item"><span class="priority-index">0{index + 1}</span><div class="priority-content"><div class="priority-title">{action.title}</div><p>{action.rationale}</p><div class="priority-meta"><span>Owner: <b>{action.owner}</b></span><span>Due: <b>{action.dueDate}</b></span></div></div><span class="impact">{action.delayImpact}</span></div>
        {/each}
      </div>
      <p class="footnote">Estimated impacts are scenario assumptions, not guaranteed time savings. Actions can overlap.</p>
    </section>
    <section class="panel drivers">
      <div class="section-heading"><div><p class="eyebrow">UNDERSTAND THE DELAY</p><h2>What's driving it?</h2><p>Share of the estimated delay by contributing factor.</p></div></div>
      <div class="driver-list">{#each study.primaryDrivers as driver}<div class="driver"><div class="driver-label"><span>{driver.factor}</span><strong>{driver.impact}</strong></div><div class="driver-track"><div style="width: {driver.weight}%"></div></div><p>{driver.summary}</p></div>{/each}</div>
      <button class="text-link" on:click={() => onSelectTab('digital_twin')}>Explore readiness details <ArrowRight size={15}/></button>
    </section>
  </div>

  <div class="dashboard-grid"><div class="trend-wrapper"><div class="workflow-tabs trend-toggle" aria-label="Trend display"><button class:chosen={trendView==='Chart'} on:click={() => trendView='Chart'}>Chart</button><button class:chosen={trendView==='Table'} on:click={() => trendView='Table'}>Table</button></div>{#if trendView==='Chart'}<TrajectoryChart {timelineSnapshots} plannedDbl={study.plannedDbl} />{:else}<section class="panel"><p class="eyebrow">STUDY TREND</p><h2 class="minor-title">Readiness over time</h2><div class="table-scroll"><table class="action-table"><thead><tr><th>Week</th><th>Readiness</th><th>Forecast</th><th>Delay</th></tr></thead><tbody>{#each timelineSnapshots as snap}<tr><td>{snap.weekLabel}</td><td>{snap.readinessScore}/100</td><td>{snap.forecastDate}</td><td>+{snap.delayDays} days</td></tr>{/each}</tbody></table></div></section>{/if}</div><section class="panel"><p class="eyebrow">MILESTONES &amp; COVERAGE</p><h2 class="minor-title">Study context</h2><div class="context-list"><div><span>Planned last subject visit</span><strong>{study.plannedLslv}</strong></div><div><span>Planned database lock</span><strong>{study.plannedDbl}</strong></div><div><span>Illustrative forecast range</span><strong>{study.confidenceInterval}</strong></div><div><span>Higher-risk subjects</span><strong>{study.highRiskSubjectsCount}</strong></div><div><span>Open items on lock path</span><strong>{study.dblPathOpenItems}</strong></div></div><p class="footnote">Study totals are illustrative; drill-down records are a limited sample.</p></section></div>
  <section class="panel answers">
    <div class="section-heading"><div><p class="eyebrow">QUICK EXPLAINER</p><h2>Questions you might have</h2><p>Choose a question for a plain-language explanation of the sample data.</p></div><CircleHelp size={24} class="help-icon"/></div>
    <div class="answers-layout"><div class="question-list">{#each questions as question}<button class:question-active={selectedQuestion === question.id} on:click={() => selectedQuestion = question.id}>{question.label}<ArrowRight size={15}/></button>{/each}</div>
      <div class="answer-content" aria-live="polite">
        {#if selectedQuestion === 'delay'}<h3>The forecast is {study.delayDays} days later than planned.</h3><p>The largest recorded contributors are safety reconciliation ({study.primaryDrivers[0].impact}) and the delayed laboratory transfer ({study.primaryDrivers[1].impact}). Together, these account for 65% of the estimated delay in this scenario.</p><button class="text-link" on:click={() => onSelectTab('digital_twin')}>See the underlying details <ArrowRight size={15}/></button>
        {:else if selectedQuestion === 'first'}<h3>Start with the two critical recommendations.</h3><p>Review the safety discrepancies at Site 104 and the overdue LabCorp transfer. The actions page shows the proposed owner, deadline and rationale for each.</p><button class="text-link" on:click={() => onSelectTab('action_workbench')}>Review actions <ArrowRight size={15}/></button>
        {:else if selectedQuestion === 'sites'}<h3>Site 104 is marked critical.</h3><p>Its sample record lists safety discrepancies, ageing queries and an overdue lab transfer. The number of open items alone does not tell you how serious a site's issues are.</p><button class="text-link" on:click={() => onSelectSite('104')}>Open Site 104 <ArrowRight size={15}/></button>
        {:else}<h3>Readiness is a summary score.</h3><p>The sample study is scored {study.overallReadinessScore} out of 100 against a target of {study.targetReadinessScore}. Review the individual areas to understand what's holding the score back; it is not an approval to lock.</p><button class="text-link" on:click={() => onSelectTab('digital_twin')}>View readiness areas <ArrowRight size={15}/></button>{/if}
      </div>
    </div>
  </section>
</div>
