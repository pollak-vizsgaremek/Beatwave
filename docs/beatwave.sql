-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Gép: 127.0.0.1
-- Létrehozás ideje: 2026. Ápr 29. 19:56
-- Kiszolgáló verziója: 10.4.32-MariaDB
-- PHP verzió: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Adatbázis: `beatwave`
--

-- --------------------------------------------------------

--
-- Tábla szerkezet ehhez a táblához `comment`
--

CREATE TABLE `comment` (
  `id` varchar(191) NOT NULL,
  `text` text NOT NULL,
  `likeAmount` int(11) NOT NULL DEFAULT 0,
  `commentedAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `userId` varchar(191) NOT NULL,
  `postId` varchar(191) NOT NULL,
  `previousCommentId` varchar(191) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- A tábla adatainak kiíratása `comment`
--

INSERT INTO `comment` (`id`, `text`, `likeAmount`, `commentedAt`, `userId`, `postId`, `previousCommentId`) VALUES
('3f8c8067-2e30-4da9-bf13-2115c0e6589a', 'Az szörnyű remélem minnél előbb sikerül fixálni.', 0, '2026-04-29 17:46:10.833', '29be55aa-037f-493f-b81d-08aa8746bb48', '72cefce3-5377-4167-b189-25d627146711', NULL),
('67054989-463e-48a0-9733-e59be1037715', 'Uuuu That sounds really good I will try her.', 1, '2026-04-29 17:53:10.794', '8a805cf5-4af1-42f7-bcd7-371a386d8b28', '7c473a7f-cccd-42ed-83bc-e2571c934d75', NULL),
('8f4127ad-7a48-4ad2-854c-f0396d735264', 'I hope you like her music as well', 0, '2026-04-29 17:54:43.747', '29be55aa-037f-493f-b81d-08aa8746bb48', '7c473a7f-cccd-42ed-83bc-e2571c934d75', '67054989-463e-48a0-9733-e59be1037715');

-- --------------------------------------------------------

--
-- Tábla szerkezet ehhez a táblához `commentlike`
--

CREATE TABLE `commentlike` (
  `id` varchar(191) NOT NULL,
  `userId` varchar(191) NOT NULL,
  `commentId` varchar(191) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- A tábla adatainak kiíratása `commentlike`
--

INSERT INTO `commentlike` (`id`, `userId`, `commentId`) VALUES
('69459923-8f13-4039-97cd-4fcc1491f989', '29be55aa-037f-493f-b81d-08aa8746bb48', '67054989-463e-48a0-9733-e59be1037715');

-- --------------------------------------------------------

--
-- Tábla szerkezet ehhez a táblához `connectedapp`
--

CREATE TABLE `connectedapp` (
  `id` varchar(191) NOT NULL,
  `accessToken` text DEFAULT NULL,
  `connectedAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `userId` varchar(191) NOT NULL,
  `expiresAt` datetime(3) DEFAULT NULL,
  `platform` varchar(191) NOT NULL,
  `refreshToken` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- A tábla adatainak kiíratása `connectedapp`
--

INSERT INTO `connectedapp` (`id`, `accessToken`, `connectedAt`, `userId`, `expiresAt`, `platform`, `refreshToken`) VALUES
('63d4eebb-48f2-4ad7-8bc6-68ed3c37cd0c', 'BQDLqhb34idfu_ZIxeVYfRFfnT04p8HxxIijmvmi5w76BTnlXQNxm_wyAccOJdfCezvr1ZVpfI0GeKRPFoNgwdlLHjqR1CELORxaKS5m1Y7jPLRhumm79v2IN6RimlxuqKjqFEtqxr0wKMI0QkYNcnPP4O9NnIqCPreaAFHLqG-_QFMzvC4YBtC55DszC4SQy9LWwfOQb-y1FzWp4a9m6EU0_9-i4SQE0_TuSfFPH7HRs8GWg3bYvGfU_v8GpuN_TMETKLTd3TRjTm01ZIQaWuax3EaLSPEsjhewko4z5cCkNaNmLwbb4cs1jAgM6AnK_ZSzOoTXG33kzR4bTiEmKgjv3wgNqhMASqcj0km7o10SGY8Etyw', '2026-04-29 17:34:50.091', '5c19a535-d757-4c7d-b391-cb69a618854e', '2026-04-29 18:34:50.084', 'Spotify', 'AQCGB15u_zqK_iSBszVPX399qzkwRkPZgh2RllIZ44Ws-iOJoO7ms1QYaGLZ1Bc2hAsvJsaOqxAM2j6jv8jjwTjEtdJutDIhaFNQ4RYZAR9YKa1R0K-Y4Wq56yN28GvB56Y');

-- --------------------------------------------------------

--
-- Tábla szerkezet ehhez a táblához `moderationlog`
--

CREATE TABLE `moderationlog` (
  `id` varchar(191) NOT NULL,
  `status` enum('DELETED','NOTIFIED','REPORTED','DISMISSED','BLOCKED','ROLE_CHANGED') NOT NULL DEFAULT 'NOTIFIED',
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `postId` varchar(191) DEFAULT NULL,
  `commentId` varchar(191) DEFAULT NULL,
  `userId` varchar(191) NOT NULL,
  `action` varchar(191) NOT NULL,
  `details` varchar(191) NOT NULL,
  `moderatorId` varchar(191) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- A tábla adatainak kiíratása `moderationlog`
--

INSERT INTO `moderationlog` (`id`, `status`, `createdAt`, `postId`, `commentId`, `userId`, `action`, `details`, `moderatorId`) VALUES
('c02ee8b8-0237-4d80-9ccf-cb2390974ea2', 'NOTIFIED', '2026-04-29 17:38:09.294', '72cefce3-5377-4167-b189-25d627146711', NULL, '5c19a535-d757-4c7d-b391-cb69a618854e', 'CREATE_ANNOUNCEMENT', 'Created announcement post 72cefce3-5377-4167-b189-25d627146711 titled \"We are having Issues with the Spotify API\".', '5c19a535-d757-4c7d-b391-cb69a618854e');

-- --------------------------------------------------------

--
-- Tábla szerkezet ehhez a táblához `notification`
--

CREATE TABLE `notification` (
  `id` varchar(191) NOT NULL,
  `type` varchar(191) NOT NULL,
  `read` tinyint(1) NOT NULL DEFAULT 0,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `userId` varchar(191) NOT NULL,
  `triggeredById` varchar(191) DEFAULT NULL,
  `link` varchar(191) DEFAULT NULL,
  `message` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- A tábla adatainak kiíratása `notification`
--

INSERT INTO `notification` (`id`, `type`, `read`, `createdAt`, `userId`, `triggeredById`, `link`, `message`) VALUES
('03d7bbf8-eaa7-486d-b943-dc1fa7646e2b', 'announcement', 1, '2026-04-29 17:38:09.292', '5c19a535-d757-4c7d-b391-cb69a618854e', '5c19a535-d757-4c7d-b391-cb69a618854e', '/discussion/view/72cefce3-5377-4167-b189-25d627146711', 'New announcement from @MyDreamIs: We are having Issues with the Spotify API'),
('197a9970-33c7-4990-95d1-144e6017ff1d', 'comment_reply', 0, '2026-04-29 17:54:43.756', '8a805cf5-4af1-42f7-bcd7-371a386d8b28', '29be55aa-037f-493f-b81d-08aa8746bb48', '/discussion/view/7c473a7f-cccd-42ed-83bc-e2571c934d75', '@JaniKis replied to your comment.'),
('1d44ce48-8c3c-4f50-904f-a2f45abf4986', 'post_comment', 0, '2026-04-29 17:53:10.805', '29be55aa-037f-493f-b81d-08aa8746bb48', '8a805cf5-4af1-42f7-bcd7-371a386d8b28', '/discussion/view/7c473a7f-cccd-42ed-83bc-e2571c934d75', '@VersenyLov1831 commented on your post: \"Ado\".'),
('82976ce0-109a-4be4-93d8-b3fb49323d90', 'post_like', 0, '2026-04-29 17:52:13.715', '29be55aa-037f-493f-b81d-08aa8746bb48', '8a805cf5-4af1-42f7-bcd7-371a386d8b28', '/discussion/view/7c473a7f-cccd-42ed-83bc-e2571c934d75', '@VersenyLov1831 liked your post.'),
('a1499a3f-8676-4d29-8df9-7584a2926947', 'post_comment', 0, '2026-04-29 17:46:10.839', '5c19a535-d757-4c7d-b391-cb69a618854e', '29be55aa-037f-493f-b81d-08aa8746bb48', '/discussion/view/72cefce3-5377-4167-b189-25d627146711', '@JaniKis commented on your post: \"We are having Issues with the Spotify API\".'),
('e62dbae9-8b87-43a7-8222-a4b0739ed797', 'comment_like', 0, '2026-04-29 17:54:29.008', '8a805cf5-4af1-42f7-bcd7-371a386d8b28', '29be55aa-037f-493f-b81d-08aa8746bb48', '/discussion/view/7c473a7f-cccd-42ed-83bc-e2571c934d75', '@JaniKis liked your comment.');

-- --------------------------------------------------------

--
-- Tábla szerkezet ehhez a táblához `passwordresettoken`
--

CREATE TABLE `passwordresettoken` (
  `id` varchar(191) NOT NULL,
  `tokenHash` varchar(191) NOT NULL,
  `expiresAt` datetime(3) NOT NULL,
  `usedAt` datetime(3) DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `userId` varchar(191) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Tábla szerkezet ehhez a táblához `post`
--

CREATE TABLE `post` (
  `id` varchar(191) NOT NULL,
  `text` longtext NOT NULL,
  `likeAmount` int(11) NOT NULL DEFAULT 0,
  `hashtags` varchar(191) DEFAULT NULL,
  `postedAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `userId` varchar(191) NOT NULL,
  `title` varchar(191) NOT NULL,
  `topic` varchar(191) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- A tábla adatainak kiíratása `post`
--

INSERT INTO `post` (`id`, `text`, `likeAmount`, `hashtags`, `postedAt`, `userId`, `title`, `topic`) VALUES
('72cefce3-5377-4167-b189-25d627146711', 'This means the Spotify related Functions maybe slow or there is the possibility of not working as well.\nWe will try to fix this Issues as soon as we Can!', 0, NULL, '2026-04-29 17:38:09.287', '5c19a535-d757-4c7d-b391-cb69a618854e', 'We are having Issues with the Spotify API', 'Announcement'),
('7c473a7f-cccd-42ed-83bc-e2571c934d75', 'I just found this New Artist called Ado, and I had to realize how good her music is. I would recommand for everyon to listen to at least one of her tracks!', 1, '#Ado #found #try', '2026-04-29 17:45:41.116', '29be55aa-037f-493f-b81d-08aa8746bb48', 'Ado', 'New Artist I found');

-- --------------------------------------------------------

--
-- Tábla szerkezet ehhez a táblához `postlike`
--

CREATE TABLE `postlike` (
  `id` varchar(191) NOT NULL,
  `userId` varchar(191) NOT NULL,
  `postId` varchar(191) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- A tábla adatainak kiíratása `postlike`
--

INSERT INTO `postlike` (`id`, `userId`, `postId`) VALUES
('84b756ec-d808-42f9-a0f3-3056c7d89d95', '8a805cf5-4af1-42f7-bcd7-371a386d8b28', '7c473a7f-cccd-42ed-83bc-e2571c934d75');

-- --------------------------------------------------------

--
-- Tábla szerkezet ehhez a táblához `revokedtoken`
--

CREATE TABLE `revokedtoken` (
  `id` varchar(191) NOT NULL,
  `tokenHash` varchar(191) NOT NULL,
  `expiresAt` datetime(3) NOT NULL,
  `revokedAt` datetime(3) NOT NULL DEFAULT current_timestamp(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- A tábla adatainak kiíratása `revokedtoken`
--

INSERT INTO `revokedtoken` (`id`, `tokenHash`, `expiresAt`, `revokedAt`) VALUES
('2d24f40d-e361-44e4-af97-554f69499209', 'a0cd37cb78a4cd1c5e7903a744478aa7715ac8b8f68b5ca110bbba7667de65c0', '2026-05-13 17:53:34.000', '2026-04-29 17:54:20.094'),
('6f51465f-0973-495f-8faf-0012ca339320', 'eb0d2303ccae7823671da66fe2db11717515807da201358aad7c3fb5fce6dc76', '2026-05-13 17:42:22.000', '2026-04-29 17:42:24.030'),
('89365c13-4d8c-4d01-a984-3c2f636427b3', 'a0fa3f877a7ad6420e116dfea5549776c6f6f72ce92d5953060608bbbba72992', '2026-05-13 17:44:12.000', '2026-04-29 17:46:21.169'),
('c12427c0-8067-4a5d-bd9a-a68886ecd4e7', '9fabe6b35f612124294b16eb4ded7ef46b2e86e602d9ec3de83800354f247060', '2026-05-13 17:34:34.000', '2026-04-29 17:35:12.216'),
('c83771b8-d959-4a85-940a-fbafea59cb81', '92bb338e9ce10d52b026367bfbec7b4d58314b94a10434b28d61ba4764c56a51', '2026-05-13 17:35:13.000', '2026-04-29 17:39:56.717'),
('cb0c9eb8-83cf-42f6-b3cf-119b19fc0860', 'd2de9e8a8747e65e7fa40d7167e626756e72a282178ab617538d877c1519d29b', '2026-05-13 17:54:23.000', '2026-04-29 17:55:08.576'),
('dafd8bf3-a405-4a72-80f4-2fbc745536f8', '743e6ddc995c43364e825bb2b0c5b3359d6164933be831bcaea1c54e3b730503', '2026-05-13 17:52:10.000', '2026-04-29 17:53:32.854'),
('de8430af-b041-4268-8114-3ad35bf1f41e', '1d07326ca9b8e8e98773646e616250302e9e2de1ce46fe62899ed99f8c11f4d7', '2026-05-13 17:40:19.000', '2026-04-29 17:41:18.814');

-- --------------------------------------------------------

--
-- Tábla szerkezet ehhez a táblához `user`
--

CREATE TABLE `user` (
  `id` varchar(191) NOT NULL,
  `email` varchar(191) NOT NULL,
  `username` varchar(191) NOT NULL,
  `passwordHash` varchar(191) NOT NULL,
  `role` enum('USER','MODERATOR','ADMIN') NOT NULL DEFAULT 'USER',
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL,
  `authTokenVersion` int(11) NOT NULL DEFAULT 0,
  `description` text DEFAULT NULL,
  `isBlocked` tinyint(1) NOT NULL DEFAULT 0,
  `isPrivate` tinyint(1) NOT NULL DEFAULT 0,
  `spotifyTimeRange` enum('SHORT','MEDIUM','LONG') NOT NULL DEFAULT 'SHORT'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- A tábla adatainak kiíratása `user`
--

INSERT INTO `user` (`id`, `email`, `username`, `passwordHash`, `role`, `createdAt`, `updatedAt`, `authTokenVersion`, `description`, `isBlocked`, `isPrivate`, `spotifyTimeRange`) VALUES
('29be55aa-037f-493f-b81d-08aa8746bb48', 'kisJanos1999@gmail.com', 'JaniKis', '$2b$12$EJI2RnwvIKmU5CfN93saqu81MJJdMeFmn5l1w6RU318qWO0WRGbAu', 'USER', '2026-04-29 17:44:12.635', '2026-04-29 17:44:12.635', 0, NULL, 0, 0, 'SHORT'),
('5c19a535-d757-4c7d-b391-cb69a618854e', 'fdrobi007@gmail.com', 'MyDreamIs', '$2b$12$wEYLwoRg9t8k7SVJruJ7Iu2U3AiqHNv3zAXmHO/IQXqwDMdPkISTK', 'ADMIN', '2026-04-29 17:34:34.161', '2026-04-29 17:34:34.161', 0, NULL, 0, 0, 'SHORT'),
('8a805cf5-4af1-42f7-bcd7-371a386d8b28', 'adamVersenyLovas@gmail.com', 'VersenyLov1831', '$2b$12$XrOeKZA70wHrbVBpismYuOjVPFkDxcYywqaQGvOPeqYPKlrZHoUJ.', 'USER', '2026-04-29 17:52:10.028', '2026-04-29 17:52:10.028', 0, NULL, 0, 0, 'SHORT'),
('fe9c5759-cc41-4c9c-b754-08763fa56ce4', 'admin@admin.admin', 'admin1', '$2b$12$FJszO7xUNbYUSrnlDlLD1OzB1T/moAdVXOWXfArBfuS.sU2WUXgRW', 'ADMIN', '2026-04-29 17:55:33.035', '2026-04-29 17:55:33.035', 0, NULL, 0, 0, 'SHORT');

-- --------------------------------------------------------

--
-- Tábla szerkezet ehhez a táblához `_prisma_migrations`
--

CREATE TABLE `_prisma_migrations` (
  `id` varchar(36) NOT NULL,
  `checksum` varchar(64) NOT NULL,
  `finished_at` datetime(3) DEFAULT NULL,
  `migration_name` varchar(255) NOT NULL,
  `logs` text DEFAULT NULL,
  `rolled_back_at` datetime(3) DEFAULT NULL,
  `started_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `applied_steps_count` int(10) UNSIGNED NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- A tábla adatainak kiíratása `_prisma_migrations`
--

INSERT INTO `_prisma_migrations` (`id`, `checksum`, `finished_at`, `migration_name`, `logs`, `rolled_back_at`, `started_at`, `applied_steps_count`) VALUES
('387e8f44-5cd8-4287-a54d-273e32aa6c23', 'ab25bc9fcb3dc9430e03a8c6c05ddb42ef0b212db118dbfe0736f7c907a7583e', '2026-04-29 17:27:04.843', '20260427182540', NULL, NULL, '2026-04-29 17:27:04.409', 1),
('7d881d0a-0375-4a8b-bbfa-0480e16b9a90', 'a1016a679451915342609564c01a2e6b32052be3cf091fe295e84cbbbb2b9914', '2026-04-29 17:27:04.370', '20260422123000_admin_ip_bans_and_announcements', NULL, NULL, '2026-04-29 17:27:04.328', 1),
('86996dc0-cd13-4132-a730-b48aee5c3fc9', '2bb0bd3b718089b857ab89dd4f5c1441ba4b90744dc6fce6ee1686e973ae908c', '2026-04-29 17:27:04.409', '20260422220000_password_reset_email_flow', NULL, NULL, '2026-04-29 17:27:04.371', 1),
('a8b7e460-276f-4977-9eae-b72d8e071225', 'f99a88923c0c3577d12d32e5f659693bf098e79b5c4acbc912b1d19937350f43', '2026-04-29 17:27:04.852', '20260429103000_remove_ip_ban_features', NULL, NULL, '2026-04-29 17:27:04.844', 1),
('f28be0fc-298e-4e74-94d2-f30aaa8ec846', 'c4d806d013aef55009576a952d8a22b4d6d73c5f27f6baead4a32b871042e498', '2026-04-29 17:27:04.328', '20251212200819_added_admin_alert', NULL, NULL, '2026-04-29 17:27:04.059', 1);

--
-- Indexek a kiírt táblákhoz
--

--
-- A tábla indexei `comment`
--
ALTER TABLE `comment`
  ADD PRIMARY KEY (`id`),
  ADD KEY `Comment_userId_fkey` (`userId`),
  ADD KEY `Comment_postId_fkey` (`postId`),
  ADD KEY `Comment_previousCommentId_fkey` (`previousCommentId`);

--
-- A tábla indexei `commentlike`
--
ALTER TABLE `commentlike`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `CommentLike_userId_commentId_key` (`userId`,`commentId`),
  ADD KEY `CommentLike_commentId_fkey` (`commentId`);

--
-- A tábla indexei `connectedapp`
--
ALTER TABLE `connectedapp`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `ConnectedApp_userId_platform_key` (`userId`,`platform`);

--
-- A tábla indexei `moderationlog`
--
ALTER TABLE `moderationlog`
  ADD PRIMARY KEY (`id`),
  ADD KEY `ModerationLog_postId_fkey` (`postId`),
  ADD KEY `ModerationLog_commentId_fkey` (`commentId`),
  ADD KEY `ModerationLog_moderatorId_fkey` (`moderatorId`),
  ADD KEY `ModerationLog_userId_fkey` (`userId`);

--
-- A tábla indexei `notification`
--
ALTER TABLE `notification`
  ADD PRIMARY KEY (`id`),
  ADD KEY `Notification_triggeredById_fkey` (`triggeredById`),
  ADD KEY `Notification_userId_fkey` (`userId`);

--
-- A tábla indexei `passwordresettoken`
--
ALTER TABLE `passwordresettoken`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `PasswordResetToken_tokenHash_key` (`tokenHash`),
  ADD KEY `PasswordResetToken_userId_fkey` (`userId`);

--
-- A tábla indexei `post`
--
ALTER TABLE `post`
  ADD PRIMARY KEY (`id`),
  ADD KEY `Post_userId_fkey` (`userId`);

--
-- A tábla indexei `postlike`
--
ALTER TABLE `postlike`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `PostLike_userId_postId_key` (`userId`,`postId`),
  ADD KEY `PostLike_postId_fkey` (`postId`);

--
-- A tábla indexei `revokedtoken`
--
ALTER TABLE `revokedtoken`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `RevokedToken_tokenHash_key` (`tokenHash`);

--
-- A tábla indexei `user`
--
ALTER TABLE `user`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `User_email_key` (`email`),
  ADD UNIQUE KEY `User_username_key` (`username`);

--
-- A tábla indexei `_prisma_migrations`
--
ALTER TABLE `_prisma_migrations`
  ADD PRIMARY KEY (`id`);

--
-- Megkötések a kiírt táblákhoz
--

--
-- Megkötések a táblához `comment`
--
ALTER TABLE `comment`
  ADD CONSTRAINT `Comment_postId_fkey` FOREIGN KEY (`postId`) REFERENCES `post` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `Comment_previousCommentId_fkey` FOREIGN KEY (`previousCommentId`) REFERENCES `comment` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `Comment_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Megkötések a táblához `commentlike`
--
ALTER TABLE `commentlike`
  ADD CONSTRAINT `CommentLike_commentId_fkey` FOREIGN KEY (`commentId`) REFERENCES `comment` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `CommentLike_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Megkötések a táblához `connectedapp`
--
ALTER TABLE `connectedapp`
  ADD CONSTRAINT `ConnectedApp_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Megkötések a táblához `moderationlog`
--
ALTER TABLE `moderationlog`
  ADD CONSTRAINT `ModerationLog_commentId_fkey` FOREIGN KEY (`commentId`) REFERENCES `comment` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `ModerationLog_moderatorId_fkey` FOREIGN KEY (`moderatorId`) REFERENCES `user` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `ModerationLog_postId_fkey` FOREIGN KEY (`postId`) REFERENCES `post` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `ModerationLog_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Megkötések a táblához `notification`
--
ALTER TABLE `notification`
  ADD CONSTRAINT `Notification_triggeredById_fkey` FOREIGN KEY (`triggeredById`) REFERENCES `user` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `Notification_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Megkötések a táblához `passwordresettoken`
--
ALTER TABLE `passwordresettoken`
  ADD CONSTRAINT `PasswordResetToken_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Megkötések a táblához `post`
--
ALTER TABLE `post`
  ADD CONSTRAINT `Post_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Megkötések a táblához `postlike`
--
ALTER TABLE `postlike`
  ADD CONSTRAINT `PostLike_postId_fkey` FOREIGN KEY (`postId`) REFERENCES `post` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `PostLike_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
