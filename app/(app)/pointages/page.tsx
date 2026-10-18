import Link from "next/link";
import { connection } from "next/server";
import { EnTetePage, Carte, EtatVide } from "@/components/ui/carte";
import {
  FormulairePointage,
  BoutonSupprimerPointage,
} from "@/components/rh/formulaire-pointage";
import { dureeEnHeures } from "@/lib/pointages";
import { formatDate, formatHeure, formatDureeHeures, moisEnLettres, periodeCourante } from "@/lib/formatage";
import { createClient } from "@/lib/supabase/server";
import type { Employe, Pointage } from "@/lib/types";

export default async function PagePointages({
  searchParams,
}: {
  searchParams: Promise<{ mois?: string }>;
}) {
  await connection();

  const { mois } = await searchParams;
  const periode = mois ?? periodeCourante();

  const debut = `${periode}-01`;
  const fin = `${periode}-31`;

  const supabase = await createClient();

  const [{ data: employes }, { data: pointages }] = await Promise.all([
    supabase.from("employes").select("*").eq("actif", true).order("nom"),
    supabase
      .from("pointages")
      .select("*, employes(nom, prenom)")
      .gte("date_pointage", debut)
      .lte("date_pointage", fin)
      .order("date_pointage", { ascending: false }),
  ]);

  const liste = (pointages ?? []) as unknown as (Pointage & {
    employes: { nom: string; prenom: string } | null;
  })[];

  // Totaux par employé
  const totauxParEmploye = new Map<string, { nom: string; heures: number; heuresSup: number; jours: number }>();
  for (const p of liste) {
    const heures = dureeEnHeures(p.heure_entree, p.heure_sortie);
    const nom = p.employes ? `${p.employes.nom.toUpperCase()} ${p.employes.prenom}` : "—";
    const existant = totauxParEmploye.get(p.employe_id) ?? { nom, heures: 0, heuresSup: 0, jours: 0 };
    existant.heures += heures;
    existant.heuresSup += p.heures_sup;
    existant.jours += 1;
    totauxParEmploye.set(p.employe_id, existant);
  }

  return (
    <div>
      <EnTetePage
        titre="Pointages"
        description="Suivi des présences : heures travaillées et heures supplémentaires par employé"
      />

      <div className="mb-6 flex flex-wrap items-center gap-4">
        <form method="get" className="flex items-center gap-2">
          <label htmlFor="mois" className="etiquette mb-0">
            Mois
          </label>
          <input id="mois" name="mois" type="month" defaultValue={periode} className="champ-saisie" />
          <button type="submit" className="btn-secondaire">
            Afficher
          </button>
        </form>
        <p className="text-sm font-medium capitalize text-slate-600">
          {moisEnLettres(periode)} — {liste.length} pointage(s)
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Carte titre="Nouveau / mise à jour d'un pointage">
          <FormulairePointage employes={(employes ?? []) as Employe[]} />
          <p className="mt-3 text-xs text-slate-500">
            Un pointage enregistré deux fois pour le même employé et la même date est
            mis à jour.
          </p>
        </Carte>

        <div className="space-y-6 xl:col-span-2">
          <Carte titre={`Totaux du mois — ${moisEnLettres(periode)}`}>
            {totauxParEmploye.size > 0 ? (
              <table className="tableau">
                <thead>
                  <tr>
                    <th>Employé</th>
                    <th className="text-right">Jours pointés</th>
                    <th className="text-right">Heures travaillées</th>
                    <th className="text-right">Heures sup.</th>
                  </tr>
                </thead>
                <tbody>
                  {[...totauxParEmploye.values()].map((total) => (
                    <tr key={total.nom}>
                      <td className="font-medium">{total.nom}</td>
                      <td className="text-right">{total.jours}</td>
                      <td className="text-right">{formatDureeHeures(total.heures)}</td>
                      <td className="text-right">{formatDureeHeures(total.heuresSup)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="text-sm text-slate-500">Aucun pointage ce mois-ci.</p>
            )}
          </Carte>

          <Carte titre="Détail des pointages">
            {liste.length > 0 ? (
              <div className="max-h-[50vh] overflow-y-auto">
                <table className="tableau">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Employé</th>
                      <th>Entrée</th>
                      <th>Sortie</th>
                      <th className="text-right">Durée</th>
                      <th className="text-right">H. sup.</th>
                      <th className="text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {liste.map((p) => (
                      <tr key={p.id}>
                        <td>{formatDate(p.date_pointage)}</td>
                        <td className="font-medium">
                          {p.employes ? `${p.employes.nom.toUpperCase()} ${p.employes.prenom}` : "—"}
                        </td>
                        <td>{formatHeure(p.heure_entree)}</td>
                        <td>{formatHeure(p.heure_sortie)}</td>
                        <td className="text-right">
                          {formatDureeHeures(dureeEnHeures(p.heure_entree, p.heure_sortie))}
                        </td>
                        <td className="text-right">{formatDureeHeures(p.heures_sup)}</td>
                        <td className="text-right">
                          <BoutonSupprimerPointage id={p.id} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <EtatVide
                titre="Aucun pointage"
                message="Enregistrez les heures d'entrée et de sortie des employés pour alimenter la paie."
              />
            )}
          </Carte>
        </div>
      </div>

      <p className="mt-6 text-sm text-slate-500">
        Les heures supplémentaires saisies sont reprises automatiquement lors de la
        génération des bulletins — voir{" "}
        <Link href="/paie" className="font-medium text-blue-700 hover:underline">
          Bulletins de paie
        </Link>
        .
      </p>
    </div>
  );
}
