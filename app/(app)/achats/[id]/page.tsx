import { notFound } from "next/navigation";
import { EnTetePage, Carte } from "@/components/ui/carte";
import { Badge, badgeStatutAchat } from "@/components/ui/badge";
import { BarreActionsAchat } from "@/components/documents/actions-achat";
import { FormulaireDocument } from "@/components/documents/formulaire-document";
import { modifierAchat } from "@/app/(app)/achats/actions";
import { montantEnLettres } from "@/lib/documents";
import { formatDate, formatNombre, formatTND } from "@/lib/formatage";
import { createClient } from "@/lib/supabase/server";
import type { Achat, ParametresSociete, Produit } from "@/lib/types";

export default async function PageAchatDetail({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ modifier?: string }>;
}) {
  const { id } = await params;
  const { modifier } = await searchParams;

  const supabase = await createClient();
  const { data: achat } = await supabase
    .from("achats")
    .select("*, fournisseurs(*), achat_lignes(*)")
    .eq("id", id)
    .single();

  if (!achat) notFound();

  const a = achat as unknown as Achat;
  const info = badgeStatutAchat(a.statut);
  const enModification = modifier === "1" && a.statut === "brouillon";

  if (enModification) {
    const [{ data: fournisseurs }, { data: produits }, { data: parametres }] =
      await Promise.all([
        supabase.from("fournisseurs").select("id, nom").eq("actif", true).order("nom"),
        supabase.from("produits").select("*").eq("actif", true).order("nom"),
        supabase.from("parametres_societe").select("*").limit(1).maybeSingle(),
      ]);

    return (
      <div>
        <EnTetePage
          titre={`Modifier ${a.numero}`}
          actions={
            <BarreActionsAchat id={a.id} statut={a.statut} enModification />
          }
        />
        <div className="carte p-6">
          <FormulaireDocument
            type="achat"
            action={modifierAchat.bind(null, a.id)}
            entites={(fournisseurs ?? []) as { id: string; nom: string }[]}
            produits={(produits ?? []) as Produit[]}
            tauxTvaDisponibles={
              (parametres as ParametresSociete | null)?.taux_tva_disponibles ?? [0, 7, 13, 19]
            }
            document={{
              id: a.id,
              numero: a.numero,
              date: a.date_achat,
              entite_id: a.fournisseur_id,
              notes: a.notes,
            }}
            lignes={a.achat_lignes ?? []}
          />
        </div>
      </div>
    );
  }

  return (
    <div>
      <EnTetePage
        titre={`Achat ${a.numero}`}
        description={`Fournisseur : ${a.fournisseurs?.nom ?? "—"} — ${formatDate(a.date_achat)}`}
        actions={
          <>
            <a href={`/api/pdf/achat/${a.id}`} className="btn-secondaire" target="_blank">
              Télécharger le PDF
            </a>
            <BarreActionsAchat id={a.id} statut={a.statut} enModification={false} />
          </>
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Carte className="lg:col-span-2" titre="Lignes de l'achat">
          <table className="tableau">
            <thead>
              <tr>
                <th>Description</th>
                <th className="text-right">Quantité</th>
                <th className="text-right">Prix HT</th>
                <th className="text-right">TVA</th>
                <th className="text-right">Total HT</th>
              </tr>
            </thead>
            <tbody>
              {(a.achat_lignes ?? []).map((ligne) => (
                <tr key={ligne.id}>
                  <td>{ligne.description}</td>
                  <td className="text-right">{formatNombre(ligne.quantite)}</td>
                  <td className="text-right">{formatTND(ligne.prix_ht)}</td>
                  <td className="text-right">{ligne.taux_tva} %</td>
                  <td className="text-right font-medium">
                    {formatTND(ligne.quantite * ligne.prix_ht)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Carte>

        <div className="space-y-6">
          <Carte titre="Totaux">
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-slate-500">Sous-total HT</dt>
                <dd className="font-medium">{formatTND(a.sous_total_ht)} TND</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">Total TVA</dt>
                <dd className="font-medium">{formatTND(a.total_tva)} TND</dd>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-2 text-base font-bold">
                <dt>Total TTC</dt>
                <dd>{formatTND(a.total_ttc)} TND</dd>
              </div>
            </dl>
            <p className="mt-3 border-t border-slate-100 pt-3 text-xs italic text-slate-500">
              Montant : {montantEnLettres(a.total_ttc)}.
            </p>
          </Carte>

          <Carte titre="Informations">
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-slate-500">Statut</dt>
                <dd>
                  <Badge ton={info.ton}>{info.texte}</Badge>
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">Réf. fournisseur</dt>
                <dd className="font-medium">{a.reference_fournisseur ?? "—"}</dd>
              </div>
            </dl>
          </Carte>
        </div>
      </div>
    </div>
  );
}
