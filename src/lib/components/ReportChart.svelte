<script lang="ts">
	import type { EChartsOption, ECElementEvent } from 'echarts';
	import { goto } from '$app/navigation';
	import EChart from '$lib/components/EChart.svelte';
	import ReportCard from '$lib/components/reports/ReportCard.svelte';
	import type { HoldingWithTags } from '$lib/server/db/queries/holdings';
	import {
		computeSlices,
		filterHoldings,
		formatMetricValue,
		DIMENSION_LABELS,
		DIMENSION_FILTER_FIELD,
		METRIC_LABELS,
		type ReportConfig
	} from '$lib/report-builder';
	import { CATEGORICAL, SURFACE, TEXT_MUTED, GRID_LINE, formatUsd } from '$lib/chart-theme';
	import { portfolioFilterHref } from '$lib/portfolio-filter';

	let {
		title,
		holdings,
		config,
		fill = false,
		reportId
	}: {
		title: string;
		holdings: HoldingWithTags[];
		config: ReportConfig;
		fill?: boolean;
		/** When set, the report title links to this report's drill-down page. */
		reportId?: string;
	} = $props();

	const filteredHoldings = $derived(filterHoldings(holdings, config.filters));
	const slices = $derived(computeSlices(holdings, config));
	const total = $derived(slices.reduce((sum, slice) => sum + slice.value, 0));

	// Narrow containers (phones, side-by-side layouts) get a simpler pie/bar layout.
	let chartWidth = $state(0);
	const compact = $derived(chartWidth > 0 && chartWidth < 520);

	const isMoney = $derived(config.metric !== 'count');
	const seriesName = $derived(METRIC_LABELS[config.metric]);

	const filterField = $derived(DIMENSION_FILTER_FIELD[config.dimension]);
	function isClickable(slice: { label: string }) {
		return filterField !== null && slice.label !== 'Unclassified';
	}

	function navigateToSlice(slice: { label: string }) {
		if (!isClickable(slice) || filterField === null) return;
		goto(portfolioFilterHref(filterField, slice.label));
	}

	function handleChartClick(params: ECElementEvent) {
		if (typeof params.dataIndex !== 'number') return;
		const slice = slices[params.dataIndex];
		if (slice) navigateToSlice(slice);
	}

	const pieOption = $derived<EChartsOption>({
		backgroundColor: 'transparent',
		tooltip: {
			trigger: 'item',
			// Slices are sized by magnitude (a pie can't draw negatives), so show the signed value.
			formatter: (params) => {
				const { name, dataIndex, marker } = params as {
					name: string;
					dataIndex: number;
					marker: string;
				};
				const value = slices[dataIndex]?.value ?? 0;
				return `${marker} ${name}: <b>${isMoney ? formatUsd(value) : value}</b>`;
			},
			textStyle: { fontSize: 13 }
		},
		legend: {
			type: 'scroll',
			bottom: 0,
			icon: 'circle',
			itemWidth: 8,
			itemHeight: 8,
			textStyle: { color: TEXT_MUTED, fontSize: 12 }
		},
		series: [
			{
				name: seriesName,
				type: 'pie',
				radius: compact ? '60%' : '70%',
				center: ['50%', compact ? '42%' : '46%'],
				avoidLabelOverlap: true,
				itemStyle: { borderColor: SURFACE, borderWidth: 2 },
				label: {
					show: !compact,
					color: TEXT_MUTED,
					fontSize: 12,
					formatter: (params) => `${(params.percent ?? 0).toFixed(0)}%`
				},
				labelLine: { show: !compact },
				data: slices.map((slice, index) => ({
					name: slice.label,
					value: Math.abs(slice.value),
					itemStyle: { color: CATEGORICAL[index % CATEGORICAL.length] }
				}))
			}
		]
	});

	const barOption = $derived<EChartsOption>({
		backgroundColor: 'transparent',
		tooltip: {
			trigger: 'axis',
			valueFormatter: (value) => (isMoney ? formatUsd(value as number) : `${value}`),
			textStyle: { fontSize: 13 }
		},
		grid: {
			left: compact ? 48 : 56,
			right: 16,
			top: 24,
			bottom: compact || slices.length > 8 ? 72 : 40
		},
		xAxis: {
			type: 'category',
			data: slices.map((slice) => slice.label),
			axisLabel: {
				color: TEXT_MUTED,
				fontSize: 11,
				rotate: compact ? 45 : slices.length > 8 ? 30 : 0,
				interval: compact ? 'auto' : undefined,
				width: compact ? 80 : undefined,
				overflow: compact ? 'truncate' : undefined
			},
			axisLine: { lineStyle: { color: GRID_LINE } }
		},
		yAxis: {
			type: 'value',
			axisLabel: {
				color: TEXT_MUTED,
				fontSize: 11,
				formatter: (value: number) => (isMoney ? formatUsd(value) : `${value}`)
			},
			splitLine: { lineStyle: { color: GRID_LINE } }
		},
		series: [
			{
				name: seriesName,
				type: 'bar',
				data: slices.map((slice, index) => ({
					value: slice.value,
					itemStyle: { color: CATEGORICAL[index % CATEGORICAL.length] }
				})),
				barMaxWidth: 40,
				itemStyle: { borderRadius: [4, 4, 0, 0] }
			}
		]
	});

	const option = $derived(config.chartType === 'pie' ? pieOption : barOption);
</script>

<ReportCard
	{title}
	headline={formatMetricValue(config.metric, total)}
	aside="{filteredHoldings.length} of {holdings.length} holdings"
	{fill}
	{reportId}
>
	{#if slices.length === 0}
		<p class="py-8 text-center text-sm text-muted-foreground">No holdings match these filters.</p>
	{:else if config.chartType === 'table'}
		<div class="mt-6 overflow-auto rounded-md border {fill ? 'min-h-0 flex-1' : ''}">
			<table class="w-full text-sm">
				<thead class="bg-muted/50 text-left text-muted-foreground">
					<tr>
						<th class="px-3 py-2 font-medium">{DIMENSION_LABELS[config.dimension]}</th>
						<th class="px-3 py-2 font-medium">{METRIC_LABELS[config.metric]}</th>
					</tr>
				</thead>
				<tbody>
					{#each slices as slice (slice.label)}
						<tr
							class="border-t {isClickable(slice) ? 'cursor-pointer hover:bg-muted/50' : ''}"
							onclick={() => navigateToSlice(slice)}
						>
							<td class="px-3 py-2">{slice.label}</td>
							<td class="px-3 py-2">{formatMetricValue(config.metric, slice.value)}</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{:else}
		<div
			class="mt-6 min-w-0 overflow-hidden {fill ? 'min-h-0 flex-1' : ''}"
			bind:clientWidth={chartWidth}
		>
			<EChart
				{option}
				height={fill ? '100%' : compact ? '300px' : '320px'}
				onItemClick={handleChartClick}
			/>
		</div>
	{/if}
</ReportCard>
