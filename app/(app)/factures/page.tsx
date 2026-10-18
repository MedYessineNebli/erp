import Link from "next/link";
import { EnTetePage, EtatVide } from "@/components/ui/carte";
import { Badge, badgeStatutFacture } from "@/components/ui/badge";
import { formatDate, formatTND } from "@/lib/formatage";
import { createClient } from "@/lib/supabase/server";
import type { Facture } from "@/lib/types";

export default async function PageFactures() {
  const supabase = await createClient();
  const { data: factures } = await supabase
    .from("factures")
    .select("*, clients(nom), devis(numero)")
    .order("created_at", { ascending: false });

  return (
    <div>
      <EnTetePage
        titre="Factures"
        description="Factures de vente : émission, suivi des paiements et export PDF"
        actions={
          <Link href="/factures/nouvelle" className="btn-primaire">
            + Nouvelle facture
          </Link>
        }
      />

      {factures && factures.length > 0 ? (
        <div className="carte overflow-x-auto">
          <table className="tableau">
            <thead>
              <tr>
                <th>Numéro</th>
                <th>Client</th>
                <th>Date</th>
                <th>Échéance</th>
                <th>Statut</th>
                <th className="text-right">Total TTC</th>
                <th className="text-right">Payé</th>
              </tr>
            </thead>
            <tbody>
              {(factures as unknown as Facture[]).map((f) => {
                const info = badgeStatutFacture(f.statut);
                return (
                  <tr key={f.id}>
                    <td>
                      <Link href={`/factures/${f.id}`} className="font-medium text-blue-700 hover:underline">
                        {f.numero}
                      </Link>
                    </td>
                    <td>{f.clients?.nom ?? "—"}</td>
                    <td>{formatDate(f.date_facture)}</td>
                    <td>{formatDate(f.date_echeance)}</td>
                    <td>
                      <Badge ton={info.ton}>{info.texte}</Badge>
                    </td>
                    <td className="text-right font-medium">{formatTND(f.total_ttc)}</td>
                    <td className="text-right">{formatTND(f.montant_paye)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <EtatVide
          titre="Aucune facture"
          message="Créez votre première facture de vente ou convertissez un devis accepté."
          action={
            <Link href="/factures/nouvelle" className="btn-primaire">
              Créer une facture
            </Link>
          }
        />
      )}
    </div>
  );
}
