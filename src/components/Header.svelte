<script lang="ts">
  import { Database } from '@lucide/svelte';
  export let study: any;
</script>
<header class="app-header"><div class="header-inner"><div class="brand"><span class="brand-icon"><Database size={19}/></span><div><strong>DBLock <span>AI</span></strong><small>Study readiness workspace</small></div></div><div class="header-study"><span>Current study</span><strong>{study.protocol}</strong><small>{study.therapeuticArea} · {study.phase}</small></div></div></header>
