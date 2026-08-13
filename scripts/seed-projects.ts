import "dotenv/config";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { upsertProject } from "../src/lib/db";
import { projects } from "../src/lib/projects";

async function seed() {
  console.log("Seeding projects...");
  for (const p of projects) {
    await upsertProject({
      ...p,
      url: p.url || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
    console.log(`Upserted: ${p.slug}`);
  }
  console.log("Done!");
}

seed().catch(console.error);
