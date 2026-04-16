import express from "express";
import cors from "cors";
import config from "./config/config";
import appRoutes from "./routes/appRoutes";
import { errorHandler } from "./middlewares/errorHandler";

const app = express();

app.use(
  cors({
    origin: config.frontendUrl,
    credentials: true,
  }),
);

app.use(express.json({ limit: "50kb" }));

app.use("/", appRoutes);
app.use(errorHandler);

export default app;
