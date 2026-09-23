import { account, security } from '$lib/server/db/schema';
import { asc } from 'drizzle-orm';
import { holdingRows } from '$lib/server/db/queries/holdings';

export async function load() {
	const heldRows = await holdingRows().orderBy(asc(account.name), asc(security.symbol));

	// Value of a single holding row: that account's shares times the security's
	// latest price. Computed in JS since drizzle's query builder has no
	// cross-column multiply operator outside a raw sql tag.
	const holdings = heldRows.map((r) => ({
		...r,
		totalValue: r.shares != null && r.price != null ? r.shares * r.price : null
	}));

	return { holdings };
}
