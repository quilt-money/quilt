import { fail } from '@sveltejs/kit';
import { holdingRows, withTags, withTotalValue } from '$lib/server/db/queries/holdings';
import { getPriceHistory } from '$lib/server/db/queries/price-history';
import { isTimeReportConfig } from '$lib/report-builder';
import { listReports } from '$lib/server/db/queries/reports';
import {
	addDashboardItem,
	listDashboardItems,
	removeDashboardItem,
	updateDashboardItemLayout
} from '$lib/server/db/queries/dashboard';

export async function load() {
	const [heldRows, reports, dashboardItems] = await Promise.all([
		holdingRows(),
		listReports(),
		listDashboardItems()
	]);

	// Price history is the bulk of the payload, so only fetch it when a time report needs it.
	const needsPriceHistory = dashboardItems.some((item) => isTimeReportConfig(item.config));
	const priceHistory = needsPriceHistory ? await getPriceHistory() : {};

	return {
		holdings: await withTags(withTotalValue(heldRows)),
		reports,
		dashboardItems,
		priceHistory
	};
}

export const actions = {
	add: async ({ request }) => {
		const data = await request.formData();
		const reportId = data.get('reportId')?.toString();
		if (!reportId) return fail(400, { error: 'Report is required' });

		const layout = await addDashboardItem(reportId);
		return { reportId, layout };
	},

	remove: async ({ request }) => {
		const data = await request.formData();
		const reportId = data.get('reportId')?.toString();
		if (!reportId) return fail(400, { error: 'Report is required' });

		await removeDashboardItem(reportId);
	},

	move: async ({ request }) => {
		const data = await request.formData();
		const reportId = data.get('reportId')?.toString();
		const column = Number(data.get('column'));
		const row = Number(data.get('row'));
		const columnSpan = Number(data.get('columnSpan'));
		const rowSpan = Number(data.get('rowSpan'));

		if (!reportId || [column, row, columnSpan, rowSpan].some((value) => !Number.isFinite(value))) {
			return fail(400, { error: 'Invalid layout' });
		}

		await updateDashboardItemLayout(reportId, { column, row, columnSpan, rowSpan });
	}
};
