<script lang="ts">
	import ChevronUpIcon from '@lucide/svelte/icons/chevron-up';
	import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';

	type SortableHeaderProps = {
		column: {
			getCanSort: () => boolean;
			getIsSorted: () => false | 'asc' | 'desc';
			getToggleSortingHandler: () => ((e: unknown) => void) | undefined;
		};
	};

	let { label, header }: { label: string; header: SortableHeaderProps } = $props();
</script>

<button
	type="button"
	class="-mx-2 flex items-center gap-1 rounded px-2 py-1 hover:bg-accent disabled:hover:bg-transparent"
	disabled={!header.column.getCanSort()}
	onclick={header.column.getToggleSortingHandler()}
>
	{label}
	{#if header.column.getIsSorted() === 'asc'}
		<ChevronUpIcon class="size-3.5" />
	{:else if header.column.getIsSorted() === 'desc'}
		<ChevronDownIcon class="size-3.5" />
	{/if}
</button>
