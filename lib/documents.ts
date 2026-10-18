import type { LigneDocument, TotauxDocument } from "@/lib/types";

export function arrondir3(valeur: number): number {
  return Math.round((valeur + Number.EPSILON) * 1000) / 1000;
}

export function calculerTotaux(lignes: LigneDocument[]): TotauxDocument {
  let sousTotalHt = 0;
  let totalTva = 0;

  for (const ligne of lignes) {
    const montantHt = arrondir3(ligne.quantite * ligne.prix_ht);
    const montantTva = arrondir3((montantHt * ligne.taux_tva) / 100);
    sousTotalHt += montantHt;
    totalTva += montantTva;
  }

  const sousTotal = arrondir3(sousTotalHt);
  const tva = arrondir3(totalTva);

  return {
    sous_total_ht: sousTotal,
    total_tva: tva,
    total_ttc: arrondir3(sousTotal + tva),
  };
}

export type LigneFormulaire = {
  description: string;
  quantite: string;
  prix_ht: string;
  taux_tva: string;
  produit_id?: string | null;
};

export function lireLignesFormulaire(formData: FormData): LigneDocument[] {
  const brut = JSON.parse(String(formData.get("lignes") ?? "[]")) as {
    description?: string;
    quantite?: string | number;
    prix_ht?: string | number;
    taux_tva?: string | number;
    produit_id?: string | null;
  }[];

  return brut
    .filter((ligne) => ligne.description?.trim())
    .map((ligne) => ({
      produit_id: ligne.produit_id || null,
      description: ligne.description!.trim(),
      quantite: Math.max(0.001, Number(ligne.quantite) || 0),
      prix_ht: Math.max(0, Number(ligne.prix_ht) || 0),
      taux_tva: Math.max(0, Number(ligne.taux_tva) || 0),
    }));
}

export function montantEnLettres(montant: number): string {
  const unitaires = [
    "",
    "un",
    "deux",
    "trois",
    "quatre",
    "cinq",
    "six",
    "sept",
    "huit",
    "neuf",
    "dix",
    "onze",
    "douze",
    "treize",
    "quatorze",
    "quinze",
    "seize",
    "dix-sept",
    "dix-huit",
    "dix-neuf",
  ];
  const dizaines = [
    "",
    "",
    "vingt",
    "trente",
    "quarante",
    "cinquante",
    "soixante",
    "soixante",
    "quatre-vingt",
    "quatre-vingt",
  ];

  function sousMille(n: number): string {
    if (n === 0) return "";
    if (n < 20) return unitaires[n];
    if (n < 100) {
      const d = Math.floor(n / 10);
      const r = n % 10;
      const base = dizaines[d];
      if (d === 7) {
        return r === 0 ? "soixante-dix" : `soixante-${unitaires[10 + r]}`;
      }
      if (d === 9) {
        return r === 0 ? "quatre-vingt-dix" : `quatre-vingt-${unitaires[10 + r]}`;
      }
      if (r === 0) return base + (d === 8 ? "s" : "");
      if (r === 1 && d !== 8) return `${base}-et-un`;
      return `${base}-${unitaires[r]}`;
    }
    const c = Math.floor(n / 100);
    const r = n % 100;
    let texte = c === 1 ? "cent" : `${unitaires[c]} cent`;
    if (c > 1 && r === 0) texte += "s";
    if (r > 0) texte += ` ${sousMille(r)}`;
    return texte;
  }

  function sousMillions(n: number): string {
    if (n === 0) return "";
    const millions = Math.floor(n / 1_000_000);
    const reste = n % 1_000_000;
    const parties: string[] = [];
    if (millions === 1) parties.push("un million");
    else if (millions > 1) parties.push(`${sousMille(millions)} millions`);
    const milliers = Math.floor(reste / 1000);
    const resteMilliers = reste % 1000;
    if (milliers === 1) parties.push("mille");
    else if (milliers > 1) parties.push(`${sousMille(milliers)} mille`);
    if (resteMilliers > 0) parties.push(sousMille(resteMilliers));
    return parties.join(" ");
  }

  const entier = Math.floor(montant);
  const decimales = Math.round((montant - entier) * 1000);

  if (entier === 0 && decimales === 0) return "zéro dinar";

  const parties: string[] = [];
  if (entier > 0) parties.push(sousMillions(entier));
  let resultat = parties.join(" ");
  if (entier > 1) resultat += " dinars";
  else if (entier === 1) resultat += " dinar";
  if (decimales > 0) {
    resultat += ` et ${sousMille(decimales)} millime${decimales > 1 ? "s" : ""}`;
  }
  return resultat.trim();
}
