import { getValidSpotifyToken } from "../controllers/spotifyController";

/**
 * Safely parses JSON from a Fetch Response. If the response body is HTML or invalid JSON,
 * it catches the syntax error and returns rather than crashing.
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

/**
 * Enhanced fetch wrapper for Spotify API that handles:
 * - 429 Rate Limiting with exponential backoff honoring "Retry-After" bounds
 * - 401 Unauthorized token refreshing recursively
 * - Request timeouts via AbortController
 */
export const spotifyFetch = async (
  url: string,
  options: RequestInit,
  userId: string,
  retries: number = 2,
): Promise<Response> => {
  // Add an 8-second timeout to prevent hovering requests
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);

  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(timeoutId);

    // Handle 429 Rate Limiting
    if (res.status === 429) {
      const retryAfter = res.headers.get("Retry-After");
      // Fallback exponential backoff or use headers
      const waitTime = retryAfter ? parseInt(retryAfter) * 1000 : 3000;

      if (retries > 0) {
        console.warn(
          `Spotify rate limited 429. User ${userId} waiting for ${waitTime}ms...`,
        );
        await new Promise((resolve) => setTimeout(resolve, waitTime));
        // Retry the request
        return spotifyFetch(url, options, userId, retries - 1);
      }
    }

    // Handle 401 Expired Access Token — only attempt one refresh
    if (res.status === 401 && retries > 0) {
      console.log(`Spotify 401 for user ${userId}, coercing token refresh.`);
      const newToken = await getValidSpotifyToken(userId, true);

      if (newToken) {
        // Retry with new token, but set retries to 0 so we don't loop
        // if the refreshed token is also rejected
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

    // Check if it's the abort controller's timeout error
    if (error.name === "AbortError") {
      console.error(
        `Spotify network request timed out for user ${userId} at ${url}`,
      );
    }
    throw error;
  }
};
