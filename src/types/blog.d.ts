import { Blog } from "@prisma/client";

declare global {
  namespace Express {
    interface Request {
      blog?: Blog;
    }
  }
}
