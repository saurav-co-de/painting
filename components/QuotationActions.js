"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { readJsonResponse } from "@/lib/api";
import ConfirmDialog from "@/components/ConfirmDialog";
import { IconDownload, IconTrash, IconEdit } from "@/components/Icons";

export default function QuotationActions({ quotationId, quotationNumber }) {
  const router = useRouter();
  const [showConfirm, setShowConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [status, setStatus] = useState("");

  async function deleteQuotation() {
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
      setShowConfirm(false);
    }
  }

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <Link
          className="button-secondary text-xs sm:text-sm py-2"
          href={`/quotations/${quotationId}/edit`}
        >
          <IconEdit className="w-3.5 h-3.5 text-slate-500" />
          <span>Edit</span>
        </Link>
        <a
          className="button-primary text-xs sm:text-sm py-2"
          download={`${quotationNumber || "quotation"}.pdf`}
          href={`/api/quotations/${quotationId}/pdf`}
        >
          <IconDownload className="w-3.5 h-3.5" />
          <span>Download PDF</span>
        </a>
        <button
          className="button-danger text-xs sm:text-sm py-2"
          onClick={() => setShowConfirm(true)}
          type="button"
        >
          <IconTrash className="w-3.5 h-3.5" />
          <span>Delete</span>
        </button>
        {status && <p className="w-full text-xs text-rose-600">{status}</p>}
      </div>

      <ConfirmDialog
        cancelLabel="Cancel"
        confirmLabel="Yes, Delete Quotation"
        isDeleting={isDeleting}
        message={`Are you sure you want to delete quotation ${quotationNumber}? This action cannot be undone.`}
        onCancel={() => setShowConfirm(false)}
        onConfirm={deleteQuotation}
        open={showConfirm}
        title="Delete Quotation"
      />
    </>
  );
}
