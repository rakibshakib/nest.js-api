/*
  Warnings:

  - You are about to drop the `VendorOffer` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `VendorOffer` DROP FOREIGN KEY `VendorOffer_vendorId_fkey`;

-- DropTable
DROP TABLE `VendorOffer`;
