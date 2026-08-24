import { Database } from 'bun:sqlite';
import { drizzle } from 'drizzle-orm/bun-sqlite';
import { sector, region, securityType } from './schema';

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

const REGIONS = ['US', 'International Developed', 'Emerging Markets', 'Other'];

const SECURITY_TYPES = ['Stock', 'ETF', 'Mutual Fund', 'Bond', 'Cash', 'Other'];

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) throw new Error('DATABASE_URL is not set');

const client = new Database(DATABASE_URL);
const db = drizzle(client);

const insertedSectors = await db
	.insert(sector)
	.values(GICS_SECTORS.map((name) => ({ name })))
	.onConflictDoNothing()
	.returning({ id: sector.id });

const insertedRegions = await db
	.insert(region)
	.values(REGIONS.map((name) => ({ name })))
	.onConflictDoNothing()
	.returning({ id: region.id });

const insertedSecurityTypes = await db
	.insert(securityType)
	.values(SECURITY_TYPES.map((name) => ({ name })))
	.onConflictDoNothing()
	.returning({ id: securityType.id });

console.log(
	`Seeded ${insertedSectors.length} sectors, ${insertedRegions.length} regions, and ${insertedSecurityTypes.length} security types.`
);
client.close();
