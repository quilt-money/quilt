<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Drawer from '$lib/components/ui/drawer/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import SecurityDetailTable from '$lib/components/data-table/SecurityDetailTable.svelte';
	import TagInput from '$lib/components/TagInput.svelte';
	import type { DataTableColumn } from '$lib/components/data-table/DataTable.svelte';
	import { formatMoney } from '$lib/format';
	import { enhance } from '$app/forms';

	let { data } = $props();

	type HoldingRow = (typeof data.holdings)[number];

	const trailingColumns: DataTableColumn<HoldingRow>[] = [
		{ accessorKey: 'shares', header: 'Shares' },
		{
			accessorKey: 'totalValue',
			header: 'Total value',
			cell: (ctx) => formatMoney(ctx.getValue() as number | null)
		}
	];

	let editOpen = $state(false);
</script>

<div class="p-6">
	<PageHeader>
		{#snippet actions()}
			<Button href="/accounts/{data.account.id}/upload">Upload</Button>
			<Button variant="outline" onclick={() => (editOpen = true)}>Edit</Button>

			<Button href="/accounts/{data.account.id}/delete" disabled={true} variant="destructive"
				>Delete</Button
			>
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

	<SecurityDetailTable
		data={data.holdings}
		{trailingColumns}
		searchPlaceholder={`Search holdings for ${data.account.name}...`}
	/>
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
