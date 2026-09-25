import { formatMoney } from '$lib/format';
import type { HoldingWithTags } from '$lib/server/db/queries/holdings';

export type Metric = 'value' | 'count';
export type Dimension = 'none' | 'account' | 'sector' | 'region' | 'type' | 'security' | 'tags';
export type ChartType = 'pie' | 'bar' | 'table';
export type FilterField = 'accountName' | 'sector' | 'region' | 'type' | 'tags';
export type ReportFilters = Record<FilterField, string[]>;

export type ReportConfig = {
	metric: Metric;
	dimension: Dimension;
	chartType: ChartType;
	filters: ReportFilters;
};

export const METRIC_LABELS: Record<Metric, string> = {
	value: 'Total value',
	count: 'Number of holdings'
};

export const DIMENSION_LABELS: Record<Dimension, string> = {
	none: 'None (single total)',
	account: 'Account',
	sector: 'Sector',
	region: 'Region',
	type: 'Type',
	security: 'Security',
	tags: 'Tag'
};

export const CHART_TYPE_LABELS: Record<ChartType, string> = {
	pie: 'Pie',
	bar: 'Bar',
	table: 'Table'
};

export const FILTER_LABELS: Record<FilterField, string> = {
	accountName: 'Account',
	sector: 'Sector',
	region: 'Region',
	type: 'Type',
	tags: 'Tag'
};

export const FILTER_FIELDS = Object.keys(FILTER_LABELS) as FilterField[];

export const DIMENSION_FILTER_FIELD: Record<Dimension, FilterField | 'search' | null> = {
	none: null,
	account: 'accountName',
	sector: 'sector',
	region: 'region',
	type: 'type',
	security: 'search',
	tags: 'tags'
};

export function defaultReportConfig(): ReportConfig {
	return {
		metric: 'value',
		dimension: 'sector',
		chartType: 'pie',
		filters: { accountName: [], sector: [], region: [], type: [], tags: [] }
	};
}

export function groupLabel(holding: HoldingWithTags, dimension: Dimension): string {
	switch (dimension) {
		case 'none':
			return 'Total';
		case 'account':
			return holding.accountName ?? 'Unclassified';
		case 'sector':
			return holding.sector ?? 'Unclassified';
		case 'region':
			return holding.region ?? 'Unclassified';
		case 'type':
			return holding.type ?? 'Unclassified';
		case 'security':
			return holding.symbol;
		case 'tags':
			return holding.tags[0] ?? 'Unclassified';
	}
}

export function filterHoldings(
	holdings: HoldingWithTags[],
	filters: ReportFilters
): HoldingWithTags[] {
	return holdings.filter((holding) =>
		FILTER_FIELDS.every((field) => {
			const selectedValues = filters[field] ?? [];
			if (selectedValues.length === 0) return true;
			const holdingValue = holding[field];
			if (Array.isArray(holdingValue)) {
				return holdingValue.some((value) => selectedValues.includes(value));
			}
			return selectedValues.includes(holdingValue ?? '');
		})
	);
}

export type ReportSlice = { label: string; value: number };

export function computeSlices(holdings: HoldingWithTags[], config: ReportConfig): ReportSlice[] {
	const filteredHoldings = filterHoldings(holdings, config.filters);
	const totalByLabel = new Map<string, number>();

	for (const holding of filteredHoldings) {
		if (config.metric === 'value' && holding.totalValue == null) continue;
		const amount = config.metric === 'value' ? (holding.totalValue ?? 0) : 1;
		// A holding can carry multiple tags, so grouping by tag credits its value to
		// every tag it has rather than forcing it into a single bucket.
		const labels =
			config.dimension === 'tags'
				? holding.tags.length > 0
					? holding.tags
					: ['Unclassified']
				: [groupLabel(holding, config.dimension)];
		for (const label of labels) {
			totalByLabel.set(label, (totalByLabel.get(label) ?? 0) + amount);
		}
	}

	return [...totalByLabel.entries()]
		.map(([label, value]) => ({ label, value }))
		.sort((a, b) => b.value - a.value);
}

export function formatMetricValue(metric: Metric, value: number): string {
	return metric === 'value' ? formatMoney(value) : value.toLocaleString();
}

/** Distinct values present for a filter field, for populating its filter picker. */
export function filterOptions(holdings: HoldingWithTags[], field: FilterField): string[] {
	const values = new Set<string>();
	for (const holding of holdings) {
		const value = holding[field];
		if (Array.isArray(value)) {
			for (const tag of value) values.add(tag);
		} else if (value) {
			values.add(value);
		}
	}
	return [...values].sort((a, b) => a.localeCompare(b));
}
