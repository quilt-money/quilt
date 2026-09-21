<script module lang="ts">
	import type { DataTableColumn } from './DataTable.svelte';

	/** Fields every table that lists securities must provide, regardless of what else the row carries. */
	export type SecurityDetailRow = {
		symbol: string | null;
		fullName: string | null;
		type: string | null;
		sector: string | null;
		region: string | null;
	};
</script>

<script lang="ts" generics="TData extends SecurityDetailRow & Record<string, unknown>">
	import DataTable, { type DataTableFilterSummary } from './DataTable.svelte';

	let {
		data,
		leadingColumns = [],
		trailingColumns = [],
		search = true,
		searchPlaceholder = 'Search…',
		onSearchKeydown,
		onRowClick,
		filteredData = $bindable([]),
		activeFilters = $bindable({ search: '', clearSearch: () => {}, columns: [] })
	}: {
		data: TData[];
		leadingColumns?: DataTableColumn<TData>[];
		trailingColumns?: DataTableColumn<TData>[];
		search?: boolean;
		searchPlaceholder?: string;
		onSearchKeydown?: (e: KeyboardEvent) => void;
		onRowClick?: (row: TData) => void;
		filteredData?: TData[];
		activeFilters?: DataTableFilterSummary;
	} = $props();

	const baseColumns: DataTableColumn<TData>[] = [
		{ accessorKey: 'symbol', header: 'Symbol', cellClass: 'font-mono' },
		{ accessorKey: 'fullName', header: 'Name' },
		{ accessorKey: 'type', header: 'Type', filterFn: 'arrHas' },
		{ accessorKey: 'sector', header: 'Sector', filterFn: 'arrHas' },
		{ accessorKey: 'region', header: 'Region', filterFn: 'arrHas' }
	];

	const columns = $derived([...leadingColumns, ...baseColumns, ...trailingColumns]);
</script>

<DataTable
	{data}
	{columns}
	{search}
	{searchPlaceholder}
	{onSearchKeydown}
	{onRowClick}
	bind:filteredData
	bind:activeFilters
/>
