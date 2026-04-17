import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";

import { connectDB } from "./config/db";
import userRouter from "./routes/userRoutes";
import workoutRouter from "./routes/workoutRoutes";
import authRouter from "./routes/authRouter";
import { notFound } from "./middleware/notFound";
import { errorHandler } from "./middleware/errorHandler";
import logger from "./middleware/logger";
const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use(logger);

app.get("/", (_req, res) => {
  res.json({ message: "Backend is running" });
});

app.use("/api/users", userRouter);
app.use("/api/workouts", workoutRouter);
app.use("/api/auth", authRouter);


app.use(notFound);
app.use(errorHandler);

async function startServer(): Promise<void> {
  await connectDB();

  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
