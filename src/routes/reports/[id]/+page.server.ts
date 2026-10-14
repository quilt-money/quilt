import { error, fail, redirect } from '@sveltejs/kit';
import { holdingRows, withTags, withTotalValue } from '$lib/server/db/queries/holdings';
import { getPriceHistory } from '$lib/server/db/queries/price-history';
import { deleteReport, getReport, updateReport } from '$lib/server/db/queries/reports';
import { isTimeReportConfig, type SavedReportConfig } from '$lib/report-builder';

export async function load({ params }) {
	const [savedReport, heldRows] = await Promise.all([getReport(params.id), holdingRows()]);
	if (!savedReport) error(404, 'Report not found');

	const priceHistory = isTimeReportConfig(savedReport.config) ? await getPriceHistory() : {};

	return { report: savedReport, holdings: await withTags(withTotalValue(heldRows)), priceHistory };
}

export const actions = {
	update: async ({ request, params }) => {
		const data = await request.formData();
		const title = data.get('title')?.toString().trim();
		const configRaw = data.get('config')?.toString();

		if (!title) return fail(400, { error: 'Title is required' });
		if (!configRaw) return fail(400, { error: 'Report config is missing' });

		const config = JSON.parse(configRaw) as SavedReportConfig;
		await updateReport(params.id, title, config);

		redirect(303, '/reports');
	},

	delete: async ({ params }) => {
		await deleteReport(params.id);
		redirect(303, '/reports');
	}
};
