import Link from "next/link";
import { notFound } from "next/navigation";
import { EnTetePage, Carte, Alerte } from "@/components/ui/carte";
import { Badge, badgeStatutFacture } from "@/components/ui/badge";
import { BarreActionsFacture } from "@/components/documents/actions-facture";
import { FormulaireDocument } from "@/components/documents/formulaire-document";
import { modifierFacture } from "@/app/(app)/factures/actions";
import { montantEnLettres } from "@/lib/documents";
import { formatDate, formatNombre, formatTND } from "@/lib/formatage";
import { createClient } from "@/lib/supabase/server";
import type { Facture, ParametresSociete, Produit } from "@/lib/types";

export default async function PageFactureDetail({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ modifier?: string }>;
}) {
  const { id } = await params;
  const { modifier } = await searchParams;

  const supabase = await createClient();
  const { data: facture } = await supabase
    .from("factures")
    .select("*, clients(*), facture_lignes(*), devis(numero)")
    .eq("id", id)
    .single();

  if (!facture) notFound();

  const f = facture as unknown as Facture;
  const info = badgeStatutFacture(f.statut);
  const enModification = modifier === "1" && f.statut === "brouillon";

  if (enModification) {
    const [{ data: clients }, { data: produits }, { data: parametres }] =
      await Promise.all([
        supabase.from("clients").select("id, nom").eq("actif", true).order("nom"),
        supabase.from("produits").select("*").eq("actif", true).order("nom"),
        supabase.from("parametres_societe").select("*").limit(1).maybeSingle(),
      ]);

    return (
      <div>
        <EnTetePage
          titre={`Modifier ${f.numero}`}
          actions={
            <BarreActionsFacture
              id={f.id}
              statut={f.statut}
              montantPaye={f.montant_paye}
              totalTtc={f.total_ttc}
              enModification
            />
          }
        />
        <div className="carte p-6">
          <FormulaireDocument
            type="facture"
            action={modifierFacture.bind(null, f.id)}
            entites={(clients ?? []) as { id: string; nom: string }[]}
            produits={(produits ?? []) as Produit[]}
            tauxTvaDisponibles={
              (parametres as ParametresSociete | null)?.taux_tva_disponibles ?? [0, 7, 13, 19]
            }
            document={{
              id: f.id,
              numero: f.numero,
              date: f.date_facture,
              date_secondaire: f.date_echeance,
              entite_id: f.client_id,
              notes: f.notes,
            }}
            lignes={f.facture_lignes ?? []}
          />
        </div>
      </div>
    );
  }

  const resteAPayer = f.total_ttc - f.montant_paye;

  return (
    <div>
      <EnTetePage
        titre={`Facture ${f.numero}`}
        description={`Client : ${f.clients?.nom ?? "—"} — ${formatDate(f.date_facture)}`}
        actions={
          <>
            <a href={`/api/pdf/facture/${f.id}`} className="btn-secondaire" target="_blank">
              Télécharger le PDF
            </a>
            <BarreActionsFacture
              id={f.id}
              statut={f.statut}
              montantPaye={f.montant_paye}
              totalTtc={f.total_ttc}
              enModification={false}
            />
          </>
        }
      />

      {f.devis_id ? (
        <div className="mb-4">
          <Alerte ton="information">
            Facture issue du devis{" "}
            <Link href={`/devis/${f.devis_id}`} className="font-semibold underline">
              {f.devis?.numero ?? ""}
            </Link>
            .
          </Alerte>
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Carte className="lg:col-span-2" titre="Lignes de la facture">
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
              {(f.facture_lignes ?? []).map((ligne) => (
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

          {f.notes ? (
            <div className="mt-4 rounded-lg bg-slate-50 p-3 text-sm">
              <p className="font-medium text-slate-600">Notes</p>
              <p className="mt-1 whitespace-pre-wrap text-slate-700">{f.notes}</p>
            </div>
          ) : null}
        </Carte>

        <div className="space-y-6">
          <Carte titre="Totaux">
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-slate-500">Sous-total HT</dt>
                <dd className="font-medium">{formatTND(f.sous_total_ht)} TND</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">Total TVA</dt>
                <dd className="font-medium">{formatTND(f.total_tva)} TND</dd>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-2 text-base font-bold">
                <dt>Total TTC</dt>
                <dd>{formatTND(f.total_ttc)} TND</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">Montant payé</dt>
                <dd className="font-medium text-emerald-700">{formatTND(f.montant_paye)}</dd>
              </div>
              <div className="flex justify-between font-semibold">
                <dt>Reste à payer</dt>
                <dd className={resteAPayer > 0 ? "text-red-700" : "text-emerald-700"}>
                  {formatTND(resteAPayer)}
                </dd>
              </div>
            </dl>
            <p className="mt-3 border-t border-slate-100 pt-3 text-xs italic text-slate-500">
              Arrêtée la présente facture à la somme de : {montantEnLettres(f.total_ttc)}.
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
                <dt className="text-slate-500">Date</dt>
                <dd className="font-medium">{formatDate(f.date_facture)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">Échéance</dt>
                <dd className="font-medium">{formatDate(f.date_echeance)}</dd>
              </div>
            </dl>
          </Carte>
        </div>
      </div>
    </div>
  );
}
