import { redirect } from "next/navigation";
import AppShell from "@/components/AppShell";
import InvoicesTable from "@/components/InvoicesTable";
import { requireUser } from "@/lib/auth";
import { derivePaymentStatus } from "@/lib/billing";
import { readDatabase } from "@/lib/db";

export default async function InvoicesPage() {
  try {
    const user = await requireUser();
    const database = await readDatabase();
    const invoices = database.invoices
      .filter((invoice) => invoice.userId === user.id)
      .map((invoice) => ({
        ...invoice,
        paymentStatus: derivePaymentStatus(invoice)
      }))
      .sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt));

    return (
      <AppShell
        description="Search across issued bills, filter by status, and mark receivables as paid."
        title="Invoice history"
        user={user}
      >
        <InvoicesTable initialInvoices={invoices} />
      </AppShell>
    );
  } catch {
    redirect("/login");
  }
}
