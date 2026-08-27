<script lang="ts">
	import type { EChartsOption, ECElementEvent } from 'echarts';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import EChart from '$lib/components/EChart.svelte';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import * as Table from '$lib/components/ui/table/index.js';

	let { data } = $props();

	let selectedCategory = $state<string | null>(null);
	const selectedSecurities = $derived(
		selectedCategory ? (data.categorySecurities[selectedCategory] ?? []) : []
	);

	function handleItemClick(params: ECElementEvent) {
		if (typeof params.seriesName === 'string') selectedCategory = params.seriesName;
	}

	// Validated 8-hue categorical order — see dataviz skill references/palette.md.
	// Fixed order is the CVD-safety mechanism; never reorder or cycle it.
	const CATEGORICAL = [
		'#2a78d6', // blue
		'#eb6834', // orange
		'#1baf7a', // aqua
		'#eda100', // yellow
		'#e87ba4', // magenta
		'#008300', // green
		'#4a3aa7', // violet
		'#e34948' // red
	];

	const SURFACE = '#fcfcfb';

	const formatUsd = (v: number) =>
		v.toLocaleString(undefined, {
			style: 'currency',
			currency: 'USD',
			minimumFractionDigits: 0,
			maximumFractionDigits: 0
		});

	const total = $derived(data.totalValue);

	const option = $derived<EChartsOption>({
		backgroundColor: 'transparent',
		grid: { left: 8, right: 8, top: 8, bottom: 8, containLabel: false },
		xAxis: { type: 'value', show: false },
		yAxis: { type: 'category', data: [''], show: false },
		tooltip: {
			trigger: 'item',
			valueFormatter: (v) => formatUsd(v as number),
			textStyle: { fontSize: 13 }
		},
		legend: {
			bottom: 0,
			icon: 'circle',
			itemWidth: 8,
			itemHeight: 8,
			textStyle: { color: '#52514e', fontSize: 12 }
		},
		series: data.valueBySector.map((slice, i) => {
			const isFirst = i === 0;
			const isLast = i === data.valueBySector.length - 1;
			const pct = total > 0 ? slice.value / total : 0;
			return {
				name: slice.name,
				type: 'bar',
				stack: 'total',
				barWidth: 24,
				data: [slice.value],
				itemStyle: {
					color: CATEGORICAL[i % CATEGORICAL.length],
					borderColor: SURFACE,
					borderWidth: 2,
					borderRadius: isFirst ? [4, 0, 0, 4] : isLast ? [0, 4, 4, 0] : 0
				},
				label: {
					show: pct >= 0.06,
					position: 'inside',
					color: '#fff',
					fontSize: 12,
					formatter: () => `${(pct * 100).toFixed(0)}%`
				}
			};
		})
	});
</script>

<div class="p-6">
	<PageHeader>
		<h1 class="text-2xl font-semibold">Dashboard</h1>
	</PageHeader>

	<div class="mt-6 max-w-2xl rounded-lg border bg-card p-6">
		<p class="text-sm text-muted-foreground">Total portfolio value</p>
		<p class="mt-1 text-5xl font-semibold">{formatUsd(total)}</p>

		<p class="mt-8 mb-2 text-sm text-muted-foreground">Value by sector</p>
		{#if data.valueBySector.length > 0}
			<EChart {option} height="120px" onItemClick={handleItemClick} />
		{:else}
			<p class="py-8 text-center text-sm text-muted-foreground">No holdings yet.</p>
		{/if}
	</div>
</div>

<Dialog.Root
	open={selectedCategory !== null}
	onOpenChange={(open) => !open && (selectedCategory = null)}
>
	<Dialog.Portal>
		<Dialog.Overlay />
		<Dialog.Content>
			<Dialog.Header>
				<Dialog.Title>{selectedCategory}</Dialog.Title>
			</Dialog.Header>

			<Table.Root>
				<Table.Header>
					<Table.Row>
						<Table.Head>Symbol</Table.Head>
						<Table.Head>Name</Table.Head>
						<Table.Head class="text-right">Value</Table.Head>
					</Table.Row>
				</Table.Header>
				<Table.Body>
					{#each selectedSecurities as s (s.symbol)}
						<Table.Row>
							<Table.Cell class="font-mono">{s.symbol}</Table.Cell>
							<Table.Cell>{s.fullName ?? '—'}</Table.Cell>
							<Table.Cell class="text-right">{formatUsd(s.value)}</Table.Cell>
						</Table.Row>
					{/each}
				</Table.Body>
			</Table.Root>
		</Dialog.Content>
	</Dialog.Portal>
</Dialog.Root>
