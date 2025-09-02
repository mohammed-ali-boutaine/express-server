import { Request, Response, NextFunction } from "express";
import prisma from "../prisma";
import { verifyRefreshToken } from "../utils/auth";

/**
 * Middleware to validate session based on refresh token
 * This ensures the user has a valid session before proceeding
 */
export const validateSession = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Get refresh token from cookie
    const refreshToken = req.cookies?.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({
        message: "No active session found",
        code: "SESSION_NOT_FOUND",
      });
    }

    try {
      // Verify the token structure first
      const decoded = verifyRefreshToken(refreshToken) as { userId: number };

      // Find the session in database
      const session = await prisma.session.findUnique({
        where: { refreshToken },
        include: { user: true },
      });

      // Check if session exists and is valid
      if (!session || !session.isValid) {
        return res.status(401).json({
          message: "Invalid or expired session",
          code: "SESSION_INVALID",
        });
      }

      // Check if user ID in token matches session
      if (session.userId !== decoded.userId) {
        return res.status(403).json({
          message: "Session mismatch",
          code: "SESSION_MISMATCH",
        });
      }

      // Add session info to request
      req.user = {
        id: session.userId.toString(),
        sessionId: session.id,
      };

      next();
    } catch (error) {
      return res.status(401).json({
        message: "Invalid session token",
        code: "SESSION_TOKEN_INVALID",
      });
    }
  } catch (error) {
    console.error("Session validation error:", error);
    return res.status(500).json({
      message: "Internal server error",
      code: "SERVER_ERROR",
    });
  }
};

/**
 * Middleware to optionally validate a session
 * Will add session info to request if available but won't reject if no session exists
 */
export const optionalSession = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Get refresh token from cookie
    const refreshToken = req.cookies?.refreshToken;

    if (!refreshToken) {
      return next(); // No session but that's OK, continue
    }

    try {
      // Verify the token structure first
      const decoded = verifyRefreshToken(refreshToken) as { userId: number };

      // Find the session in database
      const session = await prisma.session.findUnique({
        where: { refreshToken },
        include: { user: true },
      });

      // Check if session exists and is valid
      if (session && session.isValid && session.userId === decoded.userId) {
        // Add session info to request
        req.user = {
          id: session.userId.toString(),
          sessionId: session.id,
        };
      }

      next();
    } catch (error) {
      // Invalid token but that's OK for optional sessions
      next();
    }
  } catch (error) {
    console.error("Optional session validation error:", error);
    next(); // Continue anyway since this is optional
  }
};
