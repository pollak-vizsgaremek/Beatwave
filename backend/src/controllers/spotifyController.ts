import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import config from "../config/config";
import { prisma } from "../lib/prisma";
import NodeCache from "node-cache";
import { safeJsonParse, spotifyFetch } from "../lib/spotifyUtils";

// TTL of 60 minutes (3600s), cleanup check every 10 mins (600s)
const spotifyCache = new NodeCache({ stdTTL: 3600, checkperiod: 600 });

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
      "user-top-read user-read-currently-playing user-library-modify streaming app-remote-control user-read-playback-state user-modify-playback-state user-read-private user-read-email user-read-recently-played";

    const params = new URLSearchParams({
      response_type: "code",
      client_id: config.spotifyClientId,
      scope: scope,
      redirect_uri: config.spotifyRedirectUri,
      state: state,
      show_dialog: "true", // Forces Spotify to prompt for permissions
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
      `${config.frontendUrl}/profile?spotify_error=state_or_code_missing`,
    );
  }

  try {
    // Verify the state to get the userId
    const decoded = jwt.verify(state, config.jwtSecret) as { userId: string };
    const userId = decoded.userId;

    if (!userId) {
      return res.redirect(
        `${config.frontendUrl}/profile?spotify_error=invalid_state`,
      );
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
        `${config.frontendUrl}/profile?spotify_error=spotify_token_error`,
      );
    }

    const { access_token, refresh_token, expires_in } = data;

    // Calculate absolute expiration time
    let expiresAt: Date | undefined;
    if (expires_in) {
      expiresAt = new Date(Date.now() + expires_in * 1000);
    }

    // Save tokens to database securely using atomic upsert to prevent race conditions
    await prisma.connectedApp.upsert({
      where: {
        userId_platform: {
          userId: userId,
          platform: "Spotify",
        },
      },
      update: {
        accessToken: access_token,
        // Prisma ignores undefined, so we only update if provided
        refreshToken: refresh_token || undefined,
        expiresAt: expiresAt,
        connectedAt: new Date(),
      },
      create: {
        platform: "Spotify",
        accessToken: access_token,
        refreshToken: refresh_token,
        expiresAt: expiresAt,
        userId: userId,
      },
    });

    res.redirect(`${config.frontendUrl}/profile?spotify_status=success`);
  } catch (error) {
    console.error("Spotify Callback Error:", error);
    res.redirect(`${config.frontendUrl}/profile?spotify_error=server_error`);
  }
};

export const getValidSpotifyToken = async (
  userId: string,
  forceRefresh: boolean = false,
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

    if (!isExpired && !forceRefresh) {
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
      : new Date(Date.now() + 3600 * 1000); // Default to 1 hour if Spotify omits it

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

    console.log(`Spotify disconnected for user ${userId}`);

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

export const getSpotifyTopItems = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.userId;
    const type = req.params.type;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (type !== "artists" && type !== "tracks") {
      return res.status(400).json({
        error: "Invalid type parameter. Must be 'artists' or 'tracks'.",
      });
    }

    const cacheKey = `${userId}-${type}`;
    const cachedEntry = spotifyCache.get<any>(cacheKey);

    if (cachedEntry) {
      console.log(`Returning cached Spotify top ${type} for user: ${userId}`);
      return res.json({ items: cachedEntry, cached: true });
    }

    const token = await getValidSpotifyToken(userId);

    if (!token) {
      return res.json({ items: [], connected: false, cached: false });
    }

    const response = await spotifyFetch(
      `https://api.spotify.com/v1/me/top/${type}?time_range=long_term&limit=10`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
      userId,
    );

    if (!response.ok) {
      const errorData = await safeJsonParse(response);
      console.error(`Error fetching Spotify top ${type}:`, errorData);

      // Prevent proxying 401 from Spotify to frontend, which triggers app auto-logout
      if (response.status === 401) {
        return res.json({
          items: [],
          connected: false,
          cached: false,
          error: "Spotify access token expired or invalid.",
        });
      }

      // If forbidden, they likely don't have the user-top-read scope allowed initially
      if (response.status === 403) {
        return res.json({
          items: [],
          connected: false,
          cached: false,
          error: "Insufficient permissions to read top items from Spotify.",
        });
      }
      return res
        .status(response.status)
        .json({ error: `Spotify API error: ${response.statusText}` });
    }

    const data = (await safeJsonParse(response)) || { items: [] };

    // Cache the items
    spotifyCache.set(cacheKey, data.items);

    res.json({ items: data.items, cached: false });
  } catch (error) {
    console.error("Error in getSpotifyTopItems:", error);
    next(error);
  }
};

export const getSpotifyCurrentlyPlaying = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Check cache first (15s TTL for currently playing)
    const cacheKey = `${userId}-currently-playing`;
    const cachedEntry = spotifyCache.get<any>(cacheKey);

    if (cachedEntry) {
      return res.json({ ...cachedEntry, cached: true });
    }

    const token = await getValidSpotifyToken(userId);

    if (!token) {
      return res.json({ item: null, connected: false });
    }

    const response = await spotifyFetch(
      "https://api.spotify.com/v1/me/player/currently-playing",
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
      userId,
    );

    if (response.status === 204) {
      return res.json({ item: null, connected: true });
    }

    if (!response.ok) {
      const errorData = await safeJsonParse(response);
      console.error("Error fetching Spotify currently playing:", errorData);
      if (response.status === 401) {
        return res.json({
          items: [],
          connected: false,
          cached: false,
          error: "Spotify access token expired or invalid.",
        });
      }

      // If forbidden, they likely don't have the user-top-read scope allowed initially
      if (response.status === 403) {
        return res.json({
          items: [],
          connected: false,
          cached: false,
          error: "Insufficient permissions to read top items from Spotify.",
        });
      }
      return res
        .status(response.status)
        .json({ error: `Spotify API error: ${response.statusText}` });
    }

    const data = (await safeJsonParse(response)) || {};
    const result = {
      item: data.item || null,
      is_playing: data.is_playing || false,
      progress_ms: data.progress_ms || 0,
      connected: true,
    };

    // Cache for 15 seconds
    spotifyCache.set(cacheKey, result, 15);

    res.json({ ...result, cached: false });
  } catch (error) {
    console.error("Error in getSpotifyCurrentlyPlaying:", error);
    next(error);
  }
};

export const getSpotifyRecentlyPlayed = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.userId;
    const amount = parseInt(req.params.amount as string);

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (!amount || amount <= 0 || amount > 50) {
      return res
        .status(400)
        .json({ error: "Invalid amount parameter. Must be between 1 and 50." });
    }

    // Check cache first (30s TTL for recently played)
    const cacheKey = `${userId}-recently-played-${amount}`;
    const cachedEntry = spotifyCache.get<any>(cacheKey);

    if (cachedEntry) {
      return res.json({ ...cachedEntry, cached: true });
    }

    const token = await getValidSpotifyToken(userId);

    if (!token) {
      return res.json({ item: null, connected: false });
    }

    const response = await spotifyFetch(
      `https://api.spotify.com/v1/me/player/recently-played?limit=${amount}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
      userId,
    );

    if (response.status === 204) {
      return res.json({ item: null, connected: true });
    }

    if (!response.ok) {
      const errorData = await safeJsonParse(response);
      console.error("Error fetching Spotify recently played:", errorData);
      if (response.status === 401) {
        return res.json({
          items: [],
          connected: false,
          cached: false,
          error: "Spotify access token expired or invalid.",
        });
      }

      // If forbidden, they likely don't have the user-top-read scope allowed initially
      if (response.status === 403) {
        return res.json({
          items: [],
          connected: false,
          cached: false,
          error: "Insufficient permissions to read top items from Spotify.",
        });
      }
      return res
        .status(response.status)
        .json({ error: `Spotify API error: ${response.statusText}` });
    }

    const data = (await safeJsonParse(response)) || { items: [] };
    const result = { items: data.items, connected: true };

    // Cache for 30 seconds
    spotifyCache.set(cacheKey, result, 30);

    res.json({ ...result, cached: false });
  } catch (error) {
    console.error("Error in getSpotifyRecentlyPlayed:", error);
    next(error);
  }
};
