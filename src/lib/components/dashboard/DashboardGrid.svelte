<script lang="ts">
	import GripIcon from '@lucide/svelte/icons/grip-vertical';
	import Trash2Icon from '@lucide/svelte/icons/trash-2';
	import ReportChart from '$lib/components/ReportChart.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
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

	function columnsToPixels(columns: number): number {
		return columns * columnWidthPx + Math.max(0, columns - 1) * GAP_PX;
	}

	function clamp(value: number, min: number, max: number): number {
		return Math.min(Math.max(value, min), Math.max(min, max));
	}

	type DragState = {
		kind: 'move' | 'resize';
		reportId: string;
		pointerId: number;
		startClientX: number;
		startClientY: number;
		startLayout: DashboardItemLayout;
		offsetXPx: number;
		offsetYPx: number;
		previewWidthPx: number;
		previewHeightPx: number;
	};

	let dragState = $state<DragState | null>(null);

	function widgetStyle(item: DashboardItem): string {
		const leftPx = columnsToPixels(item.column);
		const topPx = rowsToPixels(item.row);
		const widthPx = columnsToPixels(item.columnSpan);
		const heightPx = rowsToPixels(item.rowSpan);

		if (dragState && dragState.reportId === item.reportId) {
			if (dragState.kind === 'move') {
				return `left: ${leftPx + dragState.offsetXPx}px; top: ${topPx + dragState.offsetYPx}px; width: ${widthPx}px; height: ${heightPx}px;`;
			}
			return `left: ${leftPx}px; top: ${topPx}px; width: ${dragState.previewWidthPx}px; height: ${dragState.previewHeightPx}px;`;
		}

		return `left: ${leftPx}px; top: ${topPx}px; width: ${widthPx}px; height: ${heightPx}px;`;
	}

	function startMove(event: PointerEvent, item: DashboardItem) {
		if (!editMode || event.button !== 0) return;
		event.preventDefault();
		dragState = {
			kind: 'move',
			reportId: item.reportId,
			pointerId: event.pointerId,
			startClientX: event.clientX,
			startClientY: event.clientY,
			startLayout: {
				column: item.column,
				row: item.row,
				columnSpan: item.columnSpan,
				rowSpan: item.rowSpan
			},
			offsetXPx: 0,
			offsetYPx: 0,
			previewWidthPx: 0,
			previewHeightPx: 0
		};
		window.addEventListener('pointermove', handlePointerMove);
		window.addEventListener('pointerup', handlePointerUp);
	}

	function startResize(event: PointerEvent, item: DashboardItem) {
		if (!editMode || event.button !== 0) return;
		event.preventDefault();
		event.stopPropagation();
		dragState = {
			kind: 'resize',
			reportId: item.reportId,
			pointerId: event.pointerId,
			startClientX: event.clientX,
			startClientY: event.clientY,
			startLayout: {
				column: item.column,
				row: item.row,
				columnSpan: item.columnSpan,
				rowSpan: item.rowSpan
			},
			offsetXPx: 0,
			offsetYPx: 0,
			previewWidthPx: columnsToPixels(item.columnSpan),
			previewHeightPx: rowsToPixels(item.rowSpan)
		};
		window.addEventListener('pointermove', handlePointerMove);
		window.addEventListener('pointerup', handlePointerUp);
	}

	function handlePointerMove(event: PointerEvent) {
		if (!dragState || event.pointerId !== dragState.pointerId) return;
		const deltaXPx = event.clientX - dragState.startClientX;
		const deltaYPx = event.clientY - dragState.startClientY;

		if (dragState.kind === 'move') {
			dragState.offsetXPx = deltaXPx;
			dragState.offsetYPx = deltaYPx;
		} else {
			const minWidthPx = columnsToPixels(MIN_COLUMN_SPAN);
			const minHeightPx = rowsToPixels(MIN_ROW_SPAN);
			dragState.previewWidthPx = Math.max(
				minWidthPx,
				columnsToPixels(dragState.startLayout.columnSpan) + deltaXPx
			);
			dragState.previewHeightPx = Math.max(
				minHeightPx,
				rowsToPixels(dragState.startLayout.rowSpan) + deltaYPx
			);
		}
	}

	function handlePointerUp(event: PointerEvent) {
		if (!dragState || event.pointerId !== dragState.pointerId) return;
		const finishedDrag = dragState;
		window.removeEventListener('pointermove', handlePointerMove);
		window.removeEventListener('pointerup', handlePointerUp);
		dragState = null;

		const item = items.find((candidate) => candidate.reportId === finishedDrag.reportId);
		if (!item) return;

		if (finishedDrag.kind === 'move') {
			const deltaColumns = Math.round(finishedDrag.offsetXPx / (columnWidthPx + GAP_PX));
			const deltaRows = Math.round(finishedDrag.offsetYPx / (ROW_HEIGHT_PX + GAP_PX));
			const nextColumn = clamp(
				finishedDrag.startLayout.column + deltaColumns,
				0,
				GRID_COLUMNS - item.columnSpan
			);
			const nextRow = Math.max(0, finishedDrag.startLayout.row + deltaRows);
			if (nextColumn !== item.column || nextRow !== item.row) {
				onLayoutChange(item.reportId, {
					column: nextColumn,
					row: nextRow,
					columnSpan: item.columnSpan,
					rowSpan: item.rowSpan
				});
			}
		} else {
			const nextColumnSpan = clamp(
				Math.round((finishedDrag.previewWidthPx + GAP_PX) / (columnWidthPx + GAP_PX)),
				MIN_COLUMN_SPAN,
				GRID_COLUMNS - item.column
			);
			const nextRowSpan = Math.max(
				MIN_ROW_SPAN,
				Math.round((finishedDrag.previewHeightPx + GAP_PX) / (ROW_HEIGHT_PX + GAP_PX))
			);
			if (nextColumnSpan !== item.columnSpan || nextRowSpan !== item.rowSpan) {
				onLayoutChange(item.reportId, {
					column: item.column,
					row: item.row,
					columnSpan: nextColumnSpan,
					rowSpan: nextRowSpan
				});
			}
		}
	}
</script>

<div class="relative" style:height="{containerHeightPx}px" bind:clientWidth={containerWidthPx}>
	{#each items as item (item.reportId)}
		{@const isDragging = dragState?.reportId === item.reportId}
		<div
			class="absolute {isDragging ? 'z-10 opacity-90 shadow-lg' : ''} {editMode
				? 'rounded-lg ring-1 ring-border'
				: ''}"
			style={widgetStyle(item)}
		>
			<div class="relative h-full">
				<ReportChart
					title={item.title}
					{holdings}
					config={item.config}
					fill
					reportId={editMode ? undefined : item.reportId}
				/>

				{#if editMode}
					<button
						type="button"
						class="absolute -top-2 left-1/2 z-10 flex h-6 w-10 -translate-x-1/2 cursor-grab touch-none items-center justify-center rounded-full border bg-card text-muted-foreground shadow-sm active:cursor-grabbing"
						aria-label={`Drag to move ${item.title}`}
						onpointerdown={(event) => startMove(event, item)}
					>
						<GripIcon class="size-4" />
					</button>

					<Button
						variant="destructive"
						size="icon-xs"
						class="absolute -top-2 -right-2 z-10 rounded-full shadow-sm"
						aria-label={`Remove ${item.title}`}
						onclick={() => onRemove(item.reportId)}
					>
						<Trash2Icon class="size-3.5" />
					</Button>

					<div
						class="absolute right-0 bottom-0 z-10 h-4 w-4 cursor-nwse-resize touch-none"
						role="presentation"
						onpointerdown={(event) => startResize(event, item)}
					></div>
				{/if}
			</div>
		</div>
	{/each}
</div>
