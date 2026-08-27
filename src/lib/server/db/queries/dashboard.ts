import { db } from '$lib/server/db';
import { holding, region, security, sector } from '$lib/server/db/schema';
import { latestPriceSql } from './latestPriceSql';
import { eq, sql } from 'drizzle-orm';

export function getHoldingValuesBySector() {
	const latestPrice = latestPriceSql();

	return db
		.select({
			symbol: security.symbol,
			fullName: security.fullName,
			sectorName: sector.name,
			regionName: region.name,
			value: sql<number | null>`${holding.shares} * (${latestPrice})`
		})
		.from(holding)
		.innerJoin(security, eq(holding.securityId, security.id))
		.leftJoin(sector, eq(security.sectorId, sector.id))
		.leftJoin(region, eq(security.regionId, region.id));
}
