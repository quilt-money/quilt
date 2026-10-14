<script lang="ts">
	import type { HoldingWithTags } from '$lib/server/db/queries/holdings';
	import type { ChartType, ReportFilters } from '$lib/report-builder';
	import SectionatedHeader from '$lib/components/SectionatedHeader.svelte';
	import ReportChartTypeButtons from './ReportChartTypeButtons.svelte';
	import ReportFilterBar from './ReportFilterBar.svelte';
	import ReportFilterSummary from './ReportFilterSummary.svelte';

	let {
		holdings,
		chartType = $bindable(),
		filters = $bindable()
	}: { holdings: HoldingWithTags[]; chartType: ChartType; filters: ReportFilters } = $props();
</script>

<SectionatedHeader>
	<ReportChartTypeButtons bind:chartType />
	<ReportFilterBar {holdings} bind:filters />
	<ReportFilterSummary {holdings} {filters} />
</SectionatedHeader>
