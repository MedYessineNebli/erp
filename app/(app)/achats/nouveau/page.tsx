import Link from "next/link";
import { EnTetePage } from "@/components/ui/carte";
import { FormulaireDocument } from "@/components/documents/formulaire-document";
import { creerAchat } from "@/app/(app)/achats/actions";
import { createClient } from "@/lib/supabase/server";
import type { ParametresSociete, Produit } from "@/lib/types";

export default async function PageNouvelAchat() {
  const supabase = await createClient();

  const [{ data: fournisseurs }, { data: produits }, { data: parametres }] =
    await Promise.all([
      supabase.from("fournisseurs").select("id, nom").eq("actif", true).order("nom"),
      supabase.from("produits").select("*").eq("actif", true).order("nom"),
      supabase.from("parametres_societe").select("*").limit(1).maybeSingle(),
    ]);

  const tauxTva =
    (parametres as ParametresSociete | null)?.taux_tva_disponibles ?? [0, 7, 13, 19];

  return (
    <div>
      <EnTetePage
        titre="Nouvel achat"
        actions={
          <Link href="/achats" className="btn-secondaire">
            Retour
          </Link>
        }
      />
      <div className="carte p-6">
        {(fournisseurs ?? []).length === 0 ? (
          <p className="text-sm text-slate-600">
            Créez d&apos;abord au moins un fournisseur dans la rubrique{" "}
            <Link href="/fournisseurs" className="font-medium text-blue-700 hover:underline">
              Fournisseurs
            </Link>
            .
          </p>
        ) : (
          <FormulaireDocument
            type="achat"
            action={creerAchat}
            entites={(fournisseurs ?? []) as { id: string; nom: string }[]}
            produits={(produits ?? []) as Produit[]}
            tauxTvaDisponibles={tauxTva}
          />
        )}
      </div>
    </div>
  );
}
