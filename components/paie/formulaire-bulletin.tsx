"use client";

import { useActionState } from "react";
import { modifierBulletin, type EtatBulletin } from "@/app/(app)/paie/actions";
import { Alerte } from "@/components/ui/carte";

const etatInitial: EtatBulletin = {};

export function FormulaireEditionBulletin({
  bulletinId,
  salaireBase,
  primes,
  retenuesAbsences,
  heuresSup,
  bloque,
}: {
  bulletinId: string;
  salaireBase: number;
  primes: number;
  retenuesAbsences: number;
  heuresSup: number;
  bloque: boolean;
}) {
  const action = modifierBulletin.bind(null, bulletinId);
  const [etat, formAction, enCours] = useActionState(action, etatInitial);

  if (bloque) {
    return (
      <p className="text-sm text-slate-500">
        Ce bulletin n&apos;est plus en brouillon : les montants sont figés.
      </p>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      {etat.erreur ? <Alerte ton="danger">{etat.erreur}</Alerte> : null}
      {etat.succes ? <Alerte ton="succes">Bulletin recalculé.</Alerte> : null}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label className="etiquette" htmlFor="salaire_base">
            Salaire de base brut (TND)
          </label>
          <input id="salaire_base" name="salaire_base" type="number" step="0.001" min="0" className="champ-saisie" defaultValue={salaireBase} />
        </div>
        <div>
          <label className="etiquette" htmlFor="heures_sup">
            Heures supplémentaires
          </label>
          <input id="heures_sup" name="heures_sup" type="number" step="0.25" min="0" className="champ-saisie" defaultValue={heuresSup} />
        </div>
        <div>
          <label className="etiquette" htmlFor="primes">
            Primes et indemnités (TND)
          </label>
          <input id="primes" name="primes" type="number" step="0.001" min="0" className="champ-saisie" defaultValue={primes} />
        </div>
        <div>
          <label className="etiquette" htmlFor="retenues_absences">
            Retenues pour absences (TND)
          </label>
          <input id="retenues_absences" name="retenues_absences" type="number" step="0.001" min="0" className="champ-saisie" defaultValue={retenuesAbsences} />
        </div>
      </div>

      <div className="flex justify-end">
        <button type="submit" disabled={enCours} className="btn-primaire">
          {enCours ? "Recalcul…" : "Recalculer le bulletin"}
        </button>
      </div>
    </form>
  );
}
