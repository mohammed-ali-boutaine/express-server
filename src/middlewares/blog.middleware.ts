import { Request, Response, NextFunction } from "express";
import prisma from "../prisma";

// Middleware to check if the user is the author of the blog
export const isAuthor = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const blogId = parseInt(req.params.id);
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({
        status: "error",
        message: "Authentication required",
      });
      return;
    }

    if (isNaN(blogId)) {
      res.status(400).json({
        status: "error",
        message: "Invalid blog ID",
      });
      return;
    }

    // Check if blog exists and user owns it
    const blog = await prisma.blog.findUnique({
      where: { id: blogId },
    });

    if (!blog) {
      res.status(404).json({
        status: "error",
        message: "Blog not found",
      });
      return;
    }

    if (blog.authorId !== parseInt(userId)) {
      res.status(403).json({
        status: "error",
        message: "You are not authorized to modify this blog",
      });
      return;
    }

    // Add blog to request for potential use in controller
    req.blog = blog;
    next();
  } catch (error) {
    console.error("Authorization check error:", error);
    res.status(500).json({
      status: "error",
      message: "Internal server error",
    });
  }
};
