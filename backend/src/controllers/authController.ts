import { Request, Response, NextFunction } from "express";
import bcrypt from "bcrypt";
import { prisma } from "../lib/prisma";

export const createUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const pepper = process.env.PASSWORD_PEPPER!;
    const rounds = Number(process.env.BCRYPT_ROUNDS) || 12;

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
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const pepper = process.env.PASSWORD_PEPPER!;

    const isValid = await bcrypt.compare(password + pepper, user.passwordHash);

    if (!isValid) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    res.status(200).json({ message: "User authenticated successfully" });
  } catch (error) {
    next(error);
  }
};
