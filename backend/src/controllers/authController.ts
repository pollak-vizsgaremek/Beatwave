import { Request, Response, NextFunction } from "express";
import bcrypt from "bcrypt";
import jwt, { JwtPayload } from "jsonwebtoken";

import config from "../config/config";
import {
  AUTH_COOKIE_NAME,
  getTokenFromRequest,
  hashToken,
} from "../lib/authToken";
import {
  buildIpBanErrorMessage,
  getActiveIpBanForAddress,
  getClientIp,
} from "../lib/ipBan";
import { prisma } from "../lib/prisma";

const AUTH_COOKIE_MAX_AGE_MS =
  Number(process.env.JWT_COOKIE_MAX_AGE_MS) || 7 * 24 * 60 * 60 * 1000;

export const createUser = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { username, email, password } = req.body;
    const clientIp = getClientIp(req);

    const activeIpBan = await getActiveIpBanForAddress(clientIp);
    if (activeIpBan) {
      return res.status(403).json({
        error: buildIpBanErrorMessage(activeIpBan),
      });
    }

    const pepper = config.passwordPepper;
    const rounds = config.bcryptRounds;

    if (!username || !email || !password) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: "Invalid email format" });
    }

    if (
      password.length < 8 ||
      !/\d/.test(password) ||
      !/[!@#$%^&*(),.?":{}|<>+-]/.test(password) ||
      !/[A-Z]/.test(password)
    ) {
      return res.status(400).json({
        error: "Password does not meet security requirements",
      });
    }

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { username }],
      },
    });

    if (existingUser) {
      if (existingUser.email === email && existingUser.username === username) {
        return res.status(409).json({
          error: "A user with this email and username already exists",
        });
      }
      if (existingUser.email === email) {
        return res
          .status(409)
          .json({ error: "A user with this email already exists" });
      }
      return res
        .status(409)
        .json({ error: "A user with this username already exists" });
    }

    const passwordHash = await bcrypt.hash(password + pepper, rounds);

    const newUser = await prisma.user.create({
      data: {
        username,
        email,
        passwordHash,
        lastKnownIp: clientIp,
      },
    });

    const { passwordHash: _, ...safeUser } = newUser;
    return res.status(201).json(safeUser);
  } catch (error: any) {
    if (error.code === "P2002") {
      const field = error.meta?.target?.[0] || "field";
      return res
        .status(409)
        .json({ error: `A user with this ${field} already exists` });
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
    const { login, email, username, password } = req.body;
    const identifier = String(login ?? email ?? username ?? "").trim();
    const clientIp = getClientIp(req);

    const activeIpBan = await getActiveIpBanForAddress(clientIp);
    if (activeIpBan) {
      return res.status(403).json({
        error: buildIpBanErrorMessage(activeIpBan),
      });
    }

    if (!identifier || !password) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const user = await prisma.user.findFirst({
      where: {
        OR: [{ email: identifier }, { username: identifier }],
      },
    });

    const INVALID_CREDENTIALS_ERROR = "Invalid email/username or password";

    if (!user) {
      return res.status(401).json({ error: INVALID_CREDENTIALS_ERROR });
    }

    const pepper = config.passwordPepper;
    const isValid = await bcrypt.compare(password + pepper, user.passwordHash);

    if (!isValid) {
      return res.status(401).json({ error: INVALID_CREDENTIALS_ERROR });
    }

    if (clientIp && user.lastKnownIp !== clientIp) {
      await prisma.user.update({
        where: { id: user.id },
        data: { lastKnownIp: clientIp },
      });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      config.jwtSecret,
      { expiresIn: config.jwtExpiresIn as any },
    );
    const isProduction = config.nodeEnv === "production";

    res.cookie(AUTH_COOKIE_NAME, token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: "lax",
      path: "/",
      maxAge: AUTH_COOKIE_MAX_AGE_MS,
    });

    return res.status(200).json({
      message: "Login successful",
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

export const logoutUser = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const token = getTokenFromRequest(req);
    const isProduction = config.nodeEnv === "production";

    if (token) {
      const decoded = jwt.decode(token) as JwtPayload | null;
      const expSeconds =
        typeof decoded?.exp === "number"
          ? decoded.exp
          : Math.floor(Date.now() / 1000) + 60 * 60;
      const tokenHash = hashToken(token);

      await prisma.revokedToken.upsert({
        where: { tokenHash },
        update: {
          expiresAt: new Date(expSeconds * 1000),
          revokedAt: new Date(),
        },
        create: {
          tokenHash,
          expiresAt: new Date(expSeconds * 1000),
        },
      });
    }

    res.clearCookie(AUTH_COOKIE_NAME, {
      httpOnly: true,
      secure: isProduction,
      sameSite: "lax",
      path: "/",
    });

    return res.status(200).json({ message: "Logout successful" });
  } catch (error) {
    next(error);
  }
};
