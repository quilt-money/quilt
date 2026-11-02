<script lang="ts">
	import type { EChartsOption } from 'echarts';
	import EChart from '$lib/components/EChart.svelte';
	import ReportCard from '$lib/components/reports/ReportCard.svelte';
	import { CATEGORICAL, TEXT_MUTED, GRID_LINE } from '$lib/chart-theme';
	import { formatMoney, formatPercent, gainLossClass } from '$lib/format';

	const dateFormatter = new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' });

	type TimeSeriesPoint = { time: string; value: number };

	let {
		title,
		heading,
		changeOverPeriod,
		points,
		seriesName = 'Value',
		formatValue = formatMoney,
		aside = '',
		emptyMessage = 'No data for this period.',
		fill = false,
		reportId
	}: {
		title: string;
		/** The large number under the title. */
		heading: string;
		/** Percent change across the plotted period; null hides the change line. */
		changeOverPeriod: number | null;
		points: TimeSeriesPoint[];
		/** Label for the value in the tooltip. */
		seriesName?: string;
		/** Formats values on the y-axis and in the tooltip. */
		formatValue?: (value: number) => string;
		/** Small text opposite the title. */
		aside?: string;
		emptyMessage?: string;
		fill?: boolean;
		/** When set, the title links to this report's drill-down page. */
		reportId?: string;
	} = $props();

	let chartWidth = $state(0);
	const compact = $derived(chartWidth > 0 && chartWidth < 520);

	function formatSignedPercent(value: number): string {
		return `${value > 0 ? '+' : ''}${formatPercent(value)}`;
	}

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
				return `${date}<br/>${point.marker} ${seriesName}: <b>${formatValue(point.value[1] as number)}</b>`;
			},
			textStyle: { fontSize: 13 }
		},
		grid: { left: compact ? 48 : 64, right: 16, top: 24, bottom: 48 },
		xAxis: {
			type: 'time',
			axisLabel: {
				color: TEXT_MUTED,
				fontSize: 11,
				rotate: 30,
				// Only label dates that have a data point; drop labels that would collide.
				customValues: points.map((point) => new Date(point.time).getTime()),
				hideOverlap: true,
				// Always "Oct 12, 2026" regardless of the tick's granularity.
				formatter: (timestamp: number) => dateFormatter.format(new Date(timestamp))
			},
			axisLine: { lineStyle: { color: GRID_LINE } }
		},
		yAxis: {
			type: 'value',
			scale: true,
			axisLabel: {
				color: TEXT_MUTED,
				fontSize: 11,
				formatter: (value: number) => formatValue(value)
			},
			splitLine: { lineStyle: { color: GRID_LINE } }
		},
		series: [
			{
				name: seriesName,
				type: 'line',
				showSymbol: points.length <= 30,
				data: points.map((point) => [point.time, point.value]),
				itemStyle: { color: CATEGORICAL[0] },
				lineStyle: { color: CATEGORICAL[0] },
				areaStyle: { color: CATEGORICAL[0], opacity: 0.2 }
			}
		]
	});
</script>

<ReportCard {title} headline={heading} {aside} {fill} {reportId}>
	{#snippet detail()}
		{#if changeOverPeriod !== null}
			<p class="mt-0.5 text-sm font-medium {gainLossClass(changeOverPeriod)}">
				{formatSignedPercent(changeOverPeriod)}
				<span class="font-normal text-muted-foreground">over this period</span>
			</p>
		{/if}
	{/snippet}

	{#if points.length === 0}
		<p class="py-8 text-center text-sm text-muted-foreground">{emptyMessage}</p>
	{:else}
		<div
			class="mt-6 min-w-0 overflow-hidden {fill ? 'min-h-0 flex-1' : ''}"
			bind:clientWidth={chartWidth}
		>
			<EChart {option} height={fill ? '100%' : compact ? '300px' : '280px'} />
		</div>
	{/if}
</ReportCard>
