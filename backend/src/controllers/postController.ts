import { Request, Response, NextFunction } from "express";
import { prisma } from "../lib/prisma";

export const getPosts = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const getAllPosts = await prisma.post.findMany({
      include: {
        user: true,
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
        user: true,
        comments: {
          include: {
            user: true,
            replies: {
              include: {
                user: true,
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

    const createPost = await prisma.post.create({
      data: {
        text,
        title,
        topic,
        hashtags,
        userId: req.userId,
      },
    });

    res.status(200).json(createPost);
  } catch (error) {
    next(error);
  }
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
        previousCommentId: null, // Only fetch top-level comments directly, as replies come in inclusion
      },
      include: {
        user: true,
        likes: true,
        replies: {
          include: {
            user: true,
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

    const post = await prisma.post.findUnique({
      where: { id: postId },
      include: { user: true },
    });

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    const newComment = await prisma.comment.create({
      data: {
        text,
        postId,
        userId: req.userId,
        previousCommentId: previousCommentId || null,
      },
      include: {
        user: true,
        replies: {
          include: {
            user: true,
          },
        },
      },
    });

    // Handle Notification
    const triggerUser = await prisma.user.findUnique({
      where: { id: req.userId },
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

    res.status(200).json(newComment);
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
      // Unlike
      await prisma.commentLike.delete({
        where: { id: existingLike.id },
      });
      comment = await prisma.comment.update({
        where: { id },
        data: { likeAmount: { decrement: 1 } },
        include: { user: true },
      });
      isLiked = false;
    } else {
      // Like
      await prisma.commentLike.create({
        data: {
          userId: req.userId,
          commentId: id,
        },
      });
      comment = await prisma.comment.update({
        where: { id },
        data: { likeAmount: { increment: 1 } },
        include: { user: true },
      });
      isLiked = true;

      const triggerUser = await prisma.user.findUnique({
        where: { id: req.userId },
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

export const getNotifications = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (!req.userId) return res.status(401).json({ error: "Unauthorized" });

    const notifications = await prisma.notification.findMany({
      where: { userId: req.userId },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    res.status(200).json(notifications);
  } catch (error) {
    next(error);
  }
};

export const markNotificationsRead = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (!req.userId) return res.status(401).json({ error: "Unauthorized" });

    await prisma.notification.updateMany({
      where: { userId: req.userId, read: false },
      data: { read: true },
    });

    res.status(200).json({ success: true });
  } catch (error) {
    next(error);
  }
};
