import { redirect } from "next/navigation";
import AppShell from "@/components/AppShell";
import QuotationBuilder from "@/components/QuotationBuilder";
import { requireUser } from "@/lib/auth";
import { listCustomersForUser, findQuotationForUser } from "@/lib/db";

export const metadata = {
  title: "Edit quotation"
};

export default async function EditQuotationPage({ params }) {
  try {
    const user = await requireUser();
    const { quotationId } = await params;
    const [quotation, customers] = await Promise.all([
      findQuotationForUser(user.id, quotationId),
      listCustomersForUser(user.id)
    ]);

    if (!quotation) {
      redirect("/quotations");
    }

    return (
      <AppShell
        description="Update quotation details, line items, and status."
        title="Edit quotation"
        user={user}
      >
        <QuotationBuilder
          customers={customers}
          initialQuotation={quotation}
          user={user}
        />
      </AppShell>
    );
  } catch {
    redirect("/login");
  }
}
