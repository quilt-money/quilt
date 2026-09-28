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
import { asc, eq, inArray } from 'drizzle-orm';
import { fail } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import {
	FMP_SECTOR_TO_GICS,
	fetchFmpProfile,
	normalizeCompanyName,
	regionBucketFor
} from '$lib/server/fmp';
import { securityRows } from '$lib/server/db/queries/securities';
import { getTagsForEntities, listAllTagNames, syncEntityTags } from '$lib/server/db/queries/tags';

export async function load() {
	const [rows, holdingAccountRows, securityTypes, sectors, regions, allTags] = await Promise.all([
		securityRows().orderBy(asc(security.symbol)),
		db
			.select({
				securityId: holding.securityId,
				accountId: account.id,
				accountName: account.name
			})
			.from(holding)
			.innerJoin(account, eq(holding.accountId, account.id))
			.orderBy(account.name),
		db.select().from(securityType).orderBy(securityType.name),
		db.select().from(sector).orderBy(sector.name),
		db.select().from(region).orderBy(region.name),
		listAllTagNames()
	]);

	const accountsBySecurityId = new Map<string, { id: string; name: string }[]>();
	for (const r of holdingAccountRows) {
		const accounts = accountsBySecurityId.get(r.securityId) ?? [];
		if (!accounts.some((a) => a.id === r.accountId)) {
			accounts.push({ id: r.accountId, name: r.accountName });
		}
		accountsBySecurityId.set(r.securityId, accounts);
	}

	const tagsBySecurityId = await getTagsForEntities(
		'security',
		rows.map((r) => r.id)
	);

	const securitiesWithPricesAndSyncTimes = rows.map(({ price, ...r }) => ({
		...r,
		latestPrice: price,
		accounts: accountsBySecurityId.get(r.id) ?? [],
		tags: tagsBySecurityId.get(r.id) ?? []
	}));

	return { securitiesWithPricesAndSyncTimes, securityTypes, sectors, regions, allTags };
}

export const actions = {
	bulkEdit: async ({ request }) => {
		const data = await request.formData();
		const ids = data.getAll('ids').map((id) => id.toString());
		if (ids.length === 0) return fail(400, { error: 'Select at least one security' });

		const typeId = data.get('typeId')?.toString();
		const sectorId = data.get('sectorId')?.toString();
		const regionId = data.get('regionId')?.toString();
		const addTagsRaw = data.get('addTags')?.toString();
		const tagsToAdd: string[] = addTagsRaw ? JSON.parse(addTagsRaw) : [];

		// Only fields the user actually touched are applied, so bulk editing a
		// handful of securities can't silently null out attributes on the rest.
		const patch: Partial<{ typeId: string; sectorId: string; regionId: string }> = {};
		if (typeId) patch.typeId = typeId;
		if (sectorId) patch.sectorId = sectorId;
		if (regionId) patch.regionId = regionId;

		if (Object.keys(patch).length > 0) {
			await db.update(security).set(patch).where(inArray(security.id, ids));
		}

		if (tagsToAdd.length > 0) {
			const existingTagsBySecurityId = await getTagsForEntities('security', ids);
			for (const id of ids) {
				const mergedTags = [
					...new Set([...(existingTagsBySecurityId.get(id) ?? []), ...tagsToAdd])
				];
				await syncEntityTags('security', id, mergedTags);
			}
		}
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
