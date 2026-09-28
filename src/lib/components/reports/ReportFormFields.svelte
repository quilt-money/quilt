<script lang="ts">
	import MultiSelectFilter from '$lib/components/MultiSelectFilter.svelte';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import type { HoldingWithTags } from '$lib/server/db/queries/holdings';
	import {
		METRIC_LABELS,
		DIMENSION_LABELS,
		CHART_TYPE_LABELS,
		FILTER_LABELS,
		FILTER_FIELDS,
		filterOptions,
		type Metric,
		type Dimension,
		type ChartType,
		type ReportFilters
	} from '$lib/report-builder';

	let {
		holdings,
		title = $bindable(),
		metric = $bindable(),
		dimension = $bindable(),
		chartType = $bindable(),
		filters = $bindable(),
		titleError = null
	}: {
		holdings: HoldingWithTags[];
		title: string;
		metric: Metric;
		dimension: Dimension;
		chartType: ChartType;
		filters: ReportFilters;
		titleError?: string | null;
	} = $props();

	const selectClass =
		'h-8 rounded-md border border-input bg-transparent px-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30';
</script>

<div class="grid gap-2">
	<Label for="report-title">Title</Label>
	<Input id="report-title" name="title" bind:value={title} aria-invalid={titleError !== null} />
	{#if titleError}
		<p class="text-sm text-destructive">{titleError}</p>
	{/if}
</div>

<div class="grid gap-2">
	<Label for="report-metric">Metric</Label>
	<select id="report-metric" bind:value={metric} class={selectClass}>
		{#each Object.entries(METRIC_LABELS) as [value, label] (value)}
			<option {value}>{label}</option>
		{/each}
	</select>
</div>

<div class="grid gap-2">
	<Label for="report-dimension">Group by</Label>
	<select id="report-dimension" bind:value={dimension} class={selectClass}>
		{#each Object.entries(DIMENSION_LABELS) as [value, label] (value)}
			<option {value}>{label}</option>
		{/each}
	</select>
</div>

<div class="grid gap-2">
	<Label for="report-chart-type">Chart type</Label>
	<select id="report-chart-type" bind:value={chartType} class={selectClass}>
		{#each Object.entries(CHART_TYPE_LABELS) as [value, label] (value)}
			<option {value}>{label}</option>
		{/each}
	</select>
</div>

<div class="grid gap-2">
	<Label>Filters</Label>
	<div class="flex flex-wrap gap-2">
		{#each FILTER_FIELDS as field (field)}
			<MultiSelectFilter
				label={FILTER_LABELS[field]}
				options={filterOptions(holdings, field)}
				selected={filters[field] ?? []}
				onChange={(values) => (filters = { ...filters, [field]: values })}
			/>
		{/each}
	</div>
</div>
