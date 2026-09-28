<script lang="ts">
	import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';
	import * as Popover from '$lib/components/ui/popover/index.js';
	import { Checkbox } from '$lib/components/ui/checkbox/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { buttonVariants } from '$lib/components/ui/button/index.js';

	let {
		label,
		options,
		selected,
		onChange
	}: {
		label: string;
		options: string[];
		selected: string[];
		onChange: (values: string[]) => void;
	} = $props();

	const allSelected = $derived(options.length > 0 && selected.length === options.length);

	function toggle(option: string) {
		const next = selected.includes(option)
			? selected.filter((value) => value !== option)
			: [...selected, option];
		onChange(next);
	}
</script>

<Popover.Root>
	<Popover.Trigger
		class={buttonVariants({ variant: allSelected ? 'outline' : 'secondary', size: 'sm' })}
	>
		{label}
		{#if !allSelected}
			<span class="text-xs text-muted-foreground">({selected.length}/{options.length})</span>
		{/if}
		<ChevronDownIcon class="size-3.5" />
	</Popover.Trigger>
	<Popover.Content class="flex w-56 flex-col gap-1.5" align="start">
		{#if options.length > 0}
			<div class="mb-1 flex items-center justify-between border-b pb-1.5">
				<button
					type="button"
					class="text-xs text-primary hover:underline"
					onclick={() => onChange([...options])}
				>
					Select all
				</button>
				<button
					type="button"
					class="text-xs text-primary hover:underline"
					onclick={() => onChange([])}
				>
					Clear
				</button>
			</div>
		{/if}
		{#each options as option (option)}
			<div class="flex items-center gap-2">
				<Checkbox
					id={`filter-${label}-${option}`}
					checked={selected.includes(option)}
					onCheckedChange={() => toggle(option)}
				/>
				<Label for={`filter-${label}-${option}`} class="font-normal">{option}</Label>
			</div>
		{:else}
			<p class="text-muted-foreground">No values</p>
		{/each}
	</Popover.Content>
</Popover.Root>
