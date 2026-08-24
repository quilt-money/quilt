// FMP's sector taxonomy doesn't match the GICS sector names seeded in this app,
// so map its ~11 sector names onto our GICS sectors.
export const FMP_SECTOR_TO_GICS: Record<string, string> = {
	'Basic Materials': 'Materials',
	'Communication Services': 'Communication Services',
	'Consumer Cyclical': 'Consumer Discretionary',
	'Consumer Defensive': 'Consumer Staples',
	Energy: 'Energy',
	'Financial Services': 'Financials',
	Healthcare: 'Health Care',
	Industrials: 'Industrials',
	'Real Estate': 'Real Estate',
	Technology: 'Information Technology',
	Utilities: 'Utilities'
};

// Standard MSCI-style developed/emerging market classification, keyed by ISO alpha-2 country code.
const DEVELOPED_COUNTRIES = new Set([
	'CA',
	'GB',
	'DE',
	'FR',
	'JP',
	'AU',
	'CH',
	'NL',
	'SE',
	'DK',
	'NO',
	'FI',
	'BE',
	'AT',
	'IE',
	'IT',
	'ES',
	'PT',
	'IL',
	'SG',
	'HK',
	'NZ'
]);
const EMERGING_COUNTRIES = new Set([
	'CN',
	'IN',
	'BR',
	'TW',
	'KR',
	'ZA',
	'MX',
	'ID',
	'TH',
	'MY',
	'PH',
	'PL',
	'TR',
	'SA',
	'AE',
	'QA',
	'KW',
	'CL',
	'CO',
	'PE',
	'EG',
	'GR',
	'HU',
	'CZ'
]);

export function normalizeCompanyName(name: string): string {
	const trimmed = name.trim().replace(/\s+/g, ' ');
	const isAllCaps = trimmed === trimmed.toUpperCase() && trimmed !== trimmed.toLowerCase();
	if (!isAllCaps) return trimmed;
	return trimmed
		.toLowerCase()
		.split(' ')
		.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
		.join(' ');
}

export function regionBucketFor(country: string | null): string {
	if (country === 'US') return 'US';
	if (country && DEVELOPED_COUNTRIES.has(country)) return 'International Developed';
	if (country && EMERGING_COUNTRIES.has(country)) return 'Emerging Markets';
	return 'Other';
}

export type FmpProfileResponse = {
	symbol: string;
	price: number | null;
	marketCap: number | null;
	beta: number | null;
	lastDividend: number | null;
	range: string | null;
	change: number | null;
	changePercentage: number | null;
	volume: number | null;
	averageVolume: number | null;
	companyName: string | null;
	currency: string | null;
	cik: string | null;
	isin: string | null;
	cusip: string | null;
	exchangeFullName: string | null;
	exchange: string | null;
	industry: string | null;
	website: string | null;
	description: string | null;
	ceo: string | null;
	sector: string | null;
	country: string | null;
	fullTimeEmployees: string | null;
	phone: string | null;
	address: string | null;
	city: string | null;
	state: string | null;
	zip: string | null;
	image: string | null;
	ipoDate: string | null;
	defaultImage: boolean;
	isEtf: boolean;
	isActivelyTrading: boolean;
	isAdr: boolean;
	isFund: boolean;
};

export async function fetchFmpProfile(
	fetchFn: typeof fetch,
	apiKey: string,
	symbol: string
): Promise<FmpProfileResponse | null> {
	const url = `https://financialmodelingprep.com/stable/profile?symbol=${encodeURIComponent(symbol)}&apikey=${apiKey}`;
	const res = await fetchFn(url);
	if (!res.ok) return null;
	const data: FmpProfileResponse[] = await res.json();
	return data[0] ?? null;
}
