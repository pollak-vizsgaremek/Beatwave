/**
 * scripts/debug-db.ts
 *
 * One-off development script to verify the database connection and print
 * basic diagnostics. Run with: npx tsx scripts/debug-db.ts
 *
 * NOT part of the production application — kept here for convenience.
 */
import "dotenv/config";
import { prisma } from "../src/lib/prisma";
import config from "../src/config/config";

async function main() {
  try {
    console.log("Checking ENV vars...");
    console.log("DB_HOST:", config.databaseHost);
    console.log("DB_USER:", config.databaseUser);
    console.log("DB_NAME:", config.databaseName);

    console.log("Attempting to connect to Prisma...");
    await prisma.$connect();
    console.log("Connection successful!");

    const count = await prisma.user.count();
    console.log("User count:", count);
  } catch (e: any) {
    console.error("Connection failed:", e);
    if (e.message) console.error("Message:", e.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
