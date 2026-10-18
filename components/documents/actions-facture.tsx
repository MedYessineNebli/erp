"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition, useState } from "react";
import {
  annulerFacture,
  emettreFacture,
  enregistrerPaiement,
  marquerFacturePayee,
  supprimerFacture,
} from "@/app/(app)/factures/actions";
import { Modal } from "@/components/ui/modal";

export function BarreActionsFacture({
  id,
  statut,
  montantPaye,
  totalTtc,
  enModification,
}: {
  id: string;
  statut: string;
  montantPaye: number;
  totalTtc: number;
  enModification: boolean;
}) {
  const router = useRouter();
  const [enCours, startTransition] = useTransition();
  const [erreur, setErreur] = useState<string | null>(null);
  const [modalPaiement, setModalPaiement] = useState(false);
  const [montantSaisi, setMontantSaisi] = useState("");

  const reste = totalTtc - montantPaye;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {enModification ? (
        <Link href={`/factures/${id}`} className="btn-secondaire">
          Annuler la modification
        </Link>
      ) : statut === "brouillon" ? (
        <Link href={`/factures/${id}?modifier=1`} className="btn-secondaire">
          Modifier
        </Link>
      ) : null}

      {statut === "brouillon" ? (
        <button
          type="button"
          className="btn-primaire"
          disabled={enCours}
          onClick={() =>
            startTransition(async () => {
              const resultat = await emettreFacture(id);
              if (resultat.erreur) setErreur(resultat.erreur);
            })
          }
        >
          Émettre la facture (décrémente le stock)
        </button>
      ) : null}

      {statut === "emise" || statut === "en_retard" ? (
        <>
          {reste > 0 ? (
            <button type="button" className="btn-secondaire" onClick={() => setModalPaiement(true)}>
              Enregistrer un paiement
            </button>
          ) : null}
          <button
            type="button"
            className="btn-primaire"
            disabled={enCours}
            onClick={() => startTransition(() => marquerFacturePayee(id))}
          >
            Marquer payée
          </button>
        </>
      ) : null}

      {statut === "emise" || statut === "en_retard" || statut === "payee" ? (
        <button
          type="button"
          className="btn-danger"
          disabled={enCours}
          onClick={() => {
            if (confirm("Annuler cette facture ?")) {
              startTransition(() => annulerFacture(id));
            }
          }}
        >
          Annuler la facture
        </button>
      ) : null}

      {statut === "brouillon" ? (
        <button
          type="button"
          className="btn-danger"
          disabled={enCours}
          onClick={() => {
            if (confirm("Supprimer définitivement cette facture ?")) {
              startTransition(() => supprimerFacture(id).then(() => router.push("/factures")));
            }
          }}
        >
          Supprimer
        </button>
      ) : null}

      {erreur ? (
        <p className="w-full text-sm font-medium text-red-600">{erreur}</p>
      ) : null}

      <Modal ouvert={modalPaiement} onFermer={() => setModalPaiement(false)} titre="Enregistrer un paiement">
        <label className="etiquette" htmlFor="montant">Montant reçu (TND)</label>
        <input
          id="montant"
          type="number"
          step="0.001"
          min="0.001"
          max={reste}
          className="champ-saisie"
          value={montantSaisi}
          onChange={(e) => setMontantSaisi(e.target.value)}
          placeholder={String(reste)}
        />
        <p className="mt-1 text-xs text-slate-500">Reste à payer : {reste.toFixed(3)} TND</p>
        <div className="mt-5 flex justify-end gap-2">
          <button type="button" className="btn-secondaire" onClick={() => setModalPaiement(false)}>
            Annuler
          </button>
          <button
            type="button"
            className="btn-primaire"
            onClick={() => {
              const montant = Number(montantSaisi);
              setModalPaiement(false);
              setMontantSaisi("");
              startTransition(async () => {
                const resultat = await enregistrerPaiement(id, montant);
                if (resultat.erreur) setErreur(resultat.erreur);
              });
            }}
          >
            Enregistrer
          </button>
        </div>
      </Modal>
    </div>
  );
}
