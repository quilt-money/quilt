import { account, security } from '$lib/server/db/schema';
import { asc } from 'drizzle-orm';
import { holdingRows, withTotalValue } from '$lib/server/db/queries/holdings';

export async function load() {
	const heldRows = await holdingRows().orderBy(asc(account.name), asc(security.symbol));

	return { holdings: withTotalValue(heldRows) };
}
