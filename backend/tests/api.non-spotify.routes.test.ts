import express, { type Express } from "express";
import request from "supertest";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

const setTestEnv = () => {
  const defaults: Record<string, string> = {
    NODE_ENV: "test",
    JWT_SECRET: "test-jwt-secret",
    PASSWORD_PEPPER: "test-password-pepper",
    SPOTIFY_CLIENT_ID: "test-spotify-client-id",
    SPOTIFY_CLIENT_SECRET: "test-spotify-client-secret",
    SPOTIFY_REDIRECT_URI: "http://localhost:6969/auth/spotify/callback",
    DATABASE_URL: "mysql://root:@localhost:3306/beatwave_test",
    FRONTEND_URL: "http://localhost:5173",
    RESET_PASSWORD_TTL_MINUTES: "30",
  };

  Object.entries(defaults).forEach(([key, value]) => {
    if (!process.env[key]) {
      process.env[key] = value;
    }
  });
};

setTestEnv();

const mockState = vi.hoisted(() => {
  const trace: string[] = [];

  const makeHandler = (name: string) =>
    vi.fn((_req: unknown, res: any) => {
      trace.push(name);
      return res.status(200).json({ handler: name });
    });

  const makeMiddleware = (name: string) =>
    vi.fn((_req: unknown, _res: unknown, next: () => void) => {
      trace.push(name);
      next();
    });

  const authController = {
    createUser: makeHandler("createUser"),
    authenticateUser: makeHandler("authenticateUser"),
    requestPasswordReset: makeHandler("requestPasswordReset"),
    validatePasswordResetToken: makeHandler("validatePasswordResetToken"),
    confirmPasswordReset: makeHandler("confirmPasswordReset"),
    getSessionStatus: makeHandler("getSessionStatus"),
    logoutUser: makeHandler("logoutUser"),
  };

  const userProfileController = {
    deleteOwnAccount: makeHandler("deleteOwnAccount"),
    getPublicUserProfile: makeHandler("getPublicUserProfile"),
    getUserProfile: makeHandler("getUserProfile"),
    updateProfilePrivacy: makeHandler("updateProfilePrivacy"),
    updateSpotifyTimeRange: makeHandler("updateSpotifyTimeRange"),
    updateUserProfile: makeHandler("updateUserProfile"),
  };

  const postController = {
    getAnnouncements: makeHandler("getAnnouncements"),
    getPostById: makeHandler("getPostById"),
    getPosts: makeHandler("getPosts"),
    getMyPosts: makeHandler("getMyPosts"),
    createPost: makeHandler("createPost"),
    updateOwnPost: makeHandler("updateOwnPost"),
    deleteOwnPost: makeHandler("deleteOwnPost"),
    likePost: makeHandler("likePost"),
    reportPost: makeHandler("reportPost"),
  };

  const notificationController = {
    deleteNotificationsRead: makeHandler("deleteNotificationsRead"),
    getNotifications: makeHandler("getNotifications"),
    markNotificationsRead: makeHandler("markNotificationsRead"),
  };

  const commentController = {
    createComment: makeHandler("createComment"),
    getCommentsByPostId: makeHandler("getCommentsByPostId"),
    likeComment: makeHandler("likeComment"),
    reportComment: makeHandler("reportComment"),
  };

  const adminController = {
    getAllUsers: makeHandler("getAllUsers"),
    getAllPosts: makeHandler("getAllPosts"),
    getAllComments: makeHandler("getAllComments"),
    getModerationReports: makeHandler("getModerationReports"),
    getModerationLogs: makeHandler("getModerationLogs"),
    setUserTimeout: makeHandler("setUserTimeout"),
    clearUserTimeout: makeHandler("clearUserTimeout"),
    deletePost: makeHandler("deletePost"),
    deleteComment: makeHandler("deleteComment"),
    dismissReport: makeHandler("dismissReport"),
    blockReportedUser: makeHandler("blockReportedUser"),
    updateUserRole: makeHandler("updateUserRole"),
    setUserBlockedStatus: makeHandler("setUserBlockedStatus"),
    setUserIpBan: makeHandler("setUserIpBan"),
    clearUserIpBan: makeHandler("clearUserIpBan"),
    deleteUserByAdmin: makeHandler("deleteUserByAdmin"),
    createAnnouncement: makeHandler("createAnnouncement"),
  };

  const spotifyController = {
    getSpotifyAuthUrl: makeHandler("getSpotifyAuthUrl"),
    spotifyCallback: makeHandler("spotifyCallback"),
    getSpotifyToken: makeHandler("getSpotifyToken"),
    disconnectSpotify: makeHandler("disconnectSpotify"),
    getSpotifyTopItems: makeHandler("getSpotifyTopItems"),
    getSpotifyRecommendations: makeHandler("getSpotifyRecommendations"),
    getSpotifyPlaylists: makeHandler("getSpotifyPlaylists"),
    checkTrackInSpotifyPlaylists: makeHandler("checkTrackInSpotifyPlaylists"),
    addTrackToSpotifyPlaylists: makeHandler("addTrackToSpotifyPlaylists"),
    removeTrackFromSpotifyPlaylist: makeHandler(
      "removeTrackFromSpotifyPlaylist",
    ),
    getSpotifyCurrentlyPlaying: makeHandler("getSpotifyCurrentlyPlaying"),
    getSpotifyRecentlyPlayed: makeHandler("getSpotifyRecentlyPlayed"),
    skipSpotifyPrevious: makeHandler("skipSpotifyPrevious"),
    playSpotifyTrack: makeHandler("playSpotifyTrack"),
    pauseSpotifyTrack: makeHandler("pauseSpotifyTrack"),
    skipSpotifyNext: makeHandler("skipSpotifyNext"),
    searchSpotify: makeHandler("searchSpotify"),
    getSpotifyArtist: makeHandler("getSpotifyArtist"),
  };

  const middlewares = {
    verifyToken: makeMiddleware("verifyToken"),
    isAdmin: makeMiddleware("isAdmin"),
    isAdminOrModerator: makeMiddleware("isAdminOrModerator"),
  };

  return {
    trace,
    authController,
    userProfileController,
    postController,
    notificationController,
    commentController,
    adminController,
    spotifyController,
    middlewares,
  };
});

vi.mock("../src/controllers/authController", () => mockState.authController);
vi.mock("../src/controllers/userProfile", () => mockState.userProfileController);
vi.mock("../src/controllers/postController", () => mockState.postController);
vi.mock("../src/controllers/notificationController", () => mockState.notificationController);
vi.mock("../src/controllers/commentController", () => mockState.commentController);
vi.mock("../src/controllers/adminController", () => mockState.adminController);
vi.mock("../src/controllers/spotify", () => mockState.spotifyController);
vi.mock("../src/middlewares/authMiddleware", () => mockState.middlewares);

type HttpMethod = "get" | "post" | "put" | "patch" | "delete";

type RouteCase = {
  method: HttpMethod;
  path: string;
  expectedTrace: string[];
  query?: Record<string, string>;
  body?: Record<string, unknown>;
};

describe("Non-Spotify route coverage", () => {
  let app: Express;

  beforeAll(async () => {
    const appRoutes = (await import("../src/routes/appRoutes")).default;
    app = express();
    app.use(express.json());
    app.use(appRoutes);
  });

  beforeEach(() => {
    mockState.trace.length = 0;
    vi.clearAllMocks();
  });

  const routeCases: RouteCase[] = [
    { method: "post", path: "/register", expectedTrace: ["createUser"], body: {} },
    { method: "post", path: "/login", expectedTrace: ["authenticateUser"], body: {} },
    { method: "post", path: "/auth/password-reset/request", expectedTrace: ["requestPasswordReset"], body: {} },
    { method: "get", path: "/auth/password-reset/validate", expectedTrace: ["validatePasswordResetToken"], query: { token: "token-1" } },
    { method: "post", path: "/auth/password-reset/confirm", expectedTrace: ["confirmPasswordReset"], body: {} },
    { method: "get", path: "/auth/session", expectedTrace: ["getSessionStatus"] },
    { method: "post", path: "/logout", expectedTrace: ["logoutUser"] },

    { method: "get", path: "/user-profile", expectedTrace: ["verifyToken", "getUserProfile"] },
    { method: "put", path: "/user-profile", expectedTrace: ["verifyToken", "updateUserProfile"], body: {} },
    { method: "delete", path: "/user-profile", expectedTrace: ["verifyToken", "deleteOwnAccount"] },
    { method: "patch", path: "/user-profile/privacy", expectedTrace: ["verifyToken", "updateProfilePrivacy"], body: {} },
    { method: "get", path: "/user-profile/posts", expectedTrace: ["verifyToken", "getMyPosts"] },
    { method: "get", path: "/user-profile/public-user-1", expectedTrace: ["verifyToken", "getPublicUserProfile"] },
    { method: "patch", path: "/user-profile/spotify-time-range", expectedTrace: ["verifyToken", "updateSpotifyTimeRange"], body: {} },

    { method: "get", path: "/announcements", expectedTrace: ["verifyToken", "getAnnouncements"] },
    { method: "get", path: "/posts", expectedTrace: ["verifyToken", "getPosts"] },
    { method: "get", path: "/post/post-1", expectedTrace: ["verifyToken", "getPostById"] },
    { method: "post", path: "/posts", expectedTrace: ["verifyToken", "createPost"], body: {} },
    { method: "put", path: "/post/post-1", expectedTrace: ["verifyToken", "updateOwnPost"], body: {} },
    { method: "delete", path: "/post/post-1", expectedTrace: ["verifyToken", "deleteOwnPost"] },
    { method: "post", path: "/post/post-1/like", expectedTrace: ["verifyToken", "likePost"], body: {} },
    { method: "post", path: "/post/post-1/report", expectedTrace: ["verifyToken", "reportPost"], body: {} },

    { method: "get", path: "/post/post-1/comments", expectedTrace: ["verifyToken", "getCommentsByPostId"] },
    { method: "post", path: "/post/post-1/comments", expectedTrace: ["verifyToken", "createComment"], body: {} },
    { method: "post", path: "/comment/comment-1/like", expectedTrace: ["verifyToken", "likeComment"], body: {} },
    { method: "post", path: "/comment/comment-1/report", expectedTrace: ["verifyToken", "reportComment"], body: {} },

    { method: "get", path: "/notifications", expectedTrace: ["verifyToken", "getNotifications"] },
    { method: "patch", path: "/notifications/read", expectedTrace: ["verifyToken", "markNotificationsRead"], body: {} },
    { method: "delete", path: "/notifications/read", expectedTrace: ["verifyToken", "deleteNotificationsRead"] },

    { method: "get", path: "/admin/users", expectedTrace: ["verifyToken", "isAdminOrModerator", "getAllUsers"] },
    { method: "patch", path: "/admin/users/user-1/role", expectedTrace: ["verifyToken", "isAdmin", "updateUserRole"], body: {} },
    { method: "patch", path: "/admin/users/user-1/block", expectedTrace: ["verifyToken", "isAdmin", "setUserBlockedStatus"], body: {} },
    { method: "patch", path: "/admin/users/user-1/timeout", expectedTrace: ["verifyToken", "isAdminOrModerator", "setUserTimeout"], body: {} },
    { method: "delete", path: "/admin/users/user-1/timeout", expectedTrace: ["verifyToken", "isAdminOrModerator", "clearUserTimeout"] },
    { method: "patch", path: "/admin/users/user-1/ip-ban", expectedTrace: ["verifyToken", "isAdmin", "setUserIpBan"], body: {} },
    { method: "delete", path: "/admin/users/user-1/ip-ban", expectedTrace: ["verifyToken", "isAdmin", "clearUserIpBan"] },
    { method: "delete", path: "/admin/users/user-1", expectedTrace: ["verifyToken", "isAdmin", "deleteUserByAdmin"] },
    { method: "post", path: "/admin/announcements", expectedTrace: ["verifyToken", "isAdmin", "createAnnouncement"], body: {} },
    { method: "get", path: "/admin/posts", expectedTrace: ["verifyToken", "isAdminOrModerator", "getAllPosts"] },
    { method: "get", path: "/admin/comments", expectedTrace: ["verifyToken", "isAdminOrModerator", "getAllComments"] },
    { method: "get", path: "/admin/reports", expectedTrace: ["verifyToken", "isAdminOrModerator", "getModerationReports"] },
    { method: "get", path: "/admin/logs", expectedTrace: ["verifyToken", "isAdminOrModerator", "getModerationLogs"] },
    { method: "patch", path: "/admin/reports/report-1/dismiss", expectedTrace: ["verifyToken", "isAdminOrModerator", "dismissReport"], body: {} },
    { method: "patch", path: "/admin/reports/report-1/block-user", expectedTrace: ["verifyToken", "isAdminOrModerator", "blockReportedUser"], body: {} },
    { method: "delete", path: "/admin/posts/post-1", expectedTrace: ["verifyToken", "isAdminOrModerator", "deletePost"] },
    { method: "delete", path: "/admin/comments/comment-1", expectedTrace: ["verifyToken", "isAdminOrModerator", "deleteComment"] },
  ];

  const send = async (routeCase: RouteCase) => {
    const req = request(app)[routeCase.method](routeCase.path);
    if (routeCase.query) {
      req.query(routeCase.query);
    }
    if (routeCase.body) {
      req.send(routeCase.body);
    }
    return req;
  };

  it.each(routeCases)(
    "$method $path uses expected middleware and handler chain",
    async (routeCase) => {
      const res = await send(routeCase);
      expect(res.status).toBe(200);
      expect(mockState.trace).toEqual(routeCase.expectedTrace);
      expect(res.body.handler).toBe(
        routeCase.expectedTrace[routeCase.expectedTrace.length - 1],
      );
    },
  );
});
