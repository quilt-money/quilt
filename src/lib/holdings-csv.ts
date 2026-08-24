export const HOLDINGS_CSV_HEADER = ['Symbol', 'Name', 'Shares'];

export function diffCsvHeader(header: string[]) {
	const missing = HOLDINGS_CSV_HEADER.filter((column) => !header.includes(column));
	const extra = header.filter((column) => !HOLDINGS_CSV_HEADER.includes(column));
	return { missing, extra };
}

export function isValidCsvHeader(header: string[]): boolean {
	const { missing, extra } = diffCsvHeader(header);
	return missing.length === 0 && extra.length === 0;
}
