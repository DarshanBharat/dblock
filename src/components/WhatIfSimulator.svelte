<script lang="ts">
  import { workflow, addToPlan, dateAfter } from '../lib/workflow';
  export let interventions:any[]; export let study:any; export let onSelectTab:(tab:string)=>void;
  function toggle(id:string) { workflow.update(s=>({...s,selected:s.selected.includes(id)?s.selected.filter(x=>x!==id):[...s.selected,id]})); }
  $: selected = interventions.filter(i=>$workflow.selected.includes(i.id));
  $: rawReduction = selected.reduce((n,i)=>n+i.delayReductionDays,0);
  $: reduction = Math.min(study.delayDays,rawReduction);
  $: delay = Math.max(0,Number((study.delayDays-reduction).toFixed(1)));
  $: score = Math.min(100,Math.round(study.overallReadinessScore+selected.reduce((n,i)=>n+i.readinessScoreGain,0)));
  $: date = dateAfter(study.plannedDbl,delay);
  $: blockers = Math.max(0, study.criticalBlockersCount - selected.length * 2);
  let added = false;
  function commit() { addToPlan(); added=true; }
</script>
<div class="space-y-6"><section class="panel"><p class="eyebrow">EXPLORE BEFORE YOU DECIDE</p><h1 class="page-title">What if we take action?</h1><p class="page-intro">Select interventions to see a transparent, illustrative estimate of how the study could change.</p><div class="notice">The demo adds estimated effects and caps the improvement at the current six-day delay. Each selected action assumes two blockers resolved. It does not model dependencies, uncertainty or overlapping work.</div></section>
<div class="scenario-grid"><div class="panel scenario-card"><small>BEFORE ACTION</small><strong>{study.forecastDbl}</strong><p>+{study.delayDays} days · {study.overallReadinessScore}/100 readiness</p></div><div class="panel scenario-card highlight"><small>ILLUSTRATIVE AFTER</small><strong>{date}</strong><p>+{delay} days · {score}/100 readiness<br/>{blockers} estimated blockers · {delay <= 2 ? 'Lower' : 'Elevated'} residual risk</p></div><div class="panel scenario-card"><small>POTENTIAL DELAY AVOIDED</small><strong>{reduction.toFixed(1)} days</strong><p>{selected.length} intervention{selected.length===1?'':'s'} selected</p></div></div>
<section class="panel"><div class="section-heading"><div><p class="eyebrow">BUILD A SCENARIO</p><h2>Choose interventions</h2><p>Each estimate is a sample assumption. Calendar dates round remaining delay up to a whole day.</p></div><button class="text-link" on:click={() => workflow.update(s=>({...s,selected:[]}))}>Clear selection</button></div><div class="intervention-list">{#each interventions as item}<label class:intervention-selected={$workflow.selected.includes(item.id)} class="intervention"><input type="checkbox" checked={$workflow.selected.includes(item.id)} on:change={() => toggle(item.id)}/><span><strong>{item.title}</strong><small>{item.description}</small></span><b>−{item.delayReductionDays} days<br/><small>+{item.readinessScoreGain} points</small></b></label>{/each}</div><div class="button-row"><button class="primary-dark" disabled={!selected.length} on:click={commit}>Add selected actions to plan</button><button class="subtle-button" on:click={() => onSelectTab('action_workbench')}>Open action plan →</button>{#if added}<span class="confirmation">Selected recommendations added. Review their owners and due dates in the action plan.</span>{/if}</div></section></div>
