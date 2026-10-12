import { db } from '$lib/server/db';
import { account, security, holding } from '$lib/server/db/schema';
import { and, eq, notInArray } from 'drizzle-orm';
import { error, fail } from '@sveltejs/kit';
import { parse } from 'csv/sync';
import { HOLDINGS_CSV_HEADER, isValidCsvHeader } from '$lib/holdings-csv';

type CsvRow = { Symbol: string; Shares: string; Basis: string };

type HoldingRow = {
	symbol: string;
	shares: number | null;
	costBasis: number | null;
};

export async function load({ params }) {
	const [acct] = await db.select().from(account).where(eq(account.id, params.id)).limit(1);
	if (!acct) error(404, 'Account not found');

	return { account: acct };
}

export const actions = {
	async upload({ request, params }) {
		const formData = await request.formData();
		const file = formData.get('file');

		if (!(file instanceof File) || file.size === 0) {
			return fail(400, { message: 'No file provided' });
		}

		const text = await file.text();
		const [header] = parse(text, { to_line: 1 }) as string[][];

		if (!header || !isValidCsvHeader(header)) {
			return fail(400, {
				message: `CSV must have exactly these headers: ${HOLDINGS_CSV_HEADER.join(', ')}`
			});
		}

		console.log('CSV header:', header);

		const csvRows = parse(text, { columns: true, skip_empty_lines: true }) as CsvRow[];

		const rows: HoldingRow[] = [];
		for (const [index, row] of csvRows.entries()) {
			const line = index + 2;
			const symbol = row.Symbol?.trim().toUpperCase();
			if (!symbol) return fail(400, { message: `Row ${line}: Symbol is required` });

			const sharesRaw = row.Shares?.trim();
			const shares = sharesRaw ? Number(sharesRaw) : null;

			if (shares !== null && Number.isNaN(shares)) {
				return fail(400, { message: `Row ${line}: Shares must be a number` });
			}

			const basisRaw = row.Basis?.trim();
			const costBasis = basisRaw ? Number(basisRaw) : null;

			if (costBasis !== null && Number.isNaN(costBasis)) {
				return fail(400, { message: `Row ${line}: Basis must be a number` });
			}

			rows.push({ symbol, shares, costBasis });
		}

		const uploadedSecurities: { symbol: string; isNew: boolean }[] = [];

		let holdingsRemoved = 0;

		db.transaction((tx) => {
			const uploadedSecurityIds: string[] = [];

			for (const row of rows) {
				let existingSecurity = tx
					.select({ id: security.id })
					.from(security)
					.where(eq(security.symbol, row.symbol))
					.get();

				const isNew = !existingSecurity;
				if (!existingSecurity) {
					existingSecurity = tx
						.insert(security)
						.values({ symbol: row.symbol })
						.returning({ id: security.id })
						.get();
				}
				uploadedSecurities.push({ symbol: row.symbol, isNew });
				uploadedSecurityIds.push(existingSecurity.id);

				tx.insert(holding)
					.values({
						accountId: params.id,
						securityId: existingSecurity.id,
						shares: row.shares,
						costBasis: row.costBasis
					})
					.onConflictDoUpdate({
						target: [holding.accountId, holding.securityId],
						set: { shares: row.shares, costBasis: row.costBasis }
					})
					.run();
			}

			// The CSV is the entire account, so anything it omits has been sold.
			holdingsRemoved = tx
				.delete(holding)
				.where(
					and(eq(holding.accountId, params.id), notInArray(holding.securityId, uploadedSecurityIds))
				)
				.returning({ id: holding.id })
				.all().length;
		});

		return {
			success: true,
			securities: uploadedSecurities,
			securitiesInserted: uploadedSecurities.filter((security) => security.isNew).length,
			securitiesExisting: uploadedSecurities.filter((security) => !security.isNew).length,
			holdingsUploaded: rows.length,
			holdingsRemoved
		};
	}
};
