import { redirect } from "next/navigation";
import AppShell from "@/components/AppShell";
import InvoiceBuilder from "@/components/InvoiceBuilder";
import { requireUser } from "@/lib/auth";
import { readDatabase } from "@/lib/db";

export default async function NewInvoicePage() {
  const user = await requireUser().catch(() => redirect("/login"));
  const database = await readDatabase();
  const customers = database.customers.filter((customer) => customer.userId === user.id);

  if (!customers.length) {
    redirect("/customers");
  }

  return (
    <AppShell
      description="Build a GST invoice with automatic totals, Indian tax splits, and branded business details."
      title="Create invoice"
      user={user}
    >
      <InvoiceBuilder customers={customers} user={user} />
    </AppShell>
  );
}
