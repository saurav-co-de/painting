import { redirect } from "next/navigation";
import AppShell from "@/components/AppShell";
import { requireUser } from "@/lib/auth";
import { listCustomersForUser, listQuotationsForUser } from "@/lib/db";
import QuotationsTable from "@/components/QuotationsTable";

export const metadata = {
  title: "Quotations"
};

export default async function QuotationsPage() {
  try {
    const user = await requireUser();
    const [quotations, customers] = await Promise.all([
      listQuotationsForUser(user.id),
      listCustomersForUser(user.id)
    ]);

    const quotationsWithCustomer = quotations.map((quotation) => ({
      ...quotation,
      customerName:
        customers.find((customer) => customer.id === quotation.customerId)?.customerName || "Unknown"
    }));

    return (
      <AppShell
        description="Search quotations, review customer estimates, and open them in bill format."
        title="Quotation history"
        user={user}
      >
        <QuotationsTable quotations={quotationsWithCustomer} user={user} />
      </AppShell>
    );
  } catch {
    redirect("/login");
  }
}
