import { Database } from 'bun:sqlite';
import { drizzle } from 'drizzle-orm/bun-sqlite';
import { sector, industry } from './schema';

const GICS_SECTORS = [
	'Energy',
	'Materials',
	'Industrials',
	'Consumer Discretionary',
	'Consumer Staples',
	'Health Care',
	'Financials',
	'Information Technology',
	'Communication Services',
	'Utilities',
	'Real Estate'
];

const GICS_INDUSTRIES: { name: string; sector: string }[] = [
	// Energy
	{ name: 'Energy Equipment & Services', sector: 'Energy' },
	{ name: 'Oil, Gas & Consumable Fuels', sector: 'Energy' },
	// Materials
	{ name: 'Chemicals', sector: 'Materials' },
	{ name: 'Construction Materials', sector: 'Materials' },
	{ name: 'Containers & Packaging', sector: 'Materials' },
	{ name: 'Metals & Mining', sector: 'Materials' },
	{ name: 'Paper & Forest Products', sector: 'Materials' },
	// Industrials
	{ name: 'Aerospace & Defense', sector: 'Industrials' },
	{ name: 'Building Products', sector: 'Industrials' },
	{ name: 'Construction & Engineering', sector: 'Industrials' },
	{ name: 'Electrical Equipment', sector: 'Industrials' },
	{ name: 'Industrial Conglomerates', sector: 'Industrials' },
	{ name: 'Machinery', sector: 'Industrials' },
	{ name: 'Trading Companies & Distributors', sector: 'Industrials' },
	{ name: 'Commercial Services & Supplies', sector: 'Industrials' },
	{ name: 'Professional Services', sector: 'Industrials' },
	{ name: 'Air Freight & Logistics', sector: 'Industrials' },
	{ name: 'Passenger Airlines', sector: 'Industrials' },
	{ name: 'Marine Transportation', sector: 'Industrials' },
	{ name: 'Ground Transportation', sector: 'Industrials' },
	{ name: 'Transportation Infrastructure', sector: 'Industrials' },
	// Consumer Discretionary
	{ name: 'Automobile Components', sector: 'Consumer Discretionary' },
	{ name: 'Automobiles', sector: 'Consumer Discretionary' },
	{ name: 'Household Durables', sector: 'Consumer Discretionary' },
	{ name: 'Leisure Products', sector: 'Consumer Discretionary' },
	{ name: 'Textiles, Apparel & Luxury Goods', sector: 'Consumer Discretionary' },
	{ name: 'Hotels, Restaurants & Leisure', sector: 'Consumer Discretionary' },
	{ name: 'Diversified Consumer Services', sector: 'Consumer Discretionary' },
	{ name: 'Distributors', sector: 'Consumer Discretionary' },
	{ name: 'Broadline Retail', sector: 'Consumer Discretionary' },
	{ name: 'Specialty Retail', sector: 'Consumer Discretionary' },
	// Consumer Staples
	{ name: 'Consumer Staples Distribution & Retail', sector: 'Consumer Staples' },
	{ name: 'Beverages', sector: 'Consumer Staples' },
	{ name: 'Food Products', sector: 'Consumer Staples' },
	{ name: 'Tobacco', sector: 'Consumer Staples' },
	{ name: 'Household Products', sector: 'Consumer Staples' },
	{ name: 'Personal Care Products', sector: 'Consumer Staples' },
	// Health Care
	{ name: 'Health Care Equipment & Supplies', sector: 'Health Care' },
	{ name: 'Health Care Providers & Services', sector: 'Health Care' },
	{ name: 'Health Care Technology', sector: 'Health Care' },
	{ name: 'Biotechnology', sector: 'Health Care' },
	{ name: 'Pharmaceuticals', sector: 'Health Care' },
	{ name: 'Life Sciences Tools & Services', sector: 'Health Care' },
	// Financials
	{ name: 'Banks', sector: 'Financials' },
	{ name: 'Financial Services', sector: 'Financials' },
	{ name: 'Consumer Finance', sector: 'Financials' },
	{ name: 'Capital Markets', sector: 'Financials' },
	{ name: 'Mortgage Real Estate Investment Trusts (REITs)', sector: 'Financials' },
	{ name: 'Insurance', sector: 'Financials' },
	// Information Technology
	{ name: 'IT Services', sector: 'Information Technology' },
	{ name: 'Software', sector: 'Information Technology' },
	{ name: 'Communications Equipment', sector: 'Information Technology' },
	{ name: 'Technology Hardware, Storage & Peripherals', sector: 'Information Technology' },
	{ name: 'Electronic Equipment, Instruments & Components', sector: 'Information Technology' },
	{ name: 'Semiconductors & Semiconductor Equipment', sector: 'Information Technology' },
	// Communication Services
	{ name: 'Diversified Telecommunication Services', sector: 'Communication Services' },
	{ name: 'Wireless Telecommunication Services', sector: 'Communication Services' },
	{ name: 'Media', sector: 'Communication Services' },
	{ name: 'Entertainment', sector: 'Communication Services' },
	{ name: 'Interactive Media & Services', sector: 'Communication Services' },
	// Utilities
	{ name: 'Electric Utilities', sector: 'Utilities' },
	{ name: 'Gas Utilities', sector: 'Utilities' },
	{ name: 'Multi-Utilities', sector: 'Utilities' },
	{ name: 'Water Utilities', sector: 'Utilities' },
	{ name: 'Independent Power and Renewable Electricity Producers', sector: 'Utilities' },
	// Real Estate
	{ name: 'Diversified REITs', sector: 'Real Estate' },
	{ name: 'Industrial REITs', sector: 'Real Estate' },
	{ name: 'Hotel & Resort REITs', sector: 'Real Estate' },
	{ name: 'Office REITs', sector: 'Real Estate' },
	{ name: 'Health Care REITs', sector: 'Real Estate' },
	{ name: 'Residential REITs', sector: 'Real Estate' },
	{ name: 'Retail REITs', sector: 'Real Estate' },
	{ name: 'Specialized REITs', sector: 'Real Estate' },
	{ name: 'Real Estate Management & Development', sector: 'Real Estate' }
];

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) throw new Error('DATABASE_URL is not set');

const client = new Database(DATABASE_URL);
const db = drizzle(client);

await db
	.insert(sector)
	.values(GICS_SECTORS.map((name) => ({ name })))
	.onConflictDoNothing();

const sectors = await db.select().from(sector);
const sectorIdByName = Object.fromEntries(sectors.map((s) => [s.name, s.id]));

await db
	.insert(industry)
	.values(
		GICS_INDUSTRIES.map(({ name, sector: sectorName }) => ({
			name,
			sectorId: sectorIdByName[sectorName]
		}))
	)
	.onConflictDoNothing();

console.log(`Seeded ${GICS_SECTORS.length} sectors and ${GICS_INDUSTRIES.length} industries.`);
client.close();
