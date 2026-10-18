import { EnTetePage } from "@/components/ui/carte";
import { TableauProduits } from "@/components/produits/tableau-produits";
import { createClient } from "@/lib/supabase/server";
import type { ParametresSociete, Produit } from "@/lib/types";

export default async function PageProduits() {
  const supabase = await createClient();

  const [{ data: produits }, { data: parametres }] = await Promise.all([
    supabase.from("produits").select("*").order("nom"),
    supabase.from("parametres_societe").select("*").limit(1).maybeSingle(),
  ]);

  const tauxTva =
    (parametres as ParametresSociete | null)?.taux_tva_disponibles ?? [0, 7, 13, 19];

  return (
    <div>
      <EnTetePage
        titre="Produits"
        description="Catalogue des produits et services : prix, TVA et seuils d'alerte"
      />
      <TableauProduits produits={(produits ?? []) as Produit[]} tauxTva={tauxTva} />
    </div>
  );
}
