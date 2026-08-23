<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		children,
		actions
	}: {
		children: Snippet;
		actions?: Snippet;
	} = $props();
</script>

<div class="flex items-start justify-between gap-4 mb-6">
	<div>{@render children()}</div>
	{#if actions}
		<div class="shrink-0">{@render actions()}</div>
	{/if}
</div>
