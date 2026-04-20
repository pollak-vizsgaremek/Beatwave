    import NodeCache from "node-cache";

// TTL of 60 minutes (3600s), cleanup check every 10 mins (600s)
export const spotifyCache = new NodeCache({ stdTTL: 3600, checkperiod: 600 });

export const SPOTIFY_AUTH_URL = "https://accounts.spotify.com/authorize";
export const SPOTIFY_TOKEN_URL = "https://accounts.spotify.com/api/token";
