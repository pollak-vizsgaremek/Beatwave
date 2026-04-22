import { Request, Response as ExpressResponse, NextFunction } from "express";
import config from "../../config/config";
import {
  getValidSpotifyToken,
  safeJsonParse,
  spotifyFetch,
} from "../../lib/spotifyUtils";
import { spotifyCache } from "./shared";

type SpotifyImage = {
  url: string;
  height: number | null;
  width: number | null;
};

type Artist = {
  id: string;
  name: string;
  images?: SpotifyImage[];
  genres?: string[];
  external_urls?: { spotify?: string };
};

type Track = {
  id: string;
  uri: string;
  name: string;
  duration_ms: number;
  popularity?: number;
  album: {
    name: string;
    images: SpotifyImage[];
  };
  artists: { id?: string; name: string }[];
};

type Album = {
  id: string;
  name: string;
  images: SpotifyImage[];
  release_date?: string;
  album_type?: string;
  external_urls?: { spotify?: string };
};

type RelatedArtist = Artist;

const CACHE_TTL_MS = 1000 * 60 * 10;
const APP_TOKEN_CACHE_KEY = "spotify:catalog-app-token";

function cacheKey(id: string) {
  return `artistView:v3:${id}`;
}

function isFresh(entry?: { ts: number }) {
  return !!entry && Date.now() - entry.ts < CACHE_TTL_MS;
}

function logOptionalSpotifyFailure(scope: string, error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  const status = (error as { status?: number } | null)?.status;

  if (status === 403) {
    return;
  }

  console.warn(`Spotify artist view optional ${scope} failed: ${message}`);
}

async function fetchJson(url: string, token: string, userId: string) {
  const res = await spotifyFetch(
    url,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
    userId,
  );

  const data = await safeJsonParse(res);

  if (!res.ok) {
    const message =
      data?.error?.message ||
      data?.message ||
      `Spotify request failed with status ${res.status}`;
    const error = new Error(message) as Error & { status?: number };
    error.status = res.status;
    throw error;
  }

  return data;
}

async function fetchJsonWithToken(url: string, token: string) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);

  try {
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      signal: controller.signal,
    });

    const data = await safeJsonParse(res);

    if (!res.ok) {
      const message =
        data?.error?.message ||
        data?.message ||
        `Spotify request failed with status ${res.status}`;
      const error = new Error(message) as Error & { status?: number };
      error.status = res.status;
      throw error;
    }

    return data;
  } finally {
    clearTimeout(timeoutId);
  }
}

async function getSpotifyCatalogToken() {
  const cached = spotifyCache.get<{ accessToken: string; expiresAt: number }>(
    APP_TOKEN_CACHE_KEY,
  );

  if (cached && cached.expiresAt - Date.now() > 60000) {
    return cached.accessToken;
  }

  const authHeader = Buffer.from(
    `${config.spotifyClientId}:${config.spotifyClientSecret}`,
  ).toString("base64");

  const response = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${authHeader}`,
    },
    body: new URLSearchParams({
      grant_type: "client_credentials",
    }).toString(),
  });

  const data = await response.json();

  if (!response.ok || !data?.access_token) {
    const message =
      data?.error_description ||
      data?.error ||
      "Failed to get Spotify catalog token.";
    throw new Error(message);
  }

  const accessToken = data.access_token as string;
  const expiresInSeconds =
    typeof data.expires_in === "number" ? data.expires_in : 3600;

  spotifyCache.set(APP_TOKEN_CACHE_KEY, {
    accessToken,
    expiresAt: Date.now() + expiresInSeconds * 1000,
  });

  return accessToken;
}

async function fetchCatalogJson(url: string, token: string, userId: string) {
  try {
    return await fetchJson(url, token, userId);
  } catch (error) {
    if ((error as { status?: number })?.status !== 403) {
      throw error;
    }

    const appToken = await getSpotifyCatalogToken();
    return fetchJsonWithToken(url, appToken);
  }
}

async function fetchJsonOrNull(url: string, token: string, userId: string) {
  try {
    return await fetchJson(url, token, userId);
  } catch (error) {
    logOptionalSpotifyFailure(url, error);
    return null;
  }
}

async function fetchCatalogJsonOrNull(
  url: string,
  token: string,
  userId: string,
) {
  try {
    return await fetchCatalogJson(url, token, userId);
  } catch (error) {
    logOptionalSpotifyFailure(url, error);
    return null;
  }
}

async function fetchArtistTopTracksCatalogFallback(
  artist: Artist,
  token: string,
  userId: string,
) {
  const normalizedArtistName = artist.name.trim().toLowerCase();
  const params = new URLSearchParams({
    q: artist.name,
    type: "track",
    limit: "50",
    market: "US",
  });

  const data = await fetchCatalogJsonOrNull(
    `https://api.spotify.com/v1/search?${params.toString()}`,
    token,
    userId,
  );

  const searchTracks: Track[] = Array.isArray(data?.tracks?.items)
    ? data.tracks.items
    : [];

  const seenTrackIds = new Set<string>();

  return searchTracks
    .filter((track) => {
      if (!track?.id || seenTrackIds.has(track.id)) {
        return false;
      }

      const isArtistMatch = Array.isArray(track.artists)
        ? track.artists.some((trackArtist) => {
            if (trackArtist?.id && trackArtist.id === artist.id) {
              return true;
            }

            return (
              trackArtist?.name?.trim().toLowerCase() === normalizedArtistName
            );
          })
        : false;

      if (!isArtistMatch) {
        return false;
      }

      seenTrackIds.add(track.id);
      return true;
    })
    .sort((left, right) => (right.popularity ?? 0) - (left.popularity ?? 0))
    .slice(0, 10);
}

async function fetchAlbumTracksFallback(
  artist: Artist,
  albums: Album[],
  token: string,
  userId: string,
) {
  const normalizedArtistName = artist.name.trim().toLowerCase();
  const seenTrackIds = new Set<string>();
  const tracks: Track[] = [];

  for (const album of albums.slice(0, 5)) {
    const data = await fetchCatalogJsonOrNull(
      `https://api.spotify.com/v1/albums/${album.id}/tracks?market=US&limit=50`,
      token,
      userId,
    );

    const albumTracks = Array.isArray(data?.items)
      ? (data.items as Array<{
          id?: string;
          uri?: string;
          name?: string;
          duration_ms?: number;
          artists?: { id?: string; name?: string }[];
        }>)
      : [];

    for (const track of albumTracks) {
      if (!track?.id || !track?.uri || seenTrackIds.has(track.id)) {
        continue;
      }

      const isArtistMatch = Array.isArray(track.artists)
        ? track.artists.some((trackArtist) => {
            if (trackArtist?.id && trackArtist.id === artist.id) {
              return true;
            }

            return (
              trackArtist?.name?.trim().toLowerCase() === normalizedArtistName
            );
          })
        : false;

      if (!isArtistMatch) {
        continue;
      }

      seenTrackIds.add(track.id);
      tracks.push({
        id: track.id,
        uri: track.uri,
        name: track.name ?? "",
        duration_ms: track.duration_ms ?? 0,
        album: {
          name: album.name,
          images: album.images ?? [],
        },
        artists: Array.isArray(track.artists)
          ? track.artists
              .filter((trackArtist) => trackArtist?.name)
              .map((trackArtist) => ({
                id: trackArtist.id,
                name: trackArtist.name as string,
              }))
          : [],
      });

      if (tracks.length >= 10) {
        return tracks;
      }
    }
  }

  return tracks;
}

function normalizeGenreQuery(genre: string) {
  return genre.trim().split(/\s+/).filter(Boolean).join(" ");
}

async function fetchRelatedArtistsFallback(
  artist: Artist,
  token: string,
  userId: string,
) {
  const queries = [
    ...(artist.genres ?? [])
      .map(normalizeGenreQuery)
      .filter(Boolean)
      .slice(0, 3)
      .map((genre) => ({ q: genre, type: "artist", limit: "8" })),
    { q: artist.name, type: "artist", limit: "8" },
  ];

  const seen = new Set<string>();
  const relatedArtists: RelatedArtist[] = [];

  for (const paramsInit of queries) {
    const params = new URLSearchParams(paramsInit);
    const data = await fetchCatalogJsonOrNull(
      `https://api.spotify.com/v1/search?${params.toString()}`,
      token,
      userId,
    );

    const artists = Array.isArray(data?.artists?.items)
      ? (data.artists.items as RelatedArtist[])
      : [];

    for (const candidate of artists) {
      if (
        !candidate?.id ||
        candidate.id === artist.id ||
        seen.has(candidate.id)
      ) {
        continue;
      }

      seen.add(candidate.id);
      relatedArtists.push(candidate);

      if (relatedArtists.length >= 10) {
        return relatedArtists;
      }
    }
  }

  return relatedArtists;
}

export async function getArtistView(
  req: Request,
  res: ExpressResponse,
  next: NextFunction,
) {
  const id = req.params.id?.trim();
  const userId = req.userId as string;

  if (!id) {
    return res.status(400).json({ error: "Artist id is required." });
  }

  if (!userId) {
    return res.status(401).json({ error: "Unauthorized." });
  }

  try {
    const cached = spotifyCache.get<{ ts: number; data: unknown }>(
      cacheKey(id),
    );
    if (cached && isFresh(cached)) {
      return res.json(cached.data);
    }

    const token = await getValidSpotifyToken(userId);

    if (!token) {
      return res.json({ connected: false, error: "Spotify is not connected." });
    }

    const artist = (await fetchCatalogJson(
      `https://api.spotify.com/v1/artists/${id}`,
      token,
      userId,
    )) as Artist;

    const [relatedRaw, albumsRaw] = await Promise.all([
      fetchCatalogJsonOrNull(
        `https://api.spotify.com/v1/artists/${id}/related-artists`,
        token,
        userId,
      ),
      fetchCatalogJsonOrNull(
        `https://api.spotify.com/v1/artists/${id}/albums?include_groups=album,single&limit=10&market=US`,
        token,
        userId,
      ),
    ]);

    const albums: Album[] = Array.isArray(albumsRaw?.items)
      ? albumsRaw.items.filter((a: Album) => a?.id).slice(0, 20)
      : [];

    const topTracksFromSearch: Track[] =
      await fetchArtistTopTracksCatalogFallback(artist, token, userId);

    const topTracks: Track[] = topTracksFromSearch.length
      ? topTracksFromSearch
      : await fetchAlbumTracksFallback(artist, albums, token, userId);

    const relatedArtistsFromEndpoint: RelatedArtist[] = Array.isArray(
      relatedRaw?.artists,
    )
      ? relatedRaw.artists.slice(0, 10)
      : [];

    const relatedArtistsSeed: RelatedArtist[] =
      relatedArtistsFromEndpoint.length
        ? relatedArtistsFromEndpoint
        : await fetchRelatedArtistsFallback(artist, token, userId);
    const relatedArtists: RelatedArtist[] = relatedArtistsSeed;

    const payload = {
      connected: true,
      artist: {
        id: artist.id,
        name: artist.name,
        images: artist.images ?? [],
        external_urls: artist.external_urls ?? {},
      },
      topTracks: topTracks.map((track) => ({
        id: track.id,
        uri: track.uri,
        name: track.name,
        duration_ms: track.duration_ms,
        album: {
          name: track.album?.name ?? "",
          images: track.album?.images ?? [],
        },
        artists: Array.isArray(track.artists)
          ? track.artists.map((a) => ({ name: a.name }))
          : [],
      })),
      relatedArtists: relatedArtists.map((a) => ({
        id: a.id,
        name: a.name,
        images: a.images ?? [],
        external_urls: a.external_urls ?? {},
      })),
      albums: albums.map((album) => ({
        id: album.id,
        name: album.name,
        images: album.images ?? [],
        release_date: album.release_date ?? "",
        album_type: album.album_type ?? "",
        external_urls: album.external_urls ?? {},
      })),
    };

    spotifyCache.set(cacheKey(id), { ts: Date.now(), data: payload });

    return res.json(payload);
  } catch (err: any) {
    return res.status(500).json({
      connected: false,
      error: err?.message ?? "Failed to load artist data.",
    });
  }
}

export const getSpotifyArtist = getArtistView;
