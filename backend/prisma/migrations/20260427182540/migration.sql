/*
  Warnings:

  - You are about to drop the column `appId` on the `ConnectedApp` table. All the data in the column will be lost.
  - You are about to drop the column `reason` on the `ModerationLog` table. All the data in the column will be lost.
  - You are about to alter the column `status` on the `ModerationLog` table. The data in that column could be lost. The data in that column will be cast from `Enum(EnumId(0))` to `Enum(EnumId(3))`.
  - A unique constraint covering the columns `[userId,platform]` on the table `ConnectedApp` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `platform` to the `ConnectedApp` table without a default value. This is not possible if the table is not empty.
  - Added the required column `action` to the `ModerationLog` table without a default value. This is not possible if the table is not empty.
  - Added the required column `details` to the `ModerationLog` table without a default value. This is not possible if the table is not empty.
  - Added the required column `moderatorId` to the `ModerationLog` table without a default value. This is not possible if the table is not empty.
  - Added the required column `title` to the `Post` table without a default value. This is not possible if the table is not empty.
  - Added the required column `topic` to the `Post` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `Comment` DROP FOREIGN KEY `Comment_postId_fkey`;

-- DropForeignKey
ALTER TABLE `Comment` DROP FOREIGN KEY `Comment_previousCommentId_fkey`;

-- DropForeignKey
ALTER TABLE `Comment` DROP FOREIGN KEY `Comment_userId_fkey`;

-- DropForeignKey
ALTER TABLE `ConnectedApp` DROP FOREIGN KEY `ConnectedApp_userId_fkey`;

-- DropForeignKey
ALTER TABLE `ModerationLog` DROP FOREIGN KEY `ModerationLog_userId_fkey`;

-- DropForeignKey
ALTER TABLE `Notification` DROP FOREIGN KEY `Notification_userId_fkey`;

-- DropForeignKey
ALTER TABLE `Post` DROP FOREIGN KEY `Post_userId_fkey`;

-- DropIndex
DROP INDEX `Comment_postId_fkey` ON `Comment`;

-- DropIndex
DROP INDEX `Comment_previousCommentId_fkey` ON `Comment`;

-- DropIndex
DROP INDEX `Comment_userId_fkey` ON `Comment`;

-- DropIndex
DROP INDEX `ConnectedApp_userId_fkey` ON `ConnectedApp`;

-- DropIndex
DROP INDEX `ModerationLog_userId_fkey` ON `ModerationLog`;

-- DropIndex
DROP INDEX `Notification_userId_fkey` ON `Notification`;

-- DropIndex
DROP INDEX `Post_userId_fkey` ON `Post`;

-- AlterTable
ALTER TABLE `Comment` MODIFY `text` TEXT NOT NULL;

-- AlterTable
ALTER TABLE `ConnectedApp` DROP COLUMN `appId`,
    ADD COLUMN `expiresAt` DATETIME(3) NULL,
    ADD COLUMN `platform` VARCHAR(191) NOT NULL,
    ADD COLUMN `refreshToken` TEXT NULL,
    MODIFY `accessToken` TEXT NULL;

-- AlterTable
ALTER TABLE `IpBan` MODIFY `reason` TEXT NOT NULL;

-- AlterTable
ALTER TABLE `ModerationLog` DROP COLUMN `reason`,
    ADD COLUMN `action` VARCHAR(191) NOT NULL,
    ADD COLUMN `details` VARCHAR(191) NOT NULL,
    ADD COLUMN `moderatorId` VARCHAR(191) NOT NULL,
    MODIFY `status` ENUM('DELETED', 'NOTIFIED', 'REPORTED', 'DISMISSED', 'BLOCKED', 'ROLE_CHANGED') NOT NULL DEFAULT 'NOTIFIED';

-- AlterTable
ALTER TABLE `Notification` ADD COLUMN `link` VARCHAR(191) NULL,
    ADD COLUMN `message` TEXT NULL;

-- AlterTable
ALTER TABLE `Post` ADD COLUMN `title` VARCHAR(191) NOT NULL,
    ADD COLUMN `topic` VARCHAR(191) NOT NULL,
    MODIFY `text` LONGTEXT NOT NULL;

-- AlterTable
ALTER TABLE `User` ADD COLUMN `description` TEXT NULL,
    ADD COLUMN `isBlocked` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `isPrivate` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `spotifyTimeRange` ENUM('SHORT', 'MEDIUM', 'LONG') NOT NULL DEFAULT 'SHORT',
    MODIFY `role` ENUM('USER', 'MODERATOR', 'ADMIN') NOT NULL DEFAULT 'USER';

-- CreateTable
CREATE TABLE `CommentLike` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `commentId` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `CommentLike_userId_commentId_key`(`userId`, `commentId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PostLike` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `postId` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `PostLike_userId_postId_key`(`userId`, `postId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `RevokedToken` (
    `id` VARCHAR(191) NOT NULL,
    `tokenHash` VARCHAR(191) NOT NULL,
    `expiresAt` DATETIME(3) NOT NULL,
    `revokedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `RevokedToken_tokenHash_key`(`tokenHash`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE UNIQUE INDEX `ConnectedApp_userId_platform_key` ON `ConnectedApp`(`userId`, `platform`);

-- AddForeignKey
ALTER TABLE `ConnectedApp` ADD CONSTRAINT `ConnectedApp_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Post` ADD CONSTRAINT `Post_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Comment` ADD CONSTRAINT `Comment_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Comment` ADD CONSTRAINT `Comment_postId_fkey` FOREIGN KEY (`postId`) REFERENCES `Post`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Comment` ADD CONSTRAINT `Comment_previousCommentId_fkey` FOREIGN KEY (`previousCommentId`) REFERENCES `Comment`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Notification` ADD CONSTRAINT `Notification_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ModerationLog` ADD CONSTRAINT `ModerationLog_moderatorId_fkey` FOREIGN KEY (`moderatorId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ModerationLog` ADD CONSTRAINT `ModerationLog_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CommentLike` ADD CONSTRAINT `CommentLike_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CommentLike` ADD CONSTRAINT `CommentLike_commentId_fkey` FOREIGN KEY (`commentId`) REFERENCES `Comment`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PostLike` ADD CONSTRAINT `PostLike_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PostLike` ADD CONSTRAINT `PostLike_postId_fkey` FOREIGN KEY (`postId`) REFERENCES `Post`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
