import Link from "next/link";
import ResetPasswordForm from "@/components/ResetPasswordForm";

export default async function ResetPasswordPage({ searchParams }) {
  const { token = "" } = await searchParams;

  return (
    <main className="mx-auto grid min-h-screen max-w-xl items-center px-3 py-8 sm:px-6">
      <section className="glass-card p-5 sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--brand)] sm:tracking-[0.24em]">
          Password reset
        </p>
        <h1 className="font-display mt-3 text-3xl text-slate-950">Set a new password</h1>
        <p className="mt-3 text-sm leading-7 text-slate-600">
          Enter a new password for your BuildBill AI account. Reset links expire after 30 minutes.
        </p>

        <div className="mt-6">
          {token ? (
            <ResetPasswordForm token={token} />
          ) : (
            <div className="space-y-4">
              <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">
                This reset link is missing a token. Please request a new reset link.
              </div>
              <Link className="button-primary w-full" href="/login">
                Go to login
              </Link>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
