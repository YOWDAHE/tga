import { error } from 'console';
import { z } from 'zod';

export const userCreateSchema = z.object({
  username: z.string().min(3).max(100),
  email: z.string().email().max(100),
  phone_number: z.string().min(5).max(100),
  password: z.string().min(6).max(255),
  roles: z.array(z.string()),
  role_name: z.string().optional(),
});

export type UserCreateInput = z.infer<typeof userCreateSchema>;

export const userResponseSchema = z.object({
  id: z.number(),
  username: z.string(),
  email: z.string(),
  phone_number: z.string(),
  roles: z.array(z.string()),
  role_name: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type UserResponse = z.infer<typeof userResponseSchema>;

export const userSignInResponseSchema = z.object({
  message: z.string(),
  status: z.string().optional(),
  error: z.string().nullable(),
  data: z.object({
    user: userResponseSchema,
    accessToken: z.string(),
    refreshToken: z.string(),
  }).optional(),
});

export type UserSignInResponse = z.infer<typeof userSignInResponseSchema>;
