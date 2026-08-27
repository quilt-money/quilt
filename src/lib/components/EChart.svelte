<script lang="ts">
	import * as echarts from 'echarts';
	import type { EChartsOption } from 'echarts';
	import { untrack } from 'svelte';

	let {
		option,
		class: className = '',
		height = '320px',
		onItemClick
	}: {
		option: EChartsOption;
		class?: string;
		height?: string;
		onItemClick?: (params: echarts.ECElementEvent) => void;
	} = $props();

	let container: HTMLDivElement;
	let chart: echarts.ECharts | undefined;

	$effect(() => {
		chart = echarts.init(container);
		chart.setOption(untrack(() => option));
		if (onItemClick) chart.on('click', onItemClick as (params: unknown) => void);

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
