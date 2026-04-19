import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import config from "../config/config";
import { prisma } from "../lib/prisma";
import NodeCache from "node-cache";
import {
  safeJsonParse,
  spotifyFetch,
  getValidSpotifyToken,
} from "../lib/spotifyUtils";

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
    const userId = req.userId;

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

// Re-export so existing callers outside this module still work
export { getValidSpotifyToken };

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

export const getSpotifyTopItems = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.userId;
    const type = req.params.type;
    const requestedTimeRange = String(req.query.timeRange ?? "alltime");

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (type !== "artists" && type !== "tracks") {
      return res.status(400).json({
        error: "Invalid type parameter. Must be 'artists' or 'tracks'.",
      });
    }

    const spotifyTimeRangeMap: Record<string, string> = {
      "4week": "short_term",
      "6month": "medium_term",
      alltime: "long_term",
    };

    const spotifyTimeRange =
      spotifyTimeRangeMap[requestedTimeRange] ?? "long_term";

    const cacheKey = `${userId}-${type}-${spotifyTimeRange}`;
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
      `https://api.spotify.com/v1/me/top/${type}?time_range=${spotifyTimeRange}&limit=10`,
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

      if (response.status === 401) {
        return res.json({
          items: [],
          connected: false,
          cached: false,
          error: "Spotify access token expired or invalid.",
        });
      }

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
          item: null,
          connected: false,
          error: "Spotify access token expired or invalid.",
        });
      }

      if (response.status === 403) {
        return res.json({
          item: null,
          connected: false,
          error: "Insufficient permissions.",
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

    // Auth check before parsing params
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const amount = parseInt(req.params.amount as string);

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
      return res.json({ items: [], connected: false });
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
      return res.json({ items: [], connected: true });
    }

    if (!response.ok) {
      const errorData = await safeJsonParse(response);
      console.error("Error fetching Spotify recently played:", errorData);

      if (response.status === 401) {
        return res.json({
          items: [],
          connected: false,
          error: "Spotify access token expired or invalid.",
        });
      }

      if (response.status === 403) {
        return res.json({
          items: [],
          connected: false,
          error: "Insufficient permissions.",
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

export const searchSpotify = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const q = (req.query.q as string) || "";
    const type = (req.query.type as string) || "";

    if (!q.trim()) {
      return res.status(400).json({ error: "Search query (q) is required." });
    }

    if (!type.trim()) {
      return res
        .status(400)
        .json({ error: "At least one result type is required." });
    }

    // Build the enhanced query string with field filters
    let queryParts: string[] = [q.trim()];

    const fieldFilters: Record<string, string | undefined> = {
      artist: req.query.artist as string | undefined,
      album: req.query.album as string | undefined,
      track: req.query.track as string | undefined,
      genre: req.query.genre as string | undefined,
      isrc: req.query.isrc as string | undefined,
      upc: req.query.upc as string | undefined,
    };

    for (const [key, value] of Object.entries(fieldFilters)) {
      if (value && value.trim()) {
        queryParts.push(`${key}:${value.trim()}`);
      }
    }

    // Tag filters
    if (req.query["tag:new"] === "true") queryParts.push("tag:new");
    if (req.query["tag:hipster"] === "true") queryParts.push("tag:hipster");

    // Year filter
    const yearMin = req.query.yearMin as string | undefined;
    const yearMax = req.query.yearMax as string | undefined;
    if (yearMin && yearMax && yearMin !== yearMax) {
      queryParts.push(`year:${yearMin}-${yearMax}`);
    } else if (yearMin && yearMax && yearMin === yearMax) {
      queryParts.push(`year:${yearMin}`);
    }

    const finalQuery = queryParts.join(" ");

    // Check cache
    const cacheKey = `${userId}-search-${finalQuery}-${type}`;
    const cachedEntry = spotifyCache.get<any>(cacheKey);

    if (cachedEntry) {
      return res.json({ ...cachedEntry, cached: true });
    }

    const token = await getValidSpotifyToken(userId);

    if (!token) {
      return res.json({ results: {}, connected: false, cached: false });
    }

    // Sanitize and clamp offset / limit before forwarding to Spotify
    const rawOffset = parseInt((req.query.offset as string) || "0");
    const rawLimit = parseInt((req.query.limit as string) || "10");
    const offset = Math.max(0, isNaN(rawOffset) ? 0 : rawOffset);
    const limit = Math.min(50, Math.max(1, isNaN(rawLimit) ? 10 : rawLimit));

    const searchParams = new URLSearchParams({
      q: finalQuery,
      type: type,
      offset: String(offset),
      limit: String(limit),
    });

    const response = await spotifyFetch(
      `https://api.spotify.com/v1/search?${searchParams.toString()}`,
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
      console.error("Error in Spotify search:", errorData);

      if (response.status === 401) {
        return res.json({
          results: {},
          connected: false,
          cached: false,
          error: "Spotify access token expired or invalid.",
        });
      }

      if (response.status === 403) {
        return res.json({
          results: {},
          connected: false,
          cached: false,
          error: "Insufficient permissions for Spotify search.",
        });
      }

      return res
        .status(response.status)
        .json({ error: `Spotify API error: ${response.statusText}` });
    }

    const data = (await safeJsonParse(response)) || {};
    const result = { results: data, connected: true };

    // Cache for 60 seconds
    spotifyCache.set(cacheKey, result, 60);

    res.json({ ...result, cached: false });
  } catch (error) {
    console.error("Error in searchSpotify:", error);
    next(error);
  }
};
