<script lang="ts">
	import type { Snippet } from 'svelte';
	import { resolve } from '$app/paths';
	import ArrowUpRightIcon from '@lucide/svelte/icons/arrow-up-right';

	let {
		title,
		headline,
		aside,
		fill = false,
		reportId,
		detail,
		children
	}: {
		title: string;
		/** The large number under the title. */
		headline: string;
		/** Small text opposite the title, e.g. how many holdings are included. */
		aside: string;
		fill?: boolean;
		/** When set, the title links to this report's drill-down page. */
		reportId?: string;
		/** Extra line under the headline. */
		detail?: Snippet;
		children: Snippet;
	} = $props();
</script>

<div class="flex flex-col rounded-lg border bg-card p-4 sm:p-6 {fill ? 'h-full' : ''}">
	<div class="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
		<div>
			{#if reportId}
				<a
					href={resolve('/reports/[id]', { id: reportId })}
					class="group/report-link inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
				>
					{title}
					<ArrowUpRightIcon
						class="size-3.5 transition-transform group-hover/report-link:translate-x-0.5 group-hover/report-link:-translate-y-0.5"
					/>
				</a>
			{:else}
				<p class="text-sm text-muted-foreground">{title}</p>
			{/if}
			<p class="mt-1 text-2xl font-semibold">{headline}</p>
			{#if detail}{@render detail()}{/if}
		</div>
		<p class="text-sm text-muted-foreground">{aside}</p>
	</div>

	{@render children()}
</div>
