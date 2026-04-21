import "dotenv/config";
import { Pool } from "pg";

function getRequiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

const dbPort = Number(process.env.DB_PORT ?? 5432);

if (Number.isNaN(dbPort)) {
  throw new Error("DB_PORT must be a valid number");
}

export const pool = process.env.DATABASE_URL
  ? new Pool({
      connectionString: process.env.DATABASE_URL,
    })
  : new Pool({
      user: getRequiredEnv("DB_USER"),
      host: getRequiredEnv("DB_HOST"),
      database: getRequiredEnv("DB_NAME"),
      password: getRequiredEnv("DB_PASSWORD"),
      port: dbPort,
    });

