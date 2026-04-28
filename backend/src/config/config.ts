import dotenv from "dotenv";

dotenv.config();

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
      `[Config] Missing required environment variable: ${key}. Please check your .env file.`,
    );
  }
}

const databaseUrl = process.env.DATABASE_URL!;
let parsedDatabaseUrl: URL;

try {
  parsedDatabaseUrl = new URL(databaseUrl);
} catch {
  throw new Error("[Config] DATABASE_URL is not a valid URL.");
}

const databaseHost = process.env.DATABASE_HOST || parsedDatabaseUrl.hostname;
const databaseUser =
  process.env.DATABASE_USER || decodeURIComponent(parsedDatabaseUrl.username);
const databasePassword =
  process.env.DATABASE_PASSWORD || decodeURIComponent(parsedDatabaseUrl.password);
const databaseName =
  process.env.DATABASE_NAME || parsedDatabaseUrl.pathname.replace(/^\//, "");

if (!databaseHost || !databaseUser || !databaseName) {
  throw new Error(
    "[Config] Database connection details are incomplete. Set DATABASE_URL or DATABASE_HOST/DATABASE_USER/DATABASE_NAME.",
  );
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
  emailFrom: string;
  resendApiKey: string;
  resetPasswordTtlMinutes: number;
}

const resetPasswordTtlMinutes = Number(
  process.env.RESET_PASSWORD_TTL_MINUTES || 30,
);
if (!Number.isFinite(resetPasswordTtlMinutes) || resetPasswordTtlMinutes <= 0) {
  throw new Error(
    "[Config] RESET_PASSWORD_TTL_MINUTES must be a positive number.",
  );
}

const config: Config = {
  port: Number(process.env.PORT) || 3000,
  nodeEnv: process.env.NODE_ENV || "development",
  jwtSecret: process.env.JWT_SECRET!,
  passwordPepper: process.env.PASSWORD_PEPPER!,
  bcryptRounds: Number(process.env.BCRYPT_ROUNDS) || 12,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",
  databaseUrl,
  databaseHost,
  databaseUser,
  databaseName,
  databasePassword,
  spotifyClientId: process.env.SPOTIFY_CLIENT_ID!,
  spotifyClientSecret: process.env.SPOTIFY_CLIENT_SECRET!,
  spotifyRedirectUri: process.env.SPOTIFY_REDIRECT_URI!,
  frontendUrl: process.env.FRONTEND_URL || "http://localhost:5173",
  emailFrom:
    process.env.EMAIL_FROM || "Beatwave <no-reply@beatwave.local>",
  resendApiKey: process.env.RESEND_API_KEY || "",
  resetPasswordTtlMinutes,
};

export default config;
