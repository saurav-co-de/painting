import { redirect } from "next/navigation";
import AppShell from "@/components/AppShell";
import { requireUser } from "@/lib/auth";
import { listCustomersForUser } from "@/lib/db";
import QuotationBuilder from "@/components/QuotationBuilder";

export const metadata = {
  title: "Create quotation"
};

export default async function NewQuotationPage() {
  const user = await requireUser().catch(() => redirect("/login"));
  const customers = await listCustomersForUser(user.id);

  if (!customers.length) {
    redirect("/customers");
  }

  return (
    <AppShell
      description="Build a quotation with the same item table, totals, tax splits, and customer details as invoices."
      title="Create quotation"
      user={user}
    >
      <QuotationBuilder customers={customers} user={user} />
    </AppShell>
  );
}
