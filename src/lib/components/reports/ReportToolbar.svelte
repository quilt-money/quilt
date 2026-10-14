<script lang="ts">
	import ChartColumnIcon from '@lucide/svelte/icons/chart-column';
	import ChartPieIcon from '@lucide/svelte/icons/chart-pie';
	import TableIcon from '@lucide/svelte/icons/table';
	import type { HoldingWithTags } from '$lib/server/db/queries/holdings';
	import { CHART_TYPE_LABELS, type ChartType, type ReportFilters } from '$lib/report-builder';
	import SectionatedHeader from '$lib/components/SectionatedHeader.svelte';
	import ReportButtonGroup from './ReportButtonGroup.svelte';
	import ReportFilterBar from './ReportFilterBar.svelte';
	import ReportFilterSummary from './ReportFilterSummary.svelte';

	let {
		holdings,
		chartType = $bindable(),
		filters = $bindable()
	}: { holdings: HoldingWithTags[]; chartType: ChartType; filters: ReportFilters } = $props();

	const chartTypeOptions = [
		{ value: 'pie', label: CHART_TYPE_LABELS.pie, icon: ChartPieIcon },
		{ value: 'bar', label: CHART_TYPE_LABELS.bar, icon: ChartColumnIcon },
		{ value: 'table', label: CHART_TYPE_LABELS.table, icon: TableIcon }
	] as const;
</script>

<SectionatedHeader>
	<ReportButtonGroup label="Chart type" options={chartTypeOptions} bind:value={chartType} />
	<ReportFilterBar {holdings} bind:filters />
	<ReportFilterSummary {holdings} {filters} />
</SectionatedHeader>
