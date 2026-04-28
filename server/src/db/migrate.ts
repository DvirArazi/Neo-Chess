import { migrate } from "drizzle-orm/node-postgres/migrator";
import { closeDatabase, db } from "./index.js";

async function runMigrations(): Promise<void> {
  try {
    await migrate(db, { migrationsFolder: "./drizzle" });
    console.log("Database migrations applied");
  } finally {
    await closeDatabase();
  }
}

runMigrations().catch((error) => {
  console.error("Database migration failed", error);
  process.exitCode = 1;
});
