<script lang="ts">
	import SectionatedHeader from '$lib/components/SectionatedHeader.svelte';
	import DateRangePicker from '$lib/components/ui/date-range-picker/date-range-picker.svelte';
	import type { HoldingWithTags } from '$lib/server/db/queries/holdings';
	import { TIME_INTERVAL_LABELS, type TimeInterval, type ReportFilters } from '$lib/report-builder';
	import ReportButtonGroup from './ReportButtonGroup.svelte';
	import ReportFilterBar from './ReportFilterBar.svelte';

	let {
		holdings,
		interval = $bindable(),
		startDate = $bindable(),
		endDate = $bindable(),
		filters = $bindable()
	}: {
		holdings: HoldingWithTags[];
		interval: TimeInterval;
		startDate: string;
		endDate: string;
		filters: ReportFilters;
	} = $props();

	const intervalOptions = (Object.keys(TIME_INTERVAL_LABELS) as TimeInterval[]).map((interval) => ({
		value: interval,
		label: TIME_INTERVAL_LABELS[interval]
	}));
</script>

<SectionatedHeader>
	<ReportFilterBar {holdings} bind:filters />
	<div class="flex flex-col gap-2 p-4">
		<p class="text-xs font-medium tracking-wide text-muted-foreground uppercase">Date range</p>
		<DateRangePicker bind:startDate bind:endDate />
	</div>
	<ReportButtonGroup label="Interval" options={intervalOptions} bind:value={interval} />
</SectionatedHeader>
