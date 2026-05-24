import "dotenv/config";

import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

import { connectDB } from "./config/db";
import authRouter from "./routes/authRoutes";
import userRouter from "./routes/userRoutes";
import exerciseRouter from "./routes/exerciseRoutes";
import workoutSessionRouter from "./routes/workoutSessionRoutes";
import workoutDraftRouter from "./routes/workoutDraftRoutes";
import { notFound } from "./middleware/notFound";
import logger from "./middleware/logger";
import errorHandler from "./middleware/errorHandler";
import adminRouter from "./routes/adminRoutes";
import workoutTemplateRouter from "./routes/workoutTemplateRoutes";

const app = express();
const PORT = process.env.PORT || 5000;

function parseCorsOrigins(value?: string) {
  if (!value) {
    return [];
  }

  return value
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
}

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:4173",
  ...parseCorsOrigins(process.env.CORS_ORIGIN),
  ...parseCorsOrigins(process.env.CORS_ORIGINS),
];

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error(`CORS blocked origin: ${origin}`));
    },
    credentials: true,
  }),
);

app.use(express.json());
app.use(cookieParser());

app.use(logger);

app.get("/", (_req, res) => {
  res.json({ message: "Backend is running" });
});

app.use("/api/auth", authRouter);
app.use("/api/users", userRouter);
app.use("/api/exercises", exerciseRouter);
app.use("/api/workout-sessions", workoutSessionRouter);
app.use("/api/workout-drafts", workoutDraftRouter);
app.use("/api/admin", adminRouter);
app.use("/api/workout-templates", workoutTemplateRouter);

app.use(notFound);
app.use(errorHandler);

async function startServer(): Promise<void> {
  await connectDB();

  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();