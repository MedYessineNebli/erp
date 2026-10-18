import Link from "next/link";
import { EnTetePage, EtatVide } from "@/components/ui/carte";
import { Badge, badgeStatutAchat } from "@/components/ui/badge";
import { formatDate, formatTND } from "@/lib/formatage";
import { createClient } from "@/lib/supabase/server";
import type { Achat } from "@/lib/types";

export default async function PageAchats() {
  const supabase = await createClient();
  const { data: achats } = await supabase
    .from("achats")
    .select("*, fournisseurs(nom)")
    .order("created_at", { ascending: false });

  return (
    <div>
      <EnTetePage
        titre="Achats"
        description="Factures d'achat fournisseurs : la réception incrémente automatiquement le stock"
        actions={
          <Link href="/achats/nouveau" className="btn-primaire">
            + Nouvel achat
          </Link>
        }
      />

      {achats && achats.length > 0 ? (
        <div className="carte overflow-x-auto">
          <table className="tableau">
            <thead>
              <tr>
                <th>Numéro</th>
                <th>Fournisseur</th>
                <th>Date</th>
                <th>Réf. fournisseur</th>
                <th>Statut</th>
                <th className="text-right">Total TTC</th>
              </tr>
            </thead>
            <tbody>
              {(achats as unknown as Achat[]).map((a) => {
                const info = badgeStatutAchat(a.statut);
                return (
                  <tr key={a.id}>
                    <td>
                      <Link href={`/achats/${a.id}`} className="font-medium text-blue-700 hover:underline">
                        {a.numero}
                      </Link>
                    </td>
                    <td>{a.fournisseurs?.nom ?? "—"}</td>
                    <td>{formatDate(a.date_achat)}</td>
                    <td>{a.reference_fournisseur ?? "—"}</td>
                    <td>
                      <Badge ton={info.ton}>{info.texte}</Badge>
                    </td>
                    <td className="text-right font-medium">{formatTND(a.total_ttc)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <EtatVide
          titre="Aucun achat"
          message="Enregistrez vos achats fournisseurs pour suivre vos coûts et alimenter le stock."
          action={
            <Link href="/achats/nouveau" className="btn-primaire">
              Créer un achat
            </Link>
          }
        />
      )}
    </div>
  );
}
