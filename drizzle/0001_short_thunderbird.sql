CREATE TABLE `flash_sales` (
	`id` int AUTO_INCREMENT NOT NULL,
	`productId` int NOT NULL,
	`discountPercentage` decimal(5,2) NOT NULL,
	`startTime` timestamp NOT NULL,
	`endTime` timestamp NOT NULL,
	`stockLimit` int,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `flash_sales_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `loyalty_history` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`transactionType` enum('EARN','REDEEM') NOT NULL,
	`pointsAmount` decimal(12,0) NOT NULL,
	`relatedOrderId` int,
	`metadata` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `loyalty_history_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `payment_categories` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`displayOrder` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `payment_categories_id` PRIMARY KEY(`id`),
	CONSTRAINT `payment_categories_name_unique` UNIQUE(`name`)
);
--> statement-breakpoint
CREATE TABLE `payment_methods` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`categoryId` int NOT NULL,
	`logoUrl` varchar(500) NOT NULL,
	`adminFee` decimal(12,0) NOT NULL DEFAULT '0',
	`isActive` boolean NOT NULL DEFAULT true,
	`usageCount` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `payment_methods_id` PRIMARY KEY(`id`),
	CONSTRAINT `payment_methods_name_unique` UNIQUE(`name`)
);
--> statement-breakpoint
CREATE TABLE `products` (
	`id` int AUTO_INCREMENT NOT NULL,
	`gameName` varchar(150) NOT NULL,
	`sku` varchar(100) NOT NULL,
	`basePrice` decimal(12,0) NOT NULL,
	`logoUrl` varchar(500) NOT NULL,
	`isActive` boolean NOT NULL DEFAULT true,
	`category` enum('TOPUP','VOUCHER') NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `products_id` PRIMARY KEY(`id`),
	CONSTRAINT `products_sku_unique` UNIQUE(`sku`)
);
--> statement-breakpoint
CREATE TABLE `provider_status` (
	`id` int AUTO_INCREMENT NOT NULL,
	`providerName` varchar(100) NOT NULL,
	`isOnline` boolean NOT NULL DEFAULT true,
	`statusMessage` text,
	`lastCheckedAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `provider_status_id` PRIMARY KEY(`id`),
	CONSTRAINT `provider_status_providerName_unique` UNIQUE(`providerName`)
);
--> statement-breakpoint
CREATE TABLE `transactions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`productId` int NOT NULL,
	`paymentMethodId` int NOT NULL,
	`orderAmount` decimal(12,0) NOT NULL,
	`adminFee` decimal(12,0) NOT NULL,
	`totalAmount` decimal(12,0) NOT NULL,
	`sassyPointsEarned` decimal(12,0) NOT NULL DEFAULT '0',
	`sassyPointsRedeemed` decimal(12,0) NOT NULL DEFAULT '0',
	`status` enum('PENDING','CONFIRMED','FAILED') NOT NULL DEFAULT 'PENDING',
	`whatsappSent` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `transactions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` ADD `sassyPointsBalance` decimal(12,0) DEFAULT '0' NOT NULL;