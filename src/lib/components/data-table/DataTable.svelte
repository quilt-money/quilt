<script module lang="ts">
	import {
		columnFilteringFeature,
		createFilteredRowModel,
		createSortedRowModel,
		filterFn_equalsString,
		filterFn_includesString,
		globalFilteringFeature,
		rowSortingFeature,
		sortFn_alphanumeric,
		tableFeatures,
		type CellContext,
		type HeaderContext
	} from '@tanstack/svelte-table';

	const features = tableFeatures({
		rowSortingFeature,
		sortedRowModel: createSortedRowModel(),
		sortFns: { alphanumeric: sortFn_alphanumeric },
		columnFilteringFeature,
		globalFilteringFeature,
		filteredRowModel: createFilteredRowModel(),
		filterFns: { includesString: filterFn_includesString, equalsString: filterFn_equalsString }
	});

	export type DataTableFeatures = typeof features;

	export type DataTableColumn<TData extends Record<string, unknown>> = {
		id?: string;
		accessorKey?: keyof TData & string;
		/** A string is rendered as a sortable label; a function gets full control (e.g. a select-all checkbox). Omit for a blank header. */
		header?: string | ((ctx: HeaderContext<DataTableFeatures, TData, unknown>) => unknown);
		/** Defaults to the raw accessor value when omitted. */
		cell?: (ctx: CellContext<DataTableFeatures, TData, unknown>) => unknown;
		/** Applied to the body cell. */
		cellClass?: string;
		/** Only meaningful when `accessorKey` is set. Defaults to true. */
		sortable?: boolean;
		filterFn?: 'equalsString' | 'includesString';
		enableGlobalFilter?: boolean;
	};
</script>

<script lang="ts" generics="TData extends Record<string, unknown>">
	import * as Table from '$lib/components/ui/table/index.js';
	import {
		createColumnHelper,
		createTable,
		FlexRender,
		renderComponent
	} from '@tanstack/svelte-table';
	import type { Snippet } from 'svelte';
	import SortableHeader from './SortableHeader.svelte';
	import TableSearch from './TableSearch.svelte';
	import { page } from '$app/state';

	let {
		data,
		columns: columnDefs,
		search = true,
		searchPlaceholder = 'Search…',
		searchClass = 'mb-4 max-w-sm',
		onSearchKeydown,
		onRowClick,
		filterRow
	}: {
		data: TData[];
		columns: DataTableColumn<TData>[];
		search?: boolean;
		searchPlaceholder?: string;
		searchClass?: string;
		onSearchKeydown?: (e: KeyboardEvent) => void;
		onRowClick?: (row: TData) => void;
		filterRow?: Snippet<[typeof table]>;
	} = $props();

	const helper = createColumnHelper<DataTableFeatures, TData>();

	function renderHeader(col: DataTableColumn<TData>) {
		if (col.header === undefined) return undefined;
		if (typeof col.header === 'function') return col.header;
		const label = col.header;
		return (h: HeaderContext<DataTableFeatures, TData, unknown>) =>
			renderComponent(SortableHeader, { label, header: h.header });
	}

	const columns = $derived(
		columnDefs.map((col) => {
			const id = col.id ?? col.accessorKey;
			if (!id) throw new Error('DataTable column requires an id or an accessorKey');
			const header = renderHeader(col);

			if (col.accessorKey) {
				const accessorKey = col.accessorKey;
				return helper.accessor((row) => row[accessorKey] as unknown, {
					id,
					header,
					cell: col.cell ?? ((ctx) => ctx.getValue() ?? '—'),
					enableSorting: col.sortable ?? true,
					enableGlobalFilter: col.enableGlobalFilter,
					filterFn: col.filterFn
				});
			}

			return helper.display({
				id,
				header,
				cell: col.cell,
				enableGlobalFilter: col.enableGlobalFilter
			});
		})
	);

	const table = createTable({
		features,
		get columns() {
			return columns;
		},
		get data() {
			return data;
		},
		initialState: { globalFilter: page.url.searchParams.get('search') ?? '' }
	});
</script>

{#if search}
	<TableSearch
		{table}
		placeholder={searchPlaceholder}
		class={searchClass}
		onkeydown={onSearchKeydown}
	/>
{/if}

<Table.Root>
	<Table.Header>
		{#each table.getHeaderGroups() as group (group.id)}
			<Table.Row>
				{#each group.headers as header (header.id)}
					<Table.Head>
						<FlexRender {header} />
					</Table.Head>
				{/each}
			</Table.Row>
		{/each}
		{#if filterRow}
			<Table.Row>
				{@render filterRow(table)}
			</Table.Row>
		{/if}
	</Table.Header>
	<Table.Body>
		{#each table.getRowModel().rows as row (row.id)}
			<Table.Row
				class={onRowClick ? 'cursor-pointer' : ''}
				onclick={onRowClick
					? (e: MouseEvent) => {
							if (!(e.target as HTMLElement).closest('[data-no-nav]')) onRowClick(row.original);
						}
					: undefined}
			>
				{#each row.getAllCells() as cell, i (cell.id)}
					<Table.Cell class={columnDefs[i].cellClass}>
						<FlexRender {cell} />
					</Table.Cell>
				{/each}
			</Table.Row>
		{/each}
	</Table.Body>
</Table.Root>
