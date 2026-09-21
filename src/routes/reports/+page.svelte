<script lang="ts">
	import * as Table from '$lib/components/ui/table/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { enhance } from '$app/forms';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import EChart from '$lib/components/EChart.svelte';
	import { untrack } from 'svelte';
	import type { EChartsOption } from 'echarts';

	let { data, form } = $props();

	let sql = $state(untrack(() => form?.sql ?? 'SELECT * FROM account LIMIT 100;'));
	let running = $state(false);
	let formEl = $state<HTMLFormElement | undefined>(undefined);

	function useTable(name: string) {
		sql = `SELECT * FROM ${name} LIMIT 100;`;
	}

	function onKeydown(e: KeyboardEvent) {
		if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
			e.preventDefault();
			formEl?.requestSubmit();
		}
	}

	// Reuses the dashboard's palette/tokens (src/routes/dashboard/+page.svelte)
	// so ad hoc report charts look consistent with the rest of the app.
	const CATEGORICAL = [
		'#2a78d6', // blue
		'#eb6834', // orange
		'#1baf7a', // aqua
		'#eda100', // yellow
		'#e87ba4', // magenta
		'#008300', // green
		'#4a3aa7', // violet
		'#e34948' // red
	];
	const SURFACE = '#fcfcfb';
	const TEXT_MUTED = '#52514e';
	const GRID_LINE = '#ececec';

	type ChartType = 'none' | 'bar' | 'line' | 'pie';

	const columns = $derived(form?.columns ?? []);
	const rows = $derived(form?.rows ?? []);

	function isNumericColumn(col: string) {
		return (
			rows.some((r) => typeof r[col] === 'number') &&
			rows.every((r) => r[col] === null || typeof r[col] === 'number')
		);
	}

	const numericColumns = $derived(columns.filter(isNumericColumn));
	const dimensionColumns = $derived(columns.filter((c) => !numericColumns.includes(c)));

	let chartType = $state<ChartType>('bar');
	let categoryColumn = $state('');
	let valueColumn = $state('');

	// Self-healing: only re-pick a column when the current one isn't valid for the
	// latest results, so a manual choice survives re-running the same query.
	$effect(() => {
		if (!columns.includes(categoryColumn)) categoryColumn = dimensionColumns[0] ?? columns[0] ?? '';
		if (!numericColumns.includes(valueColumn)) valueColumn = numericColumns[0] ?? '';
	});

	const chartOption = $derived.by((): EChartsOption | null => {
		if (chartType === 'none' || !categoryColumn || !valueColumn || rows.length === 0) return null;

		const categories = rows.map((r) => String(r[categoryColumn] ?? '—'));
		const values = rows.map((r) => {
			const v = r[valueColumn];
			return typeof v === 'number' ? v : 0;
		});

		if (chartType === 'pie') {
			return {
				backgroundColor: 'transparent',
				tooltip: { trigger: 'item' },
				legend: {
					bottom: 0,
					icon: 'circle',
					itemWidth: 8,
					itemHeight: 8,
					textStyle: { color: TEXT_MUTED, fontSize: 12 }
				},
				series: [
					{
						name: valueColumn,
						type: 'pie',
						radius: '70%',
						center: ['50%', '46%'],
						avoidLabelOverlap: true,
						itemStyle: { borderColor: SURFACE, borderWidth: 2 },
						label: {
							show: true,
							color: TEXT_MUTED,
							fontSize: 12,
							formatter: (p) => `${(p.percent ?? 0).toFixed(0)}%`
						},
						labelLine: { show: true },
						data: categories.map((name, i) => ({
							name,
							value: values[i],
							itemStyle: { color: CATEGORICAL[i % CATEGORICAL.length] }
						}))
					}
				]
			};
		}

		return {
			backgroundColor: 'transparent',
			tooltip: { trigger: 'axis' },
			grid: { left: 56, right: 16, top: 24, bottom: categories.length > 8 ? 64 : 40 },
			xAxis: {
				type: 'category',
				data: categories,
				axisLabel: { color: TEXT_MUTED, fontSize: 11, rotate: categories.length > 8 ? 30 : 0 },
				axisLine: { lineStyle: { color: GRID_LINE } }
			},
			yAxis: {
				type: 'value',
				axisLabel: { color: TEXT_MUTED, fontSize: 11 },
				splitLine: { lineStyle: { color: GRID_LINE } }
			},
			series: [
				chartType === 'bar'
					? {
							name: valueColumn,
							type: 'bar',
							data: values,
							itemStyle: { color: CATEGORICAL[0], borderRadius: [4, 4, 0, 0] },
							barMaxWidth: 40
						}
					: {
							name: valueColumn,
							type: 'line',
							data: values,
							lineStyle: { color: CATEGORICAL[0], width: 2 },
							itemStyle: { color: CATEGORICAL[0] },
							symbolSize: 8
						}
			]
		};
	});

	const selectClass =
		'h-8 rounded-md border border-input bg-transparent px-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30';
</script>

<div class="p-6">
	<PageHeader>
		<h1 class="text-2xl font-semibold">Reports</h1>
	</PageHeader>

	<div class="flex gap-6">
		<aside class="w-56 shrink-0">
			<h2 class="mb-2 text-sm font-semibold text-muted-foreground">Tables</h2>
			<div class="flex flex-col gap-3">
				{#each data.schema as table (table.name)}
					<div>
						<button
							type="button"
							class="font-mono text-sm font-medium hover:underline"
							onclick={() => useTable(table.name)}
						>
							{table.name}
						</button>
						<div class="mt-0.5 flex flex-col text-xs text-muted-foreground">
							{#each table.columns as column (column.name)}
								<span class="font-mono"
									>{column.name} <span class="opacity-60">{column.type}</span></span
								>
							{/each}
						</div>
					</div>
				{/each}
			</div>
		</aside>

		<div class="min-w-0 flex-1">
			<form
				bind:this={formEl}
				method="POST"
				action="?/run"
				use:enhance={() => {
					running = true;
					return async ({ update }) => {
						await update();
						running = false;
					};
				}}
			>
				<textarea
					name="sql"
					bind:value={sql}
					onkeydown={onKeydown}
					rows="8"
					spellcheck="false"
					class="w-full resize-y rounded-md border border-input bg-transparent px-3 py-2 font-mono text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
				></textarea>

				<div class="mt-2 flex items-center gap-2">
					<Button type="submit" disabled={running}>{running ? 'Running…' : 'Run query'}</Button>
					<span class="text-xs text-muted-foreground">⌘/Ctrl + Enter to run</span>
				</div>
			</form>

			{#if form?.error}
				<p
					class="mt-4 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
				>
					{form.error}
				</p>
			{:else if form?.rows}
				<div class="mt-4">
					<p class="mb-2 text-sm text-muted-foreground">
						{form.rows.length}
						{form.rows.length === 1 ? 'row' : 'rows'}
						{#if form.truncated}(showing first {form.rows.length}){/if}
					</p>

					{#if numericColumns.length > 0 && rows.length > 0}
						<div
							class="mb-4 flex flex-wrap items-center gap-3 rounded-md border bg-muted/50 px-3 py-2"
						>
							<label class="flex items-center gap-1.5 text-sm">
								Chart
								<select bind:value={chartType} class={selectClass}>
									<option value="none">None</option>
									<option value="bar">Bar</option>
									<option value="line">Line</option>
									<option value="pie">Pie</option>
								</select>
							</label>
							{#if chartType !== 'none'}
								<label class="flex items-center gap-1.5 text-sm">
									Category
									<select bind:value={categoryColumn} class={selectClass}>
										{#each columns as c (c)}
											<option value={c}>{c}</option>
										{/each}
									</select>
								</label>
								<label class="flex items-center gap-1.5 text-sm">
									Value
									<select bind:value={valueColumn} class={selectClass}>
										{#each numericColumns as c (c)}
											<option value={c}>{c}</option>
										{/each}
									</select>
								</label>
							{/if}
						</div>
					{/if}

					{#if chartOption}
						<div class="mb-4 rounded-md border p-4">
							<EChart option={chartOption} height="320px" />
						</div>
					{/if}

					{#if form.columns.length > 0}
						<div class="overflow-x-auto rounded-md border">
							<Table.Root>
								<Table.Header>
									<Table.Row>
										{#each form.columns as col (col)}
											<Table.Head class="font-mono">{col}</Table.Head>
										{/each}
									</Table.Row>
								</Table.Header>
								<Table.Body>
									{#each form.rows as row, i (i)}
										<Table.Row>
											{#each form.columns as col (col)}
												<Table.Cell class="whitespace-nowrap font-mono">
													{#if row[col] === null}
														<span class="text-muted-foreground italic">NULL</span>
													{:else}
														{row[col]}
													{/if}
												</Table.Cell>
											{/each}
										</Table.Row>
									{/each}
								</Table.Body>
							</Table.Root>
						</div>
					{/if}
				</div>
			{/if}
		</div>
	</div>
</div>
