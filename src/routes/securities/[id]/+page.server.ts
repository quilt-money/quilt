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
import { getTagsForEntity, listAllTagNames, syncEntityTags } from '$lib/server/db/queries/tags';

export async function load({ params }) {
	const [sec] = await db
		.select({
			id: security.id,
			symbol: security.symbol,
			fullName: security.fullName,
			typeId: security.typeId,
			sectorId: security.sectorId,
			regionId: security.regionId
		})
		.from(security)
		.where(eq(security.id, params.id))
		.limit(1);
	if (!sec) error(404, 'Security not found');

	const [latestSnapshot, securityTypes, sectors, regions, holdings, tags, allTags] =
		await Promise.all([
			db
				.select({ price: priceSnapshot.price, snapshotTime: priceSnapshot.snapshotTime })
				.from(priceSnapshot)
				.where(eq(priceSnapshot.securityId, params.id))
				.orderBy(desc(priceSnapshot.snapshotTime))
				.limit(1),
			db.select().from(securityType).orderBy(securityType.name),
			db.select().from(sector).orderBy(sector.name),
			db.select().from(region).orderBy(region.name),
			db
				.select({
					id: holding.id,
					shares: holding.shares,
					accountId: account.id,
					accountName: account.name
				})
				.from(holding)
				.innerJoin(account, eq(holding.accountId, account.id))
				.where(eq(holding.securityId, params.id))
				.orderBy(account.name),
			getTagsForEntity('security', params.id),
			listAllTagNames()
		]);

	return {
		security: sec,
		latestPrice: latestSnapshot[0]?.price ?? null,
		securityTypes,
		sectors,
		regions,
		holdings,
		tags,
		allTags
	};
}

export const actions = {
	update: async ({ request, params }) => {
		const data = await request.formData();
		const typeId = data.get('typeId')?.toString() || null;
		const sectorId = data.get('sectorId')?.toString() || null;
		const regionId = data.get('regionId')?.toString() || null;
		const tagsRaw = data.get('tags')?.toString();
		const tagNames: string[] = tagsRaw ? JSON.parse(tagsRaw) : [];

		await db.update(security).set({ typeId, sectorId, regionId }).where(eq(security.id, params.id));
		await syncEntityTags('security', params.id, tagNames);
	}
};
