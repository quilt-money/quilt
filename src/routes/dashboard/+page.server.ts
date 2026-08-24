import { db } from '$lib/server/db';
import { holding, security, sector } from '$lib/server/db/schema';
import { latestPriceSql } from '$lib/server/db/queries/latestPriceSql';
import { eq, sql } from 'drizzle-orm';

const MAX_SECTOR_SLICES = 7;

export async function load() {
	const latestPrice = latestPriceSql();

	const rows = await db
		.select({
			sectorName: sector.name,
			value: sql<number | null>`${holding.shares} * (${latestPrice})`
		})
		.from(holding)
		.innerJoin(security, eq(holding.securityId, security.id))
		.leftJoin(sector, eq(security.sectorId, sector.id));

	const totals = new Map<string, number>();
	for (const row of rows) {
		if (row.value == null) continue;
		const name = row.sectorName ?? 'Unclassified';
		totals.set(name, (totals.get(name) ?? 0) + row.value);
	}

	const sorted = [...totals.entries()]
		.map(([name, value]) => ({ name, value }))
		.sort((a, b) => b.value - a.value);

	const valueBySector = sorted.slice(0, MAX_SECTOR_SLICES);
	const rest = sorted.slice(MAX_SECTOR_SLICES);
	if (rest.length > 0) {
		valueBySector.push({
			name: 'Other',
			value: rest.reduce((sum, r) => sum + r.value, 0)
		});
	}

	const totalValue = sorted.reduce((sum, r) => sum + r.value, 0);

	return { valueBySector, totalValue };
}
