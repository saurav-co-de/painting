"use client";

import { IconCheckCircle, IconAlertCircle } from "@/components/Icons";

export default function Toast({ toast }) {
  if (!toast) {
    return null;
  }

  const isError = toast.type === "error";

  return (
    <div className="fixed right-5 top-5 z-[90] flex items-center gap-3 rounded-xl border border-slate-200/90 bg-white px-4 py-3 shadow-lg shadow-slate-900/5 animate-in fade-in slide-in-from-top-3 duration-200 max-w-sm">
      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
        isError ? "bg-rose-100 text-rose-600" : "bg-emerald-100 text-emerald-600"
      }`}>
        {isError ? (
          <IconAlertCircle className="w-5 h-5" />
        ) : (
          <IconCheckCircle className="w-5 h-5" />
        )}
      </div>
      <p className="text-sm font-medium text-slate-800">{toast.message}</p>
    </div>
  );
}
