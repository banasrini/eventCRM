ALTER TABLE `sponsors` ADD `ai_summary_at` text;--> statement-breakpoint
CREATE TABLE `sponsor_notes` (
	`id` text PRIMARY KEY NOT NULL,
	`sponsor_id` text NOT NULL,
	`content` text NOT NULL,
	`source` text,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP),
	FOREIGN KEY (`sponsor_id`) REFERENCES `sponsors`(`id`) ON DELETE cascade ON UPDATE no action
);
