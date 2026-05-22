import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { derivePaymentStatus } from "@/lib/billing";
import { deleteInvoice, findInvoiceForUser, updateInvoiceStatus } from "@/lib/db";

export async function GET(_request, { params }) {
  try {
    const user = await requireUser();
    const { invoiceId } = await params;
    const invoice = await findInvoiceForUser(user.id, invoiceId);

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
    const invoice = await updateInvoiceStatus(user.id, invoiceId, payload.paymentStatus);

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

export async function DELETE(_request, { params }) {
  try {
    const user = await requireUser();
    const { invoiceId } = await params;
    await deleteInvoice(user.id, invoiceId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: error.status || 500 });
  }
}
