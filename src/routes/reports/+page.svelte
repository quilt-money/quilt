<script lang="ts">
	import { resolve } from '$app/paths';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import DashboardGrid from '$lib/components/dashboard/DashboardGrid.svelte';
	import { Button, buttonVariants } from '$lib/components/ui/button/index.js';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
	import PencilIcon from '@lucide/svelte/icons/pencil';
	import CheckIcon from '@lucide/svelte/icons/check';
	import PlusIcon from '@lucide/svelte/icons/plus';
	import type { DashboardItem, DashboardItemLayout } from '$lib/server/db/queries/dashboard';

	const GRID_COLUMNS = 12;
	const DEFAULT_COLUMN_SPAN = 6;
	const DEFAULT_ROW_SPAN = 15;

	let { data } = $props();

	let editMode = $state(false);
	let items = $state<DashboardItem[]>(data.dashboardItems);

	const availableReports = $derived(
		data.reports.filter((savedReport) => !items.some((item) => item.reportId === savedReport.id))
	);

	function nextLayout(): DashboardItemLayout {
		const nextRow = items.reduce(
			(maxBottomRow, item) => Math.max(maxBottomRow, item.row + item.rowSpan),
			0
		);
		return {
			column: 0,
			row: nextRow,
			columnSpan: Math.min(DEFAULT_COLUMN_SPAN, GRID_COLUMNS),
			rowSpan: DEFAULT_ROW_SPAN
		};
	}

	async function addReport(savedReport: (typeof data.reports)[number]) {
		const layout = nextLayout();
		items = [
			...items,
			{ reportId: savedReport.id, title: savedReport.title, config: savedReport.config, ...layout }
		];

		const formData = new FormData();
		formData.set('reportId', savedReport.id);
		await fetch('?/add', { method: 'POST', body: formData });
	}

	async function removeReport(reportId: string) {
		items = items.filter((item) => item.reportId !== reportId);

		const formData = new FormData();
		formData.set('reportId', reportId);
		await fetch('?/remove', { method: 'POST', body: formData });
	}

	async function moveReport(reportId: string, layout: DashboardItemLayout) {
		items = items.map((item) => (item.reportId === reportId ? { ...item, ...layout } : item));

		const formData = new FormData();
		formData.set('reportId', reportId);
		formData.set('column', String(layout.column));
		formData.set('row', String(layout.row));
		formData.set('columnSpan', String(layout.columnSpan));
		formData.set('rowSpan', String(layout.rowSpan));
		await fetch('?/move', { method: 'POST', body: formData });
	}
</script>

<div class="p-6">
	<PageHeader>
		{#snippet actions()}
			<div class="flex items-center gap-2">
				{#if editMode}
					<DropdownMenu.Root>
						<DropdownMenu.Trigger class={buttonVariants({ variant: 'outline' })}>
							<PlusIcon class="size-4" />
							Add report
						</DropdownMenu.Trigger>
						<DropdownMenu.Content align="end">
							{#each availableReports as savedReport (savedReport.id)}
								<DropdownMenu.Item onSelect={() => addReport(savedReport)}>
									{savedReport.title}
								</DropdownMenu.Item>
							{:else}
								<DropdownMenu.Label>All reports are already on the page</DropdownMenu.Label>
							{/each}
						</DropdownMenu.Content>
					</DropdownMenu.Root>
				{/if}
				<Button variant="outline" onclick={() => (editMode = !editMode)}>
					{#if editMode}
						<CheckIcon class="size-4" />
						Done
					{:else}
						<PencilIcon class="size-4" />
						Edit layout
					{/if}
				</Button>
				{#if !editMode}
					<Button href={resolve('/reports/new')}>Create report</Button>
				{/if}
			</div>
		{/snippet}
		<h1 class="text-2xl font-semibold">Reports</h1>
	</PageHeader>

	{#if items.length === 0}
		<div class="max-w-2xl rounded-lg border bg-card p-6">
			<p class="py-8 text-center text-sm text-muted-foreground">
				{editMode
					? 'Use "Add report" above to put a saved report on this page.'
					: 'No reports on this page yet. Create a report and then click "Edit layout" to add one.'}
			</p>
		</div>
	{:else}
		<DashboardGrid
			{items}
			{editMode}
			holdings={data.holdings}
			onLayoutChange={moveReport}
			onRemove={removeReport}
		/>
	{/if}
</div>
