import Link from "next/link";
import { EnTetePage, EtatVide } from "@/components/ui/carte";
import { Badge, badgeStatutDevis } from "@/components/ui/badge";
import { formatDate, formatTND } from "@/lib/formatage";
import { createClient } from "@/lib/supabase/server";
import type { Devis } from "@/lib/types";

export default async function PageDevis() {
  const supabase = await createClient();
  const { data: devis } = await supabase
    .from("devis")
    .select("*, clients(nom), factures(numero)")
    .order("created_at", { ascending: false });

  return (
    <div>
      <EnTetePage
        titre="Devis"
        description="Créez des devis, suivez leur statut et convertissez-les en factures"
        actions={
          <Link href="/devis/nouveau" className="btn-primaire">
            + Nouveau devis
          </Link>
        }
      />

      {devis && devis.length > 0 ? (
        <div className="carte overflow-x-auto">
          <table className="tableau">
            <thead>
              <tr>
                <th>Numéro</th>
                <th>Client</th>
                <th>Date</th>
                <th>Statut</th>
                <th className="text-right">Total HT</th>
                <th className="text-right">Total TTC</th>
                <th>Facture liée</th>
              </tr>
            </thead>
            <tbody>
              {(devis as unknown as Devis[]).map((d) => {
                const info = badgeStatutDevis(d.statut);
                return (
                  <tr key={d.id}>
                    <td>
                      <Link href={`/devis/${d.id}`} className="font-medium text-blue-700 hover:underline">
                        {d.numero}
                      </Link>
                    </td>
                    <td>{d.clients?.nom ?? "—"}</td>
                    <td>{formatDate(d.date_devis)}</td>
                    <td>
                      <Badge ton={info.ton}>{info.texte}</Badge>
                    </td>
                    <td className="text-right">{formatTND(d.sous_total_ht)}</td>
                    <td className="text-right font-medium">{formatTND(d.total_ttc)}</td>
                    <td>
                      {d.facture_id ? (
                        <Link href={`/factures/${d.facture_id}`} className="text-blue-700 hover:underline">
                          {d.factures?.numero ?? "Voir la facture"}
                        </Link>
                      ) : (
                        "—"
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <EtatVide
          titre="Aucun devis"
          message="Créez votre premier devis pour proposer vos services ou produits à un client."
          action={
            <Link href="/devis/nouveau" className="btn-primaire">
              Créer un devis
            </Link>
          }
        />
      )}
    </div>
  );
}
