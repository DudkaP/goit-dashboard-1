import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export interface JwtPayload {
  sub: number;
  username: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export const authenticate = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const token = authHeader.slice(7).trim();
  if (!token) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const secret = process.env.JWT_SECRET || "your_secret_key_here";
    const decoded = jwt.verify(token, secret) as unknown as {
      sub: number | string;
      username: string;
    };

    req.user = {
      sub: Number(decoded.sub),
      username: decoded.username,
    };
    next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
};
