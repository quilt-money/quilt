<script lang="ts">
	let { name }: { name: 'dashboard' | 'holdings' | 'accounts' | 'securities' } = $props();
</script>

{#if name === 'dashboard'}
	<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
		<rect x="3" y="3" width="7" height="7" rx="1.5" />
		<rect x="14" y="3" width="7" height="7" rx="1.5" />
		<rect x="3" y="14" width="7" height="7" rx="1.5" />
		<rect x="14" y="14" width="7" height="7" rx="1.5" />
	</svg>
{:else if name === 'holdings'}
	<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
		<line x1="18" y1="20" x2="18" y2="10" />
		<line x1="12" y1="20" x2="12" y2="4" />
		<line x1="6" y1="20" x2="6" y2="14" />
	</svg>
{:else if name === 'accounts'}
	<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
		<circle cx="12" cy="8" r="4" />
		<path d="M4 20c0-3.3 3.6-6 8-6s8 2.7 8 6" />
	</svg>
{:else if name === 'securities'}
	<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
		<polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
	</svg>
{/if}
