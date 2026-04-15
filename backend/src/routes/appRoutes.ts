import { Router } from "express";

import { createUser, authenticateUser } from "../controllers/authController";
import { getUserProfile, updateUserProfile } from "../controllers/userProfile";
import {
  getSpotifyAuthUrl,
  spotifyCallback,
  getSpotifyToken,
  disconnectSpotify,
  getSpotifyTopItems,
  getSpotifyCurrentlyPlaying,
  getSpotifyRecentlyPlayed,
  searchSpotify,
} from "../controllers/spotifyController";

import { verifyToken } from "../middlewares/authMiddleware";
import {
  getPostById,
  getPosts,
  createPost,
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

const router = Router();

router.post("/register", createUser);
router.post("/login", authenticateUser);
router.get("/user-profile", verifyToken, getUserProfile);
router.put("/user-profile", verifyToken, updateUserProfile);

router.get("/auth/spotify/url", verifyToken, getSpotifyAuthUrl);
router.get("/auth/spotify/callback", spotifyCallback);
router.get("/auth/spotify/token", verifyToken, getSpotifyToken);
router.delete("/auth/spotify", verifyToken, disconnectSpotify);
router.get("/auth/spotify/top/:type", verifyToken, getSpotifyTopItems);
router.get(
  "/auth/spotify/currently-playing",
  verifyToken,
  getSpotifyCurrentlyPlaying
);
router.get(
  "/auth/spotify/recently-played/:amount",
  verifyToken,
  getSpotifyRecentlyPlayed
);
router.get("/auth/spotify/search", verifyToken, searchSpotify);

router.get("/posts", verifyToken, getPosts);
router.get("/post/:id", verifyToken, getPostById);
router.post("/posts", verifyToken, createPost);

router.get("/post/:id/comments", verifyToken, getCommentsByPostId);
router.post("/post/:id/comments", verifyToken, createComment);
router.post("/comment/:id/like", verifyToken, likeComment);

router.get("/notifications", verifyToken, getNotifications);
router.patch("/notifications/read", verifyToken, markNotificationsRead);
router.delete("/notifications/read", verifyToken, deleteNotificationsRead);

export default router;
