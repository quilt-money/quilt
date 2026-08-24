<script lang="ts">
	import Stepper, { type Step } from '$lib/components/ui/stepper/stepper.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Table from '$lib/components/ui/table/index.js';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import { enhance } from '$app/forms';
	import { diffCsvHeader, HOLDINGS_CSV_HEADER } from '$lib/holdings-csv';
	import CircleCheckIcon from '@lucide/svelte/icons/circle-check';
	import CircleAlertIcon from '@lucide/svelte/icons/circle-alert';
	import LoaderCircleIcon from '@lucide/svelte/icons/loader-circle';

	let { data, form } = $props();

	const steps: Step[] = [
		{ id: 'upload', title: 'Upload' },
		{ id: 'preview', title: 'Preview' },
		{ id: 'submit', title: 'Submit' }
	];

	let stepValue = $state('upload');
	let isDragging = $state(false);
	let selectedFile = $state<File | null>(null);
	let csvText = $state('');
	let fileInput = $state<HTMLInputElement | null>(null);
	let submitting = $state(false);
	let errorMsg = $derived<string | null>(form?.message ?? null);
	let uploadResult = $derived(form?.success ? form : null);

	function parseCsvPreview(text: string): { header: string[]; rows: string[][] } {
		const parseLine = (line: string) => {
			const cells: string[] = [];
			let cur = '';
			let inQuotes = false;
			for (let i = 0; i < line.length; i++) {
				const ch = line[i];
				if (inQuotes) {
					if (ch === '"' && line[i + 1] === '"') {
						cur += '"';
						i++;
					} else if (ch === '"') {
						inQuotes = false;
					} else {
						cur += ch;
					}
				} else if (ch === '"') {
					inQuotes = true;
				} else if (ch === ',') {
					cells.push(cur);
					cur = '';
				} else {
					cur += ch;
				}
			}
			cells.push(cur);
			return cells;
		};

		const lines = text.split(/\r\n|\n/).filter((line) => line.length > 0);
		const [header, ...rows] = lines.map(parseLine);
		return { header: header ?? [], rows };
	}

	const csv = $derived(parseCsvPreview(csvText));
	const headerIssues = $derived(diffCsvHeader(csv.header));
	const hasHeaderError = $derived(headerIssues.missing.length > 0 || headerIssues.extra.length > 0);

	const canProceed = $derived(
		stepValue === 'upload' ? !!selectedFile : stepValue === 'preview' ? !hasHeaderError : true
	);

	function isCsv(file: File) {
		return file.name.toLowerCase().endsWith('.csv') || file.type === 'text/csv';
	}

	async function setFile(file: File) {
		if (!isCsv(file)) {
			selectedFile = null;
			errorMsg = 'Only CSV files are supported.';
			return;
		}
		selectedFile = file;
		errorMsg = null;
		csvText = await file.text();

		// Keep the hidden input's FileList in sync so the form submits the
		// file regardless of whether it was dropped or picked via the dialog.
		const transfer = new DataTransfer();
		transfer.items.add(file);
		if (fileInput) fileInput.files = transfer.files;
	}

	function handleDrop(e: DragEvent) {
		e.preventDefault();
		isDragging = false;
		const file = e.dataTransfer?.files?.[0];
		if (file) setFile(file);
	}

	function handleFileInputChange(e: Event) {
		const file = (e.target as HTMLInputElement).files?.[0];
		if (file) setFile(file);
	}

	function goNext() {
		const idx = steps.findIndex((s) => s.id === stepValue);
		stepValue = steps[idx + 1]?.id ?? stepValue;
	}

	function goBack() {
		const idx = steps.findIndex((s) => s.id === stepValue);
		stepValue = steps[idx - 1]?.id ?? stepValue;
	}
</script>

<div class="px-8 py-6">
	<PageHeader>
		<h1 class="text-2xl font-semibold">Upload holdings</h1>
		<p class="text-sm text-muted-foreground">{data.account.name}</p>
	</PageHeader>

	<form
		method="POST"
		action="?/upload"
		enctype="multipart/form-data"
		use:enhance={() => {
			submitting = true;
			return async ({ update }) => {
				await update();
				submitting = false;
			};
		}}
	>
		<input
			bind:this={fileInput}
			name="file"
			type="file"
			accept=".csv,text/csv"
			class="hidden"
			onchange={handleFileInputChange}
		/>

		<Stepper {steps} bind:value={stepValue} clickable={false} class="mb-8" />

		{#if stepValue === 'upload'}
			<div
				class="mb-4 flex items-center gap-2 rounded-lg border bg-muted p-4 text-sm text-muted-foreground"
			>
				<CircleAlertIcon class="size-4 shrink-0" />
				Expected columns: {HOLDINGS_CSV_HEADER.join(', ')}
			</div>
			<div
				role="button"
				tabindex="0"
				class="flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-10 text-center transition-colors {isDragging
					? 'border-primary bg-accent'
					: 'border-input'}"
				ondragover={(e) => {
					e.preventDefault();
					isDragging = true;
				}}
				ondragleave={() => (isDragging = false)}
				ondrop={handleDrop}
				onclick={() => fileInput?.click()}
				onkeydown={(e) => {
					if (e.key === 'Enter' || e.key === ' ') fileInput?.click();
				}}
			>
				{#if selectedFile}
					<p class="text-sm font-medium">{selectedFile.name}</p>
					<p class="text-xs text-muted-foreground">
						{(selectedFile.size / 1024).toFixed(1)} KB
					</p>
				{:else}
					<p class="text-sm text-muted-foreground">
						Drag and drop a CSV file here, or click to browse
					</p>
				{/if}
			</div>
		{:else if stepValue === 'preview'}
			{#if hasHeaderError}
				<div
					class="mb-4 rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive"
				>
					<p class="font-medium">This CSV doesn't match the expected columns.</p>
					{#if headerIssues.missing.length}
						<p>Missing: {headerIssues.missing.join(', ')}</p>
					{/if}
					{#if headerIssues.extra.length}
						<p>Unexpected: {headerIssues.extra.join(', ')}</p>
					{/if}
				</div>
			{:else}
				<div
					class="mb-4 flex items-center gap-2 rounded-lg border border-green-500/50 bg-green-500/10 p-4 text-sm text-green-600 dark:text-green-400"
				>
					<CircleCheckIcon class="size-4 shrink-0" />
					<p class="font-medium">Your CSV matches the expected CSV format!</p>
				</div>
			{/if}
			<div class="max-h-96 overflow-auto rounded-lg border">
				<Table.Root>
					<Table.Header>
						<Table.Row>
							{#each csv.header as col, i (i)}
								<Table.Head>{col}</Table.Head>
							{/each}
						</Table.Row>
					</Table.Header>
					<Table.Body>
						{#each csv.rows as row, i (i)}
							<Table.Row>
								{#each row as cell, j (j)}
									<Table.Cell>{cell}</Table.Cell>
								{/each}
							</Table.Row>
						{/each}
					</Table.Body>
				</Table.Root>
			</div>
		{:else if stepValue === 'submit'}
			{#if uploadResult}
				<div
					class="rounded-lg border border-green-500/50 bg-green-500/10 p-6 text-center text-green-600 dark:text-green-400"
				>
					<CircleCheckIcon class="mx-auto mb-2 size-6" />
					<p class="font-medium">Upload complete</p>
					<div class="mt-3 space-y-3 text-sm text-foreground">
						<div>
							<p>
								{uploadResult.securitiesInserted}
								{uploadResult.securitiesInserted === 1 ? 'security' : 'securities'} added
							</p>
							{#if uploadResult.securitiesInserted > 0}
								<ul class="mt-2 flex flex-wrap justify-center gap-2">
									{#each uploadResult.securities.filter((s) => s.isNew) as sec (sec.symbol)}
										<li
											class="rounded-full border bg-background px-2.5 py-1 text-xs font-medium text-foreground"
										>
											{sec.symbol}
										</li>
									{/each}
								</ul>
							{/if}
						</div>
						<div>
							<p>
								{uploadResult.securitiesExisting}
								{uploadResult.securitiesExisting === 1 ? 'security' : 'securities'} already existed
							</p>
							{#if uploadResult.securitiesExisting > 0}
								<ul class="mt-2 flex flex-wrap justify-center gap-2">
									{#each uploadResult.securities.filter((s) => !s.isNew) as sec (sec.symbol)}
										<li
											class="rounded-full border bg-background px-2.5 py-1 text-xs font-medium text-foreground"
										>
											{sec.symbol}
										</li>
									{/each}
								</ul>
							{/if}
						</div>
						<p>
							{uploadResult.holdingsUploaded}
							{uploadResult.holdingsUploaded === 1 ? 'holding row' : 'holding rows'} uploaded
						</p>
					</div>
				</div>
			{:else}
				<div class="rounded-lg border p-6 text-center">
					<p class="text-sm font-medium">{selectedFile?.name}</p>
					<p class="mt-1 text-xs text-muted-foreground">
						{csv.rows.length} row{csv.rows.length === 1 ? '' : 's'} ready to upload
					</p>
				</div>
			{/if}
		{/if}

		{#if errorMsg}
			<p class="mt-4 text-sm text-destructive">{errorMsg}</p>
		{/if}

		<div class="mt-6 flex justify-end">
			{#if uploadResult}
				<Button href="/accounts/{data.account.id}">Done</Button>
			{:else}
				<div class="flex w-full justify-between">
					{#if stepValue === 'upload'}
						<Button
							type="button"
							variant="outline"
							disabled={submitting}
							href="/accounts/{data.account.id}"
						>
							Cancel
						</Button>
					{:else}
						<Button type="button" variant="outline" disabled={submitting} onclick={goBack}>
							Back
						</Button>
					{/if}
					{#if stepValue !== 'submit'}
						<Button type="button" onclick={goNext} disabled={!canProceed}>Next</Button>
					{:else}
						<Button type="submit" disabled={submitting}>
							{#if submitting}
								<LoaderCircleIcon class="size-4 animate-spin" />
							{/if}
							Submit
						</Button>
					{/if}
				</div>
			{/if}
		</div>
	</form>
</div>
