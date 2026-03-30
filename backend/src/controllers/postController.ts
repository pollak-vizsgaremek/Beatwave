import { Request, Response, NextFunction } from "express";
import { prisma } from "../lib/prisma";

export const getPosts = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const getAllPosts = await prisma.post.findMany()

    res.status(200).json(getAllPosts)
  } catch (error) {
    next(error);
  }
};