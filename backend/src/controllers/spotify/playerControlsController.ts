import { Request, Response, NextFunction } from "express";
import {
  getValidSpotifyToken,
  safeJsonParse,
  spotifyFetch,
} from "../../lib/spotifyUtils";
import { spotifyCache } from "./shared";

interface SpotifyDevice {
  id: string;
  name?: string;
  type?: string;
  is_active: boolean;
  is_restricted: boolean;
}

const clearPlaybackCache = (userId: string) => {
  spotifyCache.del(`${userId}-currently-playing`);
  const recentPrefix = `${userId}-recently-played-`;

  for (const key of spotifyCache.keys()) {
    if (key.startsWith(recentPrefix)) {
      spotifyCache.del(key);
    }
  }
};

const getPlayableDevices = async (userId: string, token: string) => {
  const devicesResponse = await spotifyFetch(
    "https://api.spotify.com/v1/me/player/devices",
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
    userId,
  );

  if (!devicesResponse.ok) {
    const errorData = await safeJsonParse(devicesResponse);
    console.error("Spotify devices error:", errorData);

    return {
      ok: false as const,
      response: devicesResponse,
      device: null,
    };
  }

  const devicesData = (await safeJsonParse(devicesResponse)) || { devices: [] };
  const devices = ((devicesData.devices || []) as SpotifyDevice[]).filter(
    (item) => !item.is_restricted,
  );

  return {
    ok: true as const,
    response: devicesResponse,
    devices,
  };
};

const transferPlaybackToDevice = async (
  userId: string,
  token: string,
  deviceId: string,
  play: boolean,
) => {
  const response = await spotifyFetch(
    "https://api.spotify.com/v1/me/player",
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        device_ids: [deviceId],
        play,
      }),
    },
    userId,
  );

  if (!response.ok) {
    const errorData = await safeJsonParse(response);
    console.error("Spotify transfer playback error:", errorData);
  }

  return response;
};

const handleSpotifyPlayerAction =
  (endpoint: string, method: "POST" | "PUT") =>
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.userId as string;


      const token = await getValidSpotifyToken(userId);

      if (!token) {
        return res.status(404).json({
          error: "Spotify account not connected or token expired",
        });
      }

      const deviceResult = await getPlayableDevices(userId, token);

      if (!deviceResult.ok) {
        if (deviceResult.response.status === 401) {
          return res.status(401).json({
            error: "Spotify access token expired or invalid.",
          });
        }

        if (deviceResult.response.status === 403) {
          return res.status(403).json({
            error: "Insufficient permissions for Spotify player control.",
          });
        }

        return res.status(deviceResult.response.status).json({
          error: `Spotify API error: ${deviceResult.response.statusText}`,
        });
      }

      if (deviceResult.devices.length === 0) {
        return res.status(404).json({
          error:
            "Spotify did not report any available playback devices. Open Spotify on this account and keep the player active.",
        });
      }

      const activeDevice =
        deviceResult.devices.find((device) => device.is_active) ||
        deviceResult.devices[0];

      if (!activeDevice?.id) {
        return res.status(404).json({
          error:
            "Spotify found devices, but none could be controlled from the API.",
        });
      }

      if (!activeDevice.is_active) {
        const transferResponse = await transferPlaybackToDevice(
          userId,
          token,
          activeDevice.id,
          endpoint === "play",
        );

        if (!transferResponse.ok) {
          if (transferResponse.status === 401) {
            return res.status(401).json({
              error: "Spotify access token expired or invalid.",
            });
          }

          if (transferResponse.status === 403) {
            return res.status(403).json({
              error:
                "Spotify refused playback transfer. This usually requires Spotify Premium and an active device on the same account.",
            });
          }

          return res.status(transferResponse.status).json({
            error: `Spotify playback transfer failed: ${transferResponse.statusText}`,
          });
        }
      }

      const params = new URLSearchParams({
        device_id: activeDevice.id,
      });

      const response = await spotifyFetch(
        `https://api.spotify.com/v1/me/player/${endpoint}?${params.toString()}`,
        {
          method,
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
        userId,
      );

      if (response.ok) {
        clearPlaybackCache(userId);
        return res.status(200).json({ success: true });
      }

      const errorData = await safeJsonParse(response);
      console.error(`Spotify player ${endpoint} error:`, errorData);

      if (response.status === 401) {
        return res.status(401).json({
          error: "Spotify access token expired or invalid.",
        });
      }

      if (response.status === 403) {
        return res.status(403).json({
          error: "Insufficient permissions for Spotify player control.",
        });
      }

      if (response.status === 404) {
        return res.status(404).json({
          error:
            "Spotify could not control the selected playback device. Make sure the Spotify desktop app is open on the same account.",
        });
      }

      return res
        .status(response.status)
        .json({ error: `Spotify API error: ${response.statusText}` });
    } catch (error) {
      next(error);
    }
  };

export const skipSpotifyPrevious = handleSpotifyPlayerAction(
  "previous",
  "POST",
);
export const playSpotifyTrack = handleSpotifyPlayerAction("play", "PUT");
export const pauseSpotifyTrack = handleSpotifyPlayerAction("pause", "PUT");
export const skipSpotifyNext = handleSpotifyPlayerAction("next", "POST");
