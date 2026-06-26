<script lang="ts">
	import * as Table from '$lib/components/ui/table/index.js';

	let { data } = $props();
</script>

<div class="p-6">
	<div class="mb-6">
		<h1 class="text-2xl font-semibold">{data.account.name}</h1>
		<p class="text-sm text-muted-foreground">{data.account.owner}</p>
	</div>

	<Table.Root>
		<Table.Header>
			<Table.Row>
				<Table.Head>Symbol</Table.Head>
				<Table.Head>Name</Table.Head>
				<Table.Head class="text-right">Shares</Table.Head>
				<Table.Head class="text-right">Basis</Table.Head>
			</Table.Row>
		</Table.Header>
		<Table.Body>
			{#each data.holdings as h (h.id)}
				<Table.Row>
					<Table.Cell class="font-medium">{h.symbol}</Table.Cell>
					<Table.Cell class="text-muted-foreground">{h.fullName ?? '—'}</Table.Cell>
					<Table.Cell class="text-right">{h.shares ?? '—'}</Table.Cell>
					<Table.Cell class="text-right">{h.basis != null ? `$${h.basis.toLocaleString()}` : '—'}</Table.Cell>
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
