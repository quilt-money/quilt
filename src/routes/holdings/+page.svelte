<script lang="ts">
	import * as Table from '$lib/components/ui/table/index.js';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
	import * as Tooltip from '$lib/components/ui/tooltip/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { enhance } from '$app/forms';
	import EllipsisVertical from '@lucide/svelte/icons/ellipsis-vertical';
	import PageHeader from '$lib/components/PageHeader.svelte';

	let { data } = $props();

	let open = $state(false);
	let accountId = $state('');
	let securityId = $state('');
	let shares = $state('');
	let basis = $state('');

	let pendingDelete = $state<{ id: string; label: string } | null>(null);

	$effect(() => {
		if (data.accounts.length && !accountId) accountId = data.accounts[0].id;
	});
</script>

<div class="p-6">
	<PageHeader>
		{#snippet actions()}
			{#if data.securities.length === 0}
				<Tooltip.Root>
					<Tooltip.Trigger>
						{#snippet child({ props })}
							<span {...props}>
								<Button disabled>Create holding</Button>
							</span>
						{/snippet}
					</Tooltip.Trigger>
					<Tooltip.Content>You need securities before creating holdings</Tooltip.Content>
				</Tooltip.Root>
			{:else}
				<Button onclick={() => (open = true)}>Create holding</Button>
			{/if}
		{/snippet}
		<h1 class="text-2xl font-semibold">Holdings</h1>
	</PageHeader>

	<Table.Root>
		<Table.Header>
			<Table.Row>
				<Table.Head>Account</Table.Head>
				<Table.Head>Symbol</Table.Head>
				<Table.Head class="text-right">Shares</Table.Head>
				<Table.Head class="text-right">Basis</Table.Head>
				<Table.Head class="w-10"></Table.Head>
			</Table.Row>
		</Table.Header>
		<Table.Body>
			{#each data.holdings as h (h.id)}
				<Table.Row>
					<Table.Cell>{h.accountName}</Table.Cell>
					<Table.Cell class="font-mono">{h.securitySymbol}</Table.Cell>
					<Table.Cell class="text-right">{h.shares}</Table.Cell>
					<Table.Cell class="text-right">{h.basis}</Table.Cell>
					<Table.Cell class="text-right">
						<DropdownMenu.Root>
							<DropdownMenu.Trigger>
								{#snippet child({ props })}
									<Button {...props} variant="ghost" size="icon" class="h-8 w-8">
										<EllipsisVertical class="h-4 w-4" />
									</Button>
								{/snippet}
							</DropdownMenu.Trigger>
							<DropdownMenu.Content align="end">
								<DropdownMenu.Item
									class="text-destructive"
									onclick={() =>
										(pendingDelete = { id: h.id, label: `${h.accountName} / ${h.securitySymbol}` })}
								>
									Delete holding
								</DropdownMenu.Item>
							</DropdownMenu.Content>
						</DropdownMenu.Root>
					</Table.Cell>
				</Table.Row>
			{/each}
		</Table.Body>
	</Table.Root>
</div>

<!-- Delete confirmation -->
<Dialog.Root
	open={!!pendingDelete}
	onOpenChange={(v) => {
		if (!v) pendingDelete = null;
	}}
>
	<Dialog.Portal>
		<Dialog.Overlay />
		<Dialog.Content>
			<Dialog.Header>
				<Dialog.Title>Delete holding</Dialog.Title>
				<Dialog.Description>
					Are you sure you want to delete <strong>{pendingDelete?.label}</strong>? This cannot be
					undone.
				</Dialog.Description>
			</Dialog.Header>
			<form
				method="POST"
				action="?/delete"
				use:enhance={() => {
					return ({ update }) => {
						pendingDelete = null;
						update();
					};
				}}
			>
				<input type="hidden" name="id" value={pendingDelete?.id} />
				<Dialog.Footer>
					<Button type="button" variant="outline" onclick={() => (pendingDelete = null)}
						>Cancel</Button
					>
					<Button type="submit" variant="destructive">Delete</Button>
				</Dialog.Footer>
			</form>
		</Dialog.Content>
	</Dialog.Portal>
</Dialog.Root>

<!-- Create holding -->
<Dialog.Root bind:open>
	<Dialog.Portal>
		<Dialog.Overlay />
		<Dialog.Content>
			<Dialog.Header>
				<Dialog.Title>Create holding</Dialog.Title>
			</Dialog.Header>

			<form
				method="POST"
				action="?/create"
				use:enhance={() => {
					return ({ result, update }) => {
						if (result.type === 'success' || result.type === 'redirect') {
							open = false;
							securityId = data.securities[0]?.id ?? '';
							shares = '';
							basis = '';
						}
						update();
					};
				}}
			>
				<div class="grid gap-4 py-4">
					<div class="grid gap-2">
						<Label for="accountId">Account</Label>
						<select
							id="accountId"
							name="accountId"
							bind:value={accountId}
							class="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
						>
							{#each data.accounts as a (a.id)}
								<option value={a.id}>{a.name}</option>
							{/each}
						</select>
					</div>
					<div class="grid gap-2">
						<Label for="securityId">Security</Label>
						<select
							id="securityId"
							name="securityId"
							bind:value={securityId}
							class="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
						>
							{#each data.securities as s (s.id)}
								<option value={s.id}>{s.symbol}</option>
							{/each}
						</select>
					</div>
					<div class="grid gap-2">
						<Label for="shares">Shares</Label>
						<Input
							id="shares"
							name="shares"
							type="number"
							step="any"
							bind:value={shares}
							placeholder="0"
							required
						/>
					</div>
					<div class="grid gap-2">
						<Label for="basis">Basis</Label>
						<Input
							id="basis"
							name="basis"
							type="number"
							step="any"
							bind:value={basis}
							placeholder="0.00"
							required
						/>
					</div>
				</div>

				<Dialog.Footer>
					<Button type="button" variant="outline" onclick={() => (open = false)}>Cancel</Button>
					<Button type="submit">Create</Button>
				</Dialog.Footer>
			</form>
		</Dialog.Content>
	</Dialog.Portal>
</Dialog.Root>
