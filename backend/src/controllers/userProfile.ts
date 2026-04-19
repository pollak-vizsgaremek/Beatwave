import { Request, Response, NextFunction } from "express";
import bcrypt from "bcrypt";
import { prisma } from "../lib/prisma";
import config from "../config/config";
import {
  getValidSpotifyToken,
  safeJsonParse,
  spotifyFetch,
} from "../lib/spotifyUtils";

const MAX_USERNAME_LENGTH = 50;
const MAX_DESCRIPTION_LENGTH = 300;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type SpotifyProfileResponse = {
  images?: Array<{
    url?: string;
    height?: number | null;
    width?: number | null;
  }>;
};

const getSpotifyProfileImage = async (
  userId: string,
): Promise<string | null> => {
  try {
    const token = await getValidSpotifyToken(userId);

    if (!token) {
      return null;
    }

    const response = await spotifyFetch(
      "https://api.spotify.com/v1/me",
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
      userId,
    );

    if (!response.ok) {
      console.warn(
        `Failed to fetch Spotify profile image for user ${userId}: ${response.status}`,
      );
      return null;
    }

    const data = ((await safeJsonParse(response)) ??
      {}) as SpotifyProfileResponse;

    return (
      data.images?.find((image) => typeof image?.url === "string" && image.url)
        ?.url ?? null
    );
  } catch (error) {
    console.error(
      `Error fetching Spotify profile image for user ${userId}:`,
      error,
    );
    return null;
  }
};

export const getUserProfile = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const includeSpotify = req.query.includeSpotify === "true";

    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: {
        id: true,
        username: true,
        email: true,
        description: true,
        isPrivate: true,
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

    const spotifyConnected = user.connectedApps.some(
      (app) => app.platform === "Spotify",
    );
    const spotifyProfileImage = includeSpotify && spotifyConnected
      ? await getSpotifyProfileImage(user.id)
      : null;

    const userData = {
      id: user.id,
      username: user.username,
      email: user.email,
      description: user.description,
      isPrivate: user.isPrivate,
      role: user.role,
      spotifyConnected,
      spotifyProfileImage,
      soundCloudConnected: user.connectedApps.some(
        (app) => app.platform === "SoundCloud",
      ),
    };

    res.status(200).json(userData);
  } catch (error) {
    next(error);
  }
};

export const getPublicUserProfile = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const includeSpotify = req.query.includeSpotify === "true";
    const { id } = req.params;

    const viewerIsOwner = req.userId === id;

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        username: true,
        description: true,
        isPrivate: true,
        posts: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
              },
            },
          },
          orderBy: {
            postedAt: "desc",
          },
        },
      },
    });

    if (!user) {
      return res.status(404).json({ error: "Felhasználó nem található" });
    }

    const spotifyProfileImage = includeSpotify
      ? await getSpotifyProfileImage(user.id)
      : null;

    if (user.isPrivate && !viewerIsOwner) {
      return res.status(200).json({
        id: user.id,
        username: user.username,
        description: user.description,
        isPrivate: true,
        posts: [],
        spotifyProfileImage,
      });
    }

    res.status(200).json({
      ...user,
      spotifyProfileImage,
    });
  } catch (error) {
    next(error);
  }
};

export const updateProfilePrivacy = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { isPrivate } = req.body;

    if (typeof isPrivate !== "boolean") {
      return res.status(400).json({ error: "Invalid privacy value" });
    }

    const updatedUser = await prisma.user.update({
      where: { id: req.userId },
      data: { isPrivate },
      select: {
        id: true,
        isPrivate: true,
      },
    });

    res.status(200).json(updatedUser);
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
    const { username, email, description, password } = req.body;

    if (!password) {
      return res.status(400).json({ error: "Hiányzó adatok" });
    }

    if (username !== undefined) {
      if (typeof username !== "string" || username.trim().length === 0) {
        return res.status(400).json({ error: "Érvénytelen felhasználónév" });
      }

      if (username.trim().length > MAX_USERNAME_LENGTH) {
        return res.status(400).json({
          error: `A felhasználónév legfeljebb ${MAX_USERNAME_LENGTH} karakter lehet`,
        });
      }
    }

    if (email !== undefined) {
      if (typeof email !== "string" || email.trim().length === 0) {
        return res.status(400).json({ error: "Érvénytelen email cím" });
      }

      if (!EMAIL_REGEX.test(email.trim())) {
        return res.status(400).json({ error: "Érvénytelen email formátum" });
      }
    }

    if (description !== undefined) {
      if (typeof description !== "string") {
        return res.status(400).json({ error: "Érvénytelen leírás" });
      }

      if (description.trim().length > MAX_DESCRIPTION_LENGTH) {
        return res.status(400).json({
          error: `A leírás legfeljebb ${MAX_DESCRIPTION_LENGTH} karakter lehet`,
        });
      }
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
      data: {
        ...(typeof username === "string" ? { username: username.trim() } : {}),
        ...(typeof email === "string" ? { email: email.trim() } : {}),
        ...(description !== undefined
          ? { description: description.trim() || null }
          : {}),
      },
      // Only return safe fields — never expose passwordHash, role, etc. in the response
      select: {
        id: true,
        username: true,
        email: true,
        description: true,
        isPrivate: true,
      },
    });

    res.status(200).json(updatedUser);
  } catch (error: any) {
    if (error.code === "P2002") {
      const target = String(error.meta?.target?.[0] ?? "");

      if (target.includes("email")) {
        return res.status(409).json({ error: "Ez az email cím már foglalt" });
      }

      return res.status(409).json({ error: "Ez a felhasználónév már foglalt" });
    }
    next(error);
  }
};
