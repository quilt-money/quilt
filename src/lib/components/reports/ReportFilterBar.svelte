<script lang="ts">
	import MultiSelectFilter from '$lib/components/MultiSelectFilter.svelte';
	import type { HoldingWithTags } from '$lib/server/db/queries/holdings';
	import {
		FILTER_FIELDS,
		FILTER_LABELS,
		filterOptions,
		type ReportFilters
	} from '$lib/report-builder';

	let { holdings, filters = $bindable() }: { holdings: HoldingWithTags[]; filters: ReportFilters } =
		$props();

	// Accounts are chosen with the checklist beside the report, not a dropdown.
	const dropdownFilterFields = FILTER_FIELDS.filter((field) => field !== 'accountName');
</script>

<div class="flex flex-col gap-2 p-4">
	<p class="text-xs font-medium tracking-wide text-muted-foreground uppercase">Filters</p>
	<div class="flex flex-wrap gap-2">
		{#each dropdownFilterFields as field (field)}
			<MultiSelectFilter
				label={FILTER_LABELS[field]}
				options={filterOptions(holdings, field)}
				selected={filters[field] ?? []}
				onChange={(values) => (filters = { ...filters, [field]: values })}
			/>
		{/each}
	</div>
</div>
