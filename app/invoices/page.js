import { redirect } from "next/navigation";
import AppShell from "@/components/AppShell";
import InvoicesTable from "@/components/InvoicesTable";
import { requireUser } from "@/lib/auth";
import { derivePaymentStatus } from "@/lib/billing";
import { readDatabase } from "@/lib/db";

export const metadata = {
  title: "Invoices"
};

export default async function InvoicesPage() {
  try {
    const user = await requireUser();
    const database = await readDatabase();
    const invoices = (database.invoices || [])
      .filter((invoice) => invoice.userId === user.id)
      .map((invoice) => ({
        ...invoice,
        paymentStatus: derivePaymentStatus(invoice)
      }))
      .sort((left, right) => new Date(right.createdAt || right.invoiceDate) - new Date(left.createdAt || left.invoiceDate));

    return (
      <AppShell
        description="Search, sort, filter, and track payment status for all issued bills."
        title="Invoices"
        user={user}
      >
        <InvoicesTable initialInvoices={invoices} />
      </AppShell>
    );
  } catch {
    redirect("/login");
  }
}
