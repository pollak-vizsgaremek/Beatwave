import { Request, Response, NextFunction } from "express";
import {
  getValidSpotifyToken,
  safeJsonParse,
  spotifyFetch,
} from "../../lib/spotifyUtils";
import { spotifyCache } from "./shared";

const RECOMMENDATIONS_CACHE_TTL_SECONDS = 1800;

type SpotifyTrack = {
  id?: string;
  name?: string;
  artists?: { name?: string }[];
  album?: {
    name?: string;
    images?: { url?: string }[];
    release_date?: string;
  };
  duration_ms?: number;
};

const getSpotifyErrorResponse = (
  status: number,
  fallbackMessage: string,
  connected: boolean,
) => {
  if (status === 401) {
    return {
      status: 200,
      body: {
        items: [],
        connected: false,
        cached: false,
        error: "Spotify access token expired or invalid.",
      },
    };
  }

  if (status === 403) {
    return {
      status: 200,
      body: {
        items: [],
        connected,
        cached: false,
        error: fallbackMessage,
      },
    };
  }

  return {
    status,
    body: { error: "Spotify API request failed." },
  };
};

export const getSpotifyRecommendations = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const cacheKey = `${userId}-recommendations`;
    const cachedEntry = spotifyCache.get<SpotifyTrack[]>(cacheKey);

    if (cachedEntry) {
      return res.json({ items: cachedEntry, connected: true, cached: true });
    }

    const token = await getValidSpotifyToken(userId);

    if (!token) {
      return res.json({ items: [], connected: false, cached: false });
    }

    const [topTracksResponse, topArtistsResponse] = await Promise.all([
      spotifyFetch(
        "https://api.spotify.com/v1/me/top/tracks?time_range=medium_term&limit=10",
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
        userId,
      ),
      spotifyFetch(
        "https://api.spotify.com/v1/me/top/artists?time_range=medium_term&limit=5",
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
        userId,
      ),
    ]);

    if (!topTracksResponse.ok) {
      const errorData = await safeJsonParse(topTracksResponse);
      console.error(
        "Error fetching top tracks for recommendations:",
        topTracksResponse.status,
        errorData,
      );

      const errorResponse = getSpotifyErrorResponse(
        topTracksResponse.status,
        "Insufficient permissions to read Spotify recommendations.",
        false,
      );

      return res.status(errorResponse.status).json(errorResponse.body);
    }

    if (!topArtistsResponse.ok) {
      const errorData = await safeJsonParse(topArtistsResponse);
      console.error(
        "Error fetching top artists for recommendations:",
        topArtistsResponse.status,
        errorData,
      );

      const errorResponse = getSpotifyErrorResponse(
        topArtistsResponse.status,
        "Insufficient permissions to read Spotify recommendations.",
        true,
      );

      return res.status(errorResponse.status).json(errorResponse.body);
    }

    const topTracksData = (await safeJsonParse(topTracksResponse)) || { items: [] };
    const topArtistsData = (await safeJsonParse(topArtistsResponse)) || {
      items: [],
    };

    const topTracks = (topTracksData.items || []) as SpotifyTrack[];
    const topArtists = (topArtistsData.items || []) as { name?: string }[];
    const topTrackIds = new Set(
      topTracks.map((track) => track.id).filter(Boolean) as string[],
    );

    const recommendations: SpotifyTrack[] = [];
    const seenTrackIds = new Set<string>(topTrackIds);

    for (const artist of topArtists) {
      if (!artist.name || recommendations.length >= 15) {
        continue;
      }

      const searchParams = new URLSearchParams({
        q: `artist:${artist.name}`,
        type: "track",
        limit: "10",
      });

      const searchResponse = await spotifyFetch(
        `https://api.spotify.com/v1/search?${searchParams.toString()}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
        userId,
      );

      if (!searchResponse.ok) {
        const errorData = await safeJsonParse(searchResponse);
        console.error(
          "Error fetching artist-based recommendations:",
          artist.name,
          searchResponse.status,
          errorData,
        );
        continue;
      }

      const searchData = (await safeJsonParse(searchResponse)) || {};
      const candidateTracks = (searchData.tracks?.items || []) as SpotifyTrack[];

      for (const track of candidateTracks) {
        if (!track.id || seenTrackIds.has(track.id)) {
          continue;
        }

        recommendations.push(track);
        seenTrackIds.add(track.id);

        if (recommendations.length >= 15) {
          break;
        }
      }
    }

    if (recommendations.length === 0) {
      return res.json({ items: [], connected: true, cached: false });
    }

    spotifyCache.set(
      cacheKey,
      recommendations,
      RECOMMENDATIONS_CACHE_TTL_SECONDS,
    );

    res.json({ items: recommendations, connected: true, cached: false });
  } catch (error) {
    console.error("Error in getSpotifyRecommendations:", error);
    next(error);
  }
};
