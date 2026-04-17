import dotenv from "dotenv";

dotenv.config();

// ────────────────────────────────────────────────────────────
// Startup validation — fail fast if critical secrets are absent
// ────────────────────────────────────────────────────────────
const REQUIRED_ENV_VARS = [
  "JWT_SECRET",
  "PASSWORD_PEPPER",
  "SPOTIFY_CLIENT_ID",
  "SPOTIFY_CLIENT_SECRET",
  "SPOTIFY_REDIRECT_URI",
  "DATABASE_URL",
] as const;

for (const key of REQUIRED_ENV_VARS) {
  if (!process.env[key]) {
    throw new Error(
      `[Config] Missing required environment variable: ${key}. ` +
        "Please check your .env file before starting the server.",
    );
  }
}

interface Config {
  port: number;
  nodeEnv: string;
  jwtSecret: string;
  passwordPepper: string;
  bcryptRounds: number;
  jwtExpiresIn: string;
  databaseUrl: string;
  databaseHost: string;
  databaseUser: string;
  databaseName: string;
  databasePassword: string;
  spotifyClientId: string;
  spotifyClientSecret: string;
  spotifyRedirectUri: string;
  frontendUrl: string;
}

const config: Config = {
  port: Number(process.env.PORT) || 3000,
  nodeEnv: process.env.NODE_ENV || "development",
  // These are guaranteed to exist by the check above
  jwtSecret: process.env.JWT_SECRET!,
  passwordPepper: process.env.PASSWORD_PEPPER!,
  bcryptRounds: Number(process.env.BCRYPT_ROUNDS) || 12,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",
  databaseUrl: process.env.DATABASE_URL!,
  databaseHost: process.env.DATABASE_HOST || "",
  databaseUser: process.env.DATABASE_USER || "",
  databaseName: process.env.DATABASE_NAME || "",
  databasePassword: process.env.DATABASE_PASSWORD || "",
  spotifyClientId: process.env.SPOTIFY_CLIENT_ID!,
  spotifyClientSecret: process.env.SPOTIFY_CLIENT_SECRET!,
  spotifyRedirectUri: process.env.SPOTIFY_REDIRECT_URI!,
  frontendUrl: process.env.FRONTEND_URL || "http://localhost:5173",
};

export default config;
