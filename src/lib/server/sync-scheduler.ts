import { Cron } from 'croner';
import { eq } from 'drizzle-orm';
import { env } from '$env/dynamic/private';
import { db } from '$lib/server/db';
import { security, syncSchedule } from '$lib/server/db/schema';
import { syncSecurity } from '$lib/server/sync-security';

const SCHEDULE_ID = 1;

let scheduledJob: Cron | null = null;

export type SyncScheduleSettings = {
	enabled: boolean;
	time: string;
	lastRunAt: string | null;
	lastRunSummary: string | null;
};

export async function getSyncSchedule(): Promise<SyncScheduleSettings> {
	const [schedule] = await db.select().from(syncSchedule).where(eq(syncSchedule.id, SCHEDULE_ID));
	return {
		enabled: schedule?.enabled ?? false,
		time: schedule?.time ?? '02:00',
		lastRunAt: schedule?.lastRunAt ?? null,
		lastRunSummary: schedule?.lastRunSummary ?? null
	};
}

export async function saveSyncSchedule(settings: Pick<SyncScheduleSettings, 'enabled' | 'time'>) {
	await db
		.insert(syncSchedule)
		.values({ id: SCHEDULE_ID, ...settings })
		.onConflictDoUpdate({ target: syncSchedule.id, set: settings });
	await applySyncSchedule();
}

async function runScheduledSync() {
	const snapshotTime = new Date().toISOString();
	let summary: string;
	if (!env.FMP_API_KEY) {
		summary = 'FMP_API_KEY is not set';
	} else {
		const securities = await db.select({ id: security.id, symbol: security.symbol }).from(security);
		const failedSymbols: string[] = [];
		for (const { id, symbol } of securities) {
			const result = await syncSecurity({
				fetchFn: fetch,
				apiKey: env.FMP_API_KEY,
				securityId: id,
				snapshotTime
			});
			if (result.status === 'failed') failedSymbols.push(symbol);
		}
		summary =
			`Synced ${securities.length - failedSymbols.length} of ${securities.length} securities` +
			(failedSymbols.length > 0 ? `. Failed: ${failedSymbols.join(', ')}` : '');
	}
	console.log(`Scheduled sync: ${summary}`);
	await db
		.update(syncSchedule)
		.set({ lastRunAt: snapshotTime, lastRunSummary: summary })
		.where(eq(syncSchedule.id, SCHEDULE_ID));
}

/** (Re)creates the cron job from the saved schedule, in the host's local time; call on boot and after every settings change. */
export async function applySyncSchedule() {
	scheduledJob?.stop();
	scheduledJob = null;

	const { enabled, time } = await getSyncSchedule();
	if (!enabled) return;

	const [hour, minute] = time.split(':').map(Number);
	scheduledJob = new Cron(
		`${minute} ${hour} * * *`,
		{ protect: true },
		() => void runScheduledSync().catch((error) => console.error('Scheduled sync failed:', error))
	);
}
