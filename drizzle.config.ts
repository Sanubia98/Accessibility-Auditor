import "dotenv/config";
import { defineConfig } from "drizzle-kit";

// const Database_URL = "postgresql://postgres:bia123@localhost:5432/MyDatabase";
if (! process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL, ensure the database is provisioned");
}

console.log("Using database URL:", process.env.DATABASE_URL);
export default defineConfig({
  out: "./migrations",
  schema: "./shared/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
  url: process.env.DATABASE_URL, // Replace with your actual database URL
    // process.env.DATABASE_URL,
  },
});
