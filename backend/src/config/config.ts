import dotenv from "dotenv";

dotenv.config();

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
  jwtSecret: process.env.JWT_SECRET || "secretKey",
  passwordPepper: process.env.PASSWORD_PEPPER || "",
  bcryptRounds: Number(process.env.BCRYPT_ROUNDS) || 12,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",
  databaseUrl: process.env.DATABASE_URL || "",
  databaseHost: process.env.DATABASE_HOST || "",
  databaseUser: process.env.DATABASE_USER || "",
  databaseName: process.env.DATABASE_NAME || "",
  databasePassword: process.env.DATABASE_PASSWORD || "",
  spotifyClientId: process.env.SPOTIFY_CLIENT_ID || "",
  spotifyClientSecret: process.env.SPOTIFY_CLIENT_SECRET || "",
  spotifyRedirectUri: process.env.SPOTIFY_REDIRECT_URI || "",
  frontendUrl: process.env.FRONTEND_URL || "http://localhost:5173",
};

export default config;
