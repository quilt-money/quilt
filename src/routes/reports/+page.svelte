<script lang="ts">
	import type { EChartsOption, ECElementEvent } from 'echarts';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { SvelteURLSearchParams } from 'svelte/reactivity';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import EChart from '$lib/components/EChart.svelte';
	import type { AllocationDimension } from '$lib/server/db/queries/report';

	let { data } = $props();

	const DIMENSION_LABELS: Record<AllocationDimension, string> = {
		sector: 'Sector',
		region: 'Region',
		account: 'Account',
		type: 'Type'
	};

	// Portfolio table filter column each dimension corresponds to (see SecurityDetailTable).
	const PORTFOLIO_FILTER_COLUMN: Record<AllocationDimension, string> = {
		sector: 'sector',
		region: 'region',
		account: 'accountName',
		type: 'type'
	};

	function onDimensionChange(event: Event) {
		const dimension = (event.currentTarget as HTMLSelectElement).value;
		goto(resolve(`/reports?dimension=${dimension}`));
	}

	function handleSliceClick(params: ECElementEvent) {
		if (typeof params.dataIndex !== 'number') return;
		const slice = data.slices[params.dataIndex];
		if (!slice) return;

		const search = new SvelteURLSearchParams();
		// "Unclassified" means the underlying column is null, which the portfolio
		// table's column filter can't match against the literal string — so leave
		// the portfolio view unfiltered for that slice, same as the dashboard pie.
		if (slice.label !== 'Unclassified') {
			search.set(PORTFOLIO_FILTER_COLUMN[data.dimension], slice.label);
		}
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
	const TEXT_MUTED = '#52514e';

	const formatUsd = (value: number) =>
		value.toLocaleString(undefined, {
			style: 'currency',
			currency: 'USD',
			minimumFractionDigits: 0,
			maximumFractionDigits: 0
		});

	const totalValue = $derived(data.slices.reduce((sum, slice) => sum + slice.value, 0));

	const option = $derived<EChartsOption>({
		backgroundColor: 'transparent',
		tooltip: {
			trigger: 'item',
			valueFormatter: (value) => formatUsd(value as number),
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
				name: `Value by ${DIMENSION_LABELS[data.dimension].toLowerCase()}`,
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
				data: data.slices.map((slice, i) => ({
					name: slice.label,
					value: slice.value,
					itemStyle: { color: CATEGORICAL[i % CATEGORICAL.length] }
				}))
			}
		]
	});

	const selectClass =
		'h-8 rounded-md border border-input bg-transparent px-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30';
</script>

<div class="p-6">
	<PageHeader>
		<h1 class="text-2xl font-semibold">Reports</h1>
	</PageHeader>

	<div class="max-w-2xl rounded-lg border bg-card p-6">
		<div class="flex items-center justify-between">
			<div>
				<p class="text-sm text-muted-foreground">Portfolio allocation</p>
				<p class="mt-1 text-2xl font-semibold">{formatUsd(totalValue)}</p>
			</div>
			<label class="flex items-center gap-1.5 text-sm">
				Group by
				<select value={data.dimension} onchange={onDimensionChange} class={selectClass}>
					{#each Object.entries(DIMENSION_LABELS) as [dimension, label] (dimension)}
						<option value={dimension}>{label}</option>
					{/each}
				</select>
			</label>
		</div>

		{#if data.slices.length > 0}
			<div class="mt-6">
				<EChart {option} height="320px" onItemClick={handleSliceClick} />
			</div>
		{:else}
			<p class="py-8 text-center text-sm text-muted-foreground">No holdings yet.</p>
		{/if}
	</div>
</div>
