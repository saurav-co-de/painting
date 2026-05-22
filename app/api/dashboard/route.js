import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { buildDashboardStats } from "@/lib/billing";
import { readDatabase } from "@/lib/db";

export async function GET() {
  try {
    const user = await requireUser();
    const database = await readDatabase();
    const invoices = database.invoices.filter((invoice) => invoice.userId === user.id);

    return NextResponse.json({
      stats: buildDashboardStats(invoices),
      recentInvoices: invoices.slice(-5).reverse()
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: error.status || 500 });
  }
}
