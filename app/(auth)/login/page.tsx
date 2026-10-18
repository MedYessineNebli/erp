"use client";

import { useActionState } from "react";
import { connexion, type EtatConnexion } from "../actions";

const etatInitial: EtatConnexion = {};

export default function PageConnexion() {
  const [etat, action, enCours] = useActionState(connexion, etatInitial);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 p-4">
      <div className="carte w-full max-w-md p-8">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-700 text-lg font-bold text-white">
            E
          </div>
          <h1 className="text-xl font-bold text-slate-900">
            Connexion à l&apos;ERP
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Gestion de stock, devis, factures et paie
          </p>
        </div>

        <form action={action} className="space-y-4">
          <div>
            <label htmlFor="email" className="etiquette">
              Adresse email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              placeholder="vous@exemple.tn"
              className="champ-saisie"
              disabled={enCours}
            />
          </div>
          <div>
            <label htmlFor="mot_de_passe" className="etiquette">
              Mot de passe
            </label>
            <input
              id="mot_de_passe"
              name="mot_de_passe"
              type="password"
              required
              autoComplete="current-password"
              placeholder="••••••••"
              className="champ-saisie"
              disabled={enCours}
            />
          </div>

          {etat.erreur ? (
            <div
              className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800"
              role="alert"
            >
              {etat.erreur}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={enCours}
            className="btn-primaire w-full"
          >
            {enCours ? "Connexion en cours…" : "Se connecter"}
          </button>
        </form>
      </div>
    </div>
  );
}
