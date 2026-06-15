import { requireUser } from "@/lib/auth";
import { listCustomersForUser, listQuotationsForUser } from "@/lib/db";
import QuotationsTable from "@/components/QuotationsTable";

export const metadata = {
  title: "Quotations"
};

export default async function QuotationsPage() {
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
    <>
      <QuotationsTable quotations={quotationsWithCustomer} user={user} />
    </>
  );
}
