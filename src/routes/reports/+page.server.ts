import { getReportSchema, ReportQueryError, runReportQuery } from '$lib/server/db/report';
import { fail } from '@sveltejs/kit';

export function load() {
	return { schema: getReportSchema() };
}

export const actions = {
	run: async ({ request }) => {
		const data = await request.formData();
		const sql = data.get('sql')?.toString().trim();

		if (!sql) return fail(400, { error: 'Enter a query' });

		try {
			const { columns, rows, truncated } = runReportQuery(sql);
			return { sql, columns, rows, truncated };
		} catch (e) {
			return fail(400, { sql, error: e instanceof ReportQueryError ? e.message : 'Query failed' });
		}
	}
};
