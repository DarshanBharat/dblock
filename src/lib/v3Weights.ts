import { writable } from 'svelte/store';
import type { DomainSpec } from '../data/v3Data';

export const DEFAULT_V3_WEIGHTS: Record<string, number> = {
  edc: 20,
  queries: 15,
  external: 20,
  safety: 15,
  coding: 8,
  pi_sig: 10,
  deviations: 6,
  sdv: 6,
};

export type V3WeightPreset = 'balanced' | 'safety_ext' | 'edc_query';

export const v3DomainWeights = writable<Record<string, number>>({ ...DEFAULT_V3_WEIGHTS });

export function resetV3Weights(): void {
  v3DomainWeights.set({ ...DEFAULT_V3_WEIGHTS });
}

export function applyV3WeightPreset(preset: V3WeightPreset): void {
  if (preset === 'balanced') {
    v3DomainWeights.set({ ...DEFAULT_V3_WEIGHTS });
  } else if (preset === 'safety_ext') {
    v3DomainWeights.set({
      edc: 10,
      queries: 10,
      external: 30,
      safety: 25,
      coding: 5,
      pi_sig: 10,
      deviations: 5,
      sdv: 5,
    });
  } else {
    v3DomainWeights.set({
      edc: 30,
      queries: 25,
      external: 10,
      safety: 10,
      coding: 8,
      pi_sig: 7,
      deviations: 5,
      sdv: 5,
    });
  }
}

export function normalizeV3Weights(current: Record<string, number>, domains: DomainSpec[]): void {
  const total = Object.values(current).reduce((sum, w) => sum + w, 0);
  if (total <= 0) {
    resetV3Weights();
    return;
  }
  const next: Record<string, number> = {};
  let running = 0;
  const keys = domains.map((d) => d.id);
  keys.forEach((k, i) => {
    if (i === keys.length - 1) {
      next[k] = Math.max(0, 100 - running);
    } else {
      const val = Math.round(((current[k] ?? 0) / total) * 100);
      next[k] = val;
      running += val;
    }
  });
  v3DomainWeights.set(next);
}

export function computeCompositeReadiness(
  weights: Record<string, number>,
  domains: DomainSpec[],
  baseOverallReadiness: number
): { composite: number; totalWeight: number; isCustom: boolean } {
  const totalWeight = Object.values(weights).reduce((sum, w) => sum + w, 0);
  const weightedRaw =
    totalWeight > 0
      ? domains.reduce((sum, d) => sum + d.readiness * (weights[d.id] ?? 0), 0) / totalWeight
      : baseOverallReadiness;
  const defaultWeightedRaw =
    domains.reduce((sum, d) => sum + d.readiness * (DEFAULT_V3_WEIGHTS[d.id] ?? 0), 0) / 100;

  const composite = Math.max(
    0,
    Math.min(100, Math.round(baseOverallReadiness + (weightedRaw - defaultWeightedRaw)))
  );
  const isCustom = domains.some((d) => (weights[d.id] ?? 0) !== (DEFAULT_V3_WEIGHTS[d.id] ?? 0));

  return { composite, totalWeight, isCustom };
}
