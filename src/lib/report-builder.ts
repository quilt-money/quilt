import { formatMoney } from '$lib/format';
import type { HoldingWithValue } from '$lib/server/db/queries/holdings';

export type Metric = 'value' | 'count';
export type Dimension = 'none' | 'account' | 'sector' | 'region' | 'type' | 'security';
export type ChartType = 'pie' | 'bar' | 'table';
export type FilterField = 'accountName' | 'sector' | 'region' | 'type';
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
	security: 'Security'
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
	type: 'Type'
};

export const FILTER_FIELDS = Object.keys(FILTER_LABELS) as FilterField[];

export function defaultReportConfig(): ReportConfig {
	return {
		metric: 'value',
		dimension: 'sector',
		chartType: 'pie',
		filters: { accountName: [], sector: [], region: [], type: [] }
	};
}

export function groupLabel(holding: HoldingWithValue, dimension: Dimension): string {
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
	}
}

export function filterHoldings(
	holdings: HoldingWithValue[],
	filters: ReportFilters
): HoldingWithValue[] {
	return holdings.filter((holding) =>
		FILTER_FIELDS.every((field) => {
			const selectedValues = filters[field];
			return selectedValues.length === 0 || selectedValues.includes(holding[field] ?? '');
		})
	);
}

export type ReportSlice = { label: string; value: number };

export function computeSlices(holdings: HoldingWithValue[], config: ReportConfig): ReportSlice[] {
	const filteredHoldings = filterHoldings(holdings, config.filters);
	const totalByLabel = new Map<string, number>();

	for (const holding of filteredHoldings) {
		if (config.metric === 'value' && holding.totalValue == null) continue;
		const label = groupLabel(holding, config.dimension);
		const amount = config.metric === 'value' ? (holding.totalValue ?? 0) : 1;
		totalByLabel.set(label, (totalByLabel.get(label) ?? 0) + amount);
	}

	return [...totalByLabel.entries()]
		.map(([label, value]) => ({ label, value }))
		.sort((a, b) => b.value - a.value);
}

export function formatMetricValue(metric: Metric, value: number): string {
	return metric === 'value' ? formatMoney(value) : value.toLocaleString();
}

/** Distinct values present for a filter field, for populating its filter picker. */
export function filterOptions(holdings: HoldingWithValue[], field: FilterField): string[] {
	const values = new Set<string>();
	for (const holding of holdings) {
		const value = holding[field];
		if (value) values.add(value);
	}
	return [...values].sort((a, b) => a.localeCompare(b));
}
