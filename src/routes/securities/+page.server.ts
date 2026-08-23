import { db } from '$lib/server/db';
import { security, category, securityType, sector, industry, region } from '$lib/server/db/schema';
import { asc, eq } from 'drizzle-orm';
import { fail } from '@sveltejs/kit';

export async function load() {
	const securities = await db
		.select({
			id: security.id,
			symbol: security.symbol,
			fullName: security.fullName,
			category: category.name,
			type: securityType.name,
			sector: sector.name,
			industry: industry.name,
			region: region.name
		})
		.from(security)
		.leftJoin(category, eq(security.categoryId, category.id))
		.leftJoin(securityType, eq(security.typeId, securityType.id))
		.leftJoin(sector, eq(security.sectorId, sector.id))
		.leftJoin(industry, eq(security.industryId, industry.id))
		.leftJoin(region, eq(security.regionId, region.id))
		.orderBy(asc(security.symbol));

	const [categories, securityTypes, sectors, industries, regions] = await Promise.all([
		db.select({ id: category.id, name: category.name }).from(category).orderBy(category.name),
		db
			.select({ id: securityType.id, name: securityType.name })
			.from(securityType)
			.orderBy(securityType.name),
		db.select({ id: sector.id, name: sector.name }).from(sector).orderBy(sector.name),
		db.select({ id: industry.id, name: industry.name }).from(industry).orderBy(industry.name),
		db.select({ id: region.id, name: region.name }).from(region).orderBy(region.name)
	]);

	return { securities, categories, securityTypes, sectors, industries, regions };
}

export const actions = {
	create: async ({ request }) => {
		const data = await request.formData();
		const symbol = data.get('symbol')?.toString().trim().toUpperCase();
		const fullName = data.get('fullName')?.toString().trim() || null;
		const categoryId = data.get('categoryId')?.toString() || null;
		const typeId = data.get('typeId')?.toString() || null;
		const sectorId = data.get('sectorId')?.toString() || null;
		const industryId = data.get('industryId')?.toString() || null;
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
			categoryId,
			typeId,
			sectorId,
			industryId,
			regionId
		});
	}
};
