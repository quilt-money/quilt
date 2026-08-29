import { db } from '$lib/server/db';
import { security, securityType, sector, region, priceSnapshot } from '$lib/server/db/schema';
import { and, asc, eq, inArray, max } from 'drizzle-orm';
import { fail } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import {
	FMP_SECTOR_TO_GICS,
	fetchFmpProfile,
	normalizeCompanyName,
	regionBucketFor
} from '$lib/server/fmp';

export async function load() {
	const latestSnapshot = db
		.select({
			securityId: priceSnapshot.securityId,
			latestSnapshotTime: max(priceSnapshot.snapshotTime).as('latest_snapshot_time')
		})
		.from(priceSnapshot)
		.groupBy(priceSnapshot.securityId)
		.as('latest_snapshot');

	const securitiesWithPricesAndSyncTimes = await db
		.select({
			id: security.id,
			symbol: security.symbol,
			fullName: security.fullName,
			latestPrice: priceSnapshot.price,
			lastSynced: priceSnapshot.snapshotTime
		})
		.from(security)
		.leftJoin(latestSnapshot, eq(security.id, latestSnapshot.securityId))
		.leftJoin(
			priceSnapshot,
			and(
				eq(priceSnapshot.securityId, latestSnapshot.securityId),
				eq(priceSnapshot.snapshotTime, latestSnapshot.latestSnapshotTime)
			)
		)
		.orderBy(asc(security.symbol));

	return { securitiesWithPricesAndSyncTimes };
}

export const actions = {
	sync: async ({ request, fetch }) => {
		if (!env.FMP_API_KEY) return fail(500, { error: 'FMP_API_KEY is not set' });

		const data = await request.formData();
		const ids = data.getAll('ids').map((id) => id.toString());
		if (ids.length === 0) return fail(400, { error: 'Select at least one security' });

		const securities = await db
			.select({ id: security.id, symbol: security.symbol })
			.from(security)
			.where(inArray(security.id, ids));

		const [securityTypes, sectors, regions] = await Promise.all([
			db.select().from(securityType),
			db.select().from(sector),
			db.select().from(region)
		]);
		const typeIdByName = new Map(securityTypes.map((t) => [t.name, t.id]));
		const sectorIdByName = new Map(sectors.map((s) => [s.name, s.id]));
		const regionIdByName = new Map(regions.map((r) => [r.name, r.id]));

		const snapshotTime = new Date().toISOString();

		for (const s of securities) {
			let profile;
			try {
				profile = await fetchFmpProfile(fetch, env.FMP_API_KEY, s.symbol);
			} catch (err) {
				console.error(`FMP sync failed for ${s.symbol}:`, err);
				continue;
			}
			if (!profile) continue;

			const isFundOrEtf = profile.isEtf || profile.isFund;
			const typeName = profile.isEtf ? 'ETF' : profile.isFund ? 'Mutual Fund' : 'Stock';
			const gicsSector =
				!isFundOrEtf && profile.sector ? FMP_SECTOR_TO_GICS[profile.sector] : undefined;
			const regionName = regionBucketFor(profile.country);

			await db
				.update(security)
				.set({
					fullName: profile.companyName ? normalizeCompanyName(profile.companyName) : undefined,
					typeId: typeIdByName.get(typeName),
					sectorId: isFundOrEtf ? null : gicsSector ? sectorIdByName.get(gicsSector) : undefined,
					regionId: regionIdByName.get(regionName)
				})
				.where(eq(security.id, s.id));

			if (profile.price != null) {
				await db
					.insert(priceSnapshot)
					.values({ securityId: s.id, price: profile.price, snapshotTime })
					.onConflictDoUpdate({
						target: [priceSnapshot.securityId, priceSnapshot.snapshotTime],
						set: { price: profile.price }
					});
			}
		}
	}
};
