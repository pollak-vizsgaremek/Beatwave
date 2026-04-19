import api from "../utils/api";

export const spotifyPlaylistController = {
  getPlaylists: (trackUri?: string) =>
    api.get("/auth/spotify/playlists", {
      params: trackUri ? { trackUri } : undefined,
    }),
  checkTrackInPlaylists: (playlistIds: string[], trackUri: string) =>
    api.post("/auth/spotify/playlists/check-track", { playlistIds, trackUri }),
  addTrackToPlaylists: (
    playlistIds: string[],
    trackUri: string,
    forceAddToPlaylistIds?: string[],
  ) =>
    api.post("/auth/spotify/playlists/add-track", {
      playlistIds,
      trackUri,
      forceAddToPlaylistIds,
    }),
  removeTrackFromPlaylist: (playlistId: string, trackUri: string) =>
    api.delete("/auth/spotify/playlists/remove-track", {
      data: { playlistId, trackUri },
    }),
};
