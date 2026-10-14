<script lang="ts">
	import { Checkbox } from '$lib/components/ui/checkbox/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import type { HoldingWithTags } from '$lib/server/db/queries/holdings';
	import {
		METRIC_LABELS,
		DIMENSION_LABELS,
		filterOptions,
		type Metric,
		type Dimension,
		type ReportFilters
	} from '$lib/report-builder';

	let {
		holdings,
		title = $bindable(),
		metric = $bindable(),
		dimension = $bindable(),
		filters = $bindable(),
		titleError = null
	}: {
		holdings: HoldingWithTags[];
		title: string;
		/** Chart reports only; omit both for a report with no metric or grouping. */
		metric?: Metric;
		dimension?: Dimension;
		filters: ReportFilters;
		titleError?: string | null;
	} = $props();

	const accountNames = $derived(filterOptions(holdings, 'accountName'));

	function toggleAccount(accountName: string) {
		const selectedAccounts = filters.accountName ?? [];
		filters = {
			...filters,
			accountName: selectedAccounts.includes(accountName)
				? selectedAccounts.filter((selectedName) => selectedName !== accountName)
				: [...selectedAccounts, accountName]
		};
	}

	const selectClass =
		'h-8 rounded-md border border-input bg-transparent px-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30';
</script>

<div class="grid gap-2">
	<Label for="report-title">Title</Label>
	<Input id="report-title" name="title" bind:value={title} aria-invalid={titleError !== null} />
	{#if titleError}
		<p class="text-sm text-destructive">{titleError}</p>
	{/if}
</div>

{#if metric !== undefined}
	<div class="grid gap-2">
		<Label for="report-metric">Metric</Label>
		<select id="report-metric" bind:value={metric} class={selectClass}>
			{#each Object.entries(METRIC_LABELS) as [value, label] (value)}
				<option {value}>{label}</option>
			{/each}
		</select>
	</div>
{/if}

{#if dimension !== undefined}
	<div class="grid gap-2">
		<Label for="report-dimension">Group by</Label>
		<select id="report-dimension" bind:value={dimension} class={selectClass}>
			{#each Object.entries(DIMENSION_LABELS) as [value, label] (value)}
				<option {value}>{label}</option>
			{/each}
		</select>
	</div>
{/if}

<div class="grid gap-2">
	<div class="flex items-center justify-between">
		<Label>Accounts</Label>
		<div class="flex gap-3">
			<button
				type="button"
				class="text-xs text-primary hover:underline"
				onclick={() => (filters = { ...filters, accountName: [...accountNames] })}
			>
				All
			</button>
			<button
				type="button"
				class="text-xs text-primary hover:underline"
				onclick={() => (filters = { ...filters, accountName: [] })}
			>
				None
			</button>
		</div>
	</div>
	{#each accountNames as accountName (accountName)}
		<div class="flex items-center gap-2">
			<Checkbox
				id={`report-account-${accountName}`}
				checked={(filters.accountName ?? []).includes(accountName)}
				onCheckedChange={() => toggleAccount(accountName)}
			/>
			<Label for={`report-account-${accountName}`} class="font-normal">{accountName}</Label>
		</div>
	{:else}
		<p class="text-sm text-muted-foreground">No accounts</p>
	{/each}
</div>
