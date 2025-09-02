import { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "../utils/auth";

// Import the type declarations to ensure they're loaded
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        sessionId?: string;
      };
    }
  }
}

/*------------------------------
* Main authentication middleware - supports both cookies and headers
--------------------------------*/
export const authenticate = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    let token: string | undefined;

    // Try to get token from HTTP-only cookie first (preferred)
    token = req.cookies?.accessToken;

    // Fallback to Authorization header for API clients
    if (!token) {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith("Bearer ")) {
        token = authHeader.split(" ")[1];
      }
    }

    if (!token) {
      res.status(401).json({
        message: "Access token required",
        code: "TOKEN_MISSING",
      });
      return;
    }

    // Verify the token
    const payload = verifyAccessToken(token) as any;

    // Add user info to request object
    req.user = {
      id: payload.userId,
    };

    next();
  } catch (error) {
    console.error("Authentication failed:", error);
    res.status(401).json({
      message: "Invalid or expired access token",
      code: "TOKEN_INVALID",
    });
  }
};

/*------------------------------
* Optional: Middleware for refresh token validation
--------------------------------*/
export const extractRefreshToken = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Get refresh token from cookie or body
    const refreshToken = req.cookies?.refreshToken || req.body.refreshToken;

    if (!refreshToken) {
      res.status(401).json({
        message: "Refresh token required",
        code: "REFRESH_TOKEN_MISSING",
      });
      return;
    }

    // Add to request body for controller to use
    req.body.refreshToken = refreshToken;
    next();
  } catch (error) {
    res.status(401).json({
      message: "Invalid refresh token format",
      code: "REFRESH_TOKEN_INVALID",
    });
  }
};
