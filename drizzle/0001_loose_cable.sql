DROP TABLE `category`;--> statement-breakpoint
DROP TABLE `industry`;--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_security` (
	`id` text PRIMARY KEY NOT NULL,
	`symbol` text NOT NULL,
	`full_name` text,
	`type_id` text,
	`sector_id` text,
	`region_id` text,
	FOREIGN KEY (`type_id`) REFERENCES `security_type`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`sector_id`) REFERENCES `sector`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`region_id`) REFERENCES `region`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_security`("id", "symbol", "full_name", "type_id", "sector_id", "region_id") SELECT "id", "symbol", "full_name", "type_id", "sector_id", "region_id" FROM `security`;--> statement-breakpoint
DROP TABLE `security`;--> statement-breakpoint
ALTER TABLE `__new_security` RENAME TO `security`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE UNIQUE INDEX `security_symbol_unique` ON `security` (`symbol`);