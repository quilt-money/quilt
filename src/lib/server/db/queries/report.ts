import { holdingRows } from './holdings';

export const ALLOCATION_DIMENSIONS = ['sector', 'region', 'account', 'type'] as const;
export type AllocationDimension = (typeof ALLOCATION_DIMENSIONS)[number];

export type AllocationSlice = { label: string; value: number };

const labelByDimension: Record<
	AllocationDimension,
	(row: Awaited<ReturnType<typeof holdingRows>>[number]) => string | null
> = {
	sector: (row) => row.sector,
	region: (row) => row.region,
	account: (row) => row.accountName,
	type: (row) => row.type
};

/** Total holding value grouped by a security/account attribute, for allocation pie charts. */
export async function getAllocationByDimension(
	dimension: AllocationDimension
): Promise<AllocationSlice[]> {
	const rows = await holdingRows();
	const getLabel = labelByDimension[dimension];

	const totalByLabel = new Map<string, number>();
	for (const row of rows) {
		if (row.shares == null || row.price == null) continue;
		const label = getLabel(row) ?? 'Unclassified';
		totalByLabel.set(label, (totalByLabel.get(label) ?? 0) + row.shares * row.price);
	}

	return [...totalByLabel.entries()]
		.map(([label, value]) => ({ label, value }))
		.sort((a, b) => b.value - a.value);
}
