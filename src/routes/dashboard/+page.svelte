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
		if (typeof params.name === 'string') selectedCategory = params.name;
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
		series: [
			{
				name: 'Value by sector',
				type: 'pie',
				radius: '70%',
				center: ['50%', '46%'],
				avoidLabelOverlap: true,
				itemStyle: {
					borderColor: SURFACE,
					borderWidth: 2
				},
				label: {
					show: true,
					color: '#52514e',
					fontSize: 12,
					formatter: (params) => `${(params.percent ?? 0).toFixed(0)}%`
				},
				labelLine: { show: true },
				data: data.valueBySector.map((slice, i) => ({
					name: slice.name,
					value: slice.value,
					itemStyle: { color: CATEGORICAL[i % CATEGORICAL.length] }
				}))
			}
		]
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
			<EChart {option} height="320px" onItemClick={handleItemClick} />
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
