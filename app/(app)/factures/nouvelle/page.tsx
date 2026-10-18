import Link from "next/link";
import { EnTetePage } from "@/components/ui/carte";
import { FormulaireDocument } from "@/components/documents/formulaire-document";
import { creerFacture } from "@/app/(app)/factures/actions";
import { createClient } from "@/lib/supabase/server";
import type { ParametresSociete, Produit } from "@/lib/types";

export default async function PageNouvelleFacture() {
  const supabase = await createClient();

  const [{ data: clients }, { data: produits }, { data: parametres }] =
    await Promise.all([
      supabase.from("clients").select("id, nom").eq("actif", true).order("nom"),
      supabase.from("produits").select("*").eq("actif", true).order("nom"),
      supabase.from("parametres_societe").select("*").limit(1).maybeSingle(),
    ]);

  const tauxTva =
    (parametres as ParametresSociete | null)?.taux_tva_disponibles ?? [0, 7, 13, 19];

  return (
    <div>
      <EnTetePage
        titre="Nouvelle facture"
        actions={
          <Link href="/factures" className="btn-secondaire">
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
            type="facture"
            action={creerFacture}
            entites={(clients ?? []) as { id: string; nom: string }[]}
            produits={(produits ?? []) as Produit[]}
            tauxTvaDisponibles={tauxTva}
          />
        )}
      </div>
    </div>
  );
}
