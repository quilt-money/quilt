<script lang="ts">
	import type { HoldingWithTags } from '$lib/server/db/queries/holdings';
	import type { ChartType, ReportFilters } from '$lib/report-builder';
	import ReportChartTypeButtons from './ReportChartTypeButtons.svelte';
	import ReportFilterBar from './ReportFilterBar.svelte';
	import ReportFilterSummary from './ReportFilterSummary.svelte';

	let {
		holdings,
		chartType = $bindable(),
		filters = $bindable()
	}: { holdings: HoldingWithTags[]; chartType: ChartType; filters: ReportFilters } = $props();
</script>

<div
	class="mb-6 flex flex-col items-stretch rounded-lg border bg-card xl:flex-row xl:divide-x [&>*:not(:first-child)]:border-t xl:[&>*:not(:first-child)]:border-t-0"
>
	<ReportChartTypeButtons bind:chartType />
	<ReportFilterBar {holdings} bind:filters />
	<ReportFilterSummary {holdings} {filters} />
</div>
