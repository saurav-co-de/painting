import { checkMongoHealth, isMongoConfigured } from "./mongodb.js";
import { getSyncQueueStats } from "./sync.js";

export async function checkSupabaseHealth() {
  const usePostgres =
    Boolean(process.env.DATABASE_URL) && process.env.USE_FILE_DB?.toLowerCase() !== "true";

  if (!usePostgres) {
    return {
      status: "ONLINE",
      mode: "local_json",
      message: "Running in local file-backed development mode"
    };
  }

  const startTime = Date.now();
  try {
    const { Pool } = await import("pg");
    const testPool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 1,
      connectionTimeoutMillis: 3500,
      ssl: process.env.DATABASE_URL?.includes("localhost")
        ? false
        : { rejectUnauthorized: false }
    });

    try {
      const client = await testPool.connect();
      try {
        await client.query("SELECT 1 AS health");
        const latencyMs = Date.now() - startTime;
        return {
          status: "ONLINE",
          mode: "supabase_postgres",
          latencyMs
        };
      } finally {
        client.release();
      }
    } finally {
      await testPool.end();
    }
  } catch (error) {
    return {
      status: "OFFLINE",
      mode: "supabase_postgres",
      error: error.message || "Failed to reach Supabase PostgreSQL"
    };
  }
}

export async function getSystemHealth() {
  const [supabaseHealth, mongoHealth, syncStats] = await Promise.all([
    checkSupabaseHealth(),
    checkMongoHealth(),
    getSyncQueueStats().catch(() => ({ pending: 0, failed: 0, total: 0 }))
  ]);

  const overallStatus =
    supabaseHealth.status === "ONLINE" || mongoHealth.status === "ONLINE"
      ? "healthy"
      : "degraded";

  return {
    status: overallStatus,
    timestamp: new Date().toISOString(),
    databases: {
      supabase: supabaseHealth,
      mongodb: mongoHealth
    },
    sync: syncStats
  };
}
