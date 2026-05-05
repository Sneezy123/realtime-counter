import { neon } from "@neondatabase/serverless";

export const config = {
  runtime: "edge",
};

export default async function handler(request: Request) {
  const url = new URL(request.url);
  const groupId = url.searchParams.get("groupId");

  if (!groupId) {
    return new Response(JSON.stringify({ error: "Missing groupId" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const sql = neon(process.env.DATABASE_URL || process.env.POSTGRES_URL!);
  let intervalId: any;

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      let lastUpdatedAt: string | null = null;

      const poll = async () => {
        try {
          const rows = await sql.query(
            "SELECT MAX(updated_at) as last_update FROM counters WHERE group_id = $1",
            [groupId],
          );

          const currentLastUpdate = (rows[0] as any)?.last_update;

          if (
            currentLastUpdate &&
            (!lastUpdatedAt || currentLastUpdate !== lastUpdatedAt)
          ) {
            lastUpdatedAt = currentLastUpdate;

            const counters = await sql.query(
              "SELECT * FROM counters WHERE group_id = $1 ORDER BY created_at ASC",
              [groupId],
            );

            const data = JSON.stringify({ counters });
            controller.enqueue(encoder.encode(`data: ${data}\n\n`));
          } else {
            // Heartbeat to keep connection alive
            controller.enqueue(encoder.encode(": heartbeat\n\n"));
          }
        } catch (error) {
          console.error("SSE polling error:", error);
        }
      };

      await poll();
      intervalId = setInterval(poll, 2000);
    },
    cancel() {
      if (intervalId) {
        clearInterval(intervalId);
      }
      console.log("SSE connection closed");
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
