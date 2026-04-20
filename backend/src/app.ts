import express from "express";
import cors from "cors";
import config from "./config/config";
import appRoutes from "./routes/appRoutes";
import { errorHandler } from "./middlewares/errorHandler";
import {
  apiRateLimiter,
  authRateLimiter,
} from "./middlewares/rateLimit";

const app = express();
app.disable("x-powered-by");

app.use(
  cors({
    origin: config.frontendUrl,
    credentials: true,
  }),
);

app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "no-referrer");
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'none'; frame-ancestors 'none'; base-uri 'none'",
  );

  if (config.nodeEnv === "production") {
    res.setHeader(
      "Strict-Transport-Security",
      "max-age=31536000; includeSubDomains",
    );
  }

  next();
});

app.use(express.json({ limit: "50kb" }));
app.use(apiRateLimiter);
app.use("/login", authRateLimiter);
app.use("/register", authRateLimiter);

app.use("/", appRoutes);
app.use(errorHandler);

export default app;
