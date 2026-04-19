import { Request, Response, NextFunction } from "express";
import { notifyModerationTeam } from "../lib/moderationNotifications";
import { prisma } from "../lib/prisma";

// Shared user select — only expose what the frontend needs, never email or passwordHash
const USER_SELECT = {
  id: true,
  username: true,
} as const;

const MAX_COMMENT_LENGTH = 2000;
const MAX_REPORT_REASON_LENGTH = 1000;
const BLOCKED_USER_MESSAGE =
  "Your account has been blocked from posting and commenting.";

const ensureUserCanComment = async (userId: string) => {
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

  return null;
};

export const getCommentsByPostId = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { id } = req.params;

    const comments = await prisma.comment.findMany({
      where: {
        postId: id,
        previousCommentId: null, // Only fetch top-level comments; replies come via inclusion
      },
      include: {
        user: { select: USER_SELECT },
        likes: true,
        replies: {
          include: {
            user: { select: USER_SELECT },
            likes: true,
          },
        },
      },
      orderBy: {
        commentedAt: "asc",
      },
    });

    const mapped = comments.map((comment) => ({
      ...comment,
      isLiked: req.userId
        ? comment.likes.some((like) => like.userId === req.userId)
        : false,
      replies: comment.replies.map((reply) => ({
        ...reply,
        isLiked: req.userId
          ? reply.likes.some((like) => like.userId === req.userId)
          : false,
      })),
    }));

    res.status(200).json(mapped);
  } catch (error) {
    next(error);
  }
};

export const createComment = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { id: postId } = req.params;
    const { text, previousCommentId } = req.body;

    if (!req.userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const blockedState = await ensureUserCanComment(req.userId);
    if (blockedState) {
      return res
        .status(blockedState.status)
        .json({ error: blockedState.error });
    }

    // Input validation
    if (!text || typeof text !== "string" || !text.trim()) {
      return res.status(400).json({ error: "Comment text is required." });
    }
    if (text.trim().length > MAX_COMMENT_LENGTH) {
      return res.status(400).json({
        error: `Comment must be at most ${MAX_COMMENT_LENGTH} characters.`,
      });
    }

    const post = await prisma.post.findUnique({
      where: { id: postId },
      include: { user: true },
    });

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    const newComment = await prisma.comment.create({
      data: {
        text: text.trim(),
        postId,
        userId: req.userId,
        previousCommentId: previousCommentId || null,
      },
      include: {
        user: { select: USER_SELECT },
        replies: {
          include: {
            user: { select: USER_SELECT },
          },
        },
      },
    });

    // Handle notification — lookup trigger user separately (already validated above)
    const triggerUser = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { username: true },
    });

    if (previousCommentId) {
      const parentComment = await prisma.comment.findUnique({
        where: { id: previousCommentId },
      });
      if (parentComment && parentComment.userId !== req.userId && triggerUser) {
        await prisma.notification.create({
          data: {
            type: "comment_reply",
            message: `@${triggerUser.username} replied to your comment.`,
            userId: parentComment.userId,
            triggeredById: req.userId,
            link: `/discussion/view/${postId}`,
          },
        });
      }
    } else if (post.userId !== req.userId && triggerUser) {
      await prisma.notification.create({
        data: {
          type: "post_comment",
          message: `@${triggerUser.username} commented on your post: "${post.title}".`,
          userId: post.userId,
          triggeredById: req.userId,
          link: `/discussion/view/${postId}`,
        },
      });
    }

    res.status(201).json(newComment);
  } catch (error) {
    next(error);
  }
};

export const reportComment = async (
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

    if (!reason || typeof reason !== "string" || !reason.trim()) {
      return res
        .status(400)
        .json({ error: "Please provide a reason for the report" });
    }

    if (reason.trim().length > MAX_REPORT_REASON_LENGTH) {
      return res.status(400).json({
        error: `Report reason must be at most ${MAX_REPORT_REASON_LENGTH} characters.`,
      });
    }

    const existingComment = await prisma.comment.findUnique({
      where: { id },
      include: {
        user: { select: USER_SELECT },
        post: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    if (!existingComment) {
      return res.status(404).json({ error: "Comment not found" });
    }

    if (existingComment.userId === req.userId) {
      return res
        .status(400)
        .json({ error: "You cannot report your own comment" });
    }

    const reporter = await prisma.user.findUnique({
      where: { id: req.userId },
      select: USER_SELECT,
    });

    if (!reporter) {
      return res.status(404).json({ error: "User not found" });
    }

    const contentType = existingComment.previousCommentId ? "reply" : "comment";
    const trimmedReason = reason.trim();

    await prisma.moderationLog.create({
      data: {
        status: "REPORTED",
        action: "REPORT_COMMENT",
        moderatorId: req.userId,
        userId: existingComment.userId,
        postId: existingComment.postId,
        commentId: existingComment.id,
        details: `@${reporter.username} reported a ${contentType} by @${existingComment.user.username} on post "${existingComment.post.title}". Reason: ${trimmedReason}`,
      },
    });

    await notifyModerationTeam({
      message: `New reported ${contentType} by @${existingComment.user.username} on "${existingComment.post.title}". Reason: ${trimmedReason}`,
      triggeredById: req.userId,
      excludeUserIds: [req.userId],
    });

    res.status(200).json({ message: "Comment reported successfully" });
  } catch (error) {
    next(error);
  }
};

export const likeComment = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { id } = req.params;

    if (!req.userId) return res.status(401).json({ error: "Unauthorized" });

    const existingLike = await prisma.commentLike.findUnique({
      where: {
        userId_commentId: {
          userId: req.userId,
          commentId: id,
        },
      },
    });

    let comment;
    let isLiked = false;

    if (existingLike) {
      // Unlike — wrap in a transaction to keep the like row and counter in sync
      [, comment] = await prisma.$transaction([
        prisma.commentLike.delete({ where: { id: existingLike.id } }),
        prisma.comment.update({
          where: { id },
          data: { likeAmount: { decrement: 1 } },
          include: { user: { select: USER_SELECT } },
        }),
      ]);
      isLiked = false;
    } else {
      // Like — wrap in a transaction to keep the like row and counter in sync
      [, comment] = await prisma.$transaction([
        prisma.commentLike.create({
          data: { userId: req.userId, commentId: id },
        }),
        prisma.comment.update({
          where: { id },
          data: { likeAmount: { increment: 1 } },
          include: { user: { select: USER_SELECT } },
        }),
      ]);
      isLiked = true;

      const triggerUser = await prisma.user.findUnique({
        where: { id: req.userId },
        select: { username: true },
      });

      if (comment.userId !== req.userId && triggerUser) {
        await prisma.notification.create({
          data: {
            type: "comment_like",
            message: `@${triggerUser.username} liked your comment.`,
            userId: comment.userId,
            triggeredById: req.userId,
            link: `/discussion/view/${comment.postId}`,
          },
        });
      }
    }

    res.status(200).json({ likeAmount: comment.likeAmount, isLiked });
  } catch (error) {
    next(error);
  }
};
