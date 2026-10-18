"use client";

import { useState, useActionState } from "react";
import { creerMouvement, type EtatMouvement } from "@/app/(app)/stock/actions";
import { Alerte } from "@/components/ui/carte";
import type { Produit } from "@/lib/types";

const etatInitial: EtatMouvement = {};

export function FormulaireMouvement({ produits }: { produits: Produit[] }) {
  const [etat, action, enCours] = useActionState(creerMouvement, etatInitial);
  const [type, setType] = useState("entree");

  return (
    <form action={action} className="space-y-4">
      {etat.erreur ? <Alerte ton="danger">{etat.erreur}</Alerte> : null}
      {etat.succes ? <Alerte ton="succes">Mouvement enregistré et stock mis à jour.</Alerte> : null}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="md:col-span-2">
          <label className="etiquette" htmlFor="produit_id">Produit *</label>
          <select id="produit_id" name="produit_id" required className="champ-saisie" defaultValue="">
            <option value="" disabled>
              Sélectionner un produit…
            </option>
            {produits.map((produit) => (
              <option key={produit.id} value={produit.id}>
                {produit.nom} (stock : {produit.quantite} {produit.unite})
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="etiquette" htmlFor="type">Type de mouvement *</label>
          <select
            id="type"
            name="type"
            className="champ-saisie"
            value={type}
            onChange={(e) => setType(e.target.value)}
          >
            <option value="entree">Entrée (augmente le stock)</option>
            <option value="sortie">Sortie (diminue le stock)</option>
          </select>
        </div>
        <div>
          <label className="etiquette" htmlFor="quantite">Quantité *</label>
          <input id="quantite" name="quantite" type="number" step="0.001" min="0.001" required className="champ-saisie" defaultValue={1} />
        </div>
        <div>
          <label className="etiquette" htmlFor="motif">Motif</label>
          <select id="motif" name="motif" className="champ-saisie" defaultValue="ajustement">
            <option value="ajustement">Ajustement manuel</option>
            <option value="inventaire">Inventaire</option>
            <option value="retour">Retour</option>
            {type === "entree" ? <option value="achat">Achat</option> : null}
            {type === "sortie" ? <option value="vente">Vente</option> : null}
          </select>
        </div>
        <div>
          <label className="etiquette" htmlFor="doc_reference">Référence document</label>
          <input id="doc_reference" name="doc_reference" className="champ-saisie" placeholder="FAC-2026-0001…" />
        </div>
        <div className="md:col-span-2">
          <label className="etiquette" htmlFor="notes">Notes</label>
          <textarea id="notes" name="notes" rows={2} className="champ-saisie" />
        </div>
      </div>

      <div className="flex justify-end">
        <button type="submit" disabled={enCours} className="btn-primaire">
          {enCours ? "Enregistrement…" : "Enregistrer le mouvement"}
        </button>
      </div>
    </form>
  );
}
