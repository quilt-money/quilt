import { asc, inArray } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { holding, priceSnapshot } from '$lib/server/db/schema';

export type PricePoint = { time: string; price: number };

/** Every snapshot of each held security, oldest first, keyed by security id. */
export type PriceHistory = Record<string, PricePoint[]>;

export async function getPriceHistory(): Promise<PriceHistory> {
	const heldSecurityIds = db.select({ securityId: holding.securityId }).from(holding);
	const snapshots = await db
		.select({
			securityId: priceSnapshot.securityId,
			time: priceSnapshot.snapshotTime,
			price: priceSnapshot.price
		})
		.from(priceSnapshot)
		.where(inArray(priceSnapshot.securityId, heldSecurityIds))
		.orderBy(asc(priceSnapshot.snapshotTime));

	const priceHistory: PriceHistory = {};
	for (const snapshot of snapshots) {
		(priceHistory[snapshot.securityId] ??= []).push({
			time: snapshot.time,
			price: snapshot.price
		});
	}
	return priceHistory;
}
