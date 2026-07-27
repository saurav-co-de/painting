"use client";

export default function Toast({ toast }) {
  if (!toast) {
    return null;
  }

  const tone = toast.type === "error"
    ? "border-rose-200 bg-rose-50 text-rose-900"
    : "border-emerald-200 bg-emerald-50 text-emerald-900";

  return (
    <div className={`fixed right-4 top-4 z-[80] w-[min(92vw,360px)] rounded-2xl border px-4 py-3 shadow-xl backdrop-blur ${tone}`}>
      <p className="text-sm font-semibold">{toast.message}</p>
    </div>
  );
}
