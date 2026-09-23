<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import { Checkbox } from '$lib/components/ui/checkbox/index.js';
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import { SvelteSet } from 'svelte/reactivity';
	import { renderComponent, renderSnippet } from '@tanstack/svelte-table';
	import type { DataTableColumn } from '$lib/components/data-table/DataTable.svelte';
	import SecurityDetailTable from '$lib/components/data-table/SecurityDetailTable.svelte';
	import TableSearch from '$lib/components/data-table/TableSearch.svelte';
	import { formatMoney } from '$lib/format';
	import { portfolioHref } from '$lib/portfolio-filter';

	let { data } = $props();

	let selected = $state(new Set<string>());
	let syncing = $state(false);

	let allSelected = $derived(
		data.securitiesWithPricesAndSyncTimes.length > 0 &&
			selected.size === data.securitiesWithPricesAndSyncTimes.length
	);

	function toggleAll() {
		selected = allSelected
			? new Set()
			: new Set(data.securitiesWithPricesAndSyncTimes.map((s) => s.id));
	}

	function toggle(id: string) {
		const next = new SvelteSet(selected);
		if (next.has(id)) next.delete(id);
		else next.add(id);
		selected = next;
	}

	type SecurityRow = (typeof data.securitiesWithPricesAndSyncTimes)[number];
	const leadingColumns: DataTableColumn<SecurityRow>[] = [
		{
			id: 'select',
			header: () =>
				renderComponent(Checkbox, {
					checked: allSelected,
					onCheckedChange: toggleAll,
					'aria-label': 'Select all',
					'data-no-nav': true
				}),
			cell: (ctx) =>
				renderComponent(Checkbox, {
					name: 'ids',
					value: ctx.row.original.id,
					checked: selected.has(ctx.row.original.id),
					onCheckedChange: () => toggle(ctx.row.original.id),
					'aria-label': `Select ${ctx.row.original.symbol}`,
					'data-no-nav': true
				}),
			enableGlobalFilter: false
		}
	];

	const trailingColumns: DataTableColumn<SecurityRow>[] = [
		{
			accessorKey: 'latestPrice',
			header: 'Latest price',
			cell: (ctx) => formatMoney(ctx.getValue() as number | null)
		},
		{
			accessorKey: 'accounts',
			header: 'Accounts',
			enableGlobalFilter: false,
			cell: (ctx) =>
				renderSnippet(accountsCell, {
					accounts: ctx.getValue() as { id: string; name: string }[],
					symbol: ctx.row.original.symbol
				})
		},
		{
			accessorKey: 'lastSynced',
			header: 'Last synced',
			cell: (ctx) => {
				const v = ctx.getValue() as string | null;
				return v != null ? new Date(v).toLocaleString() : '—';
			}
		}
	];
</script>

{#snippet accountsCell({
	accounts,
	symbol
}: {
	accounts: { id: string; name: string }[];
	symbol: string;
})}
	<div class="flex flex-wrap gap-1" data-no-nav>
		{#each accounts as account (account.id)}
			<a
				href={portfolioHref(account.name, symbol)}
				class="inline-flex items-center rounded-full bg-secondary px-2 py-0.5 text-xs font-medium hover:bg-secondary/80"
			>
				{account.name}
			</a>
		{:else}
			<span class="text-muted-foreground">—</span>
		{/each}
	</div>
{/snippet}

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
			{/snippet}
			{#snippet toolbar()}
				<TableSearch placeholder="Search securities…" />
			{/snippet}
			<h1 class="text-2xl font-semibold">Securities</h1>
		</PageHeader>

		<SecurityDetailTable
			data={data.securitiesWithPricesAndSyncTimes}
			{leadingColumns}
			{trailingColumns}
			onRowClick={(row) => goto(resolve(`/securities/${row.id}`))}
		/>
	</form>
</div>
