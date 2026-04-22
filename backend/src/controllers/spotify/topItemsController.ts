import { Request, Response, NextFunction } from "express";
import {
  getValidSpotifyToken,
  safeJsonParse,
  spotifyFetch,
} from "../../lib/spotifyUtils";
import { spotifyCache } from "./shared";
import { prisma } from "../../lib/prisma";

export const getSpotifyTopItems = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.userId as string;
    const type = req.params.type;

    // 1. JogosultsĂˇg Ă©s bemeneti paramĂ©terek ellenĹ‘rzĂ©se

    if (type !== "artists" && type !== "tracks") {
      return res.status(400).json({
        error: "Ă‰rvĂ©nytelen paramĂ©ter. Csak 'artists' vagy 'tracks' lehet.",
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        spotifyTimeRange: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: "FelhasznĂˇlĂł nem talĂˇlhatĂł" });
    }

    const spotifyTimeRangeMap: Record<string, string> = {
      SHORT: "short_term",
      MEDIUM: "medium_term",
      LONG: "long_term",
    };

    const requestedTimeRange = user.spotifyTimeRange || "MEDIUM"; 
    const spotifyTimeRange = spotifyTimeRangeMap[requestedTimeRange] ?? "long_term";

    const cacheKey = `${userId}-${type}-${spotifyTimeRange}`;
    const cachedEntry = spotifyCache.get<any>(cacheKey);

    if (cachedEntry) {
      console.log(`Returning cached Spotify top ${type} for user: ${userId}`);
      return res.status(200).json({ items: cachedEntry, cached: true });
    }

    const token = await getValidSpotifyToken(userId);

    if (!token) {
      return res.status(200).json({ items: [], connected: false, cached: false });
    }

    const spotifyApiUrl = `https://api.spotify.com/v1/me/top/${type}?time_range=${spotifyTimeRange}&limit=10`;
    
    const response = await spotifyFetch(
      spotifyApiUrl,
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
        return res.status(401).json({
          items: [],
          connected: false,
          cached: false,
          error: "Spotify access token expired or invalid.",
        });
      }

      if (response.status === 403) {
        return res.status(403).json({
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

    return res.status(200).json({ items: data.items, cached: false });
    
  } catch (error) {
    console.error("Error in getSpotifyTopItems:", error);
    next(error);
  }
};