import type { Request, Response, NextFunction } from "express";
import prisma from "../../prisma/client.ts";

const userSelect = {
  id: true,
  username: true,
  email: true,
  name: true,
};

export const getAnnouncements = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const search = req.query.search as string | undefined;
    const sort = (req.query.sort as "newest" | "oldest" | undefined) || "newest";
    const page = Number(req.query.page) || 1;
    const perPage = 10;

    const where =
      search && search.trim() !== ""
        ? {
            title: {
              contains: search,
              mode: "insensitive" as const,
            },
          }
        : {};

    const orderBy = {
      createdAt: sort === "oldest" ? ("asc" as const) : ("desc" as const),
    };

    const [data, total] = await Promise.all([
      prisma.announcement.findMany({
        where,
        orderBy,
        skip: (page - 1) * perPage,
        take: perPage,
        include: {
          user: {
            select: userSelect,
          },
        },
      }),
      prisma.announcement.count({ where }),
    ]);

    const totalPages = Math.ceil(total / perPage);

    return res.status(200).json({
      data,
      pagination: {
        total,
        page,
        totalPages,
        perPage,
      },
    });
  } catch (err) {
    next(err);
  }
};

export const getAnnouncementById = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const id = Number(req.params.id);

    const announcement = await prisma.announcement.findUnique({
      where: { id },
      include: {
        user: {
          select: userSelect,
        },
      },
    });

    if (!announcement) {
      return res.status(404).json({ error: "Announcement not found" });
    }

    return res.status(200).json(announcement);
  } catch (err) {
    next(err);
  }
};

export const createAnnouncement = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { title, description, price, category } = req.body;
    const userId = req.user!.sub;

    const announcement = await prisma.announcement.create({
      data: {
        title,
        description,
        price,
        category,
        userId,
      },
      include: {
        user: {
          select: userSelect,
        },
      },
    });

    return res.status(201).json(announcement);
  } catch (err) {
    next(err);
  }
};

export const updateAnnouncement = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const id = Number(req.params.id);
    const userId = req.user!.sub;

    const existing = await prisma.announcement.findUnique({
      where: { id },
    });

    if (!existing) {
      return res.status(404).json({ error: "Announcement not found" });
    }

    if (existing.userId !== userId) {
      return res.status(403).json({ error: "Access denied" });
    }

    const updated = await prisma.announcement.update({
      where: { id },
      data: req.body,
      include: {
        user: {
          select: userSelect,
        },
      },
    });

    return res.status(200).json(updated);
  } catch (err) {
    next(err);
  }
};

export const deleteAnnouncement = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const id = Number(req.params.id);
    const userId = req.user!.sub;

    const existing = await prisma.announcement.findUnique({
      where: { id },
    });

    if (!existing) {
      return res.status(404).json({ error: "Announcement not found" });
    }

    if (existing.userId !== userId) {
      return res.status(403).json({ error: "Access denied" });
    }

    await prisma.announcement.delete({
      where: { id },
    });

    return res.status(204).end();
  } catch (err) {
    next(err);
  }
};
