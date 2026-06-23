import { db } from '$lib/server/db';
import { security, category, securityType, sector, industry, region } from '$lib/server/db/schema';
import { asc, eq } from 'drizzle-orm';

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

	return { securities };
}
