<script lang="ts">
	import { enhance } from '$app/forms';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import ReportChart from '$lib/components/ReportChart.svelte';
	import TimeReportChart from '$lib/components/TimeReportChart.svelte';
	import ReportToolbar from '$lib/components/reports/ReportToolbar.svelte';
	import TimeReportToolbar from '$lib/components/reports/TimeReportToolbar.svelte';
	import ReportFormFields from '$lib/components/reports/ReportFormFields.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import {
		defaultReportConfig,
		defaultTimeReportConfig,
		type TimeChartType,
		type TimeInterval,
		isTimeReportConfig,
		type Metric,
		type Dimension,
		type ChartType,
		type ReportFilters,
		type SavedReportConfig
	} from '$lib/report-builder';

	let { data } = $props();

	const initialConfig = defaultReportConfig(data.holdings);

	let title = $state('Untitled report');
	let metric = $state<Metric>(initialConfig.metric);
	let dimension = $state<Dimension>(initialConfig.dimension);
	let chartType = $state<ChartType>(initialConfig.chartType);
	let filters = $state<ReportFilters>(initialConfig.filters);

	const initialTimeConfig = defaultTimeReportConfig(data.holdings);
	let timeChartType = $state<TimeChartType>(initialTimeConfig.chartType);
	let interval = $state<TimeInterval>(initialTimeConfig.interval);
	let startDate = $state(initialTimeConfig.startDate);
	let endDate = $state(initialTimeConfig.endDate);
	let titleError = $state<string | null>(null);

	const isTimeReport = $derived(data.reportType === 'time');
	const config = $derived<SavedReportConfig>(
		isTimeReport
			? { reportType: 'time', chartType: timeChartType, interval, startDate, endDate, filters }
			: { metric, dimension, chartType, filters }
	);

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

<div class="p-4 sm:p-6">
	<PageHeader>
		{#snippet actions()}
			<Button type="submit" form="report-form">Save report</Button>
		{/snippet}
		<h1 class="truncate text-xl font-semibold sm:text-2xl">{title || 'New report'}</h1>
	</PageHeader>

	{#if data.reportType === 'summary'}
		<div class="max-w-2xl rounded-lg border bg-card p-4 sm:p-6">
			<p class="py-8 text-center text-sm text-muted-foreground">
				Summary reports are not available yet.
			</p>
		</div>
	{:else}
		{#if isTimeReport}
			<TimeReportToolbar
				holdings={data.holdings}
				bind:chartType={timeChartType}
				bind:interval
				bind:startDate
				bind:endDate
				bind:filters
			/>
		{:else}
			<ReportToolbar holdings={data.holdings} bind:chartType bind:filters />
		{/if}

		<div class="grid gap-6 lg:grid-cols-[320px_1fr]">
			<form
				id="report-form"
				method="POST"
				action="?/create"
				use:enhance={({ cancel }) => {
					if (!validateTitle()) cancel();
				}}
				class="flex flex-col gap-5 rounded-lg border bg-card p-4 sm:p-5"
			>
				{#if isTimeReport}
					<ReportFormFields holdings={data.holdings} bind:title bind:filters {titleError} />
				{:else}
					<ReportFormFields
						holdings={data.holdings}
						bind:title
						bind:metric
						bind:dimension
						bind:filters
						{titleError}
					/>
				{/if}

				<input type="hidden" name="config" value={JSON.stringify(config)} />
			</form>

			<div class="min-w-0">
				{#if isTimeReportConfig(config)}
					<TimeReportChart
						{title}
						holdings={data.holdings}
						priceHistory={data.priceHistory}
						{config}
					/>
				{:else}
					<ReportChart {title} holdings={data.holdings} {config} />
				{/if}
			</div>
		</div>
	{/if}
</div>
