import "dotenv/config";
import { PrismaMariaDb } from '@prisma/adapter-mariadb';

import { PrismaClient } from '../../generated/prisma/client';
import config from '../config/config';

const adapter = new PrismaMariaDb({
  host: config.databaseHost,
  user: config.databaseUser,
  password: config.databasePassword,
  database: config.databaseName,
  connectionLimit: 20
});
const prisma = new PrismaClient({ adapter });

export { prisma }