import { Inter } from "next/font/google";
import "@/app/globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sans"
});

export const metadata = {
  title: {
    template: "%s | BuildBill AI",
    default: "BuildBill AI — Modern GST Invoicing & Billing Workspace"
  },
  description:
    "Professional SaaS GST billing and quotation platform for contractors, interior designers, and service businesses.",
  keywords: ["GST invoice", "quotations", "contractor billing", "tax invoice", "invoicing software"]
};

export default function RootLayout({ children }) {
  return (
    <html className={inter.variable} lang="en">
      <body className="font-sans antialiased text-slate-900 bg-slate-50 selection:bg-teal-700 selection:text-white">
        {children}
      </body>
    </html>
  );
}
