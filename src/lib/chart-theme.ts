/** Shared ECharts styling for the reports section, so every report reads as one visual system. */

export const CATEGORICAL = [
	'#2a78d6', // blue
	'#eb6834', // orange
	'#1baf7a', // aqua
	'#eda100', // yellow
	'#e87ba4', // magenta
	'#008300', // green
	'#4a3aa7', // violet
	'#e34948' // red
];

export const SURFACE = '#fcfcfb';
export const TEXT_MUTED = '#52514e';
export const GRID_LINE = '#ececec';

export const formatUsd = (value: number) =>
	value.toLocaleString(undefined, {
		style: 'currency',
		currency: 'USD',
		minimumFractionDigits: 0,
		maximumFractionDigits: 0
	});
