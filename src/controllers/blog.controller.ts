import { Request, Response } from "express";
import prisma from "../prisma";

export const createBlog = async (req: Request, res: Response) => {
  try {
    const { title, content } = req.body;
    const authorId = req.user?.id;

    if (!authorId) {
      return res.status(401).json({
        status: "error",
        message: "Authentication required",
      });
    }

    // Validation is now handled by middleware

    const blog = await prisma.blog.create({
      data: {
        title,
        content,
        authorId: parseInt(authorId),
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return res.status(201).json({
      status: "success",
      data: { blog },
    });
  } catch (error) {
    console.error("Create blog error:", error);
    return res.status(500).json({
      status: "error",
      message: "Internal server error",
    });
  }
};

export const getBlogs = async (req: Request, res: Response) => {
  try {
    const blogs = await prisma.blog.findMany({
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return res.status(200).json({
      status: "success",
      data: { blogs },
    });
  } catch (error) {
    console.error("Get blogs error:", error);
    return res.status(500).json({
      status: "error",
      message: "Internal server error",
    });
  }
};

/**
 * Get a single blog by ID
 */
export const getBlogById = async (req: Request, res: Response) => {
  try {
    const blogId = parseInt(req.params.id);

    if (isNaN(blogId)) {
      return res.status(400).json({
        status: "error",
        message: "Invalid blog ID",
      });
    }

    const blog = await prisma.blog.findUnique({
      where: { id: blogId },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!blog) {
      return res.status(404).json({
        status: "error",
        message: "Blog not found",
      });
    }

    return res.status(200).json({
      status: "success",
      data: { blog },
    });
  } catch (error) {
    console.error("Get blog error:", error);
    return res.status(500).json({
      status: "error",
      message: "Internal server error",
    });
  }
};

export const updateBlog = async (req: Request, res: Response) => {
  try {
    const { title, content } = req.body;
    const blogId = parseInt(req.params.id);

    const blog = await prisma.blog.update({
      where: { id: blogId },
      data: { title, content },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return res.status(200).json({
      status: "success",
      data: { blog },
    });
  } catch (error) {
    console.error("Update blog error:", error);
    return res.status(500).json({
      status: "error",
      message: "Internal server error",
    });
  }
};

export const deleteBlog = async (req: Request, res: Response) => {
  try {
    const blogId = parseInt(req.params.id);

    await prisma.blog.delete({ where: { id: blogId } });

    return res.status(204).send();
  } catch (error) {
    console.error("Delete blog error:", error);
    return res.status(500).json({
      status: "error",
      message: "Internal server error",
    });
  }
};
