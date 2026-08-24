<script lang="ts">
	import * as echarts from 'echarts';
	import type { EChartsOption } from 'echarts';
	import { untrack } from 'svelte';

	let {
		option,
		class: className = '',
		height = '320px'
	}: { option: EChartsOption; class?: string; height?: string } = $props();

	let container: HTMLDivElement;
	let chart: echarts.ECharts | undefined;

	$effect(() => {
		chart = echarts.init(container);
		chart.setOption(untrack(() => option));

		const resizeObserver = new ResizeObserver(() => chart?.resize());
		resizeObserver.observe(container);

		return () => {
			resizeObserver.disconnect();
			chart?.dispose();
		};
	});

	$effect(() => {
		chart?.setOption(option, true);
	});
</script>

<div bind:this={container} class={className} style:height></div>
