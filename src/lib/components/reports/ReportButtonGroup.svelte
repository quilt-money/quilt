<script lang="ts" generics="OptionValue extends string">
	import type { Component } from 'svelte';
	import { Button } from '$lib/components/ui/button/index.js';

	let {
		label,
		options,
		value = $bindable()
	}: {
		label: string;
		options: readonly {
			value: OptionValue;
			label: string;
			icon?: Component<{ class?: string }>;
		}[];
		value: OptionValue;
	} = $props();
</script>

<div class="flex flex-col gap-2 p-4">
	<p class="text-xs font-medium tracking-wide text-muted-foreground uppercase">{label}</p>
	<div class="flex flex-wrap items-center gap-2" role="group" aria-label={label}>
		{#each options as option (option.value)}
			<Button
				type="button"
				variant={value === option.value ? 'default' : 'outline'}
				aria-pressed={value === option.value}
				onclick={() => (value = option.value)}
			>
				{#if option.icon}<option.icon class="size-4" />{/if}
				{option.label}
			</Button>
		{/each}
	</div>
</div>
