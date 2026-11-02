<script lang="ts">
	import PageHeader from '$lib/components/PageHeader.svelte';
	import ReportEditor from '$lib/components/reports/ReportEditor.svelte';
	import { defaultReportConfig, defaultTimeReportConfig } from '$lib/report-builder';

	let { data } = $props();

	const initialConfig = $derived(
		data.reportType === 'time'
			? defaultTimeReportConfig(data.holdings)
			: defaultReportConfig(data.holdings)
	);
</script>

{#if data.reportType === 'summary'}
	<div class="p-4 sm:p-6">
		<PageHeader>
			<h1 class="truncate text-xl font-semibold sm:text-2xl">New report</h1>
		</PageHeader>
		<div class="max-w-2xl rounded-lg border bg-card p-4 sm:p-6">
			<p class="py-8 text-center text-sm text-muted-foreground">
				Summary reports are not available yet.
			</p>
		</div>
	</div>
{:else}
	{#key data.reportType}
		<ReportEditor
			mode="create"
			initial={{ title: 'Untitled report', config: initialConfig }}
			holdings={data.holdings}
			priceHistory={data.priceHistory}
		/>
	{/key}
{/if}
