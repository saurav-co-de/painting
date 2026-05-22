import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { readDatabase, writeDatabase } from "@/lib/db";

export async function GET() {
  try {
    const user = await requireUser();
    const database = await readDatabase();
    const customers = database.customers.filter((customer) => customer.userId === user.id);
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

    const database = await readDatabase();
    const customer = {
      id: randomUUID(),
      userId: user.id,
      customerName: payload.customerName,
      gstNumber: payload.gstNumber || "",
      address: payload.address || "",
      mobile: payload.mobile || "",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    database.customers.unshift(customer);
    await writeDatabase(database);

    return NextResponse.json({ customer });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: error.status || 500 });
  }
}
