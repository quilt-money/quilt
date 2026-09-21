<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import SecurityDetailTable from '$lib/components/data-table/SecurityDetailTable.svelte';
	import type { DataTableColumn } from '$lib/components/data-table/DataTable.svelte';
	import { formatMoney } from '$lib/format';

	let { data } = $props();

	type HoldingRow = (typeof data.holdings)[number];

	const trailingColumns: DataTableColumn<HoldingRow>[] = [
		{ accessorKey: 'shares', header: 'Shares' },
		{
			accessorKey: 'totalValue',
			header: 'Total value',
			cell: (ctx) => formatMoney(ctx.getValue() as number | null)
		}
	];
</script>

<div class="p-6">
	<PageHeader>
		{#snippet actions()}
			<Button href="/accounts/{data.account.id}/upload">Upload</Button>
			<Button href="/rec/{data.account.id}/upload" disabled={true}>Reconcile</Button>

			<Button href="/accounts/{data.account.id}/delete" disabled={true} variant="destructive"
				>Delete</Button
			>
		{/snippet}
		<h1 class="text-2xl font-semibold">{data.account.name}</h1>
		{#if data.tags.length > 0}
			<div class="mt-1 flex flex-wrap gap-1">
				{#each data.tags as tag (tag)}
					<span
						class="inline-flex items-center rounded-full bg-secondary px-2 py-0.5 text-xs font-medium"
					>
						{tag}
					</span>
				{/each}
			</div>
		{/if}
	</PageHeader>

	<SecurityDetailTable
		data={data.holdings}
		{trailingColumns}
		searchPlaceholder={`Search holdings for ${data.account.name}...`}
	/>
</div>
