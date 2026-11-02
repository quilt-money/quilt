<script lang="ts">
	import CalendarIcon from '@lucide/svelte/icons/calendar';
	import { DateFormatter, getLocalTimeZone, parseDate } from '@internationalized/date';
	import * as Popover from '$lib/components/ui/popover/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { RangeCalendar } from '$lib/components/ui/range-calendar/index.js';
	import type { DateRange } from 'bits-ui';

	const dateFormatter = new DateFormatter('en-US', { dateStyle: 'medium' });

	/** Inclusive YYYY-MM-DD bounds; an empty string leaves that side open. */
	let {
		startDate = $bindable(''),
		endDate = $bindable(''),
		id = 'date-range-picker'
	}: { startDate?: string; endDate?: string; id?: string } = $props();

	const range = $derived<DateRange>({
		start: startDate ? parseDate(startDate) : undefined,
		end: endDate ? parseDate(endDate) : undefined
	});

	function setRange(next: DateRange | undefined) {
		startDate = next?.start?.toString() ?? '';
		endDate = next?.end?.toString() ?? '';
	}

	function formatDate(isoDate: string): string {
		return dateFormatter.format(parseDate(isoDate).toDate(getLocalTimeZone()));
	}
</script>

<div class="flex items-center gap-2">
	<Popover.Root>
		<Popover.Trigger {id}>
			{#snippet child({ props })}
				<Button {...props} variant="outline" class="justify-start px-2.5 font-normal">
					<CalendarIcon data-icon="inline-start" />
					{#if startDate && endDate}
						{formatDate(startDate)} - {formatDate(endDate)}
					{:else if startDate}
						{formatDate(startDate)}
					{:else if endDate}
						Up to {formatDate(endDate)}
					{:else}
						<span>All dates</span>
					{/if}
				</Button>
			{/snippet}
		</Popover.Trigger>
		<Popover.Content class="w-auto p-0" align="start">
			<RangeCalendar bind:value={() => range, setRange} numberOfMonths={2} />
		</Popover.Content>
	</Popover.Root>
	{#if startDate || endDate}
		<Button variant="ghost" onclick={() => setRange(undefined)}>Clear</Button>
	{/if}
</div>
