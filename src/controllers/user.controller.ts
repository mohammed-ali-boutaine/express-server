import { Request, Response } from "express";
import { hashPassword } from "../utils/auth";
import prisma from "../prisma";

export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        updatedAt: true,
        // Exclude password and refreshToken for security
      },
    });
    res.status(200).json({
      status: "success",
      data: users,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({
      status: "error",
      message: "Internal server error",
    });
  }
};

export const getUser = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);

    if (!id || isNaN(id)) {
      res.status(400).json({
        status: "fail",
        message: "Invalid user ID",
      });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        updatedAt: true,

      },
    });
    console.log(user)
    if (!user) {
      res.status(404).json({
        status: "fail",
        message: "User not found",
      });
      return;
    }

    res.status(200).json({
      status: "success",
      data: {
        user,
      },
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({
      status: "error",
      message: "Internal server error",
    });
  }
};
export const updateUser = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const { name, email, password } = req.body;

    if (!id || isNaN(id)) {
      res.status(400).json({
        status: "fail",
        message: "Invalid user ID",
      });
      return;
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({ where: { id } });
    if (!existingUser) {
      res.status(404).json({
        status: "fail",
        message: "User not found",
      });
      return;
    }

    // If email is being updated, check if it's already taken by another user
    if (email && email !== existingUser.email) {
      const emailTaken = await prisma.user.findUnique({ where: { email } });
      if (emailTaken) {
        res.status(409).json({
          status: "fail",
          message: "Email already in use by another user",
        });
        return;
      }
    }

    // Prepare update data
    const updateData: any = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (password) {
      updateData.password = await hashPassword(password);
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        updatedAt: true,
        // Exclude password for security
      },
    });

    res.status(200).json({
      status: "success",
      data: {
        user: updatedUser,
      },
    });
  } catch (err) {
    console.error("Update user error:", err);
    res.status(500).json({
      status: "error",
      message: "Internal server error",
    });
  }
};

export const deleteUser = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);

    if (!id || isNaN(id)) {
      res.status(400).json({
        status: "fail",
        message: "Invalid user ID",
      });
      return;
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({ where: { id } });
    if (!existingUser) {
      res.status(404).json({
        status: "fail",
        message: "User not found",
      });
      return;
    }

    // Delete user (this will also cascade delete related blogs due to Prisma schema)
    await prisma.user.delete({ where: { id } });

    res.status(204).json({
      status: "success",
      data: null,
    });
  } catch (err) {
    console.error("Delete user error:", err);
    res.status(500).json({
      status: "error",
      message: "Internal server error",
    });
  }
};
