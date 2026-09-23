import { db } from '$lib/server/db';
import { account, accountTag, holding, security, tag } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { error, fail, redirect } from '@sveltejs/kit';
import { holdingRows } from '$lib/server/db/queries/holdings';

export async function load({ params }) {
	const [acct] = await db.select().from(account).where(eq(account.id, params.id)).limit(1);
	if (!acct) error(404, 'Account not found');

	const [holdingsRows, tags, allTags] = await Promise.all([
		holdingRows().where(eq(holding.accountId, params.id)).orderBy(security.symbol),
		db
			.select({ name: tag.name })
			.from(accountTag)
			.innerJoin(tag, eq(accountTag.tagId, tag.id))
			.where(eq(accountTag.accountId, params.id))
			.orderBy(tag.name),
		db.select({ name: tag.name }).from(tag).orderBy(tag.name)
	]);

	const holdings = holdingsRows.map((r) => ({
		...r,
		totalValue: r.shares != null && r.price != null ? r.shares * r.price : null
	}));

	return {
		account: acct,
		holdings,
		tags: tags.map((t) => t.name),
		allTags: allTags.map((t) => t.name)
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
		await db.delete(accountTag).where(eq(accountTag.accountId, params.id));

		if (tagNames.length > 0) {
			const tagIds: string[] = [];
			for (const tagName of tagNames) {
				const existing = await db.select().from(tag).where(eq(tag.name, tagName)).limit(1);
				if (existing.length > 0) {
					tagIds.push(existing[0].id);
				} else {
					const [{ tagId }] = await db
						.insert(tag)
						.values({ name: tagName })
						.returning({ tagId: tag.id });
					tagIds.push(tagId);
				}
			}
			await db.insert(accountTag).values(tagIds.map((tagId) => ({ accountId: params.id, tagId })));
		}
	},

	delete: async ({ params }) => {
		await db.delete(account).where(eq(account.id, params.id));
		redirect(303, '/accounts');
	}
};
