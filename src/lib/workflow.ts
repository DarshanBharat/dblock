import { writable } from 'svelte/store';

export type DemoAction = {
  id: string;
  title: string;
  action?: string;
  owner: string;
  ownerName?: string;
  ownerRole?: string;
  dueDate: string;
  rationale: string;
  proposedPlan: string;
  priority: string;
  daysSaved: number;
  delayImpact?: string;
  estImpactDays?: number;
  status: string;
  site?: string;
  scope?: string;
  domain?: string;
  confidence?: string;
  recommendation?: string;
  affectedItems?: string;
  dependencies?: string;
  proposedCommunication?: string;
  reason?: string;
  actualDays?: number;
  notes?: string;
  completedAt?: string;
};

export type DemoState = {
  actions: DemoAction[];
  selected: string[];
  history: { when: string; message: string }[];
};

const key = 'dblock-workflow-v3';
const initial: DemoState = {
  actions: [],
  selected: ['INT-01', 'INT-02'],
  history: [
    { when: '2026-10-31 08:00', message: 'System model v0.1.4 generated baseline readiness score 72/100 and +6 days delay forecast.' },
    { when: '2026-10-31 08:15', message: 'AI recommended 12 owner-specific interventions prioritized by critical path impact.' }
  ]
};

let stored: DemoState = initial;
try {
  const value = localStorage.getItem(key);
  if (value) {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed.actions) && parsed.actions.length >= 10 && Array.isArray(parsed.selected) && Array.isArray(parsed.history)) {
      stored = parsed;
    }
  }
} catch {
  /* demo runs without persistent storage */
}

export const workflow = writable<DemoState>(stored);

workflow.subscribe(value => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage unavailable */
  }
});

export const mapping: Record<string, string> = {
  'INT-01': 'ACT-001',
  'INT-02': 'ACT-002',
  'INT-03': 'ACT-003',
  'INT-04': 'ACT-004',
  'INT-05': 'ACT-006',
  'INT-06': 'ACT-005'
};

export function initialize(actions: any[]) {
  workflow.update(s => {
    if (s.actions && s.actions.length >= 10) return s;
    return {
      ...s,
      actions: actions.map(a => ({ ...a }))
    };
  });
}

export function updateAction(id: string, changes: Partial<DemoAction>, message: string) {
  workflow.update(s => ({
    ...s,
    actions: s.actions.map(a => a.id === id ? { ...a, ...changes } : a),
    history: [{ when: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }), message }, ...s.history].slice(0, 100)
  }));
}

export function addToPlan() {
  workflow.update(s => {
    const ids = s.selected.map(id => mapping[id]).filter(Boolean);
    const chosen = s.actions.filter(a => ids.includes(a.id) && a.status === 'Recommended');
    return {
      ...s,
      actions: s.actions.map(a => chosen.includes(a) ? { ...a, status: 'Accepted' } : a),
      history: chosen.length
        ? [
            {
              when: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              message: `Simulated impact accepted: ${chosen.map(c => c.id).join(', ')} added to operational plan.`
            },
            ...s.history
          ]
        : s.history
    };
  });
}

export function resetDemo(actions: any[]) {
  const fresh = {
    ...initial,
    selected: ['INT-01', 'INT-02'],
    actions: actions.map(a => ({ ...a }))
  };
  workflow.set(fresh);
  try {
    localStorage.setItem(key, JSON.stringify(fresh));
  } catch {}
}

export function dateAfter(date: string, days: number) {
  const d = new Date(date + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + Math.ceil(days));
  return d.toISOString().slice(0, 10);
}
