-- AlterTable
ALTER TABLE `contactmessage` MODIFY `status` VARCHAR(191) NOT NULL DEFAULT 'new';

-- AlterTable
ALTER TABLE `user` MODIFY `role` ENUM('LANDLORD', 'TENANT', 'ADMIN') NOT NULL DEFAULT 'TENANT';
