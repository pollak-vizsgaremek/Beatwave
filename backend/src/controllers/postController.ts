import { Request, Response, NextFunction } from "express";
import { prisma } from "../lib/prisma";

// Shared user select — only expose id + username, never email or other sensitive fields
const USER_SELECT = {
  id: true,
  username: true,
} as const;

const MAX_TITLE_LENGTH = 200;
const MAX_TEXT_LENGTH = 10000;
const MAX_TOPIC_LENGTH = 100;

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

    // Input validation
    if (!title || typeof title !== "string" || !title.trim()) {
      return res.status(400).json({ error: "Title is required." });
    }
    if (title.trim().length > MAX_TITLE_LENGTH) {
      return res
        .status(400)
        .json({ error: `Title must be at most ${MAX_TITLE_LENGTH} characters.` });
    }

    if (!text || typeof text !== "string" || !text.trim()) {
      return res.status(400).json({ error: "Post text is required." });
    }
    if (text.trim().length > MAX_TEXT_LENGTH) {
      return res
        .status(400)
        .json({ error: `Post text must be at most ${MAX_TEXT_LENGTH} characters.` });
    }

    if (topic && topic.trim().length > MAX_TOPIC_LENGTH) {
      return res
        .status(400)
        .json({ error: `Topic must be at most ${MAX_TOPIC_LENGTH} characters.` });
    }

    const createdPost = await prisma.post.create({
      data: {
        text: text.trim(),
        title: title.trim(),
        topic: topic?.trim() || null,
        hashtags,
        userId: req.userId,
      },
    });

    res.status(201).json(createdPost);
  } catch (error) {
    next(error);
  }
};
