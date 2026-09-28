import { error, fail, redirect } from '@sveltejs/kit';
import { holdingRows, withTags, withTotalValue } from '$lib/server/db/queries/holdings';
import { deleteReport, getReport, updateReport } from '$lib/server/db/queries/reports';
import type { ReportConfig } from '$lib/report-builder';

export async function load({ params }) {
	const [savedReport, heldRows] = await Promise.all([getReport(params.id), holdingRows()]);
	if (!savedReport) error(404, 'Report not found');

	return { report: savedReport, holdings: await withTags(withTotalValue(heldRows)) };
}

export const actions = {
	update: async ({ request, params }) => {
		const data = await request.formData();
		const title = data.get('title')?.toString().trim();
		const configRaw = data.get('config')?.toString();

		if (!title) return fail(400, { error: 'Title is required' });
		if (!configRaw) return fail(400, { error: 'Report config is missing' });

		const config = JSON.parse(configRaw) as ReportConfig;
		await updateReport(params.id, title, config);

		redirect(303, '/reports');
	},

	delete: async ({ params }) => {
		await deleteReport(params.id);
		redirect(303, '/reports');
	}
};
