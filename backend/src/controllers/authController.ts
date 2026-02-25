import { Request, Response, NextFunction } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

import { prisma } from "../lib/prisma";
import config from "../config/config";

export const createUser = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { username, email, password } = req.body;

    const pepper = config.passwordPepper;
    const rounds = config.bcryptRounds;

    if (!username || !email || !password) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: "Érvénytelen email formátum" });
    }

    if (
      password.length < 8 ||
      !/\d/.test(password) ||
      !/[!@#$%^&*(),.?":{}|<>]/.test(password) ||
      !/[A-Z]/.test(password)
    ) {
      return res.status(400).json({
        error: "A jelszó nem felel meg a biztonsági követelményeknek",
      });
    }

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { username }],
      },
    });

    if (existingUser) {
      if (existingUser.email === email && existingUser.username === username) {
        return res
          .status(409)
          .json({
            error:
              "A felhasználó ezzel az email címmel és felhasználónévvel már létezik",
          });
      } else if (existingUser.email === email) {
        return res
          .status(409)
          .json({ error: "A felhasználó ezzel az email címmel már létezik" });
      } else {
        return res
          .status(409)
          .json({
            error: "A felhasználó ezzel a felhasználónévvel már létezik",
          });
      }
    }

    const passwordHash = await bcrypt.hash(password + pepper, rounds);

    const newUser = await prisma.user.create({
      data: {
        username,
        email,
        passwordHash,
      },
    });

    const { passwordHash: _, ...safeUser } = newUser;
    res.status(201).json(safeUser);
  } catch (error: any) {
    if (error.code === "P2002") {
      const field = error.meta?.target?.[0] || "field";
      return res
        .status(409)
        .json({ error: `A felhasználó ezzel a ${field} már létezik` });
    }
    next(error);
  }
};

export const authenticateUser = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({
      where: { email },
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
      { expiresIn: config.jwtExpiresIn as any },
    );

    res.status(200).json({
      message: "Sikeres bejelentkezés",
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        username: user.username,
      },
    });
  } catch (error) {
    next(error);
  }
};
