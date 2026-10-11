import { fail, redirect } from '@sveltejs/kit';
import { holdingRows, withTags, withTotalValue } from '$lib/server/db/queries/holdings';
import { createReport } from '$lib/server/db/queries/reports';
import type { ReportConfig } from '$lib/report-builder';

const REPORT_TYPES = ['chart', 'summary'] as const;

export async function load({ url }) {
	const heldRows = await holdingRows();
	const requestedType = url.searchParams.get('reportType');
	const reportType = REPORT_TYPES.find((type) => type === requestedType) ?? 'chart';

	return { reportType, holdings: await withTags(withTotalValue(heldRows)) };
}

export const actions = {
	create: async ({ request }) => {
		const data = await request.formData();
		const title = data.get('title')?.toString().trim();
		const configRaw = data.get('config')?.toString();

		if (!title) return fail(400, { error: 'Title is required' });
		if (!configRaw) return fail(400, { error: 'Report config is missing' });

		const config = JSON.parse(configRaw) as ReportConfig;
		await createReport(title, config);

		redirect(303, '/reports');
	}
};
