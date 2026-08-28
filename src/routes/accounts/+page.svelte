<script lang="ts">
	import * as Table from '$lib/components/ui/table/index.js';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';
	import TagInput from '$lib/components/TagInput.svelte';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import { resolve } from '$app/paths';
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

	let { data } = $props();

	let open = $state(false);
	let name = $state('');
	let owner = $state('Dan');
	let tagInput = $state<ReturnType<typeof TagInput> | undefined>(undefined);

	const features = tableFeatures({
		rowSortingFeature,
		sortedRowModel: createSortedRowModel(),
		sortFns: { alphanumeric: sortFn_alphanumeric },
		columnFilteringFeature,
		globalFilteringFeature,
		filteredRowModel: createFilteredRowModel(),
		filterFns: { includesString: filterFn_includesString, equalsString: filterFn_equalsString }
	});

	const helper = createColumnHelper<typeof features, (typeof data.accounts)[number]>();
	const columns = helper.columns([
		helper.accessor('name', {
			header: (h) => renderComponent(SortableHeader, { label: 'Name', header: h.header })
		}),
		helper.accessor('owner', {
			header: (h) => renderComponent(SortableHeader, { label: 'Owner', header: h.header })
		})
	]);

	const table = createTable({
		features,
		columns,
		get data() {
			return data.accounts;
		}
	});
</script>

<div class="p-6">
	<PageHeader>
		{#snippet actions()}
			<Button onclick={() => (open = true)}>Create account</Button>
		{/snippet}
		<h1 class="text-2xl font-semibold">Accounts</h1>
	</PageHeader>

	<TableSearch {table} placeholder="Search accounts…" class="mb-4 max-w-sm" />

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
		</Table.Header>
		<Table.Body>
			{#each table.getRowModel().rows as row (row.id)}
				<Table.Row
					class="cursor-pointer"
					onclick={(e) => {
						if (!(e.target as HTMLElement).closest('[data-no-nav]')) {
							goto(resolve(`/accounts/${row.original.id}`));
						}
					}}
				>
					{#each row.getAllCells() as cell (cell.id)}
						<Table.Cell><FlexRender {cell} /></Table.Cell>
					{/each}
				</Table.Row>
			{/each}
		</Table.Body>
	</Table.Root>
</div>

<Dialog.Root bind:open>
	<Dialog.Portal>
		<Dialog.Overlay />
		<Dialog.Content>
			<Dialog.Header>
				<Dialog.Title>Create account</Dialog.Title>
			</Dialog.Header>

			<form
				method="POST"
				action="?/create"
				use:enhance={() => {
					return ({ result, update }) => {
						if (result.type === 'success' || result.type === 'redirect') {
							open = false;
							name = '';
							owner = 'Dan';
							tagInput?.reset();
						}
						update();
					};
				}}
			>
				<div class="grid gap-4 py-4">
					<div class="grid gap-2">
						<Label for="name">Account name</Label>
						<Input id="name" name="name" bind:value={name} placeholder="e.g. Roth IRA" required />
					</div>
					<div class="grid gap-2">
						<Label>Tags</Label>
						<TagInput bind:this={tagInput} availableTags={data.tags.map((t) => t.name)} />
					</div>
					<div class="grid gap-2">
						<Label for="owner">Owner</Label>
						<select
							id="owner"
							name="owner"
							bind:value={owner}
							class="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
						>
							<option value="Dan">Dan</option>
							<option value="Emily">Emily</option>
						</select>
					</div>
				</div>

				<Dialog.Footer>
					<Button type="button" variant="outline" onclick={() => (open = false)}>Cancel</Button>
					<Button type="submit">Create</Button>
				</Dialog.Footer>
			</form>
		</Dialog.Content>
	</Dialog.Portal>
</Dialog.Root>
