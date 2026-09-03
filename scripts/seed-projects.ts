import "dotenv/config";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { upsertProject } from "../src/lib/db";
import { projects } from "../src/lib/projects";

async function seed() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not set — add it to .env.local before seeding.");
  }
  console.log("Seeding projects...");
  for (const p of projects) {
    await upsertProject({
      ...p,
      url: p.url || null,
      metrics: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
    console.log(`Upserted: ${p.slug}`);
  }
  console.log("Done!");
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
