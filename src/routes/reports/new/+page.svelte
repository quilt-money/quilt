<script lang="ts">
	import type { EChartsOption } from 'echarts';
	import { SvelteSet, SvelteMap } from 'svelte/reactivity';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import EChart from '$lib/components/EChart.svelte';
	import MultiSelectFilter from '$lib/components/MultiSelectFilter.svelte';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { formatMoney } from '$lib/format';
	import { CATEGORICAL, SURFACE, TEXT_MUTED, GRID_LINE, formatUsd } from '$lib/chart-theme';

	let { data } = $props();

	type HoldingRow = (typeof data.holdings)[number];

	type Metric = 'value' | 'count';
	type Dimension = 'none' | 'account' | 'sector' | 'region' | 'type' | 'security';
	type ChartType = 'pie' | 'bar' | 'table';
	type FilterField = 'accountName' | 'sector' | 'region' | 'type';

	const METRIC_LABELS: Record<Metric, string> = {
		value: 'Total value',
		count: 'Number of holdings'
	};

	const DIMENSION_LABELS: Record<Dimension, string> = {
		none: 'None (single total)',
		account: 'Account',
		sector: 'Sector',
		region: 'Region',
		type: 'Type',
		security: 'Security'
	};

	const CHART_TYPE_LABELS: Record<ChartType, string> = {
		pie: 'Pie',
		bar: 'Bar',
		table: 'Table'
	};

	const FILTER_LABELS: Record<FilterField, string> = {
		accountName: 'Account',
		sector: 'Sector',
		region: 'Region',
		type: 'Type'
	};

	const FILTER_FIELDS = Object.keys(FILTER_LABELS) as FilterField[];

	let title = $state('Untitled report');
	let metric = $state<Metric>('value');
	let dimension = $state<Dimension>('sector');
	let chartType = $state<ChartType>('pie');
	let filters = $state<Record<FilterField, string[]>>({
		accountName: [],
		sector: [],
		region: [],
		type: []
	});

	function filterOptions(field: FilterField) {
		const values = new SvelteSet<string>();
		for (const holding of data.holdings) {
			const value = holding[field];
			if (value) values.add(value);
		}
		return [...values].sort((a, b) => a.localeCompare(b));
	}

	function groupLabel(holding: HoldingRow): string {
		switch (dimension) {
			case 'none':
				return 'Total';
			case 'account':
				return holding.accountName ?? 'Unclassified';
			case 'sector':
				return holding.sector ?? 'Unclassified';
			case 'region':
				return holding.region ?? 'Unclassified';
			case 'type':
				return holding.type ?? 'Unclassified';
			case 'security':
				return holding.symbol;
		}
	}

	const filteredHoldings = $derived(
		data.holdings.filter((holding) =>
			FILTER_FIELDS.every((field) => {
				const selectedValues = filters[field];
				return selectedValues.length === 0 || selectedValues.includes(holding[field] ?? '');
			})
		)
	);

	type ReportSlice = { label: string; value: number };

	const slices = $derived.by((): ReportSlice[] => {
		const totalByLabel = new SvelteMap<string, number>();
		for (const holding of filteredHoldings) {
			if (metric === 'value' && holding.totalValue == null) continue;
			const label = groupLabel(holding);
			const amount = metric === 'value' ? (holding.totalValue ?? 0) : 1;
			totalByLabel.set(label, (totalByLabel.get(label) ?? 0) + amount);
		}
		return [...totalByLabel.entries()]
			.map(([label, value]) => ({ label, value }))
			.sort((a, b) => b.value - a.value);
	});

	const total = $derived(slices.reduce((sum, slice) => sum + slice.value, 0));

	function formatMetric(value: number): string {
		return metric === 'value' ? formatMoney(value) : value.toLocaleString();
	}

	const seriesName = $derived(METRIC_LABELS[metric]);

	const pieOption = $derived<EChartsOption>({
		backgroundColor: 'transparent',
		tooltip: {
			trigger: 'item',
			valueFormatter: (value) => (metric === 'value' ? formatUsd(value as number) : `${value}`),
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
			valueFormatter: (value) => (metric === 'value' ? formatUsd(value as number) : `${value}`),
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
				formatter: (value: number) => (metric === 'value' ? formatUsd(value) : `${value}`)
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

	const option = $derived(chartType === 'pie' ? pieOption : barOption);

	const selectClass =
		'h-8 rounded-md border border-input bg-transparent px-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30';
</script>

<div class="p-6">
	<PageHeader>
		<h1 class="text-2xl font-semibold">New report</h1>
	</PageHeader>

	<div class="grid gap-6 lg:grid-cols-[320px_1fr]">
		<div class="flex flex-col gap-5 rounded-lg border bg-card p-5">
			<div class="grid gap-2">
				<Label for="report-title">Title</Label>
				<Input id="report-title" bind:value={title} />
			</div>

			<div class="grid gap-2">
				<Label for="report-metric">Metric</Label>
				<select id="report-metric" bind:value={metric} class={selectClass}>
					{#each Object.entries(METRIC_LABELS) as [value, label] (value)}
						<option {value}>{label}</option>
					{/each}
				</select>
			</div>

			<div class="grid gap-2">
				<Label for="report-dimension">Group by</Label>
				<select id="report-dimension" bind:value={dimension} class={selectClass}>
					{#each Object.entries(DIMENSION_LABELS) as [value, label] (value)}
						<option {value}>{label}</option>
					{/each}
				</select>
			</div>

			<div class="grid gap-2">
				<Label for="report-chart-type">Chart type</Label>
				<select id="report-chart-type" bind:value={chartType} class={selectClass}>
					{#each Object.entries(CHART_TYPE_LABELS) as [value, label] (value)}
						<option {value}>{label}</option>
					{/each}
				</select>
			</div>

			<div class="grid gap-2">
				<Label>Filters</Label>
				<div class="flex flex-wrap gap-2">
					{#each FILTER_FIELDS as field (field)}
						<MultiSelectFilter
							label={FILTER_LABELS[field]}
							options={filterOptions(field)}
							selected={filters[field]}
							onChange={(values) => (filters = { ...filters, [field]: values })}
						/>
					{/each}
				</div>
			</div>
		</div>

		<div class="rounded-lg border bg-card p-6">
			<div class="flex items-center justify-between">
				<div>
					<p class="text-sm text-muted-foreground">{title}</p>
					<p class="mt-1 text-2xl font-semibold">{formatMetric(total)}</p>
				</div>
				<p class="text-sm text-muted-foreground">
					{filteredHoldings.length} of {data.holdings.length} holdings
				</p>
			</div>

			{#if slices.length === 0}
				<p class="py-8 text-center text-sm text-muted-foreground">
					No holdings match these filters.
				</p>
			{:else if chartType === 'table'}
				<div class="mt-6 overflow-hidden rounded-md border">
					<table class="w-full text-sm">
						<thead class="bg-muted/50 text-left text-muted-foreground">
							<tr>
								<th class="px-3 py-2 font-medium">{DIMENSION_LABELS[dimension]}</th>
								<th class="px-3 py-2 font-medium">{METRIC_LABELS[metric]}</th>
							</tr>
						</thead>
						<tbody>
							{#each slices as slice (slice.label)}
								<tr class="border-t">
									<td class="px-3 py-2">{slice.label}</td>
									<td class="px-3 py-2">{formatMetric(slice.value)}</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			{:else}
				<div class="mt-6">
					<EChart {option} height="320px" />
				</div>
			{/if}
		</div>
	</div>
</div>
