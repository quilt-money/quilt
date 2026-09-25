import { holdingRows, withTotalValue } from '$lib/server/db/queries/holdings';

export async function load() {
	const heldRows = await holdingRows();

	return { holdings: withTotalValue(heldRows) };
}
