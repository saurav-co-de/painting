import { NextResponse } from "next/server";
import { getSystemHealth } from "@/lib/database/health.js";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const health = await getSystemHealth();
    const isDegraded = health.status === "degraded";

    return NextResponse.json(health, { status: isDegraded ? 503 : 200 });
  } catch (error) {
    return NextResponse.json(
      {
        status: "error",
        timestamp: new Date().toISOString(),
        error: "Internal health check failed"
      },
      { status: 500 }
    );
  }
}
