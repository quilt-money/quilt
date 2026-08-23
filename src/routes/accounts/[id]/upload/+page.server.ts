import { db } from '$lib/server/db';
import { account } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { error, fail, redirect } from '@sveltejs/kit';
import { parse } from 'csv/sync';

const CSV_SCHEMA = ['Symbol', 'Name', 'Shares', 'Basis'];

function isValidHeader(header: string[]): boolean {
	return (
		header.length === CSV_SCHEMA.length && CSV_SCHEMA.every((column) => header.includes(column))
	);
}

export async function load({ params }) {
	const [acct] = await db.select().from(account).where(eq(account.id, params.id)).limit(1);
	if (!acct) error(404, 'Account not found');

	return { account: acct };
}

export const actions = {
	async upload({ request, params }) {
		const formData = await request.formData();
		const file = formData.get('file');

		if (!(file instanceof File) || file.size === 0) {
			return fail(400, { message: 'No file provided' });
		}

		const text = await file.text();
		const [header] = parse(text, { to_line: 1 }) as string[][];

		if (!header || !isValidHeader(header)) {
			return fail(400, {
				message: `CSV must have exactly these headers: ${CSV_SCHEMA.join(', ')}`
			});
		}

		console.log('CSV header:', header);

		redirect(303, `/accounts/${params.id}`);
	}
};
