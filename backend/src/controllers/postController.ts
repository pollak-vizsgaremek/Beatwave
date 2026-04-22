import { Request, Response, NextFunction } from "express";
import { notifyModerationTeam } from "../lib/moderationNotifications";
import { prisma } from "../lib/prisma";
import { ensureUserCanContribute } from "../lib/userAccess";

const MAX_TITLE_LENGTH = 200;
const MAX_TEXT_LENGTH = 10000;
const MAX_TOPIC_LENGTH = 100;
const MAX_REPORT_REASON_LENGTH = 1000;
const ANNOUNCEMENT_TOPICS = ["Announcement", "announcement"] as const;

const USER_SELECT = {
  id: true,
  username: true,
} as const;

const getAnnouncementTopicFilters = () =>
  ANNOUNCEMENT_TOPICS.map((topic) => ({ topic }));

const mapPostsWithLikeState = <T extends { likes: Array<{ userId: string }> }>(
  posts: T[],
  userId?: string,
) =>
  posts.map((post) => ({
    ...post,
    isLiked: userId ? post.likes.some((like) => like.userId === userId) : false,
  }));

const validatePostInput = (title: unknown, text: unknown, topic: unknown) => {
  if (!title || typeof title !== "string" || !title.trim()) {
    return "Title is required.";
  }
  if (title.trim().length > MAX_TITLE_LENGTH) {
    return `Title must be at most ${MAX_TITLE_LENGTH} characters.`;
  }

  if (!topic || typeof topic !== "string" || !topic.trim()) {
    return "Topic is required.";
  }
  if (topic.trim().length > MAX_TOPIC_LENGTH) {
    return `Topic must be at most ${MAX_TOPIC_LENGTH} characters.`;
  }

  if (!text || typeof text !== "string" || !text.trim()) {
    return "Post text is required.";
  }
  if (text.trim().length > MAX_TEXT_LENGTH) {
    return `Post text must be at most ${MAX_TEXT_LENGTH} characters.`;
  }

  return null;
};

export const getPosts = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const getAllPosts = await prisma.post.findMany({
      where: {
        NOT: {
          OR: getAnnouncementTopicFilters(),
        },
      },
      include: {
        user: { select: USER_SELECT },
        likes: {
          where: { userId: req.userId },
        },
      },
      orderBy: {
        postedAt: "desc",
      },
      take: 10,
    });

    const mapped = mapPostsWithLikeState(getAllPosts, req.userId);

    res.status(200).json(mapped);
  } catch (error) {
    next(error);
  }
};

export const getAnnouncements = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const announcements = await prisma.post.findMany({
      where: {
        OR: getAnnouncementTopicFilters(),
      },
      include: {
        user: { select: USER_SELECT },
        likes: {
          where: { userId: req.userId },
        },
      },
      orderBy: {
        postedAt: "desc",
      },
      take: 5,
    });

    res.status(200).json(mapPostsWithLikeState(announcements, req.userId));
  } catch (error) {
    next(error);
  }
};

export const getPostById = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { id } = req.params;

    const post = await prisma.post.findUnique({
      where: { id },
      include: {
        user: { select: USER_SELECT },
        likes: {
          where: { userId: req.userId },
        },
        comments: {
          include: {
            user: { select: USER_SELECT },
            replies: {
              include: {
                user: { select: USER_SELECT },
              },
            },
          },
        },
      },
    });

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    const isLiked = req.userId
      ? post.likes.some((like) => like.userId === req.userId)
      : false;

    res.status(200).json({ ...post, isLiked });
  } catch (error) {
    next(error);
  }
};

export const getMyPosts = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const posts = await prisma.post.findMany({
      where: { userId: req.userId },
      include: {
        user: { select: USER_SELECT },
        likes: {
          where: { userId: req.userId },
        },
      },
      orderBy: {
        postedAt: "desc",
      },
    });

    const mapped = posts.map((post) => ({
      ...post,
      isLiked: post.likes.some((like) => like.userId === req.userId),
    }));

    res.status(200).json(mapped);
  } catch (error) {
    next(error);
  }
};

export const createPost = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { text, title, topic, hashtags } = req.body;

    if (!req.userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const blockedState = await ensureUserCanContribute(req.userId);
    if (blockedState) {
      return res
        .status(blockedState.status)
        .json({ error: blockedState.error });
    }

    const validationError = validatePostInput(title, text, topic);
    if (validationError) {
      return res.status(400).json({ error: validationError });
    }

    const createdPost = await prisma.post.create({
      data: {
        text: text.trim(),
        title: title.trim(),
        topic: topic.trim(),
        hashtags,
        userId: req.userId,
      },
      include: {
        user: { select: USER_SELECT },
      },
    });

    res.status(201).json(createdPost);
  } catch (error) {
    next(error);
  }
};

export const updateOwnPost = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { id } = req.params;
    const { text, title, topic, hashtags } = req.body;

    if (!req.userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const blockedState = await ensureUserCanContribute(req.userId);
    if (blockedState) {
      return res
        .status(blockedState.status)
        .json({ error: blockedState.error });
    }

    const validationError = validatePostInput(title, text, topic);
    if (validationError) {
      return res.status(400).json({ error: validationError });
    }

    const existingPost = await prisma.post.findUnique({
      where: { id },
      select: { id: true, userId: true },
    });

    if (!existingPost) {
      return res.status(404).json({ error: "Post not found" });
    }

    if (existingPost.userId !== req.userId) {
      return res
        .status(403)
        .json({ error: "You can only edit your own posts" });
    }

    const updatedPost = await prisma.post.update({
      where: { id },
      data: {
        text: text.trim(),
        title: title.trim(),
        topic: topic.trim(),
        hashtags,
      },
      include: {
        user: { select: USER_SELECT },
      },
    });

    res.status(200).json(updatedPost);
  } catch (error) {
    next(error);
  }
};

export const deleteOwnPost = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { id } = req.params;

    if (!req.userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const post = await prisma.post.findUnique({
      where: { id },
      select: { id: true, userId: true },
    });

    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }

    if (post.userId !== req.userId) {
      return res
        .status(403)
        .json({ error: "You can only delete your own posts" });
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
      }

      await tx.moderationLog.updateMany({
        where: { postId: id },
        data: { postId: null },
      });

      await tx.comment.deleteMany({
        where: { postId: id },
      });

      await tx.post.delete({
        where: { id },
      });
    });

    res.status(200).json({ message: "Post deleted" });
  } catch (error) {
    next(error);
  }
};

export const reportPost = async (
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

    const existingPost = await prisma.post.findUnique({
      where: { id },
      include: { user: { select: USER_SELECT } },
    });

    if (!existingPost) {
      return res.status(404).json({ error: "Post not found" });
    }

    if (existingPost.userId === req.userId) {
      return res.status(400).json({ error: "You cannot report your own post" });
    }

    const reporter = await prisma.user.findUnique({
      where: { id: req.userId },
      select: USER_SELECT,
    });

    if (!reporter) {
      return res.status(404).json({ error: "User not found" });
    }

    const trimmedReason = reason.trim();

    await prisma.moderationLog.create({
      data: {
        status: "REPORTED",
        action: "REPORT_POST",
        moderatorId: req.userId,
        userId: existingPost.userId,
        postId: existingPost.id,
        details: `@${reporter.username} reported post "${existingPost.title}" by @${existingPost.user.username}. Reason: ${trimmedReason}`,
      },
    });

    await notifyModerationTeam({
      message: `New reported post: "${existingPost.title}" by @${existingPost.user.username}. Reason: ${trimmedReason}`,
      triggeredById: req.userId,
      excludeUserIds: [req.userId],
    });

    res.status(200).json({ message: "Post reported successfully" });
  } catch (error) {
    next(error);
  }
};
export const likePost = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const postId = req.params.id;
    const userId = req.userId as string;

    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const existingLike = await prisma.postLike.findUnique({
      where: {
        userId_postId: { userId, postId },
      },
    });

    if (existingLike) {
      const [, updatedPost] = await prisma.$transaction([
        prisma.postLike.delete({ where: { id: existingLike.id } }),
        prisma.post.update({
          where: { id: postId },
          data: { likeAmount: { decrement: 1 } },
        }),
      ]);

      return res
        .status(200)
        .json({ likeAmount: updatedPost.likeAmount, isLiked: false });
    }

    const [, updatedPost] = await prisma.$transaction([
      prisma.postLike.create({
        data: { userId, postId },
      }),
      prisma.post.update({
        where: { id: postId },
        data: { likeAmount: { increment: 1 } },
        include: { user: { select: USER_SELECT } },
      }),
    ]);

    if (updatedPost.userId !== userId) {
      const triggerUser = await prisma.user.findUnique({
        where: { id: userId },
        select: { username: true },
      });

      if (triggerUser) {
        await prisma.notification.create({
          data: {
            type: "post_like",
            message: `@${triggerUser.username} liked your post.`,
            userId: updatedPost.userId,
            triggeredById: userId,
            link: `/discussion/view/${updatedPost.id}`,
          },
        });
      }
    }

    return res
      .status(200)
      .json({ likeAmount: updatedPost.likeAmount, isLiked: true });
  } catch (error) {
    next(error);
  }
};
