import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { calculateInvoice, createInvoiceNumber, derivePaymentStatus } from "@/lib/billing";
import { readDatabase, writeDatabase } from "@/lib/db";

export async function GET() {
  try {
    const user = await requireUser();
    const database = await readDatabase();
    const invoices = database.invoices
      .filter((invoice) => invoice.userId === user.id)
      .map((invoice) => ({
        ...invoice,
        paymentStatus: derivePaymentStatus(invoice)
      }))
      .sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt));

    return NextResponse.json({ invoices });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: error.status || 500 });
  }
}

export async function POST(request) {
  try {
    const user = await requireUser();
    const payload = await request.json();
    const database = await readDatabase();
    const customer = database.customers.find(
      (entry) => entry.id === payload.customerId && entry.userId === user.id
    );

    if (!customer) {
      return NextResponse.json({ error: "Choose a valid customer first." }, { status: 400 });
    }

    const invoiceMath = calculateInvoice(payload.items, payload.taxMode);
    const advancePayment = Math.max(Number(payload.advancePayment || 0), 0);
    const balanceDue =
      Math.round(Math.max(invoiceMath.totals.grandTotal - advancePayment, 0) * 100) / 100;

    if (!invoiceMath.items.length) {
      return NextResponse.json({ error: "Add at least one invoice line item." }, { status: 400 });
    }

    const invoice = {
      id: randomUUID(),
      userId: user.id,
      invoiceNumber: createInvoiceNumber(
        database.invoices.filter((invoiceEntry) => invoiceEntry.userId === user.id)
      ),
      invoiceDate: payload.invoiceDate,
      dueDate: payload.dueDate,
      projectName: payload.projectName,
      billSubject: payload.billSubject || payload.projectName || "Work",
      taxMode: payload.taxMode || "intra",
      customerId: customer.id,
      companyDetails: {
        companyName: user.businessName,
        gstin: user.gstin,
        address: user.address,
        phone: user.phone,
        email: user.email,
        logoText: user.logoText,
        accountNumber: user.accountNumber || "",
        ifscCode: user.ifscCode || "",
        bankName: user.bankName || "",
        branch: user.branch || "",
        signatureImage: user.signatureImage || ""
      },
      customerDetails: {
        clientName: customer.customerName,
        gstNumber: customer.gstNumber,
        address: customer.address,
        mobile: customer.mobile
      },
      items: invoiceMath.items,
      totals: invoiceMath.totals,
      advancePayment,
      balanceDue,
      paymentStatus: payload.paymentStatus || "Pending",
      notes: payload.notes || "",
      terms: payload.terms || "",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    database.invoices.unshift(invoice);
    await writeDatabase(database);

    return NextResponse.json({ invoice });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: error.status || 500 });
  }
}
