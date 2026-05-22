import Link from "next/link";

const publicLinks = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/pricing", label: "Pricing" }
];

export default function PublicNav() {
  return (
    <header className="sticky top-3 z-30 mx-auto w-full max-w-[1800px] px-3 pt-3 sm:px-6 xl:px-8">
      <nav className="glass-card flex flex-col gap-3 p-3 sm:flex-row sm:items-center sm:justify-between">
        <Link className="flex items-center gap-3" href="/">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-950 text-sm font-bold text-white">
            BB
          </span>
          <span>
            <span className="block text-sm font-semibold text-slate-950">BuildBill AI</span>
            <span className="block text-xs text-slate-500">GST billing workspace</span>
          </span>
        </Link>

        <div className="flex flex-wrap items-center gap-2 sm:justify-end">
          {publicLinks.map((item) => (
            <Link
              className="rounded-full px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              href={item.href}
              key={item.href}
            >
              {item.label}
            </Link>
          ))}
          <Link className="button-secondary px-4 py-2 text-sm sm:w-auto" href="/login">
            Login
          </Link>
          <Link className="button-primary px-4 py-2 text-sm sm:w-auto" href="/signup">
            Start free
          </Link>
        </div>
      </nav>
    </header>
  );
}
