<script lang="ts">
	import PageHeader from '$lib/components/PageHeader.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { Toggle } from '$lib/components/ui/toggle/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { enhance } from '$app/forms';
	import { untrack } from 'svelte';
	import { toast } from 'svelte-sonner';

	let { data } = $props();

	let enabled = $state(untrack(() => data.syncSchedule.enabled));
</script>

<div class="p-6">
	<PageHeader>
		<h1 class="text-2xl font-semibold">Settings</h1>
	</PageHeader>

	<form
		method="POST"
		action="?/saveSyncSchedule"
		class="flex max-w-2xl flex-col gap-4 rounded-lg border bg-card p-6"
		use:enhance={() => {
			return ({ result, update }) => {
				if (result.type === 'success')
					toast.success(enabled ? 'Nightly sync enabled' : 'Nightly sync disabled');
				if (result.type === 'failure') toast.error('Could not save sync schedule');
				update({ reset: false });
			};
		}}
	>
		<div>
			<h2 class="text-lg font-semibold">Nightly price sync</h2>
			<p class="text-sm text-muted-foreground">
				Syncs prices and metadata for every security once a day.
			</p>
		</div>

		<div class="flex items-center gap-3">
			<Toggle
				bind:pressed={enabled}
				variant="outline"
				aria-label="Enable scheduled sync"
				class={enabled
					? 'border-green-600 bg-green-600 text-white hover:bg-green-700 hover:text-white aria-pressed:bg-green-600 dark:border-green-700 dark:bg-green-700 dark:hover:bg-green-800 dark:aria-pressed:bg-green-700'
					: ''}
			>
				{enabled ? 'Enabled' : 'Disabled'}
			</Toggle>
			{#if enabled}<input type="hidden" name="enabled" value="on" />{/if}
		</div>

		<div class="flex flex-col gap-1.5">
			<Label for="time">Time (server local time)</Label>
			<Input id="time" name="time" type="time" required value={data.syncSchedule.time} />
		</div>

		{#if data.syncSchedule.lastRunAt}
			<p class="text-sm text-muted-foreground">
				Last run {new Date(data.syncSchedule.lastRunAt).toLocaleString()}: {data.syncSchedule
					.lastRunSummary}
			</p>
		{/if}

		<div><Button type="submit">Save</Button></div>
	</form>
</div>
