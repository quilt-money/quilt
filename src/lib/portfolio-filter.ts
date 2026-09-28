import { resolve } from '$app/paths';
import { createSerializer, parseAsArrayOf, parseAsString } from 'nuqs-svelte';
import type { PortfolioFilterField } from '$lib/report-builder';

const serializePortfolioParams = createSerializer({
	accountName: parseAsArrayOf(parseAsString),
	sector: parseAsArrayOf(parseAsString),
	region: parseAsArrayOf(parseAsString),
	type: parseAsArrayOf(parseAsString),
	tags: parseAsArrayOf(parseAsString),
	search: parseAsString
});

/** Link to the portfolio table filtered to one account's holding of one security. */
export function portfolioHref(accountName: string, securitySymbol: string) {
	const query = serializePortfolioParams({
		accountName: [accountName],
		search: securitySymbol
	});
	return resolve(`/portfolio?${query.slice(1)}`);
}

export function portfolioFilterHref(field: PortfolioFilterField | 'search', value: string) {
	const query = serializePortfolioParams({
		accountName: field === 'accountName' ? [value] : null,
		sector: field === 'sector' ? [value] : null,
		region: field === 'region' ? [value] : null,
		type: field === 'type' ? [value] : null,
		tags: field === 'tags' ? [value] : null,
		search: field === 'search' ? value : null
	});
	return resolve(`/portfolio?${query.slice(1)}`);
}
