import type { Request, Response, NextFunction } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import prisma from "../../prisma/client.ts";

const getJwtSecret = () => process.env.JWT_SECRET || "your_secret_key_here";

const generateTokens = (userId: number, username: string) => {
  const secret = getJwtSecret();
  const accessToken = jwt.sign(
    { sub: userId, username, jti: crypto.randomUUID() },
    secret,
    { expiresIn: "15m" },
  );
  const refreshToken = jwt.sign(
    { sub: userId, username, jti: crypto.randomUUID() },
    secret,
    { expiresIn: "7d" },
  );
  return { accessToken, refreshToken };
};

export const register = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { username, email, password, name } = req.body;

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ username }, { email }],
      },
    });

    if (existingUser) {
      return res.status(409).json({ error: "Username or email already taken" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        username,
        email,
        password: hashedPassword,
        name,
      },
      select: {
        id: true,
        username: true,
        email: true,
        name: true,
      },
    });

    const { accessToken, refreshToken } = generateTokens(
      user.id,
      user.username,
    );

    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
      },
    });

    return res.status(201).json({
      user,
      accessToken,
      refreshToken,
    });
  } catch (err) {
    next(err);
  }
};

export const login = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { username, password } = req.body;

    const user = await prisma.user.findUnique({
      where: { username },
    });

    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const { accessToken, refreshToken } = generateTokens(
      user.id,
      user.username,
    );

    await prisma.refreshToken.deleteMany({
      where: { userId: user.id },
    });

    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
      },
    });

    return res.status(200).json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        name: user.name,
      },
      accessToken,
      refreshToken,
    });
  } catch (err) {
    next(err);
  }
};

export const refresh = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { refreshToken } = req.body;

    let decoded: { sub: number | string; username: string };
    try {
      decoded = jwt.verify(refreshToken, getJwtSecret()) as unknown as {
        sub: number | string;
        username: string;
      };
    } catch {
      return res.status(401).json({ error: "Invalid or expired refresh token" });
    }

    const storedToken = await prisma.refreshToken.findUnique({
      where: { token: refreshToken },
    });

    if (!storedToken) {
      return res.status(401).json({ error: "Invalid or expired refresh token" });
    }

    await prisma.refreshToken.delete({
      where: { id: storedToken.id },
    });

    const userId = Number(decoded.sub);
    const tokens = generateTokens(userId, decoded.username);

    await prisma.refreshToken.create({
      data: {
        token: tokens.refreshToken,
        userId,
      },
    });

    return res.status(200).json(tokens);
  } catch (err) {
    next(err);
  }
};

export const logout = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.user!.sub;

    await prisma.refreshToken.deleteMany({
      where: { userId },
    });

    return res.status(204).end();
  } catch (err) {
    next(err);
  }
};

export const me = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.sub;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        email: true,
        name: true,
        createdAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    return res.status(200).json(user);
  } catch (err) {
    next(err);
  }
};
