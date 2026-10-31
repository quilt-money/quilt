<script lang="ts">
	import type { EChartsOption } from 'echarts';
	import EChart from '$lib/components/EChart.svelte';
	import type { PricePoint } from '$lib/server/db/queries/price-history';
	import { CATEGORICAL, TEXT_MUTED, GRID_LINE } from '$lib/chart-theme';
	import { formatMoney, formatPercent, gainLossClass } from '$lib/format';

	const dateFormatter = new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' });

	let { priceHistory }: { priceHistory: PricePoint[] } = $props();

	const percentChange = $derived.by(() => {
		const firstPrice = priceHistory[0]?.price;
		const lastPrice = priceHistory.at(-1)?.price;
		if (!firstPrice || lastPrice === undefined) return null;
		return ((lastPrice - firstPrice) / firstPrice) * 100;
	});

	function formatSignedPercent(value: number): string {
		return `${value > 0 ? '+' : ''}${formatPercent(value)}`;
	}

	const option = $derived<EChartsOption>({
		backgroundColor: 'transparent',
		tooltip: {
			trigger: 'axis',
			formatter: (params) => {
				const [point] = [params].flat() as unknown as {
					axisValue: number;
					marker: string;
					value: unknown[];
				}[];
				const date = dateFormatter.format(new Date(point.axisValue));
				return `${date}<br/>${point.marker} Price: <b>${formatMoney(point.value[1] as number)}</b>`;
			},
			textStyle: { fontSize: 13 }
		},
		grid: { left: 64, right: 16, top: 24, bottom: 32 },
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
				formatter: (value: number) => formatMoney(value)
			},
			splitLine: { lineStyle: { color: GRID_LINE } }
		},
		series: [
			{
				name: 'Price',
				type: 'line',
				showSymbol: priceHistory.length <= 30,
				data: priceHistory.map((point) => [point.time, point.price]),
				itemStyle: { color: CATEGORICAL[0] },
				lineStyle: { color: CATEGORICAL[0] }
			}
		]
	});
</script>

{#if priceHistory.length === 0}
	<p class="py-8 text-center text-sm text-muted-foreground">
		No price history yet. Sync to add one.
	</p>
{:else}
	{#if percentChange !== null}
		<p class="mb-2 text-sm text-muted-foreground">
			Change over period:
			<span class="font-medium {gainLossClass(percentChange)}">
				{formatSignedPercent(percentChange)}
			</span>
		</p>
	{/if}
	<div class="min-w-0 overflow-hidden">
		<EChart {option} height="280px" />
	</div>
{/if}
