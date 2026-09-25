import Link from "next/link";

const publicLinks = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/pricing", label: "Pricing" }
];

export default function PublicNav() {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link className="flex items-center gap-2.5" href="/">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-700 text-sm font-bold text-white shadow-xs">
            BB
          </span>
          <span className="text-lg font-bold tracking-tight text-slate-900">
            BuildBill AI
          </span>
        </Link>

        <div className="flex items-center gap-1 sm:gap-2">
          <nav className="flex items-center gap-1">
            {publicLinks.map((item) => (
              <Link
                className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
                href={item.href}
                key={item.href}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="ml-2 flex items-center gap-2 pl-2 border-l border-slate-200">
            <Link className="button-secondary text-xs sm:text-sm py-1.5 px-3" href="/login">
              Sign In
            </Link>
            <Link className="button-primary text-xs sm:text-sm py-1.5 px-3.5" href="/signup">
              Start Free
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
