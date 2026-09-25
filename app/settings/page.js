import { redirect } from "next/navigation";
import AppShell from "@/components/AppShell";
import SettingsForm from "@/components/SettingsForm";
import { requireUser } from "@/lib/auth";

export const metadata = {
  title: "Settings"
};

export default async function SettingsPage() {
  try {
    const user = await requireUser();

    return (
      <AppShell
        description="Configure your company identity, GST registration, bank details, and dual-cloud database backup."
        title="Settings"
        user={user}
      >
        <SettingsForm user={user} />
      </AppShell>
    );
  } catch {
    redirect("/login");
  }
}
