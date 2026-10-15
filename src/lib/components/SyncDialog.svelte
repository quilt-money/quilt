<script lang="ts" module>
	export type SyncTarget = { id: string; symbol: string; fullName: string | null };
</script>

<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { untrack } from 'svelte';
	import { resolve } from '$app/paths';
	import { formatMoney } from '$lib/format';
	import CheckIcon from '@lucide/svelte/icons/check';
	import XIcon from '@lucide/svelte/icons/x';
	import LoaderIcon from '@lucide/svelte/icons/loader-circle';

	type SyncOutcome =
		| { status: 'pending' }
		| { status: 'syncing' }
		| { status: 'success'; price: number | null }
		| { status: 'failed'; error: string };

	let {
		open = $bindable(false),
		securities,
		onClose
	}: {
		open: boolean;
		securities: SyncTarget[];
		onClose: () => void;
	} = $props();

	let page = $state<'progress' | 'summary'>('progress');
	let running = $state(false);
	let outcomeBySecurityId = $state<Record<string, SyncOutcome>>({});

	let allFinished = $derived(
		securities.length > 0 &&
			securities.every((security) => {
				const status = outcomeBySecurityId[security.id]?.status;
				return status === 'success' || status === 'failed';
			})
	);

	async function syncAll(targets: SyncTarget[]) {
		running = true;
		page = 'progress';
		outcomeBySecurityId = Object.fromEntries(
			targets.map((security) => [security.id, { status: 'pending' }])
		);
		const snapshotTime = new Date().toISOString();

		for (const security of targets) {
			outcomeBySecurityId[security.id] = { status: 'syncing' };
			try {
				const response = await fetch(resolve('/securities/sync'), {
					method: 'POST',
					headers: { 'content-type': 'application/json' },
					body: JSON.stringify({ securityId: security.id, snapshotTime })
				});
				if (!response.ok) throw new Error(`Request failed (${response.status})`);
				outcomeBySecurityId[security.id] = await response.json();
			} catch (error) {
				outcomeBySecurityId[security.id] = {
					status: 'failed',
					error: error instanceof Error ? error.message : 'Sync failed'
				};
			}
		}
		running = false;
	}

	$effect(() => {
		if (open) untrack(() => syncAll(securities));
	});

	function handleOpenChange(nextOpen: boolean) {
		if (!nextOpen && running) return;
		open = nextOpen;
		if (!nextOpen) onClose();
	}
</script>

<Dialog.Root {open} onOpenChange={handleOpenChange}>
	<Dialog.Content showCloseButton={!running} class="sm:max-w-lg">
		{#if page === 'progress'}
			<Dialog.Header>
				<Dialog.Title>Syncing {securities.length} securities</Dialog.Title>
				<Dialog.Description
					>This window can be closed once every sync has finished.</Dialog.Description
				>
			</Dialog.Header>

			<ul class="max-h-80 divide-y overflow-y-auto">
				{#each securities as security (security.id)}
					{@const outcome = outcomeBySecurityId[security.id]}
					<li class="flex items-center justify-between gap-3 py-2">
						<span class="truncate">
							<span class="font-medium">{security.symbol}</span>
							{#if security.fullName}
								<span class="text-muted-foreground"> · {security.fullName}</span>
							{/if}
						</span>
						{#if outcome?.status === 'syncing'}
							<LoaderIcon class="size-4 shrink-0 animate-spin text-muted-foreground" />
						{:else if outcome?.status === 'success'}
							<CheckIcon class="size-4 shrink-0 text-green-600" />
						{:else if outcome?.status === 'failed'}
							<XIcon class="size-4 shrink-0 text-red-600" />
						{/if}
					</li>
				{/each}
			</ul>

			<Dialog.Footer>
				<Button disabled={!allFinished} onclick={() => (page = 'summary')}>Go to summary</Button>
			</Dialog.Footer>
		{:else}
			<Dialog.Header>
				<Dialog.Title>Sync summary</Dialog.Title>
				<Dialog.Description>
					{securities.filter((security) => outcomeBySecurityId[security.id]?.status === 'success')
						.length} of {securities.length} securities synced.
				</Dialog.Description>
			</Dialog.Header>

			<ul class="max-h-80 divide-y overflow-y-auto">
				{#each securities as security (security.id)}
					{@const outcome = outcomeBySecurityId[security.id]}
					<li
						class="flex items-center justify-between gap-3 py-2 {outcome?.status === 'failed'
							? 'bg-red-500/10 px-2'
							: ''}"
					>
						<span class="truncate">
							<span class="font-medium">{security.symbol}</span>
							{#if security.fullName}
								<span class="text-muted-foreground"> · {security.fullName}</span>
							{/if}
						</span>
						{#if outcome?.status === 'success'}
							<span class="flex shrink-0 items-center gap-2">
								<CheckIcon class="size-4 text-green-600" />
								{formatMoney(outcome.price)}
							</span>
						{:else if outcome?.status === 'failed'}
							<span class="flex shrink-0 items-center gap-2 text-red-600">
								<XIcon class="size-4" />
								{outcome.error}
							</span>
						{/if}
					</li>
				{/each}
			</ul>

			<Dialog.Footer>
				<Button onclick={() => handleOpenChange(false)}>Close</Button>
			</Dialog.Footer>
		{/if}
	</Dialog.Content>
</Dialog.Root>
