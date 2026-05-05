import { neon } from "@neondatabase/serverless";
import { VercelRequest, VercelResponse } from "@vercel/node";
import { verifyAccessById } from "./_utils.js";

const sql = neon(process.env.DATABASE_URL || process.env.POSTGRES_URL!);

export default async function handler(
  request: VercelRequest,
  response: VercelResponse,
) {
  const { method } = request;

  try {
    if (method === "GET") {
      const { groupId } = request.query;
      if (!groupId)
        return response.status(400).json({ error: "Missing groupId" });

      const rows = await sql.query(
        "SELECT * FROM counters WHERE group_id = $1 ORDER BY created_at ASC",
        [groupId],
      );
      return response.status(200).json(rows);
    }

    if (method === "POST") {
      const {
        groupId,
        accessKey,
        name,
        description,
        value,
        increment_step,
        decrement_step,
        thumbnail_url,
      } = request.body;
      if (!groupId || !accessKey)
        return response.status(400).json({ error: "Missing required fields" });

      if (!(await verifyAccessById(groupId, accessKey))) {
        return response.status(403).json({ error: "Forbidden" });
      }

      const rows = await sql.query(
        "INSERT INTO counters (group_id, name, description, value, increment_step, decrement_step, thumbnail_url) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *",
        [
          groupId,
          name || "New Counter",
          description || "",
          value || 0,
          increment_step || 1,
          decrement_step || 1,
          thumbnail_url,
        ],
      );

      return response.status(200).json(rows[0]);
    }

    if (method === "PATCH") {
      const { id, groupId, accessKey, ...updates } = request.body;
      if (!id || !groupId || !accessKey)
        return response.status(400).json({ error: "Missing required fields" });

      if (!(await verifyAccessById(groupId, accessKey))) {
        return response.status(403).json({ error: "Forbidden" });
      }

      const keys = Object.keys(updates);
      const values = Object.values(updates);
      const setClause = keys.map((key, i) => `${key} = $${i + 3}`).join(", ");

      const query = `UPDATE counters SET ${setClause}, updated_at = NOW() WHERE id = $1 AND group_id = $2 RETURNING *`;
      const rows = await sql.query(query, [id, groupId, ...values]);

      return response.status(200).json(rows[0]);
    }

    if (method === "DELETE") {
      const { id, groupId, accessKey } = request.body;
      if (!id || !groupId || !accessKey)
        return response.status(400).json({ error: "Missing required fields" });

      if (!(await verifyAccessById(groupId, accessKey))) {
        return response.status(403).json({ error: "Forbidden" });
      }

      await sql.query("DELETE FROM counters WHERE id = $1 AND group_id = $2", [
        id,
        groupId,
      ]);
      return response.status(200).json({ success: true });
    }

    return response.status(405).json({ error: "Method not allowed" });
  } catch (error) {
    console.error("API Counters error:", error);
    return response.status(500).json({
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
