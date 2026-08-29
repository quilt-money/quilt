<script lang="ts">
	import FilterIcon from '@lucide/svelte/icons/filter';
	import * as Popover from '$lib/components/ui/popover/index.js';
	import { Checkbox } from '$lib/components/ui/checkbox/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { buttonVariants } from '$lib/components/ui/button/index.js';

	type FilterableColumn = {
		id: string;
		getFilterValue: () => unknown;
		getFacetedUniqueValues: () => Map<unknown, number>;
	};

	let {
		column,
		label,
		onFilterChange
	}: {
		column: FilterableColumn;
		label: string;
		onFilterChange: (values: string[] | undefined) => void;
	} = $props();

	const values = $derived(
		[...column.getFacetedUniqueValues().keys()]
			.filter((v): v is string => typeof v === 'string' && v !== '')
			.sort((a, b) => a.localeCompare(b))
	);

	const selected = $derived((column.getFilterValue() as string[] | undefined) ?? []);

	function toggle(value: string) {
		const next = selected.includes(value)
			? selected.filter((v) => v !== value)
			: [...selected, value];
		onFilterChange(next.length > 0 ? next : undefined);
	}
</script>

<Popover.Root>
	<Popover.Trigger
		class={buttonVariants({
			variant: selected.length > 0 ? 'secondary' : 'ghost',
			size: 'icon-xs'
		})}
		aria-label={`Filter by ${label}`}
	>
		<FilterIcon class="size-3.5" />
	</Popover.Trigger>
	<Popover.Content class="flex w-56 flex-col gap-1.5" align="start">
		{#each values as value (value)}
			<div class="flex items-center gap-2">
				<Checkbox
					id={`filter-${column.id}-${value}`}
					checked={selected.includes(value)}
					onCheckedChange={() => toggle(value)}
				/>
				<Label for={`filter-${column.id}-${value}`} class="font-normal">{value}</Label>
			</div>
		{:else}
			<p class="text-muted-foreground">No values</p>
		{/each}
	</Popover.Content>
</Popover.Root>
