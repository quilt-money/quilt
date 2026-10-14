<script lang="ts">
	import ChartAreaIcon from '@lucide/svelte/icons/chart-area';
	import ChartLineIcon from '@lucide/svelte/icons/chart-line';
	import ChartSplineIcon from '@lucide/svelte/icons/chart-spline';
	import SectionatedHeader from '$lib/components/SectionatedHeader.svelte';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import type { HoldingWithTags } from '$lib/server/db/queries/holdings';
	import {
		TIME_CHART_TYPE_LABELS,
		TIME_INTERVAL_LABELS,
		type TimeInterval,
		type ReportFilters,
		type TimeChartType
	} from '$lib/report-builder';
	import ReportButtonGroup from './ReportButtonGroup.svelte';
	import ReportFilterBar from './ReportFilterBar.svelte';

	let {
		holdings,
		chartType = $bindable(),
		interval = $bindable(),
		startDate = $bindable(),
		endDate = $bindable(),
		filters = $bindable()
	}: {
		holdings: HoldingWithTags[];
		chartType: TimeChartType;
		interval: TimeInterval;
		startDate: string;
		endDate: string;
		filters: ReportFilters;
	} = $props();

	const chartTypeOptions = [
		{ value: 'area', label: TIME_CHART_TYPE_LABELS.area, icon: ChartAreaIcon },
		{ value: 'smooth', label: TIME_CHART_TYPE_LABELS.smooth, icon: ChartSplineIcon },
		{ value: 'line', label: TIME_CHART_TYPE_LABELS.line, icon: ChartLineIcon }
	] as const;

	const intervalOptions = (Object.keys(TIME_INTERVAL_LABELS) as TimeInterval[]).map((interval) => ({
		value: interval,
		label: TIME_INTERVAL_LABELS[interval]
	}));
</script>

<SectionatedHeader>
	<ReportButtonGroup label="Chart type" options={chartTypeOptions} bind:value={chartType} />
	<ReportButtonGroup label="X-axis step" options={intervalOptions} bind:value={interval} />
	<ReportFilterBar {holdings} bind:filters>
		<div class="flex items-center gap-2">
			<Label for="report-start-date" class="font-normal text-muted-foreground">From</Label>
			<Input id="report-start-date" type="date" class="h-8 w-36" bind:value={startDate} />
			<Label for="report-end-date" class="font-normal text-muted-foreground">To</Label>
			<Input id="report-end-date" type="date" class="h-8 w-36" bind:value={endDate} />
		</div>
	</ReportFilterBar>
</SectionatedHeader>
