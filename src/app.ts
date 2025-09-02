import express, { Express, Request, Response } from "express";
import cookieParser from "cookie-parser";
import cors from "cors";

import dotenv from "dotenv";
import morgan from "morgan";

import prisma from "./prisma";
import authRoutes from "./routes/auth";
import userRoutes from "./routes/user";
import blogRoutes from "./routes/blog";
import sessionRoutes from "./routes/session";
import { authenticate } from "./middlewares/auth.middleware";

// Load environment variables
dotenv.config();

const app: Express = express();

/*------------------------------
* Middleware Setup
--------------------------------*/
app.use(morgan("dev"));
app.use(cookieParser()); // Required for reading HTTP-only cookies

app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000", // use front end url or allow all
    credentials: true, // important : allows cookies to be sent
  })
);

// Parse JSON requests
app.use(express.json());

// Parse URL-encoded requests
app.use(express.urlencoded({ extended: true }));

/*------------------------------
* Routes
--------------------------------*/

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/blogs", blogRoutes);
app.use("/api/sessions", sessionRoutes);

app.get("/api/profile", authenticate, async (req, res) => {
  try {
    const userId = parseInt(req.user?.id || "0");

    if (!userId) {
      res.status(401).json({
        status: "error",
        message: "Authentication required",
      });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        updatedAt: true,
        blogs: {
          select: {
            id: true,
            title: true,
            createdAt: true,
          },
          orderBy: { createdAt: "desc" },
          take: 5, // Get 5 most recent blogs
        },
        sessions: {
          select: {
            id: true,
            userAgent: true,
            createdAt: true,
          },
          where: { isValid: true },
        },
      },
    });

    if (!user) {
      res.status(404).json({
        status: "error",
        message: "User not found",
      });
      return;
    }

    res.json({
      status: "success",
      user,
    });
  } catch (error) {
    console.error("Profile fetch error:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to retrieve profile information",
    });
  }
});

app.get("/health", (req: Request, res: Response) => {
  res.json({ status: "ok" });
});
app.get("/api", (req: Request, res: Response) => {
  res.json({ status: "ok" });
});
app.get("/", (req: Request, res: Response) => {
  res.json({ status: "ok" });
});
export default app;
