-- AlterTable
ALTER TABLE `User`
    ADD COLUMN `lastKnownIp` VARCHAR(191) NULL;

-- CreateTable
CREATE TABLE `IpBan` (
    `id` VARCHAR(191) NOT NULL,
    `ipAddress` VARCHAR(191) NOT NULL,
    `reason` LONGTEXT NOT NULL,
    `expiresAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `bannedById` VARCHAR(191) NULL,

    INDEX `IpBan_ipAddress_idx`(`ipAddress`),
    INDEX `IpBan_expiresAt_idx`(`expiresAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `IpBan`
    ADD CONSTRAINT `IpBan_bannedById_fkey`
    FOREIGN KEY (`bannedById`) REFERENCES `User`(`id`)
    ON DELETE SET NULL ON UPDATE CASCADE;