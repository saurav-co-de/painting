import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { customerHasInvoices, deleteCustomer, updateCustomer } from "@/lib/db";

export async function PATCH(request, { params }) {
  try {
    const user = await requireUser();
    const payload = await request.json();
    const { customerId } = await params;
    const customer = await updateCustomer(user.id, customerId, payload);

    if (!customer) {
      return NextResponse.json({ error: "Customer not found." }, { status: 404 });
    }

    return NextResponse.json({ customer });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: error.status || 500 });
  }
}

export async function DELETE(_request, { params }) {
  try {
    const user = await requireUser();
    const { customerId } = await params;
    const invoiceExists = await customerHasInvoices(user.id, customerId);

    if (invoiceExists) {
      return NextResponse.json(
        { error: "This customer has linked invoices. Keep the record for history." },
        { status: 400 }
      );
    }

    await deleteCustomer(user.id, customerId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: error.status || 500 });
  }
}
