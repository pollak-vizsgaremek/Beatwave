import { Request, Response, NextFunction } from "express";
import {
  getValidSpotifyToken,
  safeJsonParse,
  spotifyFetch,
} from "../../lib/spotifyUtils";

type SpotifyPlaylistSummary = {
  id: string;
  name: string;
  ownerName: string;
  image: string | null;
  tracksTotal: number;
  canModify: boolean;
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
      response,
      playlist: null,
    };
  }

  return {
    ok: true as const,
    response,
    playlist: ((await safeJsonParse(response)) || {}) as RawSpotifyPlaylist,
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
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const token = await getValidSpotifyToken(userId);

    if (!token) {
      return res.json({ playlists: [], connected: false, cached: false });
    }

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
      ownedPlaylists.map((playlist) => getPlaylistSummary(userId, token, playlist.id)),
    );
    const playlists = playlistSummaries
      .filter((result) => result.ok && result.playlist)
      .map((playlist) => {
        const resolvedPlaylist = (playlist as { playlist: RawSpotifyPlaylist }).playlist;

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
        };
      });

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
    const userId = req.userId;
    const { playlistIds, trackUri } = req.body as {
      playlistIds?: string[];
      trackUri?: string;
    };

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

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

    const results = await Promise.all(
      filteredPlaylistIds.map(async (playlistId) => {
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
      return res.json({
        success: true,
        addedTo: filteredPlaylistIds.length,
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
