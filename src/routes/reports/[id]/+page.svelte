<script lang="ts">
	import { enhance } from '$app/forms';
	import { toast } from 'svelte-sonner';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import ReportChart from '$lib/components/ReportChart.svelte';
	import TimeReportChart from '$lib/components/TimeReportChart.svelte';
	import ReportToolbar from '$lib/components/reports/ReportToolbar.svelte';
	import TimeReportToolbar from '$lib/components/reports/TimeReportToolbar.svelte';
	import ReportFormFields from '$lib/components/reports/ReportFormFields.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
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

	let title = $state(data.report.title);
	const savedConfig = data.report.config;
	const isTimeReport = isTimeReportConfig(savedConfig);
	// A time report has no metric, grouping or chart type, so these only matter for chart reports.
	const savedChartConfig = isTimeReportConfig(savedConfig)
		? defaultReportConfig(data.holdings)
		: savedConfig;

	let metric = $state<Metric>(savedChartConfig.metric);
	let dimension = $state<Dimension>(savedChartConfig.dimension);
	let chartType = $state<ChartType>(savedChartConfig.chartType);
	let filters = $state<ReportFilters>(savedConfig.filters);

	const savedTimeConfig = isTimeReportConfig(savedConfig)
		? savedConfig
		: defaultTimeReportConfig(data.holdings);
	let timeChartType = $state<TimeChartType>(savedTimeConfig.chartType);
	let interval = $state<TimeInterval>(savedTimeConfig.interval);
	let startDate = $state(savedTimeConfig.startDate);
	let endDate = $state(savedTimeConfig.endDate);
	let titleError = $state<string | null>(null);
	let deleteOpen = $state(false);

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

<div class="p-6">
	<PageHeader>
		{#snippet actions()}
			<Button variant="destructive" onclick={() => (deleteOpen = true)}>Delete</Button>
			<Button type="submit" form="report-form">Update</Button>
		{/snippet}
		<h1 class="text-2xl font-semibold">{title || 'Untitled report'}</h1>
	</PageHeader>

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
			action="?/update"
			use:enhance={({ cancel }) => {
				if (!validateTitle()) cancel();
				return ({ result, update }) => {
					if (result.type === 'redirect') toast.success('Report updated');
					update();
				};
			}}
			class="flex flex-col gap-5 rounded-lg border bg-card p-5"
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

		{#if isTimeReportConfig(config)}
			<TimeReportChart {title} holdings={data.holdings} priceHistory={data.priceHistory} {config} />
		{:else}
			<ReportChart {title} holdings={data.holdings} {config} />
		{/if}
	</div>
</div>

<Dialog.Root bind:open={deleteOpen}>
	<Dialog.Portal>
		<Dialog.Overlay />
		<Dialog.Content>
			<Dialog.Header>
				<Dialog.Title>Delete report</Dialog.Title>
				<Dialog.Description>
					This will permanently delete "{data.report.title}" and remove it from any pages it's been
					added to. This action cannot be undone.
				</Dialog.Description>
			</Dialog.Header>

			<form
				method="POST"
				action="?/delete"
				use:enhance={() => {
					return ({ result, update }) => {
						if (result.type === 'redirect') toast.success('Report deleted');
						update();
					};
				}}
			>
				<Dialog.Footer>
					<Button type="button" variant="outline" onclick={() => (deleteOpen = false)}
						>Cancel</Button
					>
					<Button type="submit" variant="destructive">Delete</Button>
				</Dialog.Footer>
			</form>
		</Dialog.Content>
	</Dialog.Portal>
</Dialog.Root>
