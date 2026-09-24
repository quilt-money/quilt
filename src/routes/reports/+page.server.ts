import {
	ALLOCATION_DIMENSIONS,
	getAllocationByDimension,
	type AllocationDimension
} from '$lib/server/db/queries/report';

function parseDimension(value: string | null): AllocationDimension {
	return ALLOCATION_DIMENSIONS.find((dimension) => dimension === value) ?? 'sector';
}

export async function load({ url }) {
	const dimension = parseDimension(url.searchParams.get('dimension'));
	const slices = await getAllocationByDimension(dimension);

	return { dimension, slices };
}
