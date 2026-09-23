import { holdingRows } from './holdings';

export async function getHoldingValuesBySector() {
	const rows = await holdingRows();

	return rows.map((r) => ({
		symbol: r.symbol,
		fullName: r.fullName,
		sectorName: r.sector,
		regionName: r.region,
		value: r.shares != null && r.price != null ? r.shares * r.price : null
	}));
}
