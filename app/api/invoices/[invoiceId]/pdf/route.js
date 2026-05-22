import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { readDatabase } from "@/lib/db";
import { generateInvoicePdf } from "@/lib/pdf";

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

    const pdf = generateInvoicePdf({
      ...invoice,
      companyDetails: {
        ...invoice.companyDetails,
        accountNumber: invoice.companyDetails.accountNumber || user.accountNumber || "",
        ifscCode: invoice.companyDetails.ifscCode || user.ifscCode || "",
        bankName: invoice.companyDetails.bankName || user.bankName || "",
        branch: invoice.companyDetails.branch || user.branch || "",
        signatureImage: invoice.companyDetails.signatureImage || user.signatureImage || ""
      }
    });

    return new NextResponse(pdf, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${invoice.invoiceNumber}.pdf"`
      }
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: error.status || 500 });
  }
}
