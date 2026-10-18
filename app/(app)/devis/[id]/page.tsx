import Link from "next/link";
import { notFound } from "next/navigation";
import { EnTetePage, Carte, Alerte } from "@/components/ui/carte";
import { Badge, badgeStatutDevis } from "@/components/ui/badge";
import { BarreActionsDevis } from "@/components/documents/actions-devis";
import { FormulaireDocument } from "@/components/documents/formulaire-document";
import { modifierDevis } from "@/app/(app)/devis/actions";
import { formatDate, formatNombre, formatTND } from "@/lib/formatage";
import { createClient } from "@/lib/supabase/server";
import type { Devis, ParametresSociete, Produit } from "@/lib/types";

export default async function PageDevisDetail({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ modifier?: string }>;
}) {
  const { id } = await params;
  const { modifier } = await searchParams;

  const supabase = await createClient();
  const { data: devis } = await supabase
    .from("devis")
    .select("*, clients(*), devis_lignes(*), factures(id, numero)")
    .eq("id", id)
    .single();

  if (!devis) notFound();

  const d = devis as unknown as Devis & { factures: { id: string; numero: string } | null };
  const info = badgeStatutDevis(d.statut);
  const enModification = modifier === "1" && !d.facture_id;

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
          titre={`Modifier ${d.numero}`}
          actions={<BarreActionsDevis id={d.id} statut={d.statut} factureId={d.facture_id ?? null} enModification />}
        />
        <div className="carte p-6">
          <FormulaireDocument
            type="devis"
            action={modifierDevis.bind(null, d.id)}
            entites={(clients ?? []) as { id: string; nom: string }[]}
            produits={(produits ?? []) as Produit[]}
            tauxTvaDisponibles={
              (parametres as ParametresSociete | null)?.taux_tva_disponibles ?? [0, 7, 13, 19]
            }
            document={{
              id: d.id,
              numero: d.numero,
              date: d.date_devis,
              date_secondaire: d.date_validite,
              entite_id: d.client_id,
              notes: d.notes,
            }}
            lignes={d.devis_lignes ?? []}
          />
        </div>
      </div>
    );
  }

  return (
    <div>
      <EnTetePage
        titre={`Devis ${d.numero}`}
        description={`Client : ${d.clients?.nom ?? "—"} — ${formatDate(d.date_devis)}`}
        actions={
          <>
            <a href={`/api/pdf/devis/${d.id}`} className="btn-secondaire" target="_blank">
              Télécharger le PDF
            </a>
            <BarreActionsDevis id={d.id} statut={d.statut} factureId={d.facture_id ?? null} enModification={false} />
          </>
        }
      />

      {d.facture_id ? (
        <div className="mb-4">
          <Alerte ton="information">
            Ce devis est lié à la facture{" "}
            <Link href={`/factures/${d.facture_id}`} className="font-semibold underline">
              {d.factures?.numero}
            </Link>
            .
          </Alerte>
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Carte className="lg:col-span-2" titre="Lignes du devis">
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
              {(d.devis_lignes ?? []).map((ligne) => (
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
                <dd className="font-medium">{formatTND(d.sous_total_ht)} TND</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">Total TVA</dt>
                <dd className="font-medium">{formatTND(d.total_tva)} TND</dd>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-2 text-base font-bold">
                <dt>Total TTC</dt>
                <dd>{formatTND(d.total_ttc)} TND</dd>
              </div>
            </dl>
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
                <dd className="font-medium">{formatDate(d.date_devis)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">Validité</dt>
                <dd className="font-medium">{formatDate(d.date_validite)}</dd>
              </div>
              {d.notes ? (
                <div className="border-t border-slate-200 pt-2">
                  <dt className="text-slate-500">Notes</dt>
                  <dd className="mt-1 whitespace-pre-wrap text-slate-700">{d.notes}</dd>
                </div>
              ) : null}
            </dl>
          </Carte>
        </div>
      </div>
    </div>
  );
}
