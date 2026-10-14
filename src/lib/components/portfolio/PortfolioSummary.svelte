<script lang="ts">
	import XIcon from '@lucide/svelte/icons/x';
	import type { DataTableFilterSummary } from '$lib/components/data-table/DataTable.svelte';
	import SectionatedHeader from '$lib/components/SectionatedHeader.svelte';
	import { formatMoney } from '$lib/format';

	let {
		totalValue,
		totalCount,
		balanceLabel,
		balance,
		balanceCount,
		activeFilters
	}: {
		totalValue: number;
		totalCount: number;
		balanceLabel: string;
		balance: number;
		balanceCount: number;
		activeFilters: DataTableFilterSummary;
	} = $props();

	const hasActiveFilters = $derived(
		activeFilters.search.length > 0 || activeFilters.columns.length > 0
	);
</script>

<SectionatedHeader>
	<div class="flex flex-col gap-2 p-4 xl:min-w-64">
		<p class="text-xs font-medium tracking-wide text-muted-foreground uppercase">Total balance</p>
		<p class="text-2xl font-semibold">{formatMoney(totalValue)}</p>
		<p class="text-sm text-muted-foreground">{totalCount.toLocaleString()} holdings</p>
	</div>

	<div class="flex flex-col gap-2 p-4 xl:min-w-64">
		<p class="text-xs font-medium tracking-wide text-muted-foreground uppercase">
			{balanceLabel}
		</p>
		<p class="text-2xl font-semibold">{formatMoney(balance)}</p>
		<p class="text-sm text-muted-foreground">
			{balanceCount.toLocaleString()} of {totalCount.toLocaleString()} holdings
		</p>
	</div>

	<div class="flex min-w-0 flex-1 flex-col gap-2 p-4 xl:min-w-80">
		<p class="text-xs font-medium tracking-wide text-muted-foreground uppercase">Applied filters</p>
		{#if hasActiveFilters}
			<div class="flex flex-wrap items-center gap-2">
				{#if activeFilters.search}
					<button
						type="button"
						class="flex items-center gap-1.5 rounded-full border bg-background px-3 py-1 text-sm font-medium hover:bg-accent"
						onclick={activeFilters.clearSearch}
					>
						Search: "{activeFilters.search}"
						<XIcon class="size-4" />
					</button>
				{/if}
				{#each activeFilters.columns as filter (filter.id)}
					<button
						type="button"
						class="flex items-center gap-1.5 rounded-full border bg-background px-3 py-1 text-sm font-medium hover:bg-accent"
						onclick={filter.clear}
					>
						{filter.label}: {filter.values.join(' and ')}
						<XIcon class="size-4" />
					</button>
				{/each}
			</div>
		{:else}
			<p class="text-sm text-muted-foreground">No filters applied</p>
		{/if}
	</div>
</SectionatedHeader>
