<script lang="ts">
	import { enhance } from '$app/forms';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import ReportChart from '$lib/components/ReportChart.svelte';
	import MultiSelectFilter from '$lib/components/MultiSelectFilter.svelte';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import {
		METRIC_LABELS,
		DIMENSION_LABELS,
		CHART_TYPE_LABELS,
		FILTER_LABELS,
		FILTER_FIELDS,
		filterOptions,
		defaultReportConfig,
		type Metric,
		type Dimension,
		type ChartType,
		type ReportFilters,
		type ReportConfig
	} from '$lib/report-builder';

	let { data } = $props();

	const initialConfig = defaultReportConfig();

	let title = $state('Untitled report');
	let metric = $state<Metric>(initialConfig.metric);
	let dimension = $state<Dimension>(initialConfig.dimension);
	let chartType = $state<ChartType>(initialConfig.chartType);
	let filters = $state<ReportFilters>(initialConfig.filters);
	let titleError = $state<string | null>(null);

	const config = $derived<ReportConfig>({ metric, dimension, chartType, filters });

	$effect(() => {
		if (titleError && title.trim().length > 0) titleError = null;
	});

	function validateTitle(): boolean {
		if (title.trim().length === 0) {
			titleError = 'Report name is required.';
			return false;
		}
		return true;
	}

	const selectClass =
		'h-8 rounded-md border border-input bg-transparent px-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30';
</script>

<div class="p-6">
	<PageHeader>
		{#snippet actions()}
			<Button type="submit" form="report-form">Save report</Button>
		{/snippet}
		<h1 class="text-2xl font-semibold">{title || 'New report'}</h1>
	</PageHeader>

	<div class="grid gap-6 lg:grid-cols-[320px_1fr]">
		<form
			id="report-form"
			method="POST"
			action="?/create"
			use:enhance={({ cancel }) => {
				if (!validateTitle()) cancel();
			}}
			class="flex flex-col gap-5 rounded-lg border bg-card p-5"
		>
			<div class="grid gap-2">
				<Label for="report-title">Title</Label>
				<Input
					id="report-title"
					name="title"
					bind:value={title}
					aria-invalid={titleError !== null}
				/>
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
							options={filterOptions(data.holdings, field)}
							selected={filters[field]}
							onChange={(values) => (filters = { ...filters, [field]: values })}
						/>
					{/each}
				</div>
			</div>

			<input type="hidden" name="config" value={JSON.stringify(config)} />
		</form>

		<ReportChart {title} holdings={data.holdings} {config} />
	</div>
</div>
