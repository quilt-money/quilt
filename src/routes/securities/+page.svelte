<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import { Checkbox } from '$lib/components/ui/checkbox/index.js';
	import * as Drawer from '$lib/components/ui/drawer/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { enhance } from '$app/forms';
	import { goto, invalidateAll } from '$app/navigation';
	import { resolve } from '$app/paths';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import SyncDialog from '$lib/components/SyncDialog.svelte';
	import TagInput from '$lib/components/TagInput.svelte';
	import { toast } from 'svelte-sonner';
	import { SvelteSet } from 'svelte/reactivity';
	import { renderComponent, renderSnippet } from '@tanstack/svelte-table';
	import type { DataTableColumn } from '$lib/components/data-table/DataTable.svelte';
	import SecurityDetailTable from '$lib/components/data-table/SecurityDetailTable.svelte';
	import TableSearch from '$lib/components/data-table/TableSearch.svelte';
	import { formatMoney } from '$lib/format';
	import { portfolioHref } from '$lib/portfolio-filter';

	let { data } = $props();

	let selected = $state(new Set<string>());
	let syncDialogOpen = $state(false);
	let syncTargets = $derived(
		data.securitiesWithPricesAndSyncTimes.filter((security) => selected.has(security.id))
	);

	let bulkEditOpen = $state(false);
	let bulkTypeId = $state('');
	let bulkSectorId = $state('');
	let bulkRegionId = $state('');

	$effect(() => {
		if (bulkEditOpen) {
			bulkTypeId = '';
			bulkSectorId = '';
			bulkRegionId = '';
		}
	});

	const selectClass =
		'h-11 w-full appearance-none rounded-md border border-input bg-transparent px-4 pr-10 text-base shadow-xs transition-colors outline-none hover:border-ring focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30';

	let allSelected = $derived(
		data.securitiesWithPricesAndSyncTimes.length > 0 &&
			selected.size === data.securitiesWithPricesAndSyncTimes.length
	);

	function toggleAll() {
		selected = allSelected
			? new Set()
			: new Set(data.securitiesWithPricesAndSyncTimes.map((s) => s.id));
	}

	function toggle(id: string) {
		const next = new SvelteSet(selected);
		if (next.has(id)) next.delete(id);
		else next.add(id);
		selected = next;
	}

	type SecurityRow = (typeof data.securitiesWithPricesAndSyncTimes)[number];
	const leadingColumns: DataTableColumn<SecurityRow>[] = [
		{
			id: 'select',
			header: () =>
				renderComponent(Checkbox, {
					checked: allSelected,
					onCheckedChange: toggleAll,
					'aria-label': 'Select all',
					'data-no-nav': true
				}),
			cell: (ctx) =>
				renderComponent(Checkbox, {
					name: 'ids',
					value: ctx.row.original.id,
					checked: selected.has(ctx.row.original.id),
					onCheckedChange: () => toggle(ctx.row.original.id),
					'aria-label': `Select ${ctx.row.original.symbol}`,
					'data-no-nav': true
				}),
			enableGlobalFilter: false
		}
	];

	const trailingColumns: DataTableColumn<SecurityRow>[] = [
		{
			accessorKey: 'latestPrice',
			header: 'Latest price',
			cell: (ctx) => formatMoney(ctx.getValue() as number | null)
		},
		{
			accessorKey: 'accounts',
			header: 'Accounts',
			enableGlobalFilter: false,
			cell: (ctx) =>
				renderSnippet(accountsCell, {
					accounts: ctx.getValue() as { id: string; name: string }[],
					symbol: ctx.row.original.symbol
				})
		},
		{
			id: 'tags',
			header: 'Tags',
			accessorKey: 'tags',
			enableGlobalFilter: false,
			cell: (ctx) => renderSnippet(tagsCell, ctx.getValue() as string[])
		},
		{
			accessorKey: 'lastSynced',
			header: 'Last synced',
			cell: (ctx) => {
				const v = ctx.getValue() as string | null;
				return v != null ? new Date(v).toLocaleString() : '—';
			}
		}
	];
</script>

{#snippet accountsCell({
	accounts,
	symbol
}: {
	accounts: { id: string; name: string }[];
	symbol: string;
})}
	<div class="flex flex-wrap gap-1" data-no-nav>
		{#each accounts as account (account.id)}
			<a
				href={portfolioHref(account.name, symbol)}
				class="inline-flex items-center rounded-full bg-secondary px-2 py-0.5 text-xs font-medium hover:bg-secondary/80"
			>
				{account.name}
			</a>
		{:else}
			<span class="text-muted-foreground">—</span>
		{/each}
	</div>
{/snippet}

{#snippet tagsCell(tags: string[])}
	<div class="flex flex-wrap gap-1">
		{#each tags as tag (tag)}
			<span
				class="inline-flex items-center rounded-full bg-secondary px-2 py-0.5 text-xs font-medium"
			>
				{tag}
			</span>
		{/each}
	</div>
{/snippet}

{#snippet attributeSelect(
	label: string,
	name: string,
	value: string,
	onValueChange: (v: string) => void,
	options: { id: string; name: string }[]
)}
	<div>
		<label class="text-sm font-medium text-muted-foreground" for={name}>{label}</label>
		<select
			id={name}
			{name}
			{value}
			onchange={(e) => onValueChange(e.currentTarget.value)}
			class="{selectClass} mt-1.5"
		>
			<option value="">No change</option>
			{#each options as o (o.id)}
				<option value={o.id}>{o.name}</option>
			{/each}
		</select>
	</div>
{/snippet}

<div class="p-6">
	<PageHeader>
		{#snippet actions()}
			<Button
				type="button"
				variant="outline"
				disabled={selected.size === 0}
				onclick={() => (syncDialogOpen = true)}
			>
				{selected.size > 0 ? `Sync ${selected.size} securities` : 'Sync'}
			</Button>
			<Button
				type="button"
				variant="outline"
				disabled={selected.size === 0}
				onclick={() => (bulkEditOpen = true)}
			>
				{selected.size > 0 ? `Bulk edit ${selected.size} securities` : 'Bulk edit'}
			</Button>
		{/snippet}
		{#snippet toolbar()}
			<TableSearch placeholder="Search securities…" />
		{/snippet}
		<h1 class="text-2xl font-semibold">Securities</h1>
	</PageHeader>

	<SecurityDetailTable
		data={data.securitiesWithPricesAndSyncTimes}
		{leadingColumns}
		{trailingColumns}
		onRowClick={(row) => goto(resolve(`/securities/${row.id}`))}
	/>
</div>

<SyncDialog
	bind:open={syncDialogOpen}
	securities={syncTargets}
	onClose={async () => {
		selected = new Set();
		await invalidateAll();
	}}
/>

<Drawer.Root bind:open={bulkEditOpen} direction="right">
	<Drawer.Content>
		<form
			method="POST"
			action="?/bulkEdit"
			class="flex h-full flex-col overflow-y-auto"
			use:enhance={() => {
				const editedCount = selected.size;
				return ({ result, update }) => {
					if (result.type === 'success' || result.type === 'redirect') {
						bulkEditOpen = false;
						selected = new Set();
						toast.success(`Updated ${editedCount} securities`);
					}
					update();
				};
			}}
		>
			{#each [...selected] as id (id)}
				<input type="hidden" name="ids" value={id} />
			{/each}

			<Drawer.Header>
				<Drawer.Title>Bulk edit {selected.size} securities</Drawer.Title>
				<Drawer.Description>
					Only the fields you change are applied to every selected security. Tags you add here are
					merged into each security's existing tags.
				</Drawer.Description>
			</Drawer.Header>

			<div class="flex flex-col gap-4 px-4">
				{@render attributeSelect(
					'Type',
					'typeId',
					bulkTypeId,
					(v) => (bulkTypeId = v),
					data.securityTypes
				)}
				{@render attributeSelect(
					'Sector',
					'sectorId',
					bulkSectorId,
					(v) => (bulkSectorId = v),
					data.sectors
				)}
				{@render attributeSelect(
					'Region',
					'regionId',
					bulkRegionId,
					(v) => (bulkRegionId = v),
					data.regions
				)}
				<div>
					<Label>Add tags</Label>
					{#key bulkEditOpen}
						<div class="mt-1.5">
							<TagInput availableTags={data.allTags} inputName="addTags" />
						</div>
					{/key}
				</div>
			</div>

			<Drawer.Footer>
				<Button type="submit">Save</Button>
				<Drawer.Close>
					{#snippet child({ props })}
						<Button type="button" variant="outline" {...props}>Cancel</Button>
					{/snippet}
				</Drawer.Close>
			</Drawer.Footer>
		</form>
	</Drawer.Content>
</Drawer.Root>
