CREATE TABLE `account` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`owner` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `account_name_unique` ON `account` (`name`);--> statement-breakpoint
CREATE TABLE `account_tag` (
	`account_id` text NOT NULL,
	`tag_id` text NOT NULL,
	FOREIGN KEY (`account_id`) REFERENCES `account`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`tag_id`) REFERENCES `tag`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `account_tag_account_id_tag_id_unique` ON `account_tag` (`account_id`,`tag_id`);--> statement-breakpoint
CREATE TABLE `category` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `category_name_unique` ON `category` (`name`);--> statement-breakpoint
CREATE TABLE `holding` (
	`id` text PRIMARY KEY NOT NULL,
	`account_id` text NOT NULL,
	`security_id` text NOT NULL,
	`shares` real,
	`basis` real,
	FOREIGN KEY (`account_id`) REFERENCES `account`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`security_id`) REFERENCES `security`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `holding_account_id_security_id_unique` ON `holding` (`account_id`,`security_id`);--> statement-breakpoint
CREATE TABLE `industry` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`sector_id` text,
	FOREIGN KEY (`sector_id`) REFERENCES `sector`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `industry_name_unique` ON `industry` (`name`);--> statement-breakpoint
CREATE TABLE `price_basis` (
	`id` text PRIMARY KEY NOT NULL,
	`account_id` text NOT NULL,
	`security_id` text NOT NULL,
	`amount_spent` real NOT NULL,
	FOREIGN KEY (`account_id`) REFERENCES `account`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`security_id`) REFERENCES `security`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `price_basis_account_id_security_id_unique` ON `price_basis` (`account_id`,`security_id`);--> statement-breakpoint
CREATE TABLE `price_snapshot` (
	`id` text PRIMARY KEY NOT NULL,
	`security_id` text NOT NULL,
	`price` real NOT NULL,
	`snapshot_date` text NOT NULL,
	FOREIGN KEY (`security_id`) REFERENCES `security`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `price_snapshot_security_id_snapshot_date_unique` ON `price_snapshot` (`security_id`,`snapshot_date`);--> statement-breakpoint
CREATE TABLE `region` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `region_name_unique` ON `region` (`name`);--> statement-breakpoint
CREATE TABLE `sector` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `sector_name_unique` ON `sector` (`name`);--> statement-breakpoint
CREATE TABLE `security` (
	`id` text PRIMARY KEY NOT NULL,
	`symbol` text NOT NULL,
	`full_name` text,
	`category_id` text,
	`type_id` text NOT NULL,
	`sector_id` text,
	`industry_id` text,
	`region_id` text NOT NULL,
	FOREIGN KEY (`category_id`) REFERENCES `category`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`type_id`) REFERENCES `security_type`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`sector_id`) REFERENCES `sector`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`industry_id`) REFERENCES `industry`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`region_id`) REFERENCES `region`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `security_symbol_unique` ON `security` (`symbol`);--> statement-breakpoint
CREATE TABLE `security_type` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `security_type_name_unique` ON `security_type` (`name`);--> statement-breakpoint
CREATE TABLE `tag` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `tag_name_unique` ON `tag` (`name`);