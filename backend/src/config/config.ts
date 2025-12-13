import dotenv from "dotenv";

dotenv.config();

interface Config {
  port: number;
  nodeEnv: string;
  jwtSecret: string;
  passwordPepper: string;
  bcryptRounds: number;
  jwtExpiresIn: string;
}

const config: Config = {
  port: Number(process.env.PORT) || 3000,
  nodeEnv: process.env.NODE_ENV || "development",
  jwtSecret: process.env.JWT_SECRET || "secretKey",
  passwordPepper: process.env.PASSWORD_PEPPER || "",
  bcryptRounds: Number(process.env.BCRYPT_ROUNDS) || 12,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",
};

export default config;
