import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { listExactBillsForUser, listCustomersForUser } from "@/lib/db";
import ExactBillsTable from "@/components/ExactBillsTable";

export const metadata = {
  title: "Exact Bills - BuildBill",
};

export default async function ExactBillsPage() {
  const user = await requireUser();
  const exactbills = await listExactBillsForUser(user.id);
  const customers = await listCustomersForUser(user.id);

  // Merge customer names into exact bills
  const billsWithCustomerNames = exactbills.map((bill) => ({
    ...bill,
    customerDetails: {
      ...bill.customerDetails,
      name:
        customers.find((c) => c.id === bill.customerId)?.name ||
        bill.customerDetails?.name,
    },
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Exact Bills</h1>
          <p className="text-slate-600 mt-1">Manage all your exact bills and estimates</p>
        </div>
        <Link
          href="/exactbills/new"
          className="px-6 py-3 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700"
        >
          New Exact Bill
        </Link>
      </div>

      <ExactBillsTable exactbills={billsWithCustomerNames} />
    </div>
  );
}
