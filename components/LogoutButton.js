"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { IconLogout } from "@/components/Icons";

export default function LogoutButton({ className = "button-secondary w-full" }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  async function handleLogout() {
    setIsLoading(true);
    try {
      await fetch("/api/auth/logout", {
        method: "POST"
      });
      router.push("/login");
      router.refresh();
    } catch {
      setIsLoading(false);
    }
  }

  return (
    <button
      className={className}
      disabled={isLoading}
      onClick={handleLogout}
      type="button"
    >
      <IconLogout className="w-4 h-4 text-slate-500" />
      <span>{isLoading ? "Signing out..." : "Sign Out"}</span>
    </button>
  );
}
