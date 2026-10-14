import { eq } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { dashboardItem, report } from '$lib/server/db/schema';
import type { SavedReportConfig } from '$lib/report-builder';

export type DashboardItemLayout = {
	column: number;
	row: number;
	columnSpan: number;
	rowSpan: number;
};

export type DashboardItem = DashboardItemLayout & {
	reportId: string;
	title: string;
	config: SavedReportConfig;
};

const GRID_COLUMNS = 12;
const DEFAULT_COLUMN_SPAN = 6;
const DEFAULT_ROW_SPAN = 15;

export async function listDashboardItems(): Promise<DashboardItem[]> {
	const rows = await db
		.select({
			reportId: dashboardItem.reportId,
			column: dashboardItem.column,
			row: dashboardItem.row,
			columnSpan: dashboardItem.columnSpan,
			rowSpan: dashboardItem.rowSpan,
			title: report.title,
			config: report.config
		})
		.from(dashboardItem)
		.innerJoin(report, eq(dashboardItem.reportId, report.id));

	return rows
		.map((dashboardRow) => ({ ...dashboardRow, config: dashboardRow.config as SavedReportConfig }))
		.sort((a, b) => a.row - b.row || a.column - b.column);
}

export async function addDashboardItem(reportId: string): Promise<DashboardItemLayout> {
	const existingItems = await db
		.select({
			column: dashboardItem.column,
			row: dashboardItem.row,
			columnSpan: dashboardItem.columnSpan,
			rowSpan: dashboardItem.rowSpan
		})
		.from(dashboardItem);

	const nextRow = existingItems.reduce(
		(maxBottomRow, existingItem) => Math.max(maxBottomRow, existingItem.row + existingItem.rowSpan),
		0
	);

	const layout: DashboardItemLayout = {
		column: 0,
		row: nextRow,
		columnSpan: Math.min(DEFAULT_COLUMN_SPAN, GRID_COLUMNS),
		rowSpan: DEFAULT_ROW_SPAN
	};

	await db.insert(dashboardItem).values({ reportId, ...layout });

	return layout;
}

export async function updateDashboardItemLayout(reportId: string, layout: DashboardItemLayout) {
	await db.update(dashboardItem).set(layout).where(eq(dashboardItem.reportId, reportId));
}

export async function removeDashboardItem(reportId: string) {
	await db.delete(dashboardItem).where(eq(dashboardItem.reportId, reportId));
}
