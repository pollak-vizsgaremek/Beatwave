import { Request, Response, NextFunction } from "express";
import { prisma } from "../lib/prisma";

const MAX_TITLE_LENGTH = 200;
const MAX_TEXT_LENGTH = 10000;
const MAX_TOPIC_LENGTH = 100;
const MAX_REPORT_REASON_LENGTH = 1000;

const USER_SELECT = {
  id: true,
  username: true,
} as const;

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
      include: {
        user: { select: USER_SELECT },
      },
      orderBy: {
        postedAt: "desc",
      },
      take: 10,
    });

    res.status(200).json(getAllPosts);
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

    const getPost = await prisma.post.findUnique({
      where: { id },
      include: {
        user: { select: USER_SELECT },
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

    if (!getPost) {
      return res.status(404).json({ message: "Post not found" });
    }

    res.status(200).json(getPost);
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

    await prisma.comment.deleteMany({
      where: { postId: id },
    });

    await prisma.post.delete({
      where: { id },
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

    await prisma.moderationLog.create({
      data: {
        status: "REPORTED",
        action: "REPORT_POST",
        moderatorId: req.userId,
        userId: existingPost.userId,
        postId: existingPost.id,
        details: `@${reporter.username} reported post "${existingPost.title}" by @${existingPost.user.username}. Reason: ${reason.trim()}`,
      },
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
    const { id } = req.params;

    if (!req.userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { isLiked } = req.body;

    const existingPost = await prisma.post.findUnique({
      where: { id },
      include: { user: { select: USER_SELECT } },
    });

    if (!existingPost) {
      return res.status(404).json({ error: "Post not found" });
    }

    const shouldUnlike = Boolean(isLiked) && existingPost.likeAmount > 0;

    const post = await prisma.post.update({
      where: { id },
      data: {
        likeAmount: {
          [shouldUnlike ? "decrement" : "increment"]: 1,
        },
      },
      include: { user: { select: USER_SELECT } },
    });

    if (!shouldUnlike) {
      const triggerUser = await prisma.user.findUnique({
        where: { id: req.userId },
        select: { username: true },
      });

      if (post.userId !== req.userId && triggerUser) {
        await prisma.notification.create({
          data: {
            type: "post_like",
            message: `@${triggerUser.username} liked your post: "${post.title}".`,
            userId: post.userId,
            triggeredById: req.userId,
            link: `/discussion/view/${post.id}`,
          },
        });
      }
    }

    res
      .status(200)
      .json({ likeAmount: post.likeAmount, isLiked: !Boolean(isLiked) });
  } catch (error) {
    next(error);
  }
};
