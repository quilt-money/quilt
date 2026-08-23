<script lang="ts">
	import * as Table from '$lib/components/ui/table/index.js';
	import PageHeader from '$lib/components/PageHeader.svelte';

	let { data } = $props();
</script>

<div class="p-6">
	<PageHeader>
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
