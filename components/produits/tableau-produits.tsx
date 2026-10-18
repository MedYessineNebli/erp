"use client";

import { useMemo, useState, useTransition } from "react";
import { Modal } from "@/components/ui/modal";
import { Badge } from "@/components/ui/badge";
import { EtatVide } from "@/components/ui/carte";
import { FormulaireProduit } from "./formulaire-produit";
import { supprimerProduit } from "@/app/(app)/produits/actions";
import { formatNombre, formatTND } from "@/lib/formatage";
import type { Produit } from "@/lib/types";

export function TableauProduits({
  produits,
  tauxTva,
}: {
  produits: Produit[];
  tauxTva: number[];
}) {
  const [recherche, setRecherche] = useState("");
  const [enCreation, setEnCreation] = useState(false);
  const [enEdition, setEnEdition] = useState<Produit | null>(null);
  const [aSupprimer, setASupprimer] = useState<Produit | null>(null);
  const [, startTransition] = useTransition();

  const filtres = useMemo(() => {
    const q = recherche.trim().toLowerCase();
    if (!q) return produits;
    return produits.filter(
      (p) =>
        p.nom.toLowerCase().includes(q) ||
        (p.reference ?? "").toLowerCase().includes(q)
    );
  }, [produits, recherche]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <input
          type="search"
          placeholder="Rechercher un produit (nom, référence)…"
          className="champ-saisie max-w-sm"
          value={recherche}
          onChange={(e) => setRecherche(e.target.value)}
        />
        <button type="button" className="btn-primaire" onClick={() => setEnCreation(true)}>
          + Nouveau produit
        </button>
      </div>

      {filtres.length > 0 ? (
        <div className="carte overflow-x-auto">
          <table className="tableau">
            <thead>
              <tr>
                <th>Nom</th>
                <th>Référence</th>
                <th className="text-right">Prix achat HT</th>
                <th className="text-right">Prix vente HT</th>
                <th className="text-right">Stock</th>
                <th>TVA</th>
                <th>État</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtres.map((produit) => (
                <tr key={produit.id}>
                  <td className="font-medium text-slate-900">{produit.nom}</td>
                  <td>{produit.reference ?? "—"}</td>
                  <td className="text-right">{formatTND(produit.prix_achat_ht)}</td>
                  <td className="text-right">{formatTND(produit.prix_vente_ht)}</td>
                  <td className="text-right">
                    <span
                      className={
                        produit.quantite <= produit.quantite_min
                          ? "font-semibold text-amber-700"
                          : ""
                      }
                    >
                      {formatNombre(produit.quantite)} {produit.unite}
                    </span>
                  </td>
                  <td>{produit.taux_tva} %</td>
                  <td>
                    {produit.actif ? (
                      <Badge ton="succes">Actif</Badge>
                    ) : (
                      <Badge ton="neutre">Inactif</Badge>
                    )}
                  </td>
                  <td className="text-right">
                    <button
                      type="button"
                      className="mr-3 text-sm font-medium text-blue-700 hover:underline"
                      onClick={() => setEnEdition(produit)}
                    >
                      Modifier
                    </button>
                    <button
                      type="button"
                      className="text-sm font-medium text-red-600 hover:underline"
                      onClick={() => setASupprimer(produit)}
                    >
                      Supprimer
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EtatVide
          titre="Aucun produit"
          message="Aucun produit ne correspond à votre recherche, ou aucun produit n'a encore été créé."
          action={
            <button type="button" className="btn-primaire" onClick={() => setEnCreation(true)}>
              Créer un produit
            </button>
          }
        />
      )}

      <Modal ouvert={enCreation} onFermer={() => setEnCreation(false)} titre="Nouveau produit" large>
        <FormulaireProduit tauxTva={tauxTva} />
      </Modal>

      <Modal
        ouvert={enEdition !== null}
        onFermer={() => setEnEdition(null)}
        titre="Modifier le produit"
        large
      >
        {enEdition ? <FormulaireProduit produit={enEdition} tauxTva={tauxTva} /> : null}
      </Modal>

      <Modal ouvert={aSupprimer !== null} onFermer={() => setASupprimer(null)} titre="Supprimer le produit">
        <p className="text-sm text-slate-600">
          Voulez-vous vraiment supprimer le produit{" "}
          <strong>{aSupprimer?.nom}</strong> ? Cette action est irréversible.
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <button type="button" className="btn-secondaire" onClick={() => setASupprimer(null)}>
            Annuler
          </button>
          <button
            type="button"
            className="btn-danger"
            onClick={() => {
              const id = aSupprimer?.id;
              setASupprimer(null);
              if (id) startTransition(() => supprimerProduit(id));
            }}
          >
            Supprimer
          </button>
        </div>
      </Modal>
    </div>
  );
}
