import { Request, Response, NextFunction } from "express";
import { prisma } from "../../lib/prisma";
import { getValidSpotifyToken } from "../../lib/spotifyUtils";
import { spotifyCache } from "./shared";

export const getSpotifyToken = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const token = await getValidSpotifyToken(userId);

    if (!token) {
      return res
        .status(404)
        .json({ error: "Spotify account not connected or token expired" });
    }

    res.json({ accessToken: token });
  } catch (error) {
    next(error);
  }
};

export const disconnectSpotify = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    await prisma.connectedApp.deleteMany({
      where: {
        userId: userId,
        platform: "Spotify",
      },
    });

    console.log(`Spotify disconnected for user ${userId}`);

    // Clear all cached entries belonging to this user
    const keys = spotifyCache.keys();
    keys.forEach((key) => {
      if (key.startsWith(`${userId}-`)) {
        spotifyCache.del(key);
      }
    });

    res.json({ message: "Spotify successfully disconnected" });
  } catch (error) {
    next(error);
  }
};
