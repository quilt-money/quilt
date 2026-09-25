import { holdingRows, withTags, withTotalValue } from '$lib/server/db/queries/holdings';
import { listReports } from '$lib/server/db/queries/reports';

export async function load() {
	const [heldRows, reports] = await Promise.all([holdingRows(), listReports()]);

	return { holdings: await withTags(withTotalValue(heldRows)), reports };
}
