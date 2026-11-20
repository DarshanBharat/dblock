<script lang="ts">
  import { ChevronDown, Check, X } from '@lucide/svelte';

  interface FilterOption {
    value: string;
    label: string;
    count?: number;
    dotColor?: string;
  }

  export let label: string;
  export let options: FilterOption[] = [];
  export let selected: string[] = [];
  export let onChange: (next: string[]) => void = () => {};

  let open = false;
  let containerEl: HTMLElement;

  function toggleOption(val: string) {
    if (selected.includes(val)) {
      onChange(selected.filter((v) => v !== val));
    } else {
      onChange([...selected, val]);
    }
  }

  function clearAll(e: MouseEvent) {
    e.stopPropagation();
    onChange([]);
  }

  function selectAll() {
    onChange(options.map((o) => o.value));
  }

  function handleWindowClick(e: MouseEvent) {
    if (open && containerEl && !containerEl.contains(e.target as Node)) {
      open = false;
    }
  }

  $: displayLabel =
    selected.length === 0
      ? label
      : selected.length === 1
      ? options.find((o) => o.value === selected[0])?.label || selected[0]
      : `${label} (${selected.length})`;
</script>

<svelte:window on:click={handleWindowClick} />

<div bind:this={containerEl} class="relative inline-block">
  <button
    type="button"
    on:click={() => (open = !open)}
    class="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-colors cursor-pointer {selected.length > 0 ? 'border-blue-300 bg-blue-50/90 text-blue-800 font-semibold' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'}"
  >
    <span class="truncate max-w-[135px]">{displayLabel}</span>
    {#if selected.length > 0}
      <span
        role="button"
        tabindex="0"
        on:click={clearAll}
        on:keydown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onChange([]); } }}
        class="p-0.5 rounded-full hover:bg-blue-200/70 text-blue-600"
        title="Clear {label}"
      >
        <X size={10} />
      </span>
    {:else}
      <ChevronDown size={12} class="text-slate-400 shrink-0 transition-transform {open ? 'rotate-180' : ''}" />
    {/if}
  </button>

  {#if open}
    <div class="absolute left-0 mt-1 w-56 rounded-xl bg-white border border-slate-200 shadow-xl z-50 py-1.5 text-xs">
      <div class="px-2.5 py-1 flex items-center justify-between border-b border-slate-100 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
        <span>{label}</span>
        <div class="flex items-center gap-2">
          <button type="button" on:click={selectAll} class="text-blue-600 hover:underline cursor-pointer normal-case">All</button>
          {#if selected.length > 0}
            <button type="button" on:click={() => onChange([])} class="text-slate-500 hover:text-slate-800 hover:underline cursor-pointer normal-case">Clear</button>
          {/if}
        </div>
      </div>
      <div class="max-h-56 overflow-y-auto py-1">
        {#each options as opt}
          {@const isChecked = selected.includes(opt.value)}
          <button
            type="button"
            on:click={() => toggleOption(opt.value)}
            class="w-full px-2.5 py-1.5 flex items-center justify-between gap-2 text-left hover:bg-slate-50 cursor-pointer {isChecked ? 'bg-blue-50/50 text-blue-900 font-semibold' : 'text-slate-700'}"
          >
            <span class="inline-flex items-center gap-2 min-w-0">
              <span class="w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 {isChecked ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-300 bg-white'}">
                {#if isChecked}
                  <Check size={10} strokeWidth={3} />
                {/if}
              </span>
              {#if opt.dotColor}
                <span class="w-2 h-2 rounded-full shrink-0" style="background:{opt.dotColor}"></span>
              {/if}
              <span class="truncate">{opt.label}</span>
            </span>
            {#if opt.count !== undefined}
              <span class="text-[10px] font-mono text-slate-400 shrink-0">{opt.count}</span>
            {/if}
          </button>
        {/each}
      </div>
    </div>
  {/if}
</div>
