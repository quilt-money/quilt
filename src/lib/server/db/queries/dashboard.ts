import { db } from '$lib/server/db';
import { holding, priceSnapshot, region, security, sector } from '$lib/server/db/schema';
import { and, eq, max, sql } from 'drizzle-orm';

export function getHoldingValuesBySector() {
	const latestSnapshot = db
		.select({
			securityId: priceSnapshot.securityId,
			latestSnapshotTime: max(priceSnapshot.snapshotTime).as('latest_snapshot_time')
		})
		.from(priceSnapshot)
		.groupBy(priceSnapshot.securityId)
		.as('latest_snapshot');

	return db
		.select({
			symbol: security.symbol,
			fullName: security.fullName,
			sectorName: sector.name,
			regionName: region.name,
			value: sql<number | null>`${holding.shares} * ${priceSnapshot.price}`
		})
		.from(holding)
		.innerJoin(security, eq(holding.securityId, security.id))
		.leftJoin(sector, eq(security.sectorId, sector.id))
		.leftJoin(region, eq(security.regionId, region.id))
		.leftJoin(latestSnapshot, eq(security.id, latestSnapshot.securityId))
		.leftJoin(
			priceSnapshot,
			and(
				eq(priceSnapshot.securityId, latestSnapshot.securityId),
				eq(priceSnapshot.snapshotTime, latestSnapshot.latestSnapshotTime)
			)
		);
}
