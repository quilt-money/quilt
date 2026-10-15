import { db } from '$lib/server/db';
import { security, securityType, sector, region, priceSnapshot } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { FMP_SECTOR_TO_GICS, fetchFmpProfile, normalizeCompanyName, regionBucketFor } from './fmp';

export type SyncSecurityResult =
	| { status: 'success'; price: number | null }
	| { status: 'failed'; error: string };

export async function syncSecurity({
	fetchFn,
	apiKey,
	securityId,
	snapshotTime
}: {
	fetchFn: typeof fetch;
	apiKey: string;
	securityId: string;
	snapshotTime: string;
}): Promise<SyncSecurityResult> {
	const [existingSecurity] = await db
		.select({
			id: security.id,
			symbol: security.symbol,
			typeId: security.typeId,
			sectorId: security.sectorId,
			regionId: security.regionId
		})
		.from(security)
		.where(eq(security.id, securityId));
	if (!existingSecurity) return { status: 'failed', error: 'Security not found' };

	let profile;
	try {
		profile = await fetchFmpProfile(fetchFn, apiKey, existingSecurity.symbol);
	} catch (error) {
		console.error(`FMP sync failed for ${existingSecurity.symbol}:`, error);
		return {
			status: 'failed',
			error: error instanceof Error ? error.message : 'FMP request failed'
		};
	}
	if (!profile) return { status: 'failed', error: 'No FMP profile found' };

	const [securityTypes, sectors, regions] = await Promise.all([
		db.select().from(securityType),
		db.select().from(sector),
		db.select().from(region)
	]);
	const typeIdByName = new Map(
		securityTypes.map((securityType) => [securityType.name, securityType.id])
	);
	const sectorIdByName = new Map(sectors.map((sector) => [sector.name, sector.id]));
	const regionIdByName = new Map(regions.map((region) => [region.name, region.id]));

	const isFundOrEtf = profile.isEtf || profile.isFund;
	const typeName = profile.isEtf ? 'ETF' : profile.isFund ? 'Mutual Fund' : 'Stock';
	const gicsSector =
		!isFundOrEtf && profile.sector ? FMP_SECTOR_TO_GICS[profile.sector] : undefined;
	const regionName = regionBucketFor(profile.country);

	await db
		.update(security)
		.set({
			fullName: profile.companyName ? normalizeCompanyName(profile.companyName) : undefined,
			// Type, sector, and region are only filled in when empty so manual
			// edits are never overwritten by the sync response.
			typeId: existingSecurity.typeId ? undefined : typeIdByName.get(typeName),
			sectorId: existingSecurity.sectorId
				? undefined
				: isFundOrEtf
					? null
					: gicsSector
						? sectorIdByName.get(gicsSector)
						: undefined,
			regionId: existingSecurity.regionId ? undefined : regionIdByName.get(regionName)
		})
		.where(eq(security.id, existingSecurity.id));

	if (profile.price != null) {
		await db
			.insert(priceSnapshot)
			.values({ securityId: existingSecurity.id, price: profile.price, snapshotTime })
			.onConflictDoUpdate({
				target: [priceSnapshot.securityId, priceSnapshot.snapshotTime],
				set: { price: profile.price }
			});
	}

	return { status: 'success', price: profile.price ?? null };
}
