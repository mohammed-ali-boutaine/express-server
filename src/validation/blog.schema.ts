import { z } from "zod";

// Blog validation schema
export const blogSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters long"),
  content: z.string().min(20, "Content must be at least 20 characters long"),
});

export type BlogInput = z.infer<typeof blogSchema>;
