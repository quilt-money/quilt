ALTER TABLE `price_snapshot` RENAME COLUMN "snapshot_date" TO "snapshot_time";--> statement-breakpoint
DROP INDEX `price_snapshot_security_id_snapshot_date_unique`;--> statement-breakpoint
CREATE UNIQUE INDEX `price_snapshot_security_id_snapshot_time_unique` ON `price_snapshot` (`security_id`,`snapshot_time`);