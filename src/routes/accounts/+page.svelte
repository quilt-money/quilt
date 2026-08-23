<script lang="ts">
	import * as Table from '$lib/components/ui/table/index.js';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';
	import TagInput from '$lib/components/TagInput.svelte';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import { resolve } from '$app/paths';

	let { data } = $props();

	let open = $state(false);
	let name = $state('');
	let owner = $state('Dan');
	let tagInput = $state<ReturnType<typeof TagInput> | undefined>(undefined);

	let pendingDelete = $state<{ id: string; name: string } | null>(null);
</script>

<div class="p-6">
	<PageHeader>
		{#snippet actions()}
			<Button onclick={() => (open = true)}>Create account</Button>
		{/snippet}
		<h1 class="text-2xl font-semibold">Accounts</h1>
	</PageHeader>

	<Table.Root>
		<Table.Header>
			<Table.Row>
				<Table.Head>Name</Table.Head>
				<Table.Head>Owner</Table.Head>
				<Table.Head class="w-10"></Table.Head>
			</Table.Row>
		</Table.Header>
		<Table.Body>
			{#each data.accounts as account (account.id)}
				<Table.Row
					class="cursor-pointer"
					onclick={(e) => {
						if (!(e.target as HTMLElement).closest('[data-no-nav]')) {
							goto(resolve(`/accounts/${account.id}`));
						}
					}}
				>
					<Table.Cell>{account.name}</Table.Cell>
					<Table.Cell>{account.owner}</Table.Cell>
				</Table.Row>
			{/each}
		</Table.Body>
	</Table.Root>
</div>

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
				<Dialog.Title>Delete account</Dialog.Title>
				<Dialog.Description>
					Are you sure you want to delete <strong>{pendingDelete?.name}</strong>? This cannot be
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

<Dialog.Root bind:open>
	<Dialog.Portal>
		<Dialog.Overlay />
		<Dialog.Content>
			<Dialog.Header>
				<Dialog.Title>Create account</Dialog.Title>
			</Dialog.Header>

			<form
				method="POST"
				action="?/create"
				use:enhance={() => {
					return ({ result, update }) => {
						if (result.type === 'success' || result.type === 'redirect') {
							open = false;
							name = '';
							owner = 'Dan';
							tagInput?.reset();
						}
						update();
					};
				}}
			>
				<div class="grid gap-4 py-4">
					<div class="grid gap-2">
						<Label for="name">Account name</Label>
						<Input id="name" name="name" bind:value={name} placeholder="e.g. Roth IRA" required />
					</div>
					<div class="grid gap-2">
						<Label>Tags</Label>
						<TagInput bind:this={tagInput} availableTags={data.tags.map((t) => t.name)} />
					</div>
					<div class="grid gap-2">
						<Label for="owner">Owner</Label>
						<select
							id="owner"
							name="owner"
							bind:value={owner}
							class="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
						>
							<option value="Dan">Dan</option>
							<option value="Emily">Emily</option>
						</select>
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
