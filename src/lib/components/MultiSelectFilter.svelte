<script lang="ts">
	import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';
	import * as Popover from '$lib/components/ui/popover/index.js';
	import { Checkbox } from '$lib/components/ui/checkbox/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { buttonVariants } from '$lib/components/ui/button/index.js';

	export type FilterSection = {
		/** Shown above the section's options; omit for a dropdown with a single section. */
		heading?: string;
		options: string[];
		selected: string[];
		onChange: (values: string[]) => void;
	};

	let { label, sections }: { label: string; sections: FilterSection[] } = $props();

	const optionCount = $derived(sections.reduce((sum, section) => sum + section.options.length, 0));
	const selectedCount = $derived(
		sections.reduce((sum, section) => sum + section.selected.length, 0)
	);
	const allSelected = $derived(optionCount > 0 && selectedCount === optionCount);

	function toggle(section: FilterSection, option: string) {
		section.onChange(
			section.selected.includes(option)
				? section.selected.filter((value) => value !== option)
				: [...section.selected, option]
		);
	}
</script>

<Popover.Root>
	<Popover.Trigger
		class={buttonVariants({ variant: allSelected ? 'outline' : 'secondary', size: 'sm' })}
	>
		{label}
		{#if !allSelected}
			<span class="text-xs text-muted-foreground">({selectedCount}/{optionCount})</span>
		{/if}
		<ChevronDownIcon class="size-3.5" />
	</Popover.Trigger>
	<Popover.Content class="flex w-56 flex-col gap-3" align="start">
		{#each sections as section (section.heading ?? label)}
			<div class="flex flex-col gap-1.5">
				{#if section.heading}
					<p class="text-xs font-medium tracking-wide text-muted-foreground uppercase">
						{section.heading}
					</p>
				{/if}
				{#if section.options.length > 0}
					<div class="mb-1 flex items-center justify-between border-b pb-1.5">
						<button
							type="button"
							class="text-xs text-primary hover:underline"
							onclick={() => section.onChange([...section.options])}
						>
							Select all
						</button>
						<button
							type="button"
							class="text-xs text-primary hover:underline"
							onclick={() => section.onChange([])}
						>
							Clear
						</button>
					</div>
				{/if}
				{#each section.options as option (option)}
					{@const checkboxId = `filter-${label}-${section.heading ?? ''}-${option}`}
					<div class="flex items-center gap-2">
						<Checkbox
							id={checkboxId}
							checked={section.selected.includes(option)}
							onCheckedChange={() => toggle(section, option)}
						/>
						<Label for={checkboxId} class="font-normal">{option}</Label>
					</div>
				{:else}
					<p class="text-muted-foreground">No values</p>
				{/each}
			</div>
		{/each}
	</Popover.Content>
</Popover.Root>
