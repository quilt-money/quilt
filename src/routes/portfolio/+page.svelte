<script lang="ts">
	import ArrowLeftIcon from '@lucide/svelte/icons/arrow-left';
	import XIcon from '@lucide/svelte/icons/x';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { Checkbox } from '$lib/components/ui/checkbox/index.js';
	import { renderComponent } from '@tanstack/svelte-table';
	import { SvelteSet } from 'svelte/reactivity';
	import type {
		DataTableColumn,
		DataTableFilterSummary
	} from '$lib/components/data-table/DataTable.svelte';
	import SecurityDetailTable from '$lib/components/data-table/SecurityDetailTable.svelte';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import TableSearch from '$lib/components/data-table/TableSearch.svelte';
	import { formatMoney } from '$lib/format';

	let { data } = $props();

	const fromDashboard = $derived(page.url.searchParams.get('fromDashboard') === 'true');

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
		selected = allSelected ? new Set() : new Set(data.holdings.map((r) => r.id));
	}

	function toggle(id: string) {
		const next = new SvelteSet(selected);
		if (next.has(id)) next.delete(id);
		else next.add(id);
		selected = next;
	}

	function sumValue(rs: HoldingRow[]) {
		return rs.reduce((sum, r) => sum + (r.totalValue ?? 0), 0);
	}

	const totalPortfolioValue = $derived(sumValue(data.holdings));

	const balanceLabel = $derived.by(() => {
		if (selected.size > 0) {
			return 'Selected balance';
		}
		return 'Balance in current view';
	});
	const balance = $derived(
		sumValue(selected.size > 0 ? filteredRows.filter((r) => selected.has(r.id)) : filteredRows)
	);

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
		{ accessorKey: 'accountName', header: 'Account', filterFn: 'arrHas' }
	];

	const trailingColumns: DataTableColumn<HoldingRow>[] = [
		{ accessorKey: 'shares', header: 'Shares' },
		{
			accessorKey: 'totalValue',
			header: 'Total value',
			cell: (ctx) => formatMoney(ctx.getValue() as number | null)
		}
	];

	const hasActiveFilters = $derived(
		activeFilters.search.length > 0 || activeFilters.columns.length > 0
	);
</script>

<div class="p-6">
	<PageHeader>
		{#snippet toolbar()}
			<TableSearch />
			<!-- Chips are shorter than the search input, so they fit this row without growing the header. -->
			{#if hasActiveFilters}
				<div class="flex flex-wrap items-center gap-2 border-l pl-3">
					<span class="text-sm font-medium text-muted-foreground">Filtered by</span>
					{#if activeFilters.search}
						<button
							type="button"
							class="flex items-center gap-1.5 rounded-full border bg-background px-3 py-1 text-sm font-medium hover:bg-accent"
							onclick={activeFilters.clearSearch}
						>
							Search: "{activeFilters.search}"
							<XIcon class="size-4" />
						</button>
					{/if}
					{#each activeFilters.columns as filter (filter.id)}
						<button
							type="button"
							class="flex items-center gap-1.5 rounded-full border bg-background px-3 py-1 text-sm font-medium hover:bg-accent"
							onclick={filter.clear}
						>
							{filter.label}: {filter.values.join(' and ')}
							<XIcon class="size-4" />
						</button>
					{/each}
				</div>
			{/if}
		{/snippet}
		<div class="flex items-start gap-2">
			{#if fromDashboard}
				<a
					href={resolve('/dashboard')}
					aria-label="Back to dashboard"
					class="flex size-8 items-center justify-center rounded-md hover:bg-accent"
				>
					<ArrowLeftIcon class="size-5" />
				</a>
			{/if}
			<div>
				<h1 class="text-2xl font-semibold">Portfolio</h1>
				<p class="text-sm font-medium text-muted-foreground">
					Total portfolio value: {formatMoney(totalPortfolioValue)}
				</p>
			</div>
		</div>
		<span class="text-sm font-medium">{balanceLabel} {formatMoney(balance)}</span>
	</PageHeader>

	<SecurityDetailTable
		data={data.holdings}
		{leadingColumns}
		{trailingColumns}
		bind:filteredData={filteredRows}
		bind:activeFilters
	/>
</div>
