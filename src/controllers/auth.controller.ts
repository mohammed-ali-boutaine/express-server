import { Request, Response } from "express";
import prisma from "../prisma";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

import { createJWT, hashPassword } from "../utils/auth";
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

    // create access token and refresh token
    const tokens = createJWT(user.id);

    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken: tokens.refreshToken },
    });

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

    // create access token and refersh token based on user id
    const tokens = createJWT(user.id);

    // Store the refresh token in the database
    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken: tokens.refreshToken },
    });

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
        id: number;
      };

      // Ensure refresh token matches DB (rotation security)
      const user = await prisma.user.findUnique({ where: { id: decoded.id } });
      if (!user || user.refreshToken !== token) {
        res.status(403).json({ message: "Invalid refresh token" });
        return;
      }

      // Create new access token
      const newAccessToken = jwt.sign({ id: user.id }, authConfig.secret, {
        expiresIn: "15m",
      });
      res.cookie(
        "accessToken",
        newAccessToken,
        getCookieOptions(15 * 60 * 1000)
      );

      res.json({ message: "Access token refreshed" });
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
    const userId = req.user?.id;
    if (userId) {
      await prisma.user.update({
        where: { id: parseInt(userId) },
        data: { refreshToken: null }, // Clear the refresh token from the database
      });
    }
    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");
    res.json({ message: "Logged out successfully." });
  } catch (error) {
    console.error("Logout Failed:", error);
    res.status(500).json({ message: "Failed to logout" });
  }
};
