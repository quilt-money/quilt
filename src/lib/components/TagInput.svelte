<script lang="ts">
	let {
		availableTags = [],
		initialTags = [],
		inputName = 'tags'
	}: {
		availableTags: string[];
		initialTags?: string[];
		inputName?: string;
	} = $props();

	let selected = $state<string[]>([...initialTags]);
	let inputValue = $state('');
	let showDropdown = $state(false);
	let inputEl = $state<HTMLInputElement | undefined>(undefined);

	let suggestions = $derived(
		availableTags.filter(
			(t) => t.toLowerCase().includes(inputValue.toLowerCase().trim()) && !selected.includes(t)
		)
	);

	let trimmed = $derived(inputValue.trim());

	let showAddNew = $derived(
		trimmed.length > 0 &&
			!availableTags.some((t) => t.toLowerCase() === trimmed.toLowerCase()) &&
			!selected.some((t) => t.toLowerCase() === trimmed.toLowerCase())
	);

	let dropdownVisible = $derived(showDropdown && (suggestions.length > 0 || showAddNew));

	function addTag(tag: string) {
		const t = tag.trim();
		if (!t || selected.some((s) => s.toLowerCase() === t.toLowerCase())) return;
		selected = [...selected, t];
		inputValue = '';
	}

	function removeTag(tag: string) {
		selected = selected.filter((t) => t !== tag);
	}

	function onKeydown(e: KeyboardEvent) {
		if (e.key === 'ArrowDown') {
			if (!dropdownVisible) {
				e.preventDefault();
				showDropdown = true;
			}
		} else if (e.key === 'Enter') {
			e.preventDefault();
			if (trimmed) addTag(trimmed);
		} else if (e.key === 'Escape') {
			showDropdown = false;
		} else if (e.key === 'Backspace' && !inputValue && selected.length > 0) {
			selected = selected.slice(0, -1);
		}
	}

	function onFocusOut(e: FocusEvent) {
		const container = e.currentTarget as HTMLElement;
		if (!container.contains(e.relatedTarget as Node)) {
			showDropdown = false;
		}
	}

	export function reset() {
		selected = [];
		inputValue = '';
	}
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="relative" onfocusout={onFocusOut}>
	<div
		class="flex flex-wrap gap-1 min-h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-within:ring-1 focus-within:ring-ring cursor-text"
		onclick={() => inputEl?.focus()}
		onkeydown={() => {}}
	>
		{#each selected as tag (tag)}
			<span
				class="inline-flex items-center gap-1 rounded bg-secondary px-2 py-0.5 text-xs font-medium"
			>
				{tag}
				<button
					type="button"
					class="hover:text-destructive leading-none"
					onclick={(e) => {
						e.stopPropagation();
						removeTag(tag);
					}}
					aria-label="Remove {tag}">×</button
				>
			</span>
		{/each}
		<input
			bind:this={inputEl}
			bind:value={inputValue}
			type="text"
			class="flex-1 min-w-24 bg-transparent outline-none placeholder:text-muted-foreground"
			placeholder={selected.length === 0 ? 'Add tags…' : ''}
			onkeydown={onKeydown}
			onfocus={() => (showDropdown = true)}
			autocomplete="off"
		/>
	</div>

	{#if dropdownVisible}
		<div
			class="absolute z-50 mt-1 w-full rounded-md border bg-popover text-popover-foreground shadow-md"
		>
			{#each suggestions as tag (tag)}
				<button
					type="button"
					class="w-full px-3 py-1.5 text-left text-sm hover:bg-accent hover:text-accent-foreground"
					onmousedown={(e) => {
						e.preventDefault();
						addTag(tag);
					}}
				>
					{tag}
				</button>
			{/each}
			{#if showAddNew}
				<button
					type="button"
					class="w-full px-3 py-1.5 text-left text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground"
					onmousedown={(e) => {
						e.preventDefault();
						addTag(trimmed);
					}}
				>
					Add "<span class="text-foreground font-medium">{trimmed}</span>"
				</button>
			{/if}
		</div>
	{/if}

	<input type="hidden" name={inputName} value={JSON.stringify(selected)} />
</div>
