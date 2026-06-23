import { db } from '$lib/server/db';
import { account } from '$lib/server/db/schema';
import { fail } from '@sveltejs/kit';

export async function load() {
	const accounts = await db.select().from(account).orderBy(account.name);
	return { accounts };
}

export const actions = {
	create: async ({ request }) => {
		const data = await request.formData();
		const name = data.get('name')?.toString().trim();
		const owner = data.get('owner')?.toString();

		if (!name) return fail(400, { error: 'Name is required' });
		if (owner !== 'Dan' && owner !== 'Emily') return fail(400, { error: 'Invalid owner' });

		await db.insert(account).values({ name, owner });
	}
};
