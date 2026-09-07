<script lang="ts">
	import type { EChartsOption, ECElementEvent } from 'echarts';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { SvelteURLSearchParams } from 'svelte/reactivity';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import EChart from '$lib/components/EChart.svelte';

	let { data } = $props();

	function handleItemClick(params: ECElementEvent) {
		if (typeof params.dataIndex !== 'number') return;
		const filters = data.valueBySector[params.dataIndex]?.filters ?? [];
		const search = new SvelteURLSearchParams();
		for (const f of filters) search.set(f.column, f.value);
		search.set('fromDashboard', 'true');
		goto(resolve(`/portfolio?${search.toString()}`));
	}

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
