"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { readJsonResponse } from "@/lib/api";

export default function QuotationActions({ quotationId, quotationNumber }) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [status, setStatus] = useState("");

  async function deleteQuotation() {
    const confirmed = window.confirm("Delete this quotation?");

    if (!confirmed) {
      return;
    }

    setIsDeleting(true);
    setStatus("");

    try {
      const response = await fetch(`/api/quotations/${quotationId}`, {
        method: "DELETE"
      });
      const payload = await readJsonResponse(response, "Could not delete quotation.");

      if (!response.ok) {
        throw new Error(payload.error || "Could not delete quotation.");
      }

      router.push("/quotations");
      router.refresh();
    } catch (error) {
      setStatus(error.message);
      setIsDeleting(false);
    }
  }

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-end">
      <a
        className="button-primary"
        download={`${quotationNumber || "quotation"}.pdf`}
        href={`/api/quotations/${quotationId}/pdf`}
      >
        Download
      </a>
      <button
        className="inline-flex min-h-11 items-center justify-center rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-center font-medium text-rose-900 transition hover:border-rose-300 hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
        disabled={isDeleting}
        onClick={deleteQuotation}
        type="button"
      >
        {isDeleting ? "Deleting..." : "Delete"}
      </button>
      {status ? <p className="w-full text-sm text-rose-700">{status}</p> : null}
    </div>
  );
}
