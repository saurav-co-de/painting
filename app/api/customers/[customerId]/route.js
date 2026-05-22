import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { readDatabase, writeDatabase } from "@/lib/db";

export async function PATCH(request, { params }) {
  try {
    const user = await requireUser();
    const payload = await request.json();
    const { customerId } = await params;
    const database = await readDatabase();
    const customer = database.customers.find(
      (entry) => entry.id === customerId && entry.userId === user.id
    );

    if (!customer) {
      return NextResponse.json({ error: "Customer not found." }, { status: 404 });
    }

    Object.assign(customer, {
      customerName: payload.customerName ?? customer.customerName,
      gstNumber: payload.gstNumber ?? customer.gstNumber,
      address: payload.address ?? customer.address,
      mobile: payload.mobile ?? customer.mobile,
      updatedAt: new Date().toISOString()
    });

    await writeDatabase(database);
    return NextResponse.json({ customer });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: error.status || 500 });
  }
}

export async function DELETE(_request, { params }) {
  try {
    const user = await requireUser();
    const { customerId } = await params;
    const database = await readDatabase();
    const invoiceExists = database.invoices.some(
      (invoice) => invoice.userId === user.id && invoice.customerId === customerId
    );

    if (invoiceExists) {
      return NextResponse.json(
        { error: "This customer has linked invoices. Keep the record for history." },
        { status: 400 }
      );
    }

    database.customers = database.customers.filter(
      (customer) => !(customer.id === customerId && customer.userId === user.id)
    );

    await writeDatabase(database);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: error.status || 500 });
  }
}
