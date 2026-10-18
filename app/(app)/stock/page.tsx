import { EnTetePage, Carte, EtatVide } from "@/components/ui/carte";
import { Badge } from "@/components/ui/badge";
import { FormulaireMouvement } from "@/components/stock/formulaire-mouvement";
import { formatDate, formatHeure, formatNombre } from "@/lib/formatage";
import { createClient } from "@/lib/supabase/server";
import type { MouvementStock, Produit } from "@/lib/types";

const MOTIFS: Record<string, string> = {
  achat: "Achat",
  vente: "Vente",
  inventaire: "Inventaire",
  ajustement: "Ajustement",
  retour: "Retour",
};

export default async function PageStock() {
  const supabase = await createClient();

  const [{ data: mouvements }, { data: produits }] = await Promise.all([
    supabase
      .from("mouvements_stock")
      .select("*, produits(nom, unite)")
      .order("date_mouvement", { ascending: false })
      .limit(200),
    supabase.from("produits").select("*").eq("actif", true).order("nom"),
  ]);

  return (
    <div>
      <EnTetePage
        titre="Mouvements de stock"
        description="Journal des entrées et sorties — chaque mouvement met à jour le stock du produit"
      />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Carte titre="Nouveau mouvement" className="xl:col-span-1">
          <FormulaireMouvement produits={(produits ?? []) as Produit[]} />
        </Carte>

        <Carte titre="Historique" className="xl:col-span-2">
          {mouvements && mouvements.length > 0 ? (
            <div className="max-h-[70vh] overflow-y-auto">
              <table className="tableau">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Produit</th>
                    <th>Type</th>
                    <th className="text-right">Quantité</th>
                    <th>Motif</th>
                    <th>Référence</th>
                  </tr>
                </thead>
                <tbody>
                  {(mouvements as MouvementStock[]).map((mouvement) => (
                    <tr key={mouvement.id}>
                      <td>
                        {formatDate(mouvement.date_mouvement)}
                        <span className="ml-1 text-xs text-slate-400">
                          {formatHeure(mouvement.date_mouvement)}
                        </span>
                      </td>
                      <td className="font-medium">
                        {mouvement.produits?.nom ?? "—"}
                      </td>
                      <td>
                        {mouvement.type === "entree" ? (
                          <Badge ton="succes">Entrée</Badge>
                        ) : (
                          <Badge ton="attention">Sortie</Badge>
                        )}
                      </td>
                      <td className="text-right font-medium">
                        {mouvement.type === "entree" ? "+" : "−"}
                        {formatNombre(mouvement.quantite)}
                      </td>
                      <td>{MOTIFS[mouvement.motif] ?? mouvement.motif}</td>
                      <td>{mouvement.doc_reference ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EtatVide
              titre="Aucun mouvement"
              message="Enregistrez une entrée ou une sortie pour alimenter le journal de stock."
            />
          )}
        </Carte>
      </div>
    </div>
  );
}
