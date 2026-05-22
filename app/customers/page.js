import { redirect } from "next/navigation";
import AppShell from "@/components/AppShell";
import CustomersManager from "@/components/CustomersManager";
import { requireUser } from "@/lib/auth";
import { readDatabase } from "@/lib/db";

export default async function CustomersPage() {
  try {
    const user = await requireUser();
    const database = await readDatabase();
    const customers = database.customers.filter((customer) => customer.userId === user.id);
    const invoiceCounts = database.invoices
      .filter((invoice) => invoice.userId === user.id)
      .reduce((counts, invoice) => {
        counts[invoice.customerId] = (counts[invoice.customerId] || 0) + 1;
        return counts;
      }, {});

    return (
      <AppShell
        description="Add, update, and search customers while keeping invoice history linked to every client."
        title="Customer management"
        user={user}
      >
        <CustomersManager initialCustomers={customers} invoiceCounts={invoiceCounts} />
      </AppShell>
    );
  } catch {
    redirect("/login");
  }
}
