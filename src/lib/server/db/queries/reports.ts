import { db } from '$lib/server/db';
import { report } from '$lib/server/db/schema';
import { desc, eq } from 'drizzle-orm';
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

export async function getReport(id: string): Promise<SavedReport | undefined> {
	const [row] = await db.select().from(report).where(eq(report.id, id)).limit(1);
	if (!row) return undefined;
	return { ...row, config: row.config as ReportConfig };
}

export async function createReport(title: string, config: ReportConfig) {
	await db.insert(report).values({ title, config });
}

export async function updateReport(id: string, title: string, config: ReportConfig) {
	await db.update(report).set({ title, config }).where(eq(report.id, id));
}

export async function deleteReport(id: string) {
	await db.delete(report).where(eq(report.id, id));
}
