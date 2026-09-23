import { db } from '$lib/server/db';
import { priceSnapshot, region, sector, security, securityType } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { latestPriceSnapshot } from './latest-price';

/**
 * Every security joined out to its attributes and latest price, independent
 * of whether it's currently held anywhere. Used by the securities list.
 */
export function securityRows() {
	const { latestSnapshot, latestPriceOn } = latestPriceSnapshot();

	return db
		.select({
			id: security.id,
			symbol: security.symbol,
			fullName: security.fullName,
			type: securityType.name,
			sector: sector.name,
			region: region.name,
			price: priceSnapshot.price,
			lastSynced: priceSnapshot.snapshotTime
		})
		.from(security)
		.leftJoin(securityType, eq(security.typeId, securityType.id))
		.leftJoin(sector, eq(security.sectorId, sector.id))
		.leftJoin(region, eq(security.regionId, region.id))
		.leftJoin(latestSnapshot, eq(security.id, latestSnapshot.securityId))
		.leftJoin(priceSnapshot, latestPriceOn);
}
