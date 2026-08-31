import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { env } from "../config/env.js";
import * as schema from "./schema.js";

const dbPath = path.resolve(process.cwd(), env.DATABASE_URL);
fs.mkdirSync(path.dirname(dbPath), { recursive: true });

const sqlite = new Database(dbPath);
sqlite.pragma("journal_mode = WAL");

export const db = drizzle(sqlite, { schema });

const migrationsDir = env.MIGRATIONS_DIR
  ? path.resolve(env.MIGRATIONS_DIR)
  : path.resolve(process.cwd(), "data", "migrations");

if (fs.existsSync(migrationsDir)) {
  migrate(db, { migrationsFolder: migrationsDir });
}
