ALTER TABLE `savedOutfits` ADD `itemSnapshot` text NOT NULL;--> statement-breakpoint
ALTER TABLE `wardrobeItems` ADD `laundryStatus` enum('clean','dirty') DEFAULT 'clean' NOT NULL;--> statement-breakpoint
ALTER TABLE `wardrobeItems` ADD `lastLaunderedAt` timestamp;
