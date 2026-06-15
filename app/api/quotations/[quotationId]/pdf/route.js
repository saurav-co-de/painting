import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { findQuotationForUser } from "@/lib/db";
import { generateInvoicePdf } from "@/lib/pdf";

export async function GET(_request, { params }) {
  try {
    const user = await requireUser();
    const { quotationId } = await params;
    const quotation = await findQuotationForUser(user.id, quotationId);

    if (!quotation) {
      return NextResponse.json({ error: "Quotation not found." }, { status: 404 });
    }

    const pdf = generateInvoicePdf(
      {
        ...quotation,
        invoiceNumber: quotation.quotationNumber,
        invoiceDate: quotation.quotationDate,
        billSubject: quotation.description || quotation.projectName || "Work",
        customerDetails: {
          clientName: quotation.customerDetails?.clientName || "",
          gstNumber: quotation.customerDetails?.gstNumber || "",
          address: quotation.customerDetails?.address || "",
          mobile: quotation.customerDetails?.mobile || ""
        },
        companyDetails: {
          ...quotation.companyDetails,
          accountNumber: "",
          ifscCode: "",
          bankName: "",
          branch: "",
          signatureImage: quotation.companyDetails.signatureImage || user.signatureImage || ""
        }
      },
      {
        documentNumber: quotation.quotationNumber,
        documentNumberLabel: "Quotation No",
        includeBankDetails: false,
        preserveRateText: true,
        subjectPrefix: "Quotation for"
      }
    );

    return new NextResponse(pdf, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${quotation.quotationNumber}.pdf"`
      }
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: error.status || 500 });
  }
}
