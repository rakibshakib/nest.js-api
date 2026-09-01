-- CreateTable
CREATE TABLE `VendorOffer` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `vendorId` INTEGER NOT NULL,
    `type` ENUM('TEXT', 'PERCENTAGE', 'FIXED_AMOUNT') NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `value` DECIMAL(10, 2) NULL,
    `startDate` DATETIME(3) NOT NULL,
    `hasExpireDate` BOOLEAN NOT NULL DEFAULT false,
    `endDate` DATETIME(3) NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `VendorOffer_vendorId_key`(`vendorId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `VendorOffer` ADD CONSTRAINT `VendorOffer_vendorId_fkey` FOREIGN KEY (`vendorId`) REFERENCES `Vendor`(`userId`) ON DELETE CASCADE ON UPDATE CASCADE;
