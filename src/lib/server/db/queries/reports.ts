import { db } from '$lib/server/db';
import { report } from '$lib/server/db/schema';
import { desc } from 'drizzle-orm';
import type { ReportConfig } from '$lib/report-builder';

export type SavedReport = {
	id: string;
	title: string;
	config: ReportConfig;
	createdAt: string;
};

export async function listReports(): Promise<SavedReport[]> {
	const rows = await db.select().from(report).orderBy(desc(report.createdAt));
	return rows.map((row) => ({ ...row, config: row.config as ReportConfig }));
}

export async function createReport(title: string, config: ReportConfig) {
	await db.insert(report).values({ title, config });
}
