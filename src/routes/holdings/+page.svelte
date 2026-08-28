<script lang="ts">
	import * as Table from '$lib/components/ui/table/index.js';
	import * as Tooltip from '$lib/components/ui/tooltip/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import {
		columnFilteringFeature,
		createColumnHelper,
		createFilteredRowModel,
		createSortedRowModel,
		createTable,
		filterFn_equalsString,
		filterFn_includesString,
		FlexRender,
		globalFilteringFeature,
		renderComponent,
		rowSortingFeature,
		sortFn_alphanumeric,
		tableFeatures
	} from '@tanstack/svelte-table';
	import SortableHeader from '$lib/components/data-table/SortableHeader.svelte';
	import TableSearch from '$lib/components/data-table/TableSearch.svelte';

	import PageHeader from '$lib/components/PageHeader.svelte';

	let { data } = $props();

	let accountId = $state('');

	$effect(() => {
		if (data.accounts.length && !accountId) accountId = data.accounts[0].id;
	});

	const features = tableFeatures({
		rowSortingFeature,
		sortedRowModel: createSortedRowModel(),
		sortFns: { alphanumeric: sortFn_alphanumeric },
		columnFilteringFeature,
		globalFilteringFeature,
		filteredRowModel: createFilteredRowModel(),
		filterFns: { includesString: filterFn_includesString, equalsString: filterFn_equalsString }
	});

	const helper = createColumnHelper<typeof features, (typeof data.holdings)[number]>();
	const columns = helper.columns([
		helper.accessor('accountName', {
			header: (h) => renderComponent(SortableHeader, { label: 'Account', header: h.header })
		}),
		helper.accessor('securitySymbol', {
			header: (h) => renderComponent(SortableHeader, { label: 'Symbol', header: h.header }),
			cell: (ctx) => ctx.getValue() ?? '—'
		}),
		helper.accessor('shares', {
			header: (h) => renderComponent(SortableHeader, { label: 'Shares', header: h.header })
		}),
		helper.display({ id: 'actions' })
	]);

	const table = createTable({
		features,
		columns,
		get data() {
			return data.holdings;
		}
	});
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

	<TableSearch {table} placeholder="Search holdings…" class="mb-4 max-w-sm" />

	<Table.Root>
		<Table.Header>
			{#each table.getHeaderGroups() as group (group.id)}
				<Table.Row>
					{#each group.headers as header (header.id)}
						<Table.Head
							class={header.column.id === 'shares'
								? 'text-right'
								: header.column.id === 'actions'
									? 'w-10'
									: ''}
						>
							{#if !header.isPlaceholder}<FlexRender {header} />{/if}
						</Table.Head>
					{/each}
				</Table.Row>
			{/each}
		</Table.Header>
		<Table.Body>
			{#each table.getRowModel().rows as row (row.id)}
				<Table.Row>
					{#each row.getAllCells() as cell (cell.id)}
						<Table.Cell
							class={cell.column.id === 'securitySymbol'
								? 'font-mono'
								: cell.column.id === 'shares'
									? 'text-right'
									: ''}
						>
							<FlexRender {cell} />
						</Table.Cell>
					{/each}
				</Table.Row>
			{/each}
		</Table.Body>
	</Table.Root>
</div>
