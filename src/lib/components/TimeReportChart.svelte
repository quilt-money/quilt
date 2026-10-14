<script lang="ts">
	import type { EChartsOption } from 'echarts';
	import EChart from '$lib/components/EChart.svelte';
	import ReportCard from '$lib/components/reports/ReportCard.svelte';
	import type { HoldingWithTags } from '$lib/server/db/queries/holdings';
	import type { PriceHistory } from '$lib/server/db/queries/price-history';
	import { computeTimeSeries, filterHoldings, type TimeReportConfig } from '$lib/report-builder';
	import { CATEGORICAL, TEXT_MUTED, GRID_LINE, formatUsd } from '$lib/chart-theme';
	import { formatMoney, formatPercent, gainLossClass } from '$lib/format';

	const dateFormatter = new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' });

	let {
		title,
		holdings,
		priceHistory,
		config,
		fill = false,
		reportId
	}: {
		title: string;
		holdings: HoldingWithTags[];
		priceHistory: PriceHistory;
		config: TimeReportConfig;
		fill?: boolean;
		/** When set, the report title links to this report's drill-down page. */
		reportId?: string;
	} = $props();

	const filteredHoldings = $derived(filterHoldings(holdings, config.filters));
	const points = $derived(computeTimeSeries(holdings, priceHistory, config));

	const latestValue = $derived(points.at(-1)?.value ?? 0);
	const change = $derived(points.length > 1 ? latestValue - points[0].value : null);
	const changePercent = $derived(
		change != null && points[0].value !== 0 ? (change / points[0].value) * 100 : null
	);

	let chartWidth = $state(0);
	const compact = $derived(chartWidth > 0 && chartWidth < 520);

	const option = $derived<EChartsOption>({
		backgroundColor: 'transparent',
		tooltip: {
			trigger: 'axis',
			// The default header includes the time of day, which is just noise for daily prices.
			formatter: (params) => {
				const [point] = [params].flat() as unknown as {
					axisValue: number;
					marker: string;
					value: unknown[];
				}[];
				const date = dateFormatter.format(new Date(point.axisValue));
				return `${date}<br/>${point.marker} Total value: <b>${formatUsd(point.value[1] as number)}</b>`;
			},
			textStyle: { fontSize: 13 }
		},
		grid: { left: compact ? 48 : 64, right: 16, top: 24, bottom: 32 },
		xAxis: {
			type: 'time',
			axisLabel: { color: TEXT_MUTED, fontSize: 11 },
			axisLine: { lineStyle: { color: GRID_LINE } }
		},
		yAxis: {
			type: 'value',
			scale: true,
			axisLabel: {
				color: TEXT_MUTED,
				fontSize: 11,
				formatter: (value: number) => formatUsd(value)
			},
			splitLine: { lineStyle: { color: GRID_LINE } }
		},
		series: [
			{
				name: 'Total value',
				type: 'line',
				smooth: config.chartType === 'smooth',
				showSymbol: points.length <= 30,
				data: points.map((point) => [point.time, point.value]),
				itemStyle: { color: CATEGORICAL[0] },
				lineStyle: { color: CATEGORICAL[0] },
				areaStyle: config.chartType === 'area' ? { color: CATEGORICAL[0], opacity: 0.2 } : undefined
			}
		]
	});
</script>

<ReportCard
	{title}
	headline={formatMoney(latestValue)}
	aside="{filteredHoldings.length} of {holdings.length} holdings"
	{fill}
	{reportId}
>
	{#snippet detail()}
		{#if change != null}
			<p class="mt-0.5 text-sm font-medium {gainLossClass(change)}">
				{#if change > 0}+{/if}{formatMoney(change)}
				{#if changePercent != null}({#if changePercent > 0}+{/if}{formatPercent(
						changePercent
					)}){/if}
				<span class="font-normal text-muted-foreground">over this period</span>
			</p>
		{/if}
	{/snippet}

	{#if points.length === 0}
		<p class="py-8 text-center text-sm text-muted-foreground">
			No price history for the holdings in this report.
		</p>
	{:else}
		<div
			class="mt-6 min-w-0 overflow-hidden {fill ? 'min-h-0 flex-1' : ''}"
			bind:clientWidth={chartWidth}
		>
			<EChart {option} height={fill ? '100%' : compact ? '300px' : '320px'} />
		</div>
	{/if}
</ReportCard>
