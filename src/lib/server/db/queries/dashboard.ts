import { db } from '$lib/server/db';
import { holding, security, sector } from '$lib/server/db/schema';
import { latestPriceSql } from './latestPriceSql';
import { eq, sql } from 'drizzle-orm';

export function getHoldingValuesBySector() {
	const latestPrice = latestPriceSql();

	return db
		.select({
			sectorName: sector.name,
			value: sql<number | null>`${holding.shares} * (${latestPrice})`
		})
		.from(holding)
		.innerJoin(security, eq(holding.securityId, security.id))
		.leftJoin(sector, eq(security.sectorId, sector.id));
}
