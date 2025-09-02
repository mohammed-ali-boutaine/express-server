import { Request, Response } from "express";
import prisma from "../prisma";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

import { hashPassword } from "../utils/auth";
import {
  createSession,
  invalidateSession,
  invalidateAllUserSessions,
} from "../utils/session";
import { registerSchema, loginSchema } from "../validation/auth.schema";

import authConfig from "../config/auth.config";
const getCookieOptions = (maxAge: number) => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict" as const,
  maxAge,
});

/*------------------------------
* Register Controller
* Public , "/register" , POST
--------------------------------*/

export const register = async (req: Request, res: Response): Promise<void> => {
  // console.log(req.body);

  try {
    // validate input
    const parseData = registerSchema.parse(req.body);

    const { email, name, password } = parseData;

    // check if email exists
    const userExists = await prisma.user.findUnique({ where: { email } });

    if (userExists) {
      res.status(409).json({ message: "This email already exists" });
      return;
    }

    const hashed = await hashPassword(password);

    const user = await prisma.user.create({
      data: { email, name, password: hashed },
    });

    // Create a new session with access and refresh tokens
    const { session, tokens } = await createSession(
      user.id,
      req.headers["user-agent"] || null,
      req.ip || null
    );

    // Set cookies

    // Access token: short-lived (15 min)
    res.cookie(
      "accessToken",
      tokens.accessToken,
      getCookieOptions(15 * 60 * 1000)
    );

    // Refresh token: long-lived (30 days)
    res.cookie(
      "refreshToken",
      tokens.refreshToken,
      getCookieOptions(30 * 24 * 60 * 60 * 1000)
    );

    res.status(201).json({
      message: "Registration successful",
      user: { id: user.id, name: user.name, email: user.email },
    });
  } catch (error) {
    console.error("Registration Failed:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

/* ------------------------------
* Login Controller
* Public , "/login" , POST
--------------------------------*/
export const login = async (req: Request, res: Response): Promise<void> => {
  // logic
  try {
    // Validate input
    const parseData = loginSchema.parse(req.body);
    const { email, password } = parseData;

    // find user by email
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      res.status(401).json({ message: "Invalid credentials" });
      return;
    }

    // Create a new session with access and refresh tokens
    const { tokens } = await createSession(
      user.id,
      req.headers["user-agent"] || null,
      req.ip || null
    );

    // Set cookies

    // Access token: short-lived (15 min)
    res.cookie(
      "accessToken",
      tokens.accessToken,
      getCookieOptions(15 * 60 * 1000)
    );

    // Refresh token: long-lived (30 days)
    res.cookie(
      "refreshToken",
      tokens.refreshToken,
      getCookieOptions(30 * 24 * 60 * 60 * 1000)
    );

    res.json({
      message: "Login successful",
      user: { id: user.id, name: user.name, email: user.email },
    });
  } catch (error) {
    console.error("Login Failed:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

/*------------------------------
* Refresh token Controller
* Private , "/refresh" , POST
* check if refresh token is valide
--------------------------------*/
export const refresh = async (req: Request, res: Response): Promise<void> => {
  try {
    const token = req.cookies.refreshToken;

    if (!token) {
      res.status(401).json({ message: "No refresh token" });
      return;
    }

    try {
      // Verify refresh token
      const decoded = jwt.verify(token, authConfig.refresh_secret) as {
        userId: number;
      };

      // Find the session with this refresh token using our utility
      const session = await prisma.session.findUnique({
        where: { refreshToken: token },
      });

      // Check if session exists, is valid and belongs to the decoded user
      if (!session || !session.isValid || session.userId !== decoded.userId) {
        res.status(403).json({ message: "Invalid refresh token" });
        return;
      }

      // Create new access token
      const newAccessToken = jwt.sign(
        { userId: session.userId },
        authConfig.secret,
        {
          expiresIn: "15m",
        }
      );
      res.cookie(
        "accessToken",
        newAccessToken,
        getCookieOptions(15 * 60 * 1000) // 15min
      );

      res.json({
        message: "Access token refreshed",
        sessionId: session.id,
      });
      return;
    } catch (error) {
      res.status(403).json({ message: "Invalid or expired refresh token" });
      return;
    }
  } catch (error) {
    console.error("Token refresh failed:", error);
    res.status(500).json({ message: "Internal server error" });
    return;
  }
};

/**
 * Logout Controller
 * Private , "logout" , POST
 * check if user login first
 *   */
export const logout = async (req: Request, res: Response): Promise<void> => {
  try {
    const refreshToken = req.cookies.refreshToken;
    const userId = req.user?.id;
    const sessionId = req.user?.sessionId;

    if (refreshToken && sessionId) {
      // Invalidate the specific session for this refresh token
      await invalidateSession(sessionId);
    } else if (userId) {
      // If no session ID but we have a userId, invalidate all sessions for this user
      await invalidateAllUserSessions(parseInt(userId));
    }

    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");
    res.json({ message: "Logged out successfully." });
  } catch (error) {
    console.error("Logout Failed:", error);
    res.status(500).json({ message: "Failed to logout" });
  }
};
