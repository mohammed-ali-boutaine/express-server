import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import morgan from "morgan";

// Load environment variables
dotenv.config();

const app = express();

app.use(morgan("dev"));

app.use(cors());
app.use(express.json());

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

export default app;
