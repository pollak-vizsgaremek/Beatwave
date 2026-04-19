import { prisma } from "./prisma";

const MODERATION_ROLES = ["ADMIN", "MODERATOR"] as const;

interface ModerationAlertOptions {
  message: string;
  link?: string;
  triggeredById?: string;
  excludeUserIds?: string[];
}

export const notifyModerationTeam = async ({
  message,
  link = "/admin?tab=logs",
  triggeredById,
  excludeUserIds = [],
}: ModerationAlertOptions) => {
  const recipients = await prisma.user.findMany({
    where: {
      role: {
        in: [...MODERATION_ROLES],
      },
      id: {
        notIn: excludeUserIds.filter(Boolean),
      },
    },
    select: {
      id: true,
    },
  });

  if (!recipients.length) {
    return;
  }

  await prisma.notification.createMany({
    data: recipients.map((recipient) => ({
      type: "moderation_report",
      message,
      link,
      userId: recipient.id,
      triggeredById,
    })),
  });
};
