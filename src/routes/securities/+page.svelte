<script lang="ts">
	import * as Table from '$lib/components/ui/table/index.js';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { enhance } from '$app/forms';
	import PageHeader from '$lib/components/PageHeader.svelte';

	let { data } = $props();

	let open = $state(false);
	let symbol = $state('');
	let fullName = $state('');
	let categoryId = $state('');
	let typeId = $state('');
	let sectorId = $state('');
	let industryId = $state('');
	let regionId = $state('');

	function resetForm() {
		symbol = '';
		fullName = '';
		categoryId = '';
		typeId = data.securityTypes[0]?.id ?? '';
		sectorId = '';
		industryId = '';
		regionId = data.regions[0]?.id ?? '';
	}
</script>

<div class="p-6">
	<PageHeader>
		{#snippet actions()}
			<Button onclick={() => (open = true)}>Create security</Button>
		{/snippet}
		<h1 class="text-2xl font-semibold">Securities</h1>
	</PageHeader>

	<Table.Root>
		<Table.Header>
			<Table.Row>
				<Table.Head>Symbol</Table.Head>
				<Table.Head>Name</Table.Head>
				<Table.Head>Category</Table.Head>
				<Table.Head>Type</Table.Head>
				<Table.Head>Sector</Table.Head>
				<Table.Head>Industry</Table.Head>
				<Table.Head>Region</Table.Head>
			</Table.Row>
		</Table.Header>
		<Table.Body>
			{#each data.securities as s (s.id)}
				<Table.Row>
					<Table.Cell class="font-mono">{s.symbol}</Table.Cell>
					<Table.Cell>{s.fullName ?? '—'}</Table.Cell>
					<Table.Cell>{s.category ?? '—'}</Table.Cell>
					<Table.Cell>{s.type ?? '—'}</Table.Cell>
					<Table.Cell>{s.sector ?? '—'}</Table.Cell>
					<Table.Cell>{s.industry ?? '—'}</Table.Cell>
					<Table.Cell>{s.region ?? '—'}</Table.Cell>
				</Table.Row>
			{/each}
		</Table.Body>
	</Table.Root>
</div>

<!-- Create security -->
<Dialog.Root bind:open>
	<Dialog.Portal>
		<Dialog.Overlay />
		<Dialog.Content>
			<Dialog.Header>
				<Dialog.Title>Create security</Dialog.Title>
			</Dialog.Header>

			<form
				method="POST"
				action="?/create"
				use:enhance={() => {
					return ({ result, update }) => {
						if (result.type === 'success' || result.type === 'redirect') {
							open = false;
							resetForm();
						}
						update();
					};
				}}
			>
				<div class="grid gap-4 py-4">
					<div class="grid gap-2">
						<Label for="symbol">Symbol</Label>
						<Input id="symbol" name="symbol" bind:value={symbol} placeholder="e.g. AAPL" required />
					</div>
					<div class="grid gap-2">
						<Label for="fullName">Name</Label>
						<Input
							id="fullName"
							name="fullName"
							bind:value={fullName}
							placeholder="e.g. Apple Inc."
						/>
					</div>
					<div class="grid gap-2">
						<Label for="typeId">Type</Label>
						<select
							id="typeId"
							name="typeId"
							bind:value={typeId}
							class="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
						>
							<option value="">—</option>
							{#each data.securityTypes as t (t.id)}
								<option value={t.id}>{t.name}</option>
							{/each}
						</select>
					</div>
					<div class="grid gap-2">
						<Label for="regionId">Region</Label>
						<select
							id="regionId"
							name="regionId"
							bind:value={regionId}
							class="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
						>
							<option value="">—</option>
							{#each data.regions as r (r.id)}
								<option value={r.id}>{r.name}</option>
							{/each}
						</select>
					</div>
					<div class="grid gap-2">
						<Label for="categoryId">Category</Label>
						<select
							id="categoryId"
							name="categoryId"
							bind:value={categoryId}
							class="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
						>
							<option value="">—</option>
							{#each data.categories as c (c.id)}
								<option value={c.id}>{c.name}</option>
							{/each}
						</select>
					</div>
					<div class="grid gap-2">
						<Label for="sectorId">Sector</Label>
						<select
							id="sectorId"
							name="sectorId"
							bind:value={sectorId}
							class="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
						>
							<option value="">—</option>
							{#each data.sectors as s (s.id)}
								<option value={s.id}>{s.name}</option>
							{/each}
						</select>
					</div>
					<div class="grid gap-2">
						<Label for="industryId">Industry</Label>
						<select
							id="industryId"
							name="industryId"
							bind:value={industryId}
							class="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
						>
							<option value="">—</option>
							{#each data.industries as i (i.id)}
								<option value={i.id}>{i.name}</option>
							{/each}
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
