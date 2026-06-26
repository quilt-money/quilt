PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_holding` (
	`id` text PRIMARY KEY NOT NULL,
	`account_id` text NOT NULL,
	`security_id` text NOT NULL,
	`shares` real,
	`basis` real,
	FOREIGN KEY (`account_id`) REFERENCES `account`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`security_id`) REFERENCES `security`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_holding`("id", "account_id", "security_id", "shares", "basis") SELECT "id", "account_id", "security_id", "shares", "basis" FROM `holding`;--> statement-breakpoint
DROP TABLE `holding`;--> statement-breakpoint
ALTER TABLE `__new_holding` RENAME TO `holding`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE UNIQUE INDEX `holding_account_id_security_id_unique` ON `holding` (`account_id`,`security_id`);--> statement-breakpoint
CREATE TABLE `__new_price_basis` (
	`id` text PRIMARY KEY NOT NULL,
	`account_id` text NOT NULL,
	`security_id` text NOT NULL,
	`amount_spent` real NOT NULL,
	FOREIGN KEY (`account_id`) REFERENCES `account`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`security_id`) REFERENCES `security`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_price_basis`("id", "account_id", "security_id", "amount_spent") SELECT "id", "account_id", "security_id", "amount_spent" FROM `price_basis`;--> statement-breakpoint
DROP TABLE `price_basis`;--> statement-breakpoint
ALTER TABLE `__new_price_basis` RENAME TO `price_basis`;--> statement-breakpoint
CREATE UNIQUE INDEX `price_basis_account_id_security_id_unique` ON `price_basis` (`account_id`,`security_id`);--> statement-breakpoint
CREATE TABLE `__new_price_snapshot` (
	`id` text PRIMARY KEY NOT NULL,
	`security_id` text NOT NULL,
	`price` real NOT NULL,
	`snapshot_date` text NOT NULL,
	FOREIGN KEY (`security_id`) REFERENCES `security`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_price_snapshot`("id", "security_id", "price", "snapshot_date") SELECT "id", "security_id", "price", "snapshot_date" FROM `price_snapshot`;--> statement-breakpoint
DROP TABLE `price_snapshot`;--> statement-breakpoint
ALTER TABLE `__new_price_snapshot` RENAME TO `price_snapshot`;--> statement-breakpoint
CREATE UNIQUE INDEX `price_snapshot_security_id_snapshot_date_unique` ON `price_snapshot` (`security_id`,`snapshot_date`);