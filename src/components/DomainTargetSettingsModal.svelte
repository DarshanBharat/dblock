<script lang="ts">
  import { X, Plus, RotateCcw, Check, Trash2, SlidersHorizontal, ChevronDown } from '@lucide/svelte';
  import { V3_DOMAINS } from '../data/v3Data';
  import {
    domainTargets,
    cloneConfig,
    getDefaultConfigFor,
    saveDomainTargets,
    sortIntervals,
    targetAt,
    THERAPEUTIC_AREAS,
    STUDY_PHASES,
    type DomainTargetConfig,
    type TherapeuticArea,
    type StudyPhase,
  } from '../lib/domainTargets.svelte';

  let { open = $bindable(false) }: { open: boolean } = $props();

  let draft = $state<DomainTargetConfig>(cloneConfig(domainTargets.current));
  let showAddInterval = $state(false);
  let newIntervalLabel = $state('DBL-45d');
  let newIntervalDays = $state(45);

  $effect(() => {
    if (open) {
      draft = cloneConfig(domainTargets.current);
      showAddInterval = false;
    }
  });

  function handleTherapeuticAreaChange(event: Event) {
    const nextTa = (event.currentTarget as HTMLSelectElement).value as TherapeuticArea;
    draft = domainTargets.getProfile(nextTa, draft.phase);
    showAddInterval = false;
  }

  function handlePhaseChange(event: Event) {
    const nextPhase = (event.currentTarget as HTMLSelectElement).value as StudyPhase;
    draft = domainTargets.getProfile(draft.therapeuticArea, nextPhase);
    showAddInterval = false;
  }

  function handleResetDefaults() {
    draft = getDefaultConfigFor(draft.therapeuticArea, draft.phase);
    showAddInterval = false;
  }

  function handleSave() {
    saveDomainTargets(draft);
    open = false;
  }

  function handleAddInterval() {
    const cleanLabel = newIntervalLabel.trim() || `DBL-${Math.max(1, Math.round(newIntervalDays))}d`;
    const days = Math.max(0, Math.min(180, Math.round(Number(newIntervalDays) || 0)));
    const newId = `custom-${Date.now()}`;

    const nextTargets: Record<string, Record<string, number>> = {};
    for (const dom of V3_DOMAINS) {
      const interpolated = Math.round(targetAt(dom.id, days, draft));
      nextTargets[dom.id] = {
        ...(draft.targets[dom.id] ?? {}),
        [newId]: interpolated,
      };
    }

    draft = {
      ...draft,
      intervals: sortIntervals([
        ...draft.intervals,
        { id: newId, label: cleanLabel, daysBeforeDbl: days },
      ]),
      targets: nextTargets,
    };
    showAddInterval = false;
    newIntervalLabel = 'DBL-21d';
    newIntervalDays = 21;
  }

  function handleRemoveInterval(intervalId: string) {
    if (draft.intervals.length <= 2) return;
    const nextIntervals = draft.intervals.filter((iv) => iv.id !== intervalId);
    const nextTargets: Record<string, Record<string, number>> = {};
    for (const dom of V3_DOMAINS) {
      const row = { ...(draft.targets[dom.id] ?? {}) };
      delete row[intervalId];
      nextTargets[dom.id] = row;
    }
    draft = {
      ...draft,
      intervals: nextIntervals,
      targets: nextTargets,
    };
  }

  function updateCell(domainId: string, intervalId: string, rawVal: string) {
    const num = Math.max(0, Math.min(100, Math.round(Number(rawVal) || 0)));
    draft = {
      ...draft,
      targets: {
        ...draft.targets,
        [domainId]: {
          ...(draft.targets[domainId] ?? {}),
          [intervalId]: num,
        },
      },
    };
  }

  function buildSparklinePoints(domainId: string): string {
    const ivs = draft.intervals;
    if (ivs.length === 0) return '';
    const w = 88;
    const h = 24;
    const padX = 4;
    const padY = 4;
    const plotW = w - padX * 2;
    const plotH = h - padY * 2;

    return ivs
      .map((iv, idx) => {
        const val = draft.targets[domainId]?.[iv.id] ?? 0;
        const x = padX + (idx / Math.max(1, ivs.length - 1)) * plotW;
        const y = padY + ((100 - val) / 100) * plotH;
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');
  }

  function buildSparklineCoords(domainId: string): { x: number; y: number; val: number }[] {
    const ivs = draft.intervals;
    const w = 88;
    const h = 24;
    const padX = 4;
    const padY = 4;
    const plotW = w - padX * 2;
    const plotH = h - padY * 2;

    return ivs.map((iv, idx) => {
      const val = draft.targets[domainId]?.[iv.id] ?? 0;
      const x = padX + (idx / Math.max(1, ivs.length - 1)) * plotW;
      const y = padY + ((100 - val) / 100) * plotH;
      return { x, y, val };
    });
  }

  function handleKeydown(e: KeyboardEvent) {
    if (open && e.key === 'Escape') {
      open = false;
    }
  }
</script>

<svelte:window onkeydown={handleKeydown} />

{#if open}
  <div
    class="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/60 backdrop-blur-xs"
    role="dialog"
    aria-modal="true"
    aria-labelledby="domain-target-settings-title"
    tabindex="-1"
    onclick={(e) => { if (e.target === e.currentTarget) open = false; }}
    onkeydown={handleKeydown}
  >
    <div class="w-full max-w-5xl max-h-[92vh] flex flex-col bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
      <!-- Modal Header -->
      <div class="px-5 py-4 bg-slate-900 text-white flex items-start justify-between gap-4 shrink-0">
        <div>
          <div class="flex flex-wrap items-center gap-2">
            <SlidersHorizontal size={16} class="text-blue-400" />
            <h2 id="domain-target-settings-title" class="text-base font-bold tracking-tight">
              Domain Target Settings
            </h2>
            <span class="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-white/10 text-blue-200 border border-white/15">
              {draft.therapeuticArea} · {draft.phase}
            </span>
          </div>
          <p class="text-xs text-slate-300 mt-1">
            Configure per-domain target % trajectories by Therapeutic Area and Study Phase, with linear interpolation and variance thresholds.
          </p>
        </div>
        <button
          type="button"
          onclick={() => (open = false)}
          class="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          aria-label="Close Domain Target Settings"
        >
          <X size={18} />
        </button>
      </div>

      <!-- Toolbar: Therapeutic Area + Phase Selectors + Add Interval + Reset -->
      <div class="px-5 py-3 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div class="flex flex-wrap items-center gap-3">
          <div class="flex items-center gap-2">
            <label for="target-ta-select" class="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Therapeutic Area
            </label>
            <div class="relative">
              <select
                id="target-ta-select"
                value={draft.therapeuticArea}
                onchange={handleTherapeuticAreaChange}
                class="appearance-none cursor-pointer rounded-lg border border-slate-300 bg-white py-1.5 pl-2.5 pr-7 text-xs font-semibold text-slate-800 focus:outline-hidden focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                {#each THERAPEUTIC_AREAS as ta}
                  <option value={ta}>{ta}</option>
                {/each}
              </select>
              <ChevronDown size={13} class="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-slate-500" />
            </div>
          </div>

          <div class="flex items-center gap-2">
            <label for="target-phase-select" class="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Phase
            </label>
            <div class="relative">
              <select
                id="target-phase-select"
                value={draft.phase}
                onchange={handlePhaseChange}
                class="appearance-none cursor-pointer rounded-lg border border-slate-300 bg-white py-1.5 pl-2.5 pr-7 text-xs font-semibold text-slate-800 focus:outline-hidden focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                {#each STUDY_PHASES as phase}
                  <option value={phase}>{phase}</option>
                {/each}
              </select>
              <ChevronDown size={13} class="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-slate-500" />
            </div>
          </div>
        </div>

        <div class="flex items-center gap-2">
          <button
            type="button"
            onclick={() => (showAddInterval = !showAddInterval)}
            class="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors cursor-pointer"
          >
            <Plus size={13} /> Add Interval
          </button>
          <button
            type="button"
            onclick={handleResetDefaults}
            class="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border border-slate-200 bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <RotateCcw size={12} /> Reset Defaults
          </button>
        </div>
      </div>

      {#if showAddInterval}
        <div class="px-5 py-2.5 bg-blue-50/70 border-b border-blue-200 flex flex-wrap items-center gap-3 text-xs shrink-0">
          <span class="font-semibold text-blue-900">New Milestone Interval:</span>
          <label class="inline-flex items-center gap-1.5">
            <span class="text-slate-600 font-medium">Label</span>
            <input
              type="text"
              bind:value={newIntervalLabel}
              placeholder="e.g. DBL-45d"
              class="w-28 px-2 py-1 rounded-md border border-slate-300 bg-white text-slate-900 font-medium focus:outline-hidden focus:border-blue-500"
            />
          </label>
          <label class="inline-flex items-center gap-1.5">
            <span class="text-slate-600 font-medium">Days before DBL</span>
            <input
              type="number"
              min="0"
              max="180"
              bind:value={newIntervalDays}
              class="w-20 px-2 py-1 rounded-md border border-slate-300 bg-white text-slate-900 font-mono font-semibold focus:outline-hidden focus:border-blue-500"
            />
          </label>
          <button
            type="button"
            onclick={handleAddInterval}
            class="px-3 py-1 rounded-md bg-blue-600 hover:bg-blue-700 text-white font-semibold cursor-pointer"
          >
            Insert Column
          </button>
          <button
            type="button"
            onclick={() => (showAddInterval = false)}
            class="px-2 py-1 text-slate-500 hover:text-slate-800 font-medium cursor-pointer"
          >
            Cancel
          </button>
        </div>
      {/if}

      <!-- Editable Matrix -->
      <div class="flex-1 overflow-auto px-5 py-3">
        <table class="w-full text-xs border-collapse">
          <thead>
            <tr class="border-b border-slate-200 text-[10px] uppercase tracking-wider text-slate-500">
              <th class="py-2 pr-3 text-left font-bold min-w-[200px] sticky left-0 bg-white z-10">
                Clinical Domain
              </th>
              {#each draft.intervals as iv (iv.id)}
                <th class="py-2 px-2 text-center font-bold min-w-[92px]">
                  <div class="inline-flex items-center gap-1">
                    <span>{iv.label}</span>
                    {#if iv.daysBeforeDbl > 0 && draft.intervals.length > 2}
                      <button
                        type="button"
                        onclick={() => handleRemoveInterval(iv.id)}
                        class="text-slate-300 hover:text-rose-600 transition-colors cursor-pointer"
                        title="Remove {iv.label}"
                        aria-label="Remove {iv.label}"
                      >
                        <Trash2 size={11} />
                      </button>
                    {/if}
                  </div>
                  <div class="text-[9px] font-normal text-slate-400 normal-case">
                    {iv.daysBeforeDbl === 0 ? 'Lock Day (0d)' : `-${iv.daysBeforeDbl} days`}
                  </div>
                </th>
              {/each}
              <th class="py-2 pl-3 text-center font-bold w-[104px]">Sparkline</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            {#each V3_DOMAINS as dom (dom.id)}
              {@const pts = buildSparklinePoints(dom.id)}
              {@const coords = buildSparklineCoords(dom.id)}
              <tr class="hover:bg-slate-50/80 transition-colors">
                <td class="py-2 pr-3 sticky left-0 bg-white z-10">
                  <div class="font-semibold text-slate-900">{dom.name}</div>
                  <div class="text-[10px] text-slate-400">
                    Current actual: <span class="font-semibold text-slate-600">{dom.readiness}%</span>
                  </div>
                </td>
                {#each draft.intervals as iv (iv.id)}
                  {@const val = draft.targets[dom.id]?.[iv.id] ?? 100}
                  <td class="py-2 px-1.5 text-center">
                    <div class="inline-flex items-center rounded-lg border border-slate-200 bg-white focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 px-1.5 py-1">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={val}
                        oninput={(e) => updateCell(dom.id, iv.id, (e.currentTarget as HTMLInputElement).value)}
                        aria-label="{dom.name} target at {iv.label}"
                        class="w-11 text-right font-mono font-semibold text-slate-900 bg-transparent focus:outline-hidden text-xs"
                      />
                      <span class="text-[10px] text-slate-400 ml-0.5">%</span>
                    </div>
                  </td>
                {/each}
                <td class="py-2 pl-3 text-center">
                  <svg viewBox="0 0 88 24" class="w-[88px] h-6 mx-auto overflow-visible" aria-label="{dom.name} trajectory preview">
                    <line x1="4" y1="20" x2="84" y2="20" stroke="#e2e8f0" stroke-width="1" />
                    <polyline fill="none" stroke="#2563eb" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" points={pts} />
                    {#each coords as c}
                      <circle cx={c.x} cy={c.y} r="2" fill="#2563eb" stroke="#ffffff" stroke-width="0.8" />
                    {/each}
                  </svg>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>

      <!-- Editable Variance Thresholds -->
      <div class="px-5 py-3 bg-slate-50/90 border-t border-slate-200 shrink-0">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div class="text-[11px] font-bold uppercase tracking-wider text-slate-600">Variance Thresholds</div>
            <div class="text-[10px] text-slate-400">Controls On Track / Watch / Behind status bands</div>
          </div>
          <div class="flex flex-wrap items-center gap-2.5 text-xs">
            <label class="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 font-semibold">
              <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>On Track &ge;</span>
              <input
                type="number"
                min="-20"
                max="20"
                bind:value={draft.thresholds.onTrackMin}
                class="w-12 px-1.5 py-0.5 rounded border border-emerald-300 bg-white text-center font-mono text-slate-900 focus:outline-hidden"
              />
              <span>pts</span>
            </label>

            <label class="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 font-semibold">
              <span class="w-2 h-2 rounded-full bg-amber-500"></span>
              <span>Watch</span>
              <input
                type="number"
                min="-50"
                max={draft.thresholds.onTrackMin - 1}
                bind:value={draft.thresholds.watchMin}
                class="w-12 px-1.5 py-0.5 rounded border border-amber-300 bg-white text-center font-mono text-slate-900 focus:outline-hidden"
              />
              <span>to {draft.thresholds.onTrackMin - 1} pts</span>
            </label>

            <div class="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 font-semibold">
              <span class="w-2 h-2 rounded-full bg-rose-500"></span>
              <span>Behind &lt; {draft.thresholds.watchMin} pts</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Modal Footer -->
      <div class="px-5 py-3 bg-white border-t border-slate-200 flex items-center justify-between gap-3 shrink-0">
        <span class="text-[11px] text-slate-400">
          Saved per Therapeutic Area &amp; Phase in browser storage.
        </span>
        <div class="flex items-center gap-2">
          <button
            type="button"
            onclick={() => (open = false)}
            class="px-3.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onclick={handleSave}
            class="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-xs font-semibold text-white shadow-xs cursor-pointer"
          >
            <Check size={14} /> Save &amp; Apply
          </button>
        </div>
      </div>
    </div>
  </div>
{/if}
