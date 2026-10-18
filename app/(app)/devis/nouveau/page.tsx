import Link from "next/link";
import { EnTetePage } from "@/components/ui/carte";
import { FormulaireDocument } from "@/components/documents/formulaire-document";
import { creerDevis } from "@/app/(app)/devis/actions";
import { createClient } from "@/lib/supabase/server";
import type { ParametresSociete, Produit } from "@/lib/types";

export default async function PageNouveauDevis() {
  const supabase = await createClient();

  const [{ data: clients }, { data: produits }, { data: parametres }] =
    await Promise.all([
      supabase.from("clients").select("id, nom").eq("actif", true).order("nom"),
      supabase.from("produits").select("*").eq("actif", true).order("nom"),
      supabase.from("parametres_societe").select("*").limit(1).maybeSingle(),
    ]);

  const tauxTva =
    (parametres as ParametresSociete | null)?.taux_tva_disponibles ?? [0, 7, 13, 19];
  const tauxDefaut =
    (parametres as ParametresSociete | null)?.taux_tva_defaut ?? 19;

  return (
    <div>
      <EnTetePage
        titre="Nouveau devis"
        actions={
          <Link href="/devis" className="btn-secondaire">
            Retour
          </Link>
        }
      />
      <div className="carte p-6">
        {(clients ?? []).length === 0 ? (
          <p className="text-sm text-slate-600">
            Créez d&apos;abord au moins un client dans la rubrique{" "}
            <Link href="/clients" className="font-medium text-blue-700 hover:underline">
              Clients
            </Link>
            .
          </p>
        ) : (
          <FormulaireDocument
            type="devis"
            action={creerDevis}
            entites={(clients ?? []) as { id: string; nom: string }[]}
            produits={(produits ?? []) as Produit[]}
            tauxTvaDisponibles={tauxTva}
          />
        )}
      </div>
      <p className="mt-3 text-xs text-slate-400">
        TVA par défaut : {tauxDefaut} % — modifiable dans les paramètres.
      </p>
    </div>
  );
}
