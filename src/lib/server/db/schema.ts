import { integer, real, sqliteTable, text, unique } from 'drizzle-orm/sqlite-core';

export const sector = sqliteTable('sector', {
	id: text('id')
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	name: text('name').notNull().unique()
});

export const region = sqliteTable('region', {
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
	typeId: text('type_id').references(() => securityType.id),
	sectorId: text('sector_id').references(() => sector.id),
	regionId: text('region_id').references(() => region.id)
});

export const account = sqliteTable('account', {
	id: text('id')
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	name: text('name').notNull().unique(),
	lastUpdated: text('last_updated')
});

export const holding = sqliteTable(
	'holding',
	{
		id: text('id')
			.primaryKey()
			.$defaultFn(() => crypto.randomUUID()),
		accountId: text('account_id')
			.notNull()
			.references(() => account.id, { onDelete: 'cascade' }),
		securityId: text('security_id')
			.notNull()
			.references(() => security.id, { onDelete: 'cascade' }),
		shares: real('shares'),
		costBasis: real('cost_basis')
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
			.references(() => security.id, { onDelete: 'cascade' }),
		price: real('price').notNull(),
		snapshotTime: text('snapshot_time').notNull()
	},
	(t) => [unique().on(t.securityId, t.snapshotTime)]
);

export const tag = sqliteTable('tag', {
	id: text('id')
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	name: text('name').notNull().unique()
});

export const ENTITY_TYPES = ['account', 'security'] as const;
export type EntityType = (typeof ENTITY_TYPES)[number];

export const entityTag = sqliteTable(
	'entity_tag',
	{
		entityId: text('entity_id').notNull(),
		entityType: text('entity_type').$type<EntityType>().notNull(),
		tagId: text('tag_id')
			.notNull()
			.references(() => tag.id, { onDelete: 'cascade' })
	},
	(t) => [unique().on(t.entityId, t.entityType, t.tagId)]
);

export const report = sqliteTable('report', {
	id: text('id')
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	title: text('title').notNull(),
	config: text('config', { mode: 'json' }).notNull(),
	createdAt: text('created_at')
		.notNull()
		.$defaultFn(() => new Date().toISOString())
});

export const dashboardItem = sqliteTable('dashboard_item', {
	reportId: text('report_id')
		.primaryKey()
		.references(() => report.id, { onDelete: 'cascade' }),
	column: integer('column').notNull(),
	row: integer('row').notNull(),
	columnSpan: integer('column_span').notNull(),
	rowSpan: integer('row_span').notNull()
});
