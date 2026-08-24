<script lang="ts">
	import * as Table from '$lib/components/ui/table/index.js';
	import * as Tooltip from '$lib/components/ui/tooltip/index.js';
	import { Button } from '$lib/components/ui/button/index.js';

	import PageHeader from '$lib/components/PageHeader.svelte';

	let { data } = $props();

	let accountId = $state('');

	$effect(() => {
		if (data.accounts.length && !accountId) accountId = data.accounts[0].id;
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

	<Table.Root>
		<Table.Header>
			<Table.Row>
				<Table.Head>Account</Table.Head>
				<Table.Head>Symbol</Table.Head>
				<Table.Head class="text-right">Shares</Table.Head>
				<Table.Head class="w-10"></Table.Head>
			</Table.Row>
		</Table.Header>
		<Table.Body>
			{#each data.holdings as h (h.id)}
				<Table.Row>
					<Table.Cell>{h.accountName}</Table.Cell>
					<Table.Cell class="font-mono">{h.securitySymbol}</Table.Cell>
					<Table.Cell class="text-right">{h.shares}</Table.Cell>
				</Table.Row>
			{/each}
		</Table.Body>
	</Table.Root>
</div>
