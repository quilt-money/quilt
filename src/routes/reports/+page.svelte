<script lang="ts">
	import { resolve } from '$app/paths';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
</script>

<div class="p-6">
	<PageHeader>
		{#snippet actions()}
			<Button href={resolve('/reports/new')}>Create report</Button>
		{/snippet}
		<h1 class="text-2xl font-semibold">Reports</h1>
	</PageHeader>

	<div class="max-w-2xl rounded-lg border bg-card p-6">
		<p class="py-8 text-center text-sm text-muted-foreground">
			No reports yet. Create a report to see it here.
		</p>
	</div>
</div>
