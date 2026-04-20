import { prisma } from "./prisma";
import { getActiveUserTimeout } from "./userTimeout";

const BLOCKED_USER_MESSAGE =
  "Your account has been blocked from posting and commenting.";

export type UserContributionAccessResult = {
  status: number;
  error: string;
} | null;

export const ensureUserCanContribute = async (
  userId: string,
): Promise<UserContributionAccessResult> => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, isBlocked: true },
  });

  if (!user) {
    return { status: 404, error: "User not found" };
  }

  if (user.isBlocked) {
    return { status: 403, error: BLOCKED_USER_MESSAGE };
  }

  const timeout = await getActiveUserTimeout(userId);
  if (timeout) {
    return {
      status: 403,
      error: `You are timed out from posting and commenting until ${timeout.until.toISOString()}. Reason: ${timeout.reason}`,
    };
  }

  return null;
};
