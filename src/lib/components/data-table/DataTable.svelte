<script module lang="ts">
	import {
		columnFacetingFeature,
		columnFilteringFeature,
		createFacetedRowModel,
		createFacetedUniqueValues,
		createFilteredRowModel,
		createSortedRowModel,
		filterFn_arrHas,
		filterFn_arrIncludesSome,
		globalFilteringFeature,
		rowSortingFeature,
		sortFn_alphanumeric,
		tableFeatures,
		type CellContext,
		type HeaderContext
	} from '@tanstack/svelte-table';
	import {
		parseAsArrayOf,
		parseAsString,
		parseAsStringEnum,
		useQueryState,
		useQueryStates
	} from 'nuqs-svelte';

	const features = tableFeatures({
		rowSortingFeature,
		sortedRowModel: createSortedRowModel(),
		sortFns: { alphanumeric: sortFn_alphanumeric },
		columnFilteringFeature,
		globalFilteringFeature,
		filteredRowModel: createFilteredRowModel(),
		filterFns: { arrHas: filterFn_arrHas, arrIncludesSome: filterFn_arrIncludesSome },
		columnFacetingFeature,
		facetedRowModel: createFacetedRowModel(),
		facetedUniqueValues: createFacetedUniqueValues()
	});

	export type DataTableFeatures = typeof features;

	export type DataTableFilterSummary = {
		search: string;
		clearSearch: () => void;
		columns: { id: string; label: string; values: string[]; clear: () => void }[];
	};

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
		/** Renders a row at the bottom of the table. Omit for a blank footer cell. */
		footer?: string | ((ctx: HeaderContext<DataTableFeatures, TData, unknown>) => unknown);
		filterFn?: 'arrHas' | 'arrIncludesSome';
		getUniqueValues?: (row: TData) => readonly string[];
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

	let {
		data,
		columns: columnDefs,
		onRowClick,
		// eslint-disable-next-line no-useless-assignment -- read by the parent via bind:filteredData
		filteredData = $bindable([]),
		// eslint-disable-next-line no-useless-assignment -- read by the parent via bind:activeFilters
		activeFilters = $bindable({ search: '', clearSearch: () => {}, columns: [] })
	}: {
		data: TData[];
		columns: DataTableColumn<TData>[];
		onRowClick?: (row: TData) => void;
		/** Bind to receive the rows currently passing search/column filters, kept in sync as the user filters. */
		filteredData?: TData[];
		/** Bind to receive the current search text and active column filters, kept in sync as the user filters. */
		activeFilters?: DataTableFilterSummary;
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
					footer: col.footer,
					cell: col.cell ?? ((ctx) => ctx.getValue() ?? '—'),
					enableSorting: col.sortable ?? true,
					enableGlobalFilter: col.enableGlobalFilter,
					filterFn: col.filterFn,
					getUniqueValues: col.getUniqueValues
				});
			}

			return helper.display({
				id,
				header,
				footer: col.footer,
				cell: col.cell,
				enableGlobalFilter: col.enableGlobalFilter
			});
		})
	);

	const filterableColumnIds = untrack(() =>
		columnDefs.filter((col) => col.filterFn).map((col) => col.id ?? col.accessorKey!)
	);

	const hasFooter = $derived(columnDefs.some((col) => col.footer !== undefined));

	const columnFilterParams = useQueryStates(
		Object.fromEntries(filterableColumnIds.map((id) => [id, parseAsArrayOf(parseAsString)]))
	);

	const sortParams = useQueryStates({
		sort: parseAsString,
		direction: parseAsStringEnum(['asc', 'desc'] as const)
	});

	const searchParam = useQueryState('search', { defaultValue: '' });

	function columnFiltersFromParams() {
		return filterableColumnIds.flatMap((id) => {
			const value = columnFilterParams[id].current;
			return value?.length ? [{ id, value }] : [];
		});
	}

	function sortingFromParams() {
		const id = sortParams.sort.current;
		if (!id) return [];
		return [{ id, desc: sortParams.direction.current === 'desc' }];
	}

	const table = createTable({
		features,
		get columns() {
			return columns;
		},
		get data() {
			return data;
		},
		state: {
			get globalFilter() {
				return searchParam.current;
			},
			get columnFilters() {
				return columnFiltersFromParams();
			},
			get sorting() {
				return sortingFromParams();
			}
		},
		onGlobalFilterChange: (updater) => {
			const next = typeof updater === 'function' ? updater(searchParam.current) : updater;
			searchParam.current = next ?? '';
		},
		onColumnFiltersChange: (updater) => {
			const current = columnFiltersFromParams();
			const next = typeof updater === 'function' ? updater(current) : updater;
			for (const id of filterableColumnIds) {
				const value = next.find((f) => f.id === id)?.value as string[] | undefined;
				columnFilterParams[id].current = value?.length ? value : null;
			}
		},
		onSortingChange: (updater) => {
			const current = sortingFromParams();
			const next = typeof updater === 'function' ? updater(current) : updater;
			const [sort] = next;
			sortParams.set({
				sort: sort?.id ?? null,
				direction: sort ? (sort.desc ? 'desc' : 'asc') : null
			});
		}
	});

	function setFilter(id: string, value: string[] | undefined) {
		table.getColumn(id)?.setFilterValue(value?.length ? value : undefined);
	}

	$effect(() => {
		filteredData = table.getRowModel().rows.map((row) => row.original);
	});

	$effect(() => {
		const columnFilters = table.atoms.columnFilters.get();
		activeFilters = {
			search: (table.atoms.globalFilter.get() as string | undefined) ?? '',
			clearSearch: () => table.setGlobalFilter(''),
			columns: columnFilters.flatMap((f) => {
				const values = f.value as string[] | undefined;
				if (!values?.length) return [];
				const header = columnDefs.find((c) => (c.id ?? c.accessorKey) === f.id)?.header;
				const label = typeof header === 'string' ? header : f.id;
				return [{ id: f.id, label, values, clear: () => setFilter(f.id, undefined) }];
			})
		};
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
	{#if hasFooter}
		<Table.Footer>
			{#each table.getFooterGroups() as group (group.id)}
				<Table.Row>
					{#each group.headers as footer (footer.id)}
						<Table.Cell>
							<FlexRender {footer} />
						</Table.Cell>
					{/each}
				</Table.Row>
			{/each}
		</Table.Footer>
	{/if}
</Table.Root>
