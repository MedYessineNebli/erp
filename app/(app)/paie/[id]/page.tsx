import Link from "next/link";
import { notFound } from "next/navigation";
import { EnTetePage, Carte } from "@/components/ui/carte";
import { Badge, badgeStatutBulletin } from "@/components/ui/badge";
import { FormulaireEditionBulletin } from "@/components/paie/formulaire-bulletin";
import {
  payerBulletinFormulaire,
  validerBulletinFormulaire,
} from "@/app/(app)/paie/actions";
import { formatTND, moisEnLettres } from "@/lib/formatage";
import { createClient } from "@/lib/supabase/server";
import type { BulletinPaie, ParametresSociete } from "@/lib/types";

type DetailBulletin = {
  bruts?: { libelle: string; montant: number }[];
  retenues?: { libelle: string; montant: number; taux?: number }[];
};

export default async function PageBulletin({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: bulletin }, { data: parametres }] = await Promise.all([
    supabase
      .from("bulletins_paie")
      .select("*, employes(*)")
      .eq("id", id)
      .single(),
    supabase.from("parametres_societe").select("*").limit(1).maybeSingle(),
  ]);

  if (!bulletin) notFound();

  const b = bulletin as unknown as BulletinPaie & {
    employes: {
      nom: string;
      prenom: string;
      poste: string | null;
      numero_cnss: string | null;
      rib: string | null;
      nb_enfants: number;
    } | null;
  };

  const info = badgeStatutBulletin(b.statut);
  const details = (b.details ?? {}) as DetailBulletin;
  const p = parametres as ParametresSociete | null;

  return (
    <div>
      <EnTetePage
        titre={`Bulletin de paie — ${moisEnLettres(b.periode)}`}
        description={
          b.employes
            ? `${b.employes.nom.toUpperCase()} ${b.employes.prenom}${b.employes.poste ? ` — ${b.employes.poste}` : ""}`
            : ""
        }
        actions={
          <>
            <a href={`/api/pdf/bulletin/${b.id}`} target="_blank" className="btn-secondaire">
              Télécharger le PDF
            </a>
            {b.statut === "brouillon" ? (
              <form action={validerBulletinFormulaire}>
                <input type="hidden" name="id" value={b.id} />
                <button type="submit" className="btn-primaire">
                  Valider le bulletin
                </button>
              </form>
            ) : b.statut === "valide" ? (
              <form action={payerBulletinFormulaire}>
                <input type="hidden" name="id" value={b.id} />
                <button type="submit" className="btn-primaire">
                  Marquer payé
                </button>
              </form>
            ) : null}
            <Link href="/paie" className="btn-secondaire">
              Retour
            </Link>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="space-y-6">
          <Carte titre="Gains et retenues modifiables">
            <FormulaireEditionBulletin
              bulletinId={b.id}
              salaireBase={b.salaire_base}
              primes={b.total_primes}
              retenuesAbsences={b.total_retenues}
              heuresSup={b.heures_sup}
              bloque={b.statut !== "brouillon"}
            />
          </Carte>

          <Carte titre="Détail des gains">
            <ul className="divide-y divide-slate-100 text-sm">
              {(details.bruts ?? []).map((ligne, index) => (
                <li key={index} className="flex justify-between py-2">
                  <span className="text-slate-600">{ligne.libelle}</span>
                  <span className="font-medium">{formatTND(ligne.montant)}</span>
                </li>
              ))}
            </ul>
          </Carte>

          <Carte titre="Détail des retenues">
            <ul className="divide-y divide-slate-100 text-sm">
              {(details.retenues ?? []).map((ligne, index) => (
                <li key={index} className="flex justify-between py-2">
                  <span className="text-slate-600">{ligne.libelle}</span>
                  <span className="font-medium text-red-700">−{formatTND(ligne.montant)}</span>
                </li>
              ))}
            </ul>
          </Carte>
        </div>

        <div className="space-y-6">
          <Carte titre="Synthèse du bulletin">
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-slate-500">Salaire brut</dt>
                <dd className="font-medium">{formatTND(b.salaire_base + b.total_primes + b.heures_sup * (p?.majoration_heures_sup ?? 1.5))} TND</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">− Retenues absences</dt>
                <dd className="font-medium">{formatTND(b.total_retenues)} TND</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">− CNSS ouvrière</dt>
                <dd className="font-medium">{formatTND(b.montant_cnss)} TND</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">− AMO ouvrière</dt>
                <dd className="font-medium">{formatTND(b.montant_amo)} TND</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">− IBS (impôt)</dt>
                <dd className="font-medium">{formatTND(b.montant_ir)} TND</dd>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-2 text-base font-bold">
                <dt>Net à payer</dt>
                <dd className="text-emerald-700">{formatTND(b.net_a_payer)} TND</dd>
              </div>
              <div className="flex justify-between border-t border-slate-100 pt-2">
                <dt className="text-slate-500">Coût employeur (estimation)</dt>
                <dd className="font-medium text-blue-700">{formatTND(b.cout_employeur)} TND</dd>
              </div>
            </dl>
            <div className="mt-3">
              <Badge ton={info.ton}>{info.texte}</Badge>
            </div>
          </Carte>

          <Carte titre="Informations salarial">
            <dl className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-slate-500">Base imposable</dt>
                <dd className="font-medium">{formatTND(b.base_imposable)} TND</dd>
              </div>
              <div>
                <dt className="text-slate-500">Heures sup.</dt>
                <dd className="font-medium">{b.heures_sup} h</dd>
              </div>
              <div>
                <dt className="text-slate-500">N° CNSS</dt>
                <dd className="font-medium">{b.employes?.numero_cnss ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Enfants à charge</dt>
                <dd className="font-medium">{b.employes?.nb_enfants ?? 0}</dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-slate-500">RIB</dt>
                <dd className="font-medium">{b.employes?.rib ?? "—"}</dd>
              </div>
            </dl>
            {p ? (
              <p className="mt-4 border-t border-slate-100 pt-3 text-xs text-slate-400">
                Calculé avec : CNSS {p.taux_cnss_salarie} % (plafond {formatTND(p.plafond_cnss)}) —
                AMO {p.taux_amo_salarie} % — abattement {formatTND(p.abattement_mensuel)} TND/mois —
                10 TND par enfant à charge.
              </p>
            ) : null}
          </Carte>
        </div>
      </div>
    </div>
  );
}
