import { Request, Response, NextFunction } from "express";

export interface AppError extends Error {
  status?: number;
}

export const errorHandler = (
  err: AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error(err);
  res.status(err.status || 500).json({
    message: err.message || "Internal Server Error",
    error: err.name,
    stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
    details: JSON.stringify(err, Object.getOwnPropertyNames(err)),
  });
};