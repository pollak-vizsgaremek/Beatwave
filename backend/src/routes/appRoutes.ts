import { Router } from "express";

import {
  createUser,
  authenticateUser,
  requestPasswordReset,
  validatePasswordResetToken,
  confirmPasswordReset,
  getSessionStatus,
  logoutUser,
} from "../controllers/authController";
import {
  deleteOwnAccount,
  getPublicUserProfile,
  getUserProfile,
  updateProfilePrivacy,
  updateSpotifyTimeRange,
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
  checkTrackInSpotifyPlaylists,
  addTrackToSpotifyPlaylists,
  removeTrackFromSpotifyPlaylist,
  getSpotifyCurrentlyPlaying,
  getSpotifyRecentlyPlayed,
  skipSpotifyPrevious,
  playSpotifyTrack,
  pauseSpotifyTrack,
  skipSpotifyNext,
  searchSpotify,
  getSpotifyArtist,
} from "../controllers/spotify";

import {
  verifyToken,
  isAdmin,
  isAdminOrModerator,
} from "../middlewares/authMiddleware";
import {
  getAnnouncements,
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
  getModerationReports,
  getModerationLogs,
  setUserTimeout,
  clearUserTimeout,
  deletePost,
  deleteComment,
  dismissReport,
  blockReportedUser,
  updateUserRole,
  setUserBlockedStatus,
  deleteUserByAdmin,
} from "../controllers/adminController";

const router = Router();

//Auth
router.post("/register", createUser);
router.post("/login", authenticateUser);
router.post("/auth/password-reset/request", requestPasswordReset);
router.get("/auth/password-reset/validate", validatePasswordResetToken);
router.post("/auth/password-reset/confirm", confirmPasswordReset);
router.get("/auth/session", getSessionStatus);
router.post("/logout", logoutUser);

//User Profile
router.get("/user-profile", verifyToken, getUserProfile);
router.put("/user-profile", verifyToken, updateUserProfile);
router.delete("/user-profile", verifyToken, deleteOwnAccount);
router.patch("/user-profile/privacy", verifyToken, updateProfilePrivacy);
router.get("/user-profile/posts", verifyToken, getMyPosts);
router.get("/user-profile/:id", verifyToken, getPublicUserProfile);
router.patch(
  "/user-profile/spotify-time-range",
  verifyToken,
  updateSpotifyTimeRange,
);

//Spotify
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
  "/auth/spotify/playlists/check-track",
  verifyToken,
  checkTrackInSpotifyPlaylists,
);
router.post(
  "/auth/spotify/playlists/add-track",
  verifyToken,
  addTrackToSpotifyPlaylists,
);
router.delete(
  "/auth/spotify/playlists/remove-track",
  verifyToken,
  removeTrackFromSpotifyPlaylist,
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
router.get("/auth/spotify/artist/:id", verifyToken, getSpotifyArtist);

//Discussion
router.get("/announcements", verifyToken, getAnnouncements);
router.get("/posts", verifyToken, getPosts);
router.get("/post/:id", verifyToken, getPostById);
router.post("/posts", verifyToken, createPost);
router.put("/post/:id", verifyToken, updateOwnPost);
router.delete("/post/:id", verifyToken, deleteOwnPost);
router.post("/post/:id/like", verifyToken, likePost);
router.post("/post/:id/report", verifyToken, reportPost);

//Comments
router.get("/post/:id/comments", verifyToken, getCommentsByPostId);
router.post("/post/:id/comments", verifyToken, createComment);
router.post("/comment/:id/like", verifyToken, likeComment);
router.post("/comment/:id/report", verifyToken, reportComment);

//Notifications
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
router.patch(
  "/admin/users/:id/timeout",
  verifyToken,
  isAdminOrModerator,
  setUserTimeout,
);
router.delete(
  "/admin/users/:id/timeout",
  verifyToken,
  isAdminOrModerator,
  clearUserTimeout,
);
router.delete("/admin/users/:id", verifyToken, isAdmin, deleteUserByAdmin);
router.get("/admin/posts", verifyToken, isAdminOrModerator, getAllPosts);
router.get("/admin/comments", verifyToken, isAdminOrModerator, getAllComments);
router.get(
  "/admin/reports",
  verifyToken,
  isAdminOrModerator,
  getModerationReports,
);
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
