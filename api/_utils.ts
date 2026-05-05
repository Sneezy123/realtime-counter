import { createHash } from "crypto";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL || process.env.POSTGRES_URL!);

export async function hashAccessKey(accessKey: string): Promise<string> {
  return createHash("sha256").update(accessKey).digest("hex");
}

export async function verifyAccess(groupName: string, accessKey: string) {
  const hash = await hashAccessKey(accessKey);
  const rows = await sql.query(
    "SELECT id FROM counter_groups WHERE name = $1 AND access_key_hash = $2",
    [groupName, hash],
  );
  return rows[0]?.id || null;
}

export async function verifyAccessById(groupId: string, accessKey: string) {
  const hash = await hashAccessKey(accessKey);
  const rows = await sql.query(
    "SELECT id FROM counter_groups WHERE id = $1 AND access_key_hash = $2",
    [groupId, hash],
  );
  return rows[0]?.id || null;
}
