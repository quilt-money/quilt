import { db } from '$lib/server/db';
import {
	security,
	category,
	securityType,
	sector,
	industry,
	region,
	priceSnapshot
} from '$lib/server/db/schema';
import { asc, eq } from 'drizzle-orm';
import { fail } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';

// FMP's sector taxonomy doesn't match the GICS sector names seeded in this app,
// so map its ~11 sector names onto our GICS sectors. FMP's industry field is far
// more granular than our GICS industries and doesn't map cleanly, so it's left alone.
const FMP_SECTOR_TO_GICS: Record<string, string> = {
	'Basic Materials': 'Materials',
	'Communication Services': 'Communication Services',
	'Consumer Cyclical': 'Consumer Discretionary',
	'Consumer Defensive': 'Consumer Staples',
	Energy: 'Energy',
	'Financial Services': 'Financials',
	Healthcare: 'Health Care',
	Industrials: 'Industrials',
	'Real Estate': 'Real Estate',
	Technology: 'Information Technology',
	Utilities: 'Utilities'
};

// Standard MSCI-style developed/emerging market classification, keyed by ISO alpha-2 country code.
const DEVELOPED_COUNTRIES = new Set([
	'CA',
	'GB',
	'DE',
	'FR',
	'JP',
	'AU',
	'CH',
	'NL',
	'SE',
	'DK',
	'NO',
	'FI',
	'BE',
	'AT',
	'IE',
	'IT',
	'ES',
	'PT',
	'IL',
	'SG',
	'HK',
	'NZ'
]);
const EMERGING_COUNTRIES = new Set([
	'CN',
	'IN',
	'BR',
	'TW',
	'KR',
	'ZA',
	'MX',
	'ID',
	'TH',
	'MY',
	'PH',
	'PL',
	'TR',
	'SA',
	'AE',
	'QA',
	'KW',
	'CL',
	'CO',
	'PE',
	'EG',
	'GR',
	'HU',
	'CZ'
]);

function regionBucketFor(country: string | null): string {
	if (country === 'US') return 'US';
	if (country && DEVELOPED_COUNTRIES.has(country)) return 'International Developed';
	if (country && EMERGING_COUNTRIES.has(country)) return 'Emerging Markets';
	return 'Other';
}

type FmpProfileResponse = {
	symbol: string;
	price: number | null;
	marketCap: number | null;
	beta: number | null;
	lastDividend: number | null;
	range: string | null;
	change: number | null;
	changePercentage: number | null;
	volume: number | null;
	averageVolume: number | null;
	companyName: string | null;
	currency: string | null;
	cik: string | null;
	isin: string | null;
	cusip: string | null;
	exchangeFullName: string | null;
	exchange: string | null;
	industry: string | null;
	website: string | null;
	description: string | null;
	ceo: string | null;
	sector: string | null;
	country: string | null;
	fullTimeEmployees: string | null;
	phone: string | null;
	address: string | null;
	city: string | null;
	state: string | null;
	zip: string | null;
	image: string | null;
	ipoDate: string | null;
	defaultImage: boolean;
	isEtf: boolean;
	isActivelyTrading: boolean;
	isAdr: boolean;
	isFund: boolean;
};

async function fetchFmpProfile(
	fetchFn: typeof fetch,
	symbol: string
): Promise<FmpProfileResponse | null> {
	const url = `https://financialmodelingprep.com/stable/profile?symbol=${encodeURIComponent(symbol)}&apikey=${env.FMP_API_KEY}`;
	const res = await fetchFn(url);
	if (!res.ok) return null;
	const data: FmpProfileResponse[] = await res.json();
	return data[0] ?? null;
}

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
	},

	sync: async ({ fetch }) => {
		if (!env.FMP_API_KEY) return fail(500, { error: 'FMP_API_KEY is not set' });

		const securities = await db.select({ id: security.id, symbol: security.symbol }).from(security);

		const [securityTypes, sectors, regions] = await Promise.all([
			db.select().from(securityType),
			db.select().from(sector),
			db.select().from(region)
		]);
		const typeIdByName = new Map(securityTypes.map((t) => [t.name, t.id]));
		const sectorIdByName = new Map(sectors.map((s) => [s.name, s.id]));
		const regionIdByName = new Map(regions.map((r) => [r.name, r.id]));

		const snapshotDate = new Date().toISOString().slice(0, 10);

		for (const s of securities) {
			let profile;
			try {
				profile = await fetchFmpProfile(fetch, s.symbol);
			} catch (err) {
				console.error(`FMP sync failed for ${s.symbol}:`, err);
				continue;
			}
			if (!profile) continue;

			const typeName = profile.isEtf ? 'ETF' : profile.isFund ? 'Mutual Fund' : 'Stock';
			const gicsSector = profile.sector ? FMP_SECTOR_TO_GICS[profile.sector] : undefined;
			const regionName = regionBucketFor(profile.country);

			await db
				.update(security)
				.set({
					fullName: profile.companyName || undefined,
					typeId: typeIdByName.get(typeName),
					sectorId: gicsSector ? sectorIdByName.get(gicsSector) : undefined,
					regionId: regionIdByName.get(regionName)
				})
				.where(eq(security.id, s.id));

			if (profile.price != null) {
				await db
					.insert(priceSnapshot)
					.values({ securityId: s.id, price: profile.price, snapshotDate })
					.onConflictDoUpdate({
						target: [priceSnapshot.securityId, priceSnapshot.snapshotDate],
						set: { price: profile.price }
					});
			}
		}
	}
};
