import express from "express";
import {
  register,
  login,
  refresh,
  logout,
} from "../controllers/auth.controller";
import { validateSession } from "../middlewares/session.middleware";
import { validate } from "../middlewares/validation.middleware";
import { registerSchema, loginSchema } from "../validation/auth.schema";

const router = express.Router();

/*------------------------------
* Public Routes (No Auth Required)
--------------------------------*/
/**
 * Public Routes
 */
router.post("/register", validate(registerSchema), register as any); // POST /api/auth/register
router.post("/login", validate(loginSchema), login as any); // POST /api/auth/login
router.post("/refresh", refresh as any); // POST /api/auth/refresh

/**
 * Protected Routes
 */
router.post("/logout", validateSession as any, logout); // POST /api/auth/logout

export default router;
