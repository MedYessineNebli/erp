"use client";

import { useState, useTransition } from "react";
import { Modal } from "@/components/ui/modal";
import { Badge } from "@/components/ui/badge";
import { EtatVide, Alerte } from "@/components/ui/carte";
import { FormulaireEmploye } from "@/components/rh/formulaire-employe";
import { supprimerEmploye } from "@/app/(app)/employes/actions";
import { formatDate, formatTND } from "@/lib/formatage";
import type { Employe } from "@/lib/types";

export function TableauEmployes({ employes }: { employes: Employe[] }) {
  const [enCreation, setEnCreation] = useState(false);
  const [enEdition, setEnEdition] = useState<Employe | null>(null);
  const [aSupprimer, setASupprimer] = useState<Employe | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  return (
    <div className="space-y-4">
      {erreur ? <Alerte ton="danger">{erreur}</Alerte> : null}

      <div className="flex justify-end">
        <button type="button" className="btn-primaire" onClick={() => setEnCreation(true)}>
          + Nouvel employé
        </button>
      </div>

      {employes.length > 0 ? (
        <div className="carte overflow-x-auto">
          <table className="tableau">
            <thead>
              <tr>
                <th>Nom</th>
                <th>Poste</th>
                <th>Embauche</th>
                <th className="text-right">Salaire brut</th>
                <th className="text-right">Enfants</th>
                <th>État</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {employes.map((employe) => (
                <tr key={employe.id}>
                  <td className="font-medium text-slate-900">
                    {employe.nom.toUpperCase()} {employe.prenom}
                  </td>
                  <td>{employe.poste ?? "—"}</td>
                  <td>{formatDate(employe.date_embauche)}</td>
                  <td className="text-right">{formatTND(employe.salaire_base_brut)}</td>
                  <td className="text-right">{employe.nb_enfants}</td>
                  <td>
                    {employe.actif ? (
                      <Badge ton="succes">Actif</Badge>
                    ) : (
                      <Badge ton="neutre">Inactif</Badge>
                    )}
                  </td>
                  <td className="text-right">
                    <button
                      type="button"
                      className="mr-3 text-sm font-medium text-blue-700 hover:underline"
                      onClick={() => setEnEdition(employe)}
                    >
                      Modifier
                    </button>
                    <button
                      type="button"
                      className="text-sm font-medium text-red-600 hover:underline"
                      onClick={() => setASupprimer(employe)}
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
          titre="Aucun employé"
          message="Ajoutez vos employés pour gérer les pointages et la paie."
          action={
            <button type="button" className="btn-primaire" onClick={() => setEnCreation(true)}>
              Ajouter un employé
            </button>
          }
        />
      )}

      <Modal ouvert={enCreation} onFermer={() => setEnCreation(false)} titre="Nouvel employé" large>
        <FormulaireEmploye />
      </Modal>

      <Modal ouvert={enEdition !== null} onFermer={() => setEnEdition(null)} titre="Modifier l'employé" large>
        {enEdition ? <FormulaireEmploye employe={enEdition} /> : null}
      </Modal>

      <Modal ouvert={aSupprimer !== null} onFermer={() => setASupprimer(null)} titre="Supprimer l'employé">
        <p className="text-sm text-slate-600">
          Voulez-vous vraiment supprimer{" "}
          <strong>
            {aSupprimer?.nom.toUpperCase()} {aSupprimer?.prenom}
          </strong>{" "}
          ?
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <button type="button" className="btn-secondaire" onClick={() => setASupprimer(null)}>
            Annuler
          </button>
          <button
            type="button"
            className="btn-danger"
            onClick={() => {
              const employe = aSupprimer;
              setASupprimer(null);
              if (employe) {
                startTransition(async () => {
                  const resultat = await supprimerEmploye(employe.id);
                  setErreur(resultat.erreur ?? null);
                });
              }
            }}
          >
            Supprimer
          </button>
        </div>
      </Modal>
    </div>
  );
}
