<script lang="ts">
	import * as Table from '$lib/components/ui/table/index.js';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { Checkbox } from '$lib/components/ui/checkbox/index.js';
	import { enhance } from '$app/forms';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import { SvelteSet } from 'svelte/reactivity';
	import { renderComponent } from '@tanstack/svelte-table';
	import DataTable, { type DataTableColumn } from '$lib/components/data-table/DataTable.svelte';

	let { data } = $props();

	let selected = $state(new Set<string>());
	let syncing = $state(false);

	let allSelected = $derived(
		data.securities.length > 0 && selected.size === data.securities.length
	);

	function toggleAll() {
		selected = allSelected ? new Set() : new Set(data.securities.map((s) => s.id));
	}

	function toggle(id: string) {
		const next = new SvelteSet(selected);
		if (next.has(id)) next.delete(id);
		else next.add(id);
		selected = next;
	}

	type SecurityRow = (typeof data.securities)[number];
	const columns: DataTableColumn<SecurityRow>[] = [
		{
			id: 'select',
			header: () =>
				renderComponent(Checkbox, {
					checked: allSelected,
					onCheckedChange: toggleAll,
					'aria-label': 'Select all'
				}),
			cell: (ctx) =>
				renderComponent(Checkbox, {
					name: 'ids',
					value: ctx.row.original.id,
					checked: selected.has(ctx.row.original.id),
					onCheckedChange: () => toggle(ctx.row.original.id),
					'aria-label': `Select ${ctx.row.original.symbol}`
				}),
			enableGlobalFilter: false
		},
		{ accessorKey: 'symbol', header: 'Symbol', cellClass: 'font-mono' },
		{ accessorKey: 'fullName', header: 'Name' },
		{
			accessorKey: 'latestPrice',
			header: 'Latest price',
			cell: (ctx) => {
				const v = ctx.getValue() as number | null;
				return v != null ? `$${v.toFixed(2)}` : '—';
			}
		},
		{ accessorKey: 'type', header: 'Type', filterFn: 'equalsString' },
		{ accessorKey: 'sector', header: 'Sector', filterFn: 'equalsString' },
		{ accessorKey: 'region', header: 'Region', filterFn: 'equalsString' }
	];

	const filterSelectClass =
		'h-8 w-full rounded-md border border-input bg-transparent px-2 text-xs shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring';

	let open = $state(false);
	let symbol = $state('');
	let fullName = $state('');
	let typeId = $state('');
	let sectorId = $state('');
	let regionId = $state('');

	function resetForm() {
		symbol = '';
		fullName = '';
		typeId = data.securityTypes[0]?.id ?? '';
		sectorId = '';
		regionId = data.regions[0]?.id ?? '';
	}
</script>

<div class="p-6">
	<form
		method="POST"
		action="?/sync"
		use:enhance={() => {
			syncing = true;
			return async ({ update }) => {
				await update();
				selected = new Set();
				syncing = false;
			};
		}}
	>
		<PageHeader>
			{#snippet actions()}
				<Button type="submit" variant="outline" disabled={syncing || selected.size === 0}>
					{syncing ? 'Syncing…' : selected.size > 0 ? `Sync ${selected.size} securities` : 'Sync'}
				</Button>
				<Button type="button" onclick={() => (open = true)}>Create security</Button>
			{/snippet}
			<h1 class="text-2xl font-semibold">Securities</h1>
		</PageHeader>

		<DataTable
			data={data.securities}
			{columns}
			searchPlaceholder="Search securities…"
			onSearchKeydown={(e) => {
				if (e.key === 'Enter') e.preventDefault();
			}}
		>
			{#snippet filterRow(table)}
				<Table.Head></Table.Head>
				<Table.Head></Table.Head>
				<Table.Head></Table.Head>
				<Table.Head></Table.Head>
				<Table.Head>
					<select
						class={filterSelectClass}
						value={(table.getColumn('type')?.getFilterValue() as string | undefined) ?? ''}
						onchange={(e) =>
							table.getColumn('type')?.setFilterValue(e.currentTarget.value || undefined)}
					>
						<option value="">All types</option>
						{#each data.securityTypes as t (t.id)}
							<option value={t.name}>{t.name}</option>
						{/each}
					</select>
				</Table.Head>
				<Table.Head>
					<select
						class={filterSelectClass}
						value={(table.getColumn('sector')?.getFilterValue() as string | undefined) ?? ''}
						onchange={(e) =>
							table.getColumn('sector')?.setFilterValue(e.currentTarget.value || undefined)}
					>
						<option value="">All sectors</option>
						{#each data.sectors as s (s.id)}
							<option value={s.name}>{s.name}</option>
						{/each}
					</select>
				</Table.Head>
				<Table.Head>
					<select
						class={filterSelectClass}
						value={(table.getColumn('region')?.getFilterValue() as string | undefined) ?? ''}
						onchange={(e) =>
							table.getColumn('region')?.setFilterValue(e.currentTarget.value || undefined)}
					>
						<option value="">All regions</option>
						{#each data.regions as r (r.id)}
							<option value={r.name}>{r.name}</option>
						{/each}
					</select>
				</Table.Head>
			{/snippet}
		</DataTable>
	</form>
</div>

<!-- Create security -->
<Dialog.Root bind:open>
	<Dialog.Portal>
		<Dialog.Overlay />
		<Dialog.Content>
			<Dialog.Header>
				<Dialog.Title>Create security</Dialog.Title>
			</Dialog.Header>

			<form
				method="POST"
				action="?/create"
				use:enhance={() => {
					return ({ result, update }) => {
						if (result.type === 'success' || result.type === 'redirect') {
							open = false;
							resetForm();
						}
						update();
					};
				}}
			>
				<div class="grid gap-4 py-4">
					<div class="grid gap-2">
						<Label for="symbol">Symbol</Label>
						<Input id="symbol" name="symbol" bind:value={symbol} placeholder="e.g. AAPL" required />
					</div>
					<div class="grid gap-2">
						<Label for="fullName">Name</Label>
						<Input
							id="fullName"
							name="fullName"
							bind:value={fullName}
							placeholder="e.g. Apple Inc."
						/>
					</div>
					<div class="grid gap-2">
						<Label for="typeId">Type</Label>
						<select
							id="typeId"
							name="typeId"
							bind:value={typeId}
							class="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
						>
							<option value="">—</option>
							{#each data.securityTypes as t (t.id)}
								<option value={t.id}>{t.name}</option>
							{/each}
						</select>
					</div>
					<div class="grid gap-2">
						<Label for="regionId">Region</Label>
						<select
							id="regionId"
							name="regionId"
							bind:value={regionId}
							class="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
						>
							<option value="">—</option>
							{#each data.regions as r (r.id)}
								<option value={r.id}>{r.name}</option>
							{/each}
						</select>
					</div>
					<div class="grid gap-2">
						<Label for="sectorId">Sector</Label>
						<select
							id="sectorId"
							name="sectorId"
							bind:value={sectorId}
							class="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
						>
							<option value="">—</option>
							{#each data.sectors as s (s.id)}
								<option value={s.id}>{s.name}</option>
							{/each}
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
