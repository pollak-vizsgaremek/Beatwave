-- DropTable
DROP TABLE IF EXISTS `IpBan`;

-- AlterTable
ALTER TABLE `User`
    DROP COLUMN IF EXISTS `lastKnownIp`;
