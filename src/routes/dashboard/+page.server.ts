import { getHoldingValuesBySector } from '$lib/server/db/queries/dashboard';

const FUND_CATEGORY_BY_REGION: Record<string, string> = {
	US: 'US funds',
	'International Developed': 'International funds',
	'Emerging Markets': 'Emerging market funds'
};

type SecurityContribution = { symbol: string; fullName: string | null; value: number };

export async function load() {
	const rows = await getHoldingValuesBySector();

	const totals = new Map<string, number>();
	const securitiesByCategory = new Map<string, Map<string, SecurityContribution>>();
	for (const row of rows) {
		if (row.value == null) continue;
		const name =
			row.sectorName ??
			(row.regionName && FUND_CATEGORY_BY_REGION[row.regionName]) ??
			'Unclassified';
		totals.set(name, (totals.get(name) ?? 0) + row.value);

		let securities = securitiesByCategory.get(name);
		if (!securities) {
			securities = new Map();
			securitiesByCategory.set(name, securities);
		}
		const existing = securities.get(row.symbol);
		if (existing) {
			existing.value += row.value;
		} else {
			securities.set(row.symbol, { symbol: row.symbol, fullName: row.fullName, value: row.value });
		}
	}

	const sorted = [...totals.entries()].map(([name, value]) => ({ name, value }));

	const valueBySector = sorted.slice(0, sorted.length);

	const categorySecurities: Record<string, SecurityContribution[]> = {};
	for (const { name } of valueBySector) {
		categorySecurities[name] = [...(securitiesByCategory.get(name)?.values() ?? [])];
	}

	const totalValue = sorted.reduce((sum, r) => sum + r.value, 0);

	return { valueBySector, totalValue, categorySecurities };
}
