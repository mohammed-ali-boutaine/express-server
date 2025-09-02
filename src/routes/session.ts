import express from "express";
import { validateSession } from "../middlewares/session.middleware";
import {
  getUserSessions,
  terminateSession,
  terminateAllSessions,
} from "../controllers/session.controller";

const router = express.Router();

// All routes in this file require an authenticated session
router.use(validateSession as any);

// Get all active sessions for the current user
router.get("/", getUserSessions);

// Terminate a specific session
router.delete("/:sessionId", terminateSession);

// Terminate all sessions except the current one
router.delete("/", terminateAllSessions);

export default router;
