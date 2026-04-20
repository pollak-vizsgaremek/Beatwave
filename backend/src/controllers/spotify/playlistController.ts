import { Request, Response, NextFunction } from "express";
import {
  getValidSpotifyToken,
  safeJsonParse,
  spotifyFetch,
} from "../../lib/spotifyUtils";
import { spotifyCache } from "./shared";

// Cache TTLs (seconds)
const TTL_PLAYLISTS_BASE = 300;    // 5 min â€” base playlist list
const TTL_TRACK_IN_PLAYLIST = 120; // 2 min â€” per-track duplicate check
const TTL_OWNERSHIP = 600;         // 10 min â€” playlist ownership

const playlistCacheKey = (userId: string) => `${userId}-playlists-base`;
const trackInPlaylistCacheKey = (userId: string, playlistId: string, trackUri: string) =>
  `${userId}-track-in-playlist-${playlistId}-${encodeURIComponent(trackUri)}`;
const ownershipCacheKey = (userId: string, playlistId: string) =>
  `${userId}-ownership-${playlistId}`;

/** Bust all playlist-related caches for a user after a mutation (add/remove). */
const invalidatePlaylistCaches = (userId: string, affectedPlaylistIds: string[], trackUri?: string) => {
  spotifyCache.del(playlistCacheKey(userId));
  for (const playlistId of affectedPlaylistIds) {
    spotifyCache.del(ownershipCacheKey(userId, playlistId));
    if (trackUri) {
      spotifyCache.del(trackInPlaylistCacheKey(userId, playlistId, trackUri));
    }
  }
};

type SpotifyPlaylistSummary = {
  id: string;
  name: string;
  ownerName: string;
  image: string | null;
  tracksTotal: number;
  canModify: boolean;
  containsTrack?: boolean;
  trackOccurrences?: number;
};

type RawSpotifyPlaylist = {
  id: string;
  name?: string;
  collaborative?: boolean;
  public?: boolean;
  owner?: {
    id?: string;
    display_name?: string;
  };
  images?: { url?: string }[];
  items?: { total?: number };
  tracks?: { total?: number };
};

type RawSpotifyPlaylistTrack = {
  uri?: string;
  id?: string;
  linked_from?: {
    uri?: string;
    id?: string;
  };
};

const extractSpotifyTrackId = (value?: string | null) => {
  if (!value) {
    return null;
  }

  if (value.startsWith("spotify:track:")) {
    return value.split(":").pop() || null;
  }

  const trackUrlMatch = value.match(/spotify\.com\/track\/([A-Za-z0-9]+)/);

  if (trackUrlMatch?.[1]) {
    return trackUrlMatch[1];
  }

  return null;
};

const trackMatchesRequestedTrack = (
  playlistTrack: RawSpotifyPlaylistTrack | null | undefined,
  requestedTrackUri: string,
) => {
  if (!playlistTrack) {
    return false;
  }

  const requestedTrackId = extractSpotifyTrackId(requestedTrackUri);
  const candidateValues = [
    playlistTrack.uri,
    playlistTrack.id,
    playlistTrack.linked_from?.uri,
    playlistTrack.linked_from?.id,
  ].filter(Boolean) as string[];

  if (candidateValues.includes(requestedTrackUri)) {
    return true;
  }

  if (!requestedTrackId) {
    return false;
  }

  return candidateValues.some(
    (value) =>
      value === requestedTrackId ||
      extractSpotifyTrackId(value) === requestedTrackId,
  );
};

const getCurrentSpotifyUser = async (userId: string, token: string) => {
  const profileResponse = await spotifyFetch(
    "https://api.spotify.com/v1/me",
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
    userId,
  );

  if (!profileResponse.ok) {
    const errorData = await safeJsonParse(profileResponse);
    console.error(
      "Error fetching Spotify profile for playlists:",
      profileResponse.status,
      errorData,
    );

    return {
      ok: false as const,
      response: profileResponse,
      userId: null,
    };
  }

  const profileData = (await safeJsonParse(profileResponse)) || {};

  return {
    ok: true as const,
    response: profileResponse,
    userId: profileData.id as string | null,
  };
};

const getPlaylistOwnership = async (
  userId: string,
  token: string,
  playlistId: string,
) => {
  const cKey = ownershipCacheKey(userId, playlistId);
  const cachedPlaylist = spotifyCache.get<RawSpotifyPlaylist>(cKey);
  if (cachedPlaylist) {
    return { ok: true as const, playlist: cachedPlaylist };
  }

  const fields = "id,name,owner(id,display_name)";
  const response = await spotifyFetch(
    `https://api.spotify.com/v1/playlists/${playlistId}?fields=${encodeURIComponent(fields)}`,
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
    console.error(
      `Error fetching Spotify playlist ownership ${playlistId}:`,
      response.status,
      errorData,
    );

    return {
      ok: false as const,
      playlist: null,
    };
  }

  const playlist = ((await safeJsonParse(response)) || {}) as RawSpotifyPlaylist;
  spotifyCache.set(cKey, playlist, TTL_OWNERSHIP);

  return {
    ok: true as const,
    playlist,
  };
};


const getPlaylistSummary = async (
  userId: string,
  token: string,
  playlistId: string,
) => {
  const fields =
    "id,name,images,owner(id,display_name),tracks(total),items(total)";
  const response = await spotifyFetch(
    `https://api.spotify.com/v1/playlists/${playlistId}?fields=${encodeURIComponent(fields)}`,
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
    console.error(
      `Error fetching Spotify playlist summary ${playlistId}:`,
      response.status,
      errorData,
    );

    return {
      ok: false as const,
      playlist: null,
    };
  }

  return {
    ok: true as const,
    playlist: ((await safeJsonParse(response)) || {}) as RawSpotifyPlaylist,
  };
};

const checkTrackInPlaylist = async (
  userId: string,
  token: string,
  playlistId: string,
  trackUri: string,
  returnEarly: boolean = true,
) => {
  // Cache the result to avoid redundant full-playlist scans.
  const cKey = trackInPlaylistCacheKey(userId, playlistId, trackUri);
  const cached = spotifyCache.get<{ ok: boolean; occurrences: number; isInPlaylist: boolean }>(cKey);
  if (cached) return cached;

  // Do NOT use a 'fields' filter â€” Spotify silently omits items for local files / episodes.
  // Note: Spotify's API returns the track object under the key 'item' (not 'track') in
  // newer responses. We fall back to 'track' for compatibility.
  let nextUrl: string | null = `https://api.spotify.com/v1/playlists/${playlistId}/items?limit=50`;

  let occurrences = 0;

  while (nextUrl) {
    const response = await spotifyFetch(
      nextUrl,
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
      console.error(
        `Error checking Spotify playlist (${playlistId}):`,
        response.status,
        errorData,
      );

      return {
        ok: false as const,
        occurrences: 0,
        isInPlaylist: false,
      };
    }

    const data = (await safeJsonParse(response)) || {};
    const items = Array.isArray(data.items) ? data.items : [];

    for (const playlistItem of items) {
      // Spotify returns the track object under 'item' in newer API responses,
      // falling back to 'track' for older response formats.
      const t = playlistItem?.item ?? playlistItem?.track;
      if (trackMatchesRequestedTrack(t, trackUri)) {
        occurrences += 1;

        if (returnEarly) {
          const result = { ok: true as const, occurrences, isInPlaylist: true };
          spotifyCache.set(cKey, result, TTL_TRACK_IN_PLAYLIST);
          return result;
        }
      }
    }

    nextUrl = typeof data.next === "string" ? data.next : null;
  }

  const result = { ok: true as const, occurrences, isInPlaylist: occurrences > 0 };
  spotifyCache.set(cKey, result, TTL_TRACK_IN_PLAYLIST);
  return result;
};

const getSpotifyAuthError = (status: number, message: string) => {
  if (status === 401) {
    return {
      status: 200,
      body: {
        playlists: [],
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
        playlists: [],
        connected: true,
        cached: false,
        error: message,
      },
    };
  }

  return {
    status,
    body: { error: "Spotify API request failed." },
  };
};

export const getSpotifyPlaylists = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.userId as string;
    const trackUri =
      typeof req.query.trackUri === "string" ? req.query.trackUri : null;


    const token = await getValidSpotifyToken(userId);

    if (!token) {
      return res.json({ playlists: [], connected: false, cached: false });
    }

    // Try to serve the base playlist list from cache (avoids the heavy
    // multi-request fan-out to Spotify on every TrackPlaylistPicker open).
    const baseCacheKey = playlistCacheKey(userId);
    let basePlaylists = spotifyCache.get<SpotifyPlaylistSummary[]>(baseCacheKey);

    if (!basePlaylists) {
      const [profileResult, playlistsResponse] = await Promise.all([
        getCurrentSpotifyUser(userId, token),
        spotifyFetch(
          "https://api.spotify.com/v1/me/playlists?limit=50",
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
          userId,
        ),
      ]);

      if (!profileResult.ok) {
        const errorResponse = getSpotifyAuthError(
          profileResult.response.status,
          "Spotify denied access to your playlists. Reconnect Spotify to grant playlist permissions.",
        );

        return res.status(errorResponse.status).json(errorResponse.body);
      }

      if (!playlistsResponse.ok) {
        const errorData = await safeJsonParse(playlistsResponse);
        console.error(
          "Error fetching Spotify playlists:",
          playlistsResponse.status,
          errorData,
        );

        const errorResponse = getSpotifyAuthError(
          playlistsResponse.status,
          "Spotify denied access to your playlists. Reconnect Spotify to grant playlist permissions.",
        );

        return res.status(errorResponse.status).json(errorResponse.body);
      }

      const data = (await safeJsonParse(playlistsResponse)) || { items: [] };
      const rawPlaylists = (data.items || []) as RawSpotifyPlaylist[];
      const currentSpotifyUserId = profileResult.userId;
      const ownedPlaylists = rawPlaylists.filter((playlist) =>
        Boolean(
          currentSpotifyUserId && playlist.owner?.id === currentSpotifyUserId,
        ),
      );
      const playlistSummaries = await Promise.all(
        ownedPlaylists.map((playlist) =>
          getPlaylistSummary(userId, token, playlist.id),
        ),
      );
      basePlaylists = playlistSummaries
        .filter((result) => result.ok && result.playlist)
        .map((playlist) => {
          const resolvedPlaylist = (playlist as { playlist: RawSpotifyPlaylist })
            .playlist;

          return {
            id: resolvedPlaylist.id,
            name: resolvedPlaylist.name || "Untitled playlist",
            ownerName: resolvedPlaylist.owner?.display_name || "Unknown owner",
            image: resolvedPlaylist.images?.[0]?.url || null,
            tracksTotal:
              resolvedPlaylist.tracks?.total ??
              resolvedPlaylist.items?.total ??
              0,
            canModify: true,
          } satisfies SpotifyPlaylistSummary;
        });

      spotifyCache.set(baseCacheKey, basePlaylists, TTL_PLAYLISTS_BASE);
    }

    const playlists = trackUri
      ? await Promise.all(
          basePlaylists.map(async (playlist) => {
            const trackLookup = await checkTrackInPlaylist(
              userId,
              token,
              playlist.id,
              trackUri,
            );

            return {
              ...playlist,
              containsTrack: trackLookup.ok
                ? trackLookup.occurrences > 0
                : false,
              trackOccurrences: trackLookup.ok ? trackLookup.occurrences : 0,
            };
          }),
        )
      : basePlaylists;

    res.json({ playlists, connected: true, cached: false });
  } catch (error) {
    next(error);
  }
};

export const addTrackToSpotifyPlaylists = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.userId as string;
    const { playlistIds, trackUri, forceAddToPlaylistIds } = req.body as {
      playlistIds?: string[];
      trackUri?: string;
      forceAddToPlaylistIds?: string[];
    };


    if (!trackUri || !Array.isArray(playlistIds) || playlistIds.length === 0) {
      return res.status(400).json({
        error: "trackUri and at least one playlistId are required.",
      });
    }

    const forceAddSet = new Set(
      Array.isArray(forceAddToPlaylistIds) ? forceAddToPlaylistIds : [],
    );

    const token = await getValidSpotifyToken(userId);

    if (!token) {
      return res.status(404).json({
        error: "Spotify account not connected or token expired",
      });
    }

    const profileResult = await getCurrentSpotifyUser(userId, token);

    if (!profileResult.ok) {
      return res.status(profileResult.response.status).json({
        error:
          "Failed to validate the Spotify account before modifying playlists.",
      });
    }

    const verifiedPlaylists = await Promise.all(
      playlistIds.map((playlistId) =>
        getPlaylistOwnership(userId, token, playlistId),
      ),
    );

    const filteredPlaylistIds = verifiedPlaylists
      .filter((result) => result.ok && result.playlist)
      .map((result) => result.playlist as RawSpotifyPlaylist)
      .filter((playlist) => {
        const ownerId = playlist.owner?.id;
        return Boolean(
          profileResult.userId && ownerId === profileResult.userId,
        );
      })
      .map((playlist) => playlist.id);

    if (filteredPlaylistIds.length === 0) {
      return res.status(403).json({
        error:
          "The selected playlist is not owned by the connected Spotify account, so Beatwave cannot modify it.",
      });
    }

    const duplicateChecks = await Promise.all(
      filteredPlaylistIds.map(async (playlistId) => {
        const lookup = await checkTrackInPlaylist(
          userId,
          token,
          playlistId,
          trackUri,
          false,
        );

        return {
          playlistId,
          containsTrack: lookup.ok ? lookup.isInPlaylist : false,
          trackOccurrences: lookup.ok ? lookup.occurrences : 0,
        };
      }),
    );

    const duplicatePlaylists = duplicateChecks.filter(
      (item) => item.containsTrack,
    );

    const playlistIdsToAdd = filteredPlaylistIds.filter((playlistId) => {
      const duplicateInfo = duplicatePlaylists.find(
        (item) => item.playlistId === playlistId,
      );

      if (!duplicateInfo) {
        return true;
      }

      return forceAddSet.has(playlistId);
    });

    const duplicatePlaylistsNotForced = duplicatePlaylists.filter(
      (item) => !forceAddSet.has(item.playlistId),
    );

    if (duplicatePlaylistsNotForced.length > 0) {
      return res.status(409).json({
        error: "Track already exists in selected playlist(s).",
        duplicatePlaylists: duplicatePlaylistsNotForced,
      });
    }

    const results = await Promise.all(
      playlistIdsToAdd.map(async (playlistId) => {
        const response = await spotifyFetch(
          `https://api.spotify.com/v1/playlists/${playlistId}/items`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ uris: [trackUri] }),
          },
          userId,
        );

        let errorData: any = null;

        if (!response.ok) {
          errorData = await safeJsonParse(response);
          console.error(
            `Error adding track to playlist ${playlistId}:`,
            response.status,
            errorData,
          );
        }

        return {
          playlistId,
          ok: response.ok,
          status: response.status,
          errorData,
        };
      }),
    );

    const failed = results.filter((result) => !result.ok);

    if (failed.length === 0) {
      // Invalidate caches for all modified playlists so the next load reflects truth.
      invalidatePlaylistCaches(userId, playlistIdsToAdd, trackUri);
      return res.json({
        success: true,
        addedTo: playlistIdsToAdd.length,
        duplicatePlaylistsSkipped: duplicatePlaylistsNotForced,
      });
    }

    const firstFailure = failed[0];

    if (firstFailure.status === 401) {
      return res.status(401).json({
        error: "Spotify access token expired or invalid.",
      });
    }

    if (firstFailure.status === 403) {
      const spotifyMessage =
        typeof firstFailure.errorData?.error?.message === "string"
          ? firstFailure.errorData.error.message
          : null;
      return res.status(403).json({
        error:
          spotifyMessage ||
          "Spotify still denied permission to modify the selected playlist. Check your OAuth scopes.",
      });
    }

    return res.status(firstFailure.status || 500).json({
      error: "Failed to add the track to one or more playlists.",
    });
  } catch (error) {
    next(error);
  }
};

export const checkTrackInSpotifyPlaylists = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.userId as string;
    const { playlistIds, trackUri } = req.body as {
      playlistIds?: string[];
      trackUri?: string;
    };


    if (!trackUri || !Array.isArray(playlistIds) || playlistIds.length === 0) {
      return res.status(400).json({
        error: "trackUri and at least one playlistId are required.",
      });
    }

    const token = await getValidSpotifyToken(userId);

    if (!token) {
      return res.status(404).json({
        error: "Spotify account not connected or token expired",
      });
    }

    const profileResult = await getCurrentSpotifyUser(userId, token);

    if (!profileResult.ok) {
      return res.status(profileResult.response.status).json({
        error:
          "Failed to validate the Spotify account before checking playlists.",
      });
    }

    const verifiedPlaylists = await Promise.all(
      playlistIds.map((playlistId) =>
        getPlaylistOwnership(userId, token, playlistId),
      ),
    );

    const filteredPlaylistIds = verifiedPlaylists
      .filter((result) => result.ok && result.playlist)
      .map((result) => result.playlist as RawSpotifyPlaylist)
      .filter((playlist) => {
        const ownerId = playlist.owner?.id;
        return Boolean(
          profileResult.userId && ownerId === profileResult.userId,
        );
      })
      .map((playlist) => playlist.id);

    if (filteredPlaylistIds.length === 0) {
      return res.status(403).json({
        error:
          "None of the selected playlists are owned by the connected Spotify account, so Beatwave cannot modify them.",
      });
    }

    const checks = await Promise.all(
      filteredPlaylistIds.map(async (playlistId) => {
        const lookup = await checkTrackInPlaylist(
          userId,
          token,
          playlistId,
          trackUri,
          true,
        );

        return {
          playlistId,
          containsTrack: lookup.ok ? lookup.isInPlaylist : false,
          trackOccurrences: lookup.ok ? lookup.occurrences : 0,
          checked: lookup.ok,
        };
      }),
    );

    return res.json({
      success: true,
      checks,
    });
  } catch (error) {
    next(error);
  }
};

export const removeTrackFromSpotifyPlaylist = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.userId as string;
    const { playlistId, trackUri } = req.body as {
      playlistId?: string;
      trackUri?: string;
    };


    if (!playlistId || !trackUri) {
      return res.status(400).json({
        error: "playlistId and trackUri are required.",
      });
    }

    const token = await getValidSpotifyToken(userId);

    if (!token) {
      return res.status(404).json({
        error: "Spotify account not connected or token expired",
      });
    }

    const profileResult = await getCurrentSpotifyUser(userId, token);

    if (!profileResult.ok) {
      return res.status(profileResult.response.status).json({
        error:
          "Failed to validate the Spotify account before modifying playlists.",
      });
    }

    const ownershipResult = await getPlaylistOwnership(
      userId,
      token,
      playlistId,
    );

    if (!ownershipResult.ok || !ownershipResult.playlist) {
      return res.status(403).json({
        error:
          "The selected playlist is not owned by the connected Spotify account, so Beatwave cannot modify it.",
      });
    }

    if (ownershipResult.playlist.owner?.id !== profileResult.userId) {
      return res.status(403).json({
        error:
          "The selected playlist is not owned by the connected Spotify account, so Beatwave cannot modify it.",
      });
    }

    const removeResponse = await spotifyFetch(
      `https://api.spotify.com/v1/playlists/${playlistId}/items`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tracks: [{ uri: trackUri }],
        }),
      },
      userId,
    );

    if (!removeResponse.ok) {
      const errorData = await safeJsonParse(removeResponse);
      console.error(
        `Error removing track from playlist ${playlistId}:`,
        removeResponse.status,
        errorData,
      );

      return res.status(removeResponse.status || 500).json({
        error: "Failed to remove the track from the playlist.",
      });
    }

    invalidatePlaylistCaches(userId, [playlistId], trackUri);

    return res.json({
      success: true,
      removedFrom: playlistId,
    });
  } catch (error) {
    next(error);
  }
};
