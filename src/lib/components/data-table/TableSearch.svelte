<script lang="ts">
	import { Input } from '$lib/components/ui/input/index.js';
	import { useQueryState } from 'nuqs-svelte';

	let {
		placeholder = 'Search…',
		class: className,
		onkeydown
	}: {
		placeholder?: string;
		class?: string;
		onkeydown?: (e: KeyboardEvent) => void;
	} = $props();

	const searchParam = useQueryState('search', { defaultValue: '' });
</script>

<Input
	{placeholder}
	value={searchParam.current}
	oninput={(e) => (searchParam.current = e.currentTarget.value)}
	class={className ?? 'max-w-sm'}
	{onkeydown}
/>
