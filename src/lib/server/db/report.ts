import Database from 'better-sqlite3';
import { env } from '$env/dynamic/private';

if (!env.DATABASE_URL) throw new Error('DATABASE_URL is not set');

// A dedicated read-only connection for ad hoc user SQL. `readonly: true` plus
// `query_only` block writes at the driver/DB level; `.prepare()` also refuses
// multi-statement input, and `.reader` tells us whether a single statement
// would return rows, so together they rule out both stacked queries and
// writes (INSERT/UPDATE/DELETE/ATTACH/...) without needing a SQL parser.
const client = new Database(env.DATABASE_URL, { readonly: true, fileMustExist: true });
client.pragma('query_only = ON');

const MAX_ROWS = 500;

export class ReportQueryError extends Error {}

export function runReportQuery(sqlText: string) {
	let stmt;
	try {
		stmt = client.prepare(sqlText);
	} catch (e) {
		throw new ReportQueryError(e instanceof Error ? e.message : 'Invalid SQL');
	}

	if (!stmt.reader) {
		throw new ReportQueryError('Only SELECT queries are allowed');
	}

	const columns = stmt.columns().map((c) => c.name);
	const rows: Record<string, unknown>[] = [];
	let truncated = false;
	try {
		for (const row of stmt.iterate() as IterableIterator<Record<string, unknown>>) {
			if (rows.length >= MAX_ROWS) {
				truncated = true;
				break;
			}
			rows.push(row);
		}
	} catch (e) {
		throw new ReportQueryError(e instanceof Error ? e.message : 'Query failed');
	}

	return { columns, rows, truncated };
}

export type ReportSchemaTable = { name: string; columns: { name: string; type: string }[] };

export function getReportSchema(): ReportSchemaTable[] {
	const tables = client
		.prepare(
			"SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite\\_%' ESCAPE '\\' AND name NOT LIKE '\\_\\_drizzle%' ESCAPE '\\' ORDER BY name"
		)
		.all() as { name: string }[];

	return tables.map((t) => ({
		name: t.name,
		columns: (
			client.prepare(`PRAGMA table_info("${t.name}")`).all() as { name: string; type: string }[]
		).map((c) => ({ name: c.name, type: c.type }))
	}));
}
