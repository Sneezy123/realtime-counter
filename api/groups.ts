import { neon } from "@neondatabase/serverless";
import { VercelRequest, VercelResponse } from "@vercel/node";
import { hashAccessKey } from "./_utils.js";

const sql = neon(process.env.DATABASE_URL || process.env.POSTGRES_URL!);

export default async function handler(
  request: VercelRequest,
  response: VercelResponse,
) {
  const { method } = request;

  try {
    if (method === "GET") {
      const { name } = request.query;
      if (!name)
        return response.status(400).json({ error: "Missing group name" });

      const rows = await sql.query(
        "SELECT id, name, display_name, profile_image_url, access_key_hash FROM counter_groups WHERE name = $1",
        [name],
      );

      if (rows.length === 0)
        return response.status(404).json({ error: "Group not found" });
      return response.status(200).json(rows[0]);
    }

    if (method === "POST") {
      const { name, accessKey, display_name } = request.body;
      if (!name || !accessKey) {
        console.error("POST /api/groups missing fields:", {
          name,
          hasAccessKey: !!accessKey,
        });
        return response.status(400).json({ error: "Missing required fields" });
      }

      const hash = await hashAccessKey(accessKey);

      // Try to get or create
      const rows = await sql.query(
        "INSERT INTO counter_groups (name, access_key_hash, display_name) VALUES ($1, $2, $3) ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name RETURNING id, name, display_name, profile_image_url",
        [name, hash, display_name || name],
      );

      if (!rows || rows.length === 0) {
        throw new Error("Failed to create or update group");
      }

      return response.status(200).json(rows[0]);
    }

    if (method === "PATCH") {
      const { id, accessKey, display_name, profile_image_url } = request.body;
      if (!id || !accessKey)
        return response.status(400).json({ error: "Missing required fields" });

      // Verify access using id and key
      const hash = await hashAccessKey(accessKey);
      const verifyRows = await sql.query(
        "SELECT id FROM counter_groups WHERE id = $1 AND access_key_hash = $2",
        [id, hash],
      );

      if (verifyRows.length === 0)
        return response.status(403).json({ error: "Forbidden" });

      const rows = await sql.query(
        "UPDATE counter_groups SET display_name = COALESCE($1, display_name), profile_image_url = COALESCE($2, profile_image_url), updated_at = NOW() WHERE id = $3 RETURNING *",
        [display_name, profile_image_url, id],
      );

      return response.status(200).json(rows[0]);
    }

    return response.status(405).json({ error: "Method not allowed" });
  } catch (error) {
    console.error("API Groups error:", error);
    // Ensure we always return JSON even on error
    return response.status(500).json({
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
