import { db } from '$lib/server/db';
import { account } from '$lib/server/db/schema';
import { fail } from '@sveltejs/kit';
import { getTagsForEntities, listAllTagNames, syncEntityTags } from '$lib/server/db/queries/tags';

export async function load() {
	const accounts = await db.select().from(account).orderBy(account.name);

	const [tagsByAccountId, allTagNames] = await Promise.all([
		getTagsForEntities(
			'account',
			accounts.map((acct) => acct.id)
		),
		listAllTagNames()
	]);

	return {
		accounts: accounts.map((acct) => ({ ...acct, tags: tagsByAccountId.get(acct.id) ?? [] })),
		tags: allTagNames
	};
}

export const actions = {
	create: async ({ request }) => {
		const data = await request.formData();
		const name = data.get('name')?.toString().trim();
		const tagsRaw = data.get('tags')?.toString();

		if (!name) return fail(400, { error: 'Name is required' });

		const tagNames: string[] = tagsRaw ? JSON.parse(tagsRaw) : [];

		const [{ accountId }] = await db
			.insert(account)
			.values({ name })
			.returning({ accountId: account.id });

		await syncEntityTags('account', accountId, tagNames);
	}
};
