import { db } from '$lib/server/db';
import { account, accountTag, tag } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { fail } from '@sveltejs/kit';

export async function load() {
	const [accounts, tags] = await Promise.all([
		db.select().from(account).orderBy(account.name),
		db.select().from(tag).orderBy(tag.name)
	]);
	return { accounts, tags };
}

export const actions = {
	create: async ({ request }) => {
		const data = await request.formData();
		const name = data.get('name')?.toString().trim();
		const owner = data.get('owner')?.toString();
		const tagsRaw = data.get('tags')?.toString();

		if (!name) return fail(400, { error: 'Name is required' });
		if (owner !== 'Dan' && owner !== 'Emily') return fail(400, { error: 'Invalid owner' });

		const tagNames: string[] = tagsRaw ? JSON.parse(tagsRaw) : [];

		const [{ accountId }] = await db
			.insert(account)
			.values({ name, owner })
			.returning({ accountId: account.id });

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
			await db.insert(accountTag).values(tagIds.map((tagId) => ({ accountId, tagId })));
		}
	}
};
