import api from "../utils/api";

export const spotifyPlaylistController = {
  getPlaylists: () => api.get("/auth/spotify/playlists"),
  addTrackToPlaylists: (playlistIds: string[], trackUri: string) =>
    api.post("/auth/spotify/playlists/add-track", { playlistIds, trackUri }),
};
