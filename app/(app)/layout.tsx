import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { Navigation } from "@/components/ui/navigation";
import { createClient } from "@/lib/supabase/server";

export const instant = false;

export default async function AppLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient();

  const { data } = await supabase.auth.getClaims();

  if (!data) {
    redirect("/login");
  }

  const email =
    typeof data.claims.email === "string" ? data.claims.email : "Utilisateur";

  return (
    <div className="min-h-screen bg-slate-100">
      <Navigation email={email} />
      <main className="px-4 py-6 pt-20 lg:ml-64 lg:px-8 lg:pt-8">
        <div className="mx-auto max-w-7xl">{children}</div>
      </main>
    </div>
  );
}
