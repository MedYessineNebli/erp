"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import Link from "next/link";
import {
  changerStatutDevis,
  convertirEnFacture,
  supprimerDevis,
} from "@/app/(app)/devis/actions";

export function BarreActionsDevis({
  id,
  statut,
  factureId,
  enModification,
}: {
  id: string;
  statut: string;
  factureId: string | null;
  enModification: boolean;
}) {
  const router = useRouter();
  const [enCours, startTransition] = useTransition();

  const majStatut = (nouveau: "brouillon" | "envoye" | "accepte" | "refuse") => {
    startTransition(async () => {
      await changerStatutDevis(id, nouveau);
    });
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      {enModification ? (
        <Link href={`/devis/${id}`} className="btn-secondaire">
          Annuler la modification
        </Link>
      ) : (
        statut !== "accepte" && !factureId ? (
          <Link href={`/devis/${id}?modifier=1`} className="btn-secondaire">
            Modifier
          </Link>
        ) : null
      )}

      {statut === "brouillon" ? (
        <button type="button" className="btn-secondaire" disabled={enCours} onClick={() => majStatut("envoye")}>
          Marquer comme envoyé
        </button>
      ) : null}

      {statut === "envoye" ? (
        <>
          <button type="button" className="btn-primaire" disabled={enCours} onClick={() => majStatut("accepte")}>
            Marquer accepté
          </button>
          <button type="button" className="btn-danger" disabled={enCours} onClick={() => majStatut("refuse")}>
            Marquer refusé
          </button>
        </>
      ) : null}

      {statut === "refuse" || statut === "accepte" ? (
        <button type="button" className="btn-secondaire" disabled={enCours} onClick={() => majStatut("brouillon")}>
          Reprendre en brouillon
        </button>
      ) : null}

      {statut === "accepte" && !factureId ? (
        <button
          type="button"
          className="btn-primaire"
          disabled={enCours}
          onClick={() => startTransition(() => convertirEnFacture(id).then(() => router.push("/factures")))}
        >
          Convertir en facture
        </button>
      ) : null}

      {factureId ? (
        <Link href={`/factures/${factureId}`} className="btn-primaire">
          Voir la facture
        </Link>
      ) : null}

      {statut === "brouillon" && !factureId ? (
        <button
          type="button"
          className="btn-danger"
          disabled={enCours}
          onClick={() => {
            if (confirm("Supprimer définitivement ce devis ?")) {
              startTransition(() => supprimerDevis(id).then(() => router.push("/devis")));
            }
          }}
        >
          Supprimer
        </button>
      ) : null}
    </div>
  );
}
