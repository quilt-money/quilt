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
	import TableSearch from '$lib/components/data-table/TableSearch.svelte';
	import { renderSnippet } from '@tanstack/svelte-table';

	let { data } = $props();

	let open = $state(false);
	let name = $state('');
	let tagInput = $state<ReturnType<typeof TagInput> | undefined>(undefined);

	const columns: DataTableColumn<(typeof data.accounts)[number]>[] = [
		{ accessorKey: 'name', header: 'Name' },
		{
			id: 'tags',
			header: 'Tags',
			accessorKey: 'tags',
			enableGlobalFilter: false,
			cell: (ctx) => renderSnippet(tagsCell, ctx.getValue() as string[])
		}
	];
</script>

{#snippet tagsCell(tags: string[])}
	<div class="flex flex-wrap gap-1">
		{#each tags as t (t)}
			<span
				class="inline-flex items-center rounded-full bg-secondary px-2 py-0.5 text-xs font-medium"
			>
				{t}
			</span>
		{/each}
	</div>
{/snippet}

<div class="p-6">
	<PageHeader>
		{#snippet actions()}
			<Button onclick={() => (open = true)}>Create account</Button>
		{/snippet}
		{#snippet toolbar()}
			<TableSearch placeholder="Search accounts…" />
		{/snippet}
		<h1 class="text-2xl font-semibold">Accounts</h1>
	</PageHeader>

	<DataTable
		data={data.accounts}
		{columns}
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
				</div>

				<Dialog.Footer>
					<Button type="button" variant="outline" onclick={() => (open = false)}>Cancel</Button>
					<Button type="submit">Create</Button>
				</Dialog.Footer>
			</form>
		</Dialog.Content>
	</Dialog.Portal>
</Dialog.Root>
