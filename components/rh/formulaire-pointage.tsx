"use client";

import { useActionState, useTransition } from "react";
import {
  enregistrerPointage,
  supprimerPointage,
  type EtatPointage,
} from "@/app/(app)/pointages/actions";
import { Alerte } from "@/components/ui/carte";
import type { Employe } from "@/lib/types";

const etatInitial: EtatPointage = {};

export function FormulairePointage({ employes }: { employes: Employe[] }) {
  const [etat, action, enCours] = useActionState(enregistrerPointage, etatInitial);

  return (
    <form action={action} className="space-y-4">
      {etat.erreur ? <Alerte ton="danger">{etat.erreur}</Alerte> : null}
      {etat.succes ? <Alerte ton="succes">Pointage enregistré.</Alerte> : null}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="md:col-span-2">
          <label className="etiquette" htmlFor="employe_id">Employé *</label>
          <select id="employe_id" name="employe_id" required className="champ-saisie" defaultValue="">
            <option value="" disabled>
              Sélectionner…
            </option>
            {employes.map((e) => (
              <option key={e.id} value={e.id}>
                {e.nom.toUpperCase()} {e.prenom}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="etiquette" htmlFor="date_pointage">Date *</label>
          <input id="date_pointage" name="date_pointage" type="date" required className="champ-saisie" defaultValue={new Date().toISOString().slice(0, 10)} />
        </div>
        <div>
          <label className="etiquette" htmlFor="heures_sup">Heures supplémentaires</label>
          <input id="heures_sup" name="heures_sup" type="number" min="0" step="0.25" className="champ-saisie" defaultValue={0} />
        </div>
        <div>
          <label className="etiquette" htmlFor="heure_entree">Heure d&apos;entrée</label>
          <input id="heure_entree" name="heure_entree" type="time" className="champ-saisie" />
        </div>
        <div>
          <label className="etiquette" htmlFor="heure_sortie">Heure de sortie</label>
          <input id="heure_sortie" name="heure_sortie" type="time" className="champ-saisie" />
        </div>
        <div className="md:col-span-2">
          <label className="etiquette" htmlFor="notes">Notes</label>
          <input id="notes" name="notes" className="champ-saisie" />
        </div>
      </div>

      <div className="flex justify-end">
        <button type="submit" disabled={enCours} className="btn-primaire">
          {enCours ? "Enregistrement…" : "Enregistrer le pointage"}
        </button>
      </div>
    </form>
  );
}

export function BoutonSupprimerPointage({ id }: { id: string }) {
  const [enCours, startTransition] = useTransition();
  return (
    <button
      type="button"
      disabled={enCours}
      className="text-sm font-medium text-red-600 hover:underline disabled:opacity-50"
      onClick={() => {
        if (confirm("Supprimer ce pointage ?")) {
          startTransition(() => supprimerPointage(id));
        }
      }}
    >
      Supprimer
    </button>
  );
}
