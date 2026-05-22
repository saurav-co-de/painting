import { redirect } from "next/navigation";
import LandingHero from "@/components/LandingHero";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const user = await getCurrentUser();

  if (user) {
    redirect("/dashboard");
  }

  return <LandingHero />;
}
