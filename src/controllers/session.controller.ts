import { Request, Response } from "express";
import {
  getUserActiveSessions,
  invalidateSession,
  invalidateAllUserSessions,
} from "../utils/session";

/**
 * Get all active sessions for the current user
 */
export const getUserSessions = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const sessions = await getUserActiveSessions(parseInt(userId));

    // Map sessions to a safe format for client-side
    const safeSessions = sessions.map((session) => ({
      id: session.id,
      userAgent: session.userAgent,
      ipAddress: session.ipAddress,
      createdAt: session.createdAt,
      isCurrent: session.id === req.user?.sessionId,
    }));

    res.json({
      sessions: safeSessions,
    });
  } catch (error) {
    console.error("Failed to get user sessions:", error);
    res.status(500).json({ message: "Failed to get sessions" });
  }
};

/**
 * Terminate a specific session
 */
export const terminateSession = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { sessionId } = req.params;

    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    // Verify the session belongs to the user
    const sessions = await getUserActiveSessions(parseInt(userId));
    const sessionBelongsToUser = sessions.some(
      (session) => session.id === sessionId
    );

    if (!sessionBelongsToUser) {
      res.status(403).json({ message: "Session not found or not authorized" });
      return;
    }

    // Terminate the session
    await invalidateSession(sessionId);

    // If terminating current session, also clear cookies
    if (sessionId === req.user?.sessionId) {
      res.clearCookie("accessToken");
      res.clearCookie("refreshToken");
      res.json({ message: "Current session terminated" });
    } else {
      res.json({ message: "Session terminated" });
    }
  } catch (error) {
    console.error("Failed to terminate session:", error);
    res.status(500).json({ message: "Failed to terminate session" });
  }
};

/**
 * Terminate all sessions except current one
 */
export const terminateAllSessions = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.id;
    const currentSessionId = req.user?.sessionId;

    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    if (currentSessionId) {
      // Keep the current session active
      await invalidateAllUserSessions(parseInt(userId), currentSessionId);
      res.json({ message: "All other sessions terminated" });
    } else {
      // Terminate all sessions including current one
      await invalidateAllUserSessions(parseInt(userId));
      res.clearCookie("accessToken");
      res.clearCookie("refreshToken");
      res.json({ message: "All sessions terminated" });
    }
  } catch (error) {
    console.error("Failed to terminate all sessions:", error);
    res.status(500).json({ message: "Failed to terminate sessions" });
  }
};
