"use client";

import { useActionState } from "react";
import {
  creerTiers,
  modifierTiers,
  type EtatTiers,
  type TypeTiers,
} from "@/app/(app)/tiers/actions";
import type { Client } from "@/lib/types";

const etatInitial: EtatTiers = {};

export function FormulaireTiers({
  type,
  tiers,
}: {
  type: TypeTiers;
  tiers?: Client;
}) {
  const estEdition = Boolean(tiers);
  const action = estEdition
    ? modifierTiers.bind(null, type, tiers!.id)
    : creerTiers.bind(null, type);
  const [etat, formAction, enCours] = useActionState(action, etatInitial);

  return (
    <form action={formAction} className="space-y-4">
      {etat.erreur ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800">
          {etat.erreur}
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="md:col-span-2">
          <label className="etiquette" htmlFor="nom">Nom *</label>
          <input id="nom" name="nom" required className="champ-saisie" defaultValue={tiers?.nom ?? ""} />
        </div>
        <div>
          <label className="etiquette" htmlFor="contact">Personne de contact</label>
          <input id="contact" name="contact" className="champ-saisie" defaultValue={tiers?.contact ?? ""} />
        </div>
        <div>
          <label className="etiquette" htmlFor="email">Email</label>
          <input id="email" name="email" type="email" className="champ-saisie" defaultValue={tiers?.email ?? ""} />
        </div>
        <div>
          <label className="etiquette" htmlFor="telephone">Téléphone</label>
          <input id="telephone" name="telephone" className="champ-saisie" defaultValue={tiers?.telephone ?? ""} />
        </div>
        <div>
          <label className="etiquette" htmlFor="ville">Ville</label>
          <input id="ville" name="ville" className="champ-saisie" defaultValue={tiers?.ville ?? ""} />
        </div>
        <div className="md:col-span-2">
          <label className="etiquette" htmlFor="adresse">Adresse</label>
          <input id="adresse" name="adresse" className="champ-saisie" defaultValue={tiers?.adresse ?? ""} />
        </div>
        <div>
          <label className="etiquette" htmlFor="ice">ICE</label>
          <input id="ice" name="ice" className="champ-saisie" defaultValue={tiers?.ice ?? ""} />
        </div>
        <div>
          <label className="etiquette" htmlFor="matricule_fiscal">Matricule fiscal</label>
          <input id="matricule_fiscal" name="matricule_fiscal" className="champ-saisie" defaultValue={tiers?.matricule_fiscal ?? ""} />
        </div>
        <div>
          <label className="etiquette" htmlFor="numero_tva">N° TVA (NR_ART)</label>
          <input id="numero_tva" name="numero_tva" className="champ-saisie" defaultValue={tiers?.numero_tva ?? ""} />
        </div>
        <div className="md:col-span-2">
          <label className="etiquette" htmlFor="notes">Notes</label>
          <textarea id="notes" name="notes" rows={2} className="champ-saisie" defaultValue={tiers?.notes ?? ""} />
        </div>
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            name="actif"
            defaultChecked={tiers?.actif ?? true}
            className="h-4 w-4 rounded border-slate-300 text-blue-700 focus:ring-blue-600"
          />
          {type === "clients" ? "Client actif" : "Fournisseur actif"}
        </label>
      </div>

      <div className="flex justify-end">
        <button type="submit" disabled={enCours} className="btn-primaire">
          {enCours ? "Enregistrement…" : estEdition ? "Enregistrer" : "Créer"}
        </button>
      </div>
    </form>
  );
}
