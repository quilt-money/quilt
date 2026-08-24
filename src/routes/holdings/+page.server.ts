import { db } from '$lib/server/db';
import { holding, account, security } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

export async function load() {
	const holdings = await db
		.select({
			id: holding.id,
			shares: holding.shares,
			accountId: holding.accountId,
			accountName: account.name,
			securityId: holding.securityId,
			securitySymbol: security.symbol
		})
		.from(holding)
		.leftJoin(account, eq(holding.accountId, account.id))
		.leftJoin(security, eq(holding.securityId, security.id))
		.orderBy(account.name, security.symbol);

	const accounts = await db
		.select({ id: account.id, name: account.name })
		.from(account)
		.orderBy(account.name);

	const securities = await db
		.select({ id: security.id, symbol: security.symbol })
		.from(security)
		.orderBy(security.symbol);

	return { holdings, accounts, securities };
}
