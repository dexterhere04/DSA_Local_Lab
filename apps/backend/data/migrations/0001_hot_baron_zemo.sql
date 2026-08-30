ALTER TABLE `problems` ADD `reference_solution` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `problems` ADD `time_limit_ms` integer DEFAULT 2000 NOT NULL;--> statement-breakpoint
ALTER TABLE `problems` ADD `memory_limit_mb` integer DEFAULT 256 NOT NULL;