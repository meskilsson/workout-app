import "dotenv/config";

import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

import { connectDB } from "./config/db";
import authRouter from "./routes/authRoutes";
import userRouter from "./routes/userRoutes";
import workoutRouter from "./routes/workoutRoutes";
import exerciseRouter from "./routes/exerciseRoutes";
import workoutSessionRouter from "./routes/workoutSessionRoutes";
import { notFound } from "./middleware/notFound";
import logger from "./middleware/logger";

const app = express();
const PORT = process.env.PORT || 5000;

app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  }),
);

app.use(express.json());
app.use(cookieParser());


app.get("/", (_req, res) => {
  res.json({ message: "Backend is running" });
});

app.use("/api/auth", authRouter);
app.use("/api/users", userRouter);
app.use("/api/workouts", workoutRouter);
app.use("/api/exercises", exerciseRouter);
app.use("/api/workout-sessions", workoutSessionRouter);

app.use(notFound);
app.use(logger);

async function startServer(): Promise<void> {
  await connectDB();

  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();