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
    const userId = req.userId as string;


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
    const userId = req.userId as string;

    await prisma.connectedApp.deleteMany({
      where: {
        userId: userId,
        platform: "Spotify",
      },
    });

    await prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        spotifyTimeRange: "SHORT",
      },
    });

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
