<script lang="ts">
	import * as Tooltip from '$lib/components/ui/tooltip/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import DataTable, { type DataTableColumn } from '$lib/components/data-table/DataTable.svelte';
	import PageHeader from '$lib/components/PageHeader.svelte';

	let { data } = $props();

	const columns: DataTableColumn<(typeof data.holdings)[number]>[] = [
		{ accessorKey: 'accountName', header: 'Account' },
		{ accessorKey: 'securitySymbol', header: 'Symbol', cellClass: 'font-mono' },
		{ accessorKey: 'shares', header: 'Shares' }
	];
</script>

<div class="p-6">
	<PageHeader>
		<h1 class="text-2xl font-semibold">Holdings</h1>

		{#snippet actions()}
			{#if data.securities.length === 0}
				<Tooltip.Root>
					<Tooltip.Trigger>
						{#snippet child({ props })}
							<span {...props}>
								<Button disabled>Create holding</Button>
							</span>
						{/snippet}
					</Tooltip.Trigger>
					<Tooltip.Content>You need securities before creating holdings</Tooltip.Content>
				</Tooltip.Root>
			{/if}
		{/snippet}
	</PageHeader>

	<DataTable data={data.holdings} {columns} searchPlaceholder="Search holdings…" />
</div>
