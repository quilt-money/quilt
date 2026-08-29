import { db } from '$lib/server/db';
import {
	holding,
	account,
	security,
	securityType,
	sector,
	region,
	priceSnapshot
} from '$lib/server/db/schema';
import { and, asc, eq, max, notExists } from 'drizzle-orm';

export async function load() {
	const latestSnapshot = db
		.select({
			securityId: priceSnapshot.securityId,
			latestSnapshotTime: max(priceSnapshot.snapshotTime).as('latest_snapshot_time')
		})
		.from(priceSnapshot)
		.groupBy(priceSnapshot.securityId)
		.as('latest_snapshot');

	const latestPriceOn = and(
		eq(priceSnapshot.securityId, latestSnapshot.securityId),
		eq(priceSnapshot.snapshotTime, latestSnapshot.latestSnapshotTime)
	);

	const heldRows = await db
		.select({
			id: holding.id,
			shares: holding.shares,
			accountId: holding.accountId,
			accountName: account.name,
			securityId: holding.securityId,
			securitySymbol: security.symbol,
			securityFullName: security.fullName,
			type: securityType.name,
			sector: sector.name,
			region: region.name,
			price: priceSnapshot.price
		})
		.from(holding)
		.leftJoin(account, eq(holding.accountId, account.id))
		.leftJoin(security, eq(holding.securityId, security.id))
		.leftJoin(securityType, eq(security.typeId, securityType.id))
		.leftJoin(sector, eq(security.sectorId, sector.id))
		.leftJoin(region, eq(security.regionId, region.id))
		.leftJoin(latestSnapshot, eq(security.id, latestSnapshot.securityId))
		.leftJoin(priceSnapshot, latestPriceOn)
		.orderBy(asc(account.name), asc(security.symbol));

	const unheldRows = await db
		.select({
			securityId: security.id,
			securitySymbol: security.symbol,
			securityFullName: security.fullName,
			type: securityType.name,
			sector: sector.name,
			region: region.name,
			price: priceSnapshot.price
		})
		.from(security)
		.leftJoin(securityType, eq(security.typeId, securityType.id))
		.leftJoin(sector, eq(security.sectorId, sector.id))
		.leftJoin(region, eq(security.regionId, region.id))
		.leftJoin(latestSnapshot, eq(security.id, latestSnapshot.securityId))
		.leftJoin(priceSnapshot, latestPriceOn)
		.where(
			notExists(
				db.select({ id: holding.id }).from(holding).where(eq(holding.securityId, security.id))
			)
		)
		.orderBy(asc(security.symbol));

	// Value of a single holding row: that account's shares times the security's
	// latest price. Computed in JS since drizzle's query builder has no
	// cross-column multiply operator outside a raw sql tag.
	const holdings = heldRows.map((r) => ({
		...r,
		totalValue: r.shares != null && r.price != null ? r.shares * r.price : null
	}));

	const unheldSecurities = unheldRows.map((r) => ({
		id: `security-${r.securityId}`,
		shares: null as number | null,
		accountId: null as string | null,
		accountName: null as string | null,
		...r,
		totalValue: null as number | null
	}));

	return { holdings, unheldSecurities };
}
