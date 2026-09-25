<script lang="ts">
	import type { EChartsOption, ECElementEvent } from 'echarts';
	import { goto } from '$app/navigation';
	import EChart from '$lib/components/EChart.svelte';
	import type { HoldingWithValue } from '$lib/server/db/queries/holdings';
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
		config
	}: {
		title: string;
		holdings: HoldingWithValue[];
		config: ReportConfig;
	} = $props();

	const filteredHoldings = $derived(filterHoldings(holdings, config.filters));
	const slices = $derived(computeSlices(holdings, config));
	const total = $derived(slices.reduce((sum, slice) => sum + slice.value, 0));

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
			valueFormatter: (value) =>
				config.metric === 'value' ? formatUsd(value as number) : `${value}`,
			textStyle: { fontSize: 13 }
		},
		legend: {
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
				radius: '70%',
				center: ['50%', '46%'],
				avoidLabelOverlap: true,
				itemStyle: { borderColor: SURFACE, borderWidth: 2 },
				label: {
					show: true,
					color: TEXT_MUTED,
					fontSize: 12,
					formatter: (params) => `${(params.percent ?? 0).toFixed(0)}%`
				},
				labelLine: { show: true },
				data: slices.map((slice, index) => ({
					name: slice.label,
					value: slice.value,
					itemStyle: { color: CATEGORICAL[index % CATEGORICAL.length] }
				}))
			}
		]
	});

	const barOption = $derived<EChartsOption>({
		backgroundColor: 'transparent',
		tooltip: {
			trigger: 'axis',
			valueFormatter: (value) =>
				config.metric === 'value' ? formatUsd(value as number) : `${value}`,
			textStyle: { fontSize: 13 }
		},
		grid: {
			left: 56,
			right: 16,
			top: 24,
			bottom: slices.length > 8 ? 64 : 40
		},
		xAxis: {
			type: 'category',
			data: slices.map((slice) => slice.label),
			axisLabel: {
				color: TEXT_MUTED,
				fontSize: 11,
				rotate: slices.length > 8 ? 30 : 0
			},
			axisLine: { lineStyle: { color: GRID_LINE } }
		},
		yAxis: {
			type: 'value',
			axisLabel: {
				color: TEXT_MUTED,
				fontSize: 11,
				formatter: (value: number) => (config.metric === 'value' ? formatUsd(value) : `${value}`)
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

<div class="rounded-lg border bg-card p-6">
	<div class="flex items-center justify-between">
		<div>
			<p class="text-sm text-muted-foreground">{title}</p>
			<p class="mt-1 text-2xl font-semibold">{formatMetricValue(config.metric, total)}</p>
		</div>
		<p class="text-sm text-muted-foreground">
			{filteredHoldings.length} of {holdings.length} holdings
		</p>
	</div>

	{#if slices.length === 0}
		<p class="py-8 text-center text-sm text-muted-foreground">No holdings match these filters.</p>
	{:else if config.chartType === 'table'}
		<div class="mt-6 overflow-hidden rounded-md border">
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
		<div class="mt-6">
			<EChart {option} height="320px" onItemClick={handleChartClick} />
		</div>
	{/if}
</div>
