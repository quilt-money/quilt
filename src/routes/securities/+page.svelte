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
	import {
		columnFilteringFeature,
		createColumnHelper,
		createFilteredRowModel,
		createSortedRowModel,
		createTable,
		filterFn_equalsString,
		filterFn_includesString,
		FlexRender,
		globalFilteringFeature,
		renderComponent,
		rowSortingFeature,
		sortFn_alphanumeric,
		tableFeatures
	} from '@tanstack/svelte-table';
	import SortableHeader from '$lib/components/data-table/SortableHeader.svelte';
	import TableSearch from '$lib/components/data-table/TableSearch.svelte';

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

	const features = tableFeatures({
		rowSortingFeature,
		sortedRowModel: createSortedRowModel(),
		sortFns: { alphanumeric: sortFn_alphanumeric },
		columnFilteringFeature,
		globalFilteringFeature,
		filteredRowModel: createFilteredRowModel(),
		filterFns: { includesString: filterFn_includesString, equalsString: filterFn_equalsString }
	});

	type SecurityRow = (typeof data.securities)[number];
	const helper = createColumnHelper<typeof features, SecurityRow>();
	const columns = helper.columns([
		helper.display({
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
		}),
		helper.accessor('symbol', {
			header: (h) => renderComponent(SortableHeader, { label: 'Symbol', header: h.header })
		}),
		helper.accessor('fullName', {
			header: (h) => renderComponent(SortableHeader, { label: 'Name', header: h.header }),
			cell: (ctx) => ctx.getValue() ?? '—'
		}),
		helper.accessor('latestPrice', {
			header: (h) => renderComponent(SortableHeader, { label: 'Latest price', header: h.header }),
			cell: (ctx) => {
				const v = ctx.getValue();
				return v != null ? `$${v.toFixed(2)}` : '—';
			}
		}),
		helper.accessor('type', {
			header: (h) => renderComponent(SortableHeader, { label: 'Type', header: h.header }),
			cell: (ctx) => ctx.getValue() ?? '—',
			filterFn: 'equalsString'
		}),
		helper.accessor('sector', {
			header: (h) => renderComponent(SortableHeader, { label: 'Sector', header: h.header }),
			cell: (ctx) => ctx.getValue() ?? '—',
			filterFn: 'equalsString'
		}),
		helper.accessor('region', {
			header: (h) => renderComponent(SortableHeader, { label: 'Region', header: h.header }),
			cell: (ctx) => ctx.getValue() ?? '—',
			filterFn: 'equalsString'
		})
	]);

	const table = createTable({
		features,
		columns,
		get data() {
			return data.securities;
		}
	});

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

		<TableSearch
			{table}
			placeholder="Search securities…"
			class="mb-4 max-w-sm"
			onkeydown={(e) => {
				if (e.key === 'Enter') e.preventDefault();
			}}
		/>

		<Table.Root>
			<Table.Header>
				{#each table.getHeaderGroups() as group (group.id)}
					<Table.Row>
						{#each group.headers as header (header.id)}
							<Table.Head class={header.column.id === 'select' ? 'w-10' : ''}>
								{#if !header.isPlaceholder}<FlexRender {header} />{/if}
							</Table.Head>
						{/each}
					</Table.Row>
				{/each}
				<Table.Row>
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
				</Table.Row>
			</Table.Header>
			<Table.Body>
				{#each table.getRowModel().rows as row (row.id)}
					<Table.Row>
						{#each row.getAllCells() as cell (cell.id)}
							<Table.Cell class={cell.column.id === 'symbol' ? 'font-mono' : ''}>
								<FlexRender {cell} />
							</Table.Cell>
						{/each}
					</Table.Row>
				{/each}
			</Table.Body>
		</Table.Root>
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
