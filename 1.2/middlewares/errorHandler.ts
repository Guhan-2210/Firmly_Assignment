import { Request, Response, NextFunction } from "express";
import { logger } from "../logger";

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  logger.error("unhandled_error", {
    message: err.message,
    stack: err.stack,
    route: req.originalUrl,
    method: req.method,
  });

  res.status(500).json({ error: err.message || "Internal Server Error" });
};
