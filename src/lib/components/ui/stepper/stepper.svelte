<script lang="ts" module>
	export type Step = {
		id: string;
		title?: string;
		description?: string;
	};

	type StepState = 'active' | 'completed' | 'inactive';
</script>

<script lang="ts">
	import CheckIcon from '@lucide/svelte/icons/check';
	import { cn } from '$lib/utils.js';
	import type { HTMLAttributes } from 'svelte/elements';

	let {
		steps,
		value = $bindable(steps[0]?.id ?? ''),
		orientation = 'horizontal',
		clickable = true,
		class: className,
		...restProps
	}: Omit<HTMLAttributes<HTMLDivElement>, 'class'> & {
		steps: Step[];
		value?: string;
		orientation?: 'horizontal' | 'vertical';
		clickable?: boolean;
		class?: string;
	} = $props();

	const currentIndex = $derived(steps.findIndex((step) => step.id === value));

	function stateOf(index: number): StepState {
		if (index === currentIndex) return 'active';
		return index < currentIndex ? 'completed' : 'inactive';
	}

	let triggers: HTMLButtonElement[] = $state([]);

	function focusTrigger(index: number) {
		const len = triggers.length;
		triggers[((index % len) + len) % len]?.focus();
	}

	function handleKeydown(e: KeyboardEvent, index: number) {
		switch (e.key) {
			case 'ArrowRight':
			case 'ArrowDown':
				e.preventDefault();
				focusTrigger(index + 1);
				break;
			case 'ArrowLeft':
			case 'ArrowUp':
				e.preventDefault();
				focusTrigger(index - 1);
				break;
			case 'Home':
				e.preventDefault();
				focusTrigger(0);
				break;
			case 'End':
				e.preventDefault();
				focusTrigger(triggers.length - 1);
				break;
		}
	}
</script>

<div
	role="tablist"
	aria-orientation={orientation}
	data-slot="stepper"
	data-orientation={orientation}
	class={cn('flex', orientation === 'horizontal' ? 'w-full items-start' : 'flex-col', className)}
	{...restProps}
>
	{#each steps as step, i (step.id)}
		{@const state = stateOf(i)}
		<div
			data-slot="stepper-item"
			data-state={state}
			class={cn(
				'flex',
				orientation === 'horizontal' ? 'flex-col items-center gap-2' : 'flex-row items-start gap-3'
			)}
		>
			<button
				bind:this={triggers[i]}
				type="button"
				role="tab"
				id="stepper-tab-{step.id}"
				aria-selected={state === 'active'}
				aria-controls="stepper-panel-{step.id}"
				tabindex={state === 'active' ? 0 : -1}
				disabled={!clickable}
				data-slot="stepper-trigger"
				data-state={state}
				onclick={() => (value = step.id)}
				onkeydown={(e) => handleKeydown(e, i)}
				class={cn(
					'flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-medium outline-none transition-colors',
					'bg-muted text-muted-foreground',
					'disabled:pointer-events-none disabled:opacity-60',
					'focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-2',
					(state === 'active' || state === 'completed') && 'bg-primary text-primary-foreground'
				)}
			>
				{#if state === 'completed'}
					<CheckIcon class="size-4" />
				{:else}
					{i + 1}
				{/if}
			</button>

			{#if step.title || step.description}
				<div class={orientation === 'horizontal' ? 'text-center' : 'pt-1'}>
					{#if step.title}
						<div class="text-sm font-medium">{step.title}</div>
					{/if}
					{#if step.description}
						<div class="text-xs text-muted-foreground">{step.description}</div>
					{/if}
				</div>
			{/if}
		</div>

		{#if i < steps.length - 1}
			<div
				data-slot="stepper-separator"
				data-state={state}
				class={cn(
					'rounded-full bg-muted transition-colors',
					state === 'completed' && 'bg-primary',
					orientation === 'horizontal' ? 'mt-4 h-0.5 flex-1' : 'my-1 ml-4 h-6 w-0.5'
				)}
			></div>
		{/if}
	{/each}
</div>
