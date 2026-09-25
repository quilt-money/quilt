import { db } from '$lib/server/db';
import { account, holding, security } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { error, fail, redirect } from '@sveltejs/kit';
import { holdingRows } from '$lib/server/db/queries/holdings';
import {
	deleteEntityTags,
	getTagsForEntity,
	listAllTagNames,
	syncEntityTags
} from '$lib/server/db/queries/tags';

export async function load({ params }) {
	const [acct] = await db.select().from(account).where(eq(account.id, params.id)).limit(1);
	if (!acct) error(404, 'Account not found');

	const [holdingsRows, tags, allTags] = await Promise.all([
		holdingRows().where(eq(holding.accountId, params.id)).orderBy(security.symbol),
		getTagsForEntity('account', params.id),
		listAllTagNames()
	]);

	const holdings = holdingsRows.map((row) => ({
		...row,
		totalValue: row.shares != null && row.price != null ? row.shares * row.price : null
	}));

	return {
		account: acct,
		holdings,
		tags,
		allTags
	};
}

export const actions = {
	update: async ({ request, params }) => {
		const data = await request.formData();
		const name = data.get('name')?.toString().trim();
		const tagsRaw = data.get('tags')?.toString();

		if (!name) return fail(400, { error: 'Name is required' });

		const tagNames: string[] = tagsRaw ? JSON.parse(tagsRaw) : [];

		await db.update(account).set({ name }).where(eq(account.id, params.id));
		await syncEntityTags('account', params.id, tagNames);
	},

	delete: async ({ params }) => {
		await deleteEntityTags('account', params.id);
		await db.delete(account).where(eq(account.id, params.id));
		redirect(303, '/accounts');
	}
};
