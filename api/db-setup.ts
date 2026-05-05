import { neon } from "@neondatabase/serverless";
import { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(
  request: VercelRequest,
  response: VercelResponse,
) {
  try {
    const sql = neon(process.env.DATABASE_URL || process.env.POSTGRES_URL!);

    // Create counter_groups table
    await sql.query(`
      CREATE TABLE IF NOT EXISTS counter_groups (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL UNIQUE,
        access_key_hash TEXT NOT NULL,
        display_name TEXT,
        profile_image_url TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // Create counters table
    await sql.query(`
      CREATE TABLE IF NOT EXISTS counters (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        group_id UUID NOT NULL REFERENCES counter_groups(id) ON DELETE CASCADE,
        name TEXT NOT NULL DEFAULT 'Counter',
        description TEXT DEFAULT '',
        value INTEGER DEFAULT 0,
        increment_step INTEGER DEFAULT 1,
        decrement_step INTEGER DEFAULT 1,
        thumbnail_url TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // Create indexes
    await sql.query(
      `CREATE INDEX IF NOT EXISTS idx_counter_groups_name ON counter_groups(name);`,
    );
    await sql.query(
      `CREATE INDEX IF NOT EXISTS idx_counter_groups_access_key_hash ON counter_groups(access_key_hash);`,
    );
    await sql.query(
      `CREATE INDEX IF NOT EXISTS idx_counters_group_id ON counters(group_id);`,
    );

    return response.status(200).json({ message: "Database setup successful" });
  } catch (error) {
    console.error("Database setup error:", error);
    return response
      .status(500)
      .json({
        error: error instanceof Error ? error.message : "Unknown error",
      });
  }
}
