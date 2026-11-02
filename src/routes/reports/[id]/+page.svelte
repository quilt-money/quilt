<script lang="ts">
	import ReportEditor from '$lib/components/reports/ReportEditor.svelte';

	let { data } = $props();
</script>

<!-- The editor copies the saved report into form state once, so rebuild it for each report. -->
{#key data.report.id}
	<ReportEditor
		mode="edit"
		initial={{ title: data.report.title, config: data.report.config }}
		holdings={data.holdings}
		priceHistory={data.priceHistory}
	/>
{/key}
