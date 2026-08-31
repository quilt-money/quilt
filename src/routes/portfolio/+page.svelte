<script lang="ts">
	import { Checkbox } from '$lib/components/ui/checkbox/index.js';
	import { renderComponent } from '@tanstack/svelte-table';
	import { SvelteSet } from 'svelte/reactivity';
	import DataTable, {
		type DataTableColumn,
		type DataTableFilterSummary
	} from '$lib/components/data-table/DataTable.svelte';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import { formatMoney } from '$lib/format';

	let { data } = $props();

	type HoldingRow = (typeof data.holdings)[number];
	type UnheldSecurityRow = (typeof data.unheldSecurities)[number];

	const rows = $derived([...data.holdings, ...data.unheldSecurities]);

	let filteredRows = $state<(HoldingRow | UnheldSecurityRow)[]>([]);
	let activeFilters = $state<DataTableFilterSummary>({ search: '', columns: [] });

	let selected = $state(new Set<string>());

	let allSelected = $derived(rows.length > 0 && selected.size === rows.length);

	function toggleAll() {
		selected = allSelected ? new Set() : new Set(rows.map((r) => r.id));
	}

	function toggle(id: string) {
		const next = new SvelteSet(selected);
		if (next.has(id)) next.delete(id);
		else next.add(id);
		selected = next;
	}

	function sumValue(rs: (HoldingRow | UnheldSecurityRow)[]) {
		return rs.reduce((sum, r) => sum + (r.totalValue ?? 0), 0);
	}

	const balanceLabel = $derived(selected.size > 0 ? 'Selected balance' : 'Total balance');
	const balance = $derived(
		sumValue(selected.size > 0 ? filteredRows.filter((r) => selected.has(r.id)) : filteredRows)
	);

	const columns: DataTableColumn<HoldingRow | UnheldSecurityRow>[] = [
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
					checked: selected.has(ctx.row.original.id),
					onCheckedChange: () => toggle(ctx.row.original.id),
					'aria-label': `Select ${ctx.row.original.securitySymbol}`
				}),
			enableGlobalFilter: false
		},
		{ accessorKey: 'accountName', header: 'Account', filterFn: 'arrHas' },
		{ accessorKey: 'securitySymbol', header: 'Symbol', cellClass: 'font-mono' },
		{ accessorKey: 'securityFullName', header: 'Name' },
		{ accessorKey: 'shares', header: 'Shares' },
		{ accessorKey: 'type', header: 'Type', filterFn: 'arrHas' },
		{ accessorKey: 'sector', header: 'Sector', filterFn: 'arrHas' },
		{ accessorKey: 'region', header: 'Region', filterFn: 'arrHas' },
		{
			accessorKey: 'totalValue',
			header: 'Total value',
			cell: (ctx) => formatMoney(ctx.getValue() as number | null)
		}
	];

	const columnLabels = Object.fromEntries(
		columns
			.map((col) => [col.id ?? col.accessorKey, col.header])
			.filter((entry): entry is [string, string] => typeof entry[1] === 'string')
	);

	const hasActiveFilters = $derived(
		activeFilters.search.length > 0 || activeFilters.columns.length > 0
	);
</script>

<div class="p-6">
	<PageHeader>
		<h1 class="text-2xl font-semibold">Portfolio</h1>
	</PageHeader>

	<div class="mb-4 flex items-baseline gap-2 rounded-md border bg-muted/50 px-4 py-3">
		<span class="text-sm font-medium text-muted-foreground">{balanceLabel}</span>
		<span class="text-lg font-semibold">{formatMoney(balance)}</span>
	</div>

	{#if hasActiveFilters}
		<div class="mb-4 flex flex-wrap items-center gap-2 rounded-md border bg-muted/50 px-4 py-3">
			<span class="text-sm font-medium text-muted-foreground">Filtered by</span>
			{#if activeFilters.search}
				<span class="rounded-full border bg-background px-2.5 py-0.5 text-xs font-medium">
					Search: "{activeFilters.search}"
				</span>
			{/if}
			{#each activeFilters.columns as filter (filter.id)}
				<span class="rounded-full border bg-background px-2.5 py-0.5 text-xs font-medium">
					{columnLabels[filter.id] ?? filter.id}: {filter.values.join(', ')}
				</span>
			{/each}
		</div>
	{/if}

	<DataTable
		data={rows}
		{columns}
		searchPlaceholder="Search…"
		bind:filteredData={filteredRows}
		bind:activeFilters
	/>
</div>
