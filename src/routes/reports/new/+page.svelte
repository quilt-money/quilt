<script lang="ts">
	import { enhance } from '$app/forms';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import ReportChart from '$lib/components/ReportChart.svelte';
	import ReportFilterSummary from '$lib/components/reports/ReportFilterSummary.svelte';
	import ReportFormFields from '$lib/components/reports/ReportFormFields.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import {
		defaultReportConfig,
		type Metric,
		type Dimension,
		type ChartType,
		type ReportFilters,
		type ReportConfig
	} from '$lib/report-builder';

	let { data } = $props();

	const initialConfig = defaultReportConfig(data.holdings);

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
</script>

<div class="p-6">
	<PageHeader>
		{#snippet actions()}
			<Button type="submit" form="report-form">Save report</Button>
		{/snippet}
		<h1 class="text-2xl font-semibold">{title || 'New report'}</h1>
	</PageHeader>

	{#if data.reportType === 'summary'}
		<div class="max-w-2xl rounded-lg border bg-card p-6">
			<p class="py-8 text-center text-sm text-muted-foreground">
				Summary reports are not available yet.
			</p>
		</div>
	{:else}
		<div class="mb-6">
			<ReportFilterSummary holdings={data.holdings} {filters} />
		</div>

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
				<ReportFormFields
					holdings={data.holdings}
					bind:title
					bind:metric
					bind:dimension
					bind:chartType
					bind:filters
					{titleError}
				/>

				<input type="hidden" name="config" value={JSON.stringify(config)} />
			</form>

			<ReportChart {title} holdings={data.holdings} {config} />
		</div>
	{/if}
</div>
