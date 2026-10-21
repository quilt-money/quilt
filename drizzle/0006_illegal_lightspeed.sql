CREATE TABLE `sync_schedule` (
	`id` integer PRIMARY KEY NOT NULL,
	`enabled` integer DEFAULT false NOT NULL,
	`time` text DEFAULT '02:00' NOT NULL,
	`last_run_at` text,
	`last_run_summary` text
);
