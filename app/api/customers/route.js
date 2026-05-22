import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { createCustomer, listCustomersForUser } from "@/lib/db";

export async function GET() {
  try {
    const user = await requireUser();
    const customers = await listCustomersForUser(user.id);
    return NextResponse.json({ customers });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: error.status || 500 });
  }
}

export async function POST(request) {
  try {
    const user = await requireUser();
    const payload = await request.json();

    if (!payload.customerName) {
      return NextResponse.json({ error: "Customer name is required." }, { status: 400 });
    }

    const customer = await createCustomer(user.id, payload);

    return NextResponse.json({ customer });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: error.status || 500 });
  }
}
