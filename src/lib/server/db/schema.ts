import { real, sqliteTable, text, unique } from 'drizzle-orm/sqlite-core';

export const sector = sqliteTable('sector', {
	id: text('id')
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	name: text('name').notNull().unique()
});

export const industry = sqliteTable('industry', {
	id: text('id')
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	name: text('name').notNull().unique(),
	sectorId: text('sector_id').references(() => sector.id)
});

export const region = sqliteTable('region', {
	id: text('id')
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	name: text('name').notNull().unique()
});

export const category = sqliteTable('category', {
	id: text('id')
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	name: text('name').notNull().unique()
});

export const securityType = sqliteTable('security_type', {
	id: text('id')
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	name: text('name').notNull().unique()
});

export const security = sqliteTable('security', {
	id: text('id')
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	symbol: text('symbol').notNull().unique(),
	fullName: text('full_name'),
	categoryId: text('category_id').references(() => category.id),
	typeId: text('type_id').references(() => securityType.id),
	sectorId: text('sector_id').references(() => sector.id),
	industryId: text('industry_id').references(() => industry.id),
	regionId: text('region_id').references(() => region.id)
});

export const account = sqliteTable('account', {
	id: text('id')
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	name: text('name').notNull().unique(),
	owner: text('owner').notNull()
});

export const holding = sqliteTable(
	'holding',
	{
		id: text('id')
			.primaryKey()
			.$defaultFn(() => crypto.randomUUID()),
		accountId: text('account_id')
			.notNull()
			.references(() => account.id),
		securityId: text('security_id')
			.notNull()
			.references(() => security.id),
		shares: real('shares'),
		basis: real('basis')
	},
	(t) => [unique().on(t.accountId, t.securityId)]
);

export const priceSnapshot = sqliteTable(
	'price_snapshot',
	{
		id: text('id')
			.primaryKey()
			.$defaultFn(() => crypto.randomUUID()),
		securityId: text('security_id')
			.notNull()
			.references(() => security.id),
		price: real('price').notNull(),
		snapshotDate: text('snapshot_date').notNull()
	},
	(t) => [unique().on(t.securityId, t.snapshotDate)]
);

export const priceBasis = sqliteTable(
	'price_basis',
	{
		id: text('id')
			.primaryKey()
			.$defaultFn(() => crypto.randomUUID()),
		accountId: text('account_id')
			.notNull()
			.references(() => account.id),
		securityId: text('security_id')
			.notNull()
			.references(() => security.id),
		amountSpent: real('amount_spent').notNull()
	},
	(t) => [unique().on(t.accountId, t.securityId)]
);
