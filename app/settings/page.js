import { redirect } from "next/navigation";
import AppShell from "@/components/AppShell";
import SettingsForm from "@/components/SettingsForm";
import { requireUser } from "@/lib/auth";

export default async function SettingsPage() {
  try {
    const user = await requireUser();

    return (
      <AppShell
        description="Store business identity, GST details, plan settings, and the branding that appears across every invoice."
        title="Business settings"
        user={user}
      >
        <SettingsForm user={user} />
      </AppShell>
    );
  } catch {
    redirect("/login");
  }
}
