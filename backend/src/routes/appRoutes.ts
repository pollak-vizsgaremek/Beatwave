import { Router } from "express";

import { createUser, authenticateUser } from "../controllers/authController";
import {
  getPublicUserProfile,
  getUserProfile,
  updateProfilePrivacy,
  updateUserProfile,
} from "../controllers/userProfile";
import {
  getSpotifyAuthUrl,
  spotifyCallback,
  getSpotifyToken,
  disconnectSpotify,
  getSpotifyTopItems,
  getSpotifyRecommendations,
  getSpotifyPlaylists,
  addTrackToSpotifyPlaylists,
  getSpotifyCurrentlyPlaying,
  getSpotifyRecentlyPlayed,
  skipSpotifyPrevious,
  playSpotifyTrack,
  pauseSpotifyTrack,
  skipSpotifyNext,
  searchSpotify,
} from "../controllers/spotify";

import {
  verifyToken,
  isAdmin,
  isAdminOrModerator,
} from "../middlewares/authMiddleware";
import {
  getPostById,
  getPosts,
  getMyPosts,
  createPost,
  updateOwnPost,
  deleteOwnPost,
  likePost,
  reportPost,
} from "../controllers/postController";
import {
  deleteNotificationsRead,
  getNotifications,
  markNotificationsRead,
} from "../controllers/notificationController";
import {
  createComment,
  getCommentsByPostId,
  likeComment,
  reportComment,
} from "../controllers/commentController";
import {
  getAllUsers,
  getAllPosts,
  getAllComments,
  getModerationLogs,
  deletePost,
  deleteComment,
  dismissReport,
  blockReportedUser,
  updateUserRole,
  setUserBlockedStatus,
} from "../controllers/adminController";

const router = Router();

router.post("/register", createUser);
router.post("/login", authenticateUser);
router.get("/user-profile", verifyToken, getUserProfile);
router.put("/user-profile", verifyToken, updateUserProfile);
router.patch("/user-profile/privacy", verifyToken, updateProfilePrivacy);
router.get("/user-profile/posts", verifyToken, getMyPosts);
router.get("/user-profile/:id", verifyToken, getPublicUserProfile);

router.get("/auth/spotify/url", verifyToken, getSpotifyAuthUrl);
router.get("/auth/spotify/callback", spotifyCallback);
router.get("/auth/spotify/token", verifyToken, getSpotifyToken);
router.delete("/auth/spotify", verifyToken, disconnectSpotify);
router.get("/auth/spotify/top/:type", verifyToken, getSpotifyTopItems);
router.get(
  "/auth/spotify/recommendations",
  verifyToken,
  getSpotifyRecommendations,
);
router.get("/auth/spotify/playlists", verifyToken, getSpotifyPlaylists);
router.post(
  "/auth/spotify/playlists/add-track",
  verifyToken,
  addTrackToSpotifyPlaylists,
);
router.get(
  "/auth/spotify/currently-playing",
  verifyToken,
  getSpotifyCurrentlyPlaying,
);
router.get(
  "/auth/spotify/recently-played/:amount",
  verifyToken,
  getSpotifyRecentlyPlayed,
);
router.post("/auth/spotify/player/previous", verifyToken, skipSpotifyPrevious);
router.put("/auth/spotify/player/play", verifyToken, playSpotifyTrack);
router.put("/auth/spotify/player/pause", verifyToken, pauseSpotifyTrack);
router.post("/auth/spotify/player/next", verifyToken, skipSpotifyNext);
router.get("/auth/spotify/search", verifyToken, searchSpotify);

router.get("/posts", verifyToken, getPosts);
router.get("/post/:id", verifyToken, getPostById);
router.post("/posts", verifyToken, createPost);
router.put("/post/:id", verifyToken, updateOwnPost);
router.delete("/post/:id", verifyToken, deleteOwnPost);
router.post("/post/:id/like", verifyToken, likePost);
router.post("/post/:id/report", verifyToken, reportPost);

router.get("/post/:id/comments", verifyToken, getCommentsByPostId);
router.post("/post/:id/comments", verifyToken, createComment);
router.post("/comment/:id/like", verifyToken, likeComment);
router.post("/comment/:id/report", verifyToken, reportComment);

router.get("/notifications", verifyToken, getNotifications);
router.patch("/notifications/read", verifyToken, markNotificationsRead);
router.delete("/notifications/read", verifyToken, deleteNotificationsRead);

// Admin + moderation routes
router.get("/admin/users", verifyToken, isAdminOrModerator, getAllUsers);
router.patch("/admin/users/:id/role", verifyToken, isAdmin, updateUserRole);
router.patch(
  "/admin/users/:id/block",
  verifyToken,
  isAdmin,
  setUserBlockedStatus,
);
router.get("/admin/posts", verifyToken, isAdminOrModerator, getAllPosts);
router.get("/admin/comments", verifyToken, isAdminOrModerator, getAllComments);
router.get("/admin/logs", verifyToken, isAdminOrModerator, getModerationLogs);
router.patch(
  "/admin/reports/:id/dismiss",
  verifyToken,
  isAdminOrModerator,
  dismissReport,
);
router.patch(
  "/admin/reports/:id/block-user",
  verifyToken,
  isAdminOrModerator,
  blockReportedUser,
);
router.delete("/admin/posts/:id", verifyToken, isAdminOrModerator, deletePost);
router.delete(
  "/admin/comments/:id",
  verifyToken,
  isAdminOrModerator,
  deleteComment,
);

export default router;
