"use client";

import { useActionState, useState } from "react";
import {
  EditeurLignes,
  ligneVide,
  lignesDepuisBase,
  lignesVersJSON,
  type LigneEditeur,
} from "./editeur-lignes";
import type { LigneDocument, Produit } from "@/lib/types";

export type TypeDocument = "devis" | "facture" | "achat";

export type EtatDocument = { erreur?: string };

export function FormulaireDocument({
  type,
  action,
  entites,
  produits,
  tauxTvaDisponibles,
  document,
  lignes,
}: {
  type: TypeDocument;
  action: (etat: EtatDocument, formData: FormData) => Promise<EtatDocument>;
  entites: { id: string; nom: string }[];
  produits: Produit[];
  tauxTvaDisponibles: number[];
  document?: {
    id: string;
    numero?: string;
    date: string;
    date_secondaire?: string | null;
    entite_id: string;
    notes?: string | null;
  };
  lignes?: LigneDocument[];
}) {
  const libelleEntite = type === "achat" ? "Fournisseur" : "Client";
  const [etat, formAction, enCours] = useActionState(action, {});
  const [lignesEditeur, setLignesEditeur] = useState<LigneEditeur[]>(
    lignes && lignes.length > 0 ? lignesDepuisBase(lignes) : [ligneVide(tauxTvaDisponibles[tauxTvaDisponibles.length - 1] ?? 19)]
  );

  const dateLabel =
    type === "devis" ? "Date du devis" : type === "facture" ? "Date de la facture" : "Date de l'achat";
  const dateName = type === "devis" ? "date_devis" : type === "facture" ? "date_facture" : "date_achat";
  const dateSecondaireLabel =
    type === "devis" ? "Validité jusqu'au" : type === "facture" ? "Échéance" : null;
  const dateSecondaireName =
    type === "devis" ? "date_validite" : type === "facture" ? "date_echeance" : null;

  const champEntiteName = type === "achat" ? "fournisseur_id" : "client_id";

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="lignes" value={lignesVersJSON(lignesEditeur)} />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div>
          <label className="etiquette" htmlFor="entite_id">
            {libelleEntite} *
          </label>
          <select
            id="entite_id"
            name={champEntiteName}
            required
            className="champ-saisie"
            defaultValue={document?.entite_id ?? ""}
          >
            <option value="" disabled>
              Sélectionner…
            </option>
            {entites.map((entite) => (
              <option key={entite.id} value={entite.id}>
                {entite.nom}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="etiquette" htmlFor={dateName}>
            {dateLabel} *
          </label>
          <input
            id={dateName}
            name={dateName}
            type="date"
            required
            className="champ-saisie"
            defaultValue={document?.date ?? new Date().toISOString().slice(0, 10)}
          />
        </div>
        {dateSecondaireName && dateSecondaireLabel ? (
          <div>
            <label className="etiquette" htmlFor={dateSecondaireName}>
              {dateSecondaireLabel}
            </label>
            <input
              id={dateSecondaireName}
              name={dateSecondaireName}
              type="date"
              className="champ-saisie"
              defaultValue={document?.date_secondaire ?? ""}
            />
          </div>
        ) : null}
        {type === "achat" ? (
          <div>
            <label className="etiquette" htmlFor="reference_fournisseur">
              Référence fournisseur
            </label>
            <input
              id="reference_fournisseur"
              name="reference_fournisseur"
              className="champ-saisie"
              defaultValue=""
            />
          </div>
        ) : null}
      </div>

      <div>
        <label className="etiquette" htmlFor="notes">
          Notes / conditions
        </label>
        <textarea
          id="notes"
          name="notes"
          rows={2}
          className="champ-saisie"
          defaultValue={document?.notes ?? ""}
          placeholder={
            type === "devis"
              ? "Conditions de paiement, délai de livraison…"
              : "Modalités de règlement…"
          }
        />
      </div>

      <EditeurLignes
        lignes={lignesEditeur}
        onLignes={setLignesEditeur}
        produits={produits}
        tauxTvaDisponibles={tauxTvaDisponibles}
        libelleEntite={libelleEntite}
      />

      {etat.erreur ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800">
          {etat.erreur}
        </div>
      ) : null}

      <div className="flex justify-end">
        <button type="submit" disabled={enCours} className="btn-primaire">
          {enCours
            ? "Enregistrement…"
            : document
              ? "Enregistrer les modifications"
              : type === "devis"
                ? "Créer le devis"
                : type === "facture"
                  ? "Créer la facture"
                  : "Créer l'achat"}
        </button>
      </div>
    </form>
  );
}
