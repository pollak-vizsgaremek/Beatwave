import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import config from "../config/config";
import { prisma } from "../lib/prisma";

const SPOTIFY_AUTH_URL = "https://accounts.spotify.com/authorize";
const SPOTIFY_TOKEN_URL = "https://accounts.spotify.com/api/token";

export const getSpotifyAuthUrl = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.userId; // Set by verifyToken middleware

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Generate a signed state containing the userId to prevent CSRF and identify the user
    const state = jwt.sign({ userId }, config.jwtSecret, { expiresIn: "10m" });

    const scope =
      "user-top-read user-read-currently-playing user-library-modify streaming app-remote-control user-read-playback-state user-modify-playback-state user-read-private user-read-email";

    const params = new URLSearchParams({
      response_type: "code",
      client_id: config.spotifyClientId,
      scope: scope,
      redirect_uri: config.spotifyRedirectUri,
      state: state,
    });

    res.json({ url: `${SPOTIFY_AUTH_URL}?${params.toString()}` });
  } catch (error) {
    next(error);
  }
};

export const spotifyCallback = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const code = (req.query.code as string) || null;
  const state = (req.query.state as string) || null;
  const error = (req.query.error as string) || null;

  if (error) {
    return res.redirect(`${config.frontendUrl}/profile?spotify_error=${error}`);
  }

  if (!state || !code) {
    return res.redirect(
      `${config.frontendUrl}/error?msg=state_or_code_missing`,
    );
  }

  try {
    // Verify the state to get the userId
    const decoded = jwt.verify(state, config.jwtSecret) as { userId: string };
    const userId = decoded.userId;

    if (!userId) {
      return res.redirect(`${config.frontendUrl}/error?msg=invalid_state`);
    }

    // Spotify requires the Client ID and Secret to be base64 encoded together
    const authHeader = Buffer.from(
      `${config.spotifyClientId}:${config.spotifyClientSecret}`,
    ).toString("base64");

    const tokenResponse = await fetch(SPOTIFY_TOKEN_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${authHeader}`,
      },
      body: new URLSearchParams({
        code: code,
        redirect_uri: config.spotifyRedirectUri,
        grant_type: "authorization_code",
      }).toString(),
    });

    const data = await tokenResponse.json();

    if (!tokenResponse.ok) {
      console.error("Spotify Token Error:", data);
      return res.redirect(
        `${config.frontendUrl}/error?msg=spotify_token_error`,
      );
    }

    const { access_token, refresh_token, expires_in } = data;

    // Calculate absolute expiration time
    let expiresAt: Date | undefined;
    if (expires_in) {
      expiresAt = new Date(Date.now() + expires_in * 1000);
    }

    // Save tokens to database
    const existingConnection = await prisma.connectedApp.findFirst({
      where: {
        userId: userId,
        platform: "Spotify",
      },
    });

    if (existingConnection) {
      await prisma.connectedApp.update({
        where: { id: existingConnection.id },
        data: {
          accessToken: access_token,
          refreshToken: refresh_token || existingConnection.refreshToken, // keep old refresh token if not provided
          expiresAt: expiresAt,
          connectedAt: new Date(),
        },
      });
    } else {
      await prisma.connectedApp.create({
        data: {
          platform: "Spotify",
          accessToken: access_token,
          refreshToken: refresh_token,
          expiresAt: expiresAt,
          userId: userId,
        },
      });
    }

    res.redirect(`${config.frontendUrl}/profile?spotify_status=success`);
  } catch (error) {
    console.error("Spotify Callback Error:", error);
    res.redirect(`${config.frontendUrl}/error?msg=server_error`);
  }
};

export const getValidSpotifyToken = async (
  userId: string,
): Promise<string | null> => {
  try {
    const connection = await prisma.connectedApp.findFirst({
      where: { userId, platform: "Spotify" },
    });

    if (!connection || !connection.accessToken) {
      return null;
    }

    // Check if token is expired, with a 1-minute buffer
    const isExpired =
      connection.expiresAt &&
      connection.expiresAt.getTime() - Date.now() < 60000;

    if (!isExpired) {
      return connection.accessToken;
    }

    if (!connection.refreshToken) {
      console.warn(
        "Spotify token expired but no refresh token available for user",
        userId,
      );
      return null; // Could optionally delete the connection here
    }

    console.log(`Refreshing Spotify token for user ${userId}`);

    const authHeader = Buffer.from(
      `${config.spotifyClientId}:${config.spotifyClientSecret}`,
    ).toString("base64");

    const refreshResponse = await fetch(SPOTIFY_TOKEN_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${authHeader}`,
      },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: connection.refreshToken,
      }).toString(),
    });

    const data = await refreshResponse.json();

    if (!refreshResponse.ok) {
      console.error("Failed to refresh Spotify token:", data);
      return null;
    }

    const newAccessToken = data.access_token;
    const newRefreshToken = data.refresh_token || connection.refreshToken; // Sometimes Spotify doesn't return a new refresh token
    const newExpiresAt = data.expires_in
      ? new Date(Date.now() + data.expires_in * 1000)
      : connection.expiresAt;

    // Update DB
    await prisma.connectedApp.update({
      where: { id: connection.id },
      data: {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
        expiresAt: newExpiresAt,
      },
    });

    return newAccessToken;
  } catch (error) {
    console.error("Error validifying Spotify token:", error);
    return null;
  }
};

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

    res.json({ message: "Spotify successfully disconnected" });
  } catch (error) {
    next(error);
  }
};
