import { db } from '$lib/server/db';
import { holding, account, security } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { fail } from '@sveltejs/kit';

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

export const actions = {
	create: async ({ request }) => {
		const data = await request.formData();
		const accountId = data.get('accountId')?.toString();
		const securityId = data.get('securityId')?.toString();
		const shares = parseFloat(data.get('shares')?.toString() ?? '');

		if (!accountId) return fail(400, { error: 'Account is required' });
		if (!securityId) return fail(400, { error: 'Security is required' });
		if (isNaN(shares)) return fail(400, { error: 'Shares is required' });

		await db.insert(holding).values({ accountId, securityId, shares });
	}
};
