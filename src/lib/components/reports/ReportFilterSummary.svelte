<script lang="ts">
	import type { HoldingWithTags } from '$lib/server/db/queries/holdings';
	import {
		FILTER_FIELDS,
		FILTER_LABELS,
		filterHoldings,
		filterOptions,
		formatMetricValue,
		type ReportFilters
	} from '$lib/report-builder';

	let { holdings, filters }: { holdings: HoldingWithTags[]; filters: ReportFilters } = $props();

	const includedHoldings = $derived(filterHoldings(holdings, filters));
	const includedValue = $derived(
		includedHoldings.reduce((sum, holding) => sum + (holding.totalValue ?? 0), 0)
	);
	const totalValue = $derived(
		holdings.reduce((sum, holding) => sum + (holding.totalValue ?? 0), 0)
	);
	const includedShare = $derived(
		holdings.length > 0 ? includedHoldings.length / holdings.length : 0
	);

	const fieldBreakdown = $derived(
		FILTER_FIELDS.map((field) => ({
			field,
			label: FILTER_LABELS[field],
			selectedCount: filters[field]?.length ?? 0,
			optionCount: filterOptions(holdings, field).length
		})).filter((entry) => entry.optionCount > 0)
	);
</script>

<div class="rounded-lg border bg-card p-5">
	<div class="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
		<div>
			<p class="text-sm text-muted-foreground">Holdings included</p>
			<p class="text-2xl font-semibold">
				{includedHoldings.length.toLocaleString()}
				<span class="text-base font-normal text-muted-foreground"
					>of {holdings.length.toLocaleString()}</span
				>
			</p>
		</div>
		<div class="text-right">
			<p class="text-sm text-muted-foreground">Value included</p>
			<p class="text-2xl font-semibold">
				{formatMetricValue('value', includedValue)}
				<span class="text-base font-normal text-muted-foreground"
					>of {formatMetricValue('value', totalValue)}</span
				>
			</p>
		</div>
	</div>

	<div class="mt-4 h-2 overflow-hidden rounded-full bg-primary/15">
		<div
			class="h-full rounded-full bg-primary transition-[width]"
			style="width: {(includedShare * 100).toFixed(1)}%"
		></div>
	</div>

	{#if fieldBreakdown.length > 0}
		<div class="mt-4 flex flex-wrap gap-x-5 gap-y-1.5 text-xs text-muted-foreground">
			{#each fieldBreakdown as entry (entry.field)}
				<span>
					{entry.label}: <span class="font-medium text-foreground">{entry.selectedCount}</span> of
					{entry.optionCount}
				</span>
			{/each}
		</div>
	{/if}
</div>
