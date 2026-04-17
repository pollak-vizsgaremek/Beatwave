import { Request, Response, NextFunction } from "express";
import bcrypt from "bcrypt";
import { prisma } from "../lib/prisma";
import config from "../config/config";

const MAX_USERNAME_LENGTH = 50;

export const getUserProfile = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        connectedApps: {
          select: {
            platform: true,
          },
        },
      },
    });

    if (!user) {
      return res.status(404).json({ error: "Felhasználó nem található" });
    }

    const userData = {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      spotifyConnected: user.connectedApps.some(
        (app) => app.platform === "Spotify",
      ),
      soundCloudConnected: user.connectedApps.some(
        (app) => app.platform === "SoundCloud",
      ),
    };

    res.status(200).json(userData);
  } catch (error) {
    next(error);
  }
};

export const updateUserProfile = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: "Hiányzó adatok" });
    }

    if (typeof username !== "string" || username.trim().length === 0) {
      return res.status(400).json({ error: "Érvénytelen felhasználónév" });
    }

    if (username.trim().length > MAX_USERNAME_LENGTH) {
      return res.status(400).json({
        error: `A felhasználónév legfeljebb ${MAX_USERNAME_LENGTH} karakter lehet`,
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.userId },
    });

    if (!user) {
      return res.status(404).json({ error: "Felhasználó nem található" });
    }

    const pepper = config.passwordPepper;
    const isValid = await bcrypt.compare(password + pepper, user.passwordHash);

    if (!isValid) {
      return res.status(401).json({ error: "Hibás jelszó" });
    }

    const updatedUser = await prisma.user.update({
      where: { id: req.userId },
      data: { username: username.trim() },
      // Only return safe fields — never expose passwordHash, role, etc. in the response
      select: {
        id: true,
        username: true,
        email: true,
      },
    });

    res.status(200).json(updatedUser);
  } catch (error: any) {
    if (error.code === "P2002") {
      return res.status(409).json({ error: "Ez a felhasználónév már foglalt" });
    }
    next(error);
  }
};
