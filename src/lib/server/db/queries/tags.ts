import { db } from '$lib/server/db';
import { entityTag, tag, type EntityType } from '$lib/server/db/schema';
import { and, eq, inArray } from 'drizzle-orm';

/** Looks up each tag name, creating any that don't exist yet, and returns their ids. */
export async function resolveTagIds(tagNames: string[]): Promise<string[]> {
	const tagIds: string[] = [];
	for (const tagName of tagNames) {
		const existing = await db.select().from(tag).where(eq(tag.name, tagName)).limit(1);
		if (existing.length > 0) {
			tagIds.push(existing[0].id);
		} else {
			const [{ tagId }] = await db
				.insert(tag)
				.values({ name: tagName })
				.returning({ tagId: tag.id });
			tagIds.push(tagId);
		}
	}
	return tagIds;
}

export async function listAllTagNames(): Promise<string[]> {
	const rows = await db.select({ name: tag.name }).from(tag).orderBy(tag.name);
	return rows.map((row) => row.name);
}

export async function getTagsForEntity(
	entityType: EntityType,
	entityId: string
): Promise<string[]> {
	const rows = await db
		.select({ name: tag.name })
		.from(entityTag)
		.innerJoin(tag, eq(entityTag.tagId, tag.id))
		.where(and(eq(entityTag.entityType, entityType), eq(entityTag.entityId, entityId)))
		.orderBy(tag.name);
	return rows.map((row) => row.name);
}

/** Bulk version of {@link getTagsForEntity}, for list pages showing many entities at once. */
export async function getTagsForEntities(
	entityType: EntityType,
	entityIds: string[]
): Promise<Map<string, string[]>> {
	const tagsByEntityId = new Map<string, string[]>();
	if (entityIds.length === 0) return tagsByEntityId;

	const rows = await db
		.select({ entityId: entityTag.entityId, tagName: tag.name })
		.from(entityTag)
		.innerJoin(tag, eq(entityTag.tagId, tag.id))
		.where(and(eq(entityTag.entityType, entityType), inArray(entityTag.entityId, entityIds)));

	for (const { entityId, tagName } of rows) {
		const existing = tagsByEntityId.get(entityId);
		if (existing) existing.push(tagName);
		else tagsByEntityId.set(entityId, [tagName]);
	}
	return tagsByEntityId;
}

/** Replaces an entity's tag links with exactly the given tag names. */
export async function syncEntityTags(
	entityType: EntityType,
	entityId: string,
	tagNames: string[]
): Promise<void> {
	await db
		.delete(entityTag)
		.where(and(eq(entityTag.entityType, entityType), eq(entityTag.entityId, entityId)));

	if (tagNames.length === 0) return;

	const tagIds = await resolveTagIds(tagNames);
	await db.insert(entityTag).values(tagIds.map((tagId) => ({ entityId, entityType, tagId })));
}

/** Removes all of an entity's tag links, e.g. before deleting the entity itself. */
export async function deleteEntityTags(entityType: EntityType, entityId: string): Promise<void> {
	await db
		.delete(entityTag)
		.where(and(eq(entityTag.entityType, entityType), eq(entityTag.entityId, entityId)));
}
