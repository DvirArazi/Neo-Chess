import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool, type PoolConfig } from "pg";

function getSslConfig(databaseUrl: string): PoolConfig["ssl"] {
  if (process.env.DATABASE_SSL === "false") {
    return false;
  }

  if (process.env.DATABASE_SSL === "true") {
    return { rejectUnauthorized: false };
  }

  try {
    const hostname = new URL(databaseUrl).hostname;
    if (hostname === "localhost" || hostname === "127.0.0.1") {
      return false;
    }
  } catch {
    return { rejectUnauthorized: false };
  }

  return { rejectUnauthorized: false };
}

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error("DATABASE_URL is not set");
}

const pool = new Pool({
  connectionString: databaseUrl,
  ssl: getSslConfig(databaseUrl),
});

export const db = drizzle(pool);
export async function closeDatabase(): Promise<void> {
  await pool.end();
}
