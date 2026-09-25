<script lang="ts">
	import { resolve } from '$app/paths';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import ReportChart from '$lib/components/ReportChart.svelte';
	import { Button } from '$lib/components/ui/button/index.js';

	let { data } = $props();
</script>

<div class="p-6">
	<PageHeader>
		{#snippet actions()}
			<Button href={resolve('/reports/new')}>Create report</Button>
		{/snippet}
		<h1 class="text-2xl font-semibold">Reports</h1>
	</PageHeader>

	{#if data.reports.length === 0}
		<div class="max-w-2xl rounded-lg border bg-card p-6">
			<p class="py-8 text-center text-sm text-muted-foreground">
				No reports yet. Create a report to see it here.
			</p>
		</div>
	{:else}
		<div class="grid gap-6 md:grid-cols-2">
			{#each data.reports as savedReport (savedReport.id)}
				<ReportChart
					title={savedReport.title}
					holdings={data.holdings}
					config={savedReport.config}
				/>
			{/each}
		</div>
	{/if}
</div>
