import api from "../utils/api";

export const spotifyPlaylistController = {
  getPlaylists: (trackUri?: string, trackId?: string | number) =>
    api.get("/auth/spotify/playlists", {
      params:
        trackUri || trackId !== undefined
          ? { ...(trackUri ? { trackUri } : {}), ...(trackId !== undefined ? { trackId } : {}) }
          : undefined,
    }),
  checkTrackInPlaylists: (
    playlistIds: string[],
    trackUri: string,
    trackId?: string | number,
  ) =>
    api.post("/auth/spotify/playlists/check-track", {
      playlistIds,
      trackUri,
      trackId,
    }),
  addTrackToPlaylists: (
    playlistIds: string[],
    trackUri: string,
    trackId?: string | number,
    forceAddToPlaylistIds?: string[],
  ) =>
    api.post("/auth/spotify/playlists/add-track", {
      playlistIds,
      trackUri,
      trackId,
      forceAddToPlaylistIds,
    }),
  removeTrackFromPlaylist: (
    playlistId: string,
    trackUri: string,
    trackId?: string | number,
  ) =>
    api.delete("/auth/spotify/playlists/remove-track", {
      data: { playlistId, trackUri, trackId },
    }),
};
