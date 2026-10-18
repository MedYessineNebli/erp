"use client";

import { useActionState } from "react";
import {
  creerEmploye,
  modifierEmploye,
  type EtatEmploye,
} from "@/app/(app)/employes/actions";
import type { Employe } from "@/lib/types";

const etatInitial: EtatEmploye = {};

export function FormulaireEmploye({ employe }: { employe?: Employe }) {
  const estEdition = Boolean(employe);
  const action = estEdition
    ? modifierEmploye.bind(null, employe!.id)
    : creerEmploye;
  const [etat, formAction, enCours] = useActionState(action, etatInitial);

  return (
    <form action={formAction} className="space-y-4">
      {etat.erreur ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800">
          {etat.erreur}
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label className="etiquette" htmlFor="nom">Nom *</label>
          <input id="nom" name="nom" required className="champ-saisie" defaultValue={employe?.nom ?? ""} />
        </div>
        <div>
          <label className="etiquette" htmlFor="prenom">Prénom *</label>
          <input id="prenom" name="prenom" required className="champ-saisie" defaultValue={employe?.prenom ?? ""} />
        </div>
        <div>
          <label className="etiquette" htmlFor="cin">CIN</label>
          <input id="cin" name="cin" className="champ-saisie" defaultValue={employe?.cin ?? ""} />
        </div>
        <div>
          <label className="etiquette" htmlFor="poste">Poste</label>
          <input id="poste" name="poste" className="champ-saisie" defaultValue={employe?.poste ?? ""} />
        </div>
        <div>
          <label className="etiquette" htmlFor="date_embauche">Date d&apos;embauche</label>
          <input id="date_embauche" name="date_embauche" type="date" className="champ-saisie" defaultValue={employe?.date_embauche ?? ""} />
        </div>
        <div>
          <label className="etiquette" htmlFor="salaire_base_brut">Salaire de base brut (TND) *</label>
          <input id="salaire_base_brut" name="salaire_base_brut" type="number" step="0.001" min="0" required className="champ-saisie" defaultValue={employe?.salaire_base_brut ?? 0} />
        </div>
        <div>
          <label className="etiquette" htmlFor="numero_cnss">N° CNSS</label>
          <input id="numero_cnss" name="numero_cnss" className="champ-saisie" defaultValue={employe?.numero_cnss ?? ""} />
        </div>
        <div>
          <label className="etiquette" htmlFor="nb_enfants">Nombre d&apos;enfants à charge</label>
          <input id="nb_enfants" name="nb_enfants" type="number" min="0" step="1" className="champ-saisie" defaultValue={employe?.nb_enfants ?? 0} />
        </div>
        <div>
          <label className="etiquette" htmlFor="rib">RIB</label>
          <input id="rib" name="rib" className="champ-saisie" defaultValue={employe?.rib ?? ""} />
        </div>
        <div>
          <label className="etiquette" htmlFor="telephone">Téléphone</label>
          <input id="telephone" name="telephone" className="champ-saisie" defaultValue={employe?.telephone ?? ""} />
        </div>
        <div className="md:col-span-2">
          <label className="etiquette" htmlFor="email">Email</label>
          <input id="email" name="email" type="email" className="champ-saisie" defaultValue={employe?.email ?? ""} />
        </div>
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            name="actif"
            defaultChecked={employe?.actif ?? true}
            className="h-4 w-4 rounded border-slate-300 text-blue-700 focus:ring-blue-600"
          />
          Employé actif
        </label>
      </div>

      <div className="flex justify-end">
        <button type="submit" disabled={enCours} className="btn-primaire">
          {enCours ? "Enregistrement…" : estEdition ? "Enregistrer" : "Créer l'employé"}
        </button>
      </div>
    </form>
  );
}
