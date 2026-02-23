import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

import { prisma } from "../lib/prisma";
import config from "../config/config";

export const getUserProfile = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
        const userData = await prisma.user.findUnique({
            where: { id: req.userId },
            select: {
                id: true,
                username: true,
                email: true,
                spotifyConnected: true,
                soundCloudConnected: true,
            },
        });
        res.status(200).json(userData);
    } catch (error) {
      next(error);
    }
};