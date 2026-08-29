import { page } from '$app/state';
import { replaceState } from '$app/navigation';
import { resolve } from '$app/paths';
import type { PathnameWithSearchOrHash } from '$app/types';

export function setSearchParam(key: string, value: string | undefined) {
	const url = new URL(page.url);
	if (value) {
		url.searchParams.set(key, value);
	} else {
		url.searchParams.delete(key);
	}
	replaceState(resolve(`${url.pathname}${url.search}` as PathnameWithSearchOrHash), page.state);
}
