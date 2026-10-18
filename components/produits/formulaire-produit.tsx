"use client";

import { useActionState } from "react";
import {
  creerProduit,
  modifierProduit,
  type EtatProduit,
} from "@/app/(app)/produits/actions";
import type { Produit } from "@/lib/types";

const etatInitial: EtatProduit = {};

export function FormulaireProduit({
  produit,
  tauxTva,
}: {
  produit?: Produit;
  tauxTva: number[];
}) {
  const estEdition = Boolean(produit);
  const action = estEdition
    ? modifierProduit.bind(null, produit!.id)
    : creerProduit;
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
          <input id="nom" name="nom" required className="champ-saisie" defaultValue={produit?.nom ?? ""} />
        </div>
        <div>
          <label className="etiquette" htmlFor="reference">Référence</label>
          <input id="reference" name="reference" className="champ-saisie" defaultValue={produit?.reference ?? ""} />
        </div>
        <div>
          <label className="etiquette" htmlFor="unite">Unité</label>
          <input id="unite" name="unite" className="champ-saisie" defaultValue={produit?.unite ?? "pièce"} />
        </div>
        <div>
          <label className="etiquette" htmlFor="prix_achat_ht">Prix d&apos;achat HT (TND)</label>
          <input id="prix_achat_ht" name="prix_achat_ht" type="number" step="0.001" min="0" className="champ-saisie" defaultValue={produit?.prix_achat_ht ?? 0} />
        </div>
        <div>
          <label className="etiquette" htmlFor="prix_vente_ht">Prix de vente HT (TND)</label>
          <input id="prix_vente_ht" name="prix_vente_ht" type="number" step="0.001" min="0" className="champ-saisie" defaultValue={produit?.prix_vente_ht ?? 0} />
        </div>
        <div>
          <label className="etiquette" htmlFor="taux_tva">Taux de TVA (%)</label>
          <select id="taux_tva" name="taux_tva" className="champ-saisie" defaultValue={produit?.taux_tva ?? 19}>
            {tauxTva.map((taux) => (
              <option key={taux} value={taux}>
                {taux} %
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="etiquette" htmlFor="quantite_min">Seuil d&apos;alerte stock</label>
          <input id="quantite_min" name="quantite_min" type="number" step="0.001" min="0" className="champ-saisie" defaultValue={produit?.quantite_min ?? 0} />
        </div>
        {!estEdition ? (
          <div>
            <label className="etiquette" htmlFor="quantite">Quantité initiale</label>
            <input id="quantite" name="quantite" type="number" step="0.001" className="champ-saisie" defaultValue={0} />
          </div>
        ) : (
          <div>
            <label className="etiquette">Stock actuel</label>
            <p className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
              {produit?.quantite} {produit?.unite} — modifiable via les mouvements de stock
            </p>
          </div>
        )}
        <div className="md:col-span-2">
          <label className="etiquette" htmlFor="description">Description</label>
          <textarea id="description" name="description" rows={2} className="champ-saisie" defaultValue={produit?.description ?? ""} />
        </div>
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            name="actif"
            defaultChecked={produit?.actif ?? true}
            className="h-4 w-4 rounded border-slate-300 text-blue-700 focus:ring-blue-600"
          />
          Produit actif
        </label>
      </div>

      <div className="flex justify-end gap-2">
        <button type="submit" disabled={enCours} className="btn-primaire">
          {enCours ? "Enregistrement…" : estEdition ? "Enregistrer" : "Créer le produit"}
        </button>
      </div>
    </form>
  );
}
