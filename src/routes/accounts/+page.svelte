<script lang="ts">
	import * as Table from '$lib/components/ui/table/index.js';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { enhance } from '$app/forms';

	let { data } = $props();

	let open = $state(false);
	let name = $state('');
	let owner = $state('Dan');
</script>

<div class="p-6">
	<div class="flex justify-end mb-4">
		<Button onclick={() => (open = true)}>Create account</Button>
	</div>

	<Table.Root>
		<Table.Header>
			<Table.Row>
				<Table.Head>Name</Table.Head>
				<Table.Head>Owner</Table.Head>
			</Table.Row>
		</Table.Header>
		<Table.Body>
			{#each data.accounts as account (account.id)}
				<Table.Row>
					<Table.Cell>{account.name}</Table.Cell>
					<Table.Cell>{account.owner}</Table.Cell>
				</Table.Row>
			{/each}
		</Table.Body>
	</Table.Root>
</div>

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
