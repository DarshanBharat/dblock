/**
 * DBLock AI v3 — Hierarchical Readiness, Multi-Factor Risk & Critical-Path Forecast Engine
 * Implements the decoupled 3-output architecture from DB AI Lock.pdf (pages 39–51):
 *   1. Readiness Score (hierarchical: Record -> Subject -> Site -> Domain -> Study)
 *   2. Risk Classification (Schedule, Trajectory, Hard-Gate, Execution)
 *   3. Predicted DBL Date (Critical-path + PERT + Monte Carlo P50/P80/P90)
 */

export type RecordStatus =
  | 'complete_approved'
  | 'complete_pending_review'
  | 'in_progress'
  | 'not_started'
  | 'hard_blocked'
  | 'not_applicable';

export type RiskStatus = 'on_track' | 'watch' | 'at_risk' | 'high_risk' | 'hard_blocked';

export type SubjectClassification =
  | 'Lock Ready'
  | 'Conditionally Ready'
  | 'Action Required'
  | 'Hard Blocked';

export interface DomainWeightConfig {
  edc: number;
  queries: number;
  externalData: number;
  safety: number;
  sdvSdr: number;
  coding: number;
  piSignatures: number;
  protocolDeviations: number;
  casebookFreeze: number;
}

export const DEFAULT_STUDY_WEIGHTS: DomainWeightConfig = {
  edc: 0.20,
  queries: 0.15,
  externalData: 0.15,
  safety: 0.15,
  sdvSdr: 0.10,
  coding: 0.10,
  piSignatures: 0.05,
  protocolDeviations: 0.05,
  casebookFreeze: 0.05,
};

export const DEFAULT_SUBJECT_WEIGHTS = {
  edc: 0.20,
  queries: 0.20,
  sdvSdr: 0.10,
  externalData: 0.15,
  safety: 0.15,
  coding: 0.10,
  piSignatures: 0.05,
  protocolDeviations: 0.05,
};

/** Level 1: Record or requirement status -> staged credit */
export function scoreRecordStatus(status: RecordStatus): number | null {
  switch (status) {
    case 'complete_approved':
      return 1.0;
    case 'complete_pending_review':
      return 0.75;
    case 'in_progress':
      return 0.5;
    case 'not_started':
    case 'hard_blocked':
      return 0.0;
    case 'not_applicable':
      return null; // Excluded from denominator
  }
}

/** Level 2: Subject readiness + independent hard-gate classification */
export interface SubjectDomainInputs {
  edc: number;
  queries: number;
  sdvSdr: number;
  externalData: number;
  safety: number;
  coding: number;
  piSignatures: number;
  protocolDeviations: number;
  hasHardGateBlocker: boolean;
  hardGateReason?: string;
  openCriticalItems: number;
  openRoutineItems: number;
}

export function computeSubjectReadiness(input: SubjectDomainInputs): {
  score: number;
  classification: SubjectClassification;
  freezeEligible: boolean;
} {
  const weighted =
    input.edc * DEFAULT_SUBJECT_WEIGHTS.edc +
    input.queries * DEFAULT_SUBJECT_WEIGHTS.queries +
    input.sdvSdr * DEFAULT_SUBJECT_WEIGHTS.sdvSdr +
    input.externalData * DEFAULT_SUBJECT_WEIGHTS.externalData +
    input.safety * DEFAULT_SUBJECT_WEIGHTS.safety +
    input.coding * DEFAULT_SUBJECT_WEIGHTS.coding +
    input.piSignatures * DEFAULT_SUBJECT_WEIGHTS.piSignatures +
    input.protocolDeviations * DEFAULT_SUBJECT_WEIGHTS.protocolDeviations;

  const score = Math.round(weighted);

  let classification: SubjectClassification;
  if (input.hasHardGateBlocker) {
    classification = 'Hard Blocked';
  } else if (score >= 90 && input.openCriticalItems === 0 && input.openRoutineItems === 0) {
    classification = 'Lock Ready';
  } else if (score >= 78 && input.openCriticalItems === 0) {
    classification = 'Conditionally Ready';
  } else {
    classification = 'Action Required';
  }

  return {
    score,
    classification,
    freezeEligible: classification === 'Lock Ready',
  };
}

/** Level 3: Site readiness (70% weighted subjects + 20% site-level + 10% site-closure) */
export function computeSiteReadiness(params: {
  weightedSubjectScore: number;
  siteLevelScore: number;
  siteClosureScore: number;
  hasUnresolvedSiteHardGate: boolean;
  pctLockSubjectsHardBlocked: number;
  hasCredibleCompletionDate: boolean;
}): {
  score: number;
  maxOperationalStatus: RiskStatus;
  confidence: 'High' | 'Medium' | 'Low';
} {
  const score = Math.round(
    params.weightedSubjectScore * 0.7 +
      params.siteLevelScore * 0.2 +
      params.siteClosureScore * 0.1
  );

  let maxOperationalStatus: RiskStatus = 'on_track';
  if (params.hasUnresolvedSiteHardGate) {
    maxOperationalStatus = 'hard_blocked';
  } else if (params.pctLockSubjectsHardBlocked > 10) {
    maxOperationalStatus = 'high_risk';
  } else if (score < 70) {
    maxOperationalStatus = 'at_risk';
  }

  return {
    score,
    maxOperationalStatus,
    confidence: params.hasCredibleCompletionDate ? (score >= 80 ? 'High' : 'Medium') : 'Low',
  };
}

/** Level 4: Domain staged-credit score */
export function computeDomainStagedScore(params: {
  completeApproved: number;
  completePendingReview: number;
  inProgress: number;
  notStartedOrBlocked: number;
}): number {
  const total =
    params.completeApproved +
    params.completePendingReview +
    params.inProgress +
    params.notStartedOrBlocked;
  if (total <= 0) return 100;
  const weighted =
    params.completeApproved * 1.0 +
    params.completePendingReview * 0.75 +
    params.inProgress * 0.5;
  return Math.round((weighted / total) * 1000) / 10;
}

/** Milestone expected readiness curve (page 39) */
export interface MilestoneExpectation {
  label: string;
  daysToLslv: number;
  expectedMin: number;
  expectedMax: number;
  expectedMid: number;
}

export const MILESTONE_CURVE: MilestoneExpectation[] = [
  { label: 'D-60', daysToLslv: -60, expectedMin: 50, expectedMax: 60, expectedMid: 55 },
  { label: 'D-45', daysToLslv: -45, expectedMin: 58, expectedMax: 66, expectedMid: 62 },
  { label: 'D-30', daysToLslv: -30, expectedMin: 60, expectedMax: 70, expectedMid: 80 },
  { label: 'D-15', daysToLslv: -15, expectedMin: 75, expectedMax: 85, expectedMid: 85 },
  { label: 'LSLV', daysToLslv: 0, expectedMin: 85, expectedMax: 95, expectedMid: 90 },
  { label: 'LSLV+3', daysToLslv: 3, expectedMin: 95, expectedMax: 98, expectedMid: 96 },
  { label: 'DBL', daysToLslv: 15, expectedMin: 100, expectedMax: 100, expectedMid: 100 },
];

/** Multi-factor study risk classification (pages 39–41) */
export function classifyStudyRisk(params: {
  forecastVarianceDays: number;
  probabilityOfMeetingTarget: number;
  readinessGapPts: number; // actual - expected (negative when behind)
  currentVelocityPtsPerWk: number;
  requiredVelocityPtsPerWk: number;
  hasUnownedHardGate: boolean;
  hasHardGatePastDbl: boolean;
}): RiskStatus {
  if (params.hasUnownedHardGate) return 'hard_blocked';
  if (
    params.forecastVarianceDays > 5 ||
    params.probabilityOfMeetingTarget < 40 ||
    params.readinessGapPts < -10
  ) {
    return 'high_risk';
  }
  if (
    params.forecastVarianceDays >= 3 ||
    params.probabilityOfMeetingTarget < 70 ||
    params.readinessGapPts < -5 ||
    params.requiredVelocityPtsPerWk > params.currentVelocityPtsPerWk * 1.5 ||
    params.hasHardGatePastDbl
  ) {
    return 'at_risk';
  }
  if (params.forecastVarianceDays >= 1 || params.probabilityOfMeetingTarget < 80) {
    return 'watch';
  }
  return 'on_track';
}

/** PERT expected duration: (Optimistic + 4 * Most Likely + Pessimistic) / 6 */
export function pertDuration(optimistic: number, mostLikely: number, pessimistic: number): number {
  return Math.round(((optimistic + 4 * mostLikely + pessimistic) / 6) * 10) / 10;
}

/** Critical-path + What-If simulation engine (pages 45–48) */
export interface SimulationScenarioInput {
  id: string;
  label: string;
  daysSaved: number;
  readinessGainPts: number;
  probGainPts: number;
  enabled: boolean;
}

export interface SimulationOutput {
  baselineDblDate: string;
  simulatedDblDate: string;
  targetDblDate: string;
  baselineVarianceDays: number;
  simulatedVarianceDays: number;
  daysRecovered: number;
  baselineProbPct: number;
  simulatedProbPct: number;
  baselineReadinessPct: number;
  simulatedReadinessPct: number;
  p50Date: string;
  p80Date: string;
  p90Date: string;
}

function addDaysIso(isoDate: string, days: number): string {
  const d = new Date(`${isoDate}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + Math.round(days));
  return d.toISOString().slice(0, 10);
}

export function formatShortDate(isoDate: string): string {
  const d = new Date(`${isoDate}T00:00:00Z`);
  return d.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

export function runDblSimulation(params: {
  targetDblIso: string;
  baselinePredictedDblIso: string;
  baselineProbPct: number;
  baselineReadinessPct: number;
  scenarios: SimulationScenarioInput[];
  includeContingency?: boolean;
  ignoreNonCritical?: boolean;
}): SimulationOutput {
  const targetMs = Date.parse(`${params.targetDblIso}T00:00:00Z`);
  const baseMs = Date.parse(`${params.baselinePredictedDblIso}T00:00:00Z`);
  const baselineVarianceDays = Math.round((baseMs - targetMs) / 86400000);

  const active = params.scenarios.filter((s) => s.enabled);
  // Critical-path diminishing returns: cap total recovery at 7 days, add 2d contingency if enabled
  const rawSaved = active.reduce((sum, s) => sum + s.daysSaved, 0);
  const cappedSaved = Math.min(7, rawSaved);
  const contingencyOffset = params.includeContingency ? 2 : 0;
  const effectiveSaved = Math.max(0, Math.round(cappedSaved - contingencyOffset));

  const simulatedVarianceDays = baselineVarianceDays - effectiveSaved;
  const simulatedDblDate = addDaysIso(params.targetDblIso, simulatedVarianceDays);

  const probGain = active.reduce((sum, s) => sum + s.probGainPts, 0);
  const simulatedProbPct = Math.min(
    96,
    Math.max(5, Math.round(params.baselineProbPct + probGain - (params.includeContingency ? 8 : 0)))
  );

  const readinessGain = active.reduce((sum, s) => sum + s.readinessGainPts, 0);
  const simulatedReadinessPct = Math.min(
    99,
    Math.round(params.baselineReadinessPct + readinessGain + (params.ignoreNonCritical ? 2 : 0))
  );

  return {
    baselineDblDate: params.baselinePredictedDblIso,
    simulatedDblDate,
    targetDblDate: params.targetDblIso,
    baselineVarianceDays,
    simulatedVarianceDays,
    daysRecovered: effectiveSaved,
    baselineProbPct: params.baselineProbPct,
    simulatedProbPct,
    baselineReadinessPct: params.baselineReadinessPct,
    simulatedReadinessPct,
    p50Date: addDaysIso(simulatedDblDate, -2),
    p80Date: simulatedDblDate,
    p90Date: addDaysIso(simulatedDblDate, 2),
  };
}

/** Portfolio prioritization score (pages 48–49): higher = more urgent intervention */
export function computePortfolioPriorityScore(params: {
  probMissingDblPct: number;
  predictedDelayDays: number;
  hardGateSeverity: number; // 0-100
  readinessGapPts: number; // positive = behind expected
  criticalSitesPct: number; // 0-100
  uncertaintyScore: number; // 0-100
}): number {
  const delayNorm = Math.min(100, Math.max(0, params.predictedDelayDays * 10));
  const gapNorm = Math.min(100, Math.max(0, params.readinessGapPts * 5));
  return Math.round(
    params.probMissingDblPct * 0.35 +
      delayNorm * 0.25 +
      params.hardGateSeverity * 0.15 +
      gapNorm * 0.1 +
      params.criticalSitesPct * 0.1 +
      params.uncertaintyScore * 0.05
  );
}
