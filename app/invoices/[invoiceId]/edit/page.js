import { redirect } from "next/navigation";
import AppShell from "@/components/AppShell";
import InvoiceBuilder from "@/components/InvoiceBuilder";
import { requireUser } from "@/lib/auth";
import { derivePaymentStatus } from "@/lib/billing";
import { findInvoiceForUser, listCustomersForUser } from "@/lib/db";

export default async function EditInvoicePage({ params }) {
  try {
    const user = await requireUser();
    const { invoiceId } = await params;
    const [invoice, customers] = await Promise.all([
      findInvoiceForUser(user.id, invoiceId),
      listCustomersForUser(user.id)
    ]);

    if (!invoice) {
      redirect("/invoices");
    }

    return (
      <AppShell
        description="Update invoice details, line items, and payment status."
        title="Edit invoice"
        user={user}
      >
        <InvoiceBuilder
          customers={customers}
          initialInvoice={{ ...invoice, paymentStatus: derivePaymentStatus(invoice) }}
          user={user}
        />
      </AppShell>
    );
  } catch {
    redirect("/login");
  }
}
