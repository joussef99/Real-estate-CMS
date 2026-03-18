import { NextFunction, Request, Response } from "express";
import { Prisma } from "@prisma/client";

export class HttpError extends Error {
  statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
  }
}

export function asyncHandler<T extends (req: Request, res: Response, next: NextFunction) => Promise<any> | any>(handler: T) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await handler(req, res, next);
    } catch (error) {
      next(error);
    }
  };
}

export function errorHandler(err: any, req: Request, res: Response, next: NextFunction) {
  if (res.headersSent) {
    return next(err);
  }

  const isPrismaKnownError = Boolean(err && typeof err === "object" && "code" in err);
  const isPrismaInitError = Boolean(err && typeof err === "object" && err?.name === "PrismaClientInitializationError");

  if (err instanceof HttpError) {
    return res.status(err.statusCode).json({ error: err.message });
  }

  if (isPrismaKnownError) {
    if (err.code === "P2002") {
      return res.status(409).json({ error: "Duplicate value violates unique constraint" });
    }
    if (err.code === "P2025") {
      return res.status(404).json({ error: "Record not found" });
    }
    return res.status(400).json({ error: err.message });
  }

  if (isPrismaInitError) {
    return res.status(503).json({ error: "Database unavailable" });
  }

  console.error(err);
  return res.status(500).json({ error: err?.message || "Internal Server Error" });
}
