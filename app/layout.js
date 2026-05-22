import "@/app/globals.css";

export const metadata = {
  title: "BuildBill AI",
  description:
    "SaaS GST billing platform for contractors, interior designers, painters, and service businesses."
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
