import { requireUser } from "@/lib/auth";
import { listCustomersForUser } from "@/lib/db";
import QuotationBuilder from "@/components/QuotationBuilder";

export const metadata = {
  title: "Create quotation"
};

export default async function NewQuotationPage() {
  const user = await requireUser();
  const customers = await listCustomersForUser(user.id);

  if (!customers.length) {
    return (
      <div className="rounded-xl border border-slate-200/80 bg-white p-6 text-center">
        <p className="text-slate-600">
          Please add a customer first before creating a quotation.
        </p>
      </div>
    );
  }

  return <QuotationBuilder customers={customers} user={user} />;
}
