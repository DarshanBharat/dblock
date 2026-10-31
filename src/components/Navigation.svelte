<script lang="ts">
  export let activeTab: string;
  export let onSelectTab: (tab: string) => void;
  const tabs = [
    { id: 'command_centre', label: 'Overview' },
    { id: 'action_workbench', label: 'Actions' },
    { id: 'risk_matrix', label: 'Sites & risks' },
    { id: 'digital_twin', label: 'Readiness' },
    { id: 'simulator', label: 'Try scenarios' },
    { id: 'forecast_scenarios', label: 'Forecast' }
  ];
</script>
<div class="nav-shell"><nav class="app-nav" aria-label="Main navigation">{#each tabs as tab}<button class:nav-active={activeTab === tab.id} aria-current={activeTab === tab.id ? 'page' : undefined} on:click={() => onSelectTab(tab.id)}>{tab.label}</button>{/each}</nav></div>
