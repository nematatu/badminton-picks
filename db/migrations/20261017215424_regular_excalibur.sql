CREATE TABLE `collections` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`author_name` text NOT NULL,
	`items` text NOT NULL,
	`owner_hash` text NOT NULL,
	`revision` integer DEFAULT 1 NOT NULL,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `collections_created_at_idx` ON `collections` (`created_at`);