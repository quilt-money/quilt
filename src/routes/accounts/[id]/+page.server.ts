import { db } from '$lib/server/db';
import { account, holding, security } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { error } from '@sveltejs/kit';

export async function load({ params }) {
	const [acct] = await db.select().from(account).where(eq(account.id, params.id)).limit(1);
	if (!acct) error(404, 'Account not found');

	const holdings = await db
		.select({
			id: holding.id,
			shares: holding.shares,
			symbol: security.symbol,
			fullName: security.fullName
		})
		.from(holding)
		.innerJoin(security, eq(holding.securityId, security.id))
		.where(eq(holding.accountId, params.id))
		.orderBy(security.symbol);

	return { account: acct, holdings };
}
