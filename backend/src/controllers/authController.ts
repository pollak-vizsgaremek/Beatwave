import { Request, Response, NextFunction } from "express";
import bcrypt from "bcrypt";
import { prisma } from "../lib/prisma";
import jwt from "jsonwebtoken";
import config from "../config/config";

export const createUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const pepper = config.passwordPepper;
    const rounds = config.bcryptRounds;

    const passwordHash = await bcrypt.hash(req.body.password + pepper, rounds);

    const newUser = await prisma.user.create({
      data: {
        username: req.body.username,
        email: req.body.email,
        passwordHash,
      },
    });

    const { passwordHash: _, ...safeUser } = newUser;
    res.status(201).json(safeUser);
  } catch (error) {
    next(error);
  }
};

export const authenticateUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { username, password } = req.body;

    const user = await prisma.user.findUnique({
      where: { username },
    });

    if (!user) {
      return res.status(401).json({ error: "Nem létező felhasználó" });
    }

    const pepper = config.passwordPepper;

    const isValid = await bcrypt.compare(password + pepper, user.passwordHash);

    if (!isValid) {
      return res.status(401).json({ error: "Hibás jelszó" });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      config.jwtSecret,
      { expiresIn: config.jwtExpiresIn as any }
    );

    res.status(200).json({
      message: "Sikeres bejelentkezés",
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    next(error);
  }
};
