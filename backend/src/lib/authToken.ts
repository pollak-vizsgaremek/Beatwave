import { createHash } from "crypto";
import type { Request } from "express";

export const AUTH_COOKIE_NAME = "beatwave_token";

export const extractBearerToken = (authHeader?: string) => {
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }

  const token = authHeader.slice(7).trim();
  return token || null;
};

export const hashToken = (token: string) =>
  createHash("sha256").update(token).digest("hex");

export const parseCookieHeader = (cookieHeader?: string) => {
  const parsed: Record<string, string> = {};

  if (!cookieHeader) {
    return parsed;
  }

  for (const segment of cookieHeader.split(";")) {
    const separatorIndex = segment.indexOf("=");
    if (separatorIndex === -1) {
      continue;
    }

    const rawKey = segment.slice(0, separatorIndex).trim();
    const rawValue = segment.slice(separatorIndex + 1).trim();

    if (!rawKey) {
      continue;
    }

    parsed[rawKey] = decodeURIComponent(rawValue);
  }

  return parsed;
};

export const getTokenFromRequest = (req: Request) => {
  const bearerToken = extractBearerToken(req.headers.authorization);
  if (bearerToken) {
    return bearerToken;
  }

  const cookies = parseCookieHeader(req.headers.cookie);
  return cookies[AUTH_COOKIE_NAME] ?? null;
};
