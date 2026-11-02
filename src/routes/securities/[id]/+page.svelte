<script lang="ts">
	import * as Table from '$lib/components/ui/table/index.js';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import * as Drawer from '$lib/components/ui/drawer/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import TimeSeriesGraph from '$lib/components/TimeSeriesGraph.svelte';
	import TagInput from '$lib/components/TagInput.svelte';
	import { formatMoney, percentChangeOverPeriod } from '$lib/format';
	import { enhance } from '$app/forms';
	import { untrack } from 'svelte';
	import { toast } from 'svelte-sonner';
	import { portfolioHref } from '$lib/portfolio-filter';

	let { data } = $props();

	const pricePoints = $derived(
		data.priceHistory.map((pricePoint) => ({ time: pricePoint.time, value: pricePoint.price }))
	);

	let open = $state(false);
	let deleteOpen = $state(false);
	let typeId = $state(untrack(() => data.security.typeId ?? ''));
	let sectorId = $state(untrack(() => data.security.sectorId ?? ''));
	let regionId = $state(untrack(() => data.security.regionId ?? ''));

	$effect(() => {
		if (open) {
			typeId = data.security.typeId ?? '';
			sectorId = data.security.sectorId ?? '';
			regionId = data.security.regionId ?? '';
		}
	});

	function nameOf(options: { id: string; name: string }[], id: string | null) {
		return options.find((o) => o.id === id)?.name ?? '—';
	}

	const accountsHolding = $derived(
		[...new Map(data.holdings.map((h) => [h.accountId, h.accountName])).entries()].map(
			([id, name]) => ({ id, name })
		)
	);

	const selectClass =
		'h-11 w-full appearance-none rounded-md border border-input bg-transparent px-4 pr-10 text-base shadow-xs transition-colors outline-none hover:border-ring focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30';
</script>

{#snippet attributeSelect(
	label: string,
	name: string,
	value: string,
	onValueChange: (v: string) => void,
	options: { id: string; name: string }[]
)}
	<div>
		<label class="text-sm font-medium text-muted-foreground" for={name}>{label}</label>
		<select
			id={name}
			{name}
			{value}
			onchange={(e) => onValueChange(e.currentTarget.value)}
			class="{selectClass} mt-1.5"
		>
			<option value="">—</option>
			{#each options as o (o.id)}
				<option value={o.id}>{o.name}</option>
			{/each}
		</select>
	</div>
{/snippet}

<div class="p-6">
	<PageHeader>
		{#snippet actions()}
			<Button variant="outline" onclick={() => (open = true)}>Edit</Button>
			<Button variant="destructive" onclick={() => (deleteOpen = true)}>Delete</Button>
		{/snippet}
		<div class="flex items-baseline gap-3">
			<h1 class="text-2xl font-semibold">{data.security.symbol}</h1>
		</div>
		<p class="text-muted-foreground">{data.security.fullName ?? '—'}</p>
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

	<div class="mb-6">
		<TimeSeriesGraph
			heading=""
			title={`Latest price: ${formatMoney(pricePoints.at(-1)?.value)}`}
			changeOverPeriod={percentChangeOverPeriod(pricePoints.map((pricePoint) => pricePoint.value))}
			points={pricePoints}
			seriesName="Price"
			emptyMessage="No price history yet. Sync to add one."
		/>
	</div>

	<Table.Root>
		<Table.Header>
			<Table.Row>
				<Table.Head>Type</Table.Head>
				<Table.Head>Sector</Table.Head>
				<Table.Head>Region</Table.Head>
				<Table.Head>Accounts</Table.Head>
			</Table.Row>
		</Table.Header>
		<Table.Body>
			<Table.Row>
				<Table.Cell>{nameOf(data.securityTypes, data.security.typeId)}</Table.Cell>
				<Table.Cell>{nameOf(data.sectors, data.security.sectorId)}</Table.Cell>
				<Table.Cell>{nameOf(data.regions, data.security.regionId)}</Table.Cell>
				<Table.Cell>
					<div class="flex flex-wrap gap-1">
						{#each accountsHolding as account (account.id)}
							<a
								href={portfolioHref(account.name, data.security.symbol)}
								class="inline-flex items-center rounded-full bg-secondary px-2 py-0.5 text-xs font-medium hover:bg-secondary/80"
							>
								{account.name}
							</a>
						{:else}
							<span class="text-muted-foreground">—</span>
						{/each}
					</div>
				</Table.Cell>
			</Table.Row>
		</Table.Body>
	</Table.Root>
</div>

<Drawer.Root bind:open direction="right">
	<Drawer.Content>
		<form
			method="POST"
			action="?/update"
			class="flex h-full flex-col overflow-y-auto"
			use:enhance={() => {
				return ({ result, update }) => {
					if (result.type === 'success' || result.type === 'redirect') {
						open = false;
						toast.success('Security updated');
					}
					update();
				};
			}}
		>
			<Drawer.Header>
				<Drawer.Title>Edit {data.security.symbol}</Drawer.Title>
				<Drawer.Description
					>Update this security's type, sector, region, and tags.</Drawer.Description
				>
			</Drawer.Header>

			<div class="flex flex-col gap-4 px-4">
				{@render attributeSelect('Type', 'typeId', typeId, (v) => (typeId = v), data.securityTypes)}
				{@render attributeSelect(
					'Sector',
					'sectorId',
					sectorId,
					(v) => (sectorId = v),
					data.sectors
				)}
				{@render attributeSelect(
					'Region',
					'regionId',
					regionId,
					(v) => (regionId = v),
					data.regions
				)}
				<div>
					<Label>Tags</Label>
					{#key open}
						<div class="mt-1.5">
							<TagInput availableTags={data.allTags} initialTags={data.tags} />
						</div>
					{/key}
				</div>
			</div>

			<Drawer.Footer>
				<Button type="submit">Save</Button>
				<Drawer.Close>
					{#snippet child({ props })}
						<Button type="button" variant="outline" {...props}>Cancel</Button>
					{/snippet}
				</Drawer.Close>
			</Drawer.Footer>
		</form>
	</Drawer.Content>
</Drawer.Root>

<Dialog.Root bind:open={deleteOpen}>
	<Dialog.Content>
		<form method="POST" action="?/delete" use:enhance class="flex flex-col gap-4">
			<Dialog.Header>
				<Dialog.Title>Delete {data.security.symbol}?</Dialog.Title>
				<Dialog.Description>
					This permanently deletes the security, its price history, and holdings across accounts.
					{data.security.symbol} is used by {data.holdings.length} holdings.
				</Dialog.Description>
			</Dialog.Header>
			<Dialog.Footer>
				<Button type="button" variant="outline" onclick={() => (deleteOpen = false)}>Cancel</Button>
				<Button type="submit" variant="destructive">Delete</Button>
			</Dialog.Footer>
		</form>
	</Dialog.Content>
</Dialog.Root>
