<script lang="ts">
	import { useDraggable } from '@dnd-kit-svelte/svelte';
	import GripIcon from '@lucide/svelte/icons/grip-vertical';
	import Trash2Icon from '@lucide/svelte/icons/trash-2';
	import ReportChart from '$lib/components/ReportChart.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import type { HoldingWithTags } from '$lib/server/db/queries/holdings';
	import type { DashboardItem, DashboardItemLayout } from '$lib/server/db/queries/dashboard';

	let {
		item,
		editMode,
		holdings,
		columnWidthPx,
		rowHeightPx,
		gapPx,
		gridColumns,
		minColumnSpan,
		minRowSpan,
		onLayoutChange,
		onRemove
	}: {
		item: DashboardItem;
		editMode: boolean;
		holdings: HoldingWithTags[];
		columnWidthPx: number;
		rowHeightPx: number;
		gapPx: number;
		gridColumns: number;
		minColumnSpan: number;
		minRowSpan: number;
		onLayoutChange: (reportId: string, layout: DashboardItemLayout) => void;
		onRemove: (reportId: string) => void;
	} = $props();

	function rowsToPixels(rows: number): number {
		return rows * rowHeightPx + Math.max(0, rows - 1) * gapPx;
	}

	function columnsToPixels(columns: number): number {
		return columns * columnWidthPx + Math.max(0, columns - 1) * gapPx;
	}

	function clamp(value: number, min: number, max: number): number {
		return Math.min(Math.max(value, min), Math.max(min, max));
	}

	const { ref, handleRef, isDragging } = useDraggable({
		id: () => item.reportId,
		disabled: () => !editMode
	});

	// dnd-kit doesn't have a resize primitive, so widget resizing stays hand-rolled pointer logic.
	type ResizeState = {
		pointerId: number;
		startClientX: number;
		startClientY: number;
		startColumnSpan: number;
		startRowSpan: number;
		previewWidthPx: number;
		previewHeightPx: number;
	};

	let resizeState = $state<ResizeState | null>(null);

	const isActive = $derived(isDragging.current || resizeState !== null);

	function startResize(event: PointerEvent) {
		if (!editMode || event.button !== 0) return;
		event.preventDefault();
		event.stopPropagation();
		resizeState = {
			pointerId: event.pointerId,
			startClientX: event.clientX,
			startClientY: event.clientY,
			startColumnSpan: item.columnSpan,
			startRowSpan: item.rowSpan,
			previewWidthPx: columnsToPixels(item.columnSpan),
			previewHeightPx: rowsToPixels(item.rowSpan)
		};
		window.addEventListener('pointermove', handleResizeMove);
		window.addEventListener('pointerup', handleResizeEnd);
	}

	function handleResizeMove(event: PointerEvent) {
		if (!resizeState || event.pointerId !== resizeState.pointerId) return;
		const deltaXPx = event.clientX - resizeState.startClientX;
		const deltaYPx = event.clientY - resizeState.startClientY;
		const minWidthPx = columnsToPixels(minColumnSpan);
		const minHeightPx = rowsToPixels(minRowSpan);
		resizeState.previewWidthPx = Math.max(
			minWidthPx,
			columnsToPixels(resizeState.startColumnSpan) + deltaXPx
		);
		resizeState.previewHeightPx = Math.max(
			minHeightPx,
			rowsToPixels(resizeState.startRowSpan) + deltaYPx
		);
	}

	function handleResizeEnd(event: PointerEvent) {
		if (!resizeState || event.pointerId !== resizeState.pointerId) return;
		const finishedResize = resizeState;
		window.removeEventListener('pointermove', handleResizeMove);
		window.removeEventListener('pointerup', handleResizeEnd);
		resizeState = null;

		const nextColumnSpan = clamp(
			Math.round((finishedResize.previewWidthPx + gapPx) / (columnWidthPx + gapPx)),
			minColumnSpan,
			gridColumns - item.column
		);
		const nextRowSpan = Math.max(
			minRowSpan,
			Math.round((finishedResize.previewHeightPx + gapPx) / (rowHeightPx + gapPx))
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

	const widgetStyle = $derived.by(() => {
		const leftPx = columnsToPixels(item.column);
		const topPx = rowsToPixels(item.row);
		const widthPx = resizeState ? resizeState.previewWidthPx : columnsToPixels(item.columnSpan);
		const heightPx = resizeState ? resizeState.previewHeightPx : rowsToPixels(item.rowSpan);
		return `left: ${leftPx}px; top: ${topPx}px; width: ${widthPx}px; height: ${heightPx}px;`;
	});
</script>

<div
	{@attach ref}
	class="absolute {isActive ? 'z-10 opacity-90 shadow-lg' : ''} {editMode
		? 'rounded-lg ring-1 ring-border'
		: ''}"
	style={widgetStyle}
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
				{@attach handleRef}
				type="button"
				class="absolute -top-2 left-1/2 z-10 flex h-6 w-10 -translate-x-1/2 cursor-grab touch-none items-center justify-center rounded-full border bg-card text-muted-foreground shadow-sm active:cursor-grabbing"
				aria-label={`Drag to move ${item.title}`}
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
				onpointerdown={startResize}
			></div>
		{/if}
	</div>
</div>
