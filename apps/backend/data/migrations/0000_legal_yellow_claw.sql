CREATE TABLE `problem_set_items` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`problem_set_id` integer NOT NULL,
	`problem_id` integer NOT NULL,
	FOREIGN KEY (`problem_set_id`) REFERENCES `problem_sets`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`problem_id`) REFERENCES `problems`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `problem_sets` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`created_at` text DEFAULT 'CURRENT_TIMESTAMP' NOT NULL
);
--> statement-breakpoint
CREATE TABLE `problems` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`title` text NOT NULL,
	`slug` text NOT NULL,
	`source_type` text NOT NULL,
	`source_input` text NOT NULL,
	`statement` text NOT NULL,
	`constraints` text NOT NULL,
	`examples` text NOT NULL,
	`edge_cases` text NOT NULL,
	`hints` text NOT NULL,
	`function_signature` text NOT NULL,
	`starter_code` text NOT NULL,
	`expected_complexity` text NOT NULL,
	`difficulty` text NOT NULL,
	`tags` text NOT NULL,
	`created_at` text DEFAULT 'CURRENT_TIMESTAMP' NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `problems_slug_unique` ON `problems` (`slug`);--> statement-breakpoint
CREATE TABLE `submissions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`problem_id` integer NOT NULL,
	`language` text DEFAULT 'java' NOT NULL,
	`code` text NOT NULL,
	`mode` text NOT NULL,
	`status` text NOT NULL,
	`passed_count` integer DEFAULT 0 NOT NULL,
	`total_count` integer DEFAULT 0 NOT NULL,
	`runtime_ms` integer,
	`memory_kb` integer,
	`result_details` text NOT NULL,
	`created_at` text DEFAULT 'CURRENT_TIMESTAMP' NOT NULL,
	FOREIGN KEY (`problem_id`) REFERENCES `problems`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `test_cases` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`problem_id` integer NOT NULL,
	`input` text NOT NULL,
	`expected_output` text NOT NULL,
	`explanation` text,
	`is_hidden` integer DEFAULT false NOT NULL,
	`weight` integer DEFAULT 1 NOT NULL,
	FOREIGN KEY (`problem_id`) REFERENCES `problems`(`id`) ON UPDATE no action ON DELETE cascade
);
