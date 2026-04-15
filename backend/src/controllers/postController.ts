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
