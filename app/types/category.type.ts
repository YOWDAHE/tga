import z from "zod";

// Zod schema for category
export const categorySchema = z.object({
  id: z.number().optional(),
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
});

export type CategoryInput = z.infer<typeof categorySchema>;