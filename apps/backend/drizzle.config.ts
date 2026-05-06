import "dotenv/config";
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  out: "./data/migrations",
  schema: "./src/db/schema.ts",
  dialect: "sqlite",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "./data/dsa_lab.db"
  }
});
