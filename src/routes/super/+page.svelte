<script lang="ts">
	import { Checkbox } from '$lib/components/ui/checkbox/index.js';
	import { renderComponent } from '@tanstack/svelte-table';
	import { SvelteSet } from 'svelte/reactivity';
	import DataTable, { type DataTableColumn } from '$lib/components/data-table/DataTable.svelte';
	import PageHeader from '$lib/components/PageHeader.svelte';

	let { data } = $props();

	type HoldingRow = (typeof data.holdings)[number];
	type UnheldSecurityRow = (typeof data.unheldSecurities)[number];

	const rows = $derived([...data.holdings, ...data.unheldSecurities]);

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
		sumValue(selected.size > 0 ? rows.filter((r) => selected.has(r.id)) : rows)
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
		{ accessorKey: 'accountName', header: 'Account' },
		{ accessorKey: 'securitySymbol', header: 'Symbol', cellClass: 'font-mono' },
		{ accessorKey: 'securityFullName', header: 'Name' },
		{ accessorKey: 'shares', header: 'Shares' },
		{ accessorKey: 'type', header: 'Type', filterFn: 'arrHas' },
		{ accessorKey: 'sector', header: 'Sector', filterFn: 'arrHas' },
		{ accessorKey: 'region', header: 'Region', filterFn: 'arrHas' },
		{
			accessorKey: 'totalValue',
			header: 'Total value',
			cell: (ctx) => {
				const v = ctx.getValue() as number | null;
				return v != null ? `$${v.toFixed(2)}` : '—';
			}
		}
	];
</script>

<div class="p-6">
	<PageHeader>
		<h1 class="text-2xl font-semibold">Super</h1>
	</PageHeader>

	<div class="mb-4 flex items-baseline gap-2 rounded-md border bg-muted/50 px-4 py-3">
		<span class="text-sm font-medium text-muted-foreground">{balanceLabel}</span>
		<span class="text-lg font-semibold">${balance.toFixed(2)}</span>
	</div>

	<DataTable data={rows} {columns} searchPlaceholder="Search…" />
</div>
