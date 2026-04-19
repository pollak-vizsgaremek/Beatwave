import { prisma } from "./prisma";

export const TIMEOUT_USER_ACTION = "TIMEOUT_USER";
export const CLEAR_USER_TIMEOUT_ACTION = "CLEAR_USER_TIMEOUT";
const TIMEOUT_META_PREFIX = "TIMEOUT_META=";
const TIMEOUT_META_V2_PREFIX = "TIMEOUT_META_V2|";
const MAX_TIMEOUT_REASON_IN_LOG = 110;

export interface ActiveUserTimeout {
  userId: string;
  until: Date;
  reason: string;
}

const normalizeReasonForLog = (reason: string) =>
  reason.replace(/\s+/g, " ").replace(/\|/g, "/").trim();

const toTimeoutMetaLineV2 = (payload: { until: string; reason: string }) => {
  const normalizedReason = normalizeReasonForLog(payload.reason).slice(
    0,
    MAX_TIMEOUT_REASON_IN_LOG,
  );
  return `${TIMEOUT_META_V2_PREFIX}${payload.until}|${normalizedReason}`;
};

const parseTimeoutMetaLine = (details: string) => {
  const line = details
    .split("\n")
    .find(
      (entry) =>
        entry.startsWith(TIMEOUT_META_V2_PREFIX) ||
        entry.startsWith(TIMEOUT_META_PREFIX),
    );

  if (!line) {
    return null;
  }

  if (line.startsWith(TIMEOUT_META_V2_PREFIX)) {
    const body = line.slice(TIMEOUT_META_V2_PREFIX.length);
    const separatorIndex = body.indexOf("|");
    if (separatorIndex === -1) {
      return null;
    }

    const untilRaw = body.slice(0, separatorIndex);
    const reasonRaw = body.slice(separatorIndex + 1).trim();
    if (!untilRaw || !reasonRaw) {
      return null;
    }

    const until = new Date(untilRaw);
    if (Number.isNaN(until.getTime())) {
      return null;
    }

    return {
      until,
      reason: reasonRaw,
    };
  }

  try {
    const parsed = JSON.parse(line.slice(TIMEOUT_META_PREFIX.length)) as {
      until?: string;
      reason?: string;
    };

    if (!parsed?.until || !parsed?.reason) {
      return null;
    }

    const until = new Date(parsed.until);
    if (Number.isNaN(until.getTime())) {
      return null;
    }

    return {
      until,
      reason: parsed.reason,
    };
  } catch {
    return null;
  }
};

export const buildTimeoutLogDetails = (
  username: string,
  moderatorUsername: string,
  until: Date,
  reason: string,
) =>
  toTimeoutMetaLineV2({
    until: until.toISOString(),
    reason,
  });

const getLatestTimeoutDecision = async (userId: string) => {
  return prisma.moderationLog.findFirst({
    where: {
      userId,
      action: {
        in: [TIMEOUT_USER_ACTION, CLEAR_USER_TIMEOUT_ACTION],
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });
};

export const getActiveUserTimeout = async (
  userId: string,
): Promise<ActiveUserTimeout | null> => {
  const decision = await getLatestTimeoutDecision(userId);
  if (!decision || decision.action !== TIMEOUT_USER_ACTION) {
    return null;
  }

  const meta = parseTimeoutMetaLine(decision.details);
  if (!meta) {
    return null;
  }

  if (meta.until.getTime() <= Date.now()) {
    return null;
  }

  return {
    userId,
    until: meta.until,
    reason: meta.reason,
  };
};

export const getActiveTimeoutMap = async (userIds: string[]) => {
  const uniqueUserIds = Array.from(new Set(userIds.filter(Boolean)));
  if (uniqueUserIds.length === 0) {
    return new Map<string, ActiveUserTimeout>();
  }

  const decisions = await prisma.moderationLog.findMany({
    where: {
      userId: {
        in: uniqueUserIds,
      },
      action: {
        in: [TIMEOUT_USER_ACTION, CLEAR_USER_TIMEOUT_ACTION],
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const map = new Map<string, ActiveUserTimeout>();
  const seen = new Set<string>();

  for (const decision of decisions) {
    if (seen.has(decision.userId)) {
      continue;
    }

    seen.add(decision.userId);

    if (decision.action !== TIMEOUT_USER_ACTION) {
      continue;
    }

    const meta = parseTimeoutMetaLine(decision.details);
    if (!meta) {
      continue;
    }

    if (meta.until.getTime() <= Date.now()) {
      continue;
    }

    map.set(decision.userId, {
      userId: decision.userId,
      until: meta.until,
      reason: meta.reason,
    });
  }

  return map;
};
