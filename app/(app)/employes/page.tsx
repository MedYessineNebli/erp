import { EnTetePage } from "@/components/ui/carte";
import { TableauEmployes } from "@/components/rh/tableau-employes";
import { createClient } from "@/lib/supabase/server";
import type { Employe } from "@/lib/types";

export default async function PageEmployes() {
  const supabase = await createClient();
  const { data: employes } = await supabase
    .from("employes")
    .select("*")
    .order("nom");

  return (
    <div>
      <EnTetePage
        titre="Employés"
        description="Gestion du personnel : salaires de base, numéros CNSS et enfants à charge"
      />
      <TableauEmployes employes={(employes ?? []) as Employe[]} />
    </div>
  );
}
