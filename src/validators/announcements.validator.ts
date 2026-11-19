import { z } from "zod";
import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";

extendZodWithOpenApi(z);

export const categoryEnum = z.enum(["sale", "service", "job", "other"]);

export const createAnnouncementSchema = z
  .object({
    title: z
      .string()
      .min(5)
      .max(50)
      .openapi({ example: "Продам велосипед" }),
    description: z
      .string()
      .min(10)
      .openapi({ example: "Гірський велосипед, 21 швидкість" }),
    price: z.number().gt(0).openapi({ example: 8000 }),
    category: categoryEnum.openapi({ example: "sale" }),
  })
  .openapi("CreateAnnouncementInput");

export const updateAnnouncementSchema = z
  .object({
    title: z
      .string()
      .min(5)
      .max(50)
      .optional()
      .openapi({ example: "Продам велосипед терміново" }),
    description: z
      .string()
      .min(10)
      .optional()
      .openapi({ example: "Гірський велосипед, 21 швидкість" }),
    price: z.number().gt(0).optional().openapi({ example: 6500 }),
    category: categoryEnum.optional().openapi({ example: "sale" }),
  })
  .refine(
    (data) =>
      data.title !== undefined ||
      data.description !== undefined ||
      data.price !== undefined ||
      data.category !== undefined,
    {
      message: "At least one field must be provided",
    },
  )
  .openapi("UpdateAnnouncementInput");

export const announcementIdParamSchema = z
  .object({
    id: z.coerce.number().int().gt(0).openapi({ example: 1 }),
  })
  .openapi("AnnouncementIdParam");

export const announcementsQuerySchema = z
  .object({
    search: z.string().optional().openapi({ example: "ноутбук" }),
    sort: z
      .enum(["newest", "oldest"])
      .optional()
      .default("newest")
      .openapi({ example: "newest" }),
    page: z.coerce
      .number()
      .int()
      .gt(0)
      .optional()
      .default(1)
      .openapi({ example: 1 }),
  })
  .openapi("AnnouncementsQuery");
