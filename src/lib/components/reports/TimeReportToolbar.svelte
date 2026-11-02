<script lang="ts">
	import SectionatedHeader from '$lib/components/SectionatedHeader.svelte';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
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
		<div class="flex flex-wrap items-center gap-2">
			<Label for="report-start-date" class="font-normal text-muted-foreground">From</Label>
			<Input id="report-start-date" type="date" class="h-8 w-36" bind:value={startDate} />
			<Label for="report-end-date" class="font-normal text-muted-foreground">To</Label>
			<Input id="report-end-date" type="date" class="h-8 w-36" bind:value={endDate} />
		</div>
	</div>
	<ReportButtonGroup label="Interval" options={intervalOptions} bind:value={interval} />
</SectionatedHeader>
