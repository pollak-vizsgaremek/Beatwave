import { Request, Response, NextFunction } from "express";
import { prisma } from "../lib/prisma";

const VALID_USER_ROLES = ["USER", "MODERATOR", "ADMIN"] as const;

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

    res.status(200).json(users);
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

export const getModerationLogs = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const logs = await prisma.moderationLog.findMany({
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

    const post = await prisma.post.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }

    await prisma.comment.deleteMany({
      where: { postId: id },
    });

    await prisma.post.delete({
      where: { id },
    });

    await prisma.moderationLog.create({
      data: {
        status: "DELETED",
        action: "DELETE_POST",
        moderatorId: req.userId!,
        userId: post.userId,
        details: `Deleted post ${id}`,
      },
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

    const comment = await prisma.comment.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (!comment) {
      return res.status(404).json({ error: "Comment not found" });
    }

    await prisma.commentLike.deleteMany({
      where: { commentId: id },
    });

    await prisma.comment.deleteMany({
      where: { previousCommentId: id },
    });

    await prisma.comment.delete({
      where: { id },
    });

    await prisma.moderationLog.create({
      data: {
        status: "DELETED",
        action: "DELETE_COMMENT",
        moderatorId: req.userId!,
        userId: comment.userId,
        details: `Deleted comment ${id}`,
      },
    });

    res.status(200).json({ message: "Comment deleted" });
  } catch (error) {
    next(error);
  }
};
