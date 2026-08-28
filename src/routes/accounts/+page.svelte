<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';
	import TagInput from '$lib/components/TagInput.svelte';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import { resolve } from '$app/paths';
	import DataTable, { type DataTableColumn } from '$lib/components/data-table/DataTable.svelte';

	let { data } = $props();

	let open = $state(false);
	let name = $state('');
	let owner = $state('Dan');
	let tagInput = $state<ReturnType<typeof TagInput> | undefined>(undefined);

	const columns: DataTableColumn<(typeof data.accounts)[number]>[] = [
		{ accessorKey: 'name', header: 'Name' },
		{ accessorKey: 'owner', header: 'Owner' }
	];
</script>

<div class="p-6">
	<PageHeader>
		{#snippet actions()}
			<Button onclick={() => (open = true)}>Create account</Button>
		{/snippet}
		<h1 class="text-2xl font-semibold">Accounts</h1>
	</PageHeader>

	<DataTable
		data={data.accounts}
		{columns}
		searchPlaceholder="Search accounts…"
		onRowClick={(row) => goto(resolve(`/accounts/${row.id}`))}
	/>
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
