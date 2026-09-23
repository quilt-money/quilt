import { account, security } from '$lib/server/db/schema';
import { asc } from 'drizzle-orm';
import { holdingRows } from '$lib/server/db/queries/holdings';

export async function load() {
	const heldRows = await holdingRows().orderBy(asc(account.name), asc(security.symbol));

	// Value of a single holding row: that account's shares times the security's
	// latest price. Computed in JS since drizzle's query builder has no
	// cross-column multiply operator outside a raw sql tag.
	const holdings = heldRows.map((holding) => ({
		...holding,
		totalValue:
			holding.shares != null && holding.price != null ? holding.shares * holding.price : null
	}));

	return { holdings };
}
