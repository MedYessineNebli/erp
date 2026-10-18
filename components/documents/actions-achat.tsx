"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition, useState } from "react";
import {
  marquerAchatPaye,
  recevoirAchat,
  supprimerAchat,
} from "@/app/(app)/achats/actions";

export function BarreActionsAchat({
  id,
  statut,
  enModification,
}: {
  id: string;
  statut: string;
  enModification: boolean;
}) {
  const router = useRouter();
  const [enCours, startTransition] = useTransition();
  const [erreur, setErreur] = useState<string | null>(null);

  return (
    <div className="flex flex-wrap items-center gap-2">
      {enModification ? (
        <Link href={`/achats/${id}`} className="btn-secondaire">
          Annuler la modification
        </Link>
      ) : statut === "brouillon" ? (
        <Link href={`/achats/${id}?modifier=1`} className="btn-secondaire">
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
              const resultat = await recevoirAchat(id);
              if (resultat.erreur) setErreur(resultat.erreur);
            })
          }
        >
          Réceptionner (incrémente le stock)
        </button>
      ) : null}

      {statut === "recue" ? (
        <button
          type="button"
          className="btn-primaire"
          disabled={enCours}
          onClick={() => startTransition(() => marquerAchatPaye(id))}
        >
          Marquer payé
        </button>
      ) : null}

      {statut === "brouillon" ? (
        <button
          type="button"
          className="btn-danger"
          disabled={enCours}
          onClick={() => {
            if (confirm("Supprimer définitivement cet achat ?")) {
              startTransition(() => supprimerAchat(id).then(() => router.push("/achats")));
            }
          }}
        >
          Supprimer
        </button>
      ) : null}

      {erreur ? (
        <p className="w-full text-sm font-medium text-red-600">{erreur}</p>
      ) : null}
    </div>
  );
}
