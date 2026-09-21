import { resolve } from '$app/paths';
import { createSerializer, parseAsArrayOf, parseAsString } from 'nuqs-svelte';

const serializePortfolioParams = createSerializer({
	accountName: parseAsArrayOf(parseAsString),
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
