import { Request, Response, NextFunction } from "express";
import { getValidSpotifyToken, safeJsonParse, spotifyFetch } from "../../lib/spotifyUtils";
import { spotifyCache } from "./shared";

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
    const queryParts: string[] = [q.trim()];

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
