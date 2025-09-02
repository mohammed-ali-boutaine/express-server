import express from "express";
import {
  getAllUsers,
  getUser,
  updateUser,
  deleteUser,
} from "../controllers/user.controller";
import { authenticate } from "../middlewares/auth.middleware";
import { validate } from "../middlewares/validation.middleware";
import { updateUserSchema } from "../validation/user.schema";

const router = express.Router();

/*------------------------------
* User Routes
* All routes require authentication
--------------------------------*/

// GET /api/users - Get all users
router.get("/", authenticate, getAllUsers as any);

// GET /api/users/:id - Get user by ID
router.get("/:id", authenticate, getUser as any);

// PUT /api/users/:id - Update user by ID
router.put("/:id", authenticate, validate(updateUserSchema), updateUser as any);

// DELETE /api/users/:id - Delete user by ID
router.delete("/:id", authenticate, deleteUser as any);

export default router;
