import { fail } from '@sveltejs/kit';
import { getSyncSchedule, saveSyncSchedule } from '$lib/server/sync-scheduler';

export async function load() {
	return { syncSchedule: await getSyncSchedule() };
}

export const actions = {
	saveSyncSchedule: async ({ request }) => {
		const data = await request.formData();
		const enabled = data.get('enabled') === 'on';
		const time = data.get('time')?.toString() ?? '';

		if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) return fail(400, { error: 'Invalid time' });

		await saveSyncSchedule({ enabled, time });
	}
};
