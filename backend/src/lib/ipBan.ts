import type { Request } from "express";
import { prisma } from "./prisma";

const normalizeIp = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  return trimmed.startsWith("::ffff:") ? trimmed.slice(7) : trimmed;
};

export const getClientIp = (req: Request) => {
  const forwardedFor = req.headers["x-forwarded-for"];
  const rawForwarded = Array.isArray(forwardedFor)
    ? forwardedFor[0]
    : forwardedFor;

  const forwardedIp =
    typeof rawForwarded === "string" ? rawForwarded.split(",")[0] : null;

  return (
    normalizeIp(forwardedIp ?? "") ||
    normalizeIp(req.ip ?? "") ||
    normalizeIp(req.socket.remoteAddress ?? "")
  );
};

export const getActiveIpBanForAddress = async (ipAddress: string | null) => {
  if (!ipAddress) {
    return null;
  }

  return prisma.ipBan.findFirst({
    where: {
      ipAddress,
      OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
    },
    orderBy: {
      createdAt: "desc",
    },
  });
};

export const buildIpBanErrorMessage = (ban: {
  expiresAt: Date | null;
  reason: string;
}) => {
  const durationMessage = ban.expiresAt
    ? `until ${ban.expiresAt.toISOString()}`
    : "permanently";

  return `This IP address is banned ${durationMessage}. Reason: ${ban.reason}`;
};
