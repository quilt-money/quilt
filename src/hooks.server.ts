import { building } from '$app/environment';
import { applySyncSchedule } from '$lib/server/sync-scheduler';

if (!building) {
	applySyncSchedule().catch((error) => console.error('Failed to start sync scheduler:', error));
}
