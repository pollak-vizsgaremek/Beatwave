import { Request, Response, NextFunction } from "express";
import { prisma } from "../lib/prisma";

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

export const getAllPosts = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const posts = await prisma.post.findMany({
      include: {
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

    // Filter out comments with missing posts (in case of orphaned data)
    const validComments = comments
      .filter((comment) => comment.post !== null)
      .map((comment) => ({
        id: comment.id,
        content: comment.text, // Map text to content for frontend
        createdAt: comment.commentedAt, // Map commentedAt to createdAt
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

export const deletePost = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { id } = req.params;

    // Get the post owner before deleting
    const post = await prisma.post.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }

    // Delete associated comments first (cascade might not be set up)
    await prisma.comment.deleteMany({
      where: { postId: id },
    });

    // Delete the post
    await prisma.post.delete({
      where: { id },
    });

    // Log the moderation action
    await prisma.moderationLog.create({
      data: {
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

    // Get the comment owner before deleting
    const comment = await prisma.comment.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (!comment) {
      return res.status(404).json({ error: "Comment not found" });
    }

    // Delete associated likes and replies first
    await prisma.commentLike.deleteMany({
      where: { commentId: id },
    });

    // Delete replies to this comment
    await prisma.comment.deleteMany({
      where: { previousCommentId: id },
    });

    // Delete the comment
    await prisma.comment.delete({
      where: { id },
    });

    // Log
    await prisma.moderationLog.create({
      data: {
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
