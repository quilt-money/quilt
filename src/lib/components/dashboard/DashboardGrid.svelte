<script lang="ts">
	import { DragDropProvider } from '@dnd-kit-svelte/svelte';
	import { Feedback, defaultPreset } from '@dnd-kit/dom';
	import DashboardWidget from '$lib/components/dashboard/DashboardWidget.svelte';
	import type { HoldingWithTags } from '$lib/server/db/queries/holdings';
	import type { PriceHistory } from '$lib/server/db/queries/price-history';
	import type { DashboardItem, DashboardItemLayout } from '$lib/server/db/queries/dashboard';

	const GRID_COLUMNS = 12;
	const ROW_HEIGHT_PX = 16;
	const GAP_PX = 16;
	const MIN_COLUMN_SPAN = 3;
	const MIN_ROW_SPAN = 6;
	/** Extra empty rows shown below existing content while editing, so there's visible room to drop into. */
	const EDIT_BUFFER_ROWS = 6;

	// The grid's own left/top update at drop time already places the widget in its final
	// spot, so dnd-kit's own spring-back-to-origin drop animation would otherwise fight it
	// and make the widget jank across the screen before settling. Disabling it lets our
	// state update be the only thing that moves the widget once it's dropped.
	const plugins = defaultPreset.plugins.map((plugin) =>
		plugin === Feedback ? Feedback.configure({ dropAnimation: null }) : plugin
	);

	let {
		items,
		editMode,
		holdings,
		priceHistory,
		onLayoutChange,
		onRemove
	}: {
		items: DashboardItem[];
		editMode: boolean;
		holdings: HoldingWithTags[];
		priceHistory: PriceHistory;
		onLayoutChange: (reportId: string, layout: DashboardItemLayout) => void;
		onRemove: (reportId: string) => void;
	} = $props();

	let containerWidthPx = $state(0);

	const columnWidthPx = $derived(
		containerWidthPx > 0 ? (containerWidthPx - GAP_PX * (GRID_COLUMNS - 1)) / GRID_COLUMNS : 0
	);

	const contentBottomRow = $derived(
		items.reduce((maxBottomRow, item) => Math.max(maxBottomRow, item.row + item.rowSpan), 0)
	);

	const displayRowCount = $derived(
		editMode ? contentBottomRow + EDIT_BUFFER_ROWS : contentBottomRow
	);

	const containerHeightPx = $derived(rowsToPixels(displayRowCount));

	const overlayColumns = $derived(Array.from({ length: GRID_COLUMNS }, (_, index) => index));
	const overlayRows = $derived(Array.from({ length: displayRowCount }, (_, index) => index));

	function rowsToPixels(rows: number): number {
		return rows * ROW_HEIGHT_PX + Math.max(0, rows - 1) * GAP_PX;
	}

	// Matches DashboardWidget's columnOffsetPx/rowOffsetPx exactly: an item's own left/top
	// is how many full cell+gap steps precede it, distinct from a span's total pixel size.
	function columnOffsetPx(column: number): number {
		return column * (columnWidthPx + GAP_PX);
	}

	function rowOffsetPx(row: number): number {
		return row * (ROW_HEIGHT_PX + GAP_PX);
	}

	function overlayCellStyle(columnIndex: number, rowIndex: number): string {
		return `left: ${columnOffsetPx(columnIndex)}px; top: ${rowOffsetPx(rowIndex)}px; width: ${columnWidthPx}px; height: ${ROW_HEIGHT_PX}px;`;
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

<DragDropProvider {plugins} onDragEnd={handleDragEnd}>
	<div class="relative" style:height="{containerHeightPx}px" bind:clientWidth={containerWidthPx}>
		{#if editMode}
			<div class="pointer-events-none absolute inset-0">
				{#each overlayColumns as columnIndex (columnIndex)}
					{#each overlayRows as rowIndex (rowIndex)}
						<div
							class="absolute rounded-sm border-2 border-foreground/30 bg-muted-foreground/15"
							style={overlayCellStyle(columnIndex, rowIndex)}
						></div>
					{/each}
				{/each}
			</div>
		{/if}
		{#each items as item (item.reportId)}
			<DashboardWidget
				{item}
				{editMode}
				{holdings}
				{priceHistory}
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
