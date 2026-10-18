import { EnTetePage } from "@/components/ui/carte";
import { TableauTiers } from "@/components/tiers/tableau-tiers";
import { createClient } from "@/lib/supabase/server";
import type { Client } from "@/lib/types";

export default async function PageClients() {
  const supabase = await createClient();
  const { data: clients } = await supabase
    .from("clients")
    .select("*")
    .order("nom");

  return (
    <div>
      <EnTetePage
        titre="Clients"
        description="Référentiel des clients utilisés dans les devis et factures"
      />
      <TableauTiers type="clients" tiers={(clients ?? []) as Client[]} />
    </div>
  );
}
