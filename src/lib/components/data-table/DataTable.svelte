<script module lang="ts">
	import {
		columnFacetingFeature,
		columnFilteringFeature,
		createFacetedRowModel,
		createFacetedUniqueValues,
		createFilteredRowModel,
		createSortedRowModel,
		filterFn_arrHas,
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
		filterFns: { arrHas: filterFn_arrHas },
		columnFacetingFeature,
		facetedRowModel: createFacetedRowModel(),
		facetedUniqueValues: createFacetedUniqueValues()
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
		/** Renders a filter icon in the header with a checkbox popover over the column's distinct values. */
		filterFn?: 'arrHas';
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
	import { onMount, untrack } from 'svelte';
	import SortableHeader from './SortableHeader.svelte';
	import TableSearch from './TableSearch.svelte';
	import { setSearchParam } from './url-search-param';
	import { page } from '$app/state';

	let {
		data,
		columns: columnDefs,
		search = true,
		searchPlaceholder = 'Search…',
		onSearchKeydown,
		onRowClick,
		// eslint-disable-next-line no-useless-assignment -- read by the parent via bind:filteredData
		filteredData = $bindable([])
	}: {
		data: TData[];
		columns: DataTableColumn<TData>[];
		search?: boolean;
		searchPlaceholder?: string;
		onSearchKeydown?: (e: KeyboardEvent) => void;
		onRowClick?: (row: TData) => void;
		/** Bind to receive the rows currently passing search/column filters, kept in sync as the user filters. */
		filteredData?: TData[];
	} = $props();

	const helper = createColumnHelper<DataTableFeatures, TData>();

	function renderHeader(col: DataTableColumn<TData>, id: string) {
		if (col.header === undefined) return undefined;
		if (typeof col.header === 'function') return col.header;
		const label = col.header;
		const filterable = Boolean(col.filterFn);
		return (h: HeaderContext<DataTableFeatures, TData, unknown>) =>
			renderComponent(SortableHeader, {
				label,
				header: h.header,
				filterable,
				onFilterChange: filterable
					? (value: string[] | undefined) => setFilter(id, value)
					: undefined
			});
	}

	const columns = $derived(
		columnDefs.map((col) => {
			const id = col.id ?? col.accessorKey;
			if (!id) throw new Error('DataTable column requires an id or an accessorKey');
			const header = renderHeader(col, id);

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

	const initialColumnFilters = untrack(() =>
		columnDefs
			.filter((col) => col.filterFn)
			.flatMap((col) => {
				const id = col.id ?? col.accessorKey!;
				const value = page.url.searchParams.get(id);
				return value ? [{ id, value: value.split(',') }] : [];
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
		initialState: {
			globalFilter: page.url.searchParams.get('search') ?? '',
			columnFilters: initialColumnFilters
		}
	});

	function setFilter(id: string, value: string[] | undefined) {
		table.getColumn(id)?.setFilterValue(value?.length ? value : undefined);
		setSearchParam(id, value?.length ? value.join(',') : undefined);
	}

	$effect(() => {
		filteredData = table.getRowModel().rows.map((row) => row.original);
	});

	let tableEl: HTMLTableElement | null = $state(null);
	let theadEl: HTMLTableSectionElement | null = $state(null);

	// Pin column widths to their initial (unfiltered) size so sorting/filtering/searching
	// never reflows the header — that would shift a header's controls out from under the pointer.
	onMount(() => {
		const headerRow = theadEl?.rows[0];
		if (!headerRow || !tableEl) return;
		for (const cell of headerRow.cells) {
			cell.style.width = `${cell.offsetWidth}px`;
		}
		tableEl.style.tableLayout = 'fixed';
	});
</script>

{#if search}
	<div class="mb-4 flex items-center gap-2">
		<TableSearch {table} placeholder={searchPlaceholder} onkeydown={onSearchKeydown} />
	</div>
{/if}

<Table.Root bind:ref={tableEl}>
	<Table.Header bind:ref={theadEl}>
		{#each table.getHeaderGroups() as group (group.id)}
			<Table.Row>
				{#each group.headers as header (header.id)}
					<Table.Head>
						<FlexRender {header} />
					</Table.Head>
				{/each}
			</Table.Row>
		{/each}
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
