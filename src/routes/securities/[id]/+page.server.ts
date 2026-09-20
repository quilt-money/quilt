import { db } from '$lib/server/db';
import {
	security,
	securityType,
	sector,
	region,
	priceSnapshot,
	holding,
	account
} from '$lib/server/db/schema';
import { desc, eq } from 'drizzle-orm';
import { error } from '@sveltejs/kit';

export async function load({ params }) {
	const [sec] = await db
		.select({
			id: security.id,
			symbol: security.symbol,
			fullName: security.fullName,
			type: securityType.name,
			sector: sector.name,
			region: region.name
		})
		.from(security)
		.leftJoin(securityType, eq(security.typeId, securityType.id))
		.leftJoin(sector, eq(security.sectorId, sector.id))
		.leftJoin(region, eq(security.regionId, region.id))
		.where(eq(security.id, params.id))
		.limit(1);
	if (!sec) error(404, 'Security not found');

	const [latestSnapshot] = await db
		.select({ price: priceSnapshot.price, snapshotTime: priceSnapshot.snapshotTime })
		.from(priceSnapshot)
		.where(eq(priceSnapshot.securityId, params.id))
		.orderBy(desc(priceSnapshot.snapshotTime))
		.limit(1);

	const holdings = await db
		.select({
			id: holding.id,
			shares: holding.shares,
			accountId: account.id,
			accountName: account.name
		})
		.from(holding)
		.innerJoin(account, eq(holding.accountId, account.id))
		.where(eq(holding.securityId, params.id))
		.orderBy(account.name);

	return { security: sec, latestPrice: latestSnapshot?.price ?? null, holdings };
}
