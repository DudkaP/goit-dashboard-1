import { z } from "zod";
import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";

extendZodWithOpenApi(z);

export const registerSchema = z
  .object({
    username: z.string().min(3).max(30).openapi({ example: "ivan_petrenko" }),
    email: z.string().email().openapi({ example: "ivan@example.com" }),
    password: z.string().min(6).openapi({ example: "secret123" }),
    name: z.string().min(2).openapi({ example: "Іван" }),
  })
  .openapi("RegisterInput");

export const loginSchema = z
  .object({
    username: z.string().min(1).openapi({ example: "ivan_petrenko" }),
    password: z.string().min(1).openapi({ example: "secret123" }),
  })
  .openapi("LoginInput");

export const refreshSchema = z
  .object({
    refreshToken: z.string().min(1).openapi({ example: "eyJhbGci..." }),
  })
  .openapi("RefreshInput");
