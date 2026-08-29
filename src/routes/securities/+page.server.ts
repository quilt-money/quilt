import { db } from '$lib/server/db';
import { security, securityType, sector, region, priceSnapshot } from '$lib/server/db/schema';
import { latestPriceSql, latestSnapshotTimeSql } from '$lib/server/db/queries/latestPriceSql';
import { asc, eq, inArray } from 'drizzle-orm';
import { fail } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import {
	FMP_SECTOR_TO_GICS,
	fetchFmpProfile,
	normalizeCompanyName,
	regionBucketFor
} from '$lib/server/fmp';

export async function load() {
	const securities = await db
		.select({
			id: security.id,
			symbol: security.symbol,
			fullName: security.fullName,
			latestPrice: latestPriceSql(),
			lastSynced: latestSnapshotTimeSql()
		})
		.from(security)
		.orderBy(asc(security.symbol));

	const [securityTypes, sectors, regions] = await Promise.all([
		db
			.select({ id: securityType.id, name: securityType.name })
			.from(securityType)
			.orderBy(securityType.name),
		db.select({ id: sector.id, name: sector.name }).from(sector).orderBy(sector.name),
		db.select({ id: region.id, name: region.name }).from(region).orderBy(region.name)
	]);

	return { securities, securityTypes, sectors, regions };
}

export const actions = {
	create: async ({ request }) => {
		const data = await request.formData();
		const symbol = data.get('symbol')?.toString().trim().toUpperCase();
		const fullName = data.get('fullName')?.toString().trim() || null;
		const typeId = data.get('typeId')?.toString() || null;
		const sectorId = data.get('sectorId')?.toString() || null;
		const regionId = data.get('regionId')?.toString() || null;

		if (!symbol) return fail(400, { error: 'Symbol is required' });

		const [existing] = await db
			.select({ id: security.id })
			.from(security)
			.where(eq(security.symbol, symbol));
		if (existing) return fail(400, { error: `${symbol} already exists` });

		await db.insert(security).values({
			symbol,
			fullName,
			typeId,
			sectorId,
			regionId
		});
	},

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
