import { Request, Response, NextFunction } from "express";
import { getValidSpotifyToken, safeJsonParse, spotifyFetch } from "../../lib/spotifyUtils";
import { spotifyCache } from "./shared";

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
