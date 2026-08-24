import { db } from '$lib/server/db';
import { account, holding, security, priceSnapshot } from '$lib/server/db/schema';
import { eq, sql } from 'drizzle-orm';
import { error } from '@sveltejs/kit';

export async function load({ params }) {
	const [acct] = await db.select().from(account).where(eq(account.id, params.id)).limit(1);
	if (!acct) error(404, 'Account not found');

	/*
	 * The following should generate SQL like this:
	 *
	 * select
	 * holding.id, holding.shares, security.symbol, security.full_name,
	 * holding.shares * (
	 * 	select price_snapshot.price from price_snapshot
	 * 	where price_snapshot.security_id = security.id
	 * 	order by price_snapshot.snapshot_date desc
	 * 	limit 1
	 * ) as current_value
	 * from holding
	 * inner join security on holding.security_id = security.id
	 * where holding.account_id = ?
	 * order by security.symbol
	 */

	const latestPrice = sql<number | null>`(
		select ${priceSnapshot.price} from ${priceSnapshot}
		where ${priceSnapshot.securityId} = ${security.id}
		order by ${priceSnapshot.snapshotDate} desc
		limit 1
	)`;

	const holdings = await db
		.select({
			id: holding.id,
			shares: holding.shares,
			symbol: security.symbol,
			fullName: security.fullName,
			currentValue: sql<number | null>`${holding.shares} * (${latestPrice})`
		})
		.from(holding)
		.innerJoin(security, eq(holding.securityId, security.id))
		.where(eq(holding.accountId, params.id))
		.orderBy(security.symbol);

	return { account: acct, holdings };
}
