import { Router } from "express";
import { z } from "zod";
import { registry } from "../openapi.ts";
import {
  getAnnouncements,
  getAnnouncementById,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
} from "../controllers/announcements.controller.ts";
import { authenticate } from "../middleware/authenticate.ts";
import {
  validateBody,
  validateParams,
  validateQuery,
} from "../middleware/validate.ts";
import {
  createAnnouncementSchema,
  updateAnnouncementSchema,
  announcementIdParamSchema,
  announcementsQuerySchema,
  categoryEnum,
} from "../validators/announcements.validator.ts";

const router = Router();

const authorSchema = z
  .object({
    id: z.number().openapi({ example: 1 }),
    username: z.string().openapi({ example: "ivan_petrenko" }),
    email: z.string().email().openapi({ example: "ivan@example.com" }),
    name: z.string().openapi({ example: "Іван" }),
  })
  .openapi("AnnouncementAuthor");

const announcementResponseSchema = z
  .object({
    id: z.number().openapi({ example: 5 }),
    title: z.string().openapi({ example: "Продам ноутбук ASUS" }),
    description: z.string().openapi({ example: "Відмінний стан, 16GB RAM" }),
    price: z.number().openapi({ example: 18000 }),
    category: categoryEnum.openapi({ example: "sale" }),
    createdAt: z.string().openapi({ example: "2025-01-10T12:00:00.000Z" }),
    updatedAt: z.string().openapi({ example: "2025-01-10T12:00:00.000Z" }),
    user: authorSchema,
  })
  .openapi("AnnouncementResponse");

const announcementsListResponseSchema = z
  .object({
    data: z.array(announcementResponseSchema),
    pagination: z.object({
      total: z.number().openapi({ example: 23 }),
      page: z.number().openapi({ example: 2 }),
      totalPages: z.number().openapi({ example: 3 }),
      perPage: z.number().openapi({ example: 10 }),
    }),
  })
  .openapi("AnnouncementsListResponse");

registry.registerPath({
  method: "get",
  path: "/announcements",
  tags: ["Announcements"],
  summary: "Get list of announcements with pagination, search and sort",
  request: {
    query: announcementsQuerySchema,
  },
  responses: {
    200: {
      description: "List of announcements",
      content: {
        "application/json": {
          schema: announcementsListResponseSchema,
        },
      },
    },
  },
});

registry.registerPath({
  method: "get",
  path: "/announcements/{id}",
  tags: ["Announcements"],
  summary: "Get announcement by ID",
  request: {
    params: announcementIdParamSchema,
  },
  responses: {
    200: {
      description: "Announcement details",
      content: {
        "application/json": {
          schema: announcementResponseSchema,
        },
      },
    },
    404: {
      description: "Announcement not found",
    },
  },
});

registry.registerPath({
  method: "post",
  path: "/announcements",
  tags: ["Announcements"],
  summary: "Create a new announcement",
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        "application/json": {
          schema: createAnnouncementSchema,
        },
      },
    },
  },
  responses: {
    201: {
      description: "Announcement created",
      content: {
        "application/json": {
          schema: announcementResponseSchema,
        },
      },
    },
    400: {
      description: "Validation error",
    },
    401: {
      description: "Unauthorized",
    },
  },
});

registry.registerPath({
  method: "patch",
  path: "/announcements/{id}",
  tags: ["Announcements"],
  summary: "Partially update an announcement",
  security: [{ bearerAuth: [] }],
  request: {
    params: announcementIdParamSchema,
    body: {
      content: {
        "application/json": {
          schema: updateAnnouncementSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "Announcement updated",
      content: {
        "application/json": {
          schema: announcementResponseSchema,
        },
      },
    },
    400: {
      description: "Validation error",
    },
    401: {
      description: "Unauthorized",
    },
    403: {
      description: "Access denied",
    },
    404: {
      description: "Announcement not found",
    },
  },
});

registry.registerPath({
  method: "delete",
  path: "/announcements/{id}",
  tags: ["Announcements"],
  summary: "Delete an announcement",
  security: [{ bearerAuth: [] }],
  request: {
    params: announcementIdParamSchema,
  },
  responses: {
    204: {
      description: "Announcement deleted",
    },
    401: {
      description: "Unauthorized",
    },
    403: {
      description: "Access denied",
    },
    404: {
      description: "Announcement not found",
    },
  },
});

router.get("/", validateQuery(announcementsQuerySchema), getAnnouncements);
router.get("/:id", validateParams(announcementIdParamSchema), getAnnouncementById);
router.post(
  "/",
  authenticate,
  validateBody(createAnnouncementSchema),
  createAnnouncement,
);
router.patch(
  "/:id",
  authenticate,
  validateParams(announcementIdParamSchema),
  validateBody(updateAnnouncementSchema),
  updateAnnouncement,
);
router.delete(
  "/:id",
  authenticate,
  validateParams(announcementIdParamSchema),
  deleteAnnouncement,
);

export default router;
