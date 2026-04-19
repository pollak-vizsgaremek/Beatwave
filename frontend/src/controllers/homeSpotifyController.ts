import api from "../utils/api";

export const spotifyPlayerController = {
  skipPrevious: () => api.post("/auth/spotify/player/previous"),
  play: () => api.put("/auth/spotify/player/play"),
  pause: () => api.put("/auth/spotify/player/pause"),
  skipNext: () => api.post("/auth/spotify/player/next"),
};
