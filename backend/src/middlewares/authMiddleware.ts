import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import config from "../config/config";

interface TokenPayload {
  id: string;
  username: string;
  role: string;
}

export const verifyToken = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ error: "Nincs bejelentkezve" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, config.jwtSecret) as TokenPayload;
    req.userId = decoded.id;
    req.role = decoded.role;
    console.log(
      `[Spotify MiddleWare] Extracted userId: ${req.userId} from token.`,
    );
    next();
  } catch (error) {
    return res.status(403).json({ error: "Érvénytelen token" });
  }
};

export const isAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (req.role !== "ADMIN") {
    return res.status(403).json({ error: "Nincs jogosultságod" });
  }
  next();
};
