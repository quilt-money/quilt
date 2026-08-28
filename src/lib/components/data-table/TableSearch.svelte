<script lang="ts">
	import { Input } from '$lib/components/ui/input/index.js';
	import { page } from '$app/state';
	import { replaceState } from '$app/navigation';
	import { resolve } from '$app/paths';
	import type { PathnameWithSearchOrHash } from '$app/types';

	type TableSearchProps = {
		atoms: { globalFilter: { get: () => unknown } };
		setGlobalFilter: (value: string) => void;
	};

	let {
		table,
		placeholder = 'Search…',
		class: className,
		onkeydown
	}: {
		table: TableSearchProps;
		placeholder?: string;
		class?: string;
		onkeydown?: (e: KeyboardEvent) => void;
	} = $props();

	function setSearch(value: string) {
		table.setGlobalFilter(value);

		const url = new URL(page.url);
		if (value) {
			url.searchParams.set('search', value);
		} else {
			url.searchParams.delete('search');
		}
		replaceState(resolve(`${url.pathname}${url.search}` as PathnameWithSearchOrHash), page.state);
	}
</script>

<Input
	{placeholder}
	value={(table.atoms.globalFilter.get() as string | undefined) ?? ''}
	oninput={(e) => setSearch(e.currentTarget.value)}
	class={className ?? 'max-w-sm'}
	{onkeydown}
/>
