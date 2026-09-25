CREATE TABLE `entity_tag` (
	`entity_id` text NOT NULL,
	`entity_type` text NOT NULL,
	`tag_id` text NOT NULL,
	FOREIGN KEY (`tag_id`) REFERENCES `tag`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `entity_tag_entity_id_entity_type_tag_id_unique` ON `entity_tag` (`entity_id`,`entity_type`,`tag_id`);--> statement-breakpoint
INSERT INTO `entity_tag` (`entity_id`, `entity_type`, `tag_id`) SELECT `account_id`, 'account', `tag_id` FROM `account_tag`;--> statement-breakpoint
DROP TABLE `account_tag`;