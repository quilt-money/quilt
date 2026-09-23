import { db } from '$lib/server/db';
import { priceSnapshot } from '$lib/server/db/schema';
import { and, eq, max } from 'drizzle-orm';

/**
 * The price_snapshot table keeps a full history per security, so every query
 * that wants "the current price" has to first pick out the latest snapshot
 * per security. This builds that subquery once, plus the join condition to
 * pair it back up with priceSnapshot rows.
 */
export function latestPriceSnapshot() {
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

	return { latestSnapshot, latestPriceOn };
}
