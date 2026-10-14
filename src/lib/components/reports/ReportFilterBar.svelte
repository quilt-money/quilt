<script lang="ts">
	import type { Snippet } from 'svelte';
	import MultiSelectFilter from '$lib/components/MultiSelectFilter.svelte';
	import type { HoldingWithTags } from '$lib/server/db/queries/holdings';
	import {
		FILTER_FIELDS,
		FILTER_LABELS,
		filterOptions,
		type FilterField,
		type ReportFilters
	} from '$lib/report-builder';

	let {
		holdings,
		filters = $bindable(),
		children
	}: {
		holdings: HoldingWithTags[];
		filters: ReportFilters;
		/** Extra controls shown after the dropdowns, e.g. a date range. */
		children?: Snippet;
	} = $props();

	const dropdownFilterFields = FILTER_FIELDS.filter(
		(field) => field !== 'accountName' && field !== 'accountTags' && field !== 'securityTags'
	);

	function section(field: FilterField, heading?: string) {
		return {
			heading,
			options: filterOptions(holdings, field),
			selected: filters[field] ?? [],
			onChange: (values: string[]) => (filters = { ...filters, [field]: values })
		};
	}
</script>

<div class="flex flex-col gap-2 p-4">
	<p class="text-xs font-medium tracking-wide text-muted-foreground uppercase">Filters</p>
	<div class="flex flex-wrap gap-2">
		{#each dropdownFilterFields as field (field)}
			<MultiSelectFilter label={FILTER_LABELS[field]} sections={[section(field)]} />
		{/each}
		<MultiSelectFilter
			label="Tag"
			sections={[
				section('accountTags', FILTER_LABELS.accountTags),
				section('securityTags', FILTER_LABELS.securityTags)
			]}
		/>
		{#if children}{@render children()}{/if}
	</div>
</div>
