import { Request, Response } from "express";
import prisma from "../prisma/client";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

import { createJWT, hashPassword } from "../utils/auth";
import authConfig from "../config/auth.config";
/*------------------------------
* Register Controller
* Public , "/register" , POST
--------------------------------*/

export const register = async (req: Request, res: Response) => {
  const { email, name, password } = req.body; // added zod

  try {
    // check if email exists
    const userExists = await prisma.user.findUnique({ where: { email } });

    if (userExists)
      return res.status(401).json({ message: "This email aleardy exists" });

    const hashed = await hashPassword(password);

    const user = await prisma.user.create({
      data: { email, name, password: hashed },
    });

    // create access token and refersh token
    const tokens = createJWT(user.id);

    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken: tokens.refreshToken },
    });

    // Set cookies
    res.cookie("accessToken", tokens.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 15 * 60 * 1000, // 15 minutes
      sameSite: "strict",
    });

    res.cookie("refreshToken", tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 24 * 60 * 60 * 1000 * 30, // 30 days
      sameSite: "strict",
    });

    res.status(201).json({
      message: "Registration successful",
      user: { id: user.id, name: user.name, email: user.email },
    });
  } catch (error) {
    console.error("Registration Failed:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

/* ------------------------------
* Login Controller
* Public , "/login" , POST
--------------------------------*/
export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body; // add zod validation her

  // logic
  try {
    // find user by email
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user || !(await bcrypt.compare(password, user.password)))
      return res.status(401).json({ message: "Invalid credentials" });

    // create access token and refersh token based on user id
    const tokens = createJWT(user.id);

    // Store the refresh token in the database
    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken: tokens.refreshToken },
    });

    res.cookie("accessToken", tokens.accessToken, {
      httpOnly: true, // Ensure the cookie cannot be accessed via JavaScript (security against XSS attacks)
      secure: process.env.NODE_ENV === "production", // Set to true in production for HTTPS-only cookies
      maxAge: 15 * 60 * 1000, // 15 minutes in mileseconds
      sameSite: "strict", // Ensures the cookie is sent only with requests from the same site
    });
    res.cookie("refreshToken", tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 24 * 60 * 60 * 1000 * 30, // 24 hours is mileseconds
      sameSite: "strict",
    });

    res.json({
      message: "Login successful",
      user: { id: user.id, name: user.name, email: user.email },
    });
  } catch (error) {
    console.error("Login Failed:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

/*------------------------------
* Refresh token Controller
* Private , "/refresh" , POST
* check if refresh token is valide
--------------------------------*/
export const refresh = async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.user.id);
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({ message: "Refresh token required" });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || user.refreshToken !== refreshToken)
      return res.status(401).json({ message: "Invalid refresh token" });

    // Verify the refresh token
    try {
      jwt.verify(refreshToken, authConfig.refresh_secret);
    } catch (error) {
      return res.status(401).json({ message: "Invalid refresh token" });
    }

    // generating new access token
    const newAccessToken = jwt.sign({ userId }, authConfig.secret, {
      expiresIn: authConfig.secret_expires_in as any,
    });

    res.cookie("accessToken", newAccessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 15 * 60 * 1000, // 15 minutes
      sameSite: "strict",
    });

    res.json({ message: "Token refreshed successfully" });
  } catch (error) {
    console.error("Token refresh failed:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * Logout Controller
 * Private , "logout" , POST
 * check if user login first
 *   */ 
export const logout = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId; // Assumed that user data is added by the middleware
    if (userId) {
      await prisma.user.update({
        where: { id: userId },
        data: { refreshToken: null }, // Clear the refresh token from the database
      });
    }
    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");
    res.json({ message: "Logged out successfully." });
  } catch (error) {
    console.error("Logout Failed:", error);

    console.error("Logout Failed:", error); // Log the error for debugging
  }
};
