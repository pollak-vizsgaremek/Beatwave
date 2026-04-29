import { Request, Response, NextFunction } from "express";
import bcrypt from "bcrypt";
import jwt, { JwtPayload } from "jsonwebtoken";
import { prisma } from "../lib/prisma";
import config from "../config/config";
import {
  AUTH_COOKIE_NAME,
  getTokenFromRequest,
  hashToken,
} from "../lib/authToken";
import {
  getValidSpotifyToken,
  safeJsonParse,
  spotifyFetch,
} from "../lib/spotifyUtils";
import { sendTemplatedEmail } from "../email/service";

const VALID_TIME_RANGES = ["SHORT", "MEDIUM", "LONG"] as const;
const MIN_USERNAME_LENGTH = 4;
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
    const includeProfileImages =
      req.query.includeSpotify === "true" ||
      req.query.includeProfileImages === "true";

    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: {
        id: true,
        username: true,
        email: true,
        description: true,
        isPrivate: true,
        role: true,
        spotifyTimeRange: true,
        connectedApps: {
          select: {
            platform: true,
          },
        },
      },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const spotifyConnected = user.connectedApps.some(
      (app) => app.platform === "Spotify",
    );

    const spotifyProfileImage =
      includeProfileImages && spotifyConnected
        ? await getSpotifyProfileImage(user.id)
        : null;

    const userData = {
      id: user.id,
      username: user.username,
      email: user.email,
      description: user.description,
      isPrivate: user.isPrivate,
      role: user.role,
      spotifyTimeRange: user.spotifyTimeRange,
      spotifyConnected,
      spotifyProfileImage,
      activeProfileImage: spotifyProfileImage,
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
    const includeProfileImages =
      req.query.includeSpotify === "true" ||
      req.query.includeProfileImages === "true";
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
      return res.status(404).json({ error: "User not found" });
    }

    const spotifyConnected = await prisma.connectedApp.findFirst({
      where: {
        userId: user.id,
        platform: "Spotify",
      },
      select: {
        id: true,
      },
    });

    const spotifyProfileImage =
      includeProfileImages && Boolean(spotifyConnected)
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
        activeProfileImage: spotifyProfileImage,
      });
    }

    res.status(200).json({
      ...user,
      spotifyProfileImage,
      activeProfileImage: spotifyProfileImage,
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
      return res.status(400).json({ error: "Please enter your password." });
    }

    if (username !== undefined) {
      if (typeof username !== "string" || username.trim().length === 0) {
        return res.status(400).json({ error: "Please enter a new username." });
      }

      if (username.trim().length < MIN_USERNAME_LENGTH) {
        return res.status(400).json({
          error: "Your new username must be more than 3 characters.",
        });
      }

      if (username.trim().length > MAX_USERNAME_LENGTH) {
        return res.status(400).json({
          error: `Your new username must be at most ${MAX_USERNAME_LENGTH} characters.`,
        });
      }
    }

    if (email !== undefined) {
      if (typeof email !== "string" || email.trim().length === 0) {
        return res.status(400).json({ error: "Invalid email address." });
      }

      if (!EMAIL_REGEX.test(email.trim())) {
        return res.status(400).json({ error: "Invalid email format." });
      }
    }

    if (description !== undefined) {
      if (typeof description !== "string") {
        return res.status(400).json({ error: "Invalid description." });
      }

      if (description.trim().length > MAX_DESCRIPTION_LENGTH) {
        return res.status(400).json({
          error: `Description must be at most ${MAX_DESCRIPTION_LENGTH} characters.`,
        });
      }
    }

    const user = await prisma.user.findUnique({
      where: { id: req.userId },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const pepper = config.passwordPepper;
    const isValid = await bcrypt.compare(password + pepper, user.passwordHash);

    if (!isValid) {
      return res.status(401).json({ error: "Incorrect password." });
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
      // Only return safe fields, never expose passwordHash, role, etc. in the response
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
        return res.status(409).json({ error: "This email address is already taken." });
      }

      return res.status(409).json({
        error: "That username is already taken. Please choose a different one.",
      });
    }
    next(error);
  }
};
export const updateSpotifyTimeRange = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.userId as string;
    const timeRange = req.body.timeRange;

    if (!timeRange || !VALID_TIME_RANGES.includes(timeRange)) {
      return res.status(400).json({ error: "Invalid time range" });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { spotifyTimeRange: timeRange },
    });

    res.json(updatedUser);
  } catch (error) {
    next(error);
  }
};

export const deleteOwnAccount = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.userId as string | undefined;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        email: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const token = getTokenFromRequest(req);

    await prisma.$transaction(async (tx) => {
      if (token) {
        const decoded = jwt.decode(token) as JwtPayload | null;
        const expSeconds =
          typeof decoded?.exp === "number"
            ? decoded.exp
            : Math.floor(Date.now() / 1000) + 60 * 60;
        const tokenHash = hashToken(token);

        await tx.revokedToken.upsert({
          where: { tokenHash },
          update: {
            expiresAt: new Date(expSeconds * 1000),
            revokedAt: new Date(),
          },
          create: {
            tokenHash,
            expiresAt: new Date(expSeconds * 1000),
          },
        });
      }

      await tx.user.delete({
        where: { id: userId },
      });
    });

    const isProduction = config.nodeEnv === "production";

    res.clearCookie(AUTH_COOKIE_NAME, {
      httpOnly: true,
      secure: isProduction,
      sameSite: "lax",
      path: "/",
    });

    try {
      await sendTemplatedEmail({
        template: "accountDeleted",
        to: user.email,
        context: {
          username: user.username,
        },
      });
    } catch (emailError) {
      console.error("[DeleteAccount] Failed to send account deletion email.", {
        userId: user.id,
        emailError,
      });
    }

    return res.status(200).json({ message: "Account deleted successfully" });
  } catch (error) {
    next(error);
  }
};
