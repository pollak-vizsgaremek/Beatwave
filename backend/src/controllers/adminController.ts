import { Request, Response, NextFunction } from "express";
import { prisma } from "../lib/prisma";
import {
  buildTimeoutLogDetails,
  CLEAR_USER_TIMEOUT_ACTION,
  getActiveTimeoutMap,
  getActiveUserTimeout,
  TIMEOUT_USER_ACTION,
} from "../lib/userTimeout";

const VALID_USER_ROLES = ["USER", "MODERATOR", "ADMIN"] as const;
const MAX_TIMEOUT_MINUTES = 60 * 24 * 30;
const MAX_TIMEOUT_REASON_LENGTH = 110;
const MAX_DELETE_REASON_LENGTH = 300;

const getValidatedDeleteReason = (reason: unknown) => {
  if (!reason || typeof reason !== "string" || !reason.trim()) {
    return { value: null, error: "Delete reason is required" } as const;
  }

  const trimmedReason = reason.trim();
  if (trimmedReason.length > MAX_DELETE_REASON_LENGTH) {
    return {
      value: null,
      error: `Delete reason must be at most ${MAX_DELETE_REASON_LENGTH} characters`,
    } as const;
  }

  return { value: trimmedReason, error: null } as const;
};

const getPendingReport = async (reportId: string) => {
  const report = await prisma.moderationLog.findUnique({
    where: { id: reportId },
    include: {
      user: {
        select: {
          id: true,
          username: true,
          isBlocked: true,
        },
      },
    },
  });

  if (!report) {
    return {
      report: null,
      error: { status: 404, message: "Report not found" },
    };
  }

  if (!report.action.startsWith("REPORT_")) {
    return {
      report: null,
      error: { status: 400, message: "This moderation item is not a report" },
    };
  }

  if (report.status !== "REPORTED") {
    return {
      report: null,
      error: { status: 400, message: "This report has already been handled" },
    };
  }

  return { report, error: null };
};

export const getAllUsers = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        isBlocked: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const timeoutMap = await getActiveTimeoutMap(users.map((user) => user.id));

    res.status(200).json(
      users.map((user) => {
        const timeout = timeoutMap.get(user.id);
        return {
          ...user,
          timeoutUntil: timeout ? timeout.until.toISOString() : null,
          timeoutReason: timeout ? timeout.reason : null,
        };
      }),
    );
  } catch (error) {
    next(error);
  }
};

export const setUserTimeout = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { id } = req.params;
    const { durationMinutes, reason } = req.body;

    if (!req.userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const moderatorId = req.userId;

    if (id === req.userId) {
      return res
        .status(400)
        .json({ error: "You cannot set a timeout on your own account" });
    }

    const minutes = Number(durationMinutes);
    if (!Number.isInteger(minutes) || minutes < 1 || minutes > MAX_TIMEOUT_MINUTES) {
      return res.status(400).json({
        error: `durationMinutes must be an integer between 1 and ${MAX_TIMEOUT_MINUTES}`,
      });
    }

    if (!reason || typeof reason !== "string" || !reason.trim()) {
      return res.status(400).json({ error: "Timeout reason is required" });
    }

    const trimmedReason = reason.trim();
    if (trimmedReason.length > MAX_TIMEOUT_REASON_LENGTH) {
      return res.status(400).json({
        error: `Timeout reason must be at most ${MAX_TIMEOUT_REASON_LENGTH} characters`,
      });
    }

    const [targetUser, moderator] = await Promise.all([
      prisma.user.findUnique({
        where: { id },
        select: {
          id: true,
          username: true,
          email: true,
          role: true,
          isBlocked: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      prisma.user.findUnique({
        where: { id: req.userId },
        select: { id: true, username: true },
      }),
    ]);

    if (!targetUser) {
      return res.status(404).json({ error: "User not found" });
    }

    if (!moderator) {
      return res.status(404).json({ error: "Moderator not found" });
    }

    const until = new Date(Date.now() + minutes * 60 * 1000);

    await prisma.$transaction([
      prisma.moderationLog.create({
        data: {
          status: "WARNED",
          action: TIMEOUT_USER_ACTION,
          moderatorId: req.userId,
          userId: targetUser.id,
          details: buildTimeoutLogDetails(
            targetUser.username,
            moderator.username,
            until,
            trimmedReason,
          ),
        },
      }),
      prisma.notification.create({
        data: {
          type: "account_timeout",
          message: `You are timed out from posting and commenting until ${until.toISOString()}. Reason: ${trimmedReason}`,
          userId: targetUser.id,
          triggeredById: req.userId,
        },
      }),
    ]);

    res.status(200).json({
      message: "User timeout set successfully",
      user: {
        ...targetUser,
        timeoutUntil: until.toISOString(),
        timeoutReason: trimmedReason,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const clearUserTimeout = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { id } = req.params;

    if (!req.userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (id === req.userId) {
      return res
        .status(400)
        .json({ error: "You cannot clear your own timeout from this panel" });
    }

    const [targetUser, moderator, activeTimeout] = await Promise.all([
      prisma.user.findUnique({
        where: { id },
        select: {
          id: true,
          username: true,
          email: true,
          role: true,
          isBlocked: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      prisma.user.findUnique({
        where: { id: req.userId },
        select: { id: true, username: true },
      }),
      getActiveUserTimeout(id),
    ]);

    if (!targetUser) {
      return res.status(404).json({ error: "User not found" });
    }

    if (!moderator) {
      return res.status(404).json({ error: "Moderator not found" });
    }

    if (!activeTimeout) {
      return res.status(400).json({ error: "User has no active timeout" });
    }

    await prisma.$transaction([
      prisma.moderationLog.create({
        data: {
          status: "WARNED",
          action: CLEAR_USER_TIMEOUT_ACTION,
          moderatorId: req.userId,
          userId: targetUser.id,
          details: `TIMEOUT_CLEARED|${activeTimeout.until.toISOString()}`,
        },
      }),
      prisma.notification.create({
        data: {
          type: "account_timeout_cleared",
          message: "Your timeout has been lifted. You can post and comment again.",
          userId: targetUser.id,
          triggeredById: req.userId,
        },
      }),
    ]);

    res.status(200).json({
      message: "User timeout cleared successfully",
      user: {
        ...targetUser,
        timeoutUntil: null,
        timeoutReason: null,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const updateUserRole = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!req.userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (!role || !VALID_USER_ROLES.includes(role)) {
      return res.status(400).json({ error: "Invalid role" });
    }

    if (id === req.userId) {
      return res
        .status(400)
        .json({ error: "You cannot change your own role here" });
    }

    const existingUser = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        username: true,
        role: true,
        email: true,
        isBlocked: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!existingUser) {
      return res.status(404).json({ error: "User not found" });
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: { role },
      select: {
        id: true,
        username: true,
        role: true,
        email: true,
        isBlocked: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    await prisma.moderationLog.create({
      data: {
        action: "UPDATE_USER_ROLE",
        moderatorId: req.userId,
        userId: existingUser.id,
        details: `Changed @${existingUser.username}'s role from ${existingUser.role} to ${role}.`,
      },
    });

    await prisma.notification.create({
      data: {
        type: "role_changed",
        message: `Your role has been updated to ${role}.`,
        userId: existingUser.id,
        triggeredById: req.userId,
      },
    });

    res
      .status(200)
      .json({ message: "User role updated successfully", user: updatedUser });
  } catch (error) {
    next(error);
  }
};

export const setUserBlockedStatus = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { id } = req.params;
    const { isBlocked } = req.body;

    if (!req.userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (typeof isBlocked !== "boolean") {
      return res.status(400).json({ error: "isBlocked must be a boolean" });
    }

    if (id === req.userId) {
      return res
        .status(400)
        .json({ error: "You cannot block your own account here" });
    }

    const existingUser = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        username: true,
        role: true,
        email: true,
        isBlocked: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!existingUser) {
      return res.status(404).json({ error: "User not found" });
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: { isBlocked },
      select: {
        id: true,
        username: true,
        role: true,
        email: true,
        isBlocked: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    await prisma.moderationLog.create({
      data: {
        status: isBlocked ? "BLOCKED" : "WARNED",
        action: isBlocked ? "BLOCK_USER_MANUAL" : "UNBLOCK_USER",
        moderatorId: req.userId,
        userId: existingUser.id,
        details: isBlocked
          ? `Blocked @${existingUser.username} from posting and commenting from the users tab.`
          : `Unblocked @${existingUser.username} and restored posting and commenting access.`,
      },
    });

    await prisma.notification.create({
      data: {
        type: isBlocked ? "account_blocked" : "account_unblocked",
        message: isBlocked
          ? "Your account has been blocked from posting and commenting by an admin."
          : "Your posting and commenting access has been restored by an admin.",
        userId: existingUser.id,
        triggeredById: req.userId,
      },
    });

    res.status(200).json({
      message: isBlocked
        ? "User blocked successfully"
        : "User unblocked successfully",
      user: updatedUser,
    });
  } catch (error) {
    next(error);
  }
};

export const getAllPosts = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const posts = await prisma.post.findMany({
      select: {
        id: true,
        title: true,
        text: true,
        postedAt: true,
        user: {
          select: {
            id: true,
            username: true,
          },
        },
      },
      orderBy: {
        postedAt: "desc",
      },
    });

    res.status(200).json(posts);
  } catch (error) {
    next(error);
  }
};

export const getAllComments = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const comments = await prisma.comment.findMany({
      select: {
        id: true,
        text: true,
        commentedAt: true,
        postId: true,
        user: {
          select: {
            id: true,
            username: true,
          },
        },
        post: {
          select: {
            id: true,
            title: true,
          },
        },
      },
      orderBy: {
        commentedAt: "desc",
      },
    });

    const validComments = comments
      .filter((comment) => comment.post !== null)
      .map((comment) => ({
        id: comment.id,
        content: comment.text,
        createdAt: comment.commentedAt,
        postId: comment.postId,
        user: comment.user,
        post: comment.post,
      }));

    res.status(200).json(validComments);
  } catch (error) {
    next(error);
  }
};

export const getModerationReports = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const reports = await prisma.moderationLog.findMany({
      where: {
        action: {
          startsWith: "REPORT_",
        },
      },
      include: {
        moderator: {
          select: {
            id: true,
            username: true,
          },
        },
        user: {
          select: {
            id: true,
            username: true,
            isBlocked: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    res.status(200).json(reports);
  } catch (error) {
    next(error);
  }
};

export const getModerationLogs = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const logs = await prisma.moderationLog.findMany({
      where: {
        NOT: {
          action: {
            startsWith: "REPORT_",
          },
        },
      },
      include: {
        moderator: {
          select: {
            id: true,
            username: true,
          },
        },
        user: {
          select: {
            id: true,
            username: true,
            isBlocked: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    res.status(200).json(logs);
  } catch (error) {
    next(error);
  }
};

export const dismissReport = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { id } = req.params;

    if (!req.userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const result = await getPendingReport(id);
    if (result.error) {
      return res
        .status(result.error.status)
        .json({ error: result.error.message });
    }

    const report = result.report;
    if (!report) {
      return res.status(404).json({ error: "Report not found" });
    }

    const moderator = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { username: true },
    });

    if (!moderator) {
      return res.status(404).json({ error: "Moderator not found" });
    }

    await prisma.$transaction([
      prisma.moderationLog.update({
        where: { id: report.id },
        data: {
          status: "DISMISSED",
          details: `${report.details} Review outcome: dismissed by @${moderator.username}.`,
        },
      }),
      prisma.moderationLog.create({
        data: {
          status: "DISMISSED",
          action: "DISMISS_REPORT",
          moderatorId: req.userId,
          userId: report.userId,
          postId: report.postId,
          commentId: report.commentId,
          details: `Dismissed report ${report.id} against @${report.user.username}.`,
        },
      }),
    ]);

    res.status(200).json({ message: "Report dismissed successfully" });
  } catch (error) {
    next(error);
  }
};

export const blockReportedUser = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { id } = req.params;

    if (!req.userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const result = await getPendingReport(id);
    if (result.error) {
      return res
        .status(result.error.status)
        .json({ error: result.error.message });
    }

    const report = result.report;
    if (!report) {
      return res.status(404).json({ error: "Report not found" });
    }

    const moderator = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { username: true },
    });

    if (!moderator) {
      return res.status(404).json({ error: "Moderator not found" });
    }

    await prisma.$transaction([
      prisma.user.update({
        where: { id: report.userId },
        data: { isBlocked: true },
      }),
      prisma.moderationLog.update({
        where: { id: report.id },
        data: {
          status: "BLOCKED",
          details: `${report.details} Review outcome: user blocked by @${moderator.username}.`,
        },
      }),
      prisma.moderationLog.create({
        data: {
          status: "BLOCKED",
          action: "BLOCK_USER",
          moderatorId: req.userId,
          userId: report.userId,
          postId: report.postId,
          commentId: report.commentId,
          details: `Blocked @${report.user.username} from posting and commenting after report review.`,
        },
      }),
    ]);

    await prisma.notification.create({
      data: {
        type: "account_blocked",
        message:
          "Your account has been blocked from posting and commenting by the moderation team.",
        userId: report.userId,
        triggeredById: req.userId,
      },
    });

    res.status(200).json({ message: "User blocked successfully" });
  } catch (error) {
    next(error);
  }
};

export const deletePost = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    if (!req.userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const moderatorId = req.userId;

    const validatedReason = getValidatedDeleteReason(reason);
    if (validatedReason.error || !validatedReason.value) {
      return res.status(400).json({ error: validatedReason.error });
    }

    const [post, moderator] = await Promise.all([
      prisma.post.findUnique({
        where: { id },
        select: {
          id: true,
          title: true,
          userId: true,
        },
      }),
      prisma.user.findUnique({
        where: { id: req.userId },
        select: { username: true },
      }),
    ]);

    if (!moderator) {
      return res.status(404).json({ error: "Moderator not found" });
    }

    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }

    const relatedComments = await prisma.comment.findMany({
      where: { postId: id },
      select: { id: true },
    });
    const relatedCommentIds = relatedComments.map((comment) => comment.id);

    await prisma.$transaction(async (tx) => {
      if (relatedCommentIds.length > 0) {
        await tx.moderationLog.updateMany({
          where: {
            commentId: { in: relatedCommentIds },
          },
          data: { commentId: null },
        });

        await tx.commentLike.deleteMany({
          where: {
            commentId: { in: relatedCommentIds },
          },
        });
      }

      await tx.moderationLog.updateMany({
        where: { postId: id },
        data: { postId: null },
      });

      await tx.comment.deleteMany({
        where: { postId: id },
      });

      await tx.postLike.deleteMany({
        where: { postId: id },
      });

      await tx.post.delete({
        where: { id },
      });

      await tx.moderationLog.create({
        data: {
          status: "DELETED",
          action: "DELETE_POST",
          moderatorId,
          userId: post.userId,
          details: `Deleted post ${id}. Reason: ${validatedReason.value}`,
        },
      });

      await tx.notification.create({
        data: {
          type: "post_deleted_by_moderator",
          message: `Your post "${post.title}" was removed by @${moderator.username}. Reason: ${validatedReason.value}`,
          userId: post.userId,
          triggeredById: moderatorId,
          link: "/discussion",
        },
      });
    });

    res.status(200).json({ message: "Post deleted" });
  } catch (error) {
    next(error);
  }
};

export const deleteComment = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    if (!req.userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const moderatorId = req.userId;

    const validatedReason = getValidatedDeleteReason(reason);
    if (validatedReason.error || !validatedReason.value) {
      return res.status(400).json({ error: validatedReason.error });
    }

    const [comment, moderator] = await Promise.all([
      prisma.comment.findUnique({
        where: { id },
        select: {
          id: true,
          userId: true,
          postId: true,
        },
      }),
      prisma.user.findUnique({
        where: { id: req.userId },
        select: { username: true },
      }),
    ]);

    if (!moderator) {
      return res.status(404).json({ error: "Moderator not found" });
    }

    if (!comment) {
      return res.status(404).json({ error: "Comment not found" });
    }

    const replies = await prisma.comment.findMany({
      where: { previousCommentId: id },
      select: { id: true },
    });
    const deletedCommentIds = [id, ...replies.map((reply) => reply.id)];

    await prisma.$transaction(async (tx) => {
      await tx.moderationLog.updateMany({
        where: {
          commentId: { in: deletedCommentIds },
        },
        data: { commentId: null },
      });

      await tx.commentLike.deleteMany({
        where: {
          commentId: { in: deletedCommentIds },
        },
      });

      await tx.comment.deleteMany({
        where: { previousCommentId: id },
      });

      await tx.comment.delete({
        where: { id },
      });

      await tx.moderationLog.create({
        data: {
          status: "DELETED",
          action: "DELETE_COMMENT",
          moderatorId,
          userId: comment.userId,
          details: `Deleted comment ${id}. Reason: ${validatedReason.value}`,
        },
      });

      await tx.notification.create({
        data: {
          type: "comment_deleted_by_moderator",
          message: `Your comment was removed by @${moderator.username}. Reason: ${validatedReason.value}`,
          userId: comment.userId,
          triggeredById: moderatorId,
          link: `/discussion/view/${comment.postId}`,
        },
      });
    });

    res.status(200).json({ message: "Comment deleted" });
  } catch (error) {
    next(error);
  }
};
