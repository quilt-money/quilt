<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Table from '$lib/components/ui/table/index.js';
	import PageHeader from '$lib/components/PageHeader.svelte';

	let { data } = $props();
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
				{#each data.tags as t (t)}
					<span
						class="inline-flex items-center rounded-full bg-secondary px-2 py-0.5 text-xs font-medium"
					>
						{t}
					</span>
				{/each}
			</div>
		{/if}
	</PageHeader>

	<Table.Root>
		<Table.Header>
			<Table.Row>
				<Table.Head>Symbol</Table.Head>
				<Table.Head>Name</Table.Head>
				<Table.Head class="text-right">Shares</Table.Head>
			</Table.Row>
		</Table.Header>
		<Table.Body>
			{#each data.holdings as h (h.id)}
				<Table.Row>
					<Table.Cell class="font-mono">{h.symbol}</Table.Cell>
					<Table.Cell class="text-muted-foreground">{h.fullName ?? '—'}</Table.Cell>
					<Table.Cell class="text-right">{h.shares ?? '—'}</Table.Cell>
				</Table.Row>
			{:else}
				<Table.Row>
					<Table.Cell colspan={4} class="text-center text-muted-foreground py-8">
						No holdings yet.
					</Table.Cell>
				</Table.Row>
			{/each}
		</Table.Body>
	</Table.Root>
</div>
