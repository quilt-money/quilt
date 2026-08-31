<script lang="ts">
	import { Input } from '$lib/components/ui/input/index.js';

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
	}
</script>

<Input
	{placeholder}
	value={(table.atoms.globalFilter.get() as string | undefined) ?? ''}
	oninput={(e) => setSearch(e.currentTarget.value)}
	class={className ?? 'max-w-sm'}
	{onkeydown}
/>
