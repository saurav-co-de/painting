import { requireUser } from "@/lib/auth";
import {
  findExactBillForUser,
  updateExactBillStatus,
  deleteExactBill,
} from "@/lib/db";
import { readJsonResponse } from "@/lib/api";

export async function GET(request, { params }) {
  try {
    const user = await requireUser();
    const { exactbillId } = params;

    const exactbill = await findExactBillForUser(user.id, exactbillId);

    if (!exactbill) {
      return Response.json(
        { success: false, error: "Exact bill not found" },
        { status: 404 }
      );
    }

    return Response.json({
      success: true,
      data: exactbill,
    });
  } catch (error) {
    return Response.json(
      { success: false, error: error.message },
      { status: error.status || 500 }
    );
  }
}

export async function PATCH(request, { params }) {
  try {
    const user = await requireUser();
    const { exactbillId } = params;
    const body = await readJsonResponse(request);

    const exactbill = await updateExactBillStatus(user.id, exactbillId, body.status);

    if (!exactbill) {
      return Response.json(
        { success: false, error: "Exact bill not found" },
        { status: 404 }
      );
    }

    return Response.json({
      success: true,
      data: exactbill,
    });
  } catch (error) {
    return Response.json(
      { success: false, error: error.message },
      { status: error.status || 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const user = await requireUser();
    const { exactbillId } = params;

    const success = await deleteExactBill(user.id, exactbillId);

    if (!success) {
      return Response.json(
        { success: false, error: "Exact bill not found" },
        { status: 404 }
      );
    }

    return Response.json({
      success: true,
      message: "Exact bill deleted successfully",
    });
  } catch (error) {
    return Response.json(
      { success: false, error: error.message },
      { status: error.status || 500 }
    );
  }
}
