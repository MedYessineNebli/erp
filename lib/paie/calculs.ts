import { arrondir3 } from "@/lib/documents";
import type { ParametresSociete, TrancheIBS } from "@/lib/types";

export type EntreePaie = {
  salaire_base: number;
  primes: number;
  retenues_absences: number;
  heures_sup: number;
  nb_enfants: number;
};

export type ResultatPaie = {
  salaire_brut: number;
  montant_cnss: number;
  montant_amo: number;
  base_imposable: number;
  abattement: number;
  net_imposable_annuel: number;
  montant_ir: number;
  net_a_payer: number;
  cotisations_employeur: number;
  cout_employeur: number;
  details: {
    bruts: { libelle: string; montant: number }[];
    retenues: { libelle: string; montant: number; taux?: number }[];
  };
};

export function calculerIBS(
  netImposableAnnuel: number,
  bareme: TrancheIBS[]
): number {
  if (netImposableAnnuel <= 0 || bareme.length === 0) return 0;

  const tranches = [...bareme].sort(
    (a, b) => (a.plafond ?? Infinity) - (b.plafond ?? Infinity)
  );

  for (const tranche of tranches) {
    const plafond = tranche.plafond ?? Infinity;
    if (netImposableAnnuel <= plafond) {
      const montant =
        (netImposableAnnuel * tranche.taux) / 100 - tranche.deduction;
      return arrondir3(Math.max(0, montant));
    }
  }

  const derniere = tranches[tranches.length - 1];
  return arrondir3(
    Math.max(0, (netImposableAnnuel * derniere.taux) / 100 - derniere.deduction)
  );
}

export function calculerPaie(
  entree: EntreePaie,
  p: ParametresSociete
): ResultatPaie {
  const heuresSupRemunerees =
    entree.heures_sup * (p.majoration_heures_sup ?? 1.5);

  const salaireBrut = arrondir3(
    entree.salaire_base + entree.primes + heuresSupRemunerees - entree.retenues_absences
  );

  const assietteCnss = Math.min(salaireBrut, p.plafond_cnss);
  const montantCnss = arrondir3((assietteCnss * p.taux_cnss_salarie) / 100);

  const assietteAmo = Math.min(salaireBrut, p.plafond_amo);
  const montantAmo = arrondir3((assietteAmo * p.taux_amo_salarie) / 100);

  const abattement = p.abattement_mensuel;
  const abattementEnfants = entree.nb_enfants * 10;

  const netImposableMensuel = Math.max(
    0,
    salaireBrut - montantCnss - montantAmo - abattement - abattementEnfants
  );
  const netImposableAnnuel = netImposableMensuel * 12;

  const irAnnuel = calculerIBS(netImposableAnnuel, p.bareme_ibs);
  const montantIr = arrondir3(irAnnuel / 12);

  const netAPayer = arrondir3(salaireBrut - montantCnss - montantAmo - montantIr);

  const cotisationsEmployeur = arrondir3(
    (Math.min(salaireBrut, p.plafond_cnss) * p.taux_cnss_employeur) / 100 +
      (Math.min(salaireBrut, p.plafond_amo) * p.taux_amo_employeur) / 100 +
      entree.nb_enfants * p.allocation_familiale
  );
  const coutEmployeur = arrondir3(salaireBrut + cotisationsEmployeur);

  const details = {
    bruts: [
      { libelle: "Salaire de base", montant: entree.salaire_base },
      ...(entree.primes > 0
        ? [{ libelle: "Primes et indemnités", montant: entree.primes }]
        : []),
      ...(entree.heures_sup > 0
        ? [
            {
              libelle: `Heures supplémentaires (×${p.majoration_heures_sup})`,
              montant: heuresSupRemunerees,
            },
          ]
        : []),
      ...(entree.retenues_absences > 0
        ? [
            {
              libelle: "Retenue absences",
              montant: -arrondir3(entree.retenues_absences),
            },
          ]
        : []),
    ],
    retenues: [
      {
        libelle: `CNSS (ouvrière ${p.taux_cnss_salarie} %)`,
        montant: montantCnss,
        taux: p.taux_cnss_salarie,
      },
      {
        libelle: `AMO (ouvrière ${p.taux_amo_salarie} %)`,
        montant: montantAmo,
        taux: p.taux_amo_salarie,
      },
      {
        libelle: "Impôt sur le revenu (IBS)",
        montant: montantIr,
      },
    ],
  };

  return {
    salaire_brut: salaireBrut,
    montant_cnss: montantCnss,
    montant_amo: montantAmo,
    base_imposable: arrondir3(netImposableMensuel),
    abattement: arrondir3(abattement + abattementEnfants),
    net_imposable_annuel: arrondir3(netImposableAnnuel),
    montant_ir: montantIr,
    net_a_payer: netAPayer,
    cotisations_employeur: cotisationsEmployeur,
    cout_employeur: coutEmployeur,
    details,
  };
}
