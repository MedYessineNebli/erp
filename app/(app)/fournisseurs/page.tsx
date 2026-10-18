import { EnTetePage } from "@/components/ui/carte";
import { TableauTiers } from "@/components/tiers/tableau-tiers";
import { createClient } from "@/lib/supabase/server";
import type { Client } from "@/lib/types";

export default async function PageFournisseurs() {
  const supabase = await createClient();
  const { data: fournisseurs } = await supabase
    .from("fournisseurs")
    .select("*")
    .order("nom");

  return (
    <div>
      <EnTetePage
        titre="Fournisseurs"
        description="Référentiel des fournisseurs utilisés dans les achats"
      />
      <TableauTiers type="fournisseurs" tiers={(fournisseurs ?? []) as Client[]} />
    </div>
  );
}
