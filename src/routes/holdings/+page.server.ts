import { db } from '$lib/server/db';
import { holding, account, security } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { fail } from '@sveltejs/kit';

export async function load() {
	const holdings = await db
		.select({
			id: holding.id,
			shares: holding.shares,
			basis: holding.basis,
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

	return { holdings, accounts };
}

export const actions = {
	create: async ({ request }) => {
		const data = await request.formData();
		const accountId = data.get('accountId')?.toString();
		const securitySymbol = data.get('securitySymbol')?.toString()?.trim().toUpperCase();
		const shares = parseFloat(data.get('shares')?.toString() ?? '');
		const basis = parseFloat(data.get('basis')?.toString() ?? '');

		if (!accountId) return fail(400, { error: 'Account is required' });
		if (!securitySymbol) return fail(400, { error: 'Security is required' });
		if (isNaN(shares)) return fail(400, { error: 'Shares is required' });
		if (isNaN(basis)) return fail(400, { error: 'Basis is required' });

		const [existing] = await db
			.select({ id: security.id })
			.from(security)
			.where(eq(security.symbol, securitySymbol));

		let securityId: string;
		if (existing) {
			securityId = existing.id;
		} else {
			const [inserted] = await db
				.insert(security)
				.values({ symbol: securitySymbol })
				.returning({ id: security.id });
			securityId = inserted.id;
		}

		await db.insert(holding).values({ accountId, securityId, shares, basis });
	},

	delete: async ({ request }) => {
		const data = await request.formData();
		const id = data.get('id')?.toString();
		if (!id) return fail(400, { error: 'Missing id' });
		await db.delete(holding).where(eq(holding.id, id));
	}
};
