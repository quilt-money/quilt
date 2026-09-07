import { getHoldingValuesBySector } from '$lib/server/db/queries/dashboard';

const FUND_CATEGORY_BY_REGION: Record<string, string> = {
	US: 'US funds',
	'International Developed': 'International funds',
	'Emerging Markets': 'Emerging market funds'
};

type CategoryFilter = { column: 'sector' | 'region' | 'type'; value: string };

export async function load() {
	const rows = await getHoldingValuesBySector();

	const totals = new Map<string, number>();
	const filters = new Map<string, CategoryFilter[]>();
	for (const row of rows) {
		if (row.value == null) continue;
		let name: string;
		let categoryFilters: CategoryFilter[];
		if (row.sectorName) {
			name = row.sectorName;
			categoryFilters = [{ column: 'sector', value: row.sectorName }];
		} else if (row.regionName && FUND_CATEGORY_BY_REGION[row.regionName]) {
			name = FUND_CATEGORY_BY_REGION[row.regionName];
			categoryFilters = [
				{ column: 'type', value: 'ETF' },
				{ column: 'region', value: row.regionName }
			];
		} else {
			name = 'Unclassified';
			categoryFilters = [];
		}
		totals.set(name, (totals.get(name) ?? 0) + row.value);
		filters.set(name, categoryFilters);
	}

	const valueBySector = [...totals.entries()].map(([name, value]) => ({
		name,
		value,
		filters: filters.get(name) ?? []
	}));

	const totalValue = valueBySector.reduce((sum, r) => sum + r.value, 0);

	return { valueBySector, totalValue };
}
