import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { getSyncQueueStats, processSyncQueue } from "@/lib/database/sync.js";
import { writeRecordToSupabase } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireUser();
    const stats = await getSyncQueueStats();
    return NextResponse.json({ ok: true, stats });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: error.status || 500 });
  }
}

export async function POST() {
  try {
    await requireUser();
    const results = await processSyncQueue(50, writeRecordToSupabase);
    const stats = await getSyncQueueStats();
    return NextResponse.json({
      ok: true,
      message: "Sync queue processed.",
      results,
      stats
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: error.status || 500 });
  }
}
