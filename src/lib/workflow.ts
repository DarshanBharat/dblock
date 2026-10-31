import { writable } from 'svelte/store';
export type DemoAction = { id:string; title:string; owner:string; dueDate:string; rationale:string; proposedPlan:string; priority:string; daysSaved:number; status:string; reason?:string; actualDays?:number; notes?:string; completedAt?:string };
export type DemoState = { actions: DemoAction[]; selected: string[]; history: { when:string; message:string }[] };
const key = 'dblock-workflow-v2';
const initial: DemoState = { actions: [], selected: ['INT-01','INT-02'], history: [] };
let stored: DemoState = initial;
try { const value = localStorage.getItem(key); if (value) { const parsed = JSON.parse(value); if (Array.isArray(parsed.actions) && Array.isArray(parsed.selected) && Array.isArray(parsed.history)) stored = parsed; } } catch { /* demo can run without storage */ }
export const workflow = writable<DemoState>(stored);
workflow.subscribe(value => { try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* storage unavailable */ } });
export const mapping: Record<string,string> = { 'INT-01':'ACT-001', 'INT-02':'ACT-002', 'INT-03':'ACT-004', 'INT-04':'ACT-003', 'INT-05':'ACT-005' };
export function initialize(actions:any[]) { workflow.update(s => s.actions.length ? s : { ...s, actions: [...actions.map(a => ({ ...a })), { id:'ACT-005', title:'Complete outstanding investigator sign-offs', owner:'Site Operations Lead', dueDate:'2026-11-05', rationale:'18 completed case books await investigator signatures.', proposedPlan:'Coordinate signature follow-up with the sites.', priority:'Medium', daysSaved:0.6, status:'Recommended' }] }); }
export function updateAction(id:string, changes:Partial<DemoAction>, message:string) { workflow.update(s => ({ ...s, actions:s.actions.map(a => a.id === id ? {...a,...changes}:a), history:[{when:new Date().toLocaleString(),message}, ...s.history].slice(0,100) })); }
export function addToPlan() { workflow.update(s => { const ids=s.selected.map(id=>mapping[id]); const chosen=s.actions.filter(a=>ids.includes(a.id) && a.status==='Recommended'); return { ...s, actions:s.actions.map(a=>chosen.includes(a) ? {...a,status:'Accepted'}:a), history:chosen.length ? [{when:new Date().toLocaleString(),message:`Added ${chosen.length} simulated action(s) to the plan for follow-up.`},...s.history] : s.history }; }); }
export function resetDemo(actions:any[]) { workflow.set({ ...initial, selected:[...initial.selected], actions:[] }); initialize(actions); }
export function dateAfter(date:string, days:number) { const d=new Date(date+'T00:00:00Z'); d.setUTCDate(d.getUTCDate()+Math.ceil(days)); return d.toISOString().slice(0,10); }
