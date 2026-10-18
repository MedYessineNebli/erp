"use client";

import { useMemo } from "react";
import { formatTND } from "@/lib/formatage";
import { arrondir3 } from "@/lib/documents";
import type { LigneDocument, Produit } from "@/lib/types";

export type LigneEditeur = {
  produit_id: string;
  description: string;
  quantite: string;
  prix_ht: string;
  taux_tva: string;
};

export function lignesVersJSON(lignes: LigneEditeur[]): string {
  return JSON.stringify(
    lignes
      .filter((l) => l.description.trim())
      .map((l) => ({
        produit_id: l.produit_id || null,
        description: l.description.trim(),
        quantite: Number(l.quantite) || 0,
        prix_ht: Number(l.prix_ht) || 0,
        taux_tva: Number(l.taux_tva) || 0,
      }))
  );
}

export function lignesDepuisBase(lignes: LigneDocument[]): LigneEditeur[] {
  if (lignes.length === 0) return [ligneVide()];
  return lignes.map((l) => ({
    produit_id: l.produit_id ?? "",
    description: l.description,
    quantite: String(l.quantite),
    prix_ht: String(l.prix_ht),
    taux_tva: String(l.taux_tva),
  }));
}

export function ligneVide(tauxTvaDefaut = 19): LigneEditeur {
  return { produit_id: "", description: "", quantite: "1", prix_ht: "0", taux_tva: String(tauxTvaDefaut) };
}

export function EditeurLignes({
  lignes,
  onLignes,
  produits,
  tauxTvaDisponibles,
  libelleEntite,
}: {
  lignes: LigneEditeur[];
  onLignes: (lignes: LigneEditeur[]) => void;
  produits: Produit[];
  tauxTvaDisponibles: number[];
  libelleEntite: "Client" | "Fournisseur";
}) {
  const totaux = useMemo(() => {
    let ht = 0;
    let tva = 0;
    for (const l of lignes) {
      if (!l.description.trim()) continue;
      const montantHt = (Number(l.quantite) || 0) * (Number(l.prix_ht) || 0);
      ht += montantHt;
      tva += (montantHt * (Number(l.taux_tva) || 0)) / 100;
    }
    const sousTotal = arrondir3(ht);
    const totalTva = arrondir3(tva);
    return { ht: sousTotal, tva: totalTva, ttc: arrondir3(sousTotal + totalTva) };
  }, [lignes]);

  const majLigne = (index: number, champ: keyof LigneEditeur, valeur: string) => {
    onLignes(lignes.map((l, i) => (i === index ? { ...l, [champ]: valeur } : l)));
  };

  const majProduit = (index: number, produitId: string) => {
    const produit = produits.find((p) => p.id === produitId);
    onLignes(
      lignes.map((l, i) =>
        i === index
          ? {
              ...l,
              produit_id: produitId,
              description: produit ? produit.nom : l.description,
              prix_ht: produit
                ? String(
                    libelleEntite === "Client"
                      ? produit.prix_vente_ht
                      : produit.prix_achat_ht
                  )
                : l.prix_ht,
              taux_tva: produit ? String(produit.taux_tva) : l.taux_tva,
            }
          : l
      )
    );
  };

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <label className="etiquette mb-0">Lignes du document</label>
        <button
          type="button"
          className="text-sm font-medium text-blue-700 hover:underline"
          onClick={() => onLignes([...lignes, ligneVide(tauxTvaDisponibles[tauxTvaDisponibles.length - 1] ?? 19)])}
        >
          + Ajouter une ligne
        </button>
      </div>

      <div className="space-y-3">
        {lignes.map((ligne, index) => (
          <div
            key={index}
            className="grid grid-cols-12 gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3"
          >
            <div className="col-span-12 md:col-span-3">
              <label className="text-xs font-medium text-slate-500">Produit</label>
              <select
                className="champ-saisie mt-1"
                value={ligne.produit_id}
                onChange={(e) => majProduit(index, e.target.value)}
              >
                <option value="">— Ligne libre —</option>
                {produits.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nom}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-span-12 md:col-span-3">
              <label className="text-xs font-medium text-slate-500">Description</label>
              <input
                className="champ-saisie mt-1"
                value={ligne.description}
                onChange={(e) => majLigne(index, "description", e.target.value)}
                placeholder="Désignation"
              />
            </div>
            <div className="col-span-6 md:col-span-2">
              <label className="text-xs font-medium text-slate-500">Quantité</label>
              <input
                type="number"
                min="0.001"
                step="0.001"
                className="champ-saisie mt-1"
                value={ligne.quantite}
                onChange={(e) => majLigne(index, "quantite", e.target.value)}
              />
            </div>
            <div className="col-span-6 md:col-span-2">
              <label className="text-xs font-medium text-slate-500">Prix HT</label>
              <input
                type="number"
                min="0"
                step="0.001"
                className="champ-saisie mt-1"
                value={ligne.prix_ht}
                onChange={(e) => majLigne(index, "prix_ht", e.target.value)}
              />
            </div>
            <div className="col-span-8 md:col-span-1">
              <label className="text-xs font-medium text-slate-500">TVA %</label>
              <select
                className="champ-saisie mt-1"
                value={ligne.taux_tva}
                onChange={(e) => majLigne(index, "taux_tva", e.target.value)}
              >
                {tauxTvaDisponibles.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-span-4 flex items-end justify-end md:col-span-1">
              <button
                type="button"
                aria-label="Supprimer la ligne"
                className="mb-1 rounded-md p-1.5 text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                onClick={() =>
                  onLignes(
                    lignes.length > 1
                      ? lignes.filter((_, i) => i !== index)
                      : [ligneVide()]
                  )
                }
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M3 6h18M8 6V4h8v2m-9 0 1 14h8l1-14" />
                </svg>
              </button>
            </div>
            <div className="col-span-12 text-right text-xs font-medium text-slate-500">
              Sous-total HT :{" "}
              <span className="text-slate-800">
                {formatTND(
                  (Number(ligne.quantite) || 0) * (Number(ligne.prix_ht) || 0)
                )}{" "}
                TND
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 flex justify-end">
        <dl className="w-full max-w-xs space-y-1.5 text-sm">
          <div className="flex justify-between">
            <dt className="text-slate-500">Sous-total HT</dt>
            <dd className="font-medium">{formatTND(totaux.ht)} TND</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-slate-500">Total TVA</dt>
            <dd className="font-medium">{formatTND(totaux.tva)} TND</dd>
          </div>
          <div className="flex justify-between border-t border-slate-200 pt-1.5 text-base font-bold text-slate-900">
            <dt>Total TTC</dt>
            <dd>{formatTND(totaux.ttc)} TND</dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
