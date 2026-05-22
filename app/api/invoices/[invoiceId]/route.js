import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { derivePaymentStatus } from "@/lib/billing";
import { readDatabase, writeDatabase } from "@/lib/db";

export async function GET(_request, { params }) {
  try {
    const user = await requireUser();
    const { invoiceId } = await params;
    const database = await readDatabase();
    const invoice = database.invoices.find(
      (entry) => entry.id === invoiceId && entry.userId === user.id
    );

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found." }, { status: 404 });
    }

    return NextResponse.json({
      invoice: {
        ...invoice,
        paymentStatus: derivePaymentStatus(invoice)
      }
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: error.status || 500 });
  }
}

export async function PATCH(request, { params }) {
  try {
    const user = await requireUser();
    const { invoiceId } = await params;
    const payload = await request.json();
    const database = await readDatabase();
    const invoice = database.invoices.find(
      (entry) => entry.id === invoiceId && entry.userId === user.id
    );

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found." }, { status: 404 });
    }

    invoice.paymentStatus = payload.paymentStatus || invoice.paymentStatus;
    invoice.updatedAt = new Date().toISOString();

    await writeDatabase(database);
    return NextResponse.json({
      invoice: {
        ...invoice,
        paymentStatus: derivePaymentStatus(invoice)
      }
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: error.status || 500 });
  }
}

export async function DELETE(_request, { params }) {
  try {
    const user = await requireUser();
    const { invoiceId } = await params;
    const database = await readDatabase();

    database.invoices = database.invoices.filter(
      (invoice) => !(invoice.id === invoiceId && invoice.userId === user.id)
    );

    await writeDatabase(database);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: error.status || 500 });
  }
}
