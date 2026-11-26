export interface TargetInterval {
  id: string;
  label: string;
  daysBeforeDbl: number;
}

export interface VarianceThresholds {
  onTrackMin: number;
  watchMin: number;
}

export type VarianceStatus = 'On Track' | 'Watch' | 'Behind';

export const THERAPEUTIC_AREAS = [
  'Oncology',
  'Cardiology',
  'Hematology',
  'Hepatology',
  'Immunology',
  'Metabolic',
  'Neurology',
  'Respiratory',
  'Vaccines',
] as const;

export type TherapeuticArea = (typeof THERAPEUTIC_AREAS)[number];

export const STUDY_PHASES = [
  'Phase I',
  'Phase I/II',
  'Phase II',
  'Phase III',
  'Phase IV',
] as const;

export type StudyPhase = (typeof STUDY_PHASES)[number];

export interface DomainTargetConfig {
  therapeuticArea: TherapeuticArea;
  phase: StudyPhase;
  intervals: TargetInterval[];
  targets: Record<string, Record<string, number>>;
  thresholds: VarianceThresholds;
}

interface PersistedTargetStore {
  activeKey: string;
  profiles: Record<string, DomainTargetConfig>;
}

export const STUDY_TODAY_ISO = '2026-10-31';
export const STUDY_TARGET_DBL_ISO = '2026-12-15';
const MS_PER_DAY = 86_400_000;
const STORAGE_KEY = 'dblock_v3_domain_targets_ta_phase_v1';

export const STANDARD_DOMAIN_IDS = [
  'edc',
  'queries',
  'external_data',
  'safety',
  'coding',
  'pi_signatures',
  'deviations',
  'sdv',
] as const;

export const DEFAULT_INTERVALS: TargetInterval[] = [
  { id: 'dbl-60', label: 'DBL-60d', daysBeforeDbl: 60 },
  { id: 'dbl-30', label: 'DBL-30d', daysBeforeDbl: 30 },
  { id: 'dbl-14', label: 'DBL-14d', daysBeforeDbl: 14 },
  { id: 'dbl-7', label: 'DBL-7d', daysBeforeDbl: 7 },
  { id: 'target-dbl', label: 'Target DBL', daysBeforeDbl: 0 },
];

export const DEFAULT_THRESHOLDS: VarianceThresholds = {
  onTrackMin: 0,
  watchMin: -5,
};

const BASE_MATRIX: Record<string, number[]> = {
  edc: [74, 92, 96, 99, 100],
  queries: [68, 86, 93, 97, 100],
  external_data: [60, 86, 94, 98, 100],
  safety: [72, 90, 96, 99, 100],
  coding: [80, 92, 96, 99, 100],
  pi_signatures: [70, 92, 97, 99, 100],
  deviations: [76, 90, 95, 98, 100],
  sdv: [75, 91, 96, 99, 100],
};

// Domain-level adjustments by Therapeutic Area (delta at intermediate milestones)
const TA_ADJUSTMENTS: Record<TherapeuticArea, Partial<Record<string, number>>> = {
  Oncology: {},
  Cardiology: { safety: 4, external_data: 3, queries: 2 },
  Hematology: { external_data: -4, safety: 3, coding: 2 },
  Hepatology: { external_data: -2, edc: 2, sdv: 2 },
  Immunology: { edc: 3, pi_signatures: 2, queries: 2 },
  Metabolic: { edc: 4, external_data: 4, pi_signatures: 3 },
  Neurology: { queries: -3, deviations: -2, external_data: -2 },
  Respiratory: { edc: 2, external_data: 2, coding: 2 },
  Vaccines: { safety: 5, edc: 4, queries: 4, sdv: 3 },
};

// Phase-level progression shift (earlier phases have steeper late ramp; Phase III/IV more front-loaded)
const PHASE_SHIFT: Record<StudyPhase, number> = {
  'Phase I': -6,
  'Phase I/II': -4,
  'Phase II': -2,
  'Phase III': 0,
  'Phase IV': 3,
};

export function profileKey(ta: TherapeuticArea, phase: StudyPhase): string {
  return `${ta}::${phase}`;
}

export function sortIntervals(intervals: TargetInterval[]): TargetInterval[] {
  return [...intervals].sort((a, b) => b.daysBeforeDbl - a.daysBeforeDbl);
}

export function cloneConfig(cfg: DomainTargetConfig): DomainTargetConfig {
  return {
    therapeuticArea: cfg.therapeuticArea,
    phase: cfg.phase,
    intervals: cfg.intervals.map((iv) => ({ ...iv })),
    targets: Object.fromEntries(
      Object.entries(cfg.targets).map(([domId, map]) => [domId, { ...map }])
    ),
    thresholds: { ...cfg.thresholds },
  };
}

export function getDefaultConfigFor(
  therapeuticArea: TherapeuticArea = 'Oncology',
  phase: StudyPhase = 'Phase III'
): DomainTargetConfig {
  const intervals = DEFAULT_INTERVALS.map((iv) => ({ ...iv }));
  const taAdj = TA_ADJUSTMENTS[therapeuticArea] ?? {};
  const pShift = PHASE_SHIFT[phase] ?? 0;
  const targets: Record<string, Record<string, number>> = {};

  for (const domId of STANDARD_DOMAIN_IDS) {
    const baseRow = BASE_MATRIX[domId] ?? [60, 80, 90, 96, 100];
    const domDelta = (taAdj[domId] ?? 0) + pShift;
    targets[domId] = {};
    intervals.forEach((iv, idx) => {
      if (iv.daysBeforeDbl === 0) {
        targets[domId][iv.id] = 100;
      } else {
        const scale = idx === 0 ? 1 : idx === 1 ? 0.75 : idx === 2 ? 0.45 : 0.2;
        const val = Math.round(baseRow[idx] + domDelta * scale);
        targets[domId][iv.id] = Math.max(10, Math.min(99, val));
      }
    });
  }

  return {
    therapeuticArea,
    phase,
    intervals,
    targets,
    thresholds: { ...DEFAULT_THRESHOLDS },
  };
}

function normalizeConfig(cfg: DomainTargetConfig): DomainTargetConfig {
  const sorted = sortIntervals(cfg.intervals);
  return {
    therapeuticArea: cfg.therapeuticArea,
    phase: cfg.phase,
    intervals: sorted,
    targets: Object.fromEntries(
      STANDARD_DOMAIN_IDS.map((domId) => [
        domId,
        Object.fromEntries(
          sorted.map((iv) => [
            iv.id,
            Math.max(0, Math.min(100, Math.round(Number(cfg.targets[domId]?.[iv.id] ?? 100)))),
          ])
        ),
      ])
    ),
    thresholds: {
      onTrackMin: Number(cfg.thresholds.onTrackMin),
      watchMin: Math.min(Number(cfg.thresholds.watchMin), Number(cfg.thresholds.onTrackMin) - 1),
    },
  };
}

function loadInitialStore(): PersistedTargetStore {
  const def = getDefaultConfigFor('Oncology', 'Phase III');
  const defKey = profileKey(def.therapeuticArea, def.phase);
  const fallback: PersistedTargetStore = {
    activeKey: defKey,
    profiles: { [defKey]: def },
  };

  if (typeof window === 'undefined') return fallback;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as Partial<PersistedTargetStore>;
    if (!parsed || typeof parsed.activeKey !== 'string' || !parsed.profiles) return fallback;
    const active = parsed.profiles[parsed.activeKey];
    if (!active || !Array.isArray(active.intervals) || active.intervals.length < 2) return fallback;
    return {
      activeKey: parsed.activeKey,
      profiles: parsed.profiles,
    };
  } catch {
    return fallback;
  }
}

function persistStore(store: PersistedTargetStore): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    // Ignore storage quota / privacy mode errors
  }
}

function createDomainTargetsStore() {
  let store = $state<PersistedTargetStore>(loadInitialStore());
  const subscribers = new Set<(val: DomainTargetConfig) => void>();

  function getActive(): DomainTargetConfig {
    return store.profiles[store.activeKey] ?? getDefaultConfigFor('Oncology', 'Phase III');
  }

  function notify() {
    const snapshot = getActive();
    for (const fn of subscribers) {
      fn(snapshot);
    }
  }

  return {
    get current(): DomainTargetConfig {
      return getActive();
    },
    subscribe(fn: (val: DomainTargetConfig) => void): () => void {
      subscribers.add(fn);
      fn(getActive());
      return () => {
        subscribers.delete(fn);
      };
    },
    getProfile(ta: TherapeuticArea, phase: StudyPhase): DomainTargetConfig {
      const key = profileKey(ta, phase);
      const existing = store.profiles[key];
      return existing ? cloneConfig(existing) : getDefaultConfigFor(ta, phase);
    },
    save(next: DomainTargetConfig): void {
      const normalized = normalizeConfig(next);
      const key = profileKey(normalized.therapeuticArea, normalized.phase);
      store = {
        activeKey: key,
        profiles: {
          ...store.profiles,
          [key]: normalized,
        },
      };
      persistStore(store);
      notify();
    },
    resetProfile(ta: TherapeuticArea, phase: StudyPhase): DomainTargetConfig {
      const def = getDefaultConfigFor(ta, phase);
      const key = profileKey(ta, phase);
      store = {
        activeKey: key,
        profiles: {
          ...store.profiles,
          [key]: def,
        },
      };
      persistStore(store);
      notify();
      return cloneConfig(def);
    },
  };
}

export const domainTargets = createDomainTargetsStore();

export function saveDomainTargets(next: DomainTargetConfig): void {
  domainTargets.save(next);
}

export function parseDaysBeforeDbl(date: Date | string | number): number {
  if (typeof date === 'number' && Number.isFinite(date)) {
    return date;
  }
  const targetMs = Date.parse(`${STUDY_TARGET_DBL_ISO}T00:00:00Z`);
  if (date instanceof Date) {
    return (targetMs - date.getTime()) / MS_PER_DAY;
  }
  const str = String(date).trim();
  const dblMatch = str.match(/^(?:DBL|D)\s*([+-]?\d+)\s*d?$/i);
  if (dblMatch) {
    return -Number(dblMatch[1]);
  }
  if (/^target\s*dbl$/i.test(str)) return 0;
  if (/^lslv$/i.test(str)) return 15;
  if (/^predicted/i.test(str)) return -6;

  const parsedMs = Date.parse(str.includes('T') ? str : `${str}T00:00:00Z`);
  if (Number.isFinite(parsedMs)) {
    return (targetMs - parsedMs) / MS_PER_DAY;
  }
  return 45;
}

export function targetAt(
  domainId: string,
  date: Date | string | number = STUDY_TODAY_ISO,
  config: DomainTargetConfig = domainTargets.current
): number {
  const sorted = sortIntervals(config.intervals);
  if (sorted.length === 0) return 100;

  const domMap = config.targets[domainId] ?? {};
  const d = parseDaysBeforeDbl(date);

  if (d >= sorted[0].daysBeforeDbl) {
    return Math.round((domMap[sorted[0].id] ?? 0) * 10) / 10;
  }
  const last = sorted[sorted.length - 1];
  if (d <= last.daysBeforeDbl) {
    return Math.round((domMap[last.id] ?? 100) * 10) / 10;
  }

  for (let i = 0; i < sorted.length - 1; i++) {
    const m1 = sorted[i];
    const m2 = sorted[i + 1];
    if (m1.daysBeforeDbl >= d && d >= m2.daysBeforeDbl) {
      const v1 = domMap[m1.id] ?? 0;
      const v2 = domMap[m2.id] ?? 100;
      const span = m1.daysBeforeDbl - m2.daysBeforeDbl;
      if (span <= 0) return Math.round(v2 * 10) / 10;
      const t = (m1.daysBeforeDbl - d) / span;
      return Math.round((v1 + t * (v2 - v1)) * 10) / 10;
    }
  }

  return 100;
}

export function classifyVariance(
  variance: number,
  thresholds: VarianceThresholds = domainTargets.current.thresholds
): VarianceStatus {
  if (variance >= thresholds.onTrackMin) return 'On Track';
  if (variance >= thresholds.watchMin) return 'Watch';
  return 'Behind';
}
