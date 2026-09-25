"use client";

import { useEffect } from "react";
import { IconAlertCircle, IconX } from "@/components/Icons";

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Delete",
  cancelLabel = "Cancel",
  isDeleting = false,
  onCancel,
  onConfirm,
  tone = "danger"
}) {
  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === "Escape" && open && !isDeleting) {
        onCancel?.();
      }
    }
    if (open) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, isDeleting, onCancel]);

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity"
        onClick={!isDeleting ? onCancel : undefined}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl transition-all">
        <div className="flex items-start gap-4">
          <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${
            tone === "danger" ? "bg-rose-100 text-rose-600" : "bg-teal-100 text-teal-600"
          }`}>
            <IconAlertCircle className="w-6 h-6" />
          </div>

          <div className="flex-1 min-w-0 pt-0.5">
            <h3 className="text-base font-semibold text-slate-900">{title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-500">{message}</p>
          </div>

          {!isDeleting && (
            <button
              className="text-slate-400 hover:text-slate-600 rounded-lg p-1 transition-colors"
              onClick={onCancel}
              type="button"
            >
              <IconX className="w-5 h-5" />
            </button>
          )}
        </div>

        <div className="mt-6 flex flex-col-reverse gap-2.5 sm:flex-row sm:justify-end">
          <button
            className="button-secondary w-full sm:w-auto"
            disabled={isDeleting}
            onClick={onCancel}
            type="button"
          >
            {cancelLabel}
          </button>
          <button
            className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-white shadow-xs transition-colors ${
              tone === "danger" ? "bg-rose-600 hover:bg-rose-700 active:bg-rose-800" : "bg-teal-700 hover:bg-teal-800"
            }`}
            disabled={isDeleting}
            onClick={onConfirm}
            type="button"
          >
            {isDeleting ? "Processing..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
