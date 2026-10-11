<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import * as Drawer from '$lib/components/ui/drawer/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import SecurityDetailTable from '$lib/components/data-table/SecurityDetailTable.svelte';
	import TableSearch from '$lib/components/data-table/TableSearch.svelte';
	import TagInput from '$lib/components/TagInput.svelte';
	import type { DataTableColumn } from '$lib/components/data-table/DataTable.svelte';
	import { formatMoney } from '$lib/format';
	import { enhance } from '$app/forms';
	import { toast } from 'svelte-sonner';

	let { data } = $props();

	type HoldingRow = (typeof data.holdings)[number];

	const totalValue = $derived(
		data.holdings.reduce((sum, holding) => sum + (holding.totalValue ?? 0), 0)
	);

	const trailingColumns: DataTableColumn<HoldingRow>[] = [
		{ accessorKey: 'shares', header: 'Shares' },
		{
			accessorKey: 'totalValue',
			header: 'Total value',
			cell: (ctx) => formatMoney(ctx.getValue() as number | null),
			footer: () => formatMoney(totalValue)
		}
	];

	let editOpen = $state(false);
	let deleteOpen = $state(false);
</script>

<div class="p-6">
	<PageHeader>
		{#snippet actions()}
			<Button href="/accounts/{data.account.id}/upload">Upload</Button>
			<Button variant="outline" onclick={() => (editOpen = true)}>Edit</Button>

			<Button variant="destructive" onclick={() => (deleteOpen = true)}>Delete</Button>
		{/snippet}
		{#snippet toolbar()}
			<TableSearch placeholder={`Search holdings for ${data.account.name}...`} />
		{/snippet}
		<h1 class="text-2xl font-semibold">{data.account.name}</h1>
		{#if data.tags.length > 0}
			<div class="mt-1 flex flex-wrap gap-1">
				{#each data.tags as tag (tag)}
					<span
						class="inline-flex items-center rounded-full bg-secondary px-2 py-0.5 text-xs font-medium"
					>
						{tag}
					</span>
				{/each}
			</div>
		{/if}
	</PageHeader>

	<SecurityDetailTable data={data.holdings} {trailingColumns} />
</div>

<Drawer.Root bind:open={editOpen} direction="right">
	<Drawer.Portal>
		<Drawer.Overlay />
		<Drawer.Content>
			<Drawer.Header>
				<Drawer.Title>Edit account</Drawer.Title>
			</Drawer.Header>

			{#key editOpen}
				<form
					method="POST"
					action="?/update"
					class="flex flex-1 flex-col overflow-y-auto"
					use:enhance={() => {
						return ({ result, update }) => {
							if (result.type === 'success' || result.type === 'redirect') {
								editOpen = false;
								toast.success('Account updated');
							}
							update();
						};
					}}
				>
					<div class="grid gap-4 px-4">
						<div class="grid gap-2">
							<Label for="edit-name">Account name</Label>
							<Input id="edit-name" name="name" value={data.account.name} required />
						</div>
						<div class="grid gap-2">
							<Label>Tags</Label>
							<TagInput availableTags={data.allTags} initialTags={data.tags} />
						</div>
					</div>

					<Drawer.Footer>
						<Button type="submit">Save</Button>
						<Button type="button" variant="outline" onclick={() => (editOpen = false)}
							>Cancel</Button
						>
					</Drawer.Footer>
				</form>
			{/key}
		</Drawer.Content>
	</Drawer.Portal>
</Drawer.Root>

<Dialog.Root bind:open={deleteOpen}>
	<Dialog.Portal>
		<Dialog.Overlay />
		<Dialog.Content>
			<Dialog.Header>
				<Dialog.Title>Delete account</Dialog.Title>
				<Dialog.Description>
					This will permanently delete "{data.account.name}" and all of its holdings. This action
					cannot be undone.
				</Dialog.Description>
			</Dialog.Header>

			<form
				method="POST"
				action="?/delete"
				use:enhance={() => {
					return ({ result, update }) => {
						if (result.type === 'redirect') {
							toast.success('Account deleted');
						}
						update();
					};
				}}
			>
				<Dialog.Footer>
					<Button type="button" variant="outline" onclick={() => (deleteOpen = false)}
						>Cancel</Button
					>
					<Button type="submit" variant="destructive">Delete</Button>
				</Dialog.Footer>
			</form>
		</Dialog.Content>
	</Dialog.Portal>
</Dialog.Root>
