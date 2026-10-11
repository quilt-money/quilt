<script lang="ts">
	import { enhance } from '$app/forms';
	import { toast } from 'svelte-sonner';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import ReportChart from '$lib/components/ReportChart.svelte';
	import ReportToolbar from '$lib/components/reports/ReportToolbar.svelte';
	import ReportFormFields from '$lib/components/reports/ReportFormFields.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import type {
		Metric,
		Dimension,
		ChartType,
		ReportFilters,
		ReportConfig
	} from '$lib/report-builder';

	let { data } = $props();

	let title = $state(data.report.title);
	let metric = $state<Metric>(data.report.config.metric);
	let dimension = $state<Dimension>(data.report.config.dimension);
	let chartType = $state<ChartType>(data.report.config.chartType);
	let filters = $state<ReportFilters>(data.report.config.filters);
	let titleError = $state<string | null>(null);
	let deleteOpen = $state(false);

	const config = $derived<ReportConfig>({ metric, dimension, chartType, filters });

	$effect(() => {
		if (titleError && title.trim().length > 0) titleError = null;
	});

	function validateTitle(): boolean {
		if (title.trim().length === 0) {
			titleError = 'Report name is required.';
			return false;
		}
		return true;
	}
</script>

<div class="p-6">
	<PageHeader>
		{#snippet actions()}
			<Button variant="destructive" onclick={() => (deleteOpen = true)}>Delete</Button>
			<Button type="submit" form="report-form">Update</Button>
		{/snippet}
		<h1 class="text-2xl font-semibold">{title || 'Untitled report'}</h1>
	</PageHeader>

	<ReportToolbar holdings={data.holdings} bind:chartType bind:filters />

	<div class="grid gap-6 lg:grid-cols-[320px_1fr]">
		<form
			id="report-form"
			method="POST"
			action="?/update"
			use:enhance={({ cancel }) => {
				if (!validateTitle()) cancel();
				return ({ result, update }) => {
					if (result.type === 'redirect') toast.success('Report updated');
					update();
				};
			}}
			class="flex flex-col gap-5 rounded-lg border bg-card p-5"
		>
			<ReportFormFields
				holdings={data.holdings}
				bind:title
				bind:metric
				bind:dimension
				bind:filters
				{titleError}
			/>

			<input type="hidden" name="config" value={JSON.stringify(config)} />
		</form>

		<ReportChart {title} holdings={data.holdings} {config} />
	</div>
</div>

<Dialog.Root bind:open={deleteOpen}>
	<Dialog.Portal>
		<Dialog.Overlay />
		<Dialog.Content>
			<Dialog.Header>
				<Dialog.Title>Delete report</Dialog.Title>
				<Dialog.Description>
					This will permanently delete "{data.report.title}" and remove it from any pages it's been
					added to. This action cannot be undone.
				</Dialog.Description>
			</Dialog.Header>

			<form
				method="POST"
				action="?/delete"
				use:enhance={() => {
					return ({ result, update }) => {
						if (result.type === 'redirect') toast.success('Report deleted');
						update();
					};
				}}
			>
				<Dialog.Footer>
					<Button type="button" variant="outline" onclick={() => (deleteOpen = false)}
						>Cancel</Button
					>
					<Button type="submit" variant="destructive">Delete</Button>
				</Dialog.Footer>
			</form>
		</Dialog.Content>
	</Dialog.Portal>
</Dialog.Root>
