"use client";

import { useTransition } from "react";
import Link from "next/link";
import {
  changerStatutBulletin,
  genererBulletins,
  supprimerBulletin,
} from "@/app/(app)/paie/actions";

export function BarreActionsPaie({
  periode,
}: {
  periode: string;
}) {
  const [enCours, startTransition] = useTransition();

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        className="btn-primaire"
        disabled={enCours}
        onClick={() => startTransition(() => { void genererBulletins(periode); })}
      >
        {enCours ? "Génération…" : `Générer les bulletins de ${periode}`}
      </button>
      <Link href={`/api/pdf/paie/${periode}`} target="_blank" className="btn-secondaire">
        Export PDF de la période
      </Link>
    </div>
  );
}

export function ActionsBulletin({
  id,
  statut,
}: {
  id: string;
  statut: string;
}) {
  const [enCours, startTransition] = useTransition();

  return (
    <div className="flex items-center justify-end gap-2">
      <Link href={`/paie/${id}`} className="text-sm font-medium text-blue-700 hover:underline">
        Détail
      </Link>
      {statut === "brouillon" ? (
        <>
          <button
            type="button"
            className="text-sm font-medium text-emerald-700 hover:underline"
            disabled={enCours}
            onClick={() => startTransition(() => { void changerStatutBulletin(id, "valide"); })}
          >
            Valider
          </button>
          <button
            type="button"
            className="text-sm font-medium text-red-600 hover:underline"
            disabled={enCours}
            onClick={() => {
              if (confirm("Supprimer ce bulletin ?")) {
                startTransition(() => supprimerBulletin(id));
              }
            }}
          >
            Supprimer
          </button>
        </>
      ) : null}
      {statut === "valide" ? (
        <button
          type="button"
          className="text-sm font-medium text-emerald-700 hover:underline"
          disabled={enCours}
            onClick={() => startTransition(() => { void changerStatutBulletin(id, "paye"); })}
        >
          Marquer payé
        </button>
      ) : null}
    </div>
  );
}
