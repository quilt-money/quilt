CREATE TABLE `account_tag` (
	`account_id` text NOT NULL,
	`tag_id` text NOT NULL,
	FOREIGN KEY (`account_id`) REFERENCES `account`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`tag_id`) REFERENCES `tag`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `account_tag_account_id_tag_id_unique` ON `account_tag` (`account_id`,`tag_id`);--> statement-breakpoint
CREATE TABLE `tag` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `tag_name_unique` ON `tag` (`name`);