import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

import config from "../config/config";
import { getTokenFromRequest, hashToken } from "../lib/authToken";
import { prisma } from "../lib/prisma";

interface TokenPayload {
  id: string;
  username: string;
  role: string;
}

const REVOKED_TOKEN_CLEANUP_INTERVAL_MS = 60 * 60 * 1000;
let lastRevokedTokenCleanupAt = 0;

const maybeCleanupExpiredRevokedTokens = async () => {
  const now = Date.now();
  if (now - lastRevokedTokenCleanupAt < REVOKED_TOKEN_CLEANUP_INTERVAL_MS) {
    return;
  }

  lastRevokedTokenCleanupAt = now;
  await prisma.revokedToken.deleteMany({
    where: {
      expiresAt: {
        lt: new Date(),
      },
    },
  });
};

export const verifyToken = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const token = getTokenFromRequest(req);

  if (!token) {
    return res.status(401).json({ error: "Not logged in" });
  }

  try {
    const decoded = jwt.verify(token, config.jwtSecret) as TokenPayload;

    await maybeCleanupExpiredRevokedTokens();

    const revokedToken = await prisma.revokedToken.findUnique({
      where: { tokenHash: hashToken(token) },
      select: { id: true },
    });

    if (revokedToken) {
      return res.status(403).json({ error: "Invalid token" });
    }

    req.userId = decoded.id;
    req.role = decoded.role;
    next();
  } catch {
    return res.status(403).json({ error: "Invalid token" });
  }
};

export const isAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (!req.userId) {
    return res.status(401).json({ error: "Not logged in" });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { role: true },
    });

    if (!user || user.role !== "ADMIN") {
      return res.status(403).json({ error: "Insufficient permissions" });
    }

    req.role = user.role;
    next();
  } catch {
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const isAdminOrModerator = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (!req.userId) {
    return res.status(401).json({ error: "Not logged in" });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { role: true },
    });

    if (!user || (user.role !== "ADMIN" && user.role !== "MODERATOR")) {
      return res.status(403).json({ error: "Insufficient permissions" });
    }

    req.role = user.role;
    next();
  } catch {
    return res.status(500).json({ error: "Internal server error" });
  }
};
