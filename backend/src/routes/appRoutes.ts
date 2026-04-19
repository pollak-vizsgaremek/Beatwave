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

import { verifyToken, isAdmin } from "../middlewares/authMiddleware";
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
} from "../controllers/commentController";
import {
  getAllUsers,
  getAllPosts,
  getAllComments,
  getModerationLogs,
  deletePost,
  deleteComment,
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

router.get("/notifications", verifyToken, getNotifications);
router.patch("/notifications/read", verifyToken, markNotificationsRead);
router.delete("/notifications/read", verifyToken, deleteNotificationsRead);

// Admin routes
router.get("/admin/users", verifyToken, isAdmin, getAllUsers);
router.get("/admin/posts", verifyToken, isAdmin, getAllPosts);
router.get("/admin/comments", verifyToken, isAdmin, getAllComments);
router.get("/admin/logs", verifyToken, isAdmin, getModerationLogs);
router.delete("/admin/posts/:id", verifyToken, isAdmin, deletePost);
router.delete("/admin/comments/:id", verifyToken, isAdmin, deleteComment);

export default router;
