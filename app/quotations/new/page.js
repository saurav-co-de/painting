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

  return (
    <AppShell
      description="Build a quotation with optional customer details, item totals, and tax splits."
      title="Create quotation"
      user={user}
    >
      <QuotationBuilder customers={customers} user={user} />
    </AppShell>
  );
}
