import { sql } from 'drizzle-orm';
import { security, priceSnapshot } from '../schema';

/**
 * Correlated subquery for a security's most recent price snapshot. Must be
 * used alongside a query that already selects from `security` (or joins it),
 * since it references `security.id` from the outer query.
 */
export function latestPriceSql() {
	return sql<number | null>`(
        select ${priceSnapshot.price} from ${priceSnapshot}
        where ${priceSnapshot.securityId} = ${security.id}
        order by ${priceSnapshot.snapshotTime} desc
        limit 1
    )`;
}
