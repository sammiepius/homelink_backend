-- AlterTable
ALTER TABLE `contactmessage` MODIFY `status` VARCHAR(191) NOT NULL DEFAULT 'new';

-- AlterTable
ALTER TABLE `property` ADD COLUMN `approved` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `isActive` BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE `user` MODIFY `role` ENUM('LANDLORD', 'TENANT', 'ADMIN') NOT NULL DEFAULT 'TENANT';
