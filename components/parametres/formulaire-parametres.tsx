"use client";

import { useState, useActionState } from "react";
import { enregistrerParametres, type EtatParametres } from "@/app/(app)/parametres/actions";
import { Alerte } from "@/components/ui/carte";
import type { ParametresSociete, TrancheIBS } from "@/lib/types";

const etatInitial: EtatParametres = {};

export function FormulaireParametres({
  parametres,
}: {
  parametres: ParametresSociete;
}) {
  const [etat, action, enCours] = useActionState(
    enregistrerParametres,
    etatInitial
  );

  const [tauxTva, setTauxTva] = useState<string>(
    parametres.taux_tva_disponibles.join(", ")
  );
  const [tranches, setTranches] = useState<TrancheIBS[]>(
    parametres.bareme_ibs.length > 0
      ? parametres.bareme_ibs
      : [
          { plafond: 5000, taux: 0, deduction: 0 },
          { plafond: 20000, taux: 26, deduction: 1300 },
          { plafond: 30000, taux: 28, deduction: 1700 },
          { plafond: 50000, taux: 30, deduction: 2300 },
          { plafond: null, taux: 34, deduction: 4300 },
        ]
  );

  const majTranche = (
    index: number,
    champ: keyof TrancheIBS,
    valeur: string
  ) => {
    setTranches((prec) =>
      prec.map((t, i) =>
        i === index
          ? {
              ...t,
              [champ]:
                champ === "plafond"
                  ? valeur === ""
                    ? null
                    : Number(valeur)
                  : Number(valeur) || 0,
            }
          : t
      )
    );
  };

  return (
    <form action={action} className="space-y-6">
      {etat.erreur ? <Alerte ton="danger">{etat.erreur}</Alerte> : null}
      {etat.succes ? (
        <Alerte ton="succes">Paramètres enregistrés avec succès.</Alerte>
      ) : null}

      <Section titre="Identité de la société">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Champ label="Nom de la société *" name="nom_societe" defaultValue={parametres.nom_societe} required />
          <Champ label="Raison sociale" name="raison_sociale" defaultValue={parametres.raison_sociale ?? ""} />
          <Champ label="Adresse" name="adresse" defaultValue={parametres.adresse ?? ""} />
          <Champ label="Ville" name="ville" defaultValue={parametres.ville ?? ""} />
          <Champ label="Code postal" name="code_postal" defaultValue={parametres.code_postal ?? ""} />
          <Champ label="Téléphone" name="telephone" defaultValue={parametres.telephone ?? ""} />
          <Champ label="Email" name="email" type="email" defaultValue={parametres.email ?? ""} />
          <Champ label="Site web" name="site_web" defaultValue={parametres.site_web ?? ""} />
          <Champ label="ICE" name="ice" defaultValue={parametres.ice ?? ""} />
          <Champ label="Matricule fiscal" name="matricule_fiscal" defaultValue={parametres.matricule_fiscal ?? ""} />
          <Champ label="N° TVA (NR_ART)" name="numero_tva" defaultValue={parametres.numero_tva ?? ""} />
          <Champ label="Capital (TND)" name="capital" type="number" step="0.001" defaultValue={parametres.capital} />
          <Champ label="RIB" name="rib" defaultValue={parametres.rib ?? ""} />
          <Champ label="Banque" name="banque" defaultValue={parametres.banque ?? ""} />
        </div>
      </Section>

      <Section titre="TVA">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="etiquette">Taux disponibles (séparés par des virgules)</label>
            <input
              name="taux_tva_disponibles"
              className="champ-saisie"
              value={tauxTva}
              onChange={(e) => setTauxTva(e.target.value)}
              placeholder="0, 7, 13, 19"
            />
            <p className="mt-1 text-xs text-slate-500">
              Exemple tunisien : 0, 7, 13, 19
            </p>
          </div>
          <Champ
            label="Taux par défaut (%)"
            name="taux_tva_defaut"
            type="number"
            step="0.01"
            defaultValue={parametres.taux_tva_defaut}
          />
        </div>
      </Section>

      <Section titre="Cotisations sociales — CNSS">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Champ label="Taux salarié (%)" name="taux_cnss_salarie" type="number" step="0.0001" defaultValue={parametres.taux_cnss_salarie} />
          <Champ label="Taux employeur (%)" name="taux_cnss_employeur" type="number" step="0.0001" defaultValue={parametres.taux_cnss_employeur} />
          <Champ label="Plafond mensuel (TND)" name="plafond_cnss" type="number" step="0.001" defaultValue={parametres.plafond_cnss} />
        </div>
      </Section>

      <Section titre="Cotisations sociales — AMO">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Champ label="Taux salarié (%)" name="taux_amo_salarie" type="number" step="0.0001" defaultValue={parametres.taux_amo_salarie} />
          <Champ label="Taux employeur (%)" name="taux_amo_employeur" type="number" step="0.0001" defaultValue={parametres.taux_amo_employeur} />
          <Champ label="Plafond mensuel (TND)" name="plafond_amo" type="number" step="0.001" defaultValue={parametres.plafond_amo} />
        </div>
      </Section>

      <Section titre="Barème IBS (impôt sur le revenu des salaires — annuel)">
        <input type="hidden" name="bareme_ibs" value={JSON.stringify(tranches)} />
        <div className="overflow-x-auto">
          <table className="tableau">
            <thead>
              <tr>
                <th>Plafond annuel (TND) — vide = sans limite</th>
                <th>Taux (%)</th>
                <th>Déduction (TND)</th>
              </tr>
            </thead>
            <tbody>
              {tranches.map((tranche, index) => (
                <tr key={index}>
                  <td>
                    <input
                      type="number"
                      className="champ-saisie"
                      value={tranche.plafond ?? ""}
                      onChange={(e) => majTranche(index, "plafond", e.target.value)}
                      placeholder="∞"
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      step="0.01"
                      className="champ-saisie"
                      value={tranche.taux}
                      onChange={(e) => majTranche(index, "taux", e.target.value)}
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      step="0.01"
                      className="champ-saisie"
                      value={tranche.deduction}
                      onChange={(e) => majTranche(index, "deduction", e.target.value)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <button
          type="button"
          className="btn-secondaire mt-3"
          onClick={() =>
            setTranches((prec) => [...prec, { plafond: null, taux: 0, deduction: 0 }])
          }
        >
          Ajouter une tranche
        </button>
      </Section>

      <Section titre="Autres paramètres de paie">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Champ label="Abattement mensuel (TND)" name="abattement_mensuel" type="number" step="0.001" defaultValue={parametres.abattement_mensuel} />
          <Champ label="Allocation familiale / enfant (TND)" name="allocation_familiale" type="number" step="0.001" defaultValue={parametres.allocation_familiale} />
          <Champ label="Majoration heures sup." name="majoration_heures_sup" type="number" step="0.01" defaultValue={parametres.majoration_heures_sup} />
          <Champ label="Jours de base mensuel" name="jours_base_mensuel" type="number" step="1" defaultValue={parametres.jours_base_mensuel} />
        </div>
      </Section>

      <div className="flex justify-end">
        <button type="submit" disabled={enCours} className="btn-primaire">
          {enCours ? "Enregistrement…" : "Enregistrer les paramètres"}
        </button>
      </div>
    </form>
  );
}

function Section({
  titre,
  children,
}: {
  titre: string;
  children: React.ReactNode;
}) {
  return (
    <section className="carte p-5">
      <h2 className="mb-4 text-base font-semibold text-slate-900">{titre}</h2>
      {children}
    </section>
  );
}

function Champ({
  label,
  name,
  type = "text",
  step,
  defaultValue,
  required,
}: {
  label: string;
  name: string;
  type?: string;
  step?: string;
  defaultValue: string | number;
  required?: boolean;
}) {
  return (
    <div>
      <label className="etiquette" htmlFor={name}>
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        step={step}
        defaultValue={defaultValue}
        required={required}
        className="champ-saisie"
      />
    </div>
  );
}
