import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { updateUser } from "@/lib/db";

export async function PATCH(request) {
  try {
    const user = await requireUser();
    const payload = await request.json();
    const updatedUser = await updateUser(user.id, payload);

    return NextResponse.json({ user: updatedUser });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: error.status || 500 });
  }
}
