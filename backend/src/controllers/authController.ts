import { Request, Response, NextFunction } from "express";
import bcrypt from "bcrypt";
import { randomBytes } from "crypto";
import jwt, { JwtPayload } from "jsonwebtoken";

import config from "../config/config";
import { sendTemplatedEmail } from "../email/service";
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

interface TokenPayload {
  id: string;
  username: string;
  role: string;
  tokenVersion?: number;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_RESET_REQUEST_MESSAGE =
  "If an account exists for that email, a password reset link has been sent.";

const isPasswordStrong = (password: string) =>
  password.length >= 8 &&
  /\d/.test(password) &&
  /[!@#$%^&*(),.?":{}|<>+-]/.test(password) &&
  /[A-Z]/.test(password);

const getTokenVersion = (tokenVersion: unknown) =>
  typeof tokenVersion === "number" ? tokenVersion : 0;

const buildPasswordResetUrl = (token: string) => {
  const frontendBaseUrl = config.frontendUrl.replace(/\/$/, "");
  const encodedToken = encodeURIComponent(token);
  return `${frontendBaseUrl}/reset-password?token=${encodedToken}`;
};

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

    if (!EMAIL_REGEX.test(email)) {
      return res.status(400).json({ error: "Invalid email format" });
    }

    if (!isPasswordStrong(password)) {
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
      {
        id: user.id,
        username: user.username,
        role: user.role,
        tokenVersion: user.authTokenVersion,
      },
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

export const getSessionStatus = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const token = getTokenFromRequest(req);

    if (!token) {
      return res.status(200).json({ authenticated: false });
    }

    let decoded: TokenPayload;
    try {
      decoded = jwt.verify(token, config.jwtSecret) as TokenPayload;
    } catch {
      return res.status(200).json({ authenticated: false });
    }

    const revokedToken = await prisma.revokedToken.findUnique({
      where: { tokenHash: hashToken(token) },
      select: { id: true },
    });

    if (revokedToken) {
      return res.status(200).json({ authenticated: false });
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        email: true,
        role: true,
        username: true,
        authTokenVersion: true,
      },
    });

    if (!user) {
      return res.status(200).json({ authenticated: false });
    }

    const tokenVersion = getTokenVersion(decoded.tokenVersion);
    if (tokenVersion !== user.authTokenVersion) {
      return res.status(200).json({ authenticated: false });
    }

    return res.status(200).json({
      authenticated: true,
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

export const requestPasswordReset = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const email = String(req.body?.email ?? "").trim();

    if (!email || !EMAIL_REGEX.test(email)) {
      return res.status(200).json({ message: PASSWORD_RESET_REQUEST_MESSAGE });
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        username: true,
      },
    });

    if (!user) {
      return res.status(200).json({ message: PASSWORD_RESET_REQUEST_MESSAGE });
    }

    const resetToken = randomBytes(32).toString("hex");
    const tokenHash = hashToken(resetToken);
    const expiresAt = new Date(
      Date.now() + config.resetPasswordTtlMinutes * 60 * 1000,
    );

    await prisma.passwordResetToken.deleteMany({
      where: {
        userId: user.id,
      },
    });

    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt,
      },
    });

    const resetUrl = buildPasswordResetUrl(resetToken);

    try {
      await sendTemplatedEmail({
        template: "passwordReset",
        to: user.email,
        context: {
          resetUrl,
          expiresInMinutes: config.resetPasswordTtlMinutes,
          username: user.username,
        },
      });
    } catch (emailError) {
      console.error("[PasswordReset] Failed to send password reset email.", {
        userId: user.id,
        emailError,
      });
    }

    return res.status(200).json({ message: PASSWORD_RESET_REQUEST_MESSAGE });
  } catch (error) {
    next(error);
  }
};

export const validatePasswordResetToken = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const token = String(req.query.token ?? "").trim();

    if (!token) {
      return res.status(200).json({ valid: false });
    }

    const tokenHash = hashToken(token);
    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { tokenHash },
      select: {
        id: true,
        expiresAt: true,
        usedAt: true,
      },
    });

    if (!resetToken) {
      return res.status(200).json({ valid: false });
    }

    const isExpired = resetToken.expiresAt.getTime() <= Date.now();
    const isUsed = Boolean(resetToken.usedAt);

    return res.status(200).json({
      valid: !isExpired && !isUsed,
    });
  } catch (error) {
    next(error);
  }
};

export const confirmPasswordReset = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const token = String(req.body?.token ?? "").trim();
    const password = String(req.body?.password ?? "");

    if (!token || !password) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    if (!isPasswordStrong(password)) {
      return res.status(400).json({
        error: "Password does not meet security requirements",
      });
    }

    const tokenHash = hashToken(token);
    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { tokenHash },
      select: {
        id: true,
        userId: true,
        expiresAt: true,
        usedAt: true,
      },
    });

    if (!resetToken) {
      return res
        .status(400)
        .json({ error: "Invalid or expired password reset token" });
    }

    const isExpired = resetToken.expiresAt.getTime() <= Date.now();
    const isUsed = Boolean(resetToken.usedAt);
    if (isExpired || isUsed) {
      return res
        .status(400)
        .json({ error: "Invalid or expired password reset token" });
    }

    const passwordHash = await bcrypt.hash(
      password + config.passwordPepper,
      config.bcryptRounds,
    );
    const now = new Date();

    const didReset = await prisma.$transaction(async (tx) => {
      const markAsUsed = await tx.passwordResetToken.updateMany({
        where: {
          id: resetToken.id,
          usedAt: null,
          expiresAt: {
            gt: now,
          },
        },
        data: {
          usedAt: now,
        },
      });

      if (markAsUsed.count !== 1) {
        return false;
      }

      await tx.user.update({
        where: {
          id: resetToken.userId,
        },
        data: {
          passwordHash,
          authTokenVersion: {
            increment: 1,
          },
        },
      });

      await tx.passwordResetToken.deleteMany({
        where: {
          userId: resetToken.userId,
          id: {
            not: resetToken.id,
          },
        },
      });

      return true;
    });

    if (!didReset) {
      return res
        .status(400)
        .json({ error: "Invalid or expired password reset token" });
    }

    return res.status(200).json({ message: "Password reset successful" });
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
