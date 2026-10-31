<script lang="ts">
  import { workflow, updateAction } from '../lib/workflow';
  export let onSelectTab: (tab:string)=>void;
  let filter = 'All';
  let view = 'Table';
  let selectedId: string | null = null;
  $: selectedAction = $workflow.actions.find(a => a.id === selectedId);
  function openAction(id:string) { selectedId=id; editing=null; }
  function closeAction() { selectedId=null; editing=null; }
  let editing: string | null = null;
  let owner = ''; let dueDate = ''; let reason = ''; let actualDays = ''; let notes = '';
  function edit(a:any) { editing=a.id; owner=a.owner; dueDate=a.dueDate; reason=a.reason || ''; actualDays=a.actualDays === undefined ? '' : String(a.actualDays); notes=a.notes || ''; }
  function save(a:any) { if (!owner.trim() || !dueDate) return; updateAction(a.id,{owner:owner.trim(),dueDate},`Updated owner and due date: ${a.title}`); editing=null; }
  function reject(a:any) { if (!reason.trim()) return; updateAction(a.id,{status:'Rejected',reason:reason.trim()},`Rejected ${a.title}: ${reason.trim()}`); editing=null; reason=''; }
  function complete(a:any) { const value=Number(actualDays); if (actualDays === '' || !Number.isFinite(value) || value < 0 || value > 6 || !notes.trim()) return; updateAction(a.id,{status:'Completed',actualDays:value,notes:notes.trim(),completedAt:new Date().toLocaleDateString()},`Completed ${a.title}; reported ${value} days avoided.`); editing=null; actualDays=''; notes=''; }
  $: visible = $workflow.actions.filter(a => filter === 'All' || a.status === filter || (filter === 'Accepted' && a.status === 'Modified & Accepted'));
</script>
<div class="space-y-6">
  <section class="panel"><p class="eyebrow">DECIDE AND FOLLOW THROUGH</p><h1 class="page-title">Your action plan</h1><p class="page-intro">Review recommendations, choose an owner and follow each action through to completion. The study team makes the decisions.</p><div class="notice">Demo decisions and entered outcomes are saved in this browser only. They do not create tasks or update clinical systems.</div></section>
  <section class="action-summary"><button on:click={() => filter='Recommended'}><strong>{$workflow.actions.filter(a=>a.status==='Recommended').length}</strong><span>Need a decision</span></button><button on:click={() => filter='Accepted'}><strong>{$workflow.actions.filter(a=>a.status==='Accepted').length}</strong><span>Accepted</span></button><button on:click={() => filter='Completed'}><strong>{$workflow.actions.filter(a=>a.status==='Completed').length}</strong><span>Completed</span></button><div><strong>{$workflow.actions.filter(a=>a.status==='Recommended' && a.priority==='Critical').length}</strong><span>Critical to review</span></div></section>
  <div class="list-toolbar"><div class="workflow-tabs" aria-label="Filter actions">{#each ['All','Recommended','Accepted','Completed','Rejected'] as f}<button class:chosen={filter===f} on:click={() => filter=f}>{f} <span>{$workflow.actions.filter(a=>f==='All'||a.status===f).length}</span></button>{/each}</div><div class="workflow-tabs" aria-label="Action layout"><button class:chosen={view==='Table'} on:click={() => view='Table'}>Table</button><button class:chosen={view==='Cards'} on:click={() => view='Cards'}>Cards</button></div></div>
  {#if !visible.length}<div class="panel empty-state">No actions in this view yet.</div>{/if}
  {#if view === 'Table' && visible.length}
  <div class="panel table-panel"><div class="table-scroll"><table class="action-table"><thead><tr><th>Priority</th><th>Action</th><th>Owner</th><th>Due</th><th>Status</th><th>Est. impact</th><th><span class="sr-only">Details</span></th></tr></thead><tbody>{#each visible as action}<tr><td><span class="priority-pill">{action.priority}</span></td><td><button class="table-action" on:click={() => openAction(action.id)}>{action.title}</button><small>{action.id}</small></td><td>{action.owner}</td><td>{action.dueDate}</td><td><span class="table-status">{action.status}</span></td><td><strong>{action.daysSaved} days</strong></td><td><button class="text-link" on:click={() => openAction(action.id)}>Details →</button></td></tr>{/each}</tbody></table></div><p class="footnote table-note">Select an action to review its evidence, owner and next steps. Impact is an example estimate.</p></div>
  {:else if view === 'Cards'}<div class="compact-cards">{#each visible as action}<button class="compact-card" on:click={() => openAction(action.id)}><span class="priority-pill">{action.priority}</span><strong>{action.title}</strong><small>{action.owner} · Due {action.dueDate}</small><span>{action.status} <b>{action.daysSaved} days estimated →</b></span></button>{/each}</div>{/if}
  {#if selectedAction}
    {@const action = selectedAction}
    <div class="drawer-overlay"><button class="drawer-backdrop" aria-label="Close action details" on:click={closeAction}></button><aside class="detail-drawer" aria-label="Action details"><div class="drawer-top"><div><p class="eyebrow">ACTION DETAILS</p><h2>Review recommendation</h2></div><button class="drawer-close" aria-label="Close action details" on:click={closeAction}>×</button></div>
    <div class="drawer-content"><div class="action-heading"><div><div class="action-label"><span class="priority-pill">{action.priority}</span><span>{action.id} · {action.status}</span></div><h2>{action.title}</h2><p>{action.rationale}</p></div><div class="impact-box"><strong>Up to {action.daysSaved} days</strong><small>estimated delay avoided</small></div></div>
      <div class="action-details"><div><small>OWNER</small><strong>{action.owner}</strong></div><div><small>TARGET DATE</small><strong>{action.dueDate}</strong></div><div><small>PROPOSED NEXT STEP</small><strong>{action.proposedPlan}</strong></div></div>
      {#if action.reason}<p class="record-note"><strong>Reason:</strong> {action.reason}</p>{/if}
      {#if action.status === 'Completed'}<p class="record-note"><strong>Reported outcome:</strong> {action.actualDays} days avoided · {action.notes} <span>({action.completedAt})</span></p>{/if}
      {#if editing === action.id}
        <div class="edit-panel"><div class="edit-grid"><label>Owner<input bind:value={owner}/></label><label>Target date<input type="date" bind:value={dueDate}/></label></div><div class="button-row"><button class="primary-dark" on:click={() => save(action)}>Save owner and date</button><button class="subtle-button" on:click={() => editing=null}>Cancel</button></div>
          {#if action.status === 'Recommended'}<label>Reason for rejecting<textarea bind:value={reason} placeholder="Explain why this action will not be taken"></textarea></label><button class="subtle-button" disabled={!reason.trim()} on:click={() => reject(action)}>Reject recommendation</button>{/if}
          {#if action.status === 'Accepted' || action.status === 'Modified & Accepted'}<div class="edit-grid"><label>Reported days avoided (0–6)<input type="number" min="0" max="6" step="0.1" bind:value={actualDays}/></label><label>What happened?<input bind:value={notes} placeholder="Record the observed outcome"/></label></div><button class="primary-dark" disabled={actualDays === '' || !notes.trim() || Number(actualDays) < 0 || Number(actualDays) > 6} on:click={() => complete(action)}>Mark completed and record outcome</button><small>Outcome is entered by the user; it is not independently verified.</small>{/if}
        </div>
      {:else}<div class="button-row">{#if action.status === 'Recommended'}<button class="primary-dark" on:click={() => updateAction(action.id,{status:'Accepted'},`Accepted ${action.title}`)}>Accept recommendation</button>{/if}{#if action.status === 'Recommended' || action.status === 'Accepted' || action.status === 'Modified & Accepted'}<button class="subtle-button" on:click={() => edit(action)}>{action.status === 'Recommended' ? 'Edit or reject' : 'Edit or record completion'}</button>{/if}{#if action.status === 'Rejected'}<button class="subtle-button" on:click={() => updateAction(action.id,{status:'Recommended',reason:''},`Reopened ${action.title}`)}>Reopen recommendation</button>{/if}</div>{/if}
    </div>
    </aside></div>
  {/if}
  <button class="text-link" on:click={() => onSelectTab('forecast_scenarios')}>See action history and outcomes →</button>
</div>
