CREATE TABLE `outfitPlans` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`outfitId` int,
	`planDate` varchar(10) NOT NULL,
	`occasion` varchar(120),
	`note` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `outfitPlans_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `savedOutfits` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`title` varchar(160) NOT NULL,
	`itemIds` text NOT NULL,
	`rationale` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `savedOutfits_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `wardrobeItems` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`imageUrl` text NOT NULL,
	`imageKey` varchar(512) NOT NULL,
	`name` varchar(160) NOT NULL,
	`category` enum('tops','bottoms','outerwear','shoes','accessories','one-piece','activewear','other') NOT NULL DEFAULT 'other',
	`primaryColor` varchar(64) NOT NULL DEFAULT 'Unknown',
	`seasons` varchar(120) NOT NULL DEFAULT 'all-season',
	`formality` enum('casual','smart-casual','business','formal','active') NOT NULL DEFAULT 'casual',
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `wardrobeItems_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `outfitPlans` ADD CONSTRAINT `outfitPlans_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `outfitPlans` ADD CONSTRAINT `outfitPlans_outfitId_savedOutfits_id_fk` FOREIGN KEY (`outfitId`) REFERENCES `savedOutfits`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `savedOutfits` ADD CONSTRAINT `savedOutfits_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `wardrobeItems` ADD CONSTRAINT `wardrobeItems_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;