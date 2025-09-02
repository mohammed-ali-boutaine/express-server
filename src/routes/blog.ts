import express from "express";
import {
  createBlog,
  getBlogs,
  getBlogById,
  updateBlog,
  deleteBlog,
} from "../controllers/blog.controller";
import { authenticate } from "../middlewares/auth.middleware";
import { validate } from "../middlewares/validation.middleware";
import { isAuthor } from "../middlewares/blog.middleware";
import { blogSchema } from "../validation/blog.schema";

const router = express.Router();

// Public routes
router.get("/", getBlogs as any);
router.get("/:id", getBlogById as any);

// Protected routes
router.post("/", authenticate, validate(blogSchema), createBlog as any);
router.put(
  "/:id",
  authenticate,
  validate(blogSchema),
  isAuthor,
  updateBlog as any
);
router.delete("/:id", authenticate, isAuthor, deleteBlog as any);

export default router;
