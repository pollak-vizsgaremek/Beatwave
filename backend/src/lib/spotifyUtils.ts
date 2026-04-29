import config from "../config/config";
import { prisma } from "./prisma";

/**
 * Safely parses JSON from a Fetch Response. If the response body is HTML or invalid JSON,
 * it catches the syntax error and returns null rather than crashing.
 */
export const safeJsonParse = async (response: Response): Promise<any> => {
  if (response.status === 204) return null; // No content

  const text = await response.text();
  try {
    return text ? JSON.parse(text) : null;
  } catch (error) {
    console.error(
      "Failed to parse Spotify response JSON:",
      text.substring(0, 200),
    );
    return null;
  }
};

const SPOTIFY_TOKEN_URL = "https://accounts.spotify.com/api/token";

/**
 * Returns a valid Spotify access token for the given user, refreshing it
 * automatically if it has expired (or if forceRefresh is true).
 *
 * Moved here from spotifyController to break the circular import cycle:
 *   spotifyUtils → spotifyController → spotifyUtils
 */
export const getValidSpotifyToken = async (
  userId: string,
  forceRefresh: boolean = false,
): Promise<string | null> => {
  try {
    const connection = await prisma.connectedApp.findFirst({
      where: { userId, platform: "Spotify" },
    });

    if (!connection || !connection.accessToken) {
      return null;
    }

    // Check if token is expired, with a 1-minute buffer
    const isExpired =
      connection.expiresAt &&
      connection.expiresAt.getTime() - Date.now() < 60000;

    if (!isExpired && !forceRefresh) {
      return connection.accessToken;
    }

    if (!connection.refreshToken) {
      console.warn(
        "Spotify token expired but no refresh token available for user",
        userId,
      );
      return null;
    }


    const authHeader = Buffer.from(
      `${config.spotifyClientId}:${config.spotifyClientSecret}`,
    ).toString("base64");

    const refreshResponse = await fetch(SPOTIFY_TOKEN_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${authHeader}`,
      },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: connection.refreshToken,
      }).toString(),
    });

    const data = await refreshResponse.json();

    if (!refreshResponse.ok) {
      console.error("Failed to refresh Spotify token:", data);
      return null;
    }

    const newAccessToken = data.access_token;
    // Sometimes Spotify doesn't return a new refresh token — keep the existing one
    const newRefreshToken = data.refresh_token || connection.refreshToken;
    const newExpiresAt = data.expires_in
      ? new Date(Date.now() + data.expires_in * 1000)
      : new Date(Date.now() + 3600 * 1000); // Default to 1 hour if omitted

    await prisma.connectedApp.update({
      where: { id: connection.id },
      data: {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
        expiresAt: newExpiresAt,
      },
    });

    return newAccessToken;
  } catch (error) {
    console.error("Error validating Spotify token:", error);
    return null;
  }
};

/**
 * Enhanced fetch wrapper for Spotify API that handles:
 * - 429 Rate Limiting with exponential backoff honouring "Retry-After" header
 * - 401 Unauthorized token refreshing (one attempt only to avoid infinite loops)
 * - Request timeouts via AbortController
 */
export const spotifyFetch = async (
  url: string,
  options: RequestInit,
  userId: string,
  retries: number = 2,
): Promise<Response> => {
  // Add an 8-second timeout to prevent hanging requests
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);

  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(timeoutId);

    // Handle 429 Rate Limiting
    if (res.status === 429) {
      const retryAfter = res.headers.get("Retry-After");
      const waitTime = retryAfter ? parseInt(retryAfter) * 1000 : 3000;

      if (retries > 0) {
        console.warn(
          `Spotify rate limited (429). User ${userId} waiting ${waitTime}ms before retry...`,
        );
        await new Promise((resolve) => setTimeout(resolve, waitTime));
        return spotifyFetch(url, options, userId, retries - 1);
      }
    }

    // Handle 401 Expired Access Token — only attempt one refresh
    if (res.status === 401 && retries > 0) {
      const newToken = await getValidSpotifyToken(userId, true);

      if (newToken) {
        // Retry with the refreshed token but cap retries at 0 to prevent loops
        const newOptions = {
          ...options,
          headers: {
            ...options.headers,
            Authorization: `Bearer ${newToken}`,
          },
        };
        return spotifyFetch(url, newOptions, userId, 0);
      }
    }

    return res;
  } catch (error: any) {
    clearTimeout(timeoutId);

    if (error.name === "AbortError") {
      console.error(
        `Spotify network request timed out for user ${userId} at ${url}`,
      );
    }
    throw error;
  }
};
