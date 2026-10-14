import { formatMoney } from '$lib/format';
import type { HoldingWithTags } from '$lib/server/db/queries/holdings';
import type { PriceHistory } from '$lib/server/db/queries/price-history';

export type Metric = 'value' | 'gainLoss' | 'count';
export type Dimension = 'none' | 'account' | 'sector' | 'region' | 'type' | 'security' | 'tags';
export type ChartType = 'pie' | 'bar' | 'table';
export type FilterField =
	| 'accountName'
	| 'sector'
	| 'region'
	| 'type'
	| 'accountTags'
	| 'securityTags';
export type ReportFilters = Record<FilterField, string[]>;

/** The columns the portfolio table can be filtered on when drilling down from a report. */
export type PortfolioFilterField = 'accountName' | 'sector' | 'region' | 'type' | 'tags';

export type ReportConfig = {
	metric: Metric;
	dimension: Dimension;
	chartType: ChartType;
	filters: ReportFilters;
};

/** Charts the total value of the filtered holdings over time, from the price snapshot history. */
export type TimeChartType = 'area' | 'smooth' | 'line';

export const TIME_CHART_TYPE_LABELS: Record<TimeChartType, string> = {
	area: 'Area',
	smooth: 'Smoothed line',
	line: 'Line'
};

export type TimeInterval = 'day' | 'week' | 'month' | 'year';

export const TIME_INTERVAL_LABELS: Record<TimeInterval, string> = {
	day: 'Daily',
	week: 'Weekly',
	month: 'Monthly',
	year: 'Yearly'
};

export type TimeReportConfig = {
	reportType: 'time';
	chartType: TimeChartType;
	/** One point per step on the x-axis, taking the last value in each. */
	interval: TimeInterval;
	/** Inclusive YYYY-MM-DD bounds on the chart; an empty string leaves that side open. */
	startDate: string;
	endDate: string;
	filters: ReportFilters;
};

export type SavedReportConfig = ReportConfig | TimeReportConfig;

export function isTimeReportConfig(config: SavedReportConfig): config is TimeReportConfig {
	return 'reportType' in config && config.reportType === 'time';
}

export const METRIC_LABELS: Record<Metric, string> = {
	value: 'Total value',
	gainLoss: 'Total gain/loss',
	count: 'Number of holdings'
};

export const DIMENSION_LABELS: Record<Dimension, string> = {
	none: 'None (single total)',
	account: 'Account',
	sector: 'Sector',
	region: 'Region',
	type: 'Type',
	security: 'Security',
	tags: 'Security tag'
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
	accountTags: 'Account tag',
	securityTags: 'Security tag'
};

export const FILTER_FIELDS = Object.keys(FILTER_LABELS) as FilterField[];

export const DIMENSION_FILTER_FIELD: Record<Dimension, PortfolioFilterField | 'search' | null> = {
	none: null,
	account: 'accountName',
	sector: 'sector',
	region: 'region',
	type: 'type',
	security: 'search',
	tags: 'tags'
};

export function defaultReportConfig(holdings: HoldingWithTags[]): ReportConfig {
	return {
		metric: 'value',
		dimension: 'sector',
		chartType: 'pie',
		filters: {
			accountName: filterOptions(holdings, 'accountName'),
			sector: filterOptions(holdings, 'sector'),
			region: filterOptions(holdings, 'region'),
			type: filterOptions(holdings, 'type'),
			accountTags: filterOptions(holdings, 'accountTags'),
			securityTags: filterOptions(holdings, 'securityTags')
		}
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
			return holding.securityTags[0] ?? 'Unclassified';
	}
}

export function filterHoldings(
	holdings: HoldingWithTags[],
	filters: ReportFilters
): HoldingWithTags[] {
	return holdings.filter((holding) =>
		FILTER_FIELDS.every((field) => {
			const selectedValues = filters[field] ?? [];
			const holdingValue = holding[field];
			if (Array.isArray(holdingValue)) {
				// Untagged holdings have no tag to check against the selection, so a
				// tag filter can't be the thing that excludes them.
				if (holdingValue.length === 0) return true;
				return holdingValue.some((value) => selectedValues.includes(value));
			}
			// Same reasoning for a holding missing this attribute (e.g. no sector).
			if (holdingValue == null) return true;
			return selectedValues.includes(holdingValue);
		})
	);
}

export type ReportSlice = { label: string; value: number };

export function computeSlices(holdings: HoldingWithTags[], config: ReportConfig): ReportSlice[] {
	const filteredHoldings = filterHoldings(holdings, config.filters);
	const totalByLabel = new Map<string, number>();

	for (const holding of filteredHoldings) {
		// Holdings without a price or cost basis have no value or gain/loss to add.
		if (config.metric === 'value' && holding.totalValue == null) continue;
		if (config.metric === 'gainLoss' && holding.gainLoss == null) continue;
		const amount =
			config.metric === 'value'
				? (holding.totalValue ?? 0)
				: config.metric === 'gainLoss'
					? (holding.gainLoss ?? 0)
					: 1;
		// A holding can carry multiple tags, so grouping by tag credits its value to
		// every tag it has rather than forcing it into a single bucket. Only security
		// tags are used here, not account tags.
		const labels =
			config.dimension === 'tags'
				? holding.securityTags.length > 0
					? holding.securityTags
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
	return metric !== 'count' ? formatMoney(value) : value.toLocaleString();
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

export function defaultTimeReportConfig(holdings: HoldingWithTags[]): TimeReportConfig {
	return {
		reportType: 'time',
		chartType: 'area',
		interval: 'day',
		startDate: '',
		endDate: '',
		filters: defaultReportConfig(holdings).filters
	};
}

export type TimeSeriesPoint = { time: string; value: number };

/**
 * Total value of the filtered holdings at each snapshot time. Only today's share counts are
 * stored, so past values are today's shares at each past price. A point is only emitted once
 * every included security has a price, otherwise the series would jump as securities appear.
 * Points outside the config's date range are dropped, and each interval keeps only its last point.
 */
export function computeTimeSeries(
	holdings: HoldingWithTags[],
	priceHistory: PriceHistory,
	{ filters, startDate, endDate, interval }: TimeReportConfig
): TimeSeriesPoint[] {
	const sharesBySecurityId = new Map<string, number>();
	for (const holding of filterHoldings(holdings, filters)) {
		if (holding.shares == null || !priceHistory[holding.securityId]?.length) continue;
		sharesBySecurityId.set(
			holding.securityId,
			(sharesBySecurityId.get(holding.securityId) ?? 0) + holding.shares
		);
	}

	const securityIds = [...sharesBySecurityId.keys()];
	const times = [
		...new Set(
			securityIds.flatMap((securityId) => priceHistory[securityId].map(({ time }) => time))
		)
	].sort();

	// Walk each security's history alongside the shared timeline, carrying its last price forward.
	const nextIndexBySecurityId = new Map(securityIds.map((securityId) => [securityId, 0]));
	const latestPriceBySecurityId = new Map<string, number>();
	const points: TimeSeriesPoint[] = [];

	for (const time of times) {
		for (const securityId of securityIds) {
			const history = priceHistory[securityId];
			let nextIndex = nextIndexBySecurityId.get(securityId) ?? 0;
			while (nextIndex < history.length && history[nextIndex].time <= time) {
				latestPriceBySecurityId.set(securityId, history[nextIndex].price);
				nextIndex++;
			}
			nextIndexBySecurityId.set(securityId, nextIndex);
		}
		if (latestPriceBySecurityId.size < securityIds.length) continue;

		let value = 0;
		for (const [securityId, shares] of sharesBySecurityId) {
			value += shares * (latestPriceBySecurityId.get(securityId) ?? 0);
		}
		// The date range trims what's shown, but prices still carry forward from before it.
		const date = time.slice(0, 10);
		if ((startDate && date < startDate) || (endDate && date > endDate)) continue;
		points.push({ time, value });
	}

	return lastPointPerInterval(points, interval);
}

/** The start of the day, ISO week (Monday), month or year that a snapshot time falls in. */
function intervalKey(time: string, interval: TimeInterval): string {
	const date = time.slice(0, 10);
	switch (interval) {
		case 'day':
			return date;
		case 'week': {
			const weekStart = new Date(`${date}T00:00:00Z`);
			weekStart.setUTCDate(weekStart.getUTCDate() - ((weekStart.getUTCDay() + 6) % 7));
			return weekStart.toISOString().slice(0, 10);
		}
		case 'month':
			return date.slice(0, 7);
		case 'year':
			return date.slice(0, 4);
	}
}

function lastPointPerInterval(
	points: TimeSeriesPoint[],
	interval: TimeInterval
): TimeSeriesPoint[] {
	const lastPointByKey = new Map<string, TimeSeriesPoint>();
	for (const point of points) lastPointByKey.set(intervalKey(point.time, interval), point);
	return [...lastPointByKey.values()];
}
