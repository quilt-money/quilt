import { db } from '$lib/server/db';
import {
	account,
	holding,
	priceSnapshot,
	region,
	sector,
	security,
	securityType
} from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { latestPriceSnapshot } from './latest-price';
import { getTagsForEntities } from './tags';

/**
 * Every holding joined out to its account, security attributes, and latest
 * price. This is the "super query" reused across the accounts, portfolio,
 * and reports pages.
 */
export function holdingRows() {
	const { latestSnapshot, latestPriceOn } = latestPriceSnapshot();

	return db
		.select({
			id: holding.id,
			shares: holding.shares,
			accountId: holding.accountId,
			accountName: account.name,
			securityId: holding.securityId,
			symbol: security.symbol,
			fullName: security.fullName,
			type: securityType.name,
			sector: sector.name,
			region: region.name,
			price: priceSnapshot.price
		})
		.from(holding)
		.leftJoin(account, eq(holding.accountId, account.id))
		.innerJoin(security, eq(holding.securityId, security.id))
		.leftJoin(securityType, eq(security.typeId, securityType.id))
		.leftJoin(sector, eq(security.sectorId, sector.id))
		.leftJoin(region, eq(security.regionId, region.id))
		.leftJoin(latestSnapshot, eq(security.id, latestSnapshot.securityId))
		.leftJoin(priceSnapshot, latestPriceOn);
}

export type HoldingWithValue = Awaited<ReturnType<typeof holdingRows>>[number] & {
	totalValue: number | null;
};

/**
 * Adds each holding's market value (shares × latest price) to rows from {@link holdingRows}.
 * Computed in JS since drizzle's query builder has no cross-column multiply operator
 * outside a raw sql tag.
 */
export function withTotalValue(rows: Awaited<ReturnType<typeof holdingRows>>): HoldingWithValue[] {
	return rows.map((holding) => ({
		...holding,
		totalValue:
			holding.shares != null && holding.price != null ? holding.shares * holding.price : null
	}));
}

export type HoldingWithTags = HoldingWithValue & {
	tags: string[];
	accountTags: string[];
	securityTags: string[];
};

export async function withTags(holdings: HoldingWithValue[]): Promise<HoldingWithTags[]> {
	const accountIds = [
		...new Set(
			holdings
				.map((holding) => holding.accountId)
				.filter((accountId): accountId is string => accountId != null)
		)
	];
	const securityIds = [...new Set(holdings.map((holding) => holding.securityId))];

	const [accountTagsByAccountId, securityTagsBySecurityId] = await Promise.all([
		getTagsForEntities('account', accountIds),
		getTagsForEntities('security', securityIds)
	]);

	return holdings.map((holding) => {
		const accountTags = [
			...(holding.accountId ? (accountTagsByAccountId.get(holding.accountId) ?? []) : [])
		].sort((a, b) => a.localeCompare(b));
		const securityTags = [...(securityTagsBySecurityId.get(holding.securityId) ?? [])].sort(
			(a, b) => a.localeCompare(b)
		);
		const tags = [...new Set([...accountTags, ...securityTags])].sort((a, b) => a.localeCompare(b));
		return { ...holding, tags, accountTags, securityTags };
	});
}
