import { Request, Response, NextFunction } from "express";

export interface AppError extends Error {
  status?: number;
}

export const errorHandler = (
  err: AppError,
  _req: Request,
  res: Response,
  _next: NextFunction,
) => {
  const isDevelopment = (process.env.NODE_ENV || "development") === "development";
  const statusCode =
    typeof err.status === "number" && err.status >= 400 && err.status < 600
      ? err.status
      : 500;

  console.error(err);

  if (isDevelopment) {
    return res.status(statusCode).json({
      error: err.message || "Internal Server Error",
      name: err.name,
      stack: err.stack,
    });
  }

  const safeMessage =
    statusCode >= 500 ? "Internal Server Error" : err.message || "Request failed";

  return res.status(statusCode).json({
    error: safeMessage,
  });
};
