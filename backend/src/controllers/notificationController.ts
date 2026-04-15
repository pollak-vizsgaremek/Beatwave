import { Request, Response, NextFunction } from "express";
import { prisma } from "../lib/prisma";

export const getNotifications = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.userId) return res.status(401).json({ error: "Unauthorized" });

    const notifications = await prisma.notification.findMany({
      where: { userId: req.userId },
      orderBy: { createdAt: "desc" },
      take: 5,
    });

    res.status(200).json(notifications);
  } catch (error) {
    next(error);
  }
};

export const markNotificationsRead = async (
  req: Request,
  res: Response,
  next: NextFunction
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

export const deleteNotificationsRead = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.userId) return res.status(401).json({ error: "Unauthorized" });

    await prisma.notification.deleteMany({
      where: { userId: req.userId, read: true },
    });

    res.status(200).json({ success: true });
  } catch (error) {
    next(error);
  }
};
