import express from "express";
import appRoutes from "./routes/appRoutes";
import { errorHandler } from "./middlewares/errorHandler";

import cors from "cors";

const app = express();

import config from "./config/config";

app.use(
  cors({
    origin: config.frontendUrl, // URL of the frontend configuration
    credentials: true,
  }),
);

app.use(express.json());

app.use("/", appRoutes);

// Global error handler (should be after routes)
app.use(errorHandler);

export default app;
