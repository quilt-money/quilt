CREATE TABLE `dashboard_item` (
	`report_id` text PRIMARY KEY NOT NULL,
	`column` integer NOT NULL,
	`row` integer NOT NULL,
	`column_span` integer NOT NULL,
	`row_span` integer NOT NULL,
	FOREIGN KEY (`report_id`) REFERENCES `report`(`id`) ON UPDATE no action ON DELETE cascade
);
