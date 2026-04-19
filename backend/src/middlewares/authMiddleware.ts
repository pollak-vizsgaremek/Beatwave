import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

import config from "../config/config";
import { prisma } from "../lib/prisma";

interface TokenPayload {
  id: string;
  username: string;
  role: string;
}

export const verifyToken = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Nincs bejelentkezve" });
  }

  const token = authHeader.slice(7);

  if (!token) {
    return res.status(401).json({ error: "Nincs bejelentkezve" });
  }

  try {
    const decoded = jwt.verify(token, config.jwtSecret) as TokenPayload;
    req.userId = decoded.id;
    req.role = decoded.role;
    console.log(
      `[Spotify MiddleWare] Extracted userId: ${req.userId} from token.`,
    );
    next();
  } catch (error) {
    return res.status(403).json({ error: "Ervenytelen token" });
  }
};

export const isAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (!req.userId) {
    return res.status(401).json({ error: "Nincs bejelentkezve" });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { role: true },
    });

    if (!user || user.role !== "ADMIN") {
      return res.status(403).json({ error: "Nincs jogosultsagod" });
    }

    req.role = user.role;
    next();
  } catch {
    return res.status(500).json({ error: "Belso szerverhiba" });
  }
};

export const isAdminOrModerator = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (!req.userId) {
    return res.status(401).json({ error: "Nincs bejelentkezve" });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { role: true },
    });

    if (!user || (user.role !== "ADMIN" && user.role !== "MODERATOR")) {
      return res.status(403).json({ error: "Nincs jogosultsagod" });
    }

    req.role = user.role;
    next();
  } catch {
    return res.status(500).json({ error: "Belso szerverhiba" });
  }
};
