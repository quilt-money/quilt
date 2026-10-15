import { json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { syncSecurity } from '$lib/server/sync-security';

export async function POST({ request, fetch }) {
	const { securityId, snapshotTime } = await request.json();
	if (!env.FMP_API_KEY) return json({ status: 'failed', error: 'FMP_API_KEY is not set' });

	return json(
		await syncSecurity({ fetchFn: fetch, apiKey: env.FMP_API_KEY, securityId, snapshotTime })
	);
}
