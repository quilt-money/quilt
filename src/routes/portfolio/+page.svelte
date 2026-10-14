<script lang="ts">
	import { Checkbox } from '$lib/components/ui/checkbox/index.js';
	import { renderComponent, renderSnippet } from '@tanstack/svelte-table';
	import { SvelteSet } from 'svelte/reactivity';
	import type {
		DataTableColumn,
		DataTableFilterSummary
	} from '$lib/components/data-table/DataTable.svelte';
	import SecurityDetailTable from '$lib/components/data-table/SecurityDetailTable.svelte';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import PortfolioSummary from '$lib/components/portfolio/PortfolioSummary.svelte';
	import TableSearch from '$lib/components/data-table/TableSearch.svelte';
	import { formatMoney, formatPercent, gainLossClass } from '$lib/format';

	let { data } = $props();

	type HoldingRow = (typeof data.holdings)[number];

	let filteredRows = $state<HoldingRow[]>([]);
	let activeFilters = $state<DataTableFilterSummary>({
		search: '',
		clearSearch: () => {},
		columns: []
	});

	let selected = $state(new Set<string>());

	let allSelected = $derived(data.holdings.length > 0 && selected.size === data.holdings.length);

	function toggleAll() {
		selected = allSelected ? new Set() : new Set(data.holdings.map((holding) => holding.id));
	}

	function toggle(id: string) {
		const next = new SvelteSet(selected);
		if (next.has(id)) next.delete(id);
		else next.add(id);
		selected = next;
	}

	function sumValue(holdings: HoldingRow[]) {
		return holdings.reduce((sum, holding) => sum + (holding.totalValue ?? 0), 0);
	}

	const totalPortfolioValue = $derived(sumValue(data.holdings));

	const balanceLabel = $derived.by(() => {
		if (selected.size > 0) {
			return 'Selected balance';
		}
		return 'Balance in current view';
	});
	const balanceHoldings = $derived(
		selected.size > 0 ? filteredRows.filter((holding) => selected.has(holding.id)) : filteredRows
	);
	const balance = $derived(sumValue(balanceHoldings));

	const leadingColumns: DataTableColumn<HoldingRow>[] = [
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
					'aria-label': `Select ${ctx.row.original.symbol}`
				}),
			enableGlobalFilter: false
		},
		{ accessorKey: 'accountName', header: 'Account', filterFn: 'arrHas' },
		{
			accessorKey: 'tags',
			header: 'Tags',
			filterFn: 'arrIncludesSome',
			sortable: false,
			getUniqueValues: (row) => row.tags,
			cell: (ctx) => renderSnippet(tagsCell, ctx.getValue() as string[])
		}
	];

	const trailingColumns: DataTableColumn<HoldingRow>[] = [
		{ accessorKey: 'shares', header: 'Shares' },
		{
			accessorKey: 'totalValue',
			header: 'Total value',
			cell: (ctx) => formatMoney(ctx.getValue() as number | null)
		},
		{
			accessorKey: 'gainLoss',
			header: 'Gain/loss ($)',
			cell: (ctx) => renderSnippet(gainLossCell, { value: ctx.getValue() as number | null })
		},
		{
			accessorKey: 'gainLossPercent',
			header: 'Gain/loss (%)',
			cell: (ctx) =>
				renderSnippet(gainLossCell, { value: ctx.getValue() as number | null, percent: true })
		}
	];

	// A string so the effect below only reruns when the filters actually change,
	// not every time DataTable hands back a fresh activeFilters object.
	const filterKey = $derived(
		JSON.stringify([
			activeFilters.search,
			activeFilters.columns.map((filter) => [filter.id, filter.values])
		])
	);

	// Changing the search or filters clears the selection, so the selected balance never
	// includes rows that are no longer shown.
	$effect(() => {
		void filterKey;
		selected = new Set();
	});
</script>

{#snippet gainLossCell({ value, percent = false }: { value: number | null; percent?: boolean })}
	<span class={gainLossClass(value)}>
		{#if value != null && value > 0}+{/if}{percent ? formatPercent(value) : formatMoney(value)}
	</span>
{/snippet}

{#snippet tagsCell(tags: string[])}
	<div class="flex flex-wrap gap-1">
		{#each tags as tag (tag)}
			<span
				class="inline-flex items-center rounded-full bg-secondary px-2 py-0.5 text-xs font-medium"
			>
				{tag}
			</span>
		{:else}
			<span class="text-muted-foreground">—</span>
		{/each}
	</div>
{/snippet}

<div class="p-6">
	<PageHeader>
		{#snippet toolbar()}
			<TableSearch />
		{/snippet}
		<h1 class="text-2xl font-semibold">Portfolio</h1>
	</PageHeader>

	<PortfolioSummary
		totalValue={totalPortfolioValue}
		totalCount={data.holdings.length}
		{balanceLabel}
		{balance}
		balanceCount={balanceHoldings.length}
		{activeFilters}
	/>

	<SecurityDetailTable
		data={data.holdings}
		{leadingColumns}
		{trailingColumns}
		bind:filteredData={filteredRows}
		bind:activeFilters
	/>
</div>
