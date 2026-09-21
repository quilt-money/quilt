import { db } from '$lib/server/db';
import {
	account,
	accountTag,
	holding,
	security,
	securityType,
	sector,
	region,
	priceSnapshot,
	tag
} from '$lib/server/db/schema';
import { and, eq, max } from 'drizzle-orm';
import { error } from '@sveltejs/kit';

export async function load({ params }) {
	const [acct] = await db.select().from(account).where(eq(account.id, params.id)).limit(1);
	if (!acct) error(404, 'Account not found');

	const latestSnapshot = db
		.select({
			securityId: priceSnapshot.securityId,
			latestSnapshotTime: max(priceSnapshot.snapshotTime).as('latest_snapshot_time')
		})
		.from(priceSnapshot)
		.groupBy(priceSnapshot.securityId)
		.as('latest_snapshot');

	const [holdingRows, tags] = await Promise.all([
		db
			.select({
				id: holding.id,
				shares: holding.shares,
				symbol: security.symbol,
				fullName: security.fullName,
				type: securityType.name,
				sector: sector.name,
				region: region.name,
				price: priceSnapshot.price
			})
			.from(holding)
			.innerJoin(security, eq(holding.securityId, security.id))
			.leftJoin(securityType, eq(security.typeId, securityType.id))
			.leftJoin(sector, eq(security.sectorId, sector.id))
			.leftJoin(region, eq(security.regionId, region.id))
			.leftJoin(latestSnapshot, eq(security.id, latestSnapshot.securityId))
			.leftJoin(
				priceSnapshot,
				and(
					eq(priceSnapshot.securityId, latestSnapshot.securityId),
					eq(priceSnapshot.snapshotTime, latestSnapshot.latestSnapshotTime)
				)
			)
			.where(eq(holding.accountId, params.id))
			.orderBy(security.symbol),
		db
			.select({ name: tag.name })
			.from(accountTag)
			.innerJoin(tag, eq(accountTag.tagId, tag.id))
			.where(eq(accountTag.accountId, params.id))
			.orderBy(tag.name)
	]);

	const holdings = holdingRows.map((r) => ({
		...r,
		totalValue: r.shares != null && r.price != null ? r.shares * r.price : null
	}));

	return { account: acct, holdings, tags: tags.map((t) => t.name) };
}
