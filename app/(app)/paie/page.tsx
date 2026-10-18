import { connection } from "next/server";
import { EnTetePage, EtatVide } from "@/components/ui/carte";
import { Badge, badgeStatutBulletin } from "@/components/ui/badge";
import { BarreActionsPaie, ActionsBulletin } from "@/components/paie/actions-paie";
import { formatTND, moisEnLettres, periodeCourante } from "@/lib/formatage";
import { createClient } from "@/lib/supabase/server";
import type { BulletinPaie } from "@/lib/types";

export default async function PagePaie({
  searchParams,
}: {
  searchParams: Promise<{ mois?: string }>;
}) {
  await connection();

  const { mois } = await searchParams;
  const periode = mois ?? periodeCourante();

  const supabase = await createClient();
  const { data: bulletins } = await supabase
    .from("bulletins_paie")
    .select("*, employes(nom, prenom)")
    .eq("periode", periode)
    .order("created_at");

  const liste = (bulletins ?? []) as unknown as (BulletinPaie & {
    employes: { nom: string; prenom: string } | null;
  })[];

  const totalNet = liste.reduce((somme, b) => somme + b.net_a_payer, 0);
  const totalCout = liste.reduce((somme, b) => somme + b.cout_employeur, 0);

  return (
    <div>
      <EnTetePage
        titre="Bulletins de paie"
        description="Calcul automatique CNSS, AMO et IBS selon les paramètres de la société"
        actions={<BarreActionsPaie periode={periode} />}
      />

      <form method="get" className="mb-6 flex items-center gap-2">
        <label htmlFor="mois" className="etiquette mb-0">
          Période
        </label>
        <input id="mois" name="mois" type="month" defaultValue={periode} className="champ-saisie max-w-xs" />
        <button type="submit" className="btn-secondaire">
          Afficher
        </button>
      </form>

      {liste.length > 0 ? (
        <>
          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="carte p-5">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Bulletins — {moisEnLettres(periode)}
              </p>
              <p className="mt-2 text-2xl font-bold">{liste.length}</p>
            </div>
            <div className="carte p-5">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Total net à payer
              </p>
              <p className="mt-2 text-2xl font-bold text-emerald-700">
                {formatTND(totalNet)} TND
              </p>
            </div>
            <div className="carte p-5">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Coût employeur total
              </p>
              <p className="mt-2 text-2xl font-bold text-blue-700">
                {formatTND(totalCout)} TND
              </p>
            </div>
          </div>

          <div className="carte overflow-x-auto">
            <table className="tableau">
              <thead>
                <tr>
                  <th>Employé</th>
                  <th className="text-right">Brut</th>
                  <th className="text-right">CNSS</th>
                  <th className="text-right">AMO</th>
                  <th className="text-right">IBS</th>
                  <th className="text-right">Net à payer</th>
                  <th>Statut</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {liste.map((b) => {
                  const info = badgeStatutBulletin(b.statut);
                  return (
                    <tr key={b.id}>
                      <td className="font-medium text-slate-900">
                        {b.employes ? `${b.employes.nom.toUpperCase()} ${b.employes.prenom}` : "—"}
                      </td>
                      <td className="text-right">{formatTND(b.salaire_base + b.total_primes)}</td>
                      <td className="text-right">{formatTND(b.montant_cnss)}</td>
                      <td className="text-right">{formatTND(b.montant_amo)}</td>
                      <td className="text-right">{formatTND(b.montant_ir)}</td>
                      <td className="text-right font-semibold">{formatTND(b.net_a_payer)}</td>
                      <td>
                        <Badge ton={info.ton}>{info.texte}</Badge>
                      </td>
                      <td>
                        <ActionsBulletin id={b.id} statut={b.statut} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <EtatVide
          titre="Aucun bulletin pour cette période"
          message={`Cliquez sur « Générer les bulletins de ${periode} » pour calculer automatiquement la paie de tous les employés actifs.`}
        />
      )}
    </div>
  );
}
