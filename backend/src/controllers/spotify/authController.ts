import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import config from "../../config/config";
import { prisma } from "../../lib/prisma";
import { SPOTIFY_AUTH_URL, SPOTIFY_TOKEN_URL } from "./shared";

export const getSpotifyAuthUrl = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.userId as string;

    const state = jwt.sign({ userId }, config.jwtSecret, { expiresIn: "10m" });

    const scope =
      "user-top-read user-read-currently-playing user-library-modify streaming app-remote-control user-read-playback-state user-modify-playback-state user-read-private user-read-email user-read-recently-played playlist-read-private playlist-read-collaborative playlist-modify-public playlist-modify-private";

    const params = new URLSearchParams({
      response_type: "code",
      client_id: config.spotifyClientId,
      scope: scope,
      redirect_uri: config.spotifyRedirectUri,
      state: state,
      show_dialog: "true",
    });

    res.json({ url: `${SPOTIFY_AUTH_URL}?${params.toString()}` });
  } catch (error) {
    next(error);
  }
};

export const spotifyCallback = async (
  req: Request,
  res: Response,
) => {
  const code = (req.query.code as string) || null;
  const state = (req.query.state as string) || null;
  const error = (req.query.error as string) || null;

  if (error) {
    return res.redirect(`${config.frontendUrl}/profile?spotify_error=${error}`);
  }

  if (!state || !code) {
    return res.redirect(
      `${config.frontendUrl}/profile?spotify_error=state_or_code_missing`,
    );
  }

  try {
    const decoded = jwt.verify(state, config.jwtSecret) as { userId: string };
    const userId = decoded.userId;

    if (!userId) {
      return res.redirect(
        `${config.frontendUrl}/profile?spotify_error=invalid_state`,
      );
    }

    const authHeader = Buffer.from(
      `${config.spotifyClientId}:${config.spotifyClientSecret}`,
    ).toString("base64");

    const tokenResponse = await fetch(SPOTIFY_TOKEN_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${authHeader}`,
      },
      body: new URLSearchParams({
        code: code,
        redirect_uri: config.spotifyRedirectUri,
        grant_type: "authorization_code",
      }).toString(),
    });

    const data = await tokenResponse.json();

    if (!tokenResponse.ok) {
      console.error("Spotify Token Error:", data);
      return res.redirect(
        `${config.frontendUrl}/profile?spotify_error=spotify_token_error`,
      );
    }

    const { access_token, refresh_token, expires_in } = data;

    let expiresAt: Date | undefined;
    if (expires_in) {
      expiresAt = new Date(Date.now() + expires_in * 1000);
    }

    await prisma.connectedApp.upsert({
      where: {
        userId_platform: {
          userId: userId,
          platform: "Spotify",
        },
      },
      update: {
        accessToken: access_token,
        refreshToken: refresh_token || undefined,
        expiresAt: expiresAt,
        connectedAt: new Date(),
      },
      create: {
        platform: "Spotify",
        accessToken: access_token,
        refreshToken: refresh_token,
        expiresAt: expiresAt,
        userId: userId,
      },
    });

    res.redirect(`${config.frontendUrl}/profile?spotify_status=success`);
  } catch (error) {
    console.error("Spotify Callback Error:", error);
    res.redirect(`${config.frontendUrl}/profile?spotify_error=server_error`);
  }
};
