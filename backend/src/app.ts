import express from "express";
import appRoutes from "./routes/appRoutes";
import { errorHandler } from "./middlewares/errorHandler";

import cors from "cors";

const app = express();

app.use(
  cors({
    origin: "http://localhost:5173", // URL of the frontend
    credentials: true,
  })
);

app.use(express.json());

app.use("/", appRoutes);

// Global error handler (should be after routes)
app.use(errorHandler);

export default app;
