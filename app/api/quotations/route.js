import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { calculateInvoice, createInvoiceNumber } from "@/lib/billing";
import { createQuotationRecord, listCustomersForUser, listQuotationsForUser } from "@/lib/db";

function hasQuotationItemValue(item) {
  return Boolean(
    item.description?.trim() ||
      String(item.amount ?? "").trim() ||
      String(item.rate ?? "").trim()
  );
}

export async function GET() {
  try {
    const user = await requireUser();
    const quotations = (await listQuotationsForUser(user.id))
      .sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt));

    return NextResponse.json({ quotations });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: error.status || 500 });
  }
}

export async function POST(request) {
  try {
    const user = await requireUser();
    const payload = await request.json();
    const [customers, existingQuotations] = await Promise.all([
      listCustomersForUser(user.id),
      listQuotationsForUser(user.id)
    ]);
    const customerId = String(payload.customerId || "").trim();
    const customer = customerId ? customers.find((entry) => entry.id === customerId) : null;
    const customerName = String(payload.customerName || "").trim();

    if (customerId && !customer) {
      return NextResponse.json({ error: "Choose a valid customer first." }, { status: 400 });
    }

    const quotedSourceItems = Array.isArray(payload.items)
      ? payload.items.filter(hasQuotationItemValue)
      : [];
    const quotationMath = calculateInvoice(payload.items, payload.taxMode, {
      includeAmountOnlyItems: true,
      useDirectAmount: true
    });
    const quotationItems = quotationMath.items.map((item, index) => ({
      ...item,
      rate: String(quotedSourceItems[index]?.rate ?? item.rate ?? ""),
      amount: item.amount
    }));

    if (!quotationMath.items.length) {
      return NextResponse.json({ error: "Add at least one quotation line item." }, { status: 400 });
    }

    const manualQuotationNumber = String(payload.quotationNumber || "").trim();

    if (
      manualQuotationNumber &&
      existingQuotations.some(
        (quotation) =>
          String(quotation.quotationNumber || "").toLowerCase() === manualQuotationNumber.toLowerCase()
      )
    ) {
      return NextResponse.json(
        { error: "This quotation number is already in use." },
        { status: 400 }
      );
    }

    const quotation = {
      id: randomUUID(),
      userId: user.id,
      quotationNumber: manualQuotationNumber || createInvoiceNumber(existingQuotations),
      quotationDate: payload.quotationDate,
      validityDate: payload.validityDate,
      projectName: payload.projectName,
      description: payload.description || payload.projectName || "Quotation",
      taxMode: payload.taxMode || "intra",
      customerId: customer?.id || "",
      companyDetails: {
        companyName: user.businessName,
        gstin: user.gstin,
        address: user.address,
        phone: user.phone,
        email: user.email,
        logoText: user.logoText,
        signatureImage: user.signatureImage || ""
      },
      customerDetails: {
        clientName: customer?.customerName || customerName,
        gstNumber: customer?.gstNumber || "",
        address: customer?.address || "",
        mobile: customer?.mobile || ""
      },
      items: quotationItems,
      totals: quotationMath.totals,
      status: payload.status || "Draft",
      validityPeriod: payload.validityPeriod || "30 days",
      notes: payload.notes || "",
      terms: payload.terms || "",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await createQuotationRecord(quotation);
    return NextResponse.json({ quotation });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: error.status || 500 });
  }
}
