-- DropForeignKey
ALTER TABLE `chatmessage` DROP FOREIGN KEY `ChatMessage_userId_fkey`;

-- DropIndex
DROP INDEX `ChatMessage_isAdmin_idx` ON `chatmessage`;

-- AlterTable
ALTER TABLE `chatmessage` MODIFY `userId` INTEGER NULL;

-- CreateTable
CREATE TABLE `PasswordReset` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `email` VARCHAR(191) NOT NULL,
    `token` VARCHAR(191) NOT NULL,
    `expiresAt` DATETIME(3) NOT NULL,
    `used` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `PasswordReset_token_key`(`token`),
    INDEX `PasswordReset_email_idx`(`email`),
    INDEX `PasswordReset_token_idx`(`token`),
    INDEX `PasswordReset_expiresAt_idx`(`expiresAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `ChatMessage` ADD CONSTRAINT `ChatMessage_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
