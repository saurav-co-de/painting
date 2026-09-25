import Link from "next/link";
import ResetPasswordForm from "@/components/ResetPasswordForm";

export const metadata = {
  title: "Reset Password"
};

export default async function ResetPasswordPage({ searchParams }) {
  const { token = "" } = await searchParams;

  return (
    <main className="mx-auto grid min-h-screen max-w-md items-center px-4 py-8">
      <div className="card p-6 sm:p-8 shadow-sm">
        <div className="text-center pb-4 mb-4 border-b border-slate-100">
          <Link className="inline-flex items-center gap-2 mb-3" href="/">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-700 text-xs font-bold text-white shadow-xs">
              BB
            </span>
            <span className="text-base font-bold tracking-tight text-slate-900">
              BuildBill AI
            </span>
          </Link>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Set a New Password
          </h1>
          <p className="mt-1 text-xs text-slate-500">
            Choose a strong password with at least 8 characters.
          </p>
        </div>

        <div>
          {token ? (
            <ResetPasswordForm token={token} />
          ) : (
            <div className="space-y-4">
              <div className="rounded-lg bg-rose-50 border border-rose-200 p-3 text-xs text-rose-800">
                This password reset link is invalid or missing a token. Please request a new reset link.
              </div>
              <Link className="button-primary w-full text-center" href="/login">
                Go to Sign In
              </Link>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
