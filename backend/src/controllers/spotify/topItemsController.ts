import { Request, Response, NextFunction } from "express";
import {
  getValidSpotifyToken,
  safeJsonParse,
  spotifyFetch,
} from "../../lib/spotifyUtils";
import { spotifyCache } from "./shared";

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
