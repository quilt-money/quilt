import { db } from '$lib/server/db';
import {
	account,
	holding,
	priceSnapshot,
	region,
	sector,
	security,
	securityType
} from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { latestPriceSnapshot } from './latest-price';

/**
 * Every holding joined out to its account, security attributes, and latest
 * price. This is the "super query" reused across the accounts, portfolio,
 * and dashboard pages.
 */
export function holdingRows() {
	const { latestSnapshot, latestPriceOn } = latestPriceSnapshot();

	return db
		.select({
			id: holding.id,
			shares: holding.shares,
			accountId: holding.accountId,
			accountName: account.name,
			securityId: holding.securityId,
			symbol: security.symbol,
			fullName: security.fullName,
			type: securityType.name,
			sector: sector.name,
			region: region.name,
			price: priceSnapshot.price
		})
		.from(holding)
		.leftJoin(account, eq(holding.accountId, account.id))
		.innerJoin(security, eq(holding.securityId, security.id))
		.leftJoin(securityType, eq(security.typeId, securityType.id))
		.leftJoin(sector, eq(security.sectorId, sector.id))
		.leftJoin(region, eq(security.regionId, region.id))
		.leftJoin(latestSnapshot, eq(security.id, latestSnapshot.securityId))
		.leftJoin(priceSnapshot, latestPriceOn);
}
