<script lang="ts">
	import * as Table from '$lib/components/ui/table/index.js';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import { formatMoney } from '$lib/format';

	let { data } = $props();
</script>

<div class="p-6">
	<PageHeader>
		<h1 class="text-2xl font-semibold">{data.security.symbol}</h1>
		<p class="text-muted-foreground">{data.security.fullName ?? '—'}</p>
	</PageHeader>

	<dl class="mb-6 grid grid-cols-2 gap-x-8 gap-y-2 sm:grid-cols-4">
		<div>
			<dt class="text-sm text-muted-foreground">Latest price</dt>
			<dd>{formatMoney(data.latestPrice)}</dd>
		</div>
		<div>
			<dt class="text-sm text-muted-foreground">Type</dt>
			<dd>{data.security.type ?? '—'}</dd>
		</div>
		<div>
			<dt class="text-sm text-muted-foreground">Sector</dt>
			<dd>{data.security.sector ?? '—'}</dd>
		</div>
		<div>
			<dt class="text-sm text-muted-foreground">Region</dt>
			<dd>{data.security.region ?? '—'}</dd>
		</div>
	</dl>

	<Table.Root>
		<Table.Header>
			<Table.Row>
				<Table.Head>Account</Table.Head>
				<Table.Head class="text-right">Shares</Table.Head>
			</Table.Row>
		</Table.Header>
		<Table.Body>
			{#each data.holdings as h (h.id)}
				<Table.Row>
					<Table.Cell>{h.accountName}</Table.Cell>
					<Table.Cell class="text-right">{h.shares ?? '—'}</Table.Cell>
				</Table.Row>
			{:else}
				<Table.Row>
					<Table.Cell colspan={2} class="py-8 text-center text-muted-foreground">
						No accounts hold this security.
					</Table.Cell>
				</Table.Row>
			{/each}
		</Table.Body>
	</Table.Root>
</div>
