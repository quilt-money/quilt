<script lang="ts">
	import { enhance } from '$app/forms';
	import { toast } from 'svelte-sonner';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import ReportChart from '$lib/components/ReportChart.svelte';
	import TimeSeriesGraph from '$lib/components/TimeSeriesGraph.svelte';
	import { computeTimeSeries, filterHoldings } from '$lib/report-builder';
	import { formatUsd } from '$lib/chart-theme';
	import { formatMoney, percentChangeOverPeriod } from '$lib/format';
	import ReportToolbar from '$lib/components/reports/ReportToolbar.svelte';
	import TimeReportToolbar from '$lib/components/reports/TimeReportToolbar.svelte';
	import ReportFormFields from '$lib/components/reports/ReportFormFields.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import type { HoldingWithTags } from '$lib/server/db/queries/holdings';
	import type { PriceHistory } from '$lib/server/db/queries/price-history';
	import {
		defaultReportConfig,
		defaultTimeReportConfig,
		type TimeInterval,
		isTimeReportConfig,
		type Metric,
		type Dimension,
		type ChartType,
		type ReportFilters,
		type SavedReportConfig
	} from '$lib/report-builder';

	let {
		mode,
		initial,
		holdings,
		priceHistory
	}: {
		/** `create` posts to `?/create`; `edit` posts to `?/update` and offers deletion. */
		mode: 'create' | 'edit';
		/** The starting title and config. Read once, so key this component on whatever identifies it. */
		initial: { title: string; config: SavedReportConfig };
		holdings: HoldingWithTags[];
		priceHistory: PriceHistory;
	} = $props();

	// The form edits a copy of the initial report. Reading it inside a function keeps the copy
	// intentional: the parent keys this component, so it only needs the values at creation.
	function readInitialReport() {
		const { title, config } = initial;
		return {
			title,
			filters: config.filters,
			isTimeReport: isTimeReportConfig(config),
			// A time report has no metric, grouping or chart type, and a chart report has no interval
			// or date range, so each side falls back to defaults when it doesn't apply.
			chartConfig: isTimeReportConfig(config) ? defaultReportConfig(holdings) : config,
			timeConfig: isTimeReportConfig(config) ? config : defaultTimeReportConfig(holdings)
		};
	}
	const initialReport = readInitialReport();
	const isTimeReport = initialReport.isTimeReport;
	const savedTitle = initialReport.title;

	let title = $state(initialReport.title);
	let metric = $state<Metric>(initialReport.chartConfig.metric);
	let dimension = $state<Dimension>(initialReport.chartConfig.dimension);
	let chartType = $state<ChartType>(initialReport.chartConfig.chartType);
	let filters = $state<ReportFilters>(initialReport.filters);
	let interval = $state<TimeInterval>(initialReport.timeConfig.interval);
	let startDate = $state(initialReport.timeConfig.startDate);
	let endDate = $state(initialReport.timeConfig.endDate);
	let titleError = $state<string | null>(null);
	let deleteOpen = $state(false);

	const config = $derived<SavedReportConfig>(
		isTimeReport
			? { reportType: 'time', interval, startDate, endDate, filters }
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
			{#if mode === 'edit'}
				<Button variant="destructive" onclick={() => (deleteOpen = true)}>Delete</Button>
				<Button type="submit" form="report-form">Update</Button>
			{:else}
				<Button type="submit" form="report-form">Save report</Button>
			{/if}
		{/snippet}
		<h1 class="truncate text-xl font-semibold sm:text-2xl">
			{title || (mode === 'edit' ? 'Untitled report' : 'New report')}
		</h1>
	</PageHeader>

	{#if isTimeReport}
		<TimeReportToolbar {holdings} bind:interval bind:startDate bind:endDate bind:filters />
	{:else}
		<ReportToolbar {holdings} bind:chartType bind:filters />
	{/if}

	<div class="grid gap-6 lg:grid-cols-[320px_1fr]">
		<form
			id="report-form"
			method="POST"
			action={mode === 'edit' ? '?/update' : '?/create'}
			use:enhance={({ cancel }) => {
				if (!validateTitle()) cancel();
				if (mode === 'edit') {
					return ({ result, update }) => {
						if (result.type === 'redirect') toast.success('Report updated');
						update();
					};
				}
			}}
			class="flex flex-col gap-5 rounded-lg border bg-card p-4 sm:p-5"
		>
			{#if isTimeReport}
				<ReportFormFields {holdings} bind:title bind:filters {titleError} />
			{:else}
				<ReportFormFields
					{holdings}
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
				{@const points = computeTimeSeries(holdings, priceHistory, config)}
				<TimeSeriesGraph
					{title}
					heading={formatMoney(points.at(-1)?.value ?? 0)}
					changeOverPeriod={percentChangeOverPeriod(points.map((point) => point.value))}
					{points}
					seriesName="Total value"
					formatValue={formatUsd}
					aside="{filterHoldings(holdings, config.filters).length} of {holdings.length} holdings"
					emptyMessage="No price history for the holdings in this report."
				/>
			{:else}
				<ReportChart {title} {holdings} {config} />
			{/if}
		</div>
	</div>
</div>

{#if mode === 'edit'}
	<Dialog.Root bind:open={deleteOpen}>
		<Dialog.Portal>
			<Dialog.Overlay />
			<Dialog.Content>
				<Dialog.Header>
					<Dialog.Title>Delete report</Dialog.Title>
					<Dialog.Description>
						This will permanently delete "{savedTitle}" and remove it from any pages it's been added
						to. This action cannot be undone.
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
{/if}
