import { requireUser } from "@/lib/auth";
import { listCustomersForUser } from "@/lib/db";
import ExactBillBuilder from "@/components/ExactBillBuilder";

export const metadata = {
  title: "Create Exact Bill - BuildBill",
};

export default async function NewExactBillPage() {
  const user = await requireUser();
  const customers = await listCustomersForUser(user.id);

  if (customers.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-600 mb-4">
          You need to add at least one client before creating an exact bill.
        </p>
        <a
          href="/customers"
          className="text-blue-600 hover:underline font-medium"
        >
          Go to Clients
        </a>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Create Exact Bill</h1>
        <p className="text-slate-600 mt-1">
          Generate a new exact bill or estimate
        </p>
      </div>

      <ExactBillBuilder customers={customers} />
    </div>
  );
}
