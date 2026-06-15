import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { deleteQuotation, findQuotationForUser, updateQuotationStatus } from "@/lib/db";

export async function GET(request, { params }) {
  try {
    const user = await requireUser();
    const { quotationId } = params;
    const quotation = await findQuotationForUser(user.id, quotationId);

    if (!quotation) {
      return NextResponse.json({ error: "Quotation not found." }, { status: 404 });
    }

    return NextResponse.json({ quotation });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: error.status || 500 });
  }
}

export async function PATCH(request, { params }) {
  try {
    const user = await requireUser();
    const { quotationId } = params;
    const payload = await request.json();
    const quotation = await updateQuotationStatus(user.id, quotationId, payload.status);

    if (!quotation) {
      return NextResponse.json({ error: "Quotation not found." }, { status: 404 });
    }

    return NextResponse.json({ quotation });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: error.status || 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const user = await requireUser();
    const { quotationId } = params;
    const deleted = await deleteQuotation(user.id, quotationId);

    if (!deleted) {
      return NextResponse.json({ error: "Quotation not found." }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: error.status || 500 });
  }
}
