import bcrypt from "bcrypt";
import type { Express } from "express";
import jwt from "jsonwebtoken";
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

const prismaMock: any = {
  user: {
    findFirst: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  post: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
  },
  comment: {
    findFirst: vi.fn(),
    create: vi.fn(),
  },
  notification: {
    create: vi.fn(),
  },
  ipBan: {
    findFirst: vi.fn(),
  },
  moderationLog: {
    findFirst: vi.fn(),
  },
  revokedToken: {
    deleteMany: vi.fn(),
    findUnique: vi.fn(),
    upsert: vi.fn(),
  },
  passwordResetToken: {
    create: vi.fn(),
    findUnique: vi.fn(),
    deleteMany: vi.fn(),
    updateMany: vi.fn(),
  },
  $transaction: vi.fn(),
};

const makeAuthCookie = (
  userId: string,
  role: "USER" | "MODERATOR" | "ADMIN" = "USER",
  tokenVersion = 0,
) => {
  const token = jwt.sign(
    { id: userId, username: "test-user", role, tokenVersion },
    process.env.JWT_SECRET as string,
    { expiresIn: "1h" },
  );

  return `beatwave_token=${token}`;
};

const getSetCookieHeader = (headers: Record<string, unknown>) => {
  const raw = headers["set-cookie"];
  if (!raw) {
    return [];
  }

  return Array.isArray(raw) ? raw : [String(raw)];
};

const allowAuthenticatedUser = (
  userId: string,
  role: "USER" | "MODERATOR" | "ADMIN" = "USER",
  tokenVersion = 0,
) => {
  prismaMock.user.findUnique.mockResolvedValueOnce({
    id: userId,
    role,
    authTokenVersion: tokenVersion,
  });
};

const allowUserToContribute = (userId: string) => {
  allowAuthenticatedUser(userId);
  prismaMock.user.findUnique.mockResolvedValueOnce({
    id: userId,
    isBlocked: false,
  });
  prismaMock.moderationLog.findFirst.mockResolvedValueOnce(null);
};

const seedCommonDefaults = () => {
  prismaMock.revokedToken.deleteMany.mockResolvedValue({ count: 0 });
  prismaMock.revokedToken.findUnique.mockResolvedValue(null);
  prismaMock.revokedToken.upsert.mockResolvedValue({
    id: "revoked-1",
    tokenHash: "hash",
    expiresAt: new Date(Date.now() + 60 * 60 * 1000),
    revokedAt: new Date(),
  });
  prismaMock.ipBan.findFirst.mockResolvedValue(null);
  prismaMock.user.update.mockResolvedValue({ id: "user-1" });
  prismaMock.user.delete.mockResolvedValue({ id: "user-1" });
  prismaMock.notification.create.mockResolvedValue({ id: "notification-1" });
  prismaMock.passwordResetToken.deleteMany.mockResolvedValue({ count: 0 });
  prismaMock.passwordResetToken.create.mockResolvedValue({
    id: "reset-token-1",
  });
  prismaMock.passwordResetToken.findUnique.mockResolvedValue(null);
  prismaMock.passwordResetToken.updateMany.mockResolvedValue({ count: 1 });
  prismaMock.user.update.mockResolvedValue({ id: "user-1" });
  prismaMock.$transaction.mockImplementation(async (callback: any) =>
    callback(prismaMock),
  );
};

describe("Non-Spotify backend endpoints", () => {
  let app: Express;

  beforeAll(async () => {
    vi.doMock("../src/lib/prisma", () => ({
      prisma: prismaMock,
    }));
    vi.doMock("../src/email/service", () => ({
      sendTemplatedEmail: vi.fn().mockResolvedValue(undefined),
    }));

    app = (await import("../src/app")).default;
  });

  beforeEach(() => {
    vi.clearAllMocks();
    seedCommonDefaults();
  });

  it("POST /register creates a user", async () => {
    prismaMock.user.findFirst.mockResolvedValueOnce(null);
    prismaMock.user.create.mockResolvedValueOnce({
      id: "user-1",
      username: "alice",
      email: "alice@example.com",
      passwordHash: "hashed-password",
      role: "USER",
      authTokenVersion: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const res = await request(app).post("/register").send({
      username: "alice",
      email: "alice@example.com",
      password: "Password1!",
    });

    expect(res.status).toBe(201);
    expect(res.body.username).toBe("alice");
    expect(res.body.email).toBe("alice@example.com");
    expect(res.body.passwordHash).toBeUndefined();
  });

  it("POST /login authenticates and sets auth cookie", async () => {
    const plainPassword = "Password1!";
    const passwordHash = await bcrypt.hash(
      `${plainPassword}${process.env.PASSWORD_PEPPER}`,
      12,
    );

    prismaMock.user.findFirst.mockResolvedValueOnce({
      id: "user-1",
      username: "alice",
      email: "alice@example.com",
      role: "USER",
      authTokenVersion: 0,
      passwordHash,
    });

    const res = await request(app).post("/login").send({
      login: "alice@example.com",
      password: plainPassword,
    });

    const setCookie = getSetCookieHeader(
      res.headers as Record<string, unknown>,
    );

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("Login successful");
    expect(
      setCookie?.some((cookie) => cookie.startsWith("beatwave_token=")),
    ).toBe(true);
  });

  it("POST /register then POST /login sets auth cookie for the newly created user", async () => {
    const plainPassword = "Password1!";
    const passwordHash = await bcrypt.hash(
      `${plainPassword}${process.env.PASSWORD_PEPPER}`,
      12,
    );

    prismaMock.user.findFirst
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({
        id: "user-2",
        username: "new-user",
        email: "new-user@example.com",
        role: "USER",
        authTokenVersion: 0,
        passwordHash,
      });

    prismaMock.user.create.mockResolvedValueOnce({
      id: "user-2",
      username: "new-user",
      email: "new-user@example.com",
      passwordHash: "hashed-password",
      role: "USER",
      authTokenVersion: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const registerRes = await request(app).post("/register").send({
      username: "new-user",
      email: "new-user@example.com",
      password: plainPassword,
    });

    const loginRes = await request(app).post("/login").send({
      login: "new-user@example.com",
      password: plainPassword,
    });

    const setCookie = getSetCookieHeader(
      loginRes.headers as Record<string, unknown>,
    );

    expect(registerRes.status).toBe(201);
    expect(loginRes.status).toBe(200);
    expect(
      setCookie?.some((cookie) => cookie.startsWith("beatwave_token=")),
    ).toBe(true);
  });

  it("POST /logout revokes token and clears cookie", async () => {
    const res = await request(app)
      .post("/logout")
      .set("Cookie", makeAuthCookie("user-1"));

    const setCookie = getSetCookieHeader(
      res.headers as Record<string, unknown>,
    );

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("Logout successful");
    expect(prismaMock.revokedToken.upsert).toHaveBeenCalledTimes(1);
    expect(
      setCookie?.some((cookie) => cookie.includes("beatwave_token=;")),
    ).toBe(true);
  });

  it("DELETE /user-profile deletes account and clears cookie", async () => {
    allowAuthenticatedUser("user-1");
    prismaMock.user.findUnique.mockResolvedValueOnce({
      id: "user-1",
      username: "alice",
      email: "alice@example.com",
    });

    const res = await request(app)
      .delete("/user-profile")
      .set("Cookie", makeAuthCookie("user-1"));

    const setCookie = getSetCookieHeader(
      res.headers as Record<string, unknown>,
    );

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("Account deleted successfully");
    expect(prismaMock.user.delete).toHaveBeenCalledWith({
      where: { id: "user-1" },
    });
    expect(
      setCookie?.some((cookie) => cookie.includes("beatwave_token=;")),
    ).toBe(true);
  });

  it("returns friendly Prisma errors instead of leaking raw database details", async () => {
    allowAuthenticatedUser("user-1");
    prismaMock.post.findMany.mockRejectedValueOnce({
      name: "PrismaClientKnownRequestError",
      code: "P2002",
      message:
        "PrismaClientKnownRequestError: Unique constraint failed on the fields: (`title`)",
      meta: {
        target: ["title"],
      },
    });

    const res = await request(app)
      .get("/posts")
      .set("Cookie", makeAuthCookie("user-1"));

    expect(res.status).toBe(409);
    expect(res.body.error).toBe("A record with the same title already exists.");
    expect(res.body.error).not.toMatch(/prisma|p2002/i);
  });

  it("returns a safe generic message for unexpected internal errors", async () => {
    allowAuthenticatedUser("user-1");
    prismaMock.post.findMany.mockRejectedValueOnce(
      new Error(
        "PrismaClientKnownRequestError: Database query failed with internal stack details",
      ),
    );

    const res = await request(app)
      .get("/posts")
      .set("Cookie", makeAuthCookie("user-1"));

    expect(res.status).toBe(500);
    expect(res.body.error).toBe(
      "Something went wrong. Please try again later.",
    );
    expect(res.body.error).not.toMatch(/prisma|database|stack/i);
  });

  it("GET /user-profile returns profile data for authenticated user", async () => {
    allowAuthenticatedUser("user-1");
    prismaMock.user.findUnique.mockResolvedValueOnce({
      id: "user-1",
      username: "alice",
      email: "alice@example.com",
      description: "About Alice",
      isPrivate: false,
      role: "USER",
      spotifyTimeRange: "MEDIUM",
      connectedApps: [],
    });

    const res = await request(app)
      .get("/user-profile")
      .set("Cookie", makeAuthCookie("user-1"));

    expect(res.status).toBe(200);
    expect(res.body).toEqual(
      expect.objectContaining({
        id: "user-1",
        username: "alice",
        spotifyConnected: false,
      }),
    );
  });

  it("GET /posts returns regular discussion posts", async () => {
    allowAuthenticatedUser("user-1");
    prismaMock.post.findMany.mockResolvedValueOnce([
      {
        id: "post-1",
        title: "Regular post",
        topic: "General",
        text: "Hello",
        hashtags: "#hello",
        postedAt: new Date(),
        userId: "user-1",
        user: {
          id: "user-1",
          username: "alice",
        },
        likes: [],
      },
    ]);

    const res = await request(app)
      .get("/posts")
      .set("Cookie", makeAuthCookie("user-1"));

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(prismaMock.post.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          NOT: {
            OR: [{ topic: "Announcement" }, { topic: "announcement" }],
          },
        },
      }),
    );
  });

  it("GET /announcements returns announcement posts", async () => {
    allowAuthenticatedUser("user-1");
    prismaMock.post.findMany.mockResolvedValueOnce([
      {
        id: "announcement-1",
        title: "Maintenance",
        topic: "Announcement",
        text: "Scheduled maintenance tonight.",
        hashtags: null,
        postedAt: new Date(),
        userId: "admin-1",
        user: {
          id: "admin-1",
          username: "admin",
        },
        likes: [],
      },
    ]);

    const res = await request(app)
      .get("/announcements")
      .set("Cookie", makeAuthCookie("user-1"));

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(prismaMock.post.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          OR: [{ topic: "Announcement" }, { topic: "announcement" }],
        },
      }),
    );
  });

  it("POST /posts creates a discussion post", async () => {
    allowUserToContribute("user-1");

    prismaMock.post.create.mockResolvedValueOnce({
      id: "post-1",
      title: "Test title",
      topic: "General",
      text: "Test post body",
      hashtags: "#test",
      userId: "user-1",
      user: {
        id: "user-1",
        username: "alice",
      },
    });

    const res = await request(app)
      .post("/posts")
      .set("Cookie", makeAuthCookie("user-1"))
      .send({
        title: "Test title",
        topic: "General",
        text: "Test post body",
        hashtags: "#test",
      });

    expect(res.status).toBe(201);
    expect(res.body.id).toBe("post-1");
  });

  it("POST /post/:id/comments creates a top-level comment", async () => {
    allowUserToContribute("user-1");

    prismaMock.post.findUnique.mockResolvedValueOnce({
      id: "post-1",
      title: "Test title",
      userId: "owner-1",
      user: {
        id: "owner-1",
        username: "owner",
      },
    });

    prismaMock.comment.create.mockResolvedValueOnce({
      id: "comment-1",
      text: "Nice post!",
      postId: "post-1",
      userId: "user-1",
      previousCommentId: null,
      user: {
        id: "user-1",
        username: "alice",
      },
      replies: [],
    });

    prismaMock.user.findUnique.mockResolvedValueOnce({
      username: "alice",
    });

    const res = await request(app)
      .post("/post/post-1/comments")
      .set("Cookie", makeAuthCookie("user-1"))
      .send({
        text: "Nice post!",
      });

    expect(res.status).toBe(201);
    expect(res.body.id).toBe("comment-1");
    expect(prismaMock.notification.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          type: "post_comment",
          userId: "owner-1",
          triggeredById: "user-1",
        }),
      }),
    );
  });

  it("GET /auth/password-reset/validate returns false for invalid token", async () => {
    prismaMock.passwordResetToken.findUnique.mockResolvedValueOnce(null);

    const res = await request(app).get("/auth/password-reset/validate").query({
      token: "bad-token",
    });

    expect(res.status).toBe(200);
    expect(res.body.valid).toBe(false);
  });

  it("POST /auth/password-reset/confirm rejects weak password", async () => {
    const res = await request(app).post("/auth/password-reset/confirm").send({
      token: "token-1",
      password: "weak",
    });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain("Password");
    expect(prismaMock.passwordResetToken.findUnique).not.toHaveBeenCalled();
  });

  it("POST /auth/password-reset/confirm rejects invalid token", async () => {
    prismaMock.passwordResetToken.findUnique.mockResolvedValueOnce(null);

    const res = await request(app).post("/auth/password-reset/confirm").send({
      token: "invalid-token",
      password: "Password1!",
    });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain("Invalid or expired");
  });

  it("POST /auth/password-reset/confirm updates password and invalidates old token version", async () => {
    prismaMock.passwordResetToken.findUnique.mockResolvedValueOnce({
      id: "reset-token-1",
      userId: "user-1",
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
      usedAt: null,
    });
    prismaMock.passwordResetToken.updateMany.mockResolvedValueOnce({
      count: 1,
    });
    prismaMock.user.update.mockResolvedValueOnce({ id: "user-1" });
    prismaMock.passwordResetToken.deleteMany.mockResolvedValueOnce({
      count: 0,
    });

    const confirmRes = await request(app)
      .post("/auth/password-reset/confirm")
      .send({
        token: "valid-token",
        password: "Password1!",
      });

    expect(confirmRes.status).toBe(200);
    expect(confirmRes.body.message).toBe("Password reset successful");
    expect(prismaMock.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          passwordHash: expect.any(String),
          authTokenVersion: {
            increment: 1,
          },
        }),
      }),
    );

    prismaMock.user.findUnique.mockResolvedValueOnce({
      id: "user-1",
      role: "USER",
      authTokenVersion: 1,
    });

    const oldSessionRes = await request(app)
      .get("/user-profile")
      .set("Cookie", makeAuthCookie("user-1", "USER", 0));

    expect(oldSessionRes.status).toBe(403);
    expect(oldSessionRes.body.error).toBe("Invalid token");
  });
});
