<script lang="ts">
	import type { Snippet } from 'svelte';

	let { children }: { children: Snippet } = $props();
</script>

<!-- Each direct child is a section: stacked with a top border on small screens, side by side with dividers on xl. -->
<div
	class="mb-6 flex flex-col items-stretch rounded-lg border bg-card xl:flex-row xl:divide-x [&>*:not(:first-child)]:border-t xl:[&>*:not(:first-child)]:border-t-0"
>
	{@render children()}
</div>
