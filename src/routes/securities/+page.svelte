<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import { Checkbox } from '$lib/components/ui/checkbox/index.js';
	import { enhance } from '$app/forms';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import { SvelteSet } from 'svelte/reactivity';
	import { renderComponent } from '@tanstack/svelte-table';
	import DataTable, { type DataTableColumn } from '$lib/components/data-table/DataTable.svelte';
	import { formatMoney } from '$lib/format';

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
	const columns: DataTableColumn<SecurityRow>[] = [
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
					name: 'ids',
					value: ctx.row.original.id,
					checked: selected.has(ctx.row.original.id),
					onCheckedChange: () => toggle(ctx.row.original.id),
					'aria-label': `Select ${ctx.row.original.symbol}`
				}),
			enableGlobalFilter: false
		},
		{ accessorKey: 'symbol', header: 'Symbol', cellClass: 'font-mono' },
		{ accessorKey: 'fullName', header: 'Name' },
		{
			accessorKey: 'latestPrice',
			header: 'Latest price',
			cell: (ctx) => formatMoney(ctx.getValue() as number | null)
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
			<h1 class="text-2xl font-semibold">Securities</h1>
		</PageHeader>

		<DataTable
			data={data.securitiesWithPricesAndSyncTimes}
			{columns}
			searchPlaceholder="Search securities…"
			onSearchKeydown={(e) => {
				if (e.key === 'Enter') e.preventDefault();
			}}
		/>
	</form>
</div>
