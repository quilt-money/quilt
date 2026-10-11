<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		children,
		actions,
		toolbar
	}: {
		children: Snippet;
		actions?: Snippet;
		/** Full-width row below the title (e.g. a TableSearch); sticks along with the header. */
		toolbar?: Snippet;
	} = $props();
</script>

<div class="sticky top-[var(--app-header-h)] z-20 mb-4 border-b-2 bg-background px-4 py-4">
	<div class="flex items-start justify-between gap-4">
		<div class="min-w-0">{@render children()}</div>
		{#if actions}
			<div class="shrink-0">{@render actions()}</div>
		{/if}
	</div>
	{#if toolbar}
		<div class="mt-4 flex flex-wrap items-center gap-2">{@render toolbar()}</div>
	{/if}
</div>
