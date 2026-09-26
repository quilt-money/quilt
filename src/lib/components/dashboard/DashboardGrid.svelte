<script lang="ts">
	import { DragDropProvider } from '@dnd-kit-svelte/svelte';
	import DashboardWidget from '$lib/components/dashboard/DashboardWidget.svelte';
	import type { HoldingWithTags } from '$lib/server/db/queries/holdings';
	import type { DashboardItem, DashboardItemLayout } from '$lib/server/db/queries/dashboard';

	const GRID_COLUMNS = 12;
	const ROW_HEIGHT_PX = 16;
	const GAP_PX = 16;
	const MIN_COLUMN_SPAN = 3;
	const MIN_ROW_SPAN = 6;

	let {
		items,
		editMode,
		holdings,
		onLayoutChange,
		onRemove
	}: {
		items: DashboardItem[];
		editMode: boolean;
		holdings: HoldingWithTags[];
		onLayoutChange: (reportId: string, layout: DashboardItemLayout) => void;
		onRemove: (reportId: string) => void;
	} = $props();

	let containerWidthPx = $state(0);

	const columnWidthPx = $derived(
		containerWidthPx > 0 ? (containerWidthPx - GAP_PX * (GRID_COLUMNS - 1)) / GRID_COLUMNS : 0
	);

	const containerHeightPx = $derived(
		items.reduce(
			(maxBottomPx, item) => Math.max(maxBottomPx, rowsToPixels(item.row + item.rowSpan)),
			0
		)
	);

	function rowsToPixels(rows: number): number {
		return rows * ROW_HEIGHT_PX + Math.max(0, rows - 1) * GAP_PX;
	}

	function clamp(value: number, min: number, max: number): number {
		return Math.min(Math.max(value, min), Math.max(min, max));
	}

	function handleDragEnd(event: {
		operation: { source: { id: unknown } | null; transform: { x: number; y: number } };
		canceled: boolean;
	}) {
		if (event.canceled) return;

		const reportId = event.operation.source?.id;
		if (typeof reportId !== 'string') return;

		const item = items.find((candidate) => candidate.reportId === reportId);
		if (!item) return;

		const deltaColumns = Math.round(event.operation.transform.x / (columnWidthPx + GAP_PX));
		const deltaRows = Math.round(event.operation.transform.y / (ROW_HEIGHT_PX + GAP_PX));
		const nextColumn = clamp(item.column + deltaColumns, 0, GRID_COLUMNS - item.columnSpan);
		const nextRow = Math.max(0, item.row + deltaRows);

		if (nextColumn !== item.column || nextRow !== item.row) {
			onLayoutChange(item.reportId, {
				column: nextColumn,
				row: nextRow,
				columnSpan: item.columnSpan,
				rowSpan: item.rowSpan
			});
		}
	}
</script>

<DragDropProvider onDragEnd={handleDragEnd}>
	<div class="relative" style:height="{containerHeightPx}px" bind:clientWidth={containerWidthPx}>
		{#each items as item (item.reportId)}
			<DashboardWidget
				{item}
				{editMode}
				{holdings}
				{columnWidthPx}
				rowHeightPx={ROW_HEIGHT_PX}
				gapPx={GAP_PX}
				gridColumns={GRID_COLUMNS}
				minColumnSpan={MIN_COLUMN_SPAN}
				minRowSpan={MIN_ROW_SPAN}
				{onLayoutChange}
				{onRemove}
			/>
		{/each}
	</div>
</DragDropProvider>
