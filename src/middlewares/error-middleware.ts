import { Request, Response, NextFunction } from "express";
import pino from "pino";
import { HttpError } from "../errors/http-error.js";

export const errorMiddleware =
  (logger: pino.Logger) => (err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    if (err instanceof HttpError) {
      logger.warn({ err }, err.message);
      res.status(err.statusCode).json({ error: err.message });
      return;
    }

    if (err instanceof Error) {
      logger.error({ err }, "Unhandled error");
      res.status(500).json({ error: "Internal server error" });
      return;
    }

    logger.fatal({ err }, "Non-error thrown");
    res.status(500).json({ error: "Something unknowable happened" });
  };
