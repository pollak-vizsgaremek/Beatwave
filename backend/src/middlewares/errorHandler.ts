import { Request, Response, NextFunction } from "express";

export interface AppError extends Error {
  status?: number;
  code?: string;
  type?: string;
  meta?: unknown;
}

const GENERIC_SERVER_MESSAGE = "Something went wrong. Please try again later.";
const GENERIC_REQUEST_MESSAGE =
  "We could not process your request. Please check your input and try again.";

const hasPrismaErrorCode = (code: unknown): code is string =>
  typeof code === "string" && /^P\d{4}$/.test(code);

const getStatusCode = (status: unknown) =>
  typeof status === "number" && status >= 400 && status < 600 ? status : 500;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const humanizeFieldName = (field: string) =>
  field
    .split(".")
    .pop()
    ?.replace(/[_-]+/g, " ")
    .trim() ?? field;

const getPrismaConstraintFields = (meta: unknown): string[] => {
  if (!isRecord(meta)) {
    return [];
  }

  const target = meta.target;
  if (Array.isArray(target)) {
    return target
      .filter(
        (item): item is string =>
          typeof item === "string" && item.trim().length > 0,
      )
      .map(humanizeFieldName);
  }

  if (typeof target === "string" && target.trim()) {
    return [humanizeFieldName(target)];
  }

  return [];
};

const getUniqueConstraintMessage = (fields: string[]) => {
  if (fields.length === 0) {
    return "A record with the same details already exists.";
  }

  if (fields.length === 1) {
    return `A record with the same ${fields[0]} already exists.`;
  }

  const listedFields = `${fields.slice(0, -1).join(", ")} and ${fields.at(-1)}`;
  return `A record with the same ${listedFields} already exists.`;
};

const getPrismaFriendlyError = (err: AppError) => {
  if (!hasPrismaErrorCode(err.code)) {
    return null;
  }

  switch (err.code) {
    case "P2000":
      return {
        statusCode: 400,
        message: "One of the provided values is too long.",
      };
    case "P2002":
      return {
        statusCode: 409,
        message: getUniqueConstraintMessage(getPrismaConstraintFields(err.meta)),
      };
    case "P2003":
      return {
        statusCode: 409,
        message:
          "This action cannot be completed because related data is missing or still in use.",
      };
    case "P2011":
      return {
        statusCode: 400,
        message: "A required value is missing.",
      };
    case "P2014":
      return {
        statusCode: 409,
        message:
          "This action cannot be completed because it would break a required relation.",
      };
    case "P2025":
      return {
        statusCode: 404,
        message: "The requested record was not found.",
      };
    default:
      if (err.code.startsWith("P1")) {
        return {
          statusCode: 503,
          message: "Service is temporarily unavailable. Please try again shortly.",
        };
      }

      if (err.code.startsWith("P2")) {
        return {
          statusCode: 400,
          message: GENERIC_REQUEST_MESSAGE,
        };
      }

      return {
        statusCode: 500,
        message: GENERIC_SERVER_MESSAGE,
      };
  }
};

const getBodyParserFriendlyError = (err: AppError) => {
  switch (err.type) {
    case "entity.parse.failed":
      return {
        statusCode: 400,
        message: "The request body is not valid JSON.",
      };
    case "entity.too.large":
      return {
        statusCode: 413,
        message: "The request body is too large.",
      };
    case "encoding.unsupported":
      return {
        statusCode: 415,
        message: "The request body uses an unsupported encoding.",
      };
    default:
      return null;
  }
};

const sanitizeClientMessage = (statusCode: number, rawMessage?: string) => {
  if (statusCode >= 500) {
    return GENERIC_SERVER_MESSAGE;
  }

  const message = (rawMessage || "").replace(/\s+/g, " ").trim();
  if (!message) {
    return "Request failed.";
  }

  if (message.length > 180) {
    return GENERIC_REQUEST_MESSAGE;
  }

  if (/(prisma|database|sql|query|constraint|p\d{4}|stack)/i.test(message)) {
    return GENERIC_REQUEST_MESSAGE;
  }

  return message;
};

const toClientError = (err: AppError) => {
  const prismaFriendlyError = getPrismaFriendlyError(err);
  if (prismaFriendlyError) {
    return prismaFriendlyError;
  }

  const bodyParserFriendlyError = getBodyParserFriendlyError(err);
  if (bodyParserFriendlyError) {
    return bodyParserFriendlyError;
  }

  const statusCode = getStatusCode(err.status);
  return {
    statusCode,
    message: sanitizeClientMessage(statusCode, err.message),
  };
};

export const errorHandler = (
  err: AppError,
  _req: Request,
  res: Response,
  _next: NextFunction,
) => {
  const isDevelopment =
    (process.env.NODE_ENV || "development") === "development";
  const statusCode = getStatusCode(err.status);
  const clientError = toClientError(err);
  const responseStatusCode = isDevelopment ? statusCode : clientError.statusCode;

  console.error(err);

  if (isDevelopment) {
    return res.status(responseStatusCode).json({
      error: err.message || "Internal Server Error",
      name: err.name,
      code: err.code,
      stack: err.stack,
    });
  }

  return res.status(responseStatusCode).json({
    error: clientError.message,
  });
};
