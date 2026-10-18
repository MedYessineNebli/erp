"use client";

import { useMemo, useState, useTransition } from "react";
import { Modal } from "@/components/ui/modal";
import { Badge } from "@/components/ui/badge";
import { EtatVide } from "@/components/ui/carte";
import { FormulaireTiers } from "./formulaire-tiers";
import { supprimerTiers, type TypeTiers } from "@/app/(app)/tiers/actions";
import type { Client } from "@/lib/types";

export function TableauTiers({
  type,
  tiers,
}: {
  type: TypeTiers;
  tiers: Client[];
}) {
  const libelle = type === "clients" ? "client" : "fournisseur";
  const [recherche, setRecherche] = useState("");
  const [enCreation, setEnCreation] = useState(false);
  const [enEdition, setEnEdition] = useState<Client | null>(null);
  const [aSupprimer, setASupprimer] = useState<Client | null>(null);
  const [, startTransition] = useTransition();

  const filtres = useMemo(() => {
    const q = recherche.trim().toLowerCase();
    if (!q) return tiers;
    return tiers.filter(
      (t) =>
        t.nom.toLowerCase().includes(q) ||
        (t.contact ?? "").toLowerCase().includes(q) ||
        (t.email ?? "").toLowerCase().includes(q) ||
        (t.ville ?? "").toLowerCase().includes(q)
    );
  }, [tiers, recherche]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <input
          type="search"
          placeholder={`Rechercher un ${libelle}…`}
          className="champ-saisie max-w-sm"
          value={recherche}
          onChange={(e) => setRecherche(e.target.value)}
        />
        <button type="button" className="btn-primaire" onClick={() => setEnCreation(true)}>
          + Nouveau {libelle}
        </button>
      </div>

      {filtres.length > 0 ? (
        <div className="carte overflow-x-auto">
          <table className="tableau">
            <thead>
              <tr>
                <th>Nom</th>
                <th>Contact</th>
                <th>Téléphone</th>
                <th>Ville</th>
                <th>ICE</th>
                <th>État</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtres.map((tiers) => (
                <tr key={tiers.id}>
                  <td className="font-medium text-slate-900">{tiers.nom}</td>
                  <td>{tiers.contact ?? "—"}</td>
                  <td>{tiers.telephone ?? "—"}</td>
                  <td>{tiers.ville ?? "—"}</td>
                  <td>{tiers.ice ?? "—"}</td>
                  <td>
                    {tiers.actif ? (
                      <Badge ton="succes">Actif</Badge>
                    ) : (
                      <Badge ton="neutre">Inactif</Badge>
                    )}
                  </td>
                  <td className="text-right">
                    <button
                      type="button"
                      className="mr-3 text-sm font-medium text-blue-700 hover:underline"
                      onClick={() => setEnEdition(tiers)}
                    >
                      Modifier
                    </button>
                    <button
                      type="button"
                      className="text-sm font-medium text-red-600 hover:underline"
                      onClick={() => setASupprimer(tiers)}
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
          titre={`Aucun ${libelle}`}
          message={`Aucun ${libelle} ne correspond à votre recherche.`}
          action={
            <button type="button" className="btn-primaire" onClick={() => setEnCreation(true)}>
              Créer un {libelle}
            </button>
          }
        />
      )}

      <Modal
        ouvert={enCreation}
        onFermer={() => setEnCreation(false)}
        titre={type === "clients" ? "Nouveau client" : "Nouveau fournisseur"}
        large
      >
        <FormulaireTiers type={type} />
      </Modal>

      <Modal
        ouvert={enEdition !== null}
        onFermer={() => setEnEdition(null)}
        titre="Modifier"
        large
      >
        {enEdition ? <FormulaireTiers type={type} tiers={enEdition} /> : null}
      </Modal>

      <Modal
        ouvert={aSupprimer !== null}
        onFermer={() => setASupprimer(null)}
        titre="Confirmer la suppression"
      >
        <p className="text-sm text-slate-600">
          Voulez-vous vraiment supprimer <strong>{aSupprimer?.nom}</strong> ?
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
              if (id) startTransition(() => supprimerTiers(type, id));
            }}
          >
            Supprimer
          </button>
        </div>
      </Modal>
    </div>
  );
}
