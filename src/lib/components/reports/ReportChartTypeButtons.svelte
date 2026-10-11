<script lang="ts">
	import ChartColumnIcon from '@lucide/svelte/icons/chart-column';
	import ChartPieIcon from '@lucide/svelte/icons/chart-pie';
	import TableIcon from '@lucide/svelte/icons/table';
	import type { Component } from 'svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import { CHART_TYPE_LABELS, type ChartType } from '$lib/report-builder';

	let { chartType = $bindable() }: { chartType: ChartType } = $props();

	const CHART_TYPE_ICONS: Record<ChartType, Component> = {
		pie: ChartPieIcon,
		bar: ChartColumnIcon,
		table: TableIcon
	};
</script>

<div class="flex flex-col gap-2 p-4">
	<p class="text-xs font-medium tracking-wide text-muted-foreground uppercase">Chart type</p>
	<div class="flex items-center gap-2" role="group" aria-label="Chart type">
		{#each Object.entries(CHART_TYPE_LABELS) as [value, label] (value)}
			{@const ChartTypeIcon = CHART_TYPE_ICONS[value as ChartType]}
			<Button
				type="button"
				variant={chartType === value ? 'default' : 'outline'}
				aria-pressed={chartType === value}
				onclick={() => (chartType = value as ChartType)}
			>
				<ChartTypeIcon class="size-4" />
				{label}
			</Button>
		{/each}
	</div>
</div>
