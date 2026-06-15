import { requireUser } from "@/lib/auth";
import {
  listCustomersForUser,
  createExactBillRecord,
  listExactBillsForUser,
} from "@/lib/db";
import { calculateInvoice, createInvoiceNumber } from "@/lib/billing";
import { readJsonResponse } from "@/lib/api";

export async function GET() {
  try {
    const user = await requireUser();
    const exactbills = await listExactBillsForUser(user.id);

    return Response.json({
      success: true,
      data: exactbills,
    });
  } catch (error) {
    return Response.json(
      { success: false, error: error.message },
      { status: error.status || 500 }
    );
  }
}

export async function POST(request) {
  try {
    const user = await requireUser();

    const body = await readJsonResponse(request);
    const { customerId, items = [], taxMode = "CGST+SGST", ...rest } = body;

    // Verify customer exists
    const customers = await listCustomersForUser(user.id);
    const customer = customers.find((c) => c.id === customerId);

    if (!customer) {
      return Response.json(
        { success: false, error: "Customer not found" },
        { status: 404 }
      );
    }

    // Calculate totals
    const calculations = calculateInvoice(items, taxMode);

    // Generate exact bill number
    const billNumber = await createInvoiceNumber(user.id, "EB");

    const exactbill = {
      id: crypto.randomUUID(),
      userId: user.id,
      customerId,
      exactbillNumber: billNumber,
      exactbillDate: rest.exactbillDate || new Date().toISOString().split("T")[0],
      validityDate: rest.validityDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      projectName: rest.projectName || "",
      description: rest.description || "",
      items,
      taxMode,
      ...calculations,
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
        name: customer.name,
        email: customer.email || "",
        phone: customer.phone || "",
        address: customer.address || "",
        gstin: customer.gstin || ""
      },
      notes: rest.notes || "Thank you for considering us for this project.",
      terms: rest.terms || "Exact bill is valid for 30 days from the date of issue.",
      status: rest.status || "Draft",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const savedBill = await createExactBillRecord(exactbill);

    return Response.json({
      success: true,
      data: savedBill,
    });
  } catch (error) {
    console.error("Error creating exact bill:", error);
    return Response.json(
      { success: false, error: error.message },
      { status: error.status || 500 }
    );
  }
}
